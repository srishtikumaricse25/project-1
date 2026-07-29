import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2, Phone, Mail, Send, CheckCircle2, Shield, AlertCircle, Home, Heart, User, QrCode, Camera, Pin, PinOff, RefreshCw } from 'lucide-react';
import { EmergencyContact } from '../../types';
import { useI18n } from '../../services/i18n';

interface ContactsManagerProps {
  contacts: EmergencyContact[];
  onAddContact: (contact: Partial<EmergencyContact>) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
  onEditContact: (id: string, contact: Partial<EmergencyContact>) => Promise<void>;
  onTestContact: (id: string) => Promise<void>;
}

export const ContactsManager: React.FC<ContactsManagerProps> = ({
  contacts,
  onAddContact,
  onDeleteContact,
  onEditContact,
  onTestContact
}) => {
  const { t } = useI18n();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // New States: QR Scanner overlay and Pinned Favorites
  const [showQrReader, setShowQrReader] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>(['c-1']); // default Rohan Sharma pinned
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'Family',
    priority: 'PRIMARY' as 'PRIMARY' | 'SECONDARY'
  });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  const togglePin = (id: string) => {
    setPinnedIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleScanQr = () => {
    setShowQrReader(true);
    setTimeout(() => {
      // Simulate successful scan of contact payload
      setFormData({
        name: 'Bihar Security Helpdesk',
        phone: '+91 612 221 7824',
        email: 'safety.bihar@gov.in',
        relationship: 'Warden/Security',
        priority: 'PRIMARY'
      });
      setShowQrReader(false);
      setIsAdding(true);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email) return;

    try {
      setErrorMsg('');
      if (editingId) {
        // Edit Mode
        await onEditContact(editingId, formData);
        setEditingId(null);
      } else {
        // Add Mode
        if (contacts.length >= 5) {
          setErrorMsg('BR-Rule-1 Limit Reached: Maximum 5 emergency contacts allowed per user profile.');
          return;
        }
        await onAddContact(formData);
      }
      setFormData({ name: '', phone: '', email: '', relationship: 'Family', priority: 'SECONDARY' });
      setIsAdding(false);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error saving contact.');
    }
  };

  const handleEditClick = (contact: EmergencyContact) => {
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      relationship: contact.relationship,
      priority: contact.priority
    });
    setEditingId(contact.id);
    setIsAdding(true);
    setErrorMsg('');
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    await onTestContact(id);
    setTestingId(null);
    setTestSuccess(id);
    setTimeout(() => setTestSuccess(null), 4000);
  };

  // Generate unique background color and initials based on name
  const getAvatarDetails = (name: string) => {
    const parts = name.trim().split(' ');
    const initials = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
    
    // Choose color theme
    const colors = [
      'bg-blue-500/10 text-blue-400 border-blue-500/30',
      'bg-purple-500/10 text-purple-400 border-purple-500/30',
      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      'bg-amber-500/10 text-amber-400 border-amber-500/30',
      'bg-pink-500/10 text-pink-400 border-pink-500/30'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return { initials, colorClass: colors[index] };
  };

  // Get corresponding relationship icon
  const getRelationshipIcon = (relationship: string) => {
    const rel = relationship.toLowerCase();
    if (rel.includes('parent') || rel.includes('mother') || rel.includes('father')) {
      return <Home className="h-3.5 w-3.5" />;
    }
    if (rel.includes('spouse') || rel.includes('husband') || rel.includes('wife') || rel.includes('brother') || rel.includes('sister') || rel.includes('sibling')) {
      return <Heart className="h-3.5 w-3.5" />;
    }
    if (rel.includes('friend')) {
      return <Users className="h-3.5 w-3.5" />;
    }
    if (rel.includes('warden') || rel.includes('security') || rel.includes('police')) {
      return <Shield className="h-3.5 w-3.5" />;
    }
    return <User className="h-3.5 w-3.5" />;
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">{t('trustedContacts')}</h2>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-400 border border-slate-700">
                {contacts.length}/5 {t('allocated')}
              </span>
            </div>
            <p className="text-xs text-slate-400">{t('alertedInstantly')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleScanQr}
            className="flex items-center justify-center space-x-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 transition-all shadow-md"
          >
            <QrCode className="h-4 w-4 text-emerald-400" />
            <span>{t('scanQrBtn')}</span>
          </button>

          <button
            onClick={() => {
              if (contacts.length >= 5 && !editingId) {
                alert(t('limitReached'));
              } else {
                setEditingId(null);
                setFormData({ name: '', phone: '', email: '', relationship: 'Family', priority: 'SECONDARY' });
                setIsAdding(!isAdding);
              }
            }}
            disabled={contacts.length >= 5 && !isAdding}
            className="flex items-center justify-center space-x-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition-all shadow-md shadow-red-600/20 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>{isAdding && editingId ? t('addContact') : t('addContact')}</span>
          </button>
        </div>
      </div>

      {/* QR Code Scanner Overlay Simulator */}
      {showQrReader && (
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col items-center justify-center space-y-4 animate-fade-in">
          <div className="relative h-44 w-44 rounded-xl border-2 border-emerald-500/50 bg-slate-900 overflow-hidden flex items-center justify-center">
            {/* Dynamic Scanning Laser bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500 animate-bounce shadow-lg shadow-emerald-500" />
            <Camera className="h-10 w-10 text-slate-700 animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">{t('cameraActive')}</span>
            <h5 className="text-xs font-bold text-slate-200">{t('qrTitle')}</h5>
            <p className="text-[9px] text-slate-500">{t('qrSub')}</p>
          </div>
        </div>
      )}

      {/* Add / Edit Contact Form Drawer */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-slate-700 bg-slate-950 p-4 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {editingId ? t('updateContact') : t('saveContact')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400">{t('name')}</label>
              <input
                type="text"
                required
                placeholder="e.g. Rohan Sharma"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400">{t('phone')}</label>
              <input
                type="tel"
                required
                placeholder="+1 (555) 987-6543"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400">{t('email')}</label>
              <input
                type="email"
                required
                placeholder="contact@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-400">{t('relationship')}</label>
                <select
                  value={formData.relationship}
                  onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                >
                  <option value="Parent">{t('relationshipParent')}</option>
                  <option value="Sibling">{t('relationshipSibling')}</option>
                  <option value="Spouse">{t('relationshipSpouse')}</option>
                  <option value="Friend">{t('relationshipFriend')}</option>
                  <option value="Warden/Security">{t('relationshipWardenSecurity')}</option>
                  <option value="Family">{t('relationshipFamily')}</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400">{t('priority')}</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                >
                  <option value="PRIMARY">{t('primary')}</option>
                  <option value="SECONDARY">{t('secondary')}</option>
                </select>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center space-x-1.5 text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
            >
              {editingId ? t('updateContact') : t('saveContact')}
            </button>
          </div>
        </form>
      )}

      {/* Contacts List Grid (Spaced gap enhanced to gap-5, stretch items equally) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch">
        {[...contacts]
          .sort((a, b) => {
            const aPinned = pinnedIds.includes(a.id);
            const bPinned = pinnedIds.includes(b.id);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return 0;
          })
          .map((contact) => {
            const { initials, colorClass } = getAvatarDetails(contact.name);
            const isPinned = pinnedIds.includes(contact.id);
            return (
              <div
                key={contact.id}
                className={`flex flex-col justify-between h-full rounded-2xl border p-5 transition-all hover:shadow-xl hover:shadow-slate-950/40 ${
                  isPinned 
                    ? 'border-emerald-500/30 bg-emerald-500/[0.01]' 
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    
                    {/* Left Content: Avatar + Info */}
                    <div className="flex items-start space-x-3">
                      
                      {/* Generated Initials Avatar */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-bold text-xs ${colorClass}`}>
                        {initials}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-white text-sm tracking-tight">{contact.name}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            contact.priority === 'PRIMARY'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {contact.priority === 'PRIMARY' ? t('primary') : t('secondary')}
                          </span>
                        </div>
                        
                        {/* Relationship status with inline icon */}
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium mt-0.5">
                          <span className="text-slate-500">{getRelationshipIcon(contact.relationship)}</span>
                          <span>
                            {contact.relationship === 'Parent' ? t('relationshipParent') :
                             contact.relationship === 'Sibling' ? t('relationshipSibling') :
                             contact.relationship === 'Spouse' ? t('relationshipSpouse') :
                             contact.relationship === 'Friend' ? t('relationshipFriend') :
                             contact.relationship === 'Warden/Security' ? t('relationshipWardenSecurity') :
                             contact.relationship === 'Family' ? t('relationshipFamily') : contact.relationship}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Actions Group */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => togglePin(contact.id)}
                        title={isPinned ? "Unpin Contact" : "Pin as Favorite"}
                        className={`rounded-lg p-1.5 transition-colors ${
                          isPinned ? 'text-emerald-400 hover:bg-slate-850' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {isPinned ? <Pin className="h-3.5 w-3.5 fill-emerald-500/10" /> : <PinOff className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => handleEditClick(contact)}
                        title="Edit Contact"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteContact(contact.id)}
                        title="Remove Contact"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>

                <div className="mt-3.5 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    <span>{contact.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                </div>

                {/* Verification & Connectivity Metrics Grid */}
                <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-900 text-xs text-slate-400">
                  <div className="flex items-center justify-between border-r border-slate-900 pr-2">
                    <span>{t('status')}:</span>
                    <span className="font-bold text-emerald-400 flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{t('online')}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('lastSeen')}:</span>
                    <span className="font-bold text-slate-200">2 {t('minAgo')}</span>
                  </div>
                  <div className="flex items-center justify-between border-r border-slate-900 pr-2">
                    <span>{t('sms')}:</span>
                    <span className="font-bold text-emerald-400">{t('verified')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('email')}:</span>
                    <span className="font-bold text-emerald-400">{t('verified')}</span>
                  </div>
                  <div className="flex items-center justify-between border-r border-slate-900 pr-2">
                    <span>{t('preferred')}:</span>
                    <span className="font-bold text-slate-200">{contact.priority === 'PRIMARY' ? t('yes') : t('no')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('ackSpeed')}:</span>
                    <span className="font-bold text-cyan-400">12 sec</span>
                  </div>
                </div>
              </div>

              {/* Test Notification Trigger Button */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between w-full">
                {testSuccess === contact.id ? (
                  <div className="flex flex-col space-y-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 p-2 rounded-lg w-full">
                    <div className="flex items-center space-x-1.5">
                      <span>{t('sosDeliveredText')}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span>{t('emailDeliveredText')}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span>{t('liveLocSharedText')}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleTest(contact.id)}
                      disabled={testingId === contact.id}
                      className="flex items-center space-x-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <Send className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{testingId === contact.id ? t('sendingText') : t('testDelivery')}</span>
                    </button>
                    <span className="text-[10px] text-slate-500 font-medium">{t('verified')}</span>
                  </>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
