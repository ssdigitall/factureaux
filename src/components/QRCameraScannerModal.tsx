import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Zap,
  ZapOff,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Image as ImageIcon,
  Sparkles,
  User,
  Receipt,
  Search,
} from 'lucide-react';
import jsQR from 'jsqr';
import { store } from '../services/store';
import { toast } from '../services/toastService';
import { Abonne, Facture } from '../types';

export interface ScannedResult {
  rawText: string;
  type: 'ABONNE' | 'FACTURE' | 'AUTRE';
  abonne?: Abonne;
  facture?: Facture;
  unpaidFactures: Facture[];
}

interface QRCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: ScannedResult) => void;
}

export const QRCameraScannerModal: React.FC<QRCameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string>('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchActive, setTorchActive] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [detectedBadge, setDetectedBadge] = useState<string | null>(null);

  const abonnes = store.getAbonnes();
  const factures = store.getFactures();

  // Web Audio chime for successful scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.12); // A6
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch {
      // AudioContext not allowed or disabled
    }
  };

  // Parse QR content (FACTUREAU formats or raw codes)
  const parseQRData = useCallback(
    (raw: string): ScannedResult => {
      const trimmed = raw.trim();
      let abonneCode = '';
      let factureNum = '';

      if (trimmed.startsWith('FACTUREAU|')) {
        const parts = trimmed.split('|');
        // Format 1: FACTUREAU|FACT-xxx|ABN-xxx|montant|...
        // Format 2: FACTUREAU|ABONNE|ABN-xxx|Nom
        if (parts[1] === 'ABONNE') {
          abonneCode = parts[2] || '';
        } else if (parts[1].startsWith('FACT-')) {
          factureNum = parts[1];
          abonneCode = parts[2] || '';
        } else {
          abonneCode = parts[1] || '';
        }
      } else if (trimmed.startsWith('FACT-')) {
        factureNum = trimmed;
      } else if (trimmed.startsWith('ABN-')) {
        abonneCode = trimmed;
      } else {
        // Search if string contains ABN-xxx or FACT-xxx
        const abnMatch = trimmed.match(/ABN-[A-Za-z0-9_-]+/);
        if (abnMatch) abonneCode = abnMatch[0];
        const factMatch = trimmed.match(/FACT-[A-Za-z0-9_-]+/);
        if (factMatch) factureNum = factMatch[0];
      }

      let matchedFacture = factureNum
        ? factures.find((f) => f.numeroFacture.toLowerCase() === factureNum.toLowerCase())
        : undefined;

      let matchedAbonne: Abonne | undefined;
      if (abonneCode) {
        matchedAbonne = abonnes.find(
          (a) => a.codeAbonne.toLowerCase() === abonneCode.toLowerCase()
        );
      }

      if (!matchedAbonne && matchedFacture) {
        matchedAbonne = abonnes.find((a) => a.id === matchedFacture?.abonneId);
      }

      if (matchedAbonne && !matchedFacture) {
        // Pick the oldest unpaid invoice for this subscriber
        matchedFacture = factures.find(
          (f) => f.abonneId === matchedAbonne?.id && f.resteDuFCFA > 0
        );
      }

      const unpaidList = matchedAbonne
        ? factures.filter((f) => f.abonneId === matchedAbonne?.id && f.resteDuFCFA > 0)
        : matchedFacture && matchedFacture.resteDuFCFA > 0
        ? [matchedFacture]
        : [];

      const resultType: 'ABONNE' | 'FACTURE' | 'AUTRE' = matchedAbonne
        ? 'ABONNE'
        : matchedFacture
        ? 'FACTURE'
        : 'AUTRE';

      return {
        rawText: trimmed,
        type: resultType,
        abonne: matchedAbonne,
        facture: matchedFacture,
        unpaidFactures: unpaidList,
      };
    },
    [abonnes, factures]
  );

  const handleValidCodeFound = useCallback(
    (codeText: string) => {
      setIsScanning(false);
      playBeep();
      setDetectedBadge(codeText);

      const parsed = parseQRData(codeText);

      setTimeout(() => {
        onScanSuccess(parsed);
      }, 600);
    },
    [onScanSuccess, parseQRData]
  );

  // Initialize Camera Stream
  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      return;
    }

    setIsScanning(true);
    setCameraError(null);
    setDetectedBadge(null);

    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Caméra non prise en charge par ce navigateur.');
        }

        // List cameras
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = devices.filter((d) => d.kind === 'videoinput');
          setCameras(videoDevs);
        } catch {
          // ignore device enumeration failure
        }

        const constraints: MediaStreamConstraints = {
          video: currentCameraId
            ? { deviceId: { exact: currentCameraId } }
            : {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
          audio: false,
        };

        const media = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = media;
        setStream(media);

        if (videoRef.current) {
          videoRef.current.srcObject = media;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        // Check torch support
        const track = media.getVideoTracks()[0];
        if (track && 'getCapabilities' in track) {
          const caps = (track as unknown as { getCapabilities: () => { torch?: boolean } }).getCapabilities();
          setTorchSupported(!!caps?.torch);
        }
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraError("Autorisation d'accès à la caméra refusée par l'utilisateur ou la politique de sécurité.");
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setCameraError('Aucune caméra détectée sur cet appareil.');
        } else {
          setCameraError(error.message || 'Impossible de démarrer la caméra.');
        }
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, currentCameraId]);

  // Frame processing loop with jsQR & BarcodeDetector
  useEffect(() => {
    if (!isOpen || !stream || !isScanning) return;

    let animationFrameId: number;
    let barcodeDetector: unknown = null;

    if ('BarcodeDetector' in window) {
      try {
        const DetectorClass = (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => unknown }).BarcodeDetector;
        barcodeDetector = new DetectorClass({ formats: ['qr_code'] });
      } catch {
        barcodeDetector = null;
      }
    }

    const scanFrame = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const width = video.videoWidth;
        const height = video.videoHeight;

        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);

            // 1. Try Native BarcodeDetector first (faster if available)
            let detected = false;
            if (barcodeDetector && 'detect' in (barcodeDetector as { detect: (canvas: HTMLCanvasElement) => Promise<Array<{ rawValue: string }>> })) {
              try {
                const barcodes = await (barcodeDetector as { detect: (canvas: HTMLCanvasElement) => Promise<Array<{ rawValue: string }>> }).detect(canvas);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  detected = true;
                  handleValidCodeFound(barcodes[0].rawValue);
                  return;
                }
              } catch {
                // fall back to jsQR
              }
            }

            // 2. jsQR fallback for universal browser & mobile compatibility
            if (!detected) {
              try {
                const imgData = ctx.getImageData(0, 0, width, height);
                const qr = jsQR(imgData.data, width, height, {
                  inversionAttempts: 'dontInvert',
                });

                if (qr && qr.data) {
                  handleValidCodeFound(qr.data);
                  return;
                }
              } catch {
                // frame read failed, continue loop
              }
            }
          }
        }
      }

      if (isScanning) {
        animationFrameId = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameId = requestAnimationFrame(scanFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, stream, isScanning, handleValidCodeFound]);

  // Flashlight toggle
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torchActive } as unknown as MediaTrackConstraintSet],
        });
        setTorchActive(!torchActive);
      } catch {
        // torch not toggleable
      }
    }
  };

  // Switch camera
  const switchCamera = () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex((c) => c.deviceId === currentCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setCurrentCameraId(cameras[nextIndex].deviceId);
  };

  // Image file scanner fallback
  const handleFileScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const qr = jsQR(imgData.data, img.width, img.height);
        if (qr && qr.data) {
          handleValidCodeFound(qr.data);
        } else {
          toast.error("Aucun QR code lisible n'a été détecté sur cette image.");
        }
      }
    };
    img.src = URL.createObjectURL(file);
  };

  // Demo cards quick selector (instant simulation for testing & headless environments)
  const demoSubscribers = abonnes.slice(0, 5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#082F49] dark:text-cyan-300 text-sm sm:text-base flex items-center gap-1.5">
                Scanner Carte Abonné / QR Code
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pointez la caméra vers le QR code de la carte ou quittance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Camera Viewport */}
        <div className="relative bg-black flex-1 min-h-[260px] sm:min-h-[300px] flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-white max-w-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-100">Caméra Indisponible</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Importer une photo de la carte</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Video Stream */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />

              {/* Target Reticle & Scan Line */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-cyan-400/60 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  {/* Glowing corners */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

                  {/* Animated laser scan bar */}
                  {isScanning && (
                    <div className="absolute inset-x-2 top-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4] animate-pulse" />
                  )}

                  {detectedBadge && (
                    <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] rounded-2xl flex items-center justify-center animate-scale-in">
                      <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Code détecté !</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Overlaid Camera Controls */}
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-2">
                  {torchSupported && (
                    <button
                      onClick={toggleTorch}
                      className={`p-2.5 rounded-xl backdrop-blur-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        torchActive
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : 'bg-black/40 text-white hover:bg-black/60'
                      }`}
                      title="Torche / Flash"
                    >
                      {torchActive ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                    </button>
                  )}

                  {cameras.length > 1 && (
                    <button
                      onClick={switchCamera}
                      className="p-2.5 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition cursor-pointer"
                      title="Changer de caméra"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 text-white text-[11px] font-semibold backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer"
                  title="Scanner depuis une photo"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Galerie / Fichier</span>
                </button>
              </div>
            </>
          )}

          {/* Hidden canvas for video processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileScan}
          />
        </div>

        {/* Demo Cards & Quick Testing (For test cards & users without physical camera access) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              Cartes d'abonnés de test (Clic rapide)
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Simulation temps réel
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
            {demoSubscribers.map((abonne) => {
              const aDette = abonne.soldeDetteFCFA > 0;
              return (
                <button
                  key={abonne.id}
                  onClick={() =>
                    handleValidCodeFound(
                      `FACTUREAU|ABONNE|${abonne.codeAbonne}|${abonne.prenom} ${abonne.nom}`
                    )
                  }
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-cyan-500 dark:hover:border-cyan-400 text-left transition flex flex-col justify-between group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] font-bold text-sky-700 dark:text-cyan-300">
                      {abonne.codeAbonne}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        aDette
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {aDette ? 'Dû' : 'À jour'}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate mt-1">
                    {abonne.prenom} {abonne.nom}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {abonne.quartier}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Invoice Test Pill */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60">
            <span>Tester une facture directe :</span>
            {factures.slice(0, 2).map((f) => (
              <button
                key={f.id}
                onClick={() => handleValidCodeFound(f.qrCodeData || f.numeroFacture)}
                className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-bold"
              >
                {f.numeroFacture}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
