"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { VendorNav } from "@/components/VendorNav";
import { DigitalReceiptModal } from "@/components/DigitalReceiptModal";
import { getSocket } from "@/lib/socket-client";
import { RESTAURANT_ACCOUNTS, getActiveRestaurant } from "@/lib/restaurants-data";
import { 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Search, 
  ShieldCheck, 
  Clock,
  Sparkles,
  Lock,
  Receipt
} from "lucide-react";

export default function VendorScanPage() {
  const [inputToken, setInputToken] = useState("");
  const [scannedReceiptOrder, setScannedReceiptOrder] = useState<any | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ success: boolean; text: string } | null>(null);

  const handleScanOrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = inputToken.trim().toUpperCase();
    if (!token) return;

    // Check token prefix
    if (!token.startsWith("KJU-")) {
      setAlertMessage({
        success: false,
        text: `❌ Invalid token format "${token}". CampusBites restaurant tokens start with "KJU-" (e.g. KJU-TC-101, KJU-SE-204).`
      });
      return;
    }

    setAlertMessage(null);
    try {
      const res = await fetch(`/api/orders?tokenNumber=${token}`);
      const data = await res.json();
      
      if (data.success && data.order) {
        setScannedReceiptOrder(data.order);
      } else {
        setAlertMessage({
          success: false,
          text: `❌ Token "${token}" not found in database. Please verify spelling.`
        });
        setScannedReceiptOrder(null);
      }
    } catch (e: any) {
      setAlertMessage({
        success: false,
        text: `❌ Connection error checking token: ${e.message}`
      });
      setScannedReceiptOrder(null);
    }
  };

  const handleFulfillScannedToken = async (tokenNumber: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenNumber, status: "FULFILLED" })
      });
      const data = await res.json();

      if (data.success) {
        const socket = getSocket();
        socket.emit("update_order_status", {
          tokenNumber,
          status: "FULFILLED"
        });

        setAlertMessage({
          success: true,
          text: `✓ Token "${tokenNumber}" VERIFIED & BURNED successfully! Hand over food to student.`
        });
      } else {
        setAlertMessage({
          success: false,
          text: `❌ Database update failed: ${data.error || "Unable to fulfill order."}`
        });
      }
    } catch (e: any) {
      setAlertMessage({
        success: false,
        text: `❌ Connection error fulfilling token: ${e.message}`
      });
    }

    setScannedReceiptOrder(null);
    setInputToken("");
  };

  return (
    <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col pb-12">
      <VendorNav />

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-orange-400" /> Counter Handover & QR Scanner
          </h2>
          <p className="text-xs text-slate-400">
            Scan QR Code or type token number to pop up the <strong className="text-white">Modern Digital Receipt</strong> for verification.
          </p>
        </div>

        {/* Scanner Input Box */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 space-y-5">
          <form onSubmit={handleScanOrSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-200 block mb-2 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-orange-400" /> Scan Master QR or Enter KJU Token
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="e.g. KJU-TC-101"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono font-bold text-orange-400 placeholder-slate-600 focus:outline-none focus:border-orange-500 uppercase"
                />
                <button
                  type="submit"
                  className="btn-primary-gradient px-6 py-3 rounded-xl text-xs font-bold text-white shadow-lg shadow-orange-500/20 shrink-0 flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Scan & Open Receipt</span>
                </button>
              </div>
            </div>
          </form>

          {/* Alert Message */}
          {alertMessage && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 animate-in fade-in ${
              alertMessage.success 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}>
              {alertMessage.success ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              )}
              <span className="leading-relaxed">{alertMessage.text}</span>
            </div>
          )}
        </div>
      </main>

      {/* Scanned Receipt Modal */}
      {scannedReceiptOrder && (
        <DigitalReceiptModal
          orderId={scannedReceiptOrder.orderId}
          tokenNumber={scannedReceiptOrder.tokenNumber}
          stallName={scannedReceiptOrder.stallName}
          pickupTimeSlot={scannedReceiptOrder.pickupTimeSlot}
          items={scannedReceiptOrder.items}
          subtotal={scannedReceiptOrder.subtotal}
          customerNotes={scannedReceiptOrder.customerNotes}
          status={scannedReceiptOrder.status}
          onClose={() => setScannedReceiptOrder(null)}
          onFulfill={() => handleFulfillScannedToken(scannedReceiptOrder.tokenNumber)}
        />
      )}
    </div>
  );
}
