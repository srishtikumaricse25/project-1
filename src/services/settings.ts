export interface AppSettings {
  pushNotifications: boolean;
  sosAlerts: boolean;
  checkInReminders: boolean;
  soundAlerts: boolean;
  gpsPermission: boolean;
  highAccuracyGps: boolean;
  backgroundTracking: boolean;
  themeMode: 'dark' | 'light' | 'auto';
  language: 'English' | 'Hindi';
  shareLocation: boolean;
  anonymousMode: boolean;
  dataEncryption: boolean;
  biometricsEnabled: boolean;
}

export const defaultSettings: AppSettings = {
  pushNotifications: true,
  sosAlerts: true,
  checkInReminders: true,
  soundAlerts: false,
  gpsPermission: true,
  highAccuracyGps: true,
  backgroundTracking: true,
  themeMode: 'dark',
  language: 'English',
  shareLocation: true,
  anonymousMode: false,
  dataEncryption: true,
  biometricsEnabled: true,
};

export const loadSavedSettings = (): AppSettings => {
  const savedTheme = (localStorage.getItem('sos-theme-mode') as 'dark' | 'light' | 'auto') || 'dark';
  
  const getBool = (key: string, defaultValue: boolean): boolean => {
    const item = localStorage.getItem(`sos-setting-${key}`);
    return item !== null ? item === 'true' : defaultValue;
  };

  return {
    pushNotifications: getBool('pushNotifications', true),
    sosAlerts: getBool('sosAlerts', true),
    checkInReminders: getBool('checkInReminders', true),
    soundAlerts: getBool('soundAlerts', false),
    gpsPermission: getBool('gpsPermission', true),
    highAccuracyGps: getBool('highAccuracyGps', true),
    backgroundTracking: getBool('backgroundTracking', true),
    themeMode: savedTheme,
    language: 'English',
    shareLocation: getBool('shareLocation', true),
    anonymousMode: getBool('anonymousMode', false),
    dataEncryption: getBool('dataEncryption', true),
    biometricsEnabled: getBool('biometricsEnabled', true),
  };
};

export const saveSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
  if (key === 'themeMode') {
    localStorage.setItem('sos-theme-mode', value as string);
  } else {
    localStorage.setItem(`sos-setting-${key}`, String(value));
  }
};
