import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Complaint, ThreatFeedItem, CorrelatedNode, ComplaintClassifierResponse, CyberEntity, InvestigationConversation } from '../types';
import { apiClient } from '../api/client';
import { formatINR } from '../utils/formatters';
import { MarkdownMessage } from '../components/MarkdownMessage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MOCK_CORRELATION_NODES, INITIAL_COMPLAINTS } from '../data/mockData';
import { CorrelationGraph3D, GraphNode3D, GraphLink3D, getNodeCategory } from '../components/intelligence/CorrelationGraph3D';
import { ThreatIntelligencePortalView } from '../components/intelligence/ThreatIntelligencePortalView';
import { SocMonitoringPortalView } from '../components/intelligence/SocMonitoringPortalView';
import { InvestigationWorkspacePortalView } from '../components/intelligence/InvestigationWorkspacePortalView';
import { CrossCaseCorrelationPortalView } from '../components/intelligence/CrossCaseCorrelationPortalView';
import { AIAssistantInvestigationPortalView } from '../components/intelligence/AIAssistantInvestigationPortalView';
import { InvestigationReportsPortalView } from '../components/intelligence/InvestigationReportsPortalView';
import { 
  Radar, 
  Activity, 
  Network, 
  Lock, 
  Coins, 
  Fingerprint, 
  ShieldAlert, 
  Radio, 
  ArrowRight,
  Pause,
  Play,
  Volume2,
  Bot,
  FileCheck,
  BarChart3,
  BrainCircuit,
  Search,
  Filter,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Sparkles,
  FileText,
  Clock,
  Eye,
  Terminal,
  Layers,
  Database,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Info,
  Square,
  Plus,
  MessageSquare,
  AlertCircle,
  ChevronDown
} from 'lucide-react';

interface SpecialistPortalProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  complaints: Complaint[];
  threats: ThreatFeedItem[];
  nodes: CorrelatedNode[];
  onSelectCase: (caseId: string) => void;
}

export const SpecialistPortal: React.FC<SpecialistPortalProps> = ({
  activeTab,
  onSelectTab,
  complaints,
  threats,
  nodes,
  onSelectCase
}) => {
  const effectiveComplaints = useMemo(() => {
    return complaints && complaints.length > 0 ? complaints : INITIAL_COMPLAINTS;
  }, [complaints]);

  const [selectedCaseId, setSelectedCaseId] = useState<string>(complaints[0]?.id || INITIAL_COMPLAINTS[0]?.id || '');
  const [docketFilter, setDocketFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [docketSearch, setDocketSearch] = useState<string>('');

  const filteredDocket = useMemo(() => {
    return effectiveComplaints.filter((c) => {
      if (docketFilter !== 'ALL' && c.severity !== docketFilter) return false;
      if (docketSearch.trim()) {
        const q = docketSearch.toLowerCase();
        return (
          c.referenceNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          (c.citizenName && c.citizenName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [effectiveComplaints, docketFilter, docketSearch]);

  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-case-9842');
  const [isStreaming, setIsStreaming] = useState(true);
  const [specialistSummary, setSpecialistSummary] = useState<any>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [copilotStatus, setCopilotStatus] = useState<string>('SOVEREIGN_OFFLINE');
  const [copilotWeights, setCopilotWeights] = useState<string>('DEPLOYED (Astraea Sovereign Engine)');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string; tags?: string[] }>>([
    {
      sender: 'ai',
      text: '### Specialist AI Co-Pilot Online\n\nAstraea Enclave Sovereign Neural Engine active: `astraea-sovereign-neural-v2`.\n\nReal-time tactical forensic reasoning, cross-case entity correlation, and statutory Indian cyber jurisprudence are loaded.\n\n- **Operational Mode:** Astraea Sovereign Engine (Offline Enclave Mode)\n- **Forensic Capabilities:** Acoustic voice-clone analysis, wallet peel-chain clustering, IT Act 2000 offense mapping, and CERT-In compliance directives.',
      time: new Date().toTimeString().slice(0, 8),
      tags: ['STATUS: SOVEREIGN_OFFLINE', 'ADAPTER: READY', 'WEIGHTS: DEPLOYED (Astraea Sovereign Engine)']
    }
  ]);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationsList, setConversationsList] = useState<InvestigationConversation[]>([]);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const [contextHud, setContextHud] = useState<{ entityCount: number; relationCount: number; evidenceCount: number; correlationCount: number; sources: string[] } | null>(null);
  const [isAiUnavailable, setIsAiUnavailable] = useState(false);
  const aiAbortControllerRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiGenerating]);

  useEffect(() => {
    const fetchAiStatus = async () => {
      try {
        const s = await apiClient.getAIAssistantStatus();
        if (s) {
          const isConn = s.available === true || s.status === 'LOCAL MODEL CONNECTED';
          setCopilotStatus(isConn ? 'LOCAL AI CONNECTED' : 'AI_ASSISTANT_UNAVAILABLE');
          setIsAiUnavailable(!isConn);
          if (s.weights) setCopilotWeights(s.weights);
          else if (s.model) setCopilotWeights(`MODEL: ${s.model}`);
        }
      } catch {
        setCopilotStatus('AI_ASSISTANT_UNAVAILABLE');
        setIsAiUnavailable(true);
      }
    };
    fetchAiStatus();
  }, []);

  useEffect(() => {
    if (!selectedCaseId) return;
    const loadCaseAssistantData = async () => {
      try {
        const res = await apiClient.getCaseAssistantSuggestions(selectedCaseId);
        if (res?.suggestions && res.suggestions.length > 0) {
          setDynamicSuggestions(res.suggestions);
        }
      } catch {
        setDynamicSuggestions([
          'Summarize the verified indicators in this case',
          'Build a chronological incident timeline from evidence timestamps',
          'What evidence should the investigator verify next?'
        ]);
      }

      try {
        const convs = await apiClient.listInvestigationConversations(selectedCaseId);
        setConversationsList(convs || []);
        if (convs && convs.length > 0 && !activeConversationId) {
          setActiveConversationId(convs[0].id);
          const fullConv = await apiClient.getInvestigationConversation(convs[0].id);
          if (fullConv && fullConv.messages && fullConv.messages.length > 0) {
            setChatMessages(fullConv.messages.map(m => ({
              sender: m.role.toLowerCase() === 'user' ? 'user' : 'ai',
              text: m.content,
              time: new Date(m.created_at).toTimeString().slice(0, 8),
              tags: m.metadata_json?.context_sources ? m.metadata_json.context_sources.map((src: string) => `SRC: ${src}`) : ['SOVEREIGN LOCAL', 'CASE GROUNDED']
            })));
          }
        }
      } catch {}
    };
    loadCaseAssistantData();
  }, [selectedCaseId]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const summary: any = await apiClient.getSpecialistDashboardSummary();
        if (summary) {
          setSpecialistSummary(summary);
          if (summary.threat_telemetry && summary.threat_telemetry.length > 0) {
            setLivePackets(summary.threat_telemetry);
          }
        }
      } catch (e) {}
    };
    fetchSummary();
  }, [complaints.length]);

  const [livePackets, setLivePackets] = useState<Array<{ id: string; time: string; ip: string; proto: string; payload: string; status: string }>>([
    { id: 'pkt-1', time: '14:28:10', ip: '185.220.101.44:443', proto: 'TLSv1.3', payload: 'CobaltStrike C2 Beacon (JA3: 72a...98b)', status: 'BLOCKED' },
    { id: 'pkt-2', time: '14:28:12', ip: '194.26.29.112:8080', proto: 'TCP/SYN', payload: 'LockBit v4 Handshake Probe', status: 'ALERT' },
    { id: 'pkt-3', time: '14:28:14', ip: '45.142.214.9:443', proto: 'HTTPS', payload: 'Evilginx3 Reverse Proxy Lure Broadcast', status: 'BLOCKED' },
    { id: 'pkt-4', time: '14:28:16', ip: '104.28.19.88:993', proto: 'IMAP/SSL', payload: 'Credential Stuffing Botnet Sweep', status: 'MONITOR' },
  ]);

  // Sync with real threat feeds
  useEffect(() => {
    if (threats && threats.length > 0) {
      const mapped = threats.map((t, idx) => ({
        id: t.id || `pkt-${idx}`,
        time: t.detectionTime ? t.detectionTime.slice(11, 19) : '12:00:00',
        ip: t.iocValue || 'Enclave Gateway Node',
        proto: t.iocType === 'IP_ADDRESS' ? 'TCP/IP' : 'TLSv1.3',
        payload: `${t.threatName} (${t.threatActor || 'IoC'})`,
        status: t.severity === 'CRITICAL' || t.severity === 'HIGH' ? 'BLOCKED' : 'ALERT'
      }));
      setLivePackets(mapped);
    }
  }, [threats]);

  const [activeInvestigation, setActiveInvestigation] = useState<any>(null);
  const [investigationLoading, setInvestigationLoading] = useState(false);
  const [newActionType, setNewActionType] = useState('LOG_ANALYSIS');
  const [newActionDesc, setNewActionDesc] = useState('');
  const [newFindingType, setNewFindingType] = useState('IOC_DETECTED');
  const [newFindingDesc, setNewFindingDesc] = useState('');
  const [newFindingConfidence, setNewFindingConfidence] = useState('0.95');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Load real backend investigation whenever selectedCaseId changes
  useEffect(() => {
    const fetchInvestigation = async () => {
      if (!selectedCaseId) return;
      setInvestigationLoading(true);
      try {
        const inv = await apiClient.getInvestigationByCase(selectedCaseId);
        setActiveInvestigation(inv);
      } catch (e) {
        // Investigation dossier will initialize or fallback
      } finally {
        setInvestigationLoading(false);
      }
    };
    fetchInvestigation();
  }, [selectedCaseId]);

  // Phase C: Real Cybercrime Extracted Entities (IOCs)
  const [caseEntities, setCaseEntities] = useState<CyberEntity[]>([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  const [isExtractingEntities, setIsExtractingEntities] = useState(false);
  const [copiedEntityId, setCopiedEntityId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntities = async () => {
      if (!selectedCaseId) {
        setCaseEntities([]);
        return;
      }
      setIsLoadingEntities(true);
      try {
        const ents = await apiClient.getComplaintEntities(selectedCaseId);
        setCaseEntities(ents || []);
      } catch (e) {
        setCaseEntities([]);
      } finally {
        setIsLoadingEntities(false);
      }
    };
    fetchEntities();
  }, [selectedCaseId]);

  const handleReExtractEntities = async () => {
    if (!selectedCaseId) return;
    setIsExtractingEntities(true);
    try {
      const ents = await apiClient.extractComplaintEntities(selectedCaseId);
      setCaseEntities(ents || []);
      setActionFeedback(`Successfully re-extracted ${ents.length} cyber entities (IOCs).`);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback('Extraction error: ' + (err.message || 'Failed to extract entities'));
    } finally {
      setIsExtractingEntities(false);
    }
  };

  const handleCopyEntity = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEntityId(id);
    setTimeout(() => setCopiedEntityId(null), 2000);
  };

  // Real backend evidence items
  const [evidenceVault, setEvidenceVault] = useState<any[]>([]);
  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const evs = await apiClient.getEvidence();
        if (evs && evs.length > 0) {
          setEvidenceVault(evs);
        }
      } catch (e) {
        // Fallback
      }
    };
    fetchEvidence();
  }, []);

  // Document Processing & Forensic Extraction Inspection State
  const [selectedEvidenceForInspection, setSelectedEvidenceForInspection] = useState<any | null>(null);
  const [inspectionResult, setInspectionResult] = useState<any | null>(null);
  const [loadingInspection, setLoadingInspection] = useState(false);
  const [showRedactedText, setShowRedactedText] = useState(true);

  const handleInspectEvidence = async (ev: any) => {
    setSelectedEvidenceForInspection(ev);
    setLoadingInspection(true);
    setShowRedactedText(true);
    try {
      const res = await apiClient.getEvidenceProcessingResult(ev.id);
      setInspectionResult(res);
    } catch (e: any) {
      setInspectionResult({
        processing_status: ev.processing_status || 'PARTIALLY_COMPLETED',
        detected_format: 'DOCUMENT',
        page_count: 1,
        ocr_applied: false,
        extracted_text: 'Extraction result record pending on server.',
        redacted_text: 'Extraction result record pending on server.',
        gemini_summary: 'Gemini contextual AI analysis pending.',
        gemini_analysis_json: {},
        gemini_status: 'NOT_ATTEMPTED',
        extracted_entities: []
      });
    } finally {
      setLoadingInspection(false);
    }
  };

  const handleReprocessEvidence = async (evidenceId: string) => {
    setLoadingInspection(true);
    try {
      const res = await apiClient.processEvidence(evidenceId);
      setInspectionResult(res);
      setEvidenceVault(prev => prev.map(item => item.id === evidenceId ? { ...item, processing_status: res.processing_status } : item));
    } catch (e) {
      //
    } finally {
      setLoadingInspection(false);
    }
  };


  // Safe active correlation node fallback to prevent runtime TypeError when nodes list is empty
  const correlationList = (nodes && nodes.length > 0) ? nodes : MOCK_CORRELATION_NODES;
  const activeNode = correlationList.find(n => n.id === selectedNodeId) || correlationList[0] || {
    id: 'node-case-9842',
    label: 'Case CYBER-2026-9842 (UPI Wire Fraud ₹18.5L)',
    type: 'CASE',
    riskScore: 96,
    connections: ['node-wallet-1', 'node-infra-1', 'node-actor-1', 'node-case-99104']
  };
  const selectedCase = complaints.find(c => c.id === selectedCaseId) || complaints[0];

  // AI Triage State (Phase 9 Optional Integration)
  const [isTriageRunning, setIsTriageRunning] = useState(false);
  const [triageResult, setTriageResult] = useState<ComplaintClassifierResponse | null>(null);

  // Phase M: Real Pilot Validation Queue
  const [pilotPredictions, setPilotPredictions] = useState<any[]>([]);
  const [isLoadingPilotQueue, setIsLoadingPilotQueue] = useState(false);
  const [pilotReviewStatus, setPilotReviewStatus] = useState<{ [key: string]: string }>({});

  const fetchPilotPredictions = async () => {
    setIsLoadingPilotQueue(true);
    try {
      const preds = await apiClient.getPilotPredictions();
      setPilotPredictions(preds || []);
    } catch {
      // Keep fallback
    } finally {
      setIsLoadingPilotQueue(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'validation-queue') {
      fetchPilotPredictions();
    }
  }, [activeTab]);

  const handlePilotReviewSubmit = async (predId: string, decision: 'AGREE' | 'OVERRIDE') => {
    try {
      await apiClient.submitPilotReview(
        predId,
        decision,
        undefined,
        decision === 'OVERRIDE' ? 'SPECIALIST_CORRECTION' : undefined,
        'Specialist validated via Portal'
      );
      setPilotReviewStatus(prev => ({ ...prev, [predId]: decision }));
    } catch (e: any) {
      console.error('Pilot review failed:', e);
    }
  };

  const [triageError, setTriageError] = useState<string | null>(null);

  const handleRunAITriage = async () => {
    const textToClassify = selectedCase?.description || selectedCase?.title;
    if (!textToClassify) return;
    setIsTriageRunning(true);
    setTriageError(null);
    try {
      const res = await apiClient.classifyComplaint(textToClassify);
      setTriageResult(res);
    } catch (err: any) {
      setTriageError(err.message || 'Failed to execute real AI Triage.');
    } finally {
      setIsTriageRunning(false);
    }
  };

  // Multi-Model Intelligence Integration State (Phase J)
  const [similarCases, setSimilarCases] = useState<any[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [entityRelations, setEntityRelations] = useState<any[]>([]);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);
  const [caseUrgency, setCaseUrgency] = useState<any>(null);
  const [isLoadingUrgency, setIsLoadingUrgency] = useState(false);
  const [evidenceGraph, setEvidenceGraph] = useState<any>(null);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [caseCorrelations, setCaseCorrelations] = useState<any[]>([]);
  const [selectedGraphNode, setSelectedGraphNode] = useState<GraphNode3D | null>(null);
  const [selectedGraphLink, setSelectedGraphLink] = useState<GraphLink3D | null>(null);

  const fetchMultiModelIntelligence = async () => {
    if (!selectedCaseId) return;
    setIsLoadingSimilar(true);
    setIsLoadingRelations(true);
    setIsLoadingUrgency(true);
    setIsLoadingGraph(true);
    setGraphError(null);

    try {
      const [sim, rels, urg, graph, corrs] = await Promise.all([
        apiClient.getSimilarCases(selectedCaseId, 4).catch(() => null),
        apiClient.getComplaintRelations(selectedCaseId).catch(() => []),
        apiClient.getCaseUrgency(selectedCaseId).catch(() => null),
        apiClient.getCaseEvidenceGraph(selectedCaseId).catch((err: any) => {
          setGraphError(err.message || 'Evidence graph service unavailable');
          return null;
        }),
        apiClient.getCaseCorrelations(selectedCaseId).catch(() => [])
      ]);

      if (sim?.similar_cases) setSimilarCases(sim.similar_cases);
      if (rels) setEntityRelations(rels);
      if (urg) setCaseUrgency(urg);
      if (graph) setEvidenceGraph(graph);
      if (corrs) setCaseCorrelations(corrs);
    } catch (err: any) {
      console.warn('Error fetching multi-model intelligence:', err);
      setGraphError(err.message || 'Error constructing evidence graph');
    } finally {
      setIsLoadingSimilar(false);
      setIsLoadingRelations(false);
      setIsLoadingUrgency(false);
      setIsLoadingGraph(false);
    }
  };

  useEffect(() => {
    fetchMultiModelIntelligence();
  }, [selectedCaseId]);

  // Map real backend evidence graph and cross-case correlations to 3D graph structures
  const { graphNodes3D, graphLinks3D } = useMemo(() => {
    const rawNodes = evidenceGraph?.nodes || [];
    const rawEdges = evidenceGraph?.edges || [];

    const nList: GraphNode3D[] = rawNodes.map((n: any) => ({
      id: n.id,
      label: n.display_label || n.canonical_value || n.id,
      type: n.node_type || 'UNKNOWN',
      canonicalValue: n.canonical_value,
      confidence: n.metadata?.confidence,
      source: n.metadata?.source_type || 'CASE_EVIDENCE',
      reviewStatus: n.metadata?.review_status || 'VERIFIED',
      metadata: n.metadata
    }));

    const nodeIds = new Set(nList.map(n => n.id));

    // Map evidence graph edges
    const lList: GraphLink3D[] = rawEdges
      .filter((e: any) => nodeIds.has(e.source_node_id) && nodeIds.has(e.target_node_id))
      .map((e: any) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        type: e.edge_type || 'RELATED_TO',
        confidence: e.confidence,
        sourceType: e.source || 'DETERMINISTIC',
        reviewStatus: e.review_status || 'VERIFIED'
      }));

    // Incorporate real cross-case correlation candidate records if returned
    if (caseCorrelations && caseCorrelations.length > 0) {
      caseCorrelations.forEach((c: any) => {
        const targetCaseId = c.case_a_id === selectedCaseId ? c.case_b_id : c.case_a_id;
        const targetLabel = c.label || `Case ${targetCaseId.slice(0, 10)}`;

        if (!nodeIds.has(targetCaseId)) {
          nList.push({
            id: targetCaseId,
            label: targetLabel,
            type: 'CASE',
            confidence: c.confidence,
            source: 'CORRELATION_MODEL',
            reviewStatus: c.status || 'CANDIDATE',
            metadata: {
              similarity_score: c.similarity_score,
              shared_entity_count: c.shared_entity_count,
              shared_entity_types: c.shared_entity_types_json
            }
          });
          nodeIds.add(targetCaseId);
        }

        const caseNode = nList.find(n => n.type === 'CASE');
        if (caseNode) {
          lList.push({
            id: c.id,
            source: caseNode.id,
            target: targetCaseId,
            type: 'CROSS_CASE_CORRELATION',
            confidence: c.confidence,
            sourceType: 'CORRELATION_MODEL',
            reviewStatus: c.status || 'CANDIDATE',
            metadata: {
              similarity_score: c.similarity_score,
              shared_entity_count: c.shared_entity_count,
              shared_entity_types: c.shared_entity_types_json
            }
          });
        }
      });
    }

    return { graphNodes3D: nList, graphLinks3D: lList };
  }, [evidenceGraph, caseCorrelations, selectedCaseId]);

  // Sync selected graph node
  useEffect(() => {
    if (graphNodes3D.length > 0) {
      const match = graphNodes3D.find((n: GraphNode3D) => n.id === selectedNodeId) || graphNodes3D[0];
      setSelectedGraphNode(match);
    } else {
      setSelectedGraphNode(null);
    }
  }, [graphNodes3D, selectedNodeId]);


  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvestigation?.id || !newActionDesc.trim()) return;
    try {
      const added = await apiClient.addInvestigationAction(activeInvestigation.id, {
        action_type: newActionType,
        description: newActionDesc,
        performed_by: 'Dr. Aris Thorne (Specialist)',
        metadata: { timestamp: new Date().toISOString() }
      });
      setActiveInvestigation((prev: any) => prev ? {
        ...prev,
        actions: [...(prev.actions || []), added]
      } : prev);
      setNewActionDesc('');
      setActionFeedback('Investigation action successfully recorded in audit trail.');
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback(err.message || 'Failed to record action.');
    }
  };

  const handleAddFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvestigation?.id || !newFindingDesc.trim()) return;
    try {
      const added = await apiClient.addInvestigationFinding(activeInvestigation.id, {
        finding_type: newFindingType,
        description: newFindingDesc,
        confidence_score: parseFloat(newFindingConfidence) || 0.95,
        metadata: { timestamp: new Date().toISOString() }
      });
      setActiveInvestigation((prev: any) => prev ? {
        ...prev,
        findings: [...(prev.findings || []), added]
      } : prev);
      setNewFindingDesc('');
      setActionFeedback('Forensic finding successfully sealed in dossier.');
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback(err.message || 'Failed to seal finding.');
    }
  };

  const handleExportReport = async (reportId: string, format: string = 'json') => {
    try {
      const exported = await apiClient.exportReport(reportId, format);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exported, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Report-${reportId}.${format === 'json' ? 'json' : 'txt'}`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      alert(`Export status: ${err.message || 'Export format available as raw JSON'}`);
    }
  };

  const handleStopGeneration = () => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      aiAbortControllerRef.current = null;
    }
    setIsAiGenerating(false);
  };

  const handleNewChat = async () => {
    try {
      const newConv = await apiClient.createInvestigationConversation(selectedCaseId, 'New Investigation Chat');
      setActiveConversationId(newConv.id);
      setConversationsList(prev => [newConv, ...prev]);
      setChatMessages([]);
    } catch {
      setActiveConversationId(null);
      setChatMessages([]);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    try {
      const fullConv = await apiClient.getInvestigationConversation(convId);
      if (fullConv && fullConv.messages) {
        setChatMessages(fullConv.messages.map(m => ({
          sender: m.role.toLowerCase() === 'user' ? 'user' : 'ai',
          text: m.content,
          time: new Date(m.created_at).toTimeString().slice(0, 8),
          tags: m.metadata_json?.context_sources ? m.metadata_json.context_sources.map((src: string) => `SRC: ${src}`) : ['SOVEREIGN LOCAL', 'CASE GROUNDED']
        })));
      }
    } catch (e) {
      console.error('[Load Conversation Error]', e);
    }
  };

  const handleSendAiMessage = async (customText?: string) => {
    const textToSend = customText || aiPrompt;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: textToSend.trim(),
      time: new Date().toTimeString().slice(0, 8)
    };
    setChatMessages(prev => [...prev, userMsg]);
    setAiPrompt('');
    setIsAiGenerating(true);
    setIsAiUnavailable(false);

    const abortController = new AbortController();
    aiAbortControllerRef.current = abortController;
    let accumulatedText = '';

    setChatMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: '',
        time: new Date().toTimeString().slice(0, 8),
        tags: ['STATUS: ANALYZING INTELLIGENCE...']
      }
    ]);

    try {
      await apiClient.streamInvestigationChat(
        {
          conversation_id: activeConversationId || undefined,
          case_id: selectedCaseId,
          message: textToSend.trim()
        },
        (evt) => {
          if (evt.event === 'retrieval') {
            const data = evt.data;
            if (data.conversation_id && !activeConversationId) {
              setActiveConversationId(data.conversation_id);
            }
            setContextHud({
              entityCount: data.entity_count || 0,
              relationCount: data.relation_count || 0,
              evidenceCount: data.evidence_count || 0,
              correlationCount: data.correlation_count || 0,
              sources: data.sources || []
            });
          } else if (evt.event === 'token') {
            const token = evt.data?.text || '';
            accumulatedText += token;
            setChatMessages(prev => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].sender === 'ai') {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  text: accumulatedText,
                  tags: ['STATUS: STREAMING', 'SOVEREIGN LOCAL', 'CASE GROUNDED']
                };
              }
              return updated;
            });
          } else if (evt.event === 'complete') {
            const compData = evt.data;
            setChatMessages(prev => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].sender === 'ai') {
                const srcTags = (compData?.sources || []).map((s: string) => `SRC: ${s}`);
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  text: accumulatedText || '(Response sealed)',
                  tags: [
                    compData.status === 'CANCELLED' ? 'STATUS: CANCELLED' : 'STATUS: COMPLETE',
                    'SOVEREIGN LOCAL',
                    'CASE GROUNDED',
                    ...srcTags
                  ]
                };
              }
              return updated;
            });
            setIsAiGenerating(false);
          } else if (evt.event === 'error') {
            setIsAiUnavailable(true);
            const errMsg = evt.data?.message || 'Generative investigation assistant is currently unavailable. Existing case intelligence remains accessible.';
            setChatMessages(prev => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].sender === 'ai') {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  text: errMsg,
                  tags: ['STATUS: AI_ASSISTANT_UNAVAILABLE', 'SOVEREIGN LOCAL']
                };
              }
              return updated;
            });
            setIsAiGenerating(false);
          }
        },
        abortController.signal
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setChatMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].sender === 'ai') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              tags: ['STATUS: CANCELLED BY INVESTIGATOR', 'SOVEREIGN LOCAL']
            };
          }
          return updated;
        });
      } else {
        setIsAiUnavailable(true);
        setChatMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].sender === 'ai') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              text: 'Generative investigation assistant is currently unavailable. Existing case intelligence remains accessible.',
              tags: ['STATUS: AI_ASSISTANT_UNAVAILABLE', 'SOVEREIGN LOCAL']
            };
          }
          return updated;
        });
      }
      setIsAiGenerating(false);
    } finally {
      aiAbortControllerRef.current = null;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">


      {/* 1. TAB: SPECIALIST DASHBOARD / OVERVIEW */}
      {(activeTab === 'specialist-dashboard' || activeTab === 'intel-overview') && (
        <div className="flex flex-col gap-6">
          {/* KPI Metrics 4-col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="op-card p-5">
              <div className="flex items-center justify-between text-content-muted text-xs">
                <span>Active Triage Docket</span>
                <Radar className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-content-primary mt-2 font-mono">
                {specialistSummary?.metrics?.active_triage_cases ?? complaints.filter(c => c.status !== 'RESOLVED').length} Cases
              </div>
              <div className="text-[11px] text-soft-green mt-1 flex items-center gap-1 font-mono">
                <span>Live Enclave Triage</span>
              </div>
            </div>

            <div className="op-card p-5">
              <div className="flex items-center justify-between text-content-muted text-xs">
                <span>Threat Vectors Monitored</span>
                <ShieldAlert className="w-4 h-4 text-soft-green" />
              </div>
              <div className="text-2xl font-bold text-content-primary mt-2 font-mono">
                {(specialistSummary?.metrics?.threat_vectors_blocked ?? (complaints.length * 12 + 14)).toLocaleString()}
              </div>
              <div className="text-[11px] text-content-muted mt-1 font-mono">Mitigation efficacy tracking</div>
            </div>

            <div className="op-card p-5">
              <div className="flex items-center justify-between text-content-muted text-xs">
                <span>Evidence Artifacts Sealed</span>
                <Lock className="w-4 h-4 text-soft-blue" />
              </div>
              <div className="text-2xl font-bold text-content-primary mt-2 font-mono">
                {specialistSummary?.metrics?.evidence_artifacts_sealed ?? evidenceVault.length} Items
              </div>
              <div className="text-[11px] text-soft-blue mt-1 font-mono">SHA-256 Vault Records</div>
            </div>

            <div className="op-card p-5">
              <div className="flex items-center justify-between text-content-muted text-xs">
                <span>AI Confidence Index</span>
                <Sparkles className="w-4 h-4 text-soft-pink" />
              </div>
              <div className="text-2xl font-bold text-content-primary mt-2 font-mono">
                {specialistSummary?.metrics?.ai_confidence_index ? `${specialistSummary.metrics.ai_confidence_index}%` : '96.8%'}
              </div>
              <div className="text-[11px] text-soft-pink mt-1 font-mono">Forensic classification avg</div>
            </div>
          </div>

          {/* 2-col Layout: Live SOC Telemetry & Recent Incident Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="op-card p-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-xs font-mono font-bold text-content-primary uppercase">Real-Time Threat Telemetry Radar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsStreaming(!isStreaming)}
                      className="p-1 rounded bg-white/[0.06] text-content-secondary hover:text-content-primary text-xs flex items-center gap-1 font-mono"
                    >
                      {isStreaming ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {isStreaming ? 'PAUSE' : 'RESUME'}
                    </button>
                    <span className="chip-primary text-[10px] font-mono px-1.5 py-0.5 rounded">STREAM LIVE</span>
                  </div>
                </div>

                {/* Packet Feed Terminal */}
                <div className="p-3.5 rounded-xl bg-[#141414] border border-white/[0.06] font-mono text-xs flex flex-col gap-2 max-h-[360px] overflow-y-auto">
                  {livePackets.map((pkt) => (
                    <div key={pkt.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-content-muted">{pkt.time}</span>
                        <span className="chip-neutral px-1 py-0.2 rounded text-[9px]">{pkt.proto}</span>
                        <span className="text-content-primary font-bold">{pkt.ip}</span>
                        <span className="text-content-secondary truncate text-[10px]">{pkt.payload}</span>
                      </div>
                      <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                        pkt.status === 'BLOCKED' ? 'chip-danger' : pkt.status === 'ALERT' ? 'chip-warning' : 'chip-info'
                      }`}>
                        {pkt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="op-card p-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
                  <span className="text-xs font-mono font-bold text-content-primary uppercase">Priority Case Docket</span>
                  <button onClick={() => onSelectTab('assigned-cases')} className="text-xs text-primary hover:underline font-mono">VIEW ALL →</button>
                </div>

                <div className="flex flex-col gap-2.5">
                  {complaints.slice(0, 4).map((c) => (
                    <div 
                      key={c.id}
                      onClick={() => { setSelectedCaseId(c.id); onSelectTab('investigation-workspace'); }}
                      className="p-3 rounded-xl bg-[#242426] border border-white/[0.06] hover:border-white/[0.14] cursor-pointer transition-all flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-primary font-bold">{c.referenceNumber}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          c.severity === 'CRITICAL' ? 'chip-danger' : 'chip-warning'
                        }`}>
                          {c.severity}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-content-primary line-clamp-1">{c.title}</div>
                      <div className="flex items-center justify-between text-[10px] text-content-muted font-mono">
                        <span>{c.category}</span>
                        <span>{c.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB: THREAT INTELLIGENCE / LIVE THREATS */}
      {(activeTab === 'threat-intelligence' || activeTab === 'live-threats') && (
        <ThreatIntelligencePortalView
          onSelectTab={onSelectTab}
          onSelectCase={onSelectCase}
          complaints={complaints}
        />
      )}

      {/* 3. TAB: SOC MONITORING */}
      {activeTab === 'soc-monitoring' && (
        <SocMonitoringPortalView
          onSelectTab={onSelectTab}
          onSelectCase={onSelectCase}
          complaints={effectiveComplaints}
        />
      )}

      {/* 4. TAB: ASSIGNED CASES */}
      {activeTab === 'assigned-cases' && (
        <div className="flex flex-col gap-6">
          <div className="op-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.08] mb-4 gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-bold text-content-primary uppercase">
                  Assigned Forensic Cases ({effectiveComplaints.length})
                </span>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search docket..."
                    value={docketSearch}
                    onChange={(e) => setDocketSearch(e.target.value)}
                    className="bg-[#06150c] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-content-muted focus:outline-none focus:border-primary font-mono w-44 sm:w-56"
                  />
                </div>

                <div className="flex items-center gap-1 font-mono text-[11px]">
                  {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setDocketFilter(sev)}
                      className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        docketFilter === sev
                          ? 'bg-[#00e676] text-[#020b06] font-bold border-[#00e676]'
                          : 'bg-[#06150c] text-content-muted border-white/[0.08] hover:text-white'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredDocket.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocket.map((c) => (
                  <div 
                    key={c.id} 
                    className="p-5 rounded-2xl bg-[#05130a] border border-white/[0.08] hover:border-primary/50 transition-all flex flex-col justify-between gap-4 cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(0,230,118,0.15)] group"
                    onClick={() => { setSelectedCaseId(c.id); onSelectTab('investigation-workspace'); }}
                  >
                    <div>
                      <div className="flex items-center justify-between font-mono text-xs mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-bold">{c.referenceNumber}</span>
                          <span className="text-[10px] text-content-muted">• {c.category}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.severity === 'CRITICAL' ? 'chip-danger' :
                          c.severity === 'HIGH' ? 'chip-warning' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}>
                          {c.severity}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{c.title}</h3>
                      <p className="text-xs text-content-muted line-clamp-2 mt-1 leading-relaxed">{c.description}</p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-2 text-content-secondary">
                        <span>Victim: <strong className="text-white">{c.citizenName}</strong></span>
                        {c.evidenceFiles && c.evidenceFiles.length > 0 && (
                          <span className="text-[10px] text-content-muted">({c.evidenceFiles.length} files)</span>
                        )}
                      </div>
                      <button className="text-primary font-bold flex items-center gap-1 hover:underline cursor-pointer">
                        <span>OPEN WORKSPACE</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-3 bg-[#040e08] rounded-xl border border-white/[0.06]">
                <FileText className="w-8 h-8 text-content-muted" />
                <p className="text-xs font-mono text-content-secondary">
                  No forensic cases match the active filter ({docketFilter}{docketSearch ? `, "${docketSearch}"` : ''}).
                </p>
                <button
                  onClick={() => { setDocketFilter('ALL'); setDocketSearch(''); }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-colors cursor-pointer"
                >
                  Reset Docket Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB: INVESTIGATION WORKSPACE */}
      {activeTab === 'investigation-workspace' && (
        <InvestigationWorkspacePortalView
          onSelectTab={onSelectTab}
          onSelectCase={onSelectCase}
          complaints={effectiveComplaints}
          selectedCaseId={selectedCaseId}
        />
      )}

      {/* 6. TAB: EVIDENCE REPOSITORY */}
      {activeTab === 'evidence-repository' && (
        <div className="flex flex-col gap-6">
          <div className="op-card p-5">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-white/[0.08] mb-4 gap-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-soft-green" />
                <span className="text-xs font-mono font-bold text-content-primary uppercase">Cryptographic Evidence Vault & Intelligent Document Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip-success text-[10px] font-mono px-2 py-0.5 rounded font-bold">100% FOSS + GEMINI</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">TAMPER-PROOF STORAGE</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {evidenceVault && evidenceVault.length > 0 ? (
                evidenceVault.map((ev: any, idx: number) => {
                  const pStatus = ev.processing_status || 'COMPLETED';
                  const statusBadgeClass = 
                    pStatus === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                    pStatus === 'OCR_REQUIRED' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                    pStatus === 'PROCESSING' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse' :
                    pStatus === 'FAILED' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                    'bg-zinc-800 text-zinc-300 border-zinc-700';

                  return (
                    <div key={ev.id || idx} className="p-4 rounded-xl bg-[#242426] border border-white/[0.06] hover:border-primary/40 flex flex-col justify-between gap-3 font-mono text-xs transition-all shadow-md">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-primary font-bold">{ev.case_id ? `CASE-${ev.case_id.slice(0, 8)}` : 'CC-EVIDENCE'}</span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-mono border font-bold ${statusBadgeClass}`}>
                            {pStatus}
                          </span>
                        </div>
                        <div className="text-content-primary font-bold font-sans text-sm truncate" title={ev.original_filename || ev.name}>
                          {ev.original_filename || ev.name}
                        </div>
                        <div className="text-[10px] text-content-muted mt-1 truncate" title={ev.sha256_hash || ev.sha256Hash}>
                          SHA-256: {(ev.sha256_hash || ev.sha256Hash || '').slice(0, 16)}...
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/[0.06] gap-2">
                        <button
                          onClick={() => handleInspectEvidence(ev)}
                          className="px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-primary" /> INSPECT
                        </button>
                        <button 
                          onClick={() => apiClient.downloadEvidence(ev.id, ev.original_filename || ev.name)}
                          className="text-content-muted hover:text-white font-bold flex items-center gap-1 transition-colors"
                        >
                          <Download className="w-3 h-3" /> VAULT
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                [
                  { id: 'mock-1', original_filename: 'Wire_Transfer_Receipt_098.pdf', sha256_hash: '8f74a942bc837102e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b14e', file_size_formatted: '2.4 MB', case_id: 'CC-2025-89412', processing_status: 'COMPLETED' },
                  { id: 'mock-2', original_filename: 'UPI_Debit_SMS_Screenshot.png', sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', file_size_formatted: '420 KB', case_id: 'CC-2025-89412', processing_status: 'COMPLETED' },
                  { id: 'mock-3', original_filename: 'Phishing_Payment_Gateway_Scanned.pdf', sha256_hash: '5d41402abc4b2a76b9719d911017c592c301c4e97669d2737604d55b880198a1', file_size_formatted: '1.2 MB', case_id: 'CC-2025-99104', processing_status: 'OCR_REQUIRED' },
                ].map((ev, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#242426] border border-white/[0.06] hover:border-primary/40 flex flex-col justify-between gap-3 font-mono text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-primary font-bold">CASE-{ev.case_id.slice(0, 8)}</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-mono border font-bold ${
                          ev.processing_status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}>
                          {ev.processing_status}
                        </span>
                      </div>
                      <div className="text-content-primary font-bold font-sans text-sm truncate">{ev.original_filename}</div>
                      <div className="text-[10px] text-content-muted mt-1">SHA-256: {ev.sha256_hash.slice(0, 16)}...</div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/[0.06]">
                      <button
                        onClick={() => handleInspectEvidence(ev)}
                        className="px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-primary" /> INSPECT
                      </button>
                      <span className="text-content-muted">{ev.file_size_formatted}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DOCUMENT PROCESSING FORENSIC INSPECTION DRAWER/MODAL */}
          {selectedEvidenceForInspection && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
              <div className="w-full max-w-4xl bg-[#06140c] border border-primary/40 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white font-mono">
                          {selectedEvidenceForInspection.original_filename || selectedEvidenceForInspection.name}
                        </h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary/20 text-primary border border-primary/30 font-bold">
                          {inspectionResult?.detected_format || 'EVIDENCE'}
                        </span>
                      </div>
                      <div className="text-[11px] text-content-muted font-mono mt-0.5">
                        SHA-256: {selectedEvidenceForInspection.sha256_hash || selectedEvidenceForInspection.sha256Hash}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedEvidenceForInspection(null);
                      setInspectionResult(null);
                    }} 
                    className="p-1.5 rounded-lg text-content-muted hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {loadingInspection ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs font-mono text-content-muted">Processing document through pypdf/OCR/PII Redactor/Gemini pipeline...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 text-xs font-mono">
                    {/* Status & Engine Telemetry Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                      <div>
                        <span className="text-[10px] text-content-muted block uppercase">Processing Status</span>
                        <span className={`font-bold ${inspectionResult?.processing_status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {inspectionResult?.processing_status || 'COMPLETED'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-content-muted block uppercase">Pages / Chars</span>
                        <span className="text-white font-bold">
                          {inspectionResult?.page_count || 1} Pages • {inspectionResult?.character_count || 0} Chars
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-content-muted block uppercase">OCR Applied</span>
                        <span className="text-white font-bold">
                          {inspectionResult?.ocr_applied ? `Yes (${inspectionResult?.ocr_engine || 'OCR'})` : 'Native PDF/Text'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-content-muted block uppercase">Gemini Contextual AI</span>
                        <span className={`font-bold ${inspectionResult?.gemini_status === 'SUCCESS' ? 'text-primary' : 'text-content-muted'}`}>
                          {inspectionResult?.gemini_status === 'SUCCESS' ? 'Active (Gemini 2.5)' : 'Local Offline Fallback'}
                        </span>
                      </div>
                    </div>

                    {/* Gemini Intelligence Dossier */}
                    {inspectionResult?.gemini_summary && (
                      <div className="p-4 rounded-xl bg-[#0b1f14] border border-primary/30 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span>Gemini Contextual Intelligence Dossier</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/40 font-bold">
                            {inspectionResult?.gemini_analysis_json?.document_category || 'FORENSIC SUMMARY'}
                          </span>
                        </div>

                        <p className="text-white font-sans text-xs leading-relaxed">
                          {inspectionResult.gemini_summary}
                        </p>

                        {inspectionResult?.gemini_analysis_json?.key_findings && inspectionResult.gemini_analysis_json.key_findings.length > 0 && (
                          <div className="mt-1 flex flex-col gap-1">
                            <span className="text-[10px] text-content-muted uppercase">Key Forensic Findings:</span>
                            <ul className="list-disc pl-4 text-content-secondary font-sans text-xs flex flex-col gap-0.5">
                              {inspectionResult.gemini_analysis_json.key_findings.map((f: string, i: number) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {inspectionResult?.gemini_analysis_json?.investigator_next_steps && inspectionResult.gemini_analysis_json.investigator_next_steps.length > 0 && (
                          <div className="mt-1 p-2.5 rounded-lg bg-black/40 border border-primary/20 flex flex-col gap-1">
                            <span className="text-[10px] text-primary uppercase font-bold">Recommended Investigator Next Steps:</span>
                            <ul className="list-decimal pl-4 text-content-secondary font-sans text-xs flex flex-col gap-0.5">
                              {inspectionResult.gemini_analysis_json.investigator_next_steps.map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Extracted Cybercrime Indicators (IOCs) */}
                    <div className="flex flex-col gap-2 p-4 rounded-xl bg-black/40 border border-white/[0.06]">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <span className="text-primary font-bold uppercase flex items-center gap-1.5">
                          <Fingerprint className="w-4 h-4 text-primary" />
                          <span>Extracted Indicators & Provenance References ({inspectionResult?.extracted_entities?.length || 0})</span>
                        </span>
                        <span className="text-[10px] text-content-muted">Linked to Evidence ID #{selectedEvidenceForInspection.id.slice(0, 8)}</span>
                      </div>

                      {inspectionResult?.extracted_entities && inspectionResult.extracted_entities.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs font-mono">
                            <thead>
                              <tr className="text-content-muted text-[10px] border-b border-white/[0.06]">
                                <th className="pb-1.5">TYPE</th>
                                <th className="pb-1.5">RAW VALUE</th>
                                <th className="pb-1.5">NORMALIZED VALUE</th>
                                <th className="pb-1.5">CONFIDENCE</th>
                                <th className="pb-1.5 text-right">OFFSET</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                              {inspectionResult.extracted_entities.map((ent: any, i: number) => (
                                <tr key={ent.id || i} className="hover:bg-white/[0.02]">
                                  <td className="py-1.5 pr-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-primary/15 text-primary border border-primary/30">
                                      {ent.entity_type}
                                    </span>
                                  </td>
                                  <td className="py-1.5 pr-2 text-white font-bold">{ent.raw_value}</td>
                                  <td className="py-1.5 pr-2 text-content-secondary">{ent.normalized_value}</td>
                                  <td className="py-1.5 pr-2 text-emerald-400 font-bold">
                                    {Math.round((ent.confidence || 0.95) * 100)}%
                                  </td>
                                  <td className="py-1.5 text-right text-content-muted text-[10px]">
                                    {ent.start_offset !== null ? `[${ent.start_offset}:${ent.end_offset}]` : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-3 text-content-muted text-xs italic">
                          No deterministic cyber indicators detected in this document.
                        </div>
                      )}
                    </div>

                    {/* Preserved Document Text & Local PII Shield */}
                    <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col gap-2">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-400" />
                          <span className="text-white font-bold uppercase">Extracted Document Text</span>
                          <span className="px-2 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            PII SHIELD ACTIVE
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowRedactedText(!showRedactedText)}
                            className="px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-content-primary text-[10px] font-mono cursor-pointer"
                          >
                            {showRedactedText ? 'Switch to Raw Text' : 'Switch to Redacted View'}
                          </button>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#040c07] border border-white/[0.04] text-[11px] font-mono text-content-secondary max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                        {showRedactedText 
                          ? (inspectionResult?.redacted_text || inspectionResult?.extracted_text || 'No text extracted')
                          : (inspectionResult?.extracted_text || 'No text extracted')}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                      <button
                        onClick={() => handleReprocessEvidence(selectedEvidenceForInspection.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#0d1e15] border border-primary/30 hover:border-primary/60 text-xs text-primary flex items-center gap-1.5 cursor-pointer font-bold transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Re-process Document</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => apiClient.downloadEvidence(selectedEvidenceForInspection.id, selectedEvidenceForInspection.original_filename || selectedEvidenceForInspection.name)}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Vault Copy</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEvidenceForInspection(null);
                            setInspectionResult(null);
                          }}
                          className="px-4 py-1.5 rounded-lg bg-primary text-[#020b06] text-xs font-bold font-mono cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}


      {/* 7. TAB: CROSS-CASE CORRELATION */}
      {(activeTab === 'cross-case-correlation' || activeTab === 'case-correlator') && (
        <CrossCaseCorrelationPortalView
          onSelectTab={onSelectTab}
          onSelectCase={onSelectCase}
          complaints={complaints}
          selectedCaseId={selectedCaseId}
        />
      )}

      {/* 8. TAB: VALIDATION QUEUE */}
      {activeTab === 'validation-queue' && (
        <div className="flex flex-col gap-6">
          <div className="op-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-soft-green" />
                <span className="text-xs font-mono font-bold text-content-primary uppercase">Human-in-the-Loop AI Validation Queue</span>
              </div>
              <div className="flex items-center gap-2">
                {isLoadingPilotQueue && <span className="text-[10px] text-content-muted animate-pulse">Loading live pilot telemetry...</span>}
                <span className="chip-warning text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                  {pilotPredictions.length > 0 ? `${pilotPredictions.length} LIVE PILOT PREDICTIONS` : '3 PENDING REVIEWS'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {pilotPredictions.length > 0 ? (
                pilotPredictions.map((pred) => {
                  const status = pilotReviewStatus[pred.id];
                  return (
                    <div key={pred.id} className="p-4 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
                      <div>
                        <div className="flex items-center gap-2 text-primary font-bold mb-1">
                          <span>{pred.task}</span>
                          <span>•</span>
                          <span>Ref: {pred.record_ref}</span>
                        </div>
                        <div className="text-sm font-bold text-content-primary font-sans">
                          {pred.prediction_json?.entities_summary ? `Extracted: ${pred.prediction_json.entities_summary.join(', ')}` : 
                           pred.prediction_json?.detected_categories ? `Category: ${pred.prediction_json.detected_categories.join(', ')}` : 
                           pred.prediction_json?.urgency_level ? `Urgency: ${pred.prediction_json.urgency_level}` : 
                           JSON.stringify(pred.prediction_json)}
                        </div>
                        <div className="text-[10px] text-content-muted mt-0.5">
                          Model: {pred.model_name} ({pred.model_version}) | Confidence: {JSON.stringify(pred.confidence_json)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {status ? (
                          <span className={`px-3 py-1 rounded-lg text-xs font-sans font-bold ${status === 'AGREE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}>
                            {status === 'AGREE' ? 'Validated (Agreed)' : 'Overridden'}
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handlePilotReviewSubmit(pred.id, 'AGREE')}
                              className="btn-primary px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 font-sans"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Confirm AI Decision
                            </button>
                            <button
                              onClick={() => handlePilotReviewSubmit(pred.id, 'OVERRIDE')}
                              className="btn-secondary px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 font-sans"
                            >
                              <XCircle className="w-3.5 h-3.5 text-danger" />
                              Override
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                [
                  { id: 'VAL-101', caseRef: 'CC-2025-89412', model: 'VoiceGuard-v2.1', aiVerdict: 'Deepfake Audio Confirmed (96.8%)', specialistAction: 'Confirm AI Decision' },
                  { id: 'VAL-102', caseRef: 'CC-2025-99104', model: 'CryptoTracer-v4', aiVerdict: 'High-Risk Mixer Hop Detected (99.1%)', specialistAction: 'Approve Freezing Order' },
                  { id: 'VAL-103', caseRef: 'CC-2025-88219', model: 'PhishScan-v3', aiVerdict: 'Reverse Proxy Lure Match (94.5%)', specialistAction: 'Confirm Domain Takedown' },
                ].map((val) => (
                  <div key={val.id} className="p-4 rounded-xl bg-[#242426] border border-white/[0.06] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
                    <div>
                      <div className="flex items-center gap-2 text-primary font-bold mb-1">
                        <span>{val.id}</span>
                        <span>•</span>
                        <span>{val.caseRef}</span>
                      </div>
                      <div className="text-sm font-bold text-content-primary font-sans">{val.aiVerdict}</div>
                      <div className="text-[10px] text-content-muted mt-0.5">Scored by: {val.model}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="btn-primary px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {val.specialistAction}
                      </button>
                      <button className="btn-secondary px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 font-sans">
                        <XCircle className="w-3.5 h-3.5 text-danger" />
                        Override
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9. TAB: AI INVESTIGATION ASSISTANT */}
      {activeTab === 'ai-assistant' && (
        <AIAssistantInvestigationPortalView
          onSelectTab={onSelectTab}
          onSelectCase={onSelectCase}
          complaints={complaints}
          selectedCaseId={selectedCaseId}
        />
      )}

      {/* 10. TAB: INVESTIGATION REPORTS */}
      {activeTab === 'investigation-reports' && (
        <InvestigationReportsPortalView
          complaints={complaints}
          currentUser={{ name: 'Naveen (Specialist)' }}
          onSelectCase={onSelectCase}
        />
      )}
    </div>
  );
};
