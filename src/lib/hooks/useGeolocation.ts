'use client';

import { useState, useEffect, useCallback } from 'react';
import { runClientGpsChecks } from '@/lib/utils/fakeGpsDetector';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  isFakeGps: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat:       null,
    lng:       null,
    accuracy:  null,
    error:     null,
    loading:   false,
    isFakeGps: false,
  });

  const request = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState(s => ({ ...s, error: 'Perangkat tidak mendukung GPS.', loading: false }));
      return;
    }

    setState(s => ({ ...s, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // Run fake GPS detection
        const fakeCheck = runClientGpsChecks(latitude, longitude, accuracy);
        if (fakeCheck.isSuspicious) {
          setState(s => ({
            ...s,
            lat: null, lng: null, accuracy: null,
            loading: false,
            isFakeGps: true,
            error: fakeCheck.reason ?? 'Lokasi GPS terdeteksi tidak valid.',
          }));
          return;
        }

        setState({
          lat:       latitude,
          lng:       longitude,
          accuracy:  accuracy,
          error:     null,
          loading:   false,
          isFakeGps: false,
        });
      },
      (err) => {
        let msg = 'Gagal mendapatkan lokasi.';
        if (err.code === err.PERMISSION_DENIED)    msg = 'Izin lokasi ditolak. Silakan aktifkan GPS di pengaturan browser dan refresh.';
        if (err.code === err.POSITION_UNAVAILABLE) msg = 'Informasi lokasi tidak tersedia (Signal Lemah).';
        if (err.code === err.TIMEOUT)              msg = 'Permintaan lokasi timeout. Coba lagi.';
        setState(s => ({ ...s, error: msg, loading: false }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => { request(); }, [request]);

  return { ...state, request };
}
