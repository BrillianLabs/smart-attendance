'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { haversineDistance, formatDistance } from '@/lib/utils/distance';
import { checkIn, checkOut } from '@/lib/actions/attendance';
import { updateSchoolLocation } from '@/lib/actions/admin';
import { Attendance, Settings, Profile } from '@/lib/types';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { FaceCamera } from './FaceCamera';

// Dynamically import the Map component to avoid SSR issues
const AttendanceMap = dynamic(
  () => import('./AttendanceMap'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-surface-container animate-pulse flex items-center justify-center text-xs font-bold opacity-30 text-on-surface">Memuat Peta...</div>
  }
);

interface AttendanceButtonProps {
  initial: Attendance | null;
  settings: Settings | null;
  profile: Profile;
}

export function AttendanceClient({ initial, settings, profile }: AttendanceButtonProps) {
  const [attendance, setAttendance] = useState<Attendance | null>(initial);
  const [isPending, startTransition] = useTransition();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'check_in' | 'check_out' | 'test' | null>(null);
  const geo = useGeolocation();

  const router = useRouter();
  const schoolLat = settings?.school_lat ?? -6.2088;
  const schoolLng = settings?.school_lng ?? 106.8456;
  const radius    = settings?.allowed_radius_m ?? 100;

  const distanceM = (geo.lat && geo.lng)
    ? haversineDistance(geo.lat, geo.lng, schoolLat, schoolLng)
    : null;

  const withinRadius = distanceM !== null && distanceM <= radius;

  const canCheckIn  = !attendance?.check_in  && withinRadius && !geo.loading;
  const canCheckOut = !!attendance?.check_in && !attendance?.check_out && withinRadius && !geo.loading;

  const openFaceVerification = (action: 'check_in' | 'check_out' | 'test') => {
    if (action !== 'test' && (!geo.lat || !geo.lng)) {
      toast.error('Gagal mendapatkan lokasi GPS. Harap refresh halaman.');
      return;
    }
    setPendingAction(action);
    setIsCameraOpen(true);
  };

  const handleVerified = (photoBase64: string) => {
    if (pendingAction === 'test') {
      setIsCameraOpen(false);
      setPendingAction(null);
      toast.success('Kamera & AI Berhasil diverifikasi! ✅');
      return;
    }

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

  const handleUpdateLocation = async () => {
    console.log('Update Location triggered with:', { lat: geo.lat, lng: geo.lng });
    
    if (!geo.lat || !geo.lng) {
      toast.error('Gagal mendapatkan lokasi GPS dari perangkat Anda.');
      return;
    }

    const loadingToast = toast.loading('Memperbarui lokasi sekolah...');
    
    startTransition(async () => {
      try {
        const res = await updateSchoolLocation(geo.lat!, geo.lng!);
        
        if (res.success) {
          toast.success('Lokasi sekolah berhasil diupdate! Radius sekarang aktif.', { id: loadingToast });
          router.refresh(); // Force fetch fresh data from server
        } else {
          toast.error(res.error || 'Terjadi kesalahan saat memperbarui lokasi.', { id: loadingToast });
        }
      } catch (err) {
        toast.error('Gagal menghubungi server.', { id: loadingToast });
        console.error(err);
      }
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

      {/* Interactive Map Widget */}
      <div className="relative z-0 h-72 rounded-[2.5rem] overflow-hidden bg-surface-container shadow-inner border border-outline-variant/10 group ring-1 ring-black/[0.03]">
        <AttendanceMap 
          userLat={geo.lat}
          userLng={geo.lng}
          schoolLat={schoolLat}
          schoolLng={schoolLng}
          radius={radius}
        />
        
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between pointer-events-none">
          <div className="flex flex-col gap-2 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg border border-white/50 ring-1 ring-black/5">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full",
                geo.loading ? "bg-amber-400 animate-pulse" : withinRadius ? "bg-primary animate-pulse" : "bg-rose-500"
              )}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">
                 {geo.loading ? 'Mencari Sinyal...' : withinRadius ? 'Radius Aman • Terdeteksi' : 'Luar Jangkauan'}
              </span>
            </div>
            
            {!geo.loading && geo.lat && distanceM !== null && (
               <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl self-start">
                  <p className="text-[8px] font-black text-white/80 uppercase tracking-widest">
                    Jarak: <span className={cn(withinRadius ? "text-primary-light" : "text-rose-400")}>{formatDistance(distanceM)}</span>
                  </p>
               </div>
            )}
          </div>

          <button 
            onClick={geo.request} 
            title="Refresh Lokasi"
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
          <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-fade-in z-20">
            <span className="material-symbols-outlined text-rose-500 text-4xl mb-3">location_off</span>
            <p className="text-white text-xs font-bold mb-4 leading-relaxed">{geo.error}</p>
            <button onClick={geo.request} className="px-6 py-2 bg-white text-rose-950 rounded-xl text-[10px] font-black uppercase tracking-widest">Coba Lagi</button>
          </div>
        )}
      </div>

      {/* Sensor Test / Permission Center */}
      {!geo.loading && !isCameraOpen && (
        <div className="bg-surface-container-low/50 rounded-2xl p-4 border border-outline-variant/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
             </div>
             <div>
                <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Sistem Keamanan</p>
                <p className="text-[11px] font-bold text-on-surface">Kamera & GPS diperlukan</p>
             </div>
          </div>
          <button 
            onClick={() => openFaceVerification('test')}
            className="px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-outline-variant shadow-sm hover:bg-surface transition-colors"
          >
            Tes Kamera
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          disabled={!canCheckIn || isPending}
          onClick={() => openFaceVerification('check_in')}
          className={cn(
            "py-5 rounded-3xl font-bold text-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed",
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
            "py-5 rounded-3xl font-bold text-lg transition-all duration-300 border-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
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

      {/* Help Note if Out of Range */}
      {!geo.loading && !withinRadius && geo.lat && (
         <div className="relative z-10 p-5 bg-amber-50 rounded-[2rem] border border-amber-200/50 flex flex-col gap-4 animate-fade-in">
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-amber-600">info</span>
              <p className="text-[11px] font-medium text-amber-900 leading-relaxed">
                Anda berada di luar radius sekolah ({radius}m). Pastikan berada di lokasi yang ditentukan untuk melakukan presense. 
                <br/><span className="font-bold opacity-60">Pusat: {schoolLat.toFixed(4)}, {schoolLng.toFixed(4)}</span>
              </p>
            </div>
            
            {profile.role === 'admin' && (
              <button 
                onClick={handleUpdateLocation}
                disabled={isPending}
                className={cn(
                  "w-full py-4 bg-amber-200/60 hover:bg-amber-300 active:scale-[0.98] text-amber-950 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-2 border-amber-900/5 shadow-sm group relative z-50 cursor-pointer",
                  isPending && "opacity-50 cursor-wait"
                )}
              >
                {isPending ? (
                  <Loader2Icon className="animate-spin" size={14} />
                ) : (
                  <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">pin_drop</span>
                )}
                Update Lokasi Sekolah ke Sini
              </button>
            )}
         </div>
      )}

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
