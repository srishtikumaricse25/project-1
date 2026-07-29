import { GeoLocation } from '../types';

export const DEFAULT_LOCATION: GeoLocation = {
  lat: 28.6139,
  lng: 77.2090,
  accuracy: 8,
  speed: 1.5,
  heading: 90,
  altitude: 216,
  timestamp: Date.now(),
  address: 'Connaught Place, New Delhi, India'
};

export class GeolocationService {
  private static watchId: number | null = null;

  static async checkPermissionState(): Promise<PermissionState | 'unsupported'> {
    if ('permissions' in navigator && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        return status.state;
      } catch (e) {
        return 'unsupported';
      }
    }
    return 'unsupported';
  }

  static async getCurrentLocation(): Promise<GeoLocation> {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        console.warn('Geolocation API not supported by browser.');
        return resolve({ ...DEFAULT_LOCATION, timestamp: Date.now() });
      }

      // Try High Accuracy first, fallback to standard accuracy if timeout/error occurs
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = await GeolocationService.processPosition(pos);
          resolve(loc);
        },
        (err) => {
          console.warn('High accuracy GPS error:', err.message, 'Code:', err.code);
          // Fallback retry with enableHighAccuracy: false
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const loc = await GeolocationService.processPosition(pos);
              resolve(loc);
            },
            (fallbackErr) => {
              console.warn('Fallback GPS positioning error:', fallbackErr.message);
              resolve({ ...DEFAULT_LOCATION, timestamp: Date.now() });
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 10000 }
          );
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  }

  static watchPosition(
    onSuccess: (location: GeoLocation) => void,
    onError?: (error: GeolocationPositionError) => void
  ): number | null {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation API not supported by browser.');
      return null;
    }

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    this.watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const loc = await GeolocationService.processPosition(pos);
        onSuccess(loc);
      },
      (err) => {
        console.warn('watchPosition error:', err.message, 'Code:', err.code);
        if (onError) onError(err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );

    return this.watchId;
  }

  static stopWatch(): void {
    if (this.watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private static async processPosition(pos: GeolocationPosition): Promise<GeoLocation> {
    const loc: GeoLocation = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      speed: pos.coords.speed || 0,
      heading: pos.coords.heading || 0,
      altitude: pos.coords.altitude || 0,
      timestamp: pos.timestamp,
      address: `${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`
    };

    // Attempt reverse geocode using OpenStreetMap Nominatim
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          loc.address = data.display_name.split(',').slice(0, 3).join(',');
        }
      }
    } catch (e) {
      // Ignore network errors on reverse geocode
    }

    return loc;
  }

  static async getBatteryLevel(): Promise<number> {
    try {
      if ('getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
    } catch (e) {
      // Ignore
    }
    return 84;
  }

  // Simulated GPS Walker/Driver movement generator for desktop testing
  static generateSimulatedMovement(current: GeoLocation, mode: 'WALK' | 'DRIVE' | 'STATIONARY'): GeoLocation {
    if (mode === 'STATIONARY') {
      return {
        ...current,
        timestamp: Date.now(),
        speed: 0
      };
    }

    const step = mode === 'WALK' ? 0.00015 : 0.0006;
    const randomAngle = (Math.random() - 0.5) * 0.4;
    const headingRad = ((current.heading || 90) * Math.PI) / 180 + randomAngle;

    const newLat = current.lat + step * Math.cos(headingRad);
    const newLng = current.lng + step * Math.sin(headingRad);
    const newHeading = Math.round((headingRad * 180) / Math.PI) % 360;

    return {
      lat: newLat,
      lng: newLng,
      accuracy: Math.floor(5 + Math.random() * 5),
      speed: mode === 'WALK' ? 1.4 : 12.5,
      heading: newHeading < 0 ? newHeading + 360 : newHeading,
      altitude: (current.altitude || 200) + (Math.random() - 0.5),
      timestamp: Date.now(),
      address: current.address || `${newLat.toFixed(4)}° N, ${newLng.toFixed(4)}° E`
    };
  }
}
