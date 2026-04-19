'use client';

import { Camera, Construction } from 'lucide-react';

interface FaceCaptureProps {
  onCapture?: (imageDataUrl: string) => void;
  enabled?: boolean;
}

/**
 * FaceCapture — Placeholder komponen untuk face recognition.
 *
 * Siap untuk integrasi face-api.js:
 * npm install face-api.js
 * Kemudian ganti isi komponen ini dengan implementasi face detection.
 *
 * Referensi: https://github.com/justadudewhohacks/face-api.js
 */
export function FaceCapture({ onCapture, enabled = false }: FaceCaptureProps) {
  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl bg-[var(--surface-2)] border border-dashed border-[var(--border)]">
        <div className="w-14 h-14 rounded-full bg-[var(--warning-light)] flex items-center justify-center">
          <Construction size={26} className="text-[var(--warning)]" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm text-[var(--text-primary)]">Verifikasi Wajah</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Fitur ini sedang dalam pengembangan. Integrasi face-api.js siap dilakukan.
          </p>
        </div>
      </div>
    );
  }

  // TODO: Implementasi dengan face-api.js
  // 1. Load model: faceapi.nets.tinyFaceDetector.loadFromUri('/models')
  // 2. Akses kamera: navigator.mediaDevices.getUserMedia({ video: true })
  // 3. Deteksi wajah real-time di video stream
  // 4. Capture frame dan panggil onCapture(imageDataUrl)
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full aspect-video bg-black rounded-xl flex items-center justify-center">
        <div className="text-center text-white">
          <Camera size={40} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm opacity-50">Kamera akan aktif di sini</p>
        </div>
      </div>
    </div>
  );
}
