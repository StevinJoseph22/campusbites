"use client";

import React from "react";
import { 
  Receipt, 
  CheckCircle2, 
  Store, 
  Clock, 
  Calendar, 
  CreditCard, 
  X, 
  Check, 
  ShieldCheck,
  FileText
} from "lucide-react";

interface DigitalReceiptProps {
  orderId: string;
  tokenNumber: string;
  stallName: string;
  pickupTimeSlot: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  customerNotes?: string;
  studentName?: string | null;
  studentRegNumber?: string | null;
  placedAt?: string;
  paymentMethod?: string;
  status: string;
  onClose?: () => void;
  onFulfill?: () => void;
}

export function DigitalReceiptModal({
  orderId,
  tokenNumber,
  stallName,
  pickupTimeSlot,
  items,
  subtotal,
  customerNotes,
  studentName,
  studentRegNumber,
  placedAt = "12:15 PM",
  paymentMethod = "UPI",
  status,
  onClose,
  onFulfill
}: DigitalReceiptProps) {
  const isFulfilled = status === "FULFILLED" || status === "DELIVERED";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="glass-panel w-full max-w-md rounded-3xl border-slate-700 bg-slate-900/95 shadow-2xl p-6 sm:p-8 space-y-6 relative border">
        {/* Close Button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Receipt Header */}
        <div className="text-center space-y-2 border-b border-dashed border-slate-800 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-md">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-wide uppercase">CampusBites Canteen Receipt</h2>
            <p className="text-[11px] text-slate-400 font-mono">Order ID: #{orderId}</p>
          </div>
        </div>

        {/* Status Stamp */}
        <div className={`p-3 rounded-2xl border text-center text-xs font-bold flex items-center justify-center gap-2 ${
          isFulfilled
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
        }`}>
          <ShieldCheck className="w-4 h-4" />
          <span>{isFulfilled ? "✓ OFFICIAL RECEIPT — ORDER DELIVERED & BURNED" : `STATUS: ${status}`}</span>
        </div>

        {/* Token Banner */}
        <div className="glass-panel p-4 rounded-2xl bg-slate-950/80 border-orange-500/30 text-center space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Restaurant Token ID</span>
          <span className="text-2xl font-mono font-extrabold text-orange-400 tracking-wider">
            {tokenNumber}
          </span>
        </div>

        {/* Student Identity */}
        {(studentName || studentRegNumber) && (
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Student</span>
              <p className="font-bold text-white">{studentName || "—"}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block">Roll Number</span>
              <p className="font-mono font-bold text-orange-400">{studentRegNumber || "—"}</p>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
              <Store className="w-3 h-3 text-orange-400" /> Restaurant:
            </span>
            <p className="font-bold text-white truncate">{stallName}</p>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> Pickup Slot:
            </span>
            <p className="font-bold text-white truncate">{pickupTimeSlot}</p>
          </div>
        </div>

        {/* Customer Notes */}
        {customerNotes && (
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
            <span className="text-[10px] font-bold text-orange-400 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Kitchen Cooking Notes:
            </span>
            <p className="text-slate-300 italic">{customerNotes}</p>
          </div>
        )}

        {/* Itemized Food Table */}
        <div className="space-y-2 border-t border-b border-dashed border-slate-800 py-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ordered Food Items:</span>
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-orange-500/10 text-orange-400 font-bold flex items-center justify-center text-[10px]">
                  {item.quantity}x
                </span>
                <span className="text-slate-200 font-medium">{item.name}</span>
              </div>
              <span className="font-bold text-white">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Price Total */}
        <div className="flex justify-between items-center text-sm font-extrabold text-white">
          <span>Portion Subtotal</span>
          <span className="text-orange-400 text-base">₹{subtotal}</span>
        </div>

        {/* Action Button */}
        {onFulfill && !isFulfilled && (
          <button
            onClick={onFulfill}
            className="w-full btn-primary-gradient py-3.5 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Verify Receipt & Mark Delivered</span>
          </button>
        )}
      </div>
    </div>
  );
}
