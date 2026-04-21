'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { cn } from '@/lib/utils/cn';
import { Loader2, CheckCircle2, XCircle, Camera, ShieldCheck } from 'lucide-react';

interface FaceCameraProps {
  referenceImageUrl?: string | null;
  onVerified: (photoBase64: string) => void;
  onCancel: () => void;
  mode?: 'verify' | 'capture';
}

const MODEL_URL = '/models';

export function FaceCamera({ referenceImageUrl, onVerified, onCancel, mode = 'verify' }: FaceCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [status, setStatus] = useState<'loading' | 'scanning' | 'verifying' | 'matched' | 'failed'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load face-api models', err);
        setError('Gagal memuat sistem AI. Periksa koneksi internet atau hubungi admin.');
      }
    };
    loadModels();
  }, []);

  // Start camera after models are loaded
  const startVideo = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      videoRef.current.srcObject = stream;
      setIsCameraActive(true);
      setStatus('scanning');
    } catch (err) {
      console.error('Webcam access error:', err);
      setError('Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan di browser.');
    }
  }, []);

  useEffect(() => {
    if (isLoaded) startVideo();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [isLoaded, startVideo]);

  // Recognition loop with 300ms throttle
  useEffect(() => {
    let animationId: number;
    let lastDetectionTime = 0;

    const handleRecognition = async () => {
      if (!videoRef.current || !isLoaded || status === 'matched') return;
      const video = videoRef.current;
      if (video.paused || video.ended || mode === 'capture') {
        animationId = requestAnimationFrame(handleRecognition);
        return;
      }

      const now = Date.now();
      if (now - lastDetectionTime < 300) {
        animationId = requestAnimationFrame(handleRecognition);
        return;
      }
      lastDetectionTime = now;

      try {
        const detections = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detections && referenceImageUrl) {
          setStatus('verifying');
          const refImg = await faceapi.fetchImage(referenceImageUrl);
          const refDetection = await faceapi
            .detectSingleFace(refImg, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();
          if (refDetection) {
            const matcher = new faceapi.FaceMatcher(refDetection);
            const best = matcher.findBestMatch(detections.descriptor);
            if (best.label !== 'unknown' && best.distance < 0.6) {
              setStatus('matched');
              captureAndVerify();
              return;
            }
          }
          setStatus('scanning');
        } else if (detections && !referenceImageUrl) {
          setStatus('scanning');
        }
      } catch { /* ignore per-frame errors */ }

      animationId = requestAnimationFrame(handleRecognition);
    };

    if (isLoaded && isCameraActive && status !== 'matched') {
      animationId = requestAnimationFrame(handleRecognition);
    }
    return () => cancelAnimationFrame(animationId);
  }, [isLoaded, isCameraActive, referenceImageUrl, status, mode]);

  const captureAndVerify = () => {
    if (!videoRef.current) return;
    if (videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => { t.enabled = false; });
    }
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    onVerified(canvas.toDataURL('image/jpeg', 0.8));
  };

  const statusLabel = status === 'loading'
    ? 'Menyiapkan AI...'
    : mode === 'capture'
      ? 'Kamera Aktif'
      : status === 'scanning'
        ? (referenceImageUrl ? 'Memindai Wajah...' : 'Kamera Siap')
        : status === 'verifying'
          ? 'Verifikasi...'
          : status === 'matched'
            ? 'Terverifikasi!'
            : 'Ditolak';

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="bg-surface-container-lowest w-full max-w-sm sm:max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-outline-variant/10" style={{ maxHeight: '90dvh' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="text-primary" size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-on-surface leading-none">
                {mode === 'capture' ? 'Update Foto Profil' : 'Verifikasi Identitas AI'}
              </p>
              <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider mt-1 opacity-60">
                Sistem Keamanan Sekolah
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-low text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] opacity-40">close</span>
          </button>
        </div>

        {/* ── Camera Feed ── */}
        <div className="relative w-full bg-slate-900 overflow-hidden" style={{ height: 'min(60vw, 300px)' }} >
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <XCircle className="text-rose-400 mb-3" size={40} />
              <p className="text-white text-sm font-semibold leading-relaxed">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-5 px-5 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <>
              {/* Loading shimmer before camera is ready */}
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="text-white animate-spin" size={32} />
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">
                    Menyiapkan kamera...
                  </p>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={cn(
                  'w-full h-full object-cover transition-opacity duration-500',
                  isCameraActive ? 'opacity-100' : 'opacity-0'
                )}
              />
              <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

              {/* Face guide oval */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Dark vignette around the oval */}
                <div className="absolute inset-0 bg-black/40" style={{ maskImage: 'radial-gradient(ellipse 55% 65% at 50% 48%, transparent 95%, black 100%)', WebkitMaskImage: 'radial-gradient(ellipse 55% 65% at 50% 48%, transparent 95%, black 100%)' }} />
                {/* Oval border */}
                <div className={cn(
                  'w-[50%] h-[70%] rounded-[50%] border-2 transition-all duration-500',
                  status === 'matched'
                    ? 'border-emerald-400 border-[3px] shadow-[0_0_30px_rgba(52,211,153,0.6)]'
                    : status === 'verifying'
                      ? 'border-blue-400 animate-pulse'
                      : 'border-white/70 border-dashed'
                )} />
              </div>

              {/* Status pill — top-center */}
              <div className="absolute top-3 inset-x-0 flex justify-center">
                <div className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-white text-[10px] font-black uppercase tracking-wider transition-all',
                  status === 'matched'
                    ? 'bg-emerald-500/80 border-emerald-400/50'
                    : status === 'verifying'
                      ? 'bg-blue-500/70 border-blue-400/50'
                      : 'bg-black/50 border-white/20'
                )}>
                  {(status === 'loading' || status === 'verifying') && <Loader2 size={10} className="animate-spin" />}
                  {status === 'scanning' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                  {status === 'matched' && <CheckCircle2 size={10} />}
                  {statusLabel}
                </div>
              </div>

              {/* Manual capture button */}
              {(mode === 'capture' || (!referenceImageUrl && status === 'scanning')) && isCameraActive && status !== 'matched' && (
                <div className="absolute inset-x-0 bottom-5 flex justify-center">
                  <div className="bg-black/60 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10 flex flex-col items-center gap-3">
                    {mode === 'verify' && (
                      <p className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
                        Foto profil belum diatur admin
                      </p>
                    )}
                    <button
                      onClick={() => { if (mode === 'verify') setStatus('matched'); captureAndVerify(); }}
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                      <Camera size={14} />
                      {mode === 'capture' ? 'Ambil Foto' : 'Ambil & Lanjut'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer hint ── */}
        <div className="px-5 py-4 bg-surface-container-low border-t border-outline-variant/10">
          <p className="text-xs text-on-surface-variant font-medium text-center leading-relaxed">
            Posisikan wajah Anda di dalam bingkai oval dan pastikan pencahayaan cukup.
          </p>
        </div>
      </div>
    </div>
  );
}
