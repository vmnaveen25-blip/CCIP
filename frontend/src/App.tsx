import React, { useState, useEffect } from 'react';
import { PortalRole, Complaint, ThreatFeedItem, CorrelatedNode, ModelMetric, SystemAuditLog, UserProfile } from './types';
import { apiClient } from './api/client';
import { enclaveWS } from './api/websocket';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OmniSearchModal } from './components/OmniSearchModal';
import { AuthModal, AuthScreenType } from './components/AuthModal';
import { ToastSystem, useToastManager } from './components/ui/ToastSystem';

import { LandingPage } from './views/LandingPage';
import { CitizenPortal } from './views/CitizenPortal';
import { SpecialistPortal } from './views/SpecialistPortal';
import { AIPortal } from './views/AIPortal';
import { AdminPortal } from './views/AdminPortal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MOCK_CORRELATION_NODES, MOCK_THREAT_FEEDS, INITIAL_COMPLAINTS } from './data/mockData';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { UserProfileModal } from './components/UserProfileModal';

import { Bell, X, Check, Inbox, ExternalLink } from 'lucide-react';

export const App: React.FC = () => {
  const isDemoMode = (import.meta as any).env?.VITE_DEMO_MODE === 'true';
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentPortal, setCurrentPortal] = useState<PortalRole>('landing');
  const [activeTab, setActiveTab] = useState<string>('landing-overview');
  const [complaints, setComplaints] = useState<Complaint[]>(isDemoMode ? INITIAL_COMPLAINTS : []);
  const [threatFeeds, setThreatFeeds] = useState<ThreatFeedItem[]>(isDemoMode ? MOCK_THREAT_FEEDS : []);
  const [correlationNodes, setCorrelationNodes] = useState<CorrelatedNode[]>(isDemoMode ? MOCK_CORRELATION_NODES : []);
  const [aiModels, setAiModels] = useState<ModelMetric[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(isDemoMode ? INITIAL_COMPLAINTS[0]?.id || null : null);
  const [isOmniSearchOpen, setIsOmniSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialAuthScreen, setInitialAuthScreen] = useState<AuthScreenType>('selection');
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  // Toast system (replaces single toastMessage state)
  const { toasts, push: pushToast, dismiss: dismissToast } = useToastManager();

  // Live Notifications State
  const [liveNotifications, setLiveNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Portal transition key — changing this forces page-enter animation
  const [portalKey, setPortalKey] = useState<string>(`${currentPortal}-${Date.now()}`);

  const fetchEnclaveData = async () => {
    const token = apiClient.getToken();

    if (token) {
      try {
        const liveComplaints = await apiClient.getComplaints();
        const validComplaints = (liveComplaints && (liveComplaints.length > 0 || !isDemoMode)) ? liveComplaints : (isDemoMode ? INITIAL_COMPLAINTS : []);
        setComplaints(validComplaints);
        if (validComplaints && validComplaints.length > 0) {
          setSelectedCaseId(prev => (prev && validComplaints.some(c => c.id === prev)) ? prev : validComplaints[0].id);
        } else {
          setSelectedCaseId(null);
        }
      } catch (e) {
        setComplaints(isDemoMode ? INITIAL_COMPLAINTS : []);
      }
    } else {
      setComplaints(isDemoMode ? INITIAL_COMPLAINTS : []);
    }

    const canAccessSpecialist = Boolean(token && (currentPortal === 'specialist' || currentPortal === 'admin' || currentUser?.role === 'specialist' || currentUser?.role === 'admin'));

    if (canAccessSpecialist) {
      try {
        const liveThreats = await apiClient.getThreatFeeds();
        setThreatFeeds(liveThreats && (liveThreats.length > 0 || !isDemoMode) ? liveThreats : (isDemoMode ? MOCK_THREAT_FEEDS : []));
      } catch (e) {
        setThreatFeeds(isDemoMode ? MOCK_THREAT_FEEDS : []);
      }

      try {
        const liveNodes = await apiClient.getCorrelationNodes();
        setCorrelationNodes(liveNodes && (liveNodes.length > 0 || !isDemoMode) ? liveNodes : (isDemoMode ? MOCK_CORRELATION_NODES : []));
      } catch (e) {
        setCorrelationNodes(isDemoMode ? MOCK_CORRELATION_NODES : []);
      }
    } else {
      setThreatFeeds(isDemoMode ? MOCK_THREAT_FEEDS : []);
      setCorrelationNodes(isDemoMode ? MOCK_CORRELATION_NODES : []);
    }

    try {
      const statusRes = await apiClient.getAIModelsStatus();
      if (statusRes && statusRes.models) {
        const m = statusRes.models;
        setAiModels([
          {
            id: 'mod-1',
            modelName: 'URL Phishing Detector',
            version: m.url_phishing?.version || '2.0.0-xgboost',
            task: 'Zero-Hour Domain, URL Structure & Lexical Threat Scoring',
            accuracy: m.url_phishing?.accuracy != null ? Number(m.url_phishing.accuracy) : 0,
            f1Score: m.url_phishing?.f1_score != null ? Number(m.url_phishing.f1_score) : 0,
            driftRate: 0.8,
            status: (m.url_phishing?.available ? 'READY' : 'NOT_DEPLOYED') as any,
            lastEvaluated: m.url_phishing?.loaded ? 'Loaded in RAM (Active)' : 'Ready for Lazy Load',
            latencyMs: 18,
            threshold: m.url_phishing?.threshold !== undefined ? m.url_phishing.threshold : 0.5
          },
          {
            id: 'mod-2',
            modelName: 'Complaint Classifier',
            version: m.complaint_classifier?.version || '1.1.0',
            task: 'DeBERTa-v3 18-Category Cybercrime Legal Triage & Jurisdiction',
            accuracy: m.complaint_classifier?.accuracy != null ? Number(m.complaint_classifier.accuracy) : 0,
            f1Score: m.complaint_classifier?.f1_score != null ? Number(m.complaint_classifier.f1_score) : 0,
            driftRate: 1.1,
            status: (m.complaint_classifier?.available ? 'READY' : 'NOT_DEPLOYED') as any,
            lastEvaluated: m.complaint_classifier?.loaded ? 'Loaded in RAM (Active)' : 'Ready for Lazy Load',
            latencyMs: 65,
            threshold: m.complaint_classifier?.threshold || 'Per-Label Calibrated (18 Categories)'
          },
          {
            id: 'mod-3',
            modelName: 'Email Threat Classifier',
            version: m.email_threat?.version || '1.0.0',
            task: 'DistilBERT Binary Sequence Classification (Threat / Safe)',
            accuracy: m.email_threat?.accuracy != null ? Number(m.email_threat.accuracy) : 0,
            f1Score: m.email_threat?.f1_score != null ? Number(m.email_threat.f1_score) : 0,
            driftRate: 0.6,
            status: (m.email_threat?.available ? 'READY' : 'NOT_DEPLOYED') as any,
            lastEvaluated: m.email_threat?.loaded ? 'Loaded in RAM (Active)' : 'Ready for Lazy Load',
            latencyMs: 38,
            threshold: m.email_threat?.threshold !== undefined ? m.email_threat.threshold : 0.01133
          },
          {
            id: 'mod-4',
            modelName: 'SMS Spam Classifier',
            version: m.sms_spam?.version || '1.0.0',
            task: 'DistilBERT Binary Smishing & SMS Fraud Detection',
            accuracy: m.sms_spam?.accuracy != null ? Number(m.sms_spam.accuracy) : 0,
            f1Score: m.sms_spam?.f1_score != null ? Number(m.sms_spam.f1_score) : 0,
            driftRate: 0.4,
            status: (m.sms_spam?.available ? 'READY' : 'NOT_DEPLOYED') as any,
            lastEvaluated: m.sms_spam?.loaded ? 'Loaded in RAM (Active)' : 'Ready for Lazy Load',
            latencyMs: 24,
            threshold: m.sms_spam?.threshold !== undefined ? m.sms_spam.threshold : 0.2685
          },
          {
            id: 'mod-5',
            modelName: 'Investigation Assistant',
            version: m.investigation_assistant?.version || 'v2.0.0',
            task: 'Astraea Sovereign Forensic Reasoning Engine (Sovereign Enclave)',
            accuracy: m.investigation_assistant?.accuracy != null ? Number(m.investigation_assistant.accuracy) : 0,
            f1Score: m.investigation_assistant?.f1_score != null ? Number(m.investigation_assistant.f1_score) : 0,
            driftRate: 0.0,
            status: (m.investigation_assistant?.status as any) || 'READY',
            lastEvaluated: 'Operational Enclave Mode',
            latencyMs: 42,
            threshold: 'Deterministic Multi-Step Forensic Rules'
          },
          {
            id: 'mod-6',
            modelName: 'Cyber NER Transformer',
            version: m.cyber_ner?.version || 'cyber-ner-bootstrap-v4.0.0',
            task: 'DeBERTa-v3 Token Classification (11 Cyber Entity Classes, 23 BIO Labels)',
            accuracy: m.cyber_ner?.accuracy != null ? Number(m.cyber_ner.accuracy) : 0,
            f1Score: m.cyber_ner?.f1_score != null ? Number(m.cyber_ner.f1_score) : 0,
            driftRate: 1.2,
            status: (m.cyber_ner?.available ? 'READY' : 'NOT_DEPLOYED') as any,
            lastEvaluated: m.cyber_ner?.loaded ? 'Loaded in RAM (Active)' : 'Ready for Lazy Load',
            latencyMs: 85,
            threshold: m.cyber_ner?.threshold !== undefined ? m.cyber_ner.threshold : 0.70
          },
          {
            id: 'mod-7',
            modelName: 'Case Similarity Transformer',
            version: m.case_similarity?.version || '1.0.0',
            task: 'all-MiniLM-L6-v2 384-d Dense Semantic Embeddings (Cosine Threshold: 0.55)',
            accuracy: m.case_similarity?.accuracy != null ? Number(m.case_similarity.accuracy) : 0,
            f1Score: m.case_similarity?.f1_score != null ? Number(m.case_similarity.f1_score) : 0,
            driftRate: 0.5,
            status: (m.case_similarity?.available ? 'READY' : 'NOT_DEPLOYED') as any,
            lastEvaluated: m.case_similarity?.loaded ? 'Loaded in RAM (Active)' : 'Ready for Lazy Load',
            latencyMs: 32,
            threshold: m.case_similarity?.threshold !== undefined ? m.case_similarity.threshold : 0.55
          },
          {
            id: 'mod-8',
            modelName: 'Incident Urgency Classifier',
            version: m.incident_urgency?.version || '3.0.0',
            task: 'DistilRoBERTa-v3 Narrative Urgency Triage (LOW, MEDIUM, HIGH, CRITICAL)',
            accuracy: m.incident_urgency?.accuracy != null ? Number(m.incident_urgency.accuracy) : 0,
            f1Score: m.incident_urgency?.f1_score != null ? Number(m.incident_urgency.f1_score) : 0,
            driftRate: 0.7,
            status: (m.incident_urgency?.available ? 'READY' : 'NOT_DEPLOYED') as any,
            lastEvaluated: m.incident_urgency?.loaded ? 'Loaded in RAM (Active)' : 'Ready for Lazy Load',
            latencyMs: 45,
            threshold: 'Argmax Probability Distribution'
          },
          {
            id: 'mod-9',
            modelName: 'Cyber Relation Extraction',
            version: m.relation_extraction?.version || '1.0.0',
            task: 'RoBERTa-base Entity Pair Semantic Relation Classification (9 Classes)',
            accuracy: m.relation_extraction?.accuracy != null ? Number(m.relation_extraction.accuracy) : 0,
            f1Score: m.relation_extraction?.f1_score != null ? Number(m.relation_extraction.f1_score) : 0,
            driftRate: 0.8,
            status: (m.relation_extraction?.available ? 'READY' : 'NOT_DEPLOYED') as any,
            lastEvaluated: m.relation_extraction?.loaded ? 'Loaded in RAM (Active)' : 'Ready for Lazy Load',
            latencyMs: 65,
            threshold: 0.50
          },
          {
            id: 'mod-10',
            modelName: 'Cross-Case Correlation',
            version: m.cross_case_correlation?.version || '1.0.0',
            task: 'DistilRoBERTa-v1 Paired Case Narrative & Indicator Overlap Classifier',
            accuracy: m.cross_case_correlation?.accuracy != null ? Number(m.cross_case_correlation.accuracy) : 0,
            f1Score: m.cross_case_correlation?.f1_score != null ? Number(m.cross_case_correlation.f1_score) : 0,
            driftRate: 0.9,
            status: (m.cross_case_correlation?.available ? 'READY' : 'NOT_DEPLOYED') as any,
            lastEvaluated: m.cross_case_correlation?.loaded ? 'Loaded in RAM (Active)' : 'Ready for Lazy Load',
            latencyMs: 78,
            threshold: 'Candidate Overlap'
          },
          {
            id: 'mod-11',
            modelName: 'Evidence Graph Link Predictor',
            version: m.evidence_graph_link?.version || '1.0.0',
            task: 'PyTorch 80-dim Graph Node Link Candidate Prediction (MLP)',
            accuracy: m.evidence_graph_link?.accuracy != null ? Number(m.evidence_graph_link.accuracy) : 0,
            f1Score: m.evidence_graph_link?.f1_score != null ? Number(m.evidence_graph_link.f1_score) : 0,
            driftRate: 0.3,
            status: (m.evidence_graph_link?.available ? 'READY' : 'NOT_DEPLOYED') as any,
            lastEvaluated: m.evidence_graph_link?.loaded ? 'Loaded in RAM (Active)' : 'Ready for Lazy Load',
            latencyMs: 12,
            threshold: 0.50
          },
          {
            id: 'mod-12',
            modelName: 'Feedback Reliability Gate',
            version: m.feedback_gate?.version || '1.0.0',
            task: 'PyTorch 17-dim Continual Learning Gate with Deterministic Hard Overrides',
            accuracy: m.feedback_gate?.accuracy != null ? Number(m.feedback_gate.accuracy) : 0,
            f1Score: m.feedback_gate?.f1_score != null ? Number(m.feedback_gate.f1_score) : 0,
            driftRate: 0.1,
            status: (m.feedback_gate?.available ? 'READY' : 'NOT_DEPLOYED') as any,
            lastEvaluated: m.feedback_gate?.loaded ? 'Loaded in RAM (Active)' : 'Ready for Lazy Load',
            latencyMs: 15,
            threshold: '5 Deterministic Hard Gates + Neural Gate'
          }
        ]);
      }

    } catch (e) {
      setAiModels([]);
    }

    try {
      const liveLogs = await apiClient.getAdminAuditLogs();
      setAuditLogs(liveLogs || []);
    } catch (e) {
      setAuditLogs([]);
    }

    try {
      const notifs = await apiClient.getNotifications();
      if (notifs) {
        setLiveNotifications(notifs);
        const unread = notifs.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      setLiveNotifications([]);
      setUnreadCount(0);
    }
  };


  // Restore authenticated session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const authTicket = urlParams.get('auth_ticket');
      const authError  = urlParams.get('auth_error');
      const targetPortal = urlParams.get('portal');

      if (authTicket || authError || targetPortal) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (authError) {
        console.error('Google authentication error:', authError);
      }

      if (authTicket) {
        try {
          const tokenData = await apiClient.exchangeGoogleTicket(authTicket);
          if (tokenData?.user) {
            setCurrentUser(tokenData.user);
            setCurrentPortal('citizen');
            setActiveTab('dashboard');
            return;
          }
        } catch (e) {
          console.error('Failed to exchange Google OAuth ticket:', e);
        }
      }

      // When on the landing page, close session and enforce explicit sign-in
      if (currentPortal === 'landing') {
        apiClient.setToken(null);
        setCurrentUser(null);
        return;
      }

      const token = apiClient.getToken();
      if (token) {
        try {
          const me = await apiClient.getMe();
          if (me && me.id) {
            setCurrentUser(me);
          } else {
            setCurrentUser(null);
          }
        } catch {
          apiClient.setToken(null);
          setCurrentUser(null);
        }
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    fetchEnclaveData();

    enclaveWS.connect();
    const unsubscribe = enclaveWS.subscribe((event) => {
      if (event.type === 'NOTIFICATION') {
        if (event.data?.id) {
          setLiveNotifications(prev => [event.data, ...prev.filter(n => n.id !== event.data.id)]);
          setUnreadCount(prev => prev + 1);
        } else {
          fetchEnclaveData();
        }
      } else if (event.type === 'NOTIFICATION_COUNT') {
        if (typeof event.data?.unread_count === 'number') {
          setUnreadCount(event.data.unread_count);
        }
      } else if (event.type === 'ALERT' || event.type === 'STATUS_CHANGE') {
        fetchEnclaveData();
      }
    });

    // Resilient background sync interval (every 20 seconds)
    const intervalId = setInterval(() => {
      fetchEnclaveData();
    }, 20000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
      enclaveWS.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch {
      apiClient.setToken(null);
    }
    setCurrentUser(null);
    setCurrentPortal('landing');
    setActiveTab('landing-overview');
    setPortalKey(`landing-${Date.now()}`);
    pushToast('success', 'Successfully signed out of operational enclave.');
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await apiClient.markNotificationRead(id);
      setLiveNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      setLiveNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const handleOpenAuth = (screen: AuthScreenType = 'selection') => {
    setInitialAuthScreen(screen);
    setIsAuthModalOpen(true);
  };

  const handleSelectPortal = (portal: PortalRole, initialTab?: string) => {
    if (portal === 'landing') {
      // Accidental or deliberate redirection to landing page: terminate session immediately
      handleLogout();
      return;
    }

    if (!currentUser) {
      // Must not open until user signs in again
      handleOpenAuth(portal === 'citizen' ? 'citizen-login' : 'selection');
      return;
    }

    setCurrentPortal(portal);
    // New key triggers page-enter animation
    setPortalKey(`${portal}-${Date.now()}`);
    if (initialTab) {
      setActiveTab(initialTab);
    } else {
      switch (portal) {
        case 'citizen':    setActiveTab('citizen-dashboard'); break;
        case 'specialist': setActiveTab('intel-overview');    break;
        case 'aiml':       setActiveTab('ai-dashboard');      break;
        case 'admin':      setActiveTab('admin-dashboard');   break;
        default:           setActiveTab('landing-overview');  break;
      }
    }
  };

  const handleTrackCase = async (referenceNumber: string) => {
    try {
      const foundLive = await apiClient.trackComplaint(referenceNumber);
      if (foundLive) {
        setComplaints(prev => {
          const exists = prev.find(c => c.id === foundLive.id);
          return exists ? prev : [foundLive, ...prev];
        });
        setSelectedCaseId(foundLive.id);
      }
    } catch {
      const found = complaints.find(c => c.referenceNumber.toLowerCase() === referenceNumber.toLowerCase());
      if (found) {
        setSelectedCaseId(found.id);
      }
    }
    if (!currentUser) {
      handleOpenAuth('citizen-login');
      return;
    }
    setCurrentPortal('citizen');
    setActiveTab('track-status');
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    if (currentPortal === 'landing') {
      if (!currentUser) {
        handleOpenAuth('citizen-login');
        return;
      }
      setCurrentPortal('citizen');
      setActiveTab('track-status');
    }
  };

  const handleSubmitComplaint = async (newComplaint: Complaint): Promise<Complaint> => {
    try {
      const created = await apiClient.createComplaint({
        title: newComplaint.title,
        category: newComplaint.category,
        severity: newComplaint.severity,
        citizenName: newComplaint.citizenName,
        citizenEmail: newComplaint.citizenEmail,
        citizenPhone: newComplaint.citizenPhone,
        incidentDate: newComplaint.incidentDate,
        financialLoss: newComplaint.financialLoss,
        suspectInfo: newComplaint.suspectInfo,
        description: newComplaint.description
      });
      setComplaints(prev => [created, ...prev.filter(c => c.id !== created.id)]);
      setSelectedCaseId(created.id);
      pushToast('success', `Incident ${created.referenceNumber} successfully registered and sealed in Enclave.`, {
        title: 'Complaint Filed'
      });
      fetchEnclaveData();
      return created;
    } catch (err: any) {
      pushToast('error', err?.message || 'Failed to submit complaint. Please check network connection.', {
        title: 'Submission Error'
      });
      throw err;
    }
  };


  return (
    <div className="min-h-screen bg-[#131315] text-content-primary flex flex-col relative w-full max-w-full overflow-x-hidden selection:bg-primary selection:text-white">
      
      {/* Global Header */}
      {currentPortal !== 'landing' && (
        <Header
          currentPortal={currentPortal}
          onSelectPortal={handleSelectPortal}
          onOpenOmniSearch={() => setIsOmniSearchOpen(true)}
          notificationCount={unreadCount}
          onOpenNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          defconLevel={4}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAuth={() => handleOpenAuth('selection')}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        />
      )}

      {/* Notifications Drawer */}
      {isNotificationsOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsNotificationsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed top-16 sm:top-20 right-4 sm:right-6 w-96 max-w-[calc(100vw-2rem)] bg-[#161618] border border-white/[0.14] rounded-3xl p-5 shadow-modal z-50 notif-drawer"
            role="dialog"
            aria-label="System notifications"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07] mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" aria-hidden="true" />
                <span className="text-xs font-mono font-bold text-content-primary uppercase">
                  Critical Broadcasts & Alerts
                </span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold animate-badge-pop">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {liveNotifications.length > 0 && (
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    className="text-[10px] text-content-muted hover:text-primary font-mono transition-colors duration-fast"
                  >
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-white/[0.06] transition-all duration-fast"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto text-xs pr-1">
              {liveNotifications.length > 0 ? (
                liveNotifications.map((notif: any) => {
                  const sev = (notif.severity || 'INFO').toUpperCase();
                  const isCrit = sev === 'CRITICAL';
                  const isHigh = sev === 'HIGH' || sev === 'WARNING';
                  return (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-2xl border transition-all duration-standard ${
                        notif.is_read
                          ? 'bg-[#1a1a1d]/60 border-white/[0.06] text-content-secondary'
                          : isCrit
                            ? 'bg-[#1c080a] border-red-500/40 text-content-primary shadow-[0_0_12px_rgba(239,68,68,0.15)] ring-1 ring-red-500/25'
                            : isHigh
                              ? 'bg-[#1a1408] border-amber-500/40 text-content-primary shadow-[0_0_12px_rgba(245,158,11,0.12)]'
                              : 'bg-[#101a14] border-primary/40 text-content-primary shadow-[0_0_12px_rgba(0,230,118,0.1)] ring-1 ring-primary/20'
                      } flex flex-col gap-1.5`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 border ${
                            isCrit
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : isHigh
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-primary/20 text-primary border-primary/40'
                          }`}>
                            {sev}
                          </span>
                          <span className={`font-mono font-bold text-[11px] truncate ${notif.is_read ? 'text-[#8fa396]' : 'text-white'}`}>
                            {notif.title || 'ENCLAVE BROADCAST'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono text-content-muted">
                            {notif.created_at ? notif.created_at.slice(11, 16) + ' UTC' : 'Recent'}
                          </span>
                          {!notif.is_read && (
                            <button
                              onClick={() => handleMarkNotificationRead(notif.id)}
                              className="p-1 rounded bg-white/[0.05] hover:bg-primary/20 text-content-muted hover:text-primary transition-colors"
                              title="Mark as read"
                              aria-label="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${notif.is_read ? 'text-content-muted' : 'text-content-secondary'}`}>
                        {notif.message || notif.body || 'Statutory incident notification logged in national enclave registry.'}
                      </p>
                      {(notif.related_case_id || notif.action_link) && (
                        <div className="pt-1.5 mt-0.5 border-t border-white/[0.05] flex justify-end">
                          <button
                            onClick={() => {
                              const cid = notif.related_case_id || (notif.action_link ? notif.action_link.split('/').pop() : null);
                              if (cid) {
                                setIsNotificationsOpen(false);
                                handleSelectCase(cid);
                              }
                            }}
                            className="text-[10px] font-mono text-primary hover:underline flex items-center gap-1"
                          >
                            <span>Open Case</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-content-muted flex flex-col items-center gap-2.5">
                  <Inbox className="w-6 h-6 opacity-30" aria-hidden="true" />
                  <span className="text-xs font-sans">No enclave broadcasts or alerts at this time.</span>
                </div>
              )}
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-white/[0.08] flex items-center justify-between">
              <button
                onClick={() => {
                  setIsNotificationsOpen(false);
                  setIsNotificationCenterOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-primary text-[11px] font-mono font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Notification Center</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Container Layout */}
      {currentPortal === 'landing' ? (
        <div className="w-full max-w-full flex-1 overflow-x-hidden">
          <LandingPage
            onNavigatePortal={handleSelectPortal}
            onTrackCase={handleTrackCase}
            complaints={complaints}
            onOpenAuth={handleOpenAuth}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        </div>
      ) : (
        <div className="flex flex-1 pt-16 relative z-10">
          {/* Mobile backdrop overlay when sidebar is open */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          <Sidebar
            currentPortal={currentPortal}
            activeTab={activeTab}
            onSelectTab={(tabId) => {
              setActiveTab(tabId);
              // Close sidebar on mobile screens when a tab is picked
              if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
              }
            }}
            openCasesCount={complaints.length}
            criticalAlertsCount={complaints.filter(c => c.severity === 'CRITICAL').length}
            unreadCount={unreadCount}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Portal content — dynamically adapts when sidebar is toggled */}
          <main 
            className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto transition-all duration-300 ease-in-out ${
              isSidebarOpen ? 'md:ml-64 max-w-[calc(100vw-16rem)]' : 'ml-0 max-w-full'
            }`} 
            key={portalKey}
          >
            <ErrorBoundary fallbackTitle="Module Telemetry Error">
              <div className="page-enter min-w-0">
                {currentPortal === 'citizen' && (
                  <CitizenPortal
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    complaints={complaints}
                    selectedCaseId={selectedCaseId}
                    onSelectCase={handleSelectCase}
                    onSubmitComplaint={handleSubmitComplaint}
                    currentUser={currentUser}
                    notifications={liveNotifications}
                    unreadCount={unreadCount}
                    onMarkNotificationRead={handleMarkNotificationRead}
                    onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
                    onRefreshNotifications={fetchEnclaveData}
                  />
                )}

                {currentPortal === 'specialist' && (
                  <SpecialistPortal
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    complaints={complaints}
                    threats={threatFeeds}
                    nodes={correlationNodes}
                    onSelectCase={handleSelectCase}
                  />
                )}

                {currentPortal === 'aiml' && (
                  <AIPortal
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    models={aiModels}
                  />
                )}

                {currentPortal === 'admin' && (
                  <AdminPortal
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    auditLogs={auditLogs}
                  />
                )}
              </div>
            </ErrorBoundary>
          </main>
        </div>
      )}

      {/* Toast Notification System */}
      <ToastSystem toasts={toasts} onDismiss={dismissToast} />

      {/* Global Omni-Search Modal */}
      <OmniSearchModal
        isOpen={isOmniSearchOpen}
        onClose={() => setIsOmniSearchOpen(false)}
        complaints={complaints}
        threats={threatFeeds}
        onSelectCase={handleSelectCase}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialScreen={initialAuthScreen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticate={async (role, tab, user) => {
          setIsAuthModalOpen(false);
          if (user) {
            setCurrentUser(user);
          }
          try {
            const me = await apiClient.getMe();
            if (me && me.id) {
              setCurrentUser(me);
            }
          } catch (e) {}
          handleSelectPortal(role, tab);
          fetchEnclaveData();
        }}
      />

      {/* Sovereign Notification Center */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={liveNotifications}
        onRefresh={fetchEnclaveData}
        onSelectCase={handleSelectCase}
      />

      {/* Universal User Profile & Account Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          pushToast('success', 'Profile identity credentials synchronized across enclave.', {
            title: 'Profile Updated'
          });
        }}
      />
    </div>
  );
};
