'use client';

import { useState, useTransition } from 'react';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { haversineDistance, formatDistance } from '@/lib/utils/distance';
import { checkIn, checkOut } from '@/lib/actions/attendance';
import { Attendance, Settings, Profile } from '@/lib/types';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { FaceCamera } from './FaceCamera';

interface AttendanceButtonProps {
  initial: Attendance | null;
  settings: Settings | null;
  profile: Profile;
}

export function AttendanceClient({ initial, settings, profile }: AttendanceButtonProps) {
  const [attendance, setAttendance] = useState<Attendance | null>(initial);
  const [isPending, startTransition] = useTransition();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'check_in' | 'check_out' | null>(null);
  const geo = useGeolocation();

  const schoolLat = settings?.school_lat ?? -6.2088;
  const schoolLng = settings?.school_lng ?? 106.8456;
  const radius    = settings?.allowed_radius_m ?? 100;

  const distanceM = (geo.lat && geo.lng)
    ? haversineDistance(geo.lat, geo.lng, schoolLat, schoolLng)
    : null;

  const withinRadius = distanceM !== null && distanceM <= radius;

  const canCheckIn  = !attendance?.check_in  && withinRadius && !geo.loading;
  const canCheckOut = !!attendance?.check_in && !attendance?.check_out && withinRadius && !geo.loading;

  const openFaceVerification = (action: 'check_in' | 'check_out') => {
    if (!geo.lat || !geo.lng) {
      toast.error('Gagal mendapatkan lokasi GPS. Harap refresh halaman.');
      return;
    }
    setPendingAction(action);
    setIsCameraOpen(true);
  };

  const handleVerified = (photoBase64: string) => {
    setIsCameraOpen(false);
    if (!pendingAction) return;

    startTransition(async () => {
      const res = pendingAction === 'check_in' 
        ? await checkIn(geo.lat!, geo.lng!, photoBase64)
        : await checkOut(geo.lat!, geo.lng!, photoBase64);

      if (res.success) {
        setAttendance(res.data);
        toast.success(pendingAction === 'check_in' 
          ? 'Pintu masuk dibuka! Identitas terverifikasi AI. ✅' 
          : 'Absen pulang berhasil! Identitas terverifikasi AI. 🏠');
      } else {
        toast.error(res.error);
      }
      setPendingAction(null);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* AI Camera Overlay */}
      {isCameraOpen && (
        <FaceCamera 
          referenceImageUrl={profile.avatar_url}
          onVerified={handleVerified}
          onCancel={() => {
            setIsCameraOpen(false);
            setPendingAction(null);
          }}
        />
      )}

      {/* Map Placeholder Widget */}
      <div className="relative h-64 rounded-[2rem] overflow-hidden bg-surface-container shadow-inner border border-outline-variant/10 group">
        <div className="absolute inset-0 bg-geometric opacity-15"></div>
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
           <span className="material-symbols-outlined text-9xl text-primary/40">map</span>
        </div>
        
        {!geo.loading && !geo.error && geo.lat && (
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-5 h-5 rounded-full bg-primary z-10 relative border-2 border-white shadow-lg"></div>
                <div className="absolute inset-0 w-5 h-5 rounded-full bg-primary animate-ping opacity-60"></div>
              </div>
           </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
          <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg border border-white/50 ring-1 ring-black/5">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              geo.loading ? "bg-amber-400 animate-pulse" : withinRadius ? "bg-primary animate-pulse" : "bg-rose-500"
            )}></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">
               {geo.loading ? 'Mencari Sinyal...' : withinRadius ? 'Radius Aman • Terdeteksi' : 'Luar Jangkauan'}
            </span>
          </div>

          <button 
            onClick={geo.request} 
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-on-surface shadow-lg hover:rotate-180 transition-transform duration-700 active:scale-90 border border-white/50"
          >
            <span className={cn(
              "material-symbols-outlined text-[20px]",
              geo.loading ? "animate-spin" : ""
            )}>
              {geo.loading ? 'progress_activity' : 'refresh'}
            </span>
          </button>
        </div>

        {geo.error && (
          <div className="absolute inset-x-0 top-0 p-3 bg-error-container/90 backdrop-blur-sm border-b border-error/20 text-on-error-container text-[11px] font-bold text-center uppercase tracking-widest animate-fade-in">
            Lokasi: {geo.error}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          disabled={!canCheckIn || isPending}
          onClick={() => openFaceVerification('check_in')}
          className={cn(
            "py-5 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed",
            canCheckIn 
              ? "bg-gradient-to-br from-primary to-primary-dim text-white shadow-primary/20 hover:scale-[1.01] active:scale-[0.98]" 
              : "bg-surface-container-low text-on-surface-variant/40 shadow-none border border-outline-variant/10"
          )}
        >
          {isPending && pendingAction === 'check_in' ? (
             <Loader2Icon className="animate-spin" size={20} />
          ) : (
            <span>Absen Masuk</span>
          )}
        </button>

        <button 
          disabled={!canCheckOut || isPending}
          onClick={() => openFaceVerification('check_out')}
          className={cn(
            "py-5 rounded-2xl font-bold text-lg transition-all duration-300 border-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
            canCheckOut
              ? "border-outline-variant text-on-surface hover:bg-surface-container-low active:scale-[0.98]"
              : "border-outline-variant/20 text-on-surface-variant/30 shadow-none"
          )}
        >
          {isPending && pendingAction === 'check_out' ? (
             <Loader2Icon className="animate-spin" size={20} />
          ) : (
            <span>Absen Pulang</span>
          )}
        </button>
      </div>

      {/* Today Result Log */}
      {attendance && (
        <section className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/10 animate-fade-in">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm border border-outline-variant/5">
                 <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                   {attendance.status === 'hadir' ? 'check_circle' : 'schedule'}
                 </span>
               </div>
               <div>
                 <p className="text-[10px] font-black text-on-surface-variant opacity-60 uppercase tracking-[0.2em] leading-none mb-1.5">Identity Secured</p>
                 <Badge variant={statusVariant(attendance.status)} className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all">
                    {statusLabel(attendance.status)}
                 </Badge>
               </div>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-2xl font-black text-on-surface tracking-tighter">
                {attendance.check_in ? format(parseISO(attendance.check_in), 'HH:mm') : '--:--'}
               </span>
               <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.1em] opacity-40">Verified AI</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Loader2Icon({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size ?? 24} 
      height={size ?? 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
