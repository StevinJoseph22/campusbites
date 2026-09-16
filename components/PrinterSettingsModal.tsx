"use client";

import React, { useState, useEffect } from "react";
import { hardwarePrinter, PaperWidth, PrinterConnectionType } from "@/lib/hardware-printer";
import {
  Printer,
  Bluetooth,
  Usb,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Power,
  Sliders,
  Sparkles,
  Zap
} from "lucide-react";

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrinterSettingsModal({ isOpen, onClose }: PrinterSettingsModalProps) {
  const [status, setStatus] = useState(hardwarePrinter.getStatus());
  const [isPairingSerial, setIsPairingSerial] = useState(false);
  const [isPairingBluetooth, setIsPairingBluetooth] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  const [autoPrintKOT, setAutoPrintKOT] = useState(true);
  const [autoPrintCancel, setAutoPrintCancel] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const kot = localStorage.getItem("campusbites_autoprint_kot");
      if (kot !== null) setAutoPrintKOT(kot === "true");
      const cancel = localStorage.getItem("campusbites_autoprint_cancelled");
      if (cancel !== null) setAutoPrintCancel(cancel === "true");
    }

    const unsub = hardwarePrinter.subscribe(() => {
      setStatus(hardwarePrinter.getStatus());
    });

    // Try auto-reconnect on mount if supported
    hardwarePrinter.tryAutoReconnect();

    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handlePairUSB = async () => {
    setIsPairingSerial(true);
    setFeedback(null);
    const res = await hardwarePrinter.pairSerialPrinter(9600);
    setIsPairingSerial(false);
    if (res.success) {
      setFeedback({ type: "success", msg: "USB Thermal Printer connected successfully! Ready for 0-click silent printing." });
    } else {
      setFeedback({ type: "error", msg: res.error || "Failed to pair USB printer." });
    }
  };

  const handlePairBluetooth = async () => {
    setIsPairingBluetooth(true);
    setFeedback(null);
    const res = await hardwarePrinter.pairBluetoothPrinter();
    setIsPairingBluetooth(false);
    if (res.success) {
      setFeedback({ type: "success", msg: "Bluetooth POS Printer paired & connected successfully!" });
    } else {
      setFeedback({ type: "error", msg: res.error || "Failed to pair Bluetooth printer." });
    }
  };

  const handleDisconnect = async () => {
    await hardwarePrinter.disconnect();
    setFeedback({ type: "info", msg: "Printer disconnected. Background print will use silent fallback." });
  };

  const handlePaperWidthChange = (width: PaperWidth) => {
    hardwarePrinter.setPaperWidth(width);
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    setFeedback(null);
    const res = await hardwarePrinter.printTestSlip();
    setIsTesting(false);
    if (res.success) {
      setFeedback({
        type: "success",
        msg: `Test print dispatched via ${res.method === "SERIAL" ? "Direct USB (WebSerial)" : res.method === "BLUETOOTH" ? "Direct Bluetooth" : "Silent Background Mode"}!`
      });
    } else {
      setFeedback({ type: "error", msg: `Test print error: ${res.error}` });
    }
  };

  const handleToggleKOT = () => {
    const next = !autoPrintKOT;
    setAutoPrintKOT(next);
    localStorage.setItem("campusbites_autoprint_kot", String(next));
  };

  const handleToggleCancel = () => {
    const next = !autoPrintCancel;
    setAutoPrintCancel(next);
    localStorage.setItem("campusbites_autoprint_cancelled", String(next));
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="card-surface w-full max-w-lg p-6 space-y-5 rounded shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-marigold/10 text-marigold flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                Thermal Receipt Printer Setup
              </h3>
              <p className="text-[11px] text-ink-soft">Direct 0-click WebUSB / WebBluetooth silent printing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink p-1.5 rounded hover:bg-cardstock transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Status Card */}
        <div className={`p-4 rounded border ${
          status.isConnected
            ? "bg-sage-soft border-sage/40 text-sage"
            : "bg-cardstock border-ink/15 text-ink-soft"
        } flex items-center justify-between gap-3`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${status.isConnected ? "bg-sage animate-pulse" : "bg-ink-soft/40"}`} />
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-ink">
                {status.isConnected ? `Connected (${status.connectionType})` : "Disconnected (Silent Fallback Active)"}
              </span>
            </div>
            <p className="text-[11px] text-ink-soft font-medium">
              Device: <strong className="text-ink">{status.deviceName}</strong>
            </p>
          </div>

          {status.isConnected && (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 rounded bg-chili-soft text-chili hover:bg-chili/20 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Power className="w-3.5 h-3.5" /> Disconnect
            </button>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3.5 rounded text-xs font-bold flex items-start gap-2 ${
            feedback.type === "success"
              ? "bg-sage-soft border border-sage/40 text-sage"
              : feedback.type === "error"
              ? "bg-chili-soft border border-chili/40 text-chili"
              : "bg-marigold/10 border border-marigold/30 text-marigold"
          }`}>
            {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Hardware Connection Options */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-marigold" /> Connect Hardware Receipt Printer:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* USB Button */}
            <button
              onClick={handlePairUSB}
              disabled={isPairingSerial || status.isConnected}
              className={`p-4 rounded border text-left flex flex-col justify-between gap-3 transition-all ${
                status.connectionType === "SERIAL"
                  ? "bg-marigold/10 border-marigold text-ink ring-2 ring-marigold/30"
                  : "bg-paper border-ink/15 text-ink hover:border-marigold hover:bg-cardstock-hover disabled:opacity-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <Usb className="w-5 h-5 text-marigold" />
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cardstock text-ink-soft">
                  WebSerial
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-ink">USB / Essae PR-55</p>
                <p className="text-[10px] text-ink-soft mt-0.5">Direct USB cable to Essae, TVS, Epson, Posiflex</p>
              </div>
              <span className="text-[11px] text-marigold font-bold flex items-center gap-1 mt-1">
                {isPairingSerial ? "Scanning USB..." : status.connectionType === "SERIAL" ? "✓ Connected" : "Pair USB Port →"}
              </span>
            </button>

            {/* Bluetooth Button */}
            <button
              onClick={handlePairBluetooth}
              disabled={isPairingBluetooth || status.isConnected}
              className={`p-4 rounded border text-left flex flex-col justify-between gap-3 transition-all ${
                status.connectionType === "BLUETOOTH"
                  ? "bg-marigold/10 border-marigold text-ink ring-2 ring-marigold/30"
                  : "bg-paper border-ink/15 text-ink hover:border-marigold hover:bg-cardstock-hover disabled:opacity-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <Bluetooth className="w-5 h-5 text-marigold" />
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cardstock text-ink-soft">
                  WebBluetooth
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-ink">Bluetooth Wireless</p>
                <p className="text-[10px] text-ink-soft mt-0.5">58mm / 80mm wireless portable POS printers</p>
              </div>
              <span className="text-[11px] text-marigold font-bold flex items-center gap-1 mt-1">
                {isPairingBluetooth ? "Scanning BLE..." : status.connectionType === "BLUETOOTH" ? "✓ Connected" : "Pair Bluetooth →"}
              </span>
            </button>
          </div>
        </div>

        {/* Paper Width Config */}
        <div className="space-y-2 pt-2 border-t border-ink/10">
          <label className="text-xs font-bold text-ink flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-marigold" /> Paper Roll Width:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handlePaperWidthChange("58mm")}
              className={`py-2 px-3 rounded text-xs font-bold border transition-all ${
                status.paperWidth === "58mm"
                  ? "bg-marigold text-white border-marigold"
                  : "bg-paper border-ink/15 text-ink-soft hover:text-ink"
              }`}
            >
              58mm (2-inch standard / Essae PR-55)
            </button>
            <button
              onClick={() => handlePaperWidthChange("80mm")}
              className={`py-2 px-3 rounded text-xs font-bold border transition-all ${
                status.paperWidth === "80mm"
                  ? "bg-marigold text-white border-marigold"
                  : "bg-paper border-ink/15 text-ink-soft hover:text-ink"
              }`}
            >
              80mm (3-inch wide POS roll)
            </button>
          </div>
        </div>

        {/* Automated Background Dispatch Rules */}
        <div className="space-y-2 pt-2 border-t border-ink/10 text-xs">
          <label className="font-bold text-ink flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-marigold" /> Automated Kitchen Dispatch Rules:
          </label>

          <div className="space-y-2 bg-cardstock p-3 rounded border border-ink/15">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-ink">Auto-Print Kitchen Slip (KOT) on New Order</p>
                <p className="text-[10px] text-ink-soft">Prints instant slip with Token #, Time, Items (strictly NO price)</p>
              </div>
              <input
                type="checkbox"
                checked={autoPrintKOT}
                onChange={handleToggleKOT}
                className="w-4 h-4 rounded border-ink/20 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-ink/10 pt-2">
              <div>
                <p className="font-bold text-ink">Auto-Print Cancellation Slip on Refund</p>
                <p className="text-[10px] text-ink-soft">Prints *** ORDER CANCELLED *** slip when student cancels or item is OOS</p>
              </div>
              <input
                type="checkbox"
                checked={autoPrintCancel}
                onChange={handleToggleCancel}
                className="w-4 h-4 rounded border-ink/20 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-ink/10 flex items-center justify-between gap-3">
          <button
            onClick={handleTestPrint}
            disabled={isTesting}
            className="px-4 py-2.5 rounded bg-cardstock hover:bg-cardstock-hover border border-ink/15 text-xs font-bold text-ink flex items-center gap-1.5 transition-colors"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5 text-marigold" />}
            <span>Test Print Receipt 🖨️</span>
          </button>

          <button
            onClick={onClose}
            className="bg-marigold hover:bg-marigold-hover px-6 py-2.5 rounded text-xs font-bold text-white transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
