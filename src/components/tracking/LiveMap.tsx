import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GeoLocation } from '../../types';
import { useI18n } from '../../services/i18n';
import { simplifyBreadcrumbs } from '../../utils/geoUtils';

interface LiveMapProps {
  location: GeoLocation;
  breadcrumbs?: GeoLocation[];
  userName?: string;
  isEmergency?: boolean;
  height?: string;
  simplificationTolerance?: number;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  location,
  breadcrumbs = [],
  userName = 'User',
  isEmergency = true,
  height = '450px',
  simplificationTolerance = 0.00005
}) => {
  const { t } = useI18n();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  
  // Responder Markers Refs
  const brotherMarkerRef = useRef<L.Marker | null>(null);
  const securityMarkerRef = useRef<L.Marker | null>(null);

  // Emergency Services Nodes Refs
  const hospitalMarkerRef = useRef<L.Marker | null>(null);
  const policeMarkerRef = useRef<L.Marker | null>(null);

  // Safe Zones Refs
  const safeZoneCircle1Ref = useRef<L.Circle | null>(null);
  const safeZoneMarker1Ref = useRef<L.Marker | null>(null);
  const safeZoneCircle2Ref = useRef<L.Circle | null>(null);
  const safeZoneMarker2Ref = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [location.lat, location.lng],
        zoom: 16,
        zoomControl: false
      });

      // Check if light mode is active on document root
      const isLightMode = document.documentElement.classList.contains('light');
      const tileUrl = isLightMode 
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://carto.com/">CartoDB</a> &copy; OpenStreetMap'
      }).addTo(map);

      // 1. Animated user location marker
      const animatedUserIcon = L.divIcon({
        className: 'custom-emergency-marker',
        html: `
          <div class="relative flex h-8 w-8 items-center justify-center">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isEmergency ? 'bg-red-500' : 'bg-emerald-500'} opacity-75"></span>
            <span class="relative inline-flex h-5 w-5 rounded-full ${isEmergency ? 'bg-red-600' : 'bg-emerald-600'} border-2 border-white shadow-lg"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([location.lat, location.lng], { icon: animatedUserIcon }).addTo(map);
      marker.bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: ${isEmergency ? '#dc2626' : '#059669'}; font-size: 13px;">${isEmergency ? '🚨 EMERGENCY ACTIVE' : '✓ POSITION LOCKED'}</strong><br/>
          <strong>Name:</strong> ${userName}<br/>
          <strong>Lat/Lng:</strong> ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}<br/>
          <strong>Accuracy:</strong> ${location.accuracy || 15}m<br/>
          <strong>Updated:</strong> ${new Date(location.timestamp).toLocaleTimeString()}
        </div>
      `);

      // 2. GPS Accuracy Circle
      const circle = L.circle([location.lat, location.lng], {
        radius: location.accuracy || 15,
        color: isEmergency ? '#ef4444' : '#10b981',
        fillColor: isEmergency ? '#ef4444' : '#10b981',
      }).addTo(map);

      // 3. Live Route Line (Polyline)
      const polyline = L.polyline(
        breadcrumbs.map(b => [b.lat, b.lng]),
        { 
          color: isEmergency ? '#ef4444' : '#38bdf8', 
          weight: 4, 
          opacity: 0.85, 
          dashArray: isEmergency ? '6, 6' : '' 
        }
      ).addTo(map);

      // 3.5 Routing Polyline to Responder (Security Desk)
      const responderPolyline = L.polyline([], {
        color: '#f59e0b',
        weight: 3.5,
        opacity: 0.8,
        dashArray: '4, 4'
      }).addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
      polylineRef.current = polyline;
      (map as any).responderPolyline = responderPolyline;

      // 4. Render Nearby Hospital Node
      const hospitalIcon = L.divIcon({
        className: 'nearby-hospital-marker',
        html: `
          <div class="flex flex-col items-center select-none">
            <div class="bg-red-800 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow border border-red-500 whitespace-nowrap mb-1">
              ${t('hospital')}
            </div>
            <div class="h-4.5 w-4.5 rounded-full bg-red-650 border border-white flex items-center justify-center text-[10px] font-bold text-white shadow-lg">+</div>
          </div>
        `,
        iconSize: [80, 32],
        iconAnchor: [40, 32]
      });
      hospitalMarkerRef.current = L.marker(
        [location.lat + 0.0018, location.lng + 0.0022], 
        { icon: hospitalIcon }
      ).addTo(map).bindPopup(`<strong>${t('hospital')}</strong><br/>${t('hospitalPopupDesc')}`);

      // 5. Render Nearby Police Station Node
      const policeIcon = L.divIcon({
        className: 'nearby-police-marker',
        html: `
          <div class="flex flex-col items-center select-none">
            <div class="bg-blue-800 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow border border-blue-500 whitespace-nowrap mb-1">
              ${t('police')}
            </div>
            <div class="h-4.5 w-4.5 rounded-full bg-blue-700 border border-white flex items-center justify-center text-[8px] font-bold text-white shadow-lg">★</div>
          </div>
        `,
        iconSize: [80, 32],
        iconAnchor: [40, 32]
      });
      policeMarkerRef.current = L.marker(
        [location.lat - 0.0016, location.lng - 0.0024], 
        { icon: policeIcon }
      ).addTo(map).bindPopup(`<strong>${t('police')}</strong><br/>${t('policePopupDesc')}`);

      // 6. Safe Zone 1: Library
      const safeZoneIcon1 = L.divIcon({
        className: 'safe-zone-marker-1',
        html: `
          <div class="flex flex-col items-center select-none">
            <div class="bg-emerald-800 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow border border-emerald-500 whitespace-nowrap mb-1">
              ${t('librarySafeZoneText')}
            </div>
            <div class="h-4.5 w-4.5 rounded-full bg-emerald-600 border border-white flex items-center justify-center text-[8px] font-bold text-white shadow-lg">✓</div>
          </div>
        `,
        iconSize: [80, 32],
        iconAnchor: [40, 32]
      });
      safeZoneCircle1Ref.current = L.circle([location.lat + 0.0008, location.lng - 0.0015], {
        radius: 80,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.08,
        weight: 1.2,
        dashArray: '4, 4'
      }).addTo(map);
      safeZoneMarker1Ref.current = L.marker(
        [location.lat + 0.0008, location.lng - 0.0015],
        { icon: safeZoneIcon1 }
      ).addTo(map).bindPopup(`<strong>${t('librarySafeZoneText')}</strong><br/>${t('librarySafeZoneDesc')}`);

      // 7. Safe Zone 2: Gate Guard Post
      const safeZoneIcon2 = L.divIcon({
        className: 'safe-zone-marker-2',
        html: `
          <div class="flex flex-col items-center select-none">
            <div class="bg-emerald-800 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow border border-emerald-500 whitespace-nowrap mb-1">
              ${t('gateGuardPostText')}
            </div>
            <div class="h-4.5 w-4.5 rounded-full bg-emerald-600 border border-white flex items-center justify-center text-[8px] font-bold text-white shadow-lg">✓</div>
          </div>
        `,
        iconSize: [80, 32],
        iconAnchor: [40, 32]
      });
      safeZoneCircle2Ref.current = L.circle([location.lat - 0.0012, location.lng + 0.0018], {
        radius: 80,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.08,
        weight: 1.2,
        dashArray: '4, 4'
      }).addTo(map);
      safeZoneMarker2Ref.current = L.marker(
        [location.lat - 0.0012, location.lng + 0.0018],
        { icon: safeZoneIcon2 }
      ).addTo(map).bindPopup(`<strong>${t('gateGuardPostText')}</strong><br/>${t('gateGuardPostDesc')}`);

      // Responder markers if active emergency
      if (isEmergency) {
        const brotherIcon = L.divIcon({
          className: 'custom-brother-marker',
          html: `
            <div class="flex flex-col items-center select-none">
              <div class="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-blue-400 whitespace-nowrap mb-1">
                ${t('brotherText')} (ETA 7m)
              </div>
              <div class="h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-white shadow-md animate-pulse"></div>
            </div>
          `,
          iconSize: [80, 40],
          iconAnchor: [40, 40]
        });
        brotherMarkerRef.current = L.marker([location.lat + 0.0012, location.lng - 0.0018], { icon: brotherIcon }).addTo(map);

        const securityIcon = L.divIcon({
          className: 'custom-security-marker',
          html: `
            <div class="flex flex-col items-center select-none">
              <div class="bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-amber-400 whitespace-nowrap mb-1">
                ${t('campusSecurityTitle')} (ETA 4m)
              </div>
              <div class="h-3.5 w-3.5 rounded-full bg-amber-500 border-2 border-white shadow-md animate-pulse"></div>
            </div>
          `,
          iconSize: [120, 40],
          iconAnchor: [60, 40]
        });
        securityMarkerRef.current = L.marker([location.lat - 0.0015, location.lng + 0.0012], { icon: securityIcon }).addTo(map);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update positions smoothly when location or breadcrumbs change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const latLng: [number, number] = [location.lat, location.lng];

    if (markerRef.current) {
      markerRef.current.setLatLng(latLng);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng(latLng);
      circleRef.current.setRadius(location.accuracy || 15);
    }

    if (polylineRef.current && breadcrumbs.length > 0) {
      const simplified = breadcrumbs.length > 15 
        ? simplifyBreadcrumbs(breadcrumbs, simplificationTolerance) 
        : breadcrumbs;
      const coords: [number, number][] = simplified.map(b => [b.lat, b.lng]);
      polylineRef.current.setLatLngs(coords);
      
      // Update color dynamically based on state
      polylineRef.current.setStyle({
        color: isEmergency ? '#ef4444' : '#38bdf8',
        dashArray: isEmergency ? '6, 6' : ''
      });
    }

    // Keep hospitals & police stations nearby the active location
    if (hospitalMarkerRef.current) {
      hospitalMarkerRef.current.setLatLng([location.lat + 0.0018, location.lng + 0.0022]);
    }
    if (policeMarkerRef.current) {
      policeMarkerRef.current.setLatLng([location.lat - 0.0016, location.lng - 0.0024]);
    }

    // Keep safe zones nearby
    if (safeZoneCircle1Ref.current && safeZoneMarker1Ref.current) {
      safeZoneCircle1Ref.current.setLatLng([location.lat + 0.0008, location.lng - 0.0015]);
      safeZoneMarker1Ref.current.setLatLng([location.lat + 0.0008, location.lng - 0.0015]);
    }
    if (safeZoneCircle2Ref.current && safeZoneMarker2Ref.current) {
      safeZoneCircle2Ref.current.setLatLng([location.lat - 0.0012, location.lng + 0.0018]);
      safeZoneMarker2Ref.current.setLatLng([location.lat - 0.0012, location.lng + 0.0018]);
    }

    // Dynamic responder updates & routing line drawing
    if (isEmergency) {
      const brotherLoc: [number, number] = [location.lat + 0.0006, location.lng - 0.0009];
      const securityLoc: [number, number] = [location.lat - 0.0007, location.lng + 0.0006];

      // Calculate dynamic ETA based on distance
      const distanceSecurity = Math.sqrt(Math.pow(location.lat - securityLoc[0], 2) + Math.pow(location.lng - securityLoc[1], 2));
      const etaMinutes = Math.max(1, Math.round(distanceSecurity * 2500)); // Dynamic ETA conversion

      if (!brotherMarkerRef.current) {
        const brotherIcon = L.divIcon({
          className: 'custom-brother-marker',
          html: `
            <div class="flex flex-col items-center select-none">
              <div class="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-blue-400 whitespace-nowrap mb-1">
                Brother (ETA 5m)
              </div>
              <div class="h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-white shadow-md animate-pulse"></div>
            </div>
          `,
          iconSize: [80, 40],
          iconAnchor: [40, 40]
        });
        brotherMarkerRef.current = L.marker(brotherLoc, { icon: brotherIcon }).addTo(mapInstanceRef.current);
      } else {
        brotherMarkerRef.current.setLatLng(brotherLoc);
      }

      if (!securityMarkerRef.current) {
        const securityIcon = L.divIcon({
          className: 'custom-security-marker',
          html: `
            <div class="flex flex-col items-center select-none">
              <div class="bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-amber-400 whitespace-nowrap mb-1">
                Campus Security (ETA ${etaMinutes}m)
              </div>
              <div class="h-3.5 w-3.5 rounded-full bg-amber-500 border-2 border-white shadow-md animate-pulse"></div>
            </div>
          `,
          iconSize: [120, 40],
          iconAnchor: [60, 40]
        });
        securityMarkerRef.current = L.marker(securityLoc, { icon: securityIcon }).addTo(mapInstanceRef.current);
      } else {
        // Dynamically update ETA text in security marker popup/HTML
        securityMarkerRef.current.setLatLng(securityLoc);
        const iconDiv = securityMarkerRef.current.getElement();
        if (iconDiv) {
          const labelDiv = iconDiv.querySelector('.bg-amber-600');
          if (labelDiv) {
            labelDiv.innerHTML = `Campus Security (ETA ${etaMinutes}m)`;
          }
        }
      }

      // Draw routing polyline from active user location to security responder
      const responderPolyline = (mapInstanceRef.current as any).responderPolyline;
      if (responderPolyline) {
        responderPolyline.setLatLngs([latLng, securityLoc]);
      }
    } else {
      if (brotherMarkerRef.current) {
        brotherMarkerRef.current.remove();
        brotherMarkerRef.current = null;
      }
      if (securityMarkerRef.current) {
        securityMarkerRef.current.remove();
        securityMarkerRef.current = null;
      }
    }

    mapInstanceRef.current.panTo(latLng, { animate: true, duration: 1 });
  }, [location, breadcrumbs, isEmergency]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      
      {/* Leaflet Container */}
      <div ref={mapContainerRef} style={{ height }} className="w-full z-10" />

      {/* Top Left: Live Stream Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 rounded-lg bg-slate-950/80 px-3 py-1.5 text-[11px] font-semibold text-slate-200 border border-slate-800 backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
        <span>{t('liveGpsStream')}</span>
      </div>

      {/* Top Right: Custom Zoom Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col space-y-1">
        <button
          onClick={handleZoomIn}
          className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-slate-950/90 border border-slate-850 hover:bg-slate-900 text-white font-extrabold text-xs shadow-md transition-all active:scale-90"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-slate-950/90 border border-slate-850 hover:bg-slate-900 text-white font-extrabold text-xs shadow-md transition-all active:scale-90"
        >
          -
        </button>
      </div>

      {/* Bottom Left Overlay: Address Display Badge */}
      {location.address && (
        <div className="absolute bottom-3 left-3 right-18 z-20 rounded-lg bg-slate-950/95 px-3 py-1.5 text-[10px] text-slate-200 border border-slate-855 backdrop-blur-md truncate shadow-lg">
          <strong className="text-slate-400">{t('nearAddressText')}:</strong> {location.address.includes('Connaught Place') ? t('connaughtPlaceAddress') : location.address}
        </div>
      )}

      {/* Bottom Right Overlays: Coordinates & GPS Accuracy Indicator */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col space-y-1 text-right">
        <div className="rounded-lg bg-slate-950/80 px-2 py-0.5 text-[11px] text-slate-405 text-slate-300 font-bold border border-slate-850 backdrop-blur-md whitespace-nowrap">
          Acc: ±{location.accuracy || 8}m
        </div>
        <div className="rounded-lg bg-slate-950/80 px-2.5 py-0.5 text-[11px] text-slate-400 font-mono border border-slate-850 backdrop-blur-md whitespace-nowrap">
          {location.lat.toFixed(5)}°, {location.lng.toFixed(5)}°
        </div>
      </div>

    </div>
  );
};
