'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { JobCard } from '@/types';
import { X, Printer, Share2, Send, Check, Copy, Download, Image as ImageIcon } from 'lucide-react';

interface PrintableJobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard: JobCard | null;
}

export function PrintableJobCardModal({ isOpen, onClose, jobCard }: PrintableJobCardModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [trackingUrl, setTrackingUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && jobCard) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/track/${jobCard.job_card_no}`;
      setTrackingUrl(url);

      QRCode.toDataURL(url, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((dataUrl) => setQrDataUrl(dataUrl))
        .catch((err) => console.error('QR code generation error', err));
    }
  }, [isOpen, jobCard]);

  if (!isOpen || !jobCard) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*Synchro Electricals Pvt. Ltd. - Production Tracker*\nPanel: ${jobCard.product_name} (${jobCard.job_card_no})\nAssembly Line: ${jobCard.assemblyLine}\nCurrent Stage: ${jobCard.current_stage}\n\nLive Tracking URL:\n${trackingUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Production Tracking: ${jobCard.job_card_no} - ${jobCard.product_name}`);
    const body = encodeURIComponent(
      `Synchro Electricals Pvt. Ltd. Production Update\n\nJob Card: ${jobCard.job_card_no}\nProduct: ${jobCard.product_name}\nAssembly Line: ${jobCard.assemblyLine}\nCurrent Stage: ${jobCard.current_stage}\n\nTrack Live Status:\n${trackingUrl}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Generate and Download clean PNG image sticker
  const handleDownloadStickerPNG = () => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 750;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#2563eb';
      ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

      // Header Banner
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(16, 16, canvas.width - 32, 70);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SYNCHRO ELECTRICALS PVT. LTD.', canvas.width / 2, 58);

      // QR Code Image
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.onload = () => {
        ctx.drawImage(qrImg, (canvas.width - 300) / 2, 110, 300, 300);

        // Subtext
        ctx.fillStyle = '#1e3a8a';
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SCAN WITH PHONE CAMERA FOR LIVE TRACKING', canvas.width / 2, 440);

        // Horizontal Line
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, 460);
        ctx.lineTo(canvas.width - 40, 460);
        ctx.stroke();

        // Details
        ctx.textAlign = 'left';
        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`JC: ${jobCard.job_card_no}`, 50, 500);

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(jobCard.assemblyLine, canvas.width - 50, 500);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillText(jobCard.product_name, 50, 545);

        ctx.fillStyle = '#64748b';
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText(`Panel Type: ${jobCard.panel_type}`, 50, 585);
        ctx.textAlign = 'right';
        ctx.fillText(`Date: ${jobCard.date}`, canvas.width - 50, 585);

        // Line
        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(40, 615);
        ctx.lineTo(canvas.width - 40, 615);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillText(`Supervisor: ${jobCard.supervisor_name}`, 50, 655);
        ctx.textAlign = 'right';
        ctx.fillText(`PPC: ${jobCard.ppc_name}`, canvas.width - 50, 655);

        // Footer
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(trackingUrl, canvas.width / 2, 705);

        // Trigger Download
        const a = document.createElement('a');
        a.download = `Sticker_${jobCard.job_card_no}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        setIsDownloading(false);
      };
      qrImg.src = qrDataUrl;
    } catch (e) {
      console.error('Error exporting sticker PNG:', e);
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto print-modal-overlay print:p-0 print:m-0 print:overflow-visible">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto print-modal-container print:shadow-none print:border-none print:max-h-none print:rounded-none">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>Panel QR Code & Printable Sticker</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Sticker Box */}
        <div
          id="printable-sticker-area"
          className="bg-white text-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-blue-300 shadow-inner flex flex-col items-center text-center space-y-3"
        >
          <div className="w-full flex justify-between items-center border-b border-slate-300 pb-2">
            <span className="font-extrabold text-xs sm:text-sm tracking-tight text-blue-700">
              SYNCHRO ELECTRICALS PVT. LTD.
            </span>
            <span className="text-[10px] text-slate-500 font-mono font-bold">PANEL QR</span>
          </div>

          {/* QR Code Image */}
          <div className="bg-white p-2 border-2 border-slate-300 rounded-xl shadow-sm flex items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR for ${jobCard.job_card_no}`} className="w-44 h-44 object-contain" />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          <div className="text-[11px] font-bold text-blue-800 tracking-wide">
            SCAN WITH ANY PHONE CAMERA TO VIEW LIVE STATUS
          </div>

          {/* Panel Particulars */}
          <div className="w-full text-left space-y-1.5 text-xs border-t border-slate-200 pt-2">
            <div className="flex justify-between font-bold border-b border-slate-100 pb-1">
              <span className="font-mono text-blue-700 text-sm">{jobCard.job_card_no}</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">{jobCard.assemblyLine}</span>
            </div>
            <div className="font-bold text-slate-900 text-xs truncate">{jobCard.product_name}</div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Type: {jobCard.panel_type}</span>
              <span>Date: {jobCard.date}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 border-t border-slate-100 pt-1">
              <span>Sup: {jobCard.supervisor_name}</span>
              <span>PPC: {jobCard.ppc_name}</span>
            </div>
          </div>
        </div>

        {/* Live URL Link bar */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs print:hidden">
          <span className="font-mono text-[11px] text-slate-600 truncate">{trackingUrl}</span>
          <button
            onClick={handleCopyLink}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 shrink-0 transition"
            title="Copy URL"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 print:hidden">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-semibold shadow transition flex items-center justify-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownloadStickerPNG}
            disabled={isDownloading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-semibold shadow transition flex items-center justify-center space-x-1.5"
            title="Save PNG image file"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Saving...' : 'PNG File'}</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-semibold shadow transition flex items-center justify-center space-x-1.5"
          >
            <Send className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleShareEmail}
            className="bg-slate-700 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-semibold shadow transition flex items-center justify-center space-x-1.5"
          >
            <Share2 className="w-4 h-4" />
            <span>Email</span>
          </button>
        </div>
      </div>
    </div>
  );
}
