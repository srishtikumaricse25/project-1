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
  static async getCurrentLocation(): Promise<GeoLocation> {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const loc: GeoLocation = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed,
              heading: pos.coords.heading,
              altitude: pos.coords.altitude,
              timestamp: pos.timestamp,
              address: `${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`
            };

            // Attempt reverse geocode using OpenStreetMap Nominatim
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json`);
              const data = await res.json();
              if (data && data.display_name) {
                loc.address = data.display_name.split(',').slice(0, 3).join(',');
              }
            } catch (e) {
              // Ignore network errors on reverse geocode
            }

            resolve(loc);
          },
          (err) => {
            console.warn('Browser Geolocation error, returning default simulator location:', err.message);
            resolve({ ...DEFAULT_LOCATION, timestamp: Date.now() });
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        resolve({ ...DEFAULT_LOCATION, timestamp: Date.now() });
      }
    });
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
    return 84; // Default realistic battery level
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

    const step = mode === 'WALK' ? 0.00015 : 0.0006; // Approximate step size in lat/lng degrees
    const randomAngle = (Math.random() - 0.5) * 0.4; // slight curve
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
