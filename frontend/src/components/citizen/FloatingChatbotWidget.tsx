import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Minus,
  Send, 
  Paperclip,
  Smile,
  CheckCheck,
  User,
  ArrowRight
} from 'lucide-react';
import { apiClient } from '../../api/client';

interface FloatingChatbotWidgetProps {
  onNavigatePortal?: (portal: any, initialTab?: string) => void;
  onTrackCase?: (referenceNumber: string) => void;
  onOpenAuth?: (screen?: any) => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  intro?: string;
  steps?: string[];
  outro?: string;
  text?: string;
  timestamp?: string;
  citations?: Array<{
    title: string;
    page?: number;
  }>;
  action?: {
    type: 'file-complaint' | 'track-case' | 'call-1930' | 'auth';
    label: string;
    payload?: string;
  };
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    sender: 'bot',
    text: "Hello! 👋 I’d be happy to help you.\nAsk me anything about CCIP or cyber safety."
  },
  {
    id: 'msg-2',
    sender: 'user',
    text: "How do I report a cybercrime on CCIP?"
  },
  {
    id: 'msg-3',
    sender: 'bot',
    intro: "You can report a cybercrime on CCIP by following these steps:",
    steps: [
      'Click on “Report Cybercrime” on the homepage.',
      'Log in or register for a citizen account.',
      'Fill in the complaint details (type of cybercrime, description, date/time, etc.).',
      'Upload supporting evidence (e.g., screenshots, emails).',
      'Submit the complaint.'
    ],
    outro: "After submission, you’ll receive a complaint ID to track the status of your report.",
    action: {
      type: 'file-complaint',
      label: 'Open Report Cybercrime'
    }
  }
];

export const FloatingChatbotWidget: React.FC<FloatingChatbotWidgetProps> = ({
  onNavigatePortal,
  onTrackCase,
  onOpenAuth
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize public anonymous session on open
  useEffect(() => {
    const initSession = async () => {
      try {
        const storedId = sessionStorage.getItem('ccip_chatbot_session_id');
        const storedToken = sessionStorage.getItem('ccip_chatbot_session_token');
        if (storedId && storedToken) {
          setSessionId(storedId);
          setSessionToken(storedToken);
          return;
        }

        const res = await apiClient.createPublicChatSession();
        if (res && res.session_id) {
          setSessionId(res.session_id);
          setSessionToken(res.session_token || res.session_id);
          sessionStorage.setItem('ccip_chatbot_session_id', res.session_id);
          sessionStorage.setItem('ccip_chatbot_session_token', res.session_token || res.session_id);
        }
      } catch (err) {
        console.warn('[Chatbot] Session init warning:', err);
      }
    };

    if (isOpen && !sessionId) {
      initSession();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [isOpen, isMinimized, messages, isTyping]);

  const handleToggle = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(prev => !prev);
      setIsMinimized(false);
    }
  };

  const generateBotReply = (userQuery: string): { intro?: string; steps?: string[]; outro?: string; text?: string; action?: Message['action'] } => {
    const q = userQuery.toLowerCase().trim();

    // How to report cybercrime
    if (q.includes('report') || q.includes('complaint') || q.includes('how do i report') || q.includes('file')) {
      return {
        intro: "You can report a cybercrime on CCIP by following these steps:",
        steps: [
          'Click on “Report Cybercrime” on the homepage.',
          'Log in or register for a citizen account.',
          'Fill in the complaint details (type of cybercrime, description, date/time, etc.).',
          'Upload supporting evidence (e.g., screenshots, emails).',
          'Submit the complaint.'
        ],
        outro: "After submission, you’ll receive a complaint ID to track the status of your report.",
        action: {
          type: 'file-complaint',
          label: 'Proceed to Report'
        }
      };
    }

    // 1930 / Financial fraud / UPI freeze
    if (q.includes('1930') || q.includes('upi') || q.includes('money') || q.includes('fraud') || q.includes('freeze') || q.includes('bank')) {
      return {
        intro: "For financial cyber fraud, follow these emergency steps within the golden hour:",
        steps: [
          'Call 1930 immediately to alert the National Cyber Financial Fraud Helpline.',
          'Provide the transaction ID, Bank UTR number, and debited account number.',
          'Bank nodal officers will initiate an instant freeze on the destination account.',
          'File an incident report on CCIP with screenshots of the debit SMS and payment receipt.'
        ],
        outro: "Act quickly — transactions frozen within the first 2 hours have a 90%+ recovery rate.",
        action: {
          type: 'call-1930',
          label: 'Call 1930 Helpline'
        }
      };
    }

    // Track case
    const caseMatch = q.match(/(?:cyber|case|ref)?[-_\s]?(\d{4}[-_\s]?\d{3,5})/i) || q.match(/(cyber[-_]\d{4}[-_]\d{4,5})/i);
    if (caseMatch || q.includes('track') || q.includes('status')) {
      const ref = caseMatch ? caseMatch[0].toUpperCase().replace(/\s+/g, '-') : 'CYBER-2026-9842';
      return {
        intro: `You can track your case status with reference ID ${ref}:`,
        steps: [
          `Open the "Track Status" tool on CCIP.`,
          `Enter your unique reference ID: ${ref}.`,
          `View assigned cyber specialist, forensic milestone, and evidence status.`
        ],
        outro: "Real-time updates are cryptographically verified in the Astraea Enclave.",
        action: {
          type: 'track-case',
          label: `Track Case ${ref}`,
          payload: ref
        }
      };
    }

    // Evidence
    if (q.includes('evidence') || q.includes('upload') || q.includes('screenshot') || q.includes('document')) {
      return {
        intro: "To substantiate your cybercrime report, preserve these digital artifacts:",
        steps: [
          'Full-screen uncropped screenshots showing sender phone numbers or emails.',
          'Bank account statements or UPI transaction details with UTR numbers.',
          'Fraudulent website URLs, links, or suspicious application APK files.',
          'WhatsApp, Telegram, or SMS chat exports with explicit timestamps.'
        ],
        outro: "Never delete chat logs or call records before law enforcement review."
      };
    }

    // Default response
    return {
      text: `I'd be glad to help you with "${userQuery}". You can report cybercrime incidents, track existing investigations, or learn safety measures for online fraud, phishing, and account security.`
    };
  };

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      let activeSessionId = sessionId;
      let activeToken = sessionToken;

      if (!activeSessionId) {
        const sessionRes = await apiClient.createPublicChatSession();
        activeSessionId = sessionRes.session_id;
        activeToken = sessionRes.session_token || sessionRes.session_id;
        setSessionId(activeSessionId);
        setSessionToken(activeToken);
        sessionStorage.setItem('ccip_chatbot_session_id', activeSessionId);
        sessionStorage.setItem('ccip_chatbot_session_token', activeToken);
      }

      const res = await apiClient.sendPublicChatMessage({
        session_id: activeSessionId,
        session_token: activeToken,
        message: text
      });

      const rawResponse = res.response || '';
      let intro = '';
      let steps: string[] = [];
      let outro = '';
      let singleText = '';

      // Check if numbered list (e.g., 1. ... 2. ...)
      const stepRegex = /\n?\d+\.\s+/;
      if (stepRegex.test(rawResponse)) {
        const parts = rawResponse.split(/\n(?=\d+\.\s+)/);
        intro = parts[0].trim();
        const stepItems: string[] = [];
        let trailing = '';

        for (let i = 1; i < parts.length; i++) {
          const part = parts[i].trim();
          const doubleLine = part.split(/\n\n+/);
          if (doubleLine.length > 1) {
            stepItems.push(doubleLine[0].replace(/^\d+\.\s*/, '').trim());
            trailing = doubleLine.slice(1).join('\n\n').trim();
          } else {
            stepItems.push(part.replace(/^\d+\.\s*/, '').trim());
          }
        }
        steps = stepItems;
        outro = trailing;
      } else {
        singleText = rawResponse;
      }

      let actionObj: Message['action'] = undefined;
      const isUrgentAdvisory = (res as any).is_urgent_advisory || (res as any).helpline_triggered;
      if (isUrgentAdvisory) {
        actionObj = {
          type: 'call-1930',
          label: 'Call 1930 Helpline'
        };
      } else if (text.toLowerCase().includes('report') || text.toLowerCase().includes('file')) {
        actionObj = {
          type: 'file-complaint',
          label: 'Open Report Cybercrime'
        };
      }

      const sourcesList = (res as any).sources || (res as any).citations || [];
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        intro: intro || undefined,
        steps: steps.length > 0 ? steps : undefined,
        outro: outro || undefined,
        text: singleText || undefined,
        citations: sourcesList.map((c: any) => ({
          title: c.title,
          page: c.page
        })),
        action: actionObj
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.warn('[Chatbot] Using fallback logic:', err);
      const reply = generateBotReply(text);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        ...reply
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action: Message['action']) => {
    if (!action) return;
    if (action.type === 'file-complaint') {
      if (onOpenAuth) {
        onOpenAuth('citizen-login');
      } else if (onNavigatePortal) {
        onNavigatePortal('citizen', 'file-complaint');
      }
      setIsOpen(false);
    } else if (action.type === 'track-case') {
      if (onTrackCase && action.payload) {
        onTrackCase(action.payload);
        setIsOpen(false);
      }
    } else if (action.type === 'call-1930') {
      window.open('tel:1930');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: `📎 Attached evidence: ${file.name}`
      };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `File "${file.name}" received. You can attach this evidence directly when submitting your cybercrime report.`
          }
        ]);
        setIsTyping(false);
      }, 500);
    }
  };

  return (
    <>
      {/* Floating Chat Window */}
      {isOpen && (
        <div 
          className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[380px] sm:w-[420px] max-w-[calc(100vw-2rem)] flex flex-col bg-[#030d08]/96 backdrop-blur-2xl border-2 border-[#00f2a9]/70 rounded-[30px] sm:rounded-[34px] shadow-[0_0_40px_rgba(0,242,169,0.35),0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-200 ${
            isMinimized ? 'h-[74px]' : 'h-[580px] sm:h-[620px] max-h-[calc(100vh-7rem)]'
          }`}
          role="dialog"
          aria-label="CCIP AI Assistant Window"
        >
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-[#00f2a9]/20 bg-[#04120b]/90">
            <div className="flex items-center gap-3">
              {/* Bot Avatar Logo */}
              <div className="w-11 h-11 rounded-full border border-[#00f2a9]/50 bg-[#05180f] overflow-hidden flex items-center justify-center shadow-[0_0_14px_rgba(0,242,169,0.4)] shrink-0">
                <img 
                  src="/chatbot-logo.png" 
                  alt="CCIP AI Logo" 
                  className="w-full h-full object-cover scale-105"
                />
              </div>

              {/* Title & Status */}
              <div className="flex flex-col text-left">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
                  CCIP AI Assistant
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-white/70 mt-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00f2a9] shadow-[0_0_8px_#00f2a9] shrink-0"></span>
                  <span className="text-[#00f2a9] font-semibold">Online</span>
                  <span>·</span>
                  <span className="text-white/80">Citizen Support</span>
                </div>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer"
                title={isMinimized ? "Expand" : "Minimize"}
                aria-label="Minimize"
              >
                <Minus className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Close"
                aria-label="Close"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Chat Content Body (Visible when not minimized) */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-left scrollbar-thin">
                {messages.map((msg) => {
                  if (msg.sender === 'user') {
                    return (
                      <div key={msg.id} className="flex items-center justify-end gap-2.5 my-2">
                        <div className="bg-[#093222] border border-[#00f2a9]/50 text-white rounded-[22px] px-4 py-2.5 text-[13px] sm:text-sm font-normal flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,169,0.2)] max-w-[80%]">
                          <span>{msg.text}</span>
                          <CheckCheck className="w-4 h-4 text-[#00f2a9] shrink-0 stroke-[2.5]" />
                        </div>
                        <div className="w-9 h-9 rounded-full bg-[#14291f] border border-[#00f2a9]/30 flex items-center justify-center text-white shrink-0 shadow-sm">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    );
                  }

                  // Bot message
                  return (
                    <div key={msg.id} className="flex items-start gap-2.5 my-2">
                      <div className="w-9 h-9 rounded-full border border-[#00f2a9]/40 bg-[#05180f] overflow-hidden shrink-0 mt-0.5 shadow-[0_0_10px_rgba(0,242,169,0.25)]">
                        <img 
                          src="/chatbot-logo.png" 
                          alt="AI" 
                          className="w-full h-full object-cover scale-105" 
                        />
                      </div>

                      <div className="flex-1 max-w-[85%] flex flex-col gap-2">
                        <div className="bg-[#0b2017]/90 border border-[#00f2a9]/25 rounded-[22px] px-4 py-3.5 text-white text-[13px] sm:text-[13.5px] leading-relaxed shadow-[0_4px_18px_rgba(0,0,0,0.35)]">
                          {msg.text && (
                            <p className="whitespace-pre-line">{msg.text}</p>
                          )}

                          {msg.intro && (
                            <p className="font-normal mb-2 text-white/95">{msg.intro}</p>
                          )}

                          {msg.steps && msg.steps.length > 0 && (
                            <div className="border-l-2 border-[#00f2a9] pl-3.5 my-2 space-y-1.5 text-white/90 text-[12.5px] sm:text-[13px]">
                              {msg.steps.map((step, idx) => (
                                <p key={idx} className="leading-snug">
                                  {step}
                                </p>
                              ))}
                            </div>
                          )}

                          {msg.outro && (
                            <p className="text-white/85 mt-2.5 text-xs sm:text-[12.5px]">{msg.outro}</p>
                          )}

                          {/* Authoritative Knowledge Citations */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-[#00f2a9]/20 flex flex-wrap items-center gap-1.5 text-[11px]">
                              <span className="text-white/60 font-semibold text-[10.5px]">Verified Sources:</span>
                              {msg.citations.map((c, idx) => (
                                <span 
                                  key={idx} 
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00f2a9]/15 border border-[#00f2a9]/35 text-[#00f2a9] font-medium text-[10.5px]"
                                  title={`Grounded from Admin Knowledge Materials: ${c.title}`}
                                >
                                  📄 {c.title}{c.page ? ` (Page ${c.page})` : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Interactive Action CTA */}
                        {msg.action && (
                          <button
                            onClick={() => handleActionClick(msg.action)}
                            className="self-start inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#00f2a9] hover:brightness-110 text-[#031508] text-xs font-bold shadow-[0_0_15px_rgba(0,242,169,0.4)] transition-all cursor-pointer"
                          >
                            <span>{msg.action.label}</span>
                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-[#00f2a9] pl-11">
                    <div className="flex gap-1 py-1.5 px-3 rounded-full bg-[#0b2017] border border-[#00f2a9]/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00f2a9] animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00f2a9] animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00f2a9] animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                    <span className="text-[11px] text-white/60">CCIP AI is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Input Area matching screenshot */}
              <div className="p-3 sm:p-4 bg-[#030d08]">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="rounded-full border border-[#00f2a9]/45 bg-[#05180f]/90 px-3 py-2 flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,169,0.15)]"
                >
                  {/* Paperclip attachment icon */}
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1 text-white/70 hover:text-[#00f2a9] transition-colors cursor-pointer"
                    title="Attach screenshot or document"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                  />

                  {/* Input field */}
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder:text-white/50 text-xs sm:text-sm focus:outline-none"
                  />

                  {/* Emoji icon */}
                  <button 
                    type="button"
                    onClick={() => setInputValue(prev => prev + ' 😊')}
                    className="p-1 text-white/70 hover:text-[#00f2a9] transition-colors cursor-pointer"
                    title="Insert emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {/* Send Button matching screenshot squircle */}
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="w-9 h-8 sm:w-10 sm:h-8.5 rounded-xl bg-[#00f2a9] hover:brightness-110 disabled:opacity-40 text-[#031508] flex items-center justify-center shadow-[0_0_15px_rgba(0,242,169,0.5)] transition-all cursor-pointer shrink-0"
                    title="Send"
                  >
                    <Send className="w-4 h-4 fill-current rotate-45 -translate-y-0.5 -translate-x-0.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Launcher Button (Bottom Right Corner) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 select-none">
        {/* Hover Pill prompt (when closed) */}
        {!isOpen && (
          <div 
            onClick={handleToggle}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#04120b]/95 border border-[#00f2a9]/50 text-xs font-semibold text-white shadow-[0_0_20px_rgba(0,242,169,0.25)] backdrop-blur-md cursor-pointer hover:border-[#00f2a9] hover:scale-105 transition-all group"
          >
            <span className="w-2 h-2 rounded-full bg-[#00f2a9] animate-pulse"></span>
            <span className="text-[#00f2a9] text-[11px] font-bold">CCIP AI</span>
            <span className="text-white/80 text-[11px] font-normal group-hover:text-white transition-colors">• Online</span>
          </div>
        )}

        {/* Circular Avatar Trigger Button */}
        <button
          onClick={handleToggle}
          aria-label={isOpen ? "Close CCIP AI Assistant" : "Open CCIP AI Assistant"}
          className={`relative w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-[#04120b] border-2 transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center p-0.5 cursor-pointer ${
            isOpen 
              ? 'border-[#00f2a9] shadow-[0_0_30px_rgba(0,242,169,0.5)]' 
              : 'border-[#00f2a9] shadow-[0_0_30px_rgba(0,242,169,0.6)] hover:shadow-[0_0_40px_rgba(0,242,169,0.85)]'
          }`}
        >
          {/* Glowing Aura Ring */}
          <div className="absolute inset-0 rounded-full bg-[#00f2a9]/20 blur-sm pointer-events-none"></div>

          {/* Logo Graphic */}
          <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center relative z-10">
            <img 
              src="/chatbot-logo.png" 
              alt="CCIP AI Bot" 
              className="w-full h-full object-cover scale-105"
            />
          </div>

          {/* Live Online Dot */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f2a9] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#00f2a9] border-2 border-[#030d08]"></span>
            </span>
          )}

          {/* Close X overlay when opened */}
          {isOpen && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center z-20 text-white">
              <X className="w-6 h-6 text-[#00f2a9]" />
            </div>
          )}
        </button>
      </div>
    </>
  );
};
