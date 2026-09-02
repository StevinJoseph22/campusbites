"use client";

import React, { useState } from "react";
import { 
  QrCode, 
  Sparkles, 
  X, 
  ShieldCheck, 
  Store, 
  Clock, 
  Maximize2,
  Minimize2,
  CheckCircle2,
  Zap
} from "lucide-react";

interface AttractiveQrModalProps {
  orderId: string;
  masterToken?: string;
  qrDataUrl: string;
  vendorPortions: Array<{
    stallName: string;
    tokenNumber: string;
    pickupTimeSlot: string;
    status: string;
    items: Array<{ name: string; quantity: number; price: number }>;
  }>;
  totalAmount: number;
  onClose: () => void;
}

export function AttractiveQrModal({
  orderId,
  masterToken = "KJU-MASTER-QR",
  qrDataUrl,
  vendorPortions,
  totalAmount,
  onClose
}: AttractiveQrModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Ambient Glow Background Effect */}
      <div className="absolute w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none -top-10 -left-10" />
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -bottom-10 -right-10" />

      <div className="glass-panel w-full max-w-lg rounded-3xl border-orange-500/40 bg-slate-900/90 shadow-2xl p-6 sm:p-8 space-y-6 relative border ring-1 ring-orange-500/30">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold shadow-md">
            <Zap className="w-3.5 h-3.5 fill-orange-400 animate-pulse" />
            <span>Digital Express Canteen Pass</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-wide">CampusBites Unified QR Pass</h2>
          <p className="text-xs text-slate-400 font-mono">Order ID: #{orderId}</p>
        </div>

        {/* GLOWING HIGH-RES QR CONTAINER */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse" />
          
          <div className="relative glass-panel p-6 rounded-3xl bg-slate-950/90 border-slate-800 text-center space-y-4 shadow-2xl">
            <div 
              onClick={() => setIsZoomed(!isZoomed)}
              className={`bg-white p-4 rounded-2xl mx-auto shadow-2xl transition-all duration-300 cursor-pointer relative border-4 border-orange-500/30 hover:border-orange-500 ${
                isZoomed ? "w-64 h-64 scale-105" : "w-48 h-48 hover:scale-105"
              }`}
              title="Click to Zoom QR Code"
            >
              <img src={qrDataUrl} alt="Master Scannable QR Code" className="w-full h-full object-contain" />
              <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white p-1 rounded-lg text-[10px] flex items-center gap-1 font-bold">
                {isZoomed ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                {isZoomed ? "Zoomed" : "Tap Zoom"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Official Scannable Master Token</span>
              <span className="text-lg font-mono font-extrabold text-orange-400 bg-orange-500/10 px-4 py-1 rounded-xl border border-orange-500/30 inline-block shadow-inner">
                {masterToken}
              </span>
            </div>
          </div>
        </div>

        {/* Holographic Stamp & Verification */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Encrypted & Verified Digital Pass</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded-lg text-emerald-300">
            VALID
          </span>
        </div>

        {/* Vendor Tokens & Items Breakdown */}
        <div className="space-y-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Included Restaurant Tokens:</span>
          {vendorPortions.map((p, idx) => (
            <div key={idx} className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-xs space-y-1">
              <div className="flex justify-between items-center font-bold">
                <span className="text-white flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-orange-400" /> {p.stallName}
                </span>
                <span className="font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/20 text-[11px]">
                  {p.tokenNumber}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Slot: <strong className="text-white">{p.pickupTimeSlot}</strong></span>
                <span className="text-slate-300">{p.items.length} item(s)</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-sm font-extrabold text-white">
          <span>Total Paid Amount</span>
          <span className="text-orange-400 text-base">₹{totalAmount}</span>
        </div>
      </div>
    </div>
  );
}
