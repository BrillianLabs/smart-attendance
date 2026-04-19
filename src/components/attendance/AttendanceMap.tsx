'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue in Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const SchoolIcon = L.divIcon({
  className: 'custom-school-icon',
  html: `<div class="w-10 h-10 bg-primary rounded-full border-4 border-white shadow-xl flex items-center justify-center animate-bounce">
           <span class="material-symbols-outlined text-white text-[20px]">school</span>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const UserIcon = L.divIcon({
  className: 'custom-user-icon',
  html: `<div class="relative">
           <div class="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg z-10"></div>
           <div class="absolute inset-0 w-5 h-5 bg-blue-500 rounded-full animate-ping opacity-60"></div>
         </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  userLat: number | null;
  userLng: number | null;
  schoolLat: number;
  schoolLng: number;
  radius: number;
}

function MapResizer({ userLat, userLng, schoolLat, schoolLng }: { userLat: number | null, userLng: number | null, schoolLat: number, schoolLng: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (userLat && userLng) {
      const bounds = L.latLngBounds([
        [userLat, userLng],
        [schoolLat, schoolLng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else {
      map.setView([schoolLat, schoolLng], 16);
    }
  }, [map, userLat, userLng, schoolLat, schoolLng]);
  
  return null;
}

export default function AttendanceMap({ userLat, userLng, schoolLat, schoolLng, radius }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full bg-surface-container animate-pulse flex items-center justify-center text-[10px] font-black uppercase tracking-widest opacity-40 text-on-surface">Initializing Map...</div>;

  return (
    <div className="w-full h-full z-0 relative">
      <MapContainer 
        center={[schoolLat, schoolLng]} 
        zoom={16} 
        style={{ height: '100%', width: '100%', filter: 'grayscale(0.2) contrast(1.1)' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* School Marker & Zone */}
        <Circle 
          center={[schoolLat, schoolLng]} 
          radius={radius}
          pathOptions={{ 
            fillColor: '#006B5E', 
            fillOpacity: 0.15, 
            color: '#006B5E', 
            weight: 2,
            dashArray: '5, 10'
          }}
        />
        <Marker position={[schoolLat, schoolLng]} icon={SchoolIcon}>
          <Popup>Titik Presensi</Popup>
        </Marker>

        {/* User Marker */}
        {userLat && userLng && (
          <Marker position={[userLat, userLng]} icon={UserIcon}>
            <Popup>Lokasi Anda</Popup>
          </Marker>
        )}

        <MapResizer userLat={userLat} userLng={userLng} schoolLat={schoolLat} schoolLng={schoolLng} />
      </MapContainer>
      
      {/* Decorative Overlays */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-[1000]"></div>
      <div className="absolute top-5 left-5 z-[1000] pointer-events-none">
         <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-white/50 text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            LIVE RADAR
         </div>
      </div>
    </div>
  );
}
