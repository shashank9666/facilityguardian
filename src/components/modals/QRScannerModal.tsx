"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Camera, X, Scan, ExternalLink } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useApp } from "@/context/AppContext";

interface QRScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export function QRScannerModal({ open, onClose, onScanSuccess }: QRScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      // Wait for the element to be in DOM
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            scanner.clear();
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Keep scanning, don't show error unless it's critical
            // console.warn(errorMessage);
          }
        );

        scannerRef.current = scanner;
      }, 100);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
        scannerRef.current = null;
      }
    };
  }, [open, onScanSuccess]);

  return (
    <Modal open={open} onClose={onClose} title="Scan QR Code" size="md"
      footer={<Button variant="secondary" onClick={onClose}>Close Scanner</Button>}>
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
          <Scan size={18} className="text-blue-600"/>
          <div className="text-[13px] text-blue-800 font-medium">
            Position the QR code within the frame to scan automatically.
          </div>
        </div>

        <div className="relative aspect-square w-full max-w-[400px] mx-auto overflow-hidden rounded-2xl bg-black border-4 border-slate-100 shadow-inner">
          <div id="qr-reader" className="w-full h-full" />
          
          {/* Overlay to hide the "Scan files" text if html5-qrcode adds it */}
          <style jsx global>{`
            #qr-reader { border: none !important; }
            #qr-reader__dashboard { padding: 10px !important; }
            #qr-reader__status_span { font-size: 12px !important; color: #64748b !important; }
            #qr-reader img { display: none; }
            #qr-reader__scan_region { background: #000 !important; }
            #qr-reader__camera_selection { 
              padding: 6px 12px; 
              border-radius: 8px; 
              border: 1px solid #e2e8f0; 
              font-size: 13px;
              width: 100%;
              margin-bottom: 10px;
            }
            #qr-reader button {
              background: #2563eb !important;
              color: white !important;
              border: none !important;
              padding: 8px 16px !important;
              border-radius: 8px !important;
              font-weight: 600 !important;
              font-size: 13px !important;
              cursor: pointer !important;
              margin: 5px !important;
              transition: all 0.2s !important;
            }
            #qr-reader button:hover {
              background: #1d4ed8 !important;
            }
          `}</style>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-100 text-center">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
