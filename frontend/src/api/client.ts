import { 
  Complaint, 
  ThreatFeedItem, 
  CorrelatedNode, 
  ModelMetric, 
  SystemAuditLog, 
  PortalRole,
  AIModelsStatusResponse,
  URLPhishingResponse,
  EmailThreatResponse,
  SMSSpamResponse,
  ComplaintClassifierResponse,
  InvestigationAssistantResponse,
  InvestigationConversation,
  InvestigationChatMessage,
  CyberEntity,
  UserProfile,
  AppNotification,
  DepartmentItem,
  SystemHealth,
  SystemConfiguration,
  IntegrationItem,
  DatabaseStatus,
  DatabaseBackup,
  TrainingRuntimeStatus,
  TrainingJob,
  TrainingJobCreatePayload,
  TrainingValidationResult,
  ColabExportPackage
} from '../types';

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: any;

  constructor(status: number, message: string, code: string = 'API_ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || '/api/v1';

class APIClient {
  private token: string | null = null;
  private tokenListeners: Set<(token: string | null) => void> = new Set();

  constructor() {
    this.token = localStorage.getItem('ccip_access_token');
  }

  public onTokenChange(listener: (token: string | null) => void): () => void {
    this.tokenListeners.add(listener);
    return () => this.tokenListeners.delete(listener);
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('ccip_access_token', token);
    } else {
      localStorage.removeItem('ccip_access_token');
    }
    this.tokenListeners.forEach((cb) => {
      try {
        cb(token);
      } catch (err) {
        console.error('[APIClient] Token listener error:', err);
      }
    });
  }

  public getToken(): string | null {
    return this.token;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: { message: response.statusText } };
        }

        let message = 'An unexpected error occurred.';
        if (errorData?.detail) {
          if (typeof errorData.detail === 'string') {
            message = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            message = errorData.detail.map((d: any) => d.msg || `${d.loc?.join('.')} is invalid`).join(', ');
          }
        } else if (errorData?.error?.message) {
          message = errorData.error.message;
        } else if (errorData?.message) {
          message = errorData.message;
        } else if (response.status === 401) {
          message = 'Authentication failed. Please check your credentials or log in again.';
        } else if (response.status === 403) {
          message = 'Access denied. You do not have permission for this action.';
        } else if (response.status === 404) {
          message = 'The requested resource was not found.';
        } else if (response.status === 422) {
          message = 'Validation error. Please verify the information entered and try again.';
        } else if (response.status === 502 || response.status === 503 || response.status === 504) {
          message = 'Backend server is offline or unreachable on port 8000. Please ensure the backend is running.';
        } else if (response.status >= 500) {
          message = 'Internal server error. Please try again later.';
        }

        throw new ApiError(response.status, message, `HTTP_${response.status}`, errorData);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return (await response.text()) as any;
    } catch (error: any) {
      console.warn(`[CCIP API] Request to ${endpoint} failed:`, error);
      if (error instanceof ApiError) {
        throw error;
      }
      if (error?.name === 'TypeError' || error?.message?.includes('fetch') || error?.message?.includes('NetworkError')) {
        throw new ApiError(
          0,
          'Unable to connect to the CCIP secure server. Please ensure the backend server is running at http://localhost:8000.',
          'NETWORK_ERROR'
        );
      }
      throw new ApiError(500, error?.message || 'Network request failed.', 'CLIENT_ERROR');
    }
  }

  // AUTHENTICATION APIS
  async registerCitizen(data: { name: string; email: string; phone?: string; password: string }) {
    const res = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, consent: true })
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  async login(data: { email: string; password: string; mfa_code?: string; target_role?: string }) {
    const res = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  async getGoogleAuthUrl() {
    return await this.request<{
      configured: boolean;
      client_id?: string;
      authorization_url?: string;
      auth_url?: string;
      state?: string;
      message?: string;
    }>('/auth/google');
  }

  async googleAuth(data: { code?: string; credential?: string; id_token?: string; redirect_uri?: string }) {
    const res = await this.request<any>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  async exchangeGoogleTicket(auth_ticket: string) {
    const res = await this.request<any>('/auth/google/exchange', {
      method: 'POST',
      body: JSON.stringify({ auth_ticket })
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  async sendPhoneOTP(phone: string) {
    return await this.request<{ message: string; data?: { dev_otp?: string } }>('/auth/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
  }

  async verifyPhoneOTP(phone: string, otp: string, full_name?: string, email?: string) {
    const res = await this.request<any>('/auth/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, full_name, email })
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  async completePhoneOnboarding(onboarding_token: string, full_name: string, email?: string) {
    const res = await this.request<any>('/auth/phone/complete-onboarding', {
      method: 'POST',
      body: JSON.stringify({ onboarding_token, full_name, email })
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  async forgotPassword(email: string) {
    return await this.request<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async verifyOTP(email: string, otp: string) {
    return await this.request<any>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
  }

  async resetPassword(email: string, otp: string, new_password: string) {
    return await this.request<any>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password })
    });
  }

  async getMe() {
    return await this.request<any>('/auth/me');
  }

  async logout() {
    try {
      await this.request<any>('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // COMPLAINT APIS
  async getComplaints(params?: { category?: string; status?: string; search?: string }): Promise<Complaint[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return await this.request<Complaint[]>(`/complaints${qs}`);
  }

  async getComplaint(id: string): Promise<Complaint> {
    return await this.request<Complaint>(`/complaints/${id}`);
  }

  async trackComplaint(refNumber: string): Promise<Complaint> {
    return await this.request<Complaint>(`/complaints/track/${encodeURIComponent(refNumber)}`);
  }

  async createComplaint(data: any): Promise<Complaint> {
    return await this.request<Complaint>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateComplaint(id: string, data: any): Promise<Complaint> {
    return await this.request<Complaint>(`/complaints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // EVIDENCE APIS
  async getEvidenceList(params?: { complaint_id?: string; case_id?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.complaint_id) query.append('complaint_id', params.complaint_id);
    if (params?.case_id) query.append('case_id', params.case_id);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await this.request<any[]>(`/evidence${qs}`);
  }

  async getEvidence(): Promise<any[]> {
    return await this.getEvidenceList();
  }

  async uploadEvidence(complaintId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('complaint_id', complaintId);
    formData.append('file', file);

    return await this.request<any>('/evidence/upload', {
      method: 'POST',
      body: formData
    });
  }

  async downloadEvidence(evidenceId: string, customFilename?: string): Promise<void> {
    const url = `${API_BASE_URL}/evidence/${evidenceId}/download`;
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Failed to download file (${res.status})`);
    
    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition');
    let filename = customFilename || `evidence_${evidenceId}.bin`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  }

  async getEvidenceProcessingResult(evidenceId: string): Promise<any> {
    return await this.request<any>(`/evidence/${evidenceId}/processing-result`);
  }

  async processEvidence(evidenceId: string): Promise<any> {
    return await this.request<any>(`/evidence/${evidenceId}/process`, {
      method: 'POST'
    });
  }


  // CASE & POLICE APIS
  async getCases(params?: any): Promise<any[]> {
    return await this.request<any[]>('/cases');
  }

  async getPoliceDashboardStats(): Promise<any> {
    return await this.request<any>('/police/dashboard-stats');
  }

  async getOfficerWorkload(): Promise<any[]> {
    return await this.request<any[]>('/police/officer-workload');
  }

  async getEscalatedCases(): Promise<any[]> {
    return await this.request<any[]>('/police/escalations');
  }

  async getInterUnitCoordination(): Promise<any[]> {
    return await this.request<any[]>('/police/inter-unit-coordination');
  }

  async assignCase(caseId: string, data: { officer_id?: string; specialist_id?: string; notes?: string }): Promise<any> {
    return await this.request<any>(`/cases/${caseId}/assign`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCaseStatus(caseId: string, status: string, reason?: string): Promise<any> {
    return await this.request<any>(`/cases/${caseId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason })
    });
  }

  async reopenCase(caseId: string, reason: string): Promise<any> {
    return await this.request<any>(`/cases/${caseId}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async escalateCase(caseId: string, reason: string): Promise<any> {
    return await this.request<any>(`/cases/${caseId}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ is_escalated: true, escalation_reason: reason })
    });
  }

  async createCaseFromComplaint(complaintId: string): Promise<any> {
    return await this.request<any>(`/cases/from-complaint/${complaintId}`, {
      method: 'POST'
    });
  }

  async specialistTriageAction(caseId: string, data: { action: string; category?: string; confidence?: number; notes?: string; model_version?: string }): Promise<any> {
    return await this.request<any>(`/specialist/cases/${caseId}/triage-action`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // CYBER ENTITY EXTRACTION APIS
  async extractEntities(text: string): Promise<any> {
    return await this.request<any>('/ai/entities/extract', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  async getComplaintEntities(complaintId: string): Promise<CyberEntity[]> {
    return await this.request<CyberEntity[]>(`/complaints/${complaintId}/entities`);
  }

  async getCaseEntities(caseId: string): Promise<CyberEntity[]> {
    return await this.request<CyberEntity[]>(`/cases/${caseId}/entities`);
  }

  async extractComplaintEntities(complaintId: string): Promise<CyberEntity[]> {
    return await this.request<CyberEntity[]>(`/complaints/${complaintId}/extract-entities`, {
      method: 'POST'
    });
  }

  // SPECIALIST & THREAT APIS
  async getThreatFeeds(): Promise<ThreatFeedItem[]> {
    return await this.request<ThreatFeedItem[]>('/specialist/threat-intelligence');
  }

  async getCorrelationNodes(): Promise<CorrelatedNode[]> {
    return await this.request<CorrelatedNode[]>('/specialist/correlation-nodes');
  }

  async getValidationQueue(): Promise<any[]> {
    return await this.request<any[]>('/specialist/validation-queue');
  }

  // -------------------------------------------------------------------------
  // AI MODEL VERIFICATION & REAL INFERENCE APIS
  // -------------------------------------------------------------------------
  async getAIModelsStatus(): Promise<AIModelsStatusResponse> {
    return await this.request<AIModelsStatusResponse>('/ai/models/status');
  }

  async analyzeUrl(url: string): Promise<URLPhishingResponse> {
    return await this.request<URLPhishingResponse>('/ai/test/url', {
      method: 'POST',
      body: JSON.stringify({ url })
    });
  }

  async analyzeEmail(text: string): Promise<EmailThreatResponse> {
    return await this.request<EmailThreatResponse>('/ai/test/email', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  async analyzeSms(text: string): Promise<SMSSpamResponse> {
    return await this.request<SMSSpamResponse>('/ai/test/sms', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  async classifyComplaint(text: string): Promise<ComplaintClassifierResponse> {
    return await this.request<ComplaintClassifierResponse>('/ai/test/complaint', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  async queryAIAssistant(prompt: string, context?: any): Promise<InvestigationAssistantResponse> {
    try {
      return await this.request<InvestigationAssistantResponse>('/specialist/ai-assistant', {
        method: 'POST',
        body: JSON.stringify({ prompt, text: prompt, context })
      });
    } catch {
      return await this.request<InvestigationAssistantResponse>('/ai/assistant/query', {
        method: 'POST',
        body: JSON.stringify({ text: prompt, prompt, context })
      });
    }
  }

  async getAIAssistantStatus(): Promise<any> {
    try {
      return await this.request<any>('/investigation-assistant/status');
    } catch {
      return await this.request<any>('/ai/assistant/status');
    }
  }

  async createInvestigationConversation(caseId?: string, title?: string): Promise<InvestigationConversation> {
    return await this.request<InvestigationConversation>('/investigation-assistant/conversations', {
      method: 'POST',
      body: JSON.stringify({ case_id: caseId, title })
    });
  }

  async listInvestigationConversations(caseId?: string): Promise<InvestigationConversation[]> {
    const q = caseId ? `?case_id=${encodeURIComponent(caseId)}` : '';
    return await this.request<InvestigationConversation[]>(`/investigation-assistant/conversations${q}`);
  }

  async getInvestigationConversation(id: string): Promise<InvestigationConversation> {
    return await this.request<InvestigationConversation>(`/investigation-assistant/conversations/${id}`);
  }

  async archiveInvestigationConversation(id: string): Promise<any> {
    return await this.request<any>(`/investigation-assistant/conversations/${id}/archive`, {
      method: 'POST'
    });
  }

  async getCaseAssistantSuggestions(caseId: string): Promise<{ case_id: string; suggestions: string[] }> {
    try {
      return await this.request<{ case_id: string; suggestions: string[] }>(`/investigation-assistant/suggestions/${caseId}`);
    } catch {
      return await this.request<{ case_id: string; suggestions: string[] }>(`/cases/${caseId}/assistant/suggestions`);
    }
  }

  async streamInvestigationChat(
    params: { conversation_id?: string; case_id: string; message: string },
    onEvent: (event: { event: string; data: any }) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const url = `${API_BASE_URL}/investigation-assistant/chat/stream`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
      signal: abortSignal
    });

    if (!response.ok) {
      let errText = `Inference failed with status ${response.status}`;
      try {
        const json = await response.json();
        if (json.detail) errText = json.detail;
      } catch {}
      throw new Error(errText);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported in this runtime.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const lines = part.split('\n');
          let currentEvent = 'message';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              dataStr = line.substring(5).trim();
            }
          }

          if (dataStr) {
            try {
              const parsed = JSON.parse(dataStr);
              onEvent({ event: currentEvent, data: parsed });
            } catch {
              onEvent({ event: currentEvent, data: dataStr });
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }


  // INVESTIGATIONS APIS
  async getInvestigationByCase(caseId: string): Promise<any> {
    return await this.request<any>(`/investigations/by-case/${caseId}`);
  }

  async addInvestigationAction(investigationId: string, data: { action_type: string; title?: string; details?: string; description?: string; performed_by?: string; results?: any; metadata?: any }): Promise<any> {
    return await this.request<any>(`/investigations/${investigationId}/actions`, {
      method: 'POST',
      body: JSON.stringify({
        action_type: data.action_type,
        title: data.title || data.action_type,
        details: data.details || data.description || '',
        results: data.results || data.metadata || {}
      })
    });
  }

  async addInvestigationFinding(investigationId: string, data: { finding_type: string; title?: string; summary?: string; description?: string; confidence_score?: number; evidence_refs?: string[]; metadata?: any }): Promise<any> {
    return await this.request<any>(`/investigations/${investigationId}/findings`, {
      method: 'POST',
      body: JSON.stringify({
        finding_type: data.finding_type,
        title: data.title || data.finding_type,
        summary: data.summary || data.description || '',
        confidence_score: data.confidence_score !== undefined ? data.confidence_score : 0.95,
        evidence_refs: data.evidence_refs || []
      })
    });
  }

  // MLOPS & MODEL APIS
  async getAIModels(): Promise<ModelMetric[]> {
    return await this.request<ModelMetric[]>('/mlops/models');
  }

  async triggerRetraining(modelId: string): Promise<any> {
    return await this.request<any>('/mlops/retrain', {
      method: 'POST',
      body: JSON.stringify({ model_id: modelId })
    });
  }

  async getDatasets(): Promise<any[]> {
    return await this.request<any[]>('/mlops/datasets');
  }

  async createDataset(data: { name: string; category?: string; dataset_type?: string; version?: string; samples_count?: number; size_bytes?: number; description?: string; metadata?: any }): Promise<any> {
    return await this.request<any>('/mlops/datasets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async rollbackModel(modelId: string, targetVersion: string): Promise<any> {
    return await this.request<any>('/mlops/rollback', {
      method: 'POST',
      body: JSON.stringify({ model_id: modelId, target_version: targetVersion })
    });
  }

  async getContinuousLearningBuffer(): Promise<any> {
    return await this.request<any>('/mlops/continuous-learning-buffer');
  }

  // ADMIN APIS
  async getAdminUsers(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    role?: string;
    status?: string;
    department_id?: string;
    verification_status?: string;
    paginate?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) query.set('page', params.page.toString());
      if (params.page_size !== undefined) query.set('page_size', params.page_size.toString());
      if (params.search) query.set('search', params.search);
      if (params.role) query.set('role', params.role);
      if (params.status) query.set('status', params.status);
      if (params.department_id) query.set('department_id', params.department_id);
      if (params.verification_status) query.set('verification_status', params.verification_status);
      if (params.paginate !== undefined) query.set('paginate', params.paginate ? 'true' : 'false');
      if (params.skip !== undefined) query.set('skip', params.skip.toString());
      if (params.limit !== undefined) query.set('limit', params.limit.toString());
    }
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return await this.request<any>(`/admin/users${qStr}`);
  }

  async getAdminUser(userId: string): Promise<any> {
    return await this.request<any>(`/admin/users/${userId}`);
  }

  async createAdminUser(data: any): Promise<any> {
    return await this.request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateAdminUser(userId: string, data: any): Promise<any> {
    return await this.request<any>(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async activateAdminUser(userId: string): Promise<any> {
    return await this.request<any>(`/admin/users/${userId}/activate`, {
      method: 'POST'
    });
  }

  async suspendAdminUser(userId: string, reason?: string): Promise<any> {
    return await this.request<any>(`/admin/users/${userId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async disableAdminUser(userId: string, reason?: string): Promise<any> {
    return await this.request<any>(`/admin/users/${userId}/disable`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async getAdminUserAudit(userId: string): Promise<any[]> {
    return await this.request<any[]>(`/admin/users/${userId}/audit`);
  }

  async getAdminAuditLogs(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    actor?: string;
    action?: string;
    status?: string;
  }): Promise<SystemAuditLog[]> {
    const query = new URLSearchParams();
    if (params) {
      if (params.skip !== undefined) query.set('skip', params.skip.toString());
      if (params.limit !== undefined) query.set('limit', params.limit.toString());
      if (params.search) query.set('search', params.search);
      if (params.actor) query.set('actor', params.actor);
      if (params.action) query.set('action', params.action);
      if (params.status) query.set('status', params.status);
    }
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return await this.request<SystemAuditLog[]>(`/admin/audit-logs${qStr}`);
  }

  async exportAuditLogs(
    format: 'csv' | 'json' = 'csv',
    params?: { search?: string; actor?: string; action?: string; status?: string }
  ): Promise<void> {
    const query = new URLSearchParams();
    query.set('format', format);
    if (params) {
      if (params.search) query.set('search', params.search);
      if (params.actor) query.set('actor', params.actor);
      if (params.action) query.set('action', params.action);
      if (params.status) query.set('status', params.status);
    }
    const url = `${API_BASE_URL}/admin/audit-logs/export?${query.toString()}`;
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new ApiError(res.status, 'Failed to export audit logs');
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `ccip_audit_export_${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  }

  async getDepartments(): Promise<DepartmentItem[]> {
    return await this.request<DepartmentItem[]>('/admin/departments');
  }

  async createDepartment(data: { name: string; code: string; description?: string; jurisdiction?: string; isActive?: boolean }): Promise<DepartmentItem> {
    return await this.request<DepartmentItem>('/admin/departments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateDepartment(departmentId: string, data: { name?: string; code?: string; description?: string; jurisdiction?: string; isActive?: boolean }): Promise<DepartmentItem> {
    return await this.request<DepartmentItem>(`/admin/departments/${departmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return await this.request<SystemHealth>('/admin/system-health');
  }

  async getSystemConfiguration(): Promise<SystemConfiguration> {
    return await this.request<SystemConfiguration>('/admin/system-configuration');
  }

  async getIntegrationsStatus(): Promise<IntegrationItem[]> {
    return await this.request<IntegrationItem[]>('/admin/integrations');
  }

  async getDatabaseStatus(): Promise<DatabaseStatus> {
    return await this.request<DatabaseStatus>('/admin/database/status');
  }

  async createDatabaseBackup(): Promise<DatabaseBackup> {
    return await this.request<DatabaseBackup>('/admin/database/backups', {
      method: 'POST'
    });
  }

  async getDatabaseBackups(): Promise<DatabaseBackup[]> {
    return await this.request<DatabaseBackup[]>('/admin/database/backups');
  }

  async getUserProfile(): Promise<UserProfile> {
    return await this.request<UserProfile>('/users/profile');
  }

  async updateUserProfile(data: { full_name?: string; phone_number?: string }): Promise<UserProfile> {
    return await this.request<UserProfile>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // TASKS
  async getTaskStatus(taskId: string): Promise<any> {
    return await this.request<any>(`/tasks/${taskId}`);
  }

  // CITIZEN TELEMETRY & STATS APIS
  async getComplaintTelemetry(): Promise<{ period: string; data: { month: string; submitted: number; resolved: number }[] }> {
    return await this.request<{ period: string; data: { month: string; submitted: number; resolved: number }[] }>('/complaints/telemetry/timeseries');
  }

  async getComplaintRegionsStats(): Promise<{ regions: { name: string; count: number; percentage: number }[] }> {
    return await this.request<{ regions: { name: string; count: number; percentage: number }[] }>('/complaints/stats/regions');
  }

  async getComplaintCategoriesStats(): Promise<{ categories: { category: string; count: number; percentage: number }[] }> {
    return await this.request<{ categories: { category: string; count: number; percentage: number }[] }>('/complaints/stats/categories');
  }

  // MINIMAL DASHBOARD SUMMARY APIS (PHASE 19)
  async getCitizenDashboardSummary(): Promise<{
    total_complaints: number;
    under_investigation: number;
    action_required: number;
    resolved_cases: number;
    recovery_index: number;
    inter_agency_nodes: number;
    avg_triage_hours: number;
    recent_complaints: Complaint[];
  }> {
    return await this.request<any>('/citizen/dashboard-summary');
  }

  async getSpecialistDashboardSummary(): Promise<{
    assigned_cases: number;
    under_investigation: number;
    critical_cases: number;
    total_iocs: number;
    active_blocks: number;
    evidence_count: number;
    pending_validation_findings: number;
    correlation_nodes_count: number;
  }> {
    return await this.request<any>('/specialist/dashboard-summary');
  }

  async getPoliceDashboardSummary(): Promise<{
    totalCases: number;
    activeCases: number;
    criticalCases: number;
    escalatedCases: number;
    resolvedCases: number;
    officersCount: number;
    clearanceRate: number;
    warrantsActive: number;
    assetFreezes: number;
    interpolSync: string;
  }> {
    return await this.request<any>('/police/dashboard-summary');
  }

  async getAdminDashboardSummary(): Promise<{
    total_users: number;
    active_users: number;
    roles_breakdown: Record<string, number>;
    total_departments: number;
    total_audit_logs: number;
  }> {
    return await this.request<any>('/admin/dashboard-summary');
  }

  async getAIDashboardSummary(): Promise<{
    total_models: number;
    models_available: number;
    models_loaded: number;
    models: Record<string, any>;
  }> {
    return await this.request<any>('/ai/dashboard-summary');
  }




  // REPORTS APIS
  async getReports(params?: { case_id?: string; report_type?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.case_id) query.append('case_id', params.case_id);
    if (params?.report_type) query.append('report_type', params.report_type);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await this.request<any[]>(`/reports${qs}`);
  }

  async createReport(data: { report_type: string; title: string; summary: string; case_id?: string; content_json?: any }): Promise<any> {
    return await this.request<any>('/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async exportReport(reportId: string, format: string = 'json'): Promise<any> {
    const url = `${API_BASE_URL}/reports/${reportId}/export?format=${format}`;
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Export failed (${res.status})`);

    if (format === 'json') {
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `report_${reportId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      return data;
    } else {
      const text = await res.text();
      const blob = new Blob([text], { type: format === 'csv' ? 'text/csv' : 'text/plain' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `report_${reportId}.${format === 'csv' ? 'csv' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      return text;
    }
  }

  // NOTIFICATIONS
  async getNotifications(params?: {
    notification_type?: string;
    severity?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }): Promise<AppNotification[]> {
    const query = new URLSearchParams();
    if (params) {
      if (params.notification_type) query.set('notification_type', params.notification_type);
      if (params.severity) query.set('severity', params.severity);
      if (params.search) query.set('search', params.search);
      if (params.limit !== undefined) query.set('limit', params.limit.toString());
      if (params.skip !== undefined) query.set('skip', params.skip.toString());
    }
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return await this.request<AppNotification[]>(`/notifications${qStr}`);
  }

  async getUnreadNotificationsCount(): Promise<{ unread_count: number }> {
    return await this.request<{ unread_count: number }>('/notifications/unread-count');
  }

  async markNotificationRead(id: string): Promise<any> {
    return await this.request<any>(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  }

  async markAllNotificationsRead(): Promise<any> {
    return await this.request<any>('/notifications/read-all', {
      method: 'POST'
    });
  }

  async deleteNotification(id: string): Promise<any> {
    return await this.request<any>(`/notifications/${id}`, {
      method: 'DELETE'
    });
  }

  // PHASE J MULTI-MODEL & CITIZEN AI ASSISTANT APIs

  async assistCitizen(content: string, queryType: string = 'auto'): Promise<any> {
    return await this.request<any>('/ai/citizen/assist', {
      method: 'POST',
      body: JSON.stringify({ content, query_type: queryType })
    });
  }

  async refreshCaseIntelligence(caseId: string): Promise<any> {
    return await this.request<any>(`/cases/${caseId}/intelligence/refresh`, {
      method: 'POST'
    });
  }

  async getSimilarCases(caseId: string, limit: number = 5): Promise<any> {
    return await this.request<any>(`/cases/${caseId}/similar-cases?limit=${limit}`);
  }

  async getCaseUrgency(caseId: string): Promise<any> {
    return await this.request<any>(`/cases/${caseId}/urgency`);
  }

  async getComplaintRelations(complaintId: string): Promise<any[]> {
    return await this.request<any[]>(`/complaints/${complaintId}/relations`);
  }

  async extractComplaintRelations(complaintId: string): Promise<any> {
    return await this.request<any>(`/complaints/${complaintId}/extract-relations`, {
      method: 'POST'
    });
  }

  async getCaseCorrelations(caseId: string): Promise<any[]> {
    return await this.request<any[]>(`/cases/${caseId}/correlations`);
  }

  async reviewCaseCorrelation(correlationId: string, status: string, notes?: string): Promise<any> {
    return await this.request<any>(`/case-correlations/${correlationId}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, notes })
    });
  }

  async getCaseEvidenceGraph(caseId: string): Promise<any> {
    return await this.request<any>(`/cases/${caseId}/evidence-graph`);
  }

  async evaluateFeedbackGate(caseId: string, targetModel: string, features: Record<string, any>): Promise<any> {
    return await this.request<any>('/ai/feedback-gate/evaluate', {
      method: 'POST',
      body: JSON.stringify({ case_id: caseId, target_model: targetModel, features })
    });
  }

  async getLearningCandidates(status?: string): Promise<any[]> {
    const url = status ? `/learning-candidates?status=${status}` : '/learning-candidates';
    return await this.request<any[]>(url);
  }

  async reviewLearningCandidate(candidateId: string, status: string, notes?: string): Promise<any> {
    return await this.request<any>(`/learning-candidates/${candidateId}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, notes })
    });
  }

  // Phase M: Real-World Pilot & Validation APIs
  async getPilotDatasets(): Promise<any[]> {
    return await this.request<any[]>('/pilot/datasets');
  }

  async getPilotRuns(): Promise<any[]> {
    return await this.request<any[]>('/pilot/runs');
  }

  async getPilotPredictions(flaggedOnly: boolean = false): Promise<any[]> {
    const query = flaggedOnly ? '?flagged_only=true' : '';
    return await this.request<any[]>(`/pilot/predictions${query}`);
  }

  async submitPilotReview(
    predictionId: string,
    decision: 'AGREE' | 'OVERRIDE' | 'FLAG_FOR_ESCALATION',
    correctedOutput?: any,
    overrideCategory?: string,
    reason?: string
  ): Promise<any> {
    return await this.request<any>('/pilot/reviews', {
      method: 'POST',
      body: JSON.stringify({
        prediction_id: predictionId,
        decision,
        corrected_output: correctedOutput,
        override_category: overrideCategory,
        reason
      })
    });
  }

  // Citizen Complaint Lifecycle Timeline
  async getCitizenComplaintTimeline(complaintId: string): Promise<any> {
    return await this.request<any>(`/citizen/complaints/${complaintId}/timeline`);
  }

  // ---------------------------------------------------------------------------
  // Controlled ML Training Workspace APIs
  // ---------------------------------------------------------------------------

  async getTrainingRuntimeStatus(): Promise<TrainingRuntimeStatus> {
    return await this.request<TrainingRuntimeStatus>('/mlops/training-runtime/status');
  }

  async getTrainingJobs(modelFamily?: string, status?: string): Promise<TrainingJob[]> {
    const params = new URLSearchParams();
    if (modelFamily) params.append('model_family', modelFamily);
    if (status) params.append('status', status);
    const q = params.toString();
    return await this.request<TrainingJob[]>(`/mlops/training-jobs${q ? '?' + q : ''}`);
  }

  async getTrainingJob(id: string): Promise<TrainingJob> {
    return await this.request<TrainingJob>(`/mlops/training-jobs/${id}`);
  }

  async createTrainingJob(data: TrainingJobCreatePayload): Promise<{ id: string; job_reference: string; status: string; message: string }> {
    return await this.request<{ id: string; job_reference: string; status: string; message: string }>('/mlops/training-jobs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTrainingJob(id: string, data: Partial<TrainingJobCreatePayload> & { config_json?: any; quality_gate_config_json?: any; notes?: string; target_model_version?: string }): Promise<{ message: string; status: string }> {
    return await this.request<{ message: string; status: string }>(`/mlops/training-jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async validateTrainingJob(id: string): Promise<TrainingValidationResult> {
    return await this.request<TrainingValidationResult>(`/mlops/training-jobs/${id}/validate`, {
      method: 'POST'
    });
  }

  async startTrainingJob(id: string): Promise<{ message: string; job_id: string; status: string }> {
    return await this.request<{ message: string; job_id: string; status: string }>(`/mlops/training-jobs/${id}/start`, {
      method: 'POST'
    });
  }

  async cancelTrainingJob(id: string): Promise<{ message: string; job_id: string; status: string }> {
    return await this.request<{ message: string; job_id: string; status: string }>(`/mlops/training-jobs/${id}/cancel`, {
      method: 'POST'
    });
  }

  async getTrainingLogs(id: string): Promise<{ job_id: string; logs: string[] }> {
    return await this.request<{ job_id: string; logs: string[] }>(`/mlops/training-jobs/${id}/logs`);
  }

  async getTrainingMetrics(id: string): Promise<{ job_id: string; job_reference: string; metrics: any; quality_gates: any }> {
    return await this.request<{ job_id: string; job_reference: string; metrics: any; quality_gates: any }>(`/mlops/training-jobs/${id}/metrics`);
  }

  async getTrainingCheckpoints(id: string): Promise<{ job_id: string; checkpoints: { name: string; size_bytes: number; is_best: boolean }[] }> {
    return await this.request<{ job_id: string; checkpoints: { name: string; size_bytes: number; is_best: boolean }[] }>(`/mlops/training-jobs/${id}/checkpoints`);
  }

  async exportTrainingPackage(id: string): Promise<ColabExportPackage> {
    return await this.request<ColabExportPackage>(`/mlops/training-jobs/${id}/export-package`, {
      method: 'POST'
    });
  }

  async registerTrainingCandidate(id: string, notes?: string): Promise<{ message: string; candidate_version: string; status: string }> {
    return await this.request<{ message: string; candidate_version: string; status: string }>(`/mlops/training-jobs/${id}/register-candidate`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
  }

  async submitTrainingForApproval(id: string, notes: string): Promise<{ message: string; candidate_version: string; approval_status: string }> {
    return await this.request<{ message: string; candidate_version: string; approval_status: string }>(`/mlops/training-jobs/${id}/submit-for-approval`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
  }
}

export const apiClient = new APIClient();

