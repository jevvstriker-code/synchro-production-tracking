'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { JobCard } from '@/types';
import { Camera, X, AlertCircle } from 'lucide-react';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (scannedText: string) => void;
  jobCards: JobCard[];
}

export function LiveCameraModal({
  isOpen,
  onClose,
  onScanResult,
  jobCards,
}: LiveCameraModalProps) {
  const [selectedJc, setSelectedJc] = useState<string>('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            isRunningRef.current = false;
          })
          .catch((err) => console.log('Error stopping camera:', err));
      }
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const qrElement = document.getElementById('camera-reader-element');
        if (!qrElement) return;

        const html5QrCode = new Html5Qrcode('camera-reader-element');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Success handler
            if (isRunningRef.current) {
              html5QrCode.stop().then(() => {
                isRunningRef.current = false;
                onScanResult(decodedText.trim());
                onClose();
              }).catch(() => {
                onScanResult(decodedText.trim());
                onClose();
              });
            }
          },
          () => {
            // Scan progress (ignore noise)
          }
        );
        isRunningRef.current = true;
        setScannerError(null);
      } catch (err: any) {
        console.warn('Unable to start live camera scanner:', err);
        setScannerError(
          'Camera access not available or permission denied. You can select the Job Card from the list below.'
        );
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            isRunningRef.current = false;
          })
          .catch(() => {});
      }
    };
  }, [isOpen, onClose, onScanResult]);

  if (!isOpen) return null;

  const handleManualSelect = (jcNo: string) => {
    if (!jcNo) return;
    onScanResult(jcNo);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Live Camera QR Scanner</h3>
              <p className="text-[11px] text-slate-500">Scan panel Job Card QR sticker on the shop floor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Scanner Area */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-300 bg-slate-900 min-h-[260px] flex items-center justify-center">
          <div id="camera-reader-element" className="w-full h-full"></div>
          {scannerError && (
            <div className="absolute inset-0 bg-slate-900/90 text-slate-300 p-6 flex flex-col items-center justify-center text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <p className="text-xs text-slate-300 max-w-xs">{scannerError}</p>
            </div>
          )}
        </div>

        {/* Dropdown Fallback */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold text-slate-700 text-center">
            — Or Select from Registered Job Cards —
          </label>
          <select
            value={selectedJc}
            onChange={(e) => {
              setSelectedJc(e.target.value);
              handleManualSelect(e.target.value);
            }}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="">Select Panel Job Card No...</option>
            {jobCards.map((jc) => (
              <option key={jc.id} value={jc.job_card_no}>
                {jc.job_card_no} — {jc.product_name} ({jc.assemblyLine})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
