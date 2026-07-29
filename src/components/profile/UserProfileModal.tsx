import React, { useState } from 'react';
import { X, User, Heart, ShieldAlert, Home, Stethoscope, Mail, Phone, Edit2, Check, MapPin, Building2, Droplets, FileText, Camera, Shield, Clock, AlertCircle, ChevronRight, Save } from 'lucide-react';
import { EmergencyContact } from '../../types';
import { useTranslation } from '../../services/i18n';

import { Laptop } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: EmergencyContact[];
  onOpenDevices?: () => void;
  user?: { name: string; email: string; phone: string };
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, contacts, onOpenDevices, user }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MEDICAL' | 'CONTACTS'>('OVERVIEW');
  const [profile, setProfile] = useState({
    name: user?.name || 'Srishti',
    email: user?.email || 'srishtiankita38@gmail.com',
    phone: user?.phone || '+91 98765 43210',
    bloodGroup: 'O-Negative',
    age: '21',
    gender: 'Female',
    medicalConditions: 'asthmaAndPenicillin',
    emergencyNotes: 'rescueInhalerInstructions',
    homeAddress: 'srishtiHomeAddress',
    preferredHospital: 'stanfordHospitalClinic',
    allergies: 'allergiesList',
    medications: 'albuterolMed',
    insuranceId: 'SHCI-2026-04821',
  });

  const [editForm, setEditForm] = useState({ ...profile });

  if (!isOpen) return null;

  const handleSave = () => {
    setProfile(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({ ...profile });
    setIsEditing(false);
  };

  const initials = profile.name.split(' ').map(n => n[0]).join('').toUpperCase();

  const renderField = (
    label: string,
    icon: React.ReactNode,
    fieldKey: keyof typeof profile,
    multiline = false
  ) => {
    const isTranslatableKey = [
      'medicalConditions',
      'emergencyNotes',
      'homeAddress',
      'preferredHospital',
      'allergies',
      'medications'
    ].includes(fieldKey);

    return (
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
          {icon}
          <span>{label}</span>
        </label>
        {isEditing ? (
          multiline ? (
            <textarea
              value={editForm[fieldKey]}
              onChange={e => setEditForm({ ...editForm, [fieldKey]: e.target.value })}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/30 rounded-xl p-3 text-xs text-white placeholder-slate-600 transition-all resize-none"
            />
          ) : (
            <input
              type="text"
              value={editForm[fieldKey]}
              onChange={e => setEditForm({ ...editForm, [fieldKey]: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/30 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 transition-all"
            />
          )
        ) : (
          <div className="px-3.5 py-2.5 bg-slate-950/70 rounded-xl border border-slate-800/60 text-xs text-slate-300 leading-relaxed">
            {profile[fieldKey] ? (isTranslatableKey ? t(profile[fieldKey] as any) : profile[fieldKey]) : <span className="text-slate-600 italic">{t('notSpecified')}</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-lg p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Profile Header with Photo */}
        <div className="relative">
          {/* Gradient Banner */}
          <div className="h-28 bg-gradient-to-r from-red-600/30 via-rose-500/20 to-orange-500/10 border-b border-slate-800/60" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-xl bg-slate-900/80 backdrop-blur-sm p-2 text-slate-400 hover:text-white border border-slate-700/50 transition-all active:scale-95 z-10"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          {/* Profile Photo + Name Card */}
          <div className="px-6 -mt-14 flex items-end space-x-4 pb-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-rose-600 p-[3px] shadow-xl shadow-red-500/20">
                <div className="h-full w-full rounded-[13px] bg-slate-900 flex items-center justify-center overflow-hidden">
                  <svg className="h-16 w-16 text-slate-500 mt-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              {/* Online Indicator */}
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-[3px] border-slate-900 shadow-lg" title={t('onlineStatus')} />
              {/* Camera Edit Overlay */}
              {isEditing && (
                <button className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center backdrop-blur-sm transition-all hover:bg-black/60">
                  <Camera className="h-5 w-5 text-white" />
                </button>
              )}
            </div>

            {/* Name & Role */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-transparent border-b border-red-500/50 focus:border-red-500 focus:outline-none text-lg font-black text-white pb-0.5 w-full max-w-[250px]"
                  />
                ) : (
                  <h2 className="text-lg font-black text-white truncate">{profile.name}</h2>
                )}
                <span className="flex-shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  {t('verified')}
                </span>
              </div>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-xs text-slate-400">{profile.email}</span>
                <span className="text-slate-700">•</span>
                <span className="text-xs text-slate-400">{profile.phone}</span>
              </div>
            </div>

            {/* Edit / Save Buttons */}
            <div className="flex-shrink-0 pb-1">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCancel}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 border border-slate-700 transition-all active:scale-95"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg transition-all active:scale-95"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{t('saveContact')}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {onOpenDevices && (
                    <button
                      onClick={onOpenDevices}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-all active:scale-95"
                    >
                      <Laptop className="h-3.5 w-3.5 text-blue-400" />
                      <span>{t('myDevices')}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20 transition-all active:scale-95"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>{t('editProfile')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-4 gap-2.5">
            {/* Blood Group */}
            <div className="rounded-xl bg-red-500/[0.05] border border-red-500/15 px-3 py-3 text-center">
              <Droplets className="h-4 w-4 text-red-400 mx-auto mb-1" />
              <div className="text-sm font-black text-red-400">{profile.bloodGroup === 'O-Negative' ? t('oNegativeGroup') : profile.bloodGroup}</div>
              <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{t('bloodLabel')}</div>
            </div>
            {/* Age */}
            <div className="rounded-xl bg-blue-500/[0.05] border border-blue-500/15 px-3 py-3 text-center">
              <User className="h-4 w-4 text-blue-400 mx-auto mb-1" />
              <div className="text-sm font-black text-blue-400">{profile.age} {t('yearsSuffix')}</div>
              <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{t('ageLabel')}</div>
            </div>
            {/* Contacts */}
            <div className="rounded-xl bg-emerald-500/[0.05] border border-emerald-500/15 px-3 py-3 text-center">
              <Shield className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-sm font-black text-emerald-400">{contacts.length}</div>
              <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{t('contacts')}</div>
            </div>
            {/* Gender */}
            <div className="rounded-xl bg-purple-500/[0.05] border border-purple-500/15 px-3 py-3 text-center">
              <Heart className="h-4 w-4 text-purple-400 mx-auto mb-1" />
              <div className="text-sm font-black text-purple-400">{profile.gender === 'Female' ? t('femaleGender') : profile.gender}</div>
              <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{t('genderLabel')}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800/60">
          <div className="flex space-x-1">
            {(['OVERVIEW', 'MEDICAL', 'CONTACTS'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                  activeTab === tab
                    ? 'text-red-400 border-red-500 bg-red-500/[0.05]'
                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                {tab === 'OVERVIEW' && `📋 ${t('overviewTab')}`}
                {tab === 'MEDICAL' && `🏥 ${t('medicalTab')}`}
                {tab === 'CONTACTS' && `👥 ${t('trustedContactsTab')} (${contacts.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* OVERVIEW TAB */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-5">

              {/* Personal Information Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>{t('personalInfoSection')}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {renderField(t('fullNameField'), <User className="h-3 w-3 text-slate-500" />, 'name')}
                  {renderField(t('emailAddressLabel'), <Mail className="h-3 w-3 text-blue-400" />, 'email')}
                  {renderField(t('phoneNumberLabel'), <Phone className="h-3 w-3 text-emerald-400" />, 'phone')}
                  {renderField(t('ageLabel'), <Clock className="h-3 w-3 text-amber-400" />, 'age')}
                </div>
              </div>

              {/* Address Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{t('addressSectionTitle')}</span>
                </h3>
                <div className="space-y-3.5">
                  {renderField(t('homeAddressLabel'), <Home className="h-3 w-3 text-cyan-400" />, 'homeAddress')}
                  {renderField(t('preferredHospitalLabel'), <Building2 className="h-3 w-3 text-emerald-400" />, 'preferredHospital')}
                </div>
              </div>

              {/* Emergency Notes Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>{t('emergencyNotesSection')}</span>
                </h3>
                {renderField(t('firstResponderInstruct'), <FileText className="h-3 w-3 text-amber-400" />, 'emergencyNotes', true)}
              </div>

            </div>
          )}

          {/* MEDICAL TAB */}
          {activeTab === 'MEDICAL' && (
            <div className="space-y-5">

              {/* Blood Group Highlight */}
              <div className="rounded-2xl bg-gradient-to-r from-red-500/[0.06] to-rose-500/[0.03] border border-red-500/15 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('bloodLabel')}</span>
                    <div className="text-3xl font-black text-red-400 mt-1">
                      {profile.bloodGroup === 'O-Negative' ? t('oNegativeGroup') : profile.bloodGroup}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{t('universalDonor')}</p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Droplets className="h-8 w-8 text-red-400" />
                  </div>
                </div>
              </div>

              {/* Medical Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {renderField(t('genderLabel'), <Heart className="h-3 w-3 text-purple-400" />, 'gender')}
                {renderField(t('ageLabel'), <Clock className="h-3 w-3 text-blue-400" />, 'age')}
              </div>

              {renderField(t('medicalConditionsField'), <Stethoscope className="h-3 w-3 text-red-400" />, 'medicalConditions', true)}
              {renderField(t('knownAllergiesLabel'), <AlertCircle className="h-3 w-3 text-amber-400" />, 'allergies')}
              {renderField(t('currentMedicationsLabel'), <Stethoscope className="h-3 w-3 text-cyan-400" />, 'medications')}
              {renderField(t('insuranceIdLabel'), <FileText className="h-3 w-3 text-slate-400" />, 'insuranceId')}

              {/* Medical Alert Warning Box */}
              <div className="rounded-xl bg-amber-500/[0.05] border border-amber-500/15 px-4 py-3 flex items-start space-x-3">
                <AlertCircle className="h-4.5 w-4.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-400">{t('medicalAlertBoxHeader')}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {t('medicalAlertBoxDesc')}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* CONTACTS TAB */}
          {activeTab === 'CONTACTS' && (
            <div className="space-y-3.5">
              {contacts.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="h-14 w-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <Shield className="h-7 w-7 text-slate-650" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-400 font-semibold">{t('noContactsSet')}</p>
                    <p className="text-[11px] text-slate-600 mt-1">{t('addContactsDesc')}</p>
                  </div>
                </div>
              ) : (
                contacts.map((c, idx) => {
                  const contactInitials = c.name.split(' ').map(n => n[0]).join('').toUpperCase();
                  const colors = [
                    { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
                    { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
                    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
                    { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
                    { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
                  ];
                  const color = colors[idx % colors.length];

                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center space-x-3.5">
                        {/* Avatar */}
                        <div className={`flex-shrink-0 h-11 w-11 rounded-xl ${color.bg} ${color.text} border ${color.border} flex items-center justify-center font-bold text-sm`}>
                          {contactInitials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-white truncate">{c.name}</span>
                            <span className="flex-shrink-0 rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[9px] font-bold text-slate-400 uppercase">
                              {c.relationship === 'Parent' ? t('relationshipParent') :
                               c.relationship === 'Sibling' ? t('relationshipSibling') :
                               c.relationship === 'Spouse' ? t('relationshipSpouse') :
                               c.relationship === 'Friend' ? t('relationshipFriend') :
                               c.relationship === 'Warden/Security' ? t('relationshipWardenSecurity') :
                               c.relationship === 'Family' ? t('relationshipFamily') : c.relationship}
                            </span>
                            {c.priority === 'PRIMARY' && (
                              <span className="flex-shrink-0 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-400 uppercase">
                                {t('primary')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1.5">
                            <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                              <Phone className="h-3 w-3 text-slate-500" />
                              <span>{c.phone}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                              <Mail className="h-3 w-3 text-slate-500" />
                              <span className="truncate max-w-[180px]">{c.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Verified Badge */}
                        <div className="flex-shrink-0">
                          {c.isVerified ? (
                            <span className="flex items-center space-x-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                              <Check className="h-3 w-3" />
                              <span>{t('verifiedBadgeText')}</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                              <Clock className="h-3 w-3" />
                              <span>{t('pendingStatusText')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/60 flex items-center justify-between">
          <p className="text-[10px] text-slate-500">
            {t('profileEncryptedDesc')}
          </p>
          <button onClick={onClose} className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-xs font-bold text-slate-200 transition-all active:scale-95">
            {t('closeBtn')}
          </button>
        </div>

      </div>
    </div>
  );
};
