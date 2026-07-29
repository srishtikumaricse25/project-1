export type AlertStatus = 'ACTIVE' | 'DISPATCHED' | 'RESOLVED' | 'FALSE_ALARM' | 'ACCEPTED' | 'NAVIGATING' | 'ARRIVED';
export type ContactPriority = 'PRIMARY' | 'SECONDARY';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'USER' | 'ADMIN';
  deactivationPin?: string;
  stealthCode?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  priority: ContactPriority;
  isVerified: boolean;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  timestamp: number;
  address?: string;
}

export interface EmergencyAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  status: AlertStatus;
  location: GeoLocation;
  breadcrumbs: GeoLocation[];
  batteryLevel: number;
  ambientAudioRecorded: boolean;
  contactsNotifiedCount: number;
  trackingToken: string;
  createdAt: string;
  resolvedAt?: string;
  dispatcherNotes?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface NotificationLog {
  id: string;
  alertId: string;
  contactName: string;
  channel: 'SMS' | 'EMAIL';
  recipient: string;
  message: string;
  status: 'DELIVERED' | 'SIMULATED' | 'FAILED';
  timestamp: string;
}

// Timeline event for an alert
export interface AlertTimelineEvent {
  time: string; // ISO timestamp
  label: string; // Human‑readable label, e.g., 'SOS Triggered'
}

export interface SafetyCheckInConfig {
  enabled: boolean;
  intervalMinutes: number;
  nextCheckInTime: number | null;
}
