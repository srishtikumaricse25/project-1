import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  Organization,
  User,
  EmergencyContact,
  Alert,
  LocationHistory,
  Notification,
  AudioRecording,
  Device,
  PushSubscription,
  Session,
  AuditLog
} from './models/index.js';
import {
  encryptField,
  decryptField,
  encryptObjectFields,
  decryptObjectFields
} from './utils/encryption.js';
import { logger } from './utils/logger.js';

// Senior Backend Security Standard: 12 bcrypt salt rounds
const defaultUserPasswordHash = bcrypt.hashSync('password123', 12);
const defaultAdminPasswordHash = bcrypt.hashSync('admin123', 12);
const demoPasswordHash = bcrypt.hashSync('12345678', 12);

const initialOrganizations = [
  {
    id: 'org-101',
    name: 'Roorkee Institute of Technology (RIT)',
    type: 'COLLEGE',
    code: 'RIT-ROORKEE',
    contactEmail: 'safety@ritroorkee.com',
    contactPhone: '+91 1332 234 567'
  },
  {
    id: 'org-102',
    name: 'Global University Campus',
    type: 'UNIVERSITY',
    code: 'GUC-MAIN',
    contactEmail: 'security@guc.edu',
    contactPhone: '+1 (555) 911-0000'
  }
];

const initialUsers = [
  {
    id: 'u-101',
    organizationId: 'org-101',
    orgRole: 'USER',
    name: 'Srishti',
    email: 'srishtiankita38@gmail.com',
    phone: '+1 (555) 234-5678',
    passwordHash: defaultUserPasswordHash,
    role: 'USER',
    isVerified: false,
    deactivationPin: '1234',
    stealthCode: '9999'
  },
  {
    id: 'admin-1',
    organizationId: 'org-101',
    orgRole: 'ADMIN',
    name: 'Campus Security Desk',
    email: 'security@university.edu',
    phone: '+1 (555) 911-0000',
    passwordHash: defaultAdminPasswordHash,
    role: 'ADMIN',
    isVerified: true
  },
  {
    id: 'u-demo',
    organizationId: 'org-101',
    orgRole: 'USER',
    name: 'Demo User',
    email: 'srishtikumari.cse25@ritroorkee.com',
    phone: '+1 (555) 000-0000',
    passwordHash: demoPasswordHash,
    role: 'USER',
    isVerified: true,
    deactivationPin: '1234',
    stealthCode: '9999'
  }
];

const initialContacts = [
  {
    id: 'c-1',
    userId: 'u-101',
    name: 'Rohan Sharma',
    phone: '+1 (555) 987-6543',
    email: 'rohan.sharma@example.com',
    relationship: 'Brother',
    priority: 'PRIMARY',
    isVerified: true
  },
  {
    id: 'c-2',
    userId: 'u-101',
    name: 'Dr. Ananya Roy',
    phone: '+1 (555) 876-5432',
    email: 'ananya.roy@university.edu',
    relationship: 'Hostel Warden',
    priority: 'PRIMARY',
    isVerified: true
  },
  {
    id: 'c-3',
    userId: 'u-101',
    name: 'Priya Verma',
    phone: '+1 (555) 345-6789',
    email: 'priya.v@example.com',
    relationship: 'Friend',
    priority: 'SECONDARY',
    isVerified: true
  }
];

const initialAlerts = [
  {
    id: 'alt-8092',
    organizationId: 'org-101',
    userId: 'u-101',
    userName: 'Srishti',
    userPhone: '+1 (555) 234-5678',
    status: 'ACTIVE',
    location: {
      lat: 28.6139,
      lng: 77.2090,
      accuracy: 8,
      speed: 1.2,
      heading: 145,
      altitude: 210,
      timestamp: Date.now(),
      address: 'Connaught Place, New Delhi, India'
    },
    breadcrumbs: [
      { lat: 28.6130, lng: 77.2082, accuracy: 10, timestamp: Date.now() - 60000 },
      { lat: 28.6135, lng: 77.2086, accuracy: 9, timestamp: Date.now() - 30000 },
      { lat: 28.6139, lng: 77.2090, accuracy: 8, timestamp: Date.now() }
    ],
    batteryLevel: 78,
    ambientAudioRecorded: true,
    contactsNotifiedCount: 3,
    trackingToken: 'trk-srishti-live-8092',
    createdAt: new Date(Date.now() - 120000),
    acknowledgedAt: new Date(Date.now() - 90000),
    dispatcherNotes: 'Alert triggered via silent 3s hold button. GPS location locked.'
  },
  {
    id: 'alt-8091',
    organizationId: 'org-101',
    userId: 'u-demo',
    userName: 'Demo User',
    userPhone: '+1 (555) 000-0000',
    status: 'RESOLVED',
    location: {
      lat: 28.6142,
      lng: 77.2095,
      accuracy: 5,
      timestamp: Date.now() - 86400000,
      address: 'Library Gate, Campus'
    },
    breadcrumbs: [],
    batteryLevel: 92,
    ambientAudioRecorded: true,
    contactsNotifiedCount: 2,
    trackingToken: 'trk-demo-resolved-8091',
    createdAt: new Date(Date.now() - 86400000),
    acknowledgedAt: new Date(Date.now() - 86350000),
    resolvedAt: new Date(Date.now() - 86000000),
    dispatcherNotes: 'All clear. False alarm confirmed by user PIN.'
  }
];

const initialLogs = [
  {
    id: 'log-1',
    alertId: 'alt-8092',
    contactName: 'Rohan Sharma',
    channel: 'SMS',
    recipient: '+1 (555) 987-6543',
    message: 'EMERGENCY: Srishti needs help! Live GPS Location: http://localhost:5173/track/trk-srishti-live-8092',
    status: 'DELIVERED',
    timestamp: new Date(Date.now() - 118000)
  },
  {
    id: 'log-2',
    alertId: 'alt-8092',
    contactName: 'Dr. Ananya Roy',
    channel: 'EMAIL',
    recipient: 'ananya.roy@university.edu',
    message: 'SILENT SOS ALERT: Srishti has activated Silent SOS. Track live position immediately: http://localhost:5173/track/trk-srishti-live-8092',
    status: 'DELIVERED',
    timestamp: new Date(Date.now() - 117000)
  }
];

const initialDevices = [
  {
    id: 'dev-1',
    userId: 'u-demo',
    deviceName: 'Chrome on Windows 11',
    browser: 'Chrome 127.0',
    os: 'Windows 11',
    ipAddress: '127.0.0.1',
    lastLogin: new Date(),
    isTrusted: true
  }
];

class DatabaseEngine {
  constructor() {
    this.memoryData = {
      organizations: [...initialOrganizations],
      users: [...initialUsers],
      contacts: [...initialContacts],
      alerts: [...initialAlerts],
      logs: [...initialLogs],
      devices: [...initialDevices],
      pushSubscriptions: [],
      sessions: [],
      verificationTokens: [],
      passwordResetTokens: [],
      audioRecordings: []
    };
    this.data = this.memoryData;
    this.connect();
  }

  async connect() {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri && !mongoUri.includes('<user>')) {
      try {
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        logger.info('[DatabaseEngine] Connected to MongoDB Atlas/Production Database', { category: 'DATABASE' });
        await this.syncDatabaseState();
      } catch (err) {
        logger.warn('[DatabaseEngine] Mongoose connection error, running in memory-cached DB engine:', { category: 'DATABASE', error: err.message });
      }
    } else {
      logger.info('[DatabaseEngine] Running Mongoose Model Database Engine (Memory-backed with AES-256 field encryption)', { category: 'DATABASE' });
    }
    this.ensureSeedUsers();
  }

  async syncDatabaseState() {
    try {
      const dbOrgs = await Organization.find({});
      if (dbOrgs.length > 0) {
        this.memoryData.organizations = dbOrgs.map(o => o.toObject());
      } else {
        await Organization.insertMany(initialOrganizations);
      }

      const dbUsers = await User.find({});
      if (dbUsers.length > 0) {
        this.memoryData.users = dbUsers.map(u => u.toObject());
      } else {
        await User.insertMany(initialUsers);
      }

      const dbContacts = await EmergencyContact.find({});
      if (dbContacts.length > 0) {
        this.memoryData.contacts = dbContacts.map(c => c.toObject());
      } else {
        await EmergencyContact.insertMany(initialContacts);
      }

      const dbAlerts = await Alert.find({});
      if (dbAlerts.length > 0) {
        this.memoryData.alerts = dbAlerts.map(a => a.toObject());
      } else {
        await Alert.insertMany(initialAlerts);
      }

      const dbLogs = await Notification.find({});
      if (dbLogs.length > 0) {
        this.memoryData.logs = dbLogs.map(l => l.toObject());
      } else {
        await Notification.insertMany(initialLogs);
      }

      const dbDevices = await Device.find({});
      if (dbDevices.length > 0) {
        this.memoryData.devices = dbDevices.map(d => d.toObject());
      } else {
        await Device.insertMany(initialDevices);
      }

      const dbSessions = await Session.find({});
      if (dbSessions.length > 0) {
        this.memoryData.sessions = dbSessions.map(s => s.toObject());
      }
    } catch (e) {
      console.warn('[DatabaseEngine] Sync database error:', e.message);
    }
  }

  ensureSeedUsers() {
    if (!this.memoryData.users) this.memoryData.users = [];
    const demoEmail = 'srishtikumari.cse25@ritroorkee.com';
    let demoUser = this.memoryData.users.find(u => u.email && u.email.toLowerCase().trim() === demoEmail);
    if (!demoUser) {
      demoUser = {
        id: 'u-demo',
        organizationId: 'org-101',
        orgRole: 'USER',
        name: 'Demo User',
        email: demoEmail,
        phone: '+1 (555) 000-0000',
        passwordHash: demoPasswordHash,
        role: 'USER',
        isVerified: true,
        deactivationPin: '1234',
        stealthCode: '9999'
      };
      this.memoryData.users.push(demoUser);
    } else {
      if (!bcrypt.compareSync('12345678', demoUser.passwordHash)) {
        demoUser.passwordHash = demoPasswordHash;
        demoUser.isVerified = true;
      }
    }

    if (mongoose.connection.readyState === 1) {
      User.updateOne({ email: demoEmail }, demoUser, { upsert: true }).catch(() => {});
    }
  }

  save() {
    this.ensureSeedUsers();
  }

  // Organizations
  getOrganizations() {
    return this.memoryData.organizations;
  }

  getOrganizationById(id) {
    return this.memoryData.organizations.find(o => o.id === id);
  }

  // Users
  getUsers() {
    return this.memoryData.users;
  }

  // Contacts (AES-256 Encrypted Field-level Storage)
  getContacts(userId) {
    const rawContacts = userId
      ? this.memoryData.contacts.filter(c => c.userId === userId)
      : this.memoryData.contacts;
    
    // Transparently decrypt on read
    return rawContacts.map(c => ({
      ...c,
      phone: decryptField(c.phone),
      email: decryptField(c.email),
      relationship: decryptField(c.relationship)
    }));
  }

  addContact(contact) {
    // Encrypt sensitive PII fields on write
    const encryptedContact = {
      ...contact,
      phone: encryptField(contact.phone),
      email: encryptField(contact.email),
      relationship: encryptField(contact.relationship)
    };

    this.memoryData.contacts.push(encryptedContact);
    if (mongoose.connection.readyState === 1) {
      EmergencyContact.create(encryptedContact).catch(() => {});
    }
    
    // Return decrypted version for API response compatibility
    return {
      ...contact,
      phone: decryptField(contact.phone),
      email: decryptField(contact.email),
      relationship: decryptField(contact.relationship)
    };
  }

  deleteContact(id) {
    this.memoryData.contacts = this.memoryData.contacts.filter(c => c.id !== id);
    if (mongoose.connection.readyState === 1) {
      EmergencyContact.deleteOne({ id }).catch(() => {});
    }
  }

  updateContact(id, updates) {
    const contact = this.memoryData.contacts.find(c => c.id === id);
    if (contact) {
      const encryptedUpdates = { ...updates };
      if (updates.phone) encryptedUpdates.phone = encryptField(updates.phone);
      if (updates.email) encryptedUpdates.email = encryptField(updates.email);
      if (updates.relationship) encryptedUpdates.relationship = encryptField(updates.relationship);

      Object.assign(contact, encryptedUpdates);
      if (mongoose.connection.readyState === 1) {
        EmergencyContact.updateOne({ id }, encryptedUpdates).catch(() => {});
      }
    }
    return contact ? {
      ...contact,
      phone: decryptField(contact.phone),
      email: decryptField(contact.email),
      relationship: decryptField(contact.relationship)
    } : null;
  }

  // Alerts (AES-256 Encrypted Dispatcher Notes & Location Address)
  getAlerts(orgId) {
    const rawAlerts = orgId ? this.memoryData.alerts.filter(a => a.organizationId === orgId || !a.organizationId) : this.memoryData.alerts;
    return rawAlerts.map(a => this.formatAlertForRead(a));
  }

  getAlertById(id) {
    const a = this.memoryData.alerts.find(alert => alert.id === id);
    return a ? this.formatAlertForRead(a) : null;
  }

  getAlertByToken(token) {
    const a = this.memoryData.alerts.find(alert => alert.trackingToken === token);
    return a ? this.formatAlertForRead(a) : null;
  }

  formatAlertForRead(alert) {
    const clone = { ...alert };
    if (clone.dispatcherNotes) clone.dispatcherNotes = decryptField(clone.dispatcherNotes);
    if (clone.location && clone.location.address) {
      clone.location = {
        ...clone.location,
        address: decryptField(clone.location.address)
      };
    }
    return clone;
  }

  createAlert(alert) {
    if (!alert.organizationId) alert.organizationId = 'org-101';
    
    // Encrypt sensitive notes & address fields
    const encryptedAlert = { ...alert };
    if (alert.dispatcherNotes) encryptedAlert.dispatcherNotes = encryptField(alert.dispatcherNotes);
    if (alert.location && alert.location.address) {
      encryptedAlert.location = {
        ...alert.location,
        address: encryptField(alert.location.address)
      };
    }

    this.memoryData.alerts.unshift(encryptedAlert);
    if (mongoose.connection.readyState === 1) {
      Alert.create(encryptedAlert).catch(() => {});
    }
    return this.formatAlertForRead(encryptedAlert);
  }

  updateAlertLocation(id, location, batteryLevel) {
    const alert = this.memoryData.alerts.find(a => a.id === id);
    if (alert) {
      const locToSave = { ...location };
      if (locToSave.address) locToSave.address = encryptField(locToSave.address);

      alert.location = locToSave;
      if (batteryLevel !== undefined) alert.batteryLevel = batteryLevel;
      if (!alert.breadcrumbs) alert.breadcrumbs = [];
      alert.breadcrumbs.push(locToSave);
      if (alert.breadcrumbs.length > 50) alert.breadcrumbs.shift();

      if (mongoose.connection.readyState === 1) {
        Alert.updateOne({ id }, { location: locToSave, batteryLevel, breadcrumbs: alert.breadcrumbs }).catch(() => {});
        LocationHistory.create({
          id: `loc-${Date.now()}`,
          alertId: id,
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading,
          altitude: location.altitude,
          timestamp: location.timestamp ? new Date(location.timestamp) : new Date(),
          address: locToSave.address
        }).catch(() => {});
      }
    }
    return alert ? this.formatAlertForRead(alert) : null;
  }

  updateAlertStatus(id, status, notes) {
    const alert = this.memoryData.alerts.find(a => a.id === id);
    if (alert) {
      alert.status = status;
      if (notes) alert.dispatcherNotes = encryptField(notes);
      if (!alert.acknowledgedAt && status === 'DISPATCHED') {
        alert.acknowledgedAt = new Date().toISOString();
      }
      if (status === 'RESOLVED' || status === 'FALSE_ALARM') {
        alert.resolvedAt = new Date().toISOString();
      }
      if (mongoose.connection.readyState === 1) {
        Alert.updateOne({ id }, { status, dispatcherNotes: alert.dispatcherNotes, acknowledgedAt: alert.acknowledgedAt, resolvedAt: alert.resolvedAt }).catch(() => {});
      }
    }
    return alert ? this.formatAlertForRead(alert) : null;
  }

  // Logs
  getLogs() {
    return this.memoryData.logs;
  }

  addLog(log) {
    this.memoryData.logs.unshift(log);
    if (mongoose.connection.readyState === 1) {
      Notification.create(log).catch(() => {});
    }
    return log;
  }

  // Devices
  getDevices(userId) {
    return this.memoryData.devices.filter(d => d.userId === userId);
  }

  addDevice(device) {
    this.memoryData.devices.unshift(device);
    if (mongoose.connection.readyState === 1) {
      Device.create(device).catch(() => {});
    }
    return device;
  }

  removeDevice(id, userId) {
    this.memoryData.devices = this.memoryData.devices.filter(d => d.id !== id || d.userId !== userId);
    if (mongoose.connection.readyState === 1) {
      Device.deleteOne({ id, userId }).catch(() => {});
    }
  }

  removeAllOtherDevices(userId, currentSessionToken) {
    this.memoryData.devices = this.memoryData.devices.filter(d => d.userId !== userId || d.sessionToken === currentSessionToken);
    if (mongoose.connection.readyState === 1) {
      Device.deleteMany({ userId, sessionToken: { $ne: currentSessionToken } }).catch(() => {});
    }
  }

  // Push Subscriptions
  addPushSubscription(sub) {
    this.memoryData.pushSubscriptions.unshift(sub);
    if (mongoose.connection.readyState === 1) {
      PushSubscription.create(sub).catch(() => {});
    }
    return sub;
  }

  getPushSubscriptions(userId) {
    return userId ? this.memoryData.pushSubscriptions.filter(s => s.userId === userId) : this.memoryData.pushSubscriptions;
  }

  // Sessions
  createSession(session) {
    if (!this.memoryData.sessions) this.memoryData.sessions = [];
    this.memoryData.sessions.unshift(session);
    if (mongoose.connection.readyState === 1) {
      Session.create(session).catch(() => {});
    }
    return session;
  }

  findSession(refreshToken) {
    if (!this.memoryData.sessions) return null;
    return this.memoryData.sessions.find(s => s.refreshToken === refreshToken);
  }

  revokeSession(refreshToken) {
    if (!this.memoryData.sessions) return;
    const s = this.memoryData.sessions.find(session => session.refreshToken === refreshToken);
    if (s) {
      s.isRevoked = true;
      if (mongoose.connection.readyState === 1) {
        Session.updateOne({ refreshToken }, { isRevoked: true }).catch(() => {});
      }
    }
  }

  revokeAllUserSessions(userId) {
    if (!this.memoryData.sessions) return;
    this.memoryData.sessions.forEach(s => {
      if (s.userId === userId) s.isRevoked = true;
    });
    if (mongoose.connection.readyState === 1) {
      Session.updateMany({ userId }, { isRevoked: true }).catch(() => {});
    }
  }

  // Audio Recordings (AES-256 Encrypted File Path & URL Metadata)
  addAudioRecording(recording) {
    if (!this.memoryData.audioRecordings) this.memoryData.audioRecordings = [];
    
    const encryptedRecording = {
      ...recording,
      filePath: encryptField(recording.filePath),
      fileUrl: encryptField(recording.fileUrl)
    };

    this.memoryData.audioRecordings.unshift(encryptedRecording);
    if (mongoose.connection.readyState === 1) {
      AudioRecording.create(encryptedRecording).catch(() => {});
    }
    return {
      ...recording,
      filePath: decryptField(encryptedRecording.filePath),
      fileUrl: decryptField(encryptedRecording.fileUrl)
    };
  }

  getAudioRecordings(alertId) {
    if (!this.memoryData.audioRecordings) return [];
    const recs = alertId
      ? this.memoryData.audioRecordings.filter(r => r.alertId === alertId)
      : this.memoryData.audioRecordings;
      
    return recs.map(r => ({
      ...r,
      filePath: decryptField(r.filePath),
      fileUrl: decryptField(r.fileUrl)
    }));
  }
}

export const db = new DatabaseEngine();
export { Organization, User, EmergencyContact, Alert, LocationHistory, Notification, AudioRecording, Device, PushSubscription, Session, AuditLog };
