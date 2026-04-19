'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { cn } from '@/lib/utils/cn';
import { Loader2, CheckCircle2, XCircle, Camera } from 'lucide-react';

interface FaceCameraProps {
  referenceImageUrl?: string | null;
  onVerified: (photoBase64: string) => void;
  onCancel: () => void;
}

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

export function FaceCamera({ referenceImageUrl, onVerified, onCancel }: FaceCameraProps) {
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
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsLoaded(true);
        setStatus('scanning');
      } catch (err) {
        console.error('Failed to load face-api models', err);
        setError('Gagal memuat sistem AI. Periksa koneksi internet Anda.');
      }
    };
    loadModels();
  }, []);

  // Start Camera
  const startVideo = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' 
        } 
      });
      videoRef.current.srcObject = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.error('Webcam access error:', err);
      setError('Kamera tidak dapat diakses. Izinkan akses kamera untuk melanjutkan.');
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      startVideo();
    }
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [isLoaded, startVideo]);

  // Main Recognition Loop
  useEffect(() => {
    let animationId: number;
    let isProcessing = false;

    const handleRecognition = async () => {
      if (!videoRef.current || !canvasRef.current || !isLoaded || status === 'matched') return;

      const video = videoRef.current;
      if (video.paused || video.ended || isProcessing) {
        animationId = requestAnimationFrame(handleRecognition);
        return;
      }

      isProcessing = true;

      try {
        const detections = await faceapi.detectSingleFace(video)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detections && referenceImageUrl) {
          // If we have a reference, attempt matching
          setStatus('verifying');
          
          const refImg = await faceapi.fetchImage(referenceImageUrl);
          const refDetection = await faceapi.detectSingleFace(refImg)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (refDetection) {
            const faceMatcher = new faceapi.FaceMatcher(refDetection);
            const bestMatch = faceMatcher.findBestMatch(detections.descriptor);

            if (bestMatch.label !== 'unknown' && bestMatch.distance < 0.5) {
              setStatus('matched');
              captureAndVerify();
              isProcessing = false;
              return; // Stop loop on match
            }
          }
        }
      } catch (err) {
        console.warn('Recognition frame error:', err);
      }

      isProcessing = false;
      animationId = requestAnimationFrame(handleRecognition);
    };

    if (isLoaded && isCameraActive && status !== 'matched') {
      animationId = requestAnimationFrame(handleRecognition);
    }

    return () => cancelAnimationFrame(animationId);
  }, [isLoaded, isCameraActive, referenceImageUrl, status]);

  const captureAndVerify = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    onVerified(base64);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in border border-outline-variant/10">
        
        {/* Header */}
        <div className="p-8 border-b border-outline-variant/5 flex justify-between items-center bg-surface-container-low">
          <div>
            <h3 className="text-xl font-black text-on-surface tracking-tight">AI Identity Verification</h3>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Atelier Academy Security</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <XCircle className="text-on-surface-variant opacity-50" size={24} />
          </button>
        </div>

        {/* Camera Feed Area */}
        <div className="relative aspect-video bg-black group">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center text-white bg-rose-950/20">
              <XCircle className="text-rose-500 mb-4 animate-pulse" size={48} />
              <p className="text-sm font-bold leading-relaxed">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-white text-rose-900 rounded-xl text-xs font-black uppercase tracking-widest">Retry Connection</button>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-1000",
                  status === 'loading' ? 'opacity-0' : 'opacity-100'
                )}
              />
              <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
              
              {/* Overlay HUD */}
              <div className="absolute inset-0 border-[24px] border-black/40 pointer-events-none flex items-center justify-center">
                 <div className={cn(
                   "w-64 h-64 border-2 border-dashed rounded-[3rem] transition-all duration-500 scale-100",
                   status === 'matched' ? 'border-primary border-4 scale-105 shadow-[0_0_50px_rgba(var(--color-primary),0.3)]' : 'border-white/40 animate-pulse'
                 )}></div>
              </div>

              {/* Status Pill */}
              <div className="absolute top-6 left-6">
                <div className={cn(
                  "px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 shadow-lg border border-white/20 transition-all",
                  status === 'matched' ? 'bg-primary text-white scale-110' : 'bg-black/60 text-white'
                )}>
                  {status === 'loading' && <Loader2 className="animate-spin" size={14} />}
                  {status === 'scanning' && <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                  {status === 'verifying' && <Loader2 className="animate-spin text-primary" size={14} />}
                  {status === 'matched' && <CheckCircle2 size={14} />}
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {status === 'loading' ? 'Booting AI...' : 
                     status === 'scanning' ? 'Scanning Face...' : 
                     status === 'verifying' ? 'Verifying Identity...' : 
                     status === 'matched' ? 'Identity Confirmed' : 'Identity Denied'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-8 bg-surface-container-low">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
               <Camera size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface leading-tight">Pastikan wajah berada di dalam bingkai.</p>
              <p className="text-[10px] font-bold text-on-surface-variant opacity-50 uppercase tracking-wider mt-1">Sistem AI membandingkan landmarker wajah secara real-time.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
