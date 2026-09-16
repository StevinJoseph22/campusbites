"use client";

import React, { useState } from "react";
import { 
  Printer, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Store, 
  User, 
  FileText,
  Copy,
  Check
} from "lucide-react";
import { ThermalSlipData, printThermalSlip, generateThermalSlipHtml } from "@/lib/thermal-printer";

interface ThermalReceiptModalProps {
  order: ThermalSlipData;
  onClose: () => void;
  onConfirmPrint?: () => void;
}

export function ThermalReceiptModal({
  order,
  onClose,
  onConfirmPrint
}: ThermalReceiptModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const isCancelled = Boolean(
    order.isCancellation ||
    order.status === "REFUNDED" ||
    order.status === "CANCELLED" ||
    order.items.every(i => i.outOfStock)
  );

  const handlePrint = async () => {
    setIsPrinting(true);
    await printThermalSlip(order);
    setIsPrinting(false);
    if (onConfirmPrint) onConfirmPrint();
  };

  const handleCopyRaw = () => {
    const rawHtml = generateThermalSlipHtml(order);
    navigator.clipboard.writeText(rawHtml);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const totalQuantity = order.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="glass-panel w-full max-w-sm rounded-3xl border-slate-700 bg-slate-900/95 shadow-2xl p-5 space-y-4 relative border text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isCancelled 
                ? "bg-red-500/20 text-red-400 border border-red-500/40" 
                : "bg-orange-500/20 text-orange-400 border border-orange-500/40"
            }`}>
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {isCancelled ? "Cancelled Slip Preview" : "Kitchen Slip (KOT) Preview"}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Essae PR-55 / 58mm Thermal Receipt</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Slip Simulation Paper (White Box) */}
        <div className="bg-white text-black p-4 rounded-xl shadow-inner font-mono text-xs border border-slate-400 max-h-[60vh] overflow-y-auto select-text">
          {/* Slip Header Box */}
          <div className={`p-2 rounded text-center border-2 ${isCancelled ? "border-red-600 bg-red-50 text-red-700 font-extrabold" : "border-black font-bold"}`}>
            <div className="text-xs uppercase tracking-wider">
              {isCancelled ? "*** ORDER CANCELLED ***" : "KITCHEN ORDER TICKET (KOT)"}
            </div>
            <div className="text-[10px]">
              {isCancelled ? "[ OUT OF STOCK / VOID ]" : "ESSAE PR-55 THERMAL"}
            </div>
          </div>

          <div className="text-center my-2">
            <div className="font-extrabold text-sm uppercase">{order.stallName}</div>
            {order.campus && <div className="text-[10px] text-slate-600">{order.campus}</div>}
          </div>

          <div className="border-t-2 border-black my-1.5" />

          {/* Token Highlight */}
          <div className="text-center my-2">
            <div className="text-[10px] uppercase font-bold text-slate-700">TOKEN NUMBER</div>
            <div className="text-3xl font-black tracking-wider my-0.5 text-black">
              {order.tokenNumber}
            </div>
          </div>

          <div className="border-t border-dashed border-black my-1.5" />

          {/* Time & Meta */}
          <div className="text-[11px] space-y-0.5 leading-tight">
            <div><strong>TIME:</strong> {order.placedAt || "Just now"}</div>
            {order.pickupTimeSlot && <div><strong>SLOT:</strong> {order.pickupTimeSlot}</div>}
            {(order.studentName || order.studentRegNumber) && (
              <div><strong>STUD:</strong> {order.studentName || ""} ({order.studentRegNumber || "—"})</div>
            )}
            {order.orderType && <div><strong>TYPE:</strong> {order.orderType}</div>}
          </div>

          {order.customerNotes && (
            <div className="bg-yellow-100 border-l-2 border-black p-1.5 my-1.5 text-[10px]">
              <strong>NOTE:</strong> {order.customerNotes}
            </div>
          )}

          <div className="border-t border-dashed border-black my-2" />

          {/* Items Header */}
          <div className="flex justify-between font-bold text-[11px] border-b border-black pb-1 mb-1">
            <span>QTY  ITEM DESCRIPTION</span>
            <span>STATUS</span>
          </div>

          {/* Items List without price */}
          <div className="space-y-1.5 my-2">
            {order.items.map((item, idx) => (
              <div 
                key={idx} 
                className={`flex justify-between items-start text-xs ${item.outOfStock || isCancelled ? "line-through opacity-70" : ""}`}
              >
                <div className="flex items-start gap-1.5 flex-1 pr-2">
                  <span className="font-black text-sm">{item.quantity}x</span>
                  <div>
                    <span className="font-bold">{item.name}</span>
                    {item.variants && <span className="text-[10px] block text-slate-600">({item.variants})</span>}
                    {item.notes && <span className="text-[10px] block italic text-slate-600">* {item.notes}</span>}
                    {item.outOfStock && <span className="text-[10px] font-black text-red-600 block">[OUT OF STOCK]</span>}
                  </div>
                </div>
                <span className="font-bold text-[10px] shrink-0">
                  {isCancelled || item.outOfStock ? "VOID" : "OK"}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-black my-2" />

          {/* Total Food Count */}
          <div className="flex justify-between font-bold text-xs">
            <span>TOTAL ITEMS:</span>
            <span>{totalQuantity} QTY</span>
          </div>

          {isCancelled && (
            <div className="border-t-2 border-black my-2 pt-1 text-center font-extrabold text-[11px] text-red-600">
              *** DO NOT PREPARE THIS ORDER ***
              {order.cancelReason && (
                <div className="text-[10px] font-normal text-black mt-0.5">
                  Reason: {order.cancelReason}
                </div>
              )}
            </div>
          )}

          <div className="border-t-2 border-black mt-3 pt-1 text-center text-[9px] text-slate-500">
            . . . . . . CUT HERE . . . . . .
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              isCancelled
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>{isPrinting ? "Sending to Printer..." : "Print to Essae PR-55 →"}</span>
          </button>

          <button
            onClick={handleCopyRaw}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Copy Slip HTML"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
