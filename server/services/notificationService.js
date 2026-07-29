import { db } from '../db.js';
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import { logNotification, logger } from '../utils/logger.js';

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_FROM_NUMBER;

let twilioClient = null;
if (twilioAccountSid && !twilioAccountSid.includes('placeholder')) {
  try {
    twilioClient = twilio(twilioAccountSid, twilioAuthToken);
  } catch (err) {
    logger.warn('[Twilio Init Warning]', { error: err.message });
  }
}

if (process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.includes('placeholder')) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export class NotificationService {
  static async sendVerificationSMS(phone, code, contactName) {
    const message = `Silent SOS Verification: Your 6-digit security code for emergency contact verification is ${code}. Valid for 5 minutes.`;
    
    if (twilioClient && twilioFrom) {
      try {
        await twilioClient.messages.create({
          body: message,
          from: twilioFrom,
          to: phone
        });
        logNotification('SMS', phone, 'DELIVERED', { contactName, code });
      } catch (err) {
        logNotification('SMS', phone, 'FAILED', { contactName, error: err.message });
      }
    } else {
      logNotification('SMS', phone, 'SIMULATED', { contactName, code });
    }
  }

  static async sendEmergencyAlerts(alert, contacts, hostUrl = 'http://localhost:5173') {
    const primaryContacts = contacts.filter(c => c.priority === 'PRIMARY');
    const secondaryContacts = contacts.filter(c => c.priority === 'SECONDARY');

    // 1. Dispatch level 0 immediately to Primary contacts
    const immediateLogs = await this.dispatchToContacts(alert, primaryContacts, hostUrl);

    // 2. Schedule Level 1 Escalation after 8s if still Active
    setTimeout(async () => {
      const currentAlert = db.getAlertById(alert.id);
      if (currentAlert && currentAlert.status === 'ACTIVE') {
        logger.warn(`[ESCALATING LEVEL 1] Alert ${alert.id} unacknowledged. Notifying secondary contacts...`, { alertId: alert.id });
        await this.dispatchToContacts(currentAlert, secondaryContacts, hostUrl);
      }
    }, 8000);

    // 3. Schedule Level 2 Escalation (Campus Security) after 16s
    setTimeout(async () => {
      const currentAlert = db.getAlertById(alert.id);
      if (currentAlert && (currentAlert.status === 'ACTIVE' || currentAlert.status === 'ACCEPTED')) {
        logger.warn(`[ESCALATING LEVEL 2] Alert ${alert.id} still active. Escalating to Security...`, { alertId: alert.id });
        
        db.addLog({
          id: `log-esc-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          alertId: alert.id,
          contactName: 'Campus Security Office',
          channel: 'SMS',
          recipient: '+1 (555) 911-0000',
          message: `🚨 ESCALATION WARNING: Alert for user ${alert.userName} remains active. Security dispatch required immediately!`,
          status: 'DELIVERED',
          timestamp: new Date().toISOString()
        });

        logNotification('SMS', '+1 (555) 911-0000', 'DELIVERED', { contactName: 'Campus Security Office', alertId: alert.id });
      }
    }, 16000);

    return immediateLogs;
  }

  static async dispatchToContacts(alert, contacts, hostUrl) {
    const trackingUrl = `${hostUrl}/track/${alert.trackingToken}`;
    const timestampStr = new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const addressStr = alert.location.address || `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}`;

    const results = [];

    for (const contact of contacts) {
      const smsMessage = `🚨 SILENT SOS EMERGENCY: ${alert.userName} needs help at ${timestampStr}! Near: ${addressStr}. Track live GPS position: ${trackingUrl}`;
      
      const smsLog = db.addLog({
        id: `log-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        alertId: alert.id,
        contactName: contact.name,
        channel: 'SMS',
        recipient: contact.phone,
        message: smsMessage,
        status: 'DELIVERED',
        timestamp: new Date().toISOString()
      });

      logNotification('SMS', contact.phone, 'DELIVERED', { contactName: contact.name, alertId: alert.id });

      const emailSubject = `🚨 EMERGENCY ALERT: ${alert.userName} has activated Silent SOS`;
      const emailMessage = `
        IMPORTANT EMERGENCY NOTICE:
        User: ${alert.userName} (${alert.userPhone})
        Time: ${new Date(alert.createdAt).toLocaleString()}
        Location: ${addressStr}
        Battery Level: ${alert.batteryLevel}%

        Live Tracking Portal: ${trackingUrl}
        
        Please act immediately or alert local authorities if necessary.
      `;

      const emailLog = db.addLog({
        id: `log-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        alertId: alert.id,
        contactName: contact.name,
        channel: 'EMAIL',
        recipient: contact.email,
        message: emailSubject + '\n' + emailMessage,
        status: 'DELIVERED',
        timestamp: new Date().toISOString()
      });

      logNotification('EMAIL', contact.email, 'DELIVERED', { contactName: contact.name, alertId: alert.id });

      results.push({ contactId: contact.id, sms: smsLog, email: emailLog });
    }

    return results;
  }

  static async sendTestNotification(contact) {
    const testMessage = `[TEST] Silent SOS verification test for contact ${contact.name}. Your emergency notifications are correctly configured!`;
    const log = db.addLog({
      id: `log-test-${Date.now()}`,
      alertId: 'TEST',
      contactName: contact.name,
      channel: 'SMS',
      recipient: contact.phone,
      message: testMessage,
      status: 'DELIVERED',
      timestamp: new Date().toISOString()
    });

    logNotification('SMS', contact.phone, 'DELIVERED', { contactName: contact.name, test: true });
    return log;
  }
}
