import mongoose from 'mongoose';

// 1. Organization Model
const organizationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['COLLEGE', 'UNIVERSITY', 'COMPANY', 'NGO'], default: 'UNIVERSITY' },
  code: { type: String, required: true, unique: true, index: true },
  contactEmail: { type: String },
  contactPhone: { type: String }
}, { timestamps: true });

// 2. User Model
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, default: 'org-101', index: true },
  orgRole: { type: String, enum: ['ADMIN', 'DISPATCHER', 'SECURITY_OFFICER', 'USER'], default: 'USER' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  deactivationPin: { type: String, default: '1234' },
  stealthCode: { type: String, default: '9999' },
  isVerified: { type: Boolean, default: true }
}, { timestamps: true });

// 3. EmergencyContact Model
const contactSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  relationship: { type: String, default: 'Family' },
  priority: { type: String, enum: ['PRIMARY', 'SECONDARY'], default: 'SECONDARY' },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  hashedOtp: { type: String },
  otpExpiresAt: { type: Number },
  otpAttempts: { type: Number, default: 0 },
  lastResendAt: { type: Number }
}, { timestamps: true });

// 4. Alert Model
const alertSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, default: 'org-101', index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userPhone: { type: String, required: true },
  status: { type: String, default: 'ACTIVE', index: true },
  location: { type: Object },
  breadcrumbs: { type: Array, default: [] },
  batteryLevel: { type: Number, default: 85 },
  ambientAudioRecorded: { type: Boolean, default: true },
  audioUrl: { type: String },
  contactsNotifiedCount: { type: Number, default: 0 },
  trackingToken: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now },
  acknowledgedAt: { type: Date },
  resolvedAt: { type: Date },
  dispatcherNotes: { type: String }
}, { timestamps: true });

// 5. LocationHistory Model
const locationHistorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  alertId: { type: String, required: true, index: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  accuracy: { type: Number },
  speed: { type: Number },
  heading: { type: Number },
  altitude: { type: Number },
  timestamp: { type: Date, default: Date.now },
  address: { type: String }
}, { timestamps: true });

// 6. Notification Log Model
const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  alertId: { type: String, required: true, index: true },
  contactName: { type: String, required: true },
  channel: { type: String, enum: ['SMS', 'EMAIL', 'PUSH'], default: 'SMS' },
  recipient: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['DELIVERED', 'SIMULATED', 'FAILED'], default: 'DELIVERED' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// 7. AudioRecording Model
const audioRecordingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  alertId: { type: String, required: true, index: true },
  filePath: { type: String, required: true },
  fileUrl: { type: String, required: true },
  sizeBytes: { type: Number, default: 0 },
  durationSeconds: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// 8. Device Model
const deviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  deviceName: { type: String, required: true },
  browser: { type: String, required: true },
  os: { type: String, required: true },
  ipAddress: { type: String },
  lastLogin: { type: Date, default: Date.now },
  isTrusted: { type: Boolean, default: true },
  sessionToken: { type: String }
}, { timestamps: true });

// 9. PushSubscription Model
const pushSubscriptionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  fcmToken: { type: String },
  endpoint: { type: String },
  keys: { type: Object },
  deviceType: { type: String, default: 'WEB' }
}, { timestamps: true });

// 10. Session Model (JWT Refresh Token Rotation & Session Management)
const sessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  refreshToken: { type: String, required: true, index: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  isRevoked: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// 11. AuditLog Model
const auditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  details: { type: Object },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Add Compound Indexes for Query Optimization
alertSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
alertSchema.index({ userId: 1, createdAt: -1 });
contactSchema.index({ userId: 1, priority: 1 });
sessionSchema.index({ userId: 1, isRevoked: 1 });
locationHistorySchema.index({ alertId: 1, timestamp: -1 });

export const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const EmergencyContact = mongoose.models.EmergencyContact || mongoose.model('EmergencyContact', contactSchema);
export const Alert = mongoose.models.Alert || mongoose.model('Alert', alertSchema);
export const LocationHistory = mongoose.models.LocationHistory || mongoose.model('LocationHistory', locationHistorySchema);
export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export const AudioRecording = mongoose.models.AudioRecording || mongoose.model('AudioRecording', audioRecordingSchema);
export const Device = mongoose.models.Device || mongoose.model('Device', deviceSchema);
export const PushSubscription = mongoose.models.PushSubscription || mongoose.model('PushSubscription', pushSubscriptionSchema);
export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
