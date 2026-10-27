export type PortalRole = 'landing' | 'citizen' | 'specialist' | 'aiml' | 'admin';

export interface Complaint {
  id: string;
  referenceNumber: string; // e.g. CYBER-2026-9842
  title: string;
  category: 
    | 'Financial Fraud' 
    | 'UPI Fraud'
    | 'Online Banking Fraud'
    | 'Credit/Debit Card Fraud'
    | 'SIM Swap Fraud'
    | 'OTP / QR Code Scam'
    | 'Loan App Fraud'
    | 'Cryptocurrency Fraud'
    | 'Crypto Scam'
    | 'Identity Theft'
    | 'Social Media Fraud'
    | 'Phishing Attack'
    | 'Phishing / Social Eng'
    | 'Malware / Ransomware'
    | 'Ransomware / Extortion'
    | 'Deepfake / AI Fraud'
    | 'Cyber Stalking'
    | 'Unauthorized Access'
    | 'Others'
    | (string & {});
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 
    | 'DRAFT'
    | 'SUBMITTED' 
    | 'UNDER_REVIEW'
    | 'TRIAGED' 
    | 'VALIDATED'
    | 'CASE_CREATED'
    | 'OPEN'
    | 'ASSIGNED'
    | 'UNDER_INVESTIGATION' 
    | 'EVIDENCE_VERIFIED' 
    | 'LAW_ENFORCEMENT_DISPATCHED' 
    | 'RESOLVED'
    | 'CLOSED'
    | 'CANCELLED';
  citizenName: string;
  citizenEmail: string;
  citizenPhone: string;
  incidentDate: string;
  reportedDate: string;
  financialLoss?: number;
  suspectInfo?: {
    alias?: string;
    email?: string;
    phone?: string;
    website?: string;
    walletAddress?: string;
    ipAddress?: string;
  };
  description: string;
  evidenceFiles: {
    name: string;
    size: string;
    type: string;
    sha256Hash: string;
    verified: boolean;
  }[];
  aiTriageScore: number; // 0-100
  aiPredictedThreatGroup?: string;
  assignedUnit?: string;
  assignedOfficer?: string;
  timeline: {
    timestamp: string;
    title: string;
    description: string;
    actor: string;
    verifiedHash?: string;
  }[];
}

export interface ThreatFeedItem {
  id: string;
  iocValue: string;
  iocType: 'IP_ADDRESS' | 'SHA256_HASH' | 'MALICIOUS_DOMAIN' | 'CRYPTO_WALLET' | 'CVE_EXPLOIT';
  threatName: string;
  threatActor: string;
  confidenceScore: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  detectionTime: string;
  sourceEnclave: string;
  associatedCasesCount: number;
  status: 'ACTIVE_BLOCK' | 'MONITORING' | 'TRIAGED' | 'RESOLVED';
}

export interface CorrelatedNode {
  id: string;
  label: string;
  type: 'CASE' | 'SUSPECT' | 'WALLET' | 'IP' | 'MALWARE' | 'VICTIM';
  riskScore: number;
  connections: string[];
}

export interface ModelMetric {
  id: string;
  modelName: string;
  version: string;
  task: string;
  accuracy: number;
  f1Score: number;
  driftRate: number; // percentage
  status: 'PRODUCTION' | 'STAGING' | 'DEGRADED' | 'RETRAINING' | 'READY' | 'AVAILABLE_WITH_LIMITATIONS' | 'NOT_DEPLOYED';
  lastEvaluated: string;
  latencyMs: number;
  threshold?: number | string;
}

// ----------------------------------------------------------------------------
// Real AI Model & Sovereign Engine Response Types
// ----------------------------------------------------------------------------

export interface AIModelStatusItem {
  files_available: boolean;
  available: boolean;
  loaded: boolean;
  state: string;
  status: string;
  architecture?: string;
  version?: string;
  threshold?: number | string;
  accuracy?: number;
  f1_score?: number;
  precision?: number;
  recall?: number;
}

export interface AIModelsStatusResponse {
  status: string;
  models: {
    email_threat: AIModelStatusItem;
    sms_spam: AIModelStatusItem;
    url_phishing: AIModelStatusItem;
    complaint_classifier: AIModelStatusItem;
    cyber_ner?: AIModelStatusItem;
    investigation_assistant?: AIModelStatusItem;
    [key: string]: AIModelStatusItem | undefined;
  };
}

export interface URLPhishingResponse {
  model: 'url_phishing';
  available: boolean;
  url: string;
  prediction: 0 | 1;
  label: 'Legitimate' | 'Phishing';
  confidence: number;
  legitimate_probability: number;
  phishing_probability: number;
  threshold?: number;
  status?: string;
  message?: string;
}

export interface EmailThreatResponse {
  model: 'email_threat';
  available: boolean;
  label: 'SAFE_EMAIL' | 'SUSPICIOUS_EMAIL';
  prediction: 0 | 1;
  confidence: number;
  safe_probability: number;
  threat_probability: number;
  threshold: number;
  model_version: string;
  status?: string;
  message?: string;
}

export interface SMSSpamResponse {
  model: 'sms_spam';
  available: boolean;
  label: 'SAFE' | 'SPAM';
  prediction: 0 | 1;
  confidence: number;
  safe_probability: number;
  spam_probability: number;
  threshold: number;
  model_version: string;
  status?: string;
  message?: string;
}

export interface ComplaintLabelResult {
  probability: number;
  threshold: number;
  flagged: boolean;
}

export interface ComplaintPredictionItem {
  label: string;
  probability: number;
  threshold: number;
}

export interface ComplaintClassifierResponse {
  status: string;
  available?: boolean;
  model: string;
  model_version: string;
  architecture: string;
  input_text_length?: number;
  is_cybercrime: boolean;
  highest_scoring_category?: string;
  highest_probability?: number;
  flagged_categories?: string[];
  predictions: ComplaintPredictionItem[] | Record<string, ComplaintLabelResult>;
  message?: string;
}

export interface InvestigationAssistantResponse {
  status: string;
  connected: boolean;
  confidence?: number;
  weights?: string;
  deployed_weights?: string;
  model?: string;
  source?: 'sovereign_enclave' | 'gemini_live' | 'local_generative_llm' | string;
  response: string;
  message?: string;
  masked_key?: string;
  error?: string;
}

export interface InvestigationConversation {
  id: string;
  case_id?: string;
  created_by?: string;
  title: string;
  status: 'ACTIVE' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
  message_count?: number;
  messages?: InvestigationChatMessage[];
}

export interface InvestigationChatMessage {
  id: string;
  conversation_id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  metadata_json?: Record<string, any>;
  created_at: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  clearance: string;
  action: string;
  resource: string;
  status: 'SUCCESS' | 'DENIED' | 'FLAGGED';
  ipAddress: string;
  hash: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  badge_number?: string | null;
  clearance_level?: string;
  role: string;
  portal_role: PortalRole;
  department_id?: string | null;
  department?: string | null;
  account_status?: string;
  is_active?: boolean;
  is_verified?: boolean;
  is_staff?: boolean;
  mfa_type?: string;
  mfa_enabled?: boolean;
  google_id?: string | null;
  is_google_linked?: boolean;
  avatar_url?: string | null;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface CyberEntity {
  id: string;
  complaint_id?: string;
  case_id?: string;
  entity_type: string;
  raw_value: string;
  normalized_value: string;
  confidence: number;
  value?: string;
  confidence_score?: number;
  source_type?: string;
  extractor?: string;
  extraction_mode?: string;
  occurrence_count?: number;
  metadata_json?: Record<string, any>;
  created_at?: string;
}

export interface AppNotification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type?: string;
  notification_type?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'HIGH' | 'LOW' | string;
  is_read: boolean;
  action_link?: string | null;
  metadata_json?: Record<string, any>;
  created_at: string;
  timestamp_formatted?: string;
}

export interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  jurisdiction?: string;
  isActive: boolean;
  memberCount?: number;
  createdAt?: string;
}

export interface SystemHealthService {
  status: string;
  type?: string;
  latency_ms?: number;
  backend?: string;
  location?: string;
  url?: string;
  models_available?: number;
  total_models?: number;
  provider?: string;
  model?: string;
  active_connections?: number;
  cipher?: string;
  [key: string]: any;
}

export interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  timestamp: string;
  latency_ms: number;
  services: {
    database?: SystemHealthService;
    storage_vault?: SystemHealthService;
    redis_cache?: SystemHealthService;
    ai_inference_models?: SystemHealthService;
    generative_copilot?: SystemHealthService;
    websocket_gateway?: SystemHealthService;
    cryptographic_enclave?: SystemHealthService;
    [key: string]: any;
  };
}

export interface SystemConfiguration {
  security: {
    jwtAlgorithm: string;
    accessTokenExpireMinutes: number;
    refreshTokenExpireDays: number;
    mfaEnforcement: string;
    auditTamperSeals: string;
    sessionLockoutThreshold: number;
    sessionLockoutDurationMinutes: number;
  };
  storage: {
    backend: string;
    vaultDirectory: string;
    maxEvidenceSizeMb: number;
    allowedExtensions: string[];
  };
  environment: {
    databaseDialect: string;
    appEnv: string;
    version: string;
    aiProvider: string;
    corsConfigured: boolean;
  };
}

export interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  status: 'CONFIGURED' | 'NOT_CONFIGURED' | 'ONLINE' | 'DEGRADED' | 'FALLBACK_READY';
  description: string;
  endpoint?: string;
}

export interface DatabaseStatus {
  engine: string;
  status: string;
  sanitizedLocation: string;
  fileSizeBytes: number;
  fileSizeMb: number;
  backupsCount: number;
  tables: {
    users: number;
    complaints: number;
    cases: number;
    evidence: number;
    notifications: number;
    audit_logs: number;
  };
}

export interface DatabaseBackup {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  checksumSha256?: string;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Controlled ML Training Workspace Types
// -----------------------------------------------------------------------------

export interface TrainingRuntimeStatus {
  runtime_type: 'LOCAL_CPU' | 'LOCAL_CUDA' | string;
  cuda_available: boolean;
  gpu_count: number;
  gpu_name: string | null;
  gpu_status: string;
  gpu_memory_total_gb: number;
  cpu_count: number;
  cpu_physical: number;
  cpu_percent: number;
  total_ram_gb: number;
  available_ram_gb: number;
  ram_percent: number;
  disk_total_gb: number;
  disk_free_gb: number;
  python_version: string;
  torch_version: string;
  transformers_version: string;
  recommended_execution_mode: string;
  unsupported_execution_modes: string[];
  explanation: string;
}

export interface QualityGateConfig {
  metric: string;
  minimum_validation: number;
  minimum_test: number;
  challenge_set_required?: boolean;
}

export interface TrainingJob {
  id: string;
  job_reference: string;
  model_family: string;
  base_model: string;
  target_model_name: string;
  target_model_version: string;
  dataset_id: string | null;
  dataset_version: string;
  training_task: string;
  status: 'DRAFT' | 'VALIDATING' | 'READY' | 'QUEUED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'BLOCKED';
  runtime_type: string;
  runtime_target: string;
  config_json: {
    learning_rate?: number;
    batch_size?: number;
    epochs?: number;
    warmup_steps?: number;
    weight_decay?: number;
    seed?: number;
    hidden_dims?: number[];
    dropout?: number;
    activation?: string;
    loss_function?: string;
    optimizer?: string;
    preset?: 'CONSERVATIVE' | 'BALANCED' | 'EXPERIMENTAL';
    [key: string]: any;
  };
  quality_gate_config_json: QualityGateConfig;
  metrics_json: Record<string, any>;
  quality_gate_result_json: Record<string, any>;
  artifact_path_ref?: string | null;
  artifact_hash_sha256?: string | null;
  log_path_ref?: string | null;
  checkpoint_path_ref?: string | null;
  notes?: string | null;
  failure_reason?: string | null;
  created_by?: string | null;
  approved_by?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingJobCreatePayload {
  model_family: string;
  base_model: string;
  target_model_name: string;
  target_model_version: string;
  dataset_id?: string | null;
  dataset_version?: string;
  training_task: string;
  config_json?: Record<string, any>;
  quality_gate_config_json?: Record<string, any>;
  notes?: string;
}

export interface PreflightCheckItem {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'INFO';
  message: string;
  details?: Record<string, any>;
}

export interface TrainingValidationResult {
  ready: boolean;
  status: 'READY' | 'BLOCKED';
  checks: PreflightCheckItem[];
  warnings: string[];
  blockers: string[];
  recommended_runtime?: string;
}

export interface ColabExportPackage {
  job_reference: string;
  model_family: string;
  generated_at: string;
  package_files: {
    name: string;
    description: string;
    content: string;
    content_type: string;
  }[];
  instructions: string[];
}

