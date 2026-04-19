'use client';

import { useState, useTransition } from 'react';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { haversineDistance, formatDistance } from '@/lib/utils/distance';
import { checkIn, checkOut } from '@/lib/actions/attendance';
import { Attendance, Settings } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant, statusLabel } from '@/components/ui/Badge';
import {
  MapPin, Navigation, CheckCircle2, Clock, AlertCircle,
  RefreshCw, Loader2, LogIn, LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface AttendanceButtonProps {
  initial: Attendance | null;
  settings: Settings | null;
}

export function AttendanceClient({ initial, settings }: AttendanceButtonProps) {
  const [attendance, setAttendance] = useState<Attendance | null>(initial);
  const [isPending, startTransition] = useTransition();
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

  const handleCheckIn = () => {
    if (!geo.lat || !geo.lng) return;
    startTransition(async () => {
      const res = await checkIn(geo.lat!, geo.lng!);
      if (res.success) {
        setAttendance(res.data);
        toast.success('Absen masuk berhasil! ✅');
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleCheckOut = () => {
    if (!geo.lat || !geo.lng) return;
    startTransition(async () => {
      const res = await checkOut(geo.lat!, geo.lng!);
      if (res.success) {
        setAttendance(res.data);
        toast.success('Absen pulang berhasil! 🏠');
      } else {
        toast.error(res.error);
      }
    });
  };

  const locationColor = geo.loading
    ? 'text-[var(--text-muted)]'
    : geo.error
    ? 'text-[var(--danger)]'
    : withinRadius
    ? 'text-[var(--success)]'
    : 'text-[var(--warning)]';

  const locationBg = geo.loading
    ? 'bg-[var(--surface-2)]'
    : geo.error
    ? 'bg-[var(--danger-light)]'
    : withinRadius
    ? 'bg-[var(--success-light)]'
    : 'bg-[var(--warning-light)]';

  return (
    <div className="space-y-6">
      {/* GPS Status Card */}
      <div className={`card p-5 ${locationBg} border-0`}>
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
              withinRadius && !geo.loading ? 'relative' : ''
            }`}>
              {geo.loading ? (
                <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
              ) : geo.error ? (
                <AlertCircle size={24} className="text-[var(--danger)]" />
              ) : withinRadius ? (
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-[var(--success)]" />
                  <div className="absolute inset-0 rounded-full bg-[var(--success)] animate-ping opacity-50" />
                </div>
              ) : (
                <Navigation size={24} className="text-[var(--warning)]" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${locationColor}`}>
              {geo.loading ? 'Mendeteksi lokasi...' :
               geo.error   ? 'Lokasi tidak tersedia' :
               withinRadius ? `Anda di dalam area sekolah` :
               `Di luar area sekolah`}
            </p>
            {!geo.loading && !geo.error && distanceM !== null && (
              <p className="text-xs mt-0.5 text-[var(--text-secondary)]">
                Jarak: <strong>{formatDistance(distanceM)}</strong> dari sekolah
                {' '}(radius {radius}m)
              </p>
            )}
            {!geo.loading && !geo.error && geo.accuracy && (
              <p className="text-xs text-[var(--text-muted)]">
                Akurasi GPS: ±{Math.round(geo.accuracy)}m
              </p>
            )}
            {geo.error && (
              <p className="text-xs mt-0.5 text-[var(--danger)]">{geo.error}</p>
            )}
          </div>

          <button
            onClick={geo.request}
            disabled={geo.loading}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors text-[var(--text-muted)]"
            title="Refresh lokasi"
          >
            <RefreshCw size={16} className={geo.loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Today attendance status */}
      {attendance && (
        <div className="card p-5">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
            Status Hari Ini
          </p>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {format(new Date(), 'EEEE, d MMMM yyyy', { locale: idLocale })}
            </span>
            <Badge variant={statusVariant(attendance.status)}>
              {statusLabel(attendance.status)}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[var(--success-light)] flex items-center gap-2.5">
              <LogIn size={18} className="text-[var(--success)]" />
              <div>
                <p className="text-xs text-[var(--text-muted)]">Masuk</p>
                <p className="font-bold text-[var(--text-primary)]">
                  {attendance.check_in ? format(parseISO(attendance.check_in), 'HH:mm') : '-'}
                </p>
              </div>
            </div>
            <div className={`p-3 rounded-lg flex items-center gap-2.5 ${
              attendance.check_out ? 'bg-[var(--info-light)]' : 'bg-[var(--surface-2)]'
            }`}>
              <LogOut size={18} className={attendance.check_out ? 'text-[var(--info)]' : 'text-[var(--text-muted)]'} />
              <div>
                <p className="text-xs text-[var(--text-muted)]">Pulang</p>
                <p className="font-bold text-[var(--text-primary)]">
                  {attendance.check_out ? format(parseISO(attendance.check_out), 'HH:mm') : 'Belum'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-1 gap-4">
        {!attendance?.check_in && (
          <Button
            size="xl"
            onClick={handleCheckIn}
            disabled={!canCheckIn || isPending}
            loading={isPending}
            className="w-full justify-center gap-3 py-5 text-lg rounded-2xl shadow-lg"
            style={canCheckIn ? { background: 'var(--success)', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' } : {}}
          >
            <LogIn size={24} />
            Absen Masuk
          </Button>
        )}

        {attendance?.check_in && !attendance?.check_out && (
          <Button
            size="xl"
            variant="secondary"
            onClick={handleCheckOut}
            disabled={!canCheckOut || isPending}
            loading={isPending}
            className="w-full justify-center gap-3 py-5 text-lg rounded-2xl border-2"
            style={canCheckOut ? { borderColor: 'var(--danger)', color: 'var(--danger)', background: 'var(--danger-light)' } : {}}
          >
            <LogOut size={24} />
            Absen Pulang
          </Button>
        )}

        {attendance?.check_out && (
          <div className="text-center py-6">
            <CheckCircle2 size={48} className="mx-auto mb-3 text-[var(--success)]" />
            <p className="font-semibold text-[var(--text-primary)]">Absensi hari ini selesai</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Sampai jumpa besok! 👋</p>
          </div>
        )}
      </div>

      {/* Out-of-range hint */}
      {!withinRadius && !geo.loading && !geo.error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--warning-light)] border border-[var(--warning)] border-opacity-40">
          <MapPin size={18} className="text-[var(--warning)] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[#92400e]">
            Anda harus berada dalam radius <strong>{radius} meter</strong> dari sekolah untuk dapat melakukan absensi.
            Pastikan GPS aktif dan Anda berada di lokasi yang benar.
          </p>
        </div>
      )}
    </div>
  );
}
