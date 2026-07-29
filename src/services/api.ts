import { EmergencyAlert, EmergencyContact, NotificationLog, User } from '../types';

const API_BASE = '/api';

// Helper to get stored JWT token
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('sos-session-token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Helper to handle 401 responses (token expired) and attempt refresh
const handleAuthResponse = async (res: Response): Promise<Response> => {
  if (res.status === 401) {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem('sos-session-token', data.token);
      } else {
        localStorage.removeItem('sos-session-token');
      }
    } catch {
      localStorage.removeItem('sos-session-token');
    }
  }
  return res;
};

export const api = {
  // Auth
  async login(email: string, role: 'USER' | 'ADMIN', password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, role, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async register(payload: { name: string; email: string; phone: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    await handleAuthResponse(res);
    if (!res.ok) {
      throw new Error('Failed to get current user');
    }
    return res.json();
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    localStorage.removeItem('sos-session-token');
  },

  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to request password reset');
    return data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset password');
    return data;
  },

  // Emergency Contacts
  async getContacts(): Promise<EmergencyContact[]> {
    const res = await fetch(`${API_BASE}/contacts`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    await handleAuthResponse(res);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async addContact(contact: Partial<EmergencyContact>): Promise<EmergencyContact> {
    const res = await fetch(`${API_BASE}/contacts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(contact),
    });
    return res.json();
  },

  async verifyContact(id: string, code: string): Promise<any> {
    const res = await fetch(`${API_BASE}/contacts/${id}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ code }),
    });
    return res.json();
  },

  async resendContactVerification(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/contacts/${id}/resend-verification`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return res.json();
  },

  async deleteContact(id: string): Promise<void> {
    await fetch(`${API_BASE}/contacts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  },

  async editContact(id: string, contact: Partial<EmergencyContact>): Promise<EmergencyContact> {
    const res = await fetch(`${API_BASE}/contacts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(contact),
    });
    return res.json();
  },

  async testContactNotification(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/contacts/${id}/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return res.json();
  },

  // Emergency Alerts
  async triggerAlert(payload: {
    location?: any;
    batteryLevel?: number;
    ambientAudioRecorded?: boolean;
    triggerMethod?: string;
  }): Promise<EmergencyAlert> {
    const res = await fetch(`${API_BASE}/alerts/trigger`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to trigger alert');
    }
    const data = await res.json();
    return data.alert || data;
  },

  async uploadAudio(alertId: string, audioBlob: Blob): Promise<{ success: boolean; audioUrl: string; recording: any }> {
    const token = localStorage.getItem('sos-session-token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const formData = new FormData();
    formData.append('audio', audioBlob, 'ambient-recording.webm');

    const res = await fetch(`${API_BASE}/alerts/${alertId}/audio`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    return res.json();
  },

  async updateLocation(alertId: string, location: any, batteryLevel: number): Promise<EmergencyAlert> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/location`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ location, batteryLevel }),
    });
    return res.json();
  },

  async updateAlertStatus(alertId: string, status: string, pin?: string, notes?: string): Promise<EmergencyAlert> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status, pin, notes }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update alert status');
    }
    return res.json();
  },

  async getAlertByToken(token: string): Promise<EmergencyAlert> {
    const res = await fetch(`${API_BASE}/alerts/track/${token}`);
    if (!res.ok) {
      throw new Error('Tracking token not found or expired.');
    }
    return res.json();
  },

  async getActiveAlerts(): Promise<EmergencyAlert[]> {
    const res = await fetch(`${API_BASE}/alerts/active`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    await handleAuthResponse(res);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.alerts || []);
  },

  async getAllAlerts(page = 1, limit = 20): Promise<EmergencyAlert[]> {
    const res = await fetch(`${API_BASE}/alerts/all?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    await handleAuthResponse(res);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.alerts || []);
  },

  async getLogs(page = 1, limit = 20): Promise<NotificationLog[]> {
    const res = await fetch(`${API_BASE}/alerts/logs?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    await handleAuthResponse(res);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.logs || []);
  }
};
