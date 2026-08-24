const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // If sending FormData (e.g. file upload), remove Content-Type to let browser set boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized and not on login/register, clear token
    if (!endpoint.includes('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  // Handle blob or text if requested
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/')) {
    return response.text();
  }
  return response.json();
}

export const api = {
  // Module 1: Auth & Roles
  auth: {
    login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getMe: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),
    forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (email, token, newPassword) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, token, new_password: newPassword }) }),
  },

  // Module 2: User Profile
  users: {
    getProfile: () => request('/users/profile'),
    updateProfile: (data) => request('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
    listAll: () => request('/users/'),
  },

  // Module 3 & 4: Meeting Scheduling & Participants
  meetings: {
    getAll: (statusFilter, page = 1, pageSize = 20) => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status_filter', statusFilter);
      params.append('page', page);
      params.append('page_size', pageSize);
      return request(`/meetings/?${params.toString()}`);
    },
    getParticipants: (id, page = 1, pageSize = 20) => request(`/meetings/${id}/participants?page=${page}&page_size=${pageSize}`),
    getById: (id) => request(`/meetings/${id}`),
    create: (data) => request('/meetings/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/meetings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/meetings/${id}`, { method: 'DELETE' }),
    addParticipant: (meetingId, data) => request(`/meetings/${meetingId}/participants`, { method: 'POST', body: JSON.stringify(data) }),
    removeParticipant: (meetingId, participantId) => request(`/meetings/${meetingId}/participants/${participantId}`, { method: 'DELETE' }),
    sendEmailDigest: (meetingId, payload) => request(`/meetings/${meetingId}/send-email-digest`, { method: 'POST', body: JSON.stringify(payload || {}) }),
    sendHighRiskAlerts: (meetingId) => request(`/meetings/${meetingId}/send-high-risk-alerts`, { method: 'POST' }),
    reschedule: (meetingId, data) => request(`/meetings/${meetingId}/reschedule`, { method: 'POST', body: JSON.stringify(data) }),
    requestReschedule: (meetingId, data) => request(`/meetings/${meetingId}/request-reschedule`, { method: 'POST', body: JSON.stringify(data) }),
    updateAttendance: (meetingId, participantId, attended) => request(`/meetings/${meetingId}/participants/${participantId}/attendance`, { method: 'PUT', body: JSON.stringify({ attended }) }),
    updateSpeakerMapping: (meetingId, mapping) => request(`/meetings/${meetingId}/speaker-mapping`, { method: 'PUT', body: JSON.stringify({ speaker_mapping: mapping }) }),
  },

  // Module 5: Audio Recording & Upload
  audio: {
    upload: (meetingId, formData) => request(`/audio/upload/${meetingId}`, { method: 'POST', body: formData }),
    getRecordings: (meetingId) => request(`/audio/meeting/${meetingId}`),
    getStreamUrl: (recordingId) => `${API_BASE_URL}/audio/stream/${recordingId}`,
  },

  // Module 6 & 7: STT & Speaker Diarization
  transcription: {
    processSTT: (meetingId) => request(`/transcription/process/${meetingId}`, { method: 'POST' }),
    getByMeeting: (meetingId, page = 1, pageSize = 20) => request(`/transcription/meeting/${meetingId}?page=${page}&page_size=${pageSize}`),
    download: (meetingId, format = 'txt') => `${API_BASE_URL}/transcription/download/${meetingId}?format=${format}`,
  },

  // Module 8, 9, 12: Intelligence (Summary, Decisions, Tasks)
  intelligence: {
    generateAll: (meetingId) => request(`/intelligence/process/${meetingId}`, { method: 'POST' }),
    getSummary: (meetingId) => request(`/intelligence/summary/${meetingId}`),
    getDecisions: (meetingId) => request(`/intelligence/decisions/${meetingId}`),
    createDecision: (data) => request('/intelligence/decisions', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Module 10: Tasks
  tasks: {
    getAll: (filters = {}, page = 1, pageSize = 20) => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status_filter', filters.status);
      if (filters.priority) params.append('priority_filter', filters.priority);
      if (filters.risk) params.append('risk_filter', filters.risk);
      if (filters.meetingId) params.append('meeting_id', filters.meetingId);
      params.append('page', page);
      params.append('page_size', pageSize);
      return request(`/tasks/?${params.toString()}`);
    },
    create: (data) => request('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
    getById: (id) => request(`/tasks/${id}`),
    update: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  },

  // Module 11: ML Risk Prediction
  risk: {
    predict: (data) => request('/risk/predict', { method: 'POST', body: JSON.stringify(data) }),
    getMetrics: () => request('/risk/metrics'),
  },

  // Module 13: Search
  search: {
    query: (q, meetingId, page = 1, pageSize = 20) => {
      const params = new URLSearchParams();
      params.append('q', q);
      if (meetingId) params.append('meeting_id', meetingId);
      params.append('page', page);
      params.append('page_size', pageSize);
      return request(`/search/?${params.toString()}`);
    },
  },

  // Module 14: Notifications
  notifications: {
    getAll: (unreadOnly = false, page = 1, pageSize = 20) => request(`/notifications/?unread_only=${unreadOnly}&page=${page}&page_size=${pageSize}`),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
    triggerDemo: () => request('/notifications/trigger-demo-alerts', { method: 'POST' }),
  },

  // Module 15 & 16: Dashboard, Analytics & Export
  dashboard: {
    getSummary: () => request('/dashboard/summary'),
    getInsights: () => request('/dashboard/insights/analytics'),
    getReportMarkdown: (meetingId) => request(`/dashboard/report/export/${meetingId}`),
  },

  // Module 15: AI Chatbox
  chat: {
    query: (query, meetingId, chatHistory = []) => request('/chat/query', {
      method: 'POST',
      body: JSON.stringify({ query, meeting_id: meetingId, chat_history: chatHistory })
    }),
  },

  // Module 17: Agentic AI & n8n
  agent: {
    executeMeetingAutomations: (meetingId, webhookUrl) => request(`/agent/execute-meeting-automations/${meetingId}`, {
      method: 'POST',
      body: JSON.stringify({ meeting_id: meetingId, action_type: 'analyze_followups', n8n_webhook_url: webhookUrl })
    }),
    testN8N: (data) => request('/agent/test-n8n-trigger', { method: 'POST', body: JSON.stringify(data) }),
    getLogs: (meetingId) => request(`/agent/logs${meetingId ? `?meeting_id=${meetingId}` : ''}`),
  }
};
