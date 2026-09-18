"use client";

import React, { useState, useEffect } from "react";
import { hardwarePrinter, PaperWidth, PrinterConnectionType, PairedPrinterInfo } from "@/lib/hardware-printer";
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
  Zap,
  Monitor,
  Radio,
  ChevronDown,
  Check,
  Laptop
} from "lucide-react";

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrinterSettingsModal({ isOpen, onClose }: PrinterSettingsModalProps) {
  const [status, setStatus] = useState(hardwarePrinter.getStatus());
  const [pairedDevices, setPairedDevices] = useState<PairedPrinterInfo[]>([]);
  const [isPairingUsb, setIsPairingUsb] = useState(false);
  const [isPairingSerial, setIsPairingSerial] = useState(false);
  const [isPairingBluetooth, setIsPairingBluetooth] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [serialBaudRate, setSerialBaudRate] = useState<number>(9600);
  const [showAdvancedSerial, setShowAdvancedSerial] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  const [autoPrintKOT, setAutoPrintKOT] = useState(true);
  const [autoPrintCancel, setAutoPrintCancel] = useState(true);

  const refreshPairedDevices = async () => {
    try {
      const devices = await hardwarePrinter.getPairedDevices();
      setPairedDevices(devices);
    } catch (e) {}
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const kot = localStorage.getItem("campusbites_autoprint_kot");
      if (kot !== null) setAutoPrintKOT(kot === "true");
      const cancel = localStorage.getItem("campusbites_autoprint_cancelled");
      if (cancel !== null) setAutoPrintCancel(cancel === "true");
    }

    const unsub = hardwarePrinter.subscribe(() => {
      setStatus(hardwarePrinter.getStatus());
      refreshPairedDevices();
    });

    // Try auto-reconnect on mount if supported
    hardwarePrinter.tryAutoReconnect().then(() => {
      refreshPairedDevices();
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshPairedDevices();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Direct WebUSB Pair (Shows actual printer names like POS-58, Essae, TVS, Epson)
  const handlePairDirectUSB = async () => {
    setIsPairingUsb(true);
    setFeedback(null);
    const res = await hardwarePrinter.pairUsbPrinter();
    setIsPairingUsb(false);
    if (res.success) {
      setFeedback({ 
        type: "success", 
        msg: `Connected to ${res.deviceName || "USB Thermal Printer"} via Direct USB! Ready for 0-click automated KOT printing.` 
      });
      refreshPairedDevices();
    } else {
      setFeedback({ type: "error", msg: res.error || "Failed to pair USB printer." });
    }
  };

  // 2. Windows / System Default Printer (Spooler Mode)
  const handleSelectSystemPrinter = () => {
    hardwarePrinter.setSystemPrinterMode();
    setFeedback({
      type: "success",
      msg: "Active: Windows / System Default Thermal Printer. Slips will print directly through the OS print spooler."
    });
    refreshPairedDevices();
  };

  // 3. Bluetooth Wireless POS Printer
  const handlePairBluetooth = async () => {
    setIsPairingBluetooth(true);
    setFeedback(null);
    const res = await hardwarePrinter.pairBluetoothPrinter();
    setIsPairingBluetooth(false);
    if (res.success) {
      setFeedback({ 
        type: "success", 
        msg: `Paired with ${res.deviceName || "Bluetooth POS Printer"} successfully!` 
      });
      refreshPairedDevices();
    } else {
      setFeedback({ type: "error", msg: res.error || "Failed to pair Bluetooth printer." });
    }
  };

  // 4. Legacy Serial / Virtual COM Port
  const handlePairSerial = async () => {
    setIsPairingSerial(true);
    setFeedback(null);
    const res = await hardwarePrinter.pairSerialPrinter(serialBaudRate);
    setIsPairingSerial(false);
    if (res.success) {
      setFeedback({ 
        type: "success", 
        msg: `Connected to ${res.deviceName || "Serial POS Printer"} at ${serialBaudRate} baud!` 
      });
      refreshPairedDevices();
    } else {
      setFeedback({ type: "error", msg: res.error || "Failed to connect Serial / COM port." });
    }
  };

  // Connect Remembered Device
  const handleConnectRemembered = async (device: PairedPrinterInfo) => {
    if (device.type === "SYSTEM") {
      handleSelectSystemPrinter();
      return;
    }
    if (device.type === "USB" && device.nativeDevice) {
      setFeedback(null);
      const ok = await hardwarePrinter.connectPairedUsbDevice(device.nativeDevice);
      if (ok) {
        setFeedback({ type: "success", msg: `Reconnected to ${device.name}!` });
      } else {
        setFeedback({ type: "error", msg: `Could not reconnect to ${device.name}. Try pairing again.` });
      }
    }
  };

  const handleDisconnect = async () => {
    await hardwarePrinter.disconnect();
    setFeedback({ type: "info", msg: "Printer disconnected. Background print will use silent fallback." });
    refreshPairedDevices();
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
        msg: `Test slip printed successfully via ${
          res.method === "USB" ? "Direct USB (WebUSB)" :
          res.method === "SERIAL" ? "Direct Serial / COM" :
          res.method === "BLUETOOTH" ? "Direct Bluetooth" :
          "System Thermal Spooler"
        }!`
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="card-surface w-full max-w-xl p-5 sm:p-6 space-y-4 rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto border border-marigold/30">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/10 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-marigold/15 border border-marigold/30 text-marigold flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-black text-ink flex items-center gap-2">
                Thermal Kitchen Printer Setup
              </h3>
              <p className="text-[11px] text-ink-soft">Direct 0-Click USB, Bluetooth & System Thermal Dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink p-1.5 rounded-xl hover:bg-cardstock transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Connection Banner */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
          status.isConnected
            ? "bg-sage-soft border-sage/40 text-sage"
            : "bg-cardstock border-ink/15 text-ink-soft"
        } flex items-center justify-between gap-3 shadow-sm`}>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-2.5 h-2.5 rounded-full ${status.isConnected ? "bg-sage animate-pulse" : "bg-ink-soft/40"}`} />
              <span className="text-xs font-black font-mono uppercase tracking-wider text-ink">
                {status.isConnected ? `Connected via ${status.connectionType}` : "Disconnected (Auto-Spooler Fallback)"}
              </span>
              {status.isConnected && (
                <span className="px-2 py-0.5 rounded-full bg-sage text-white text-[10px] font-bold">
                  0-Click Active
                </span>
              )}
            </div>
            <p className="text-xs text-ink-soft font-bold truncate">
              Device: <strong className="text-ink">{status.deviceName}</strong>
            </p>
          </div>

          {status.isConnected && (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 rounded-xl bg-chili-soft text-chili hover:bg-chili hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <Power className="w-3.5 h-3.5" /> Disconnect
            </button>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2 shadow-sm animate-in fade-in ${
            feedback.type === "success"
              ? "bg-sage-soft border border-sage/40 text-sage"
              : feedback.type === "error"
              ? "bg-chili-soft border border-chili/40 text-chili"
              : "bg-marigold/15 border border-marigold/30 text-marigold"
          }`}>
            {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span className="leading-relaxed">{feedback.msg}</span>
          </div>
        )}

        {/* Hardware Connection Options */}
        <div className="space-y-2.5">
          <label className="text-xs font-black text-ink uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-marigold" /> Select Connection Mode:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            {/* OPTION 1: Direct WebUSB (Recommended - Shows Printer Names) */}
            <button
              onClick={handlePairDirectUSB}
              disabled={isPairingUsb}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                status.connectionType === "USB"
                  ? "bg-marigold/15 border-marigold text-ink ring-2 ring-marigold/30 shadow-md"
                  : "bg-surface hover:bg-cardstock border-ink/15 text-ink hover:border-marigold"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-marigold/15 text-marigold flex items-center justify-center">
                  <Usb className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-marigold/20 text-marigold">
                  Direct USB
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-ink">USB Thermal Printer</p>
                <p className="text-[10px] text-ink-soft mt-0.5 leading-snug">
                  Select by name (Essae PR-55, TVS, Epson TM, POS-58/80, Xprinter)
                </p>
              </div>
              <span className="text-xs text-marigold font-black flex items-center gap-1">
                {isPairingUsb ? "Scanning USB Devices..." : status.connectionType === "USB" ? "✓ Connected (USB Bulk)" : "Pair USB Printer →"}
              </span>
            </button>

            {/* OPTION 2: Windows / System Default Printer (Zero Driver Hassle) */}
            <button
              onClick={handleSelectSystemPrinter}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                status.connectionType === "SYSTEM"
                  ? "bg-marigold/15 border-marigold text-ink ring-2 ring-marigold/30 shadow-md"
                  : "bg-surface hover:bg-cardstock border-ink/15 text-ink hover:border-marigold"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Monitor className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  Windows Driver
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-ink">Windows / System Default</p>
                <p className="text-[10px] text-ink-soft mt-0.5 leading-snug">
                  Uses installed Windows printer driver with thermal slip formatting
                </p>
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-black flex items-center gap-1">
                {status.connectionType === "SYSTEM" ? "✓ Active (System Spooler)" : "Use System Printer →"}
              </span>
            </button>

            {/* OPTION 3: Bluetooth Wireless POS Printer */}
            <button
              onClick={handlePairBluetooth}
              disabled={isPairingBluetooth}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                status.connectionType === "BLUETOOTH"
                  ? "bg-marigold/15 border-marigold text-ink ring-2 ring-marigold/30 shadow-md"
                  : "bg-surface hover:bg-cardstock border-ink/15 text-ink hover:border-marigold"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Bluetooth className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  Bluetooth
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-ink">Bluetooth Wireless</p>
                <p className="text-[10px] text-ink-soft mt-0.5 leading-snug">
                  58mm / 80mm wireless portable POS receipt printers
                </p>
              </div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-black flex items-center gap-1">
                {isPairingBluetooth ? "Scanning Bluetooth..." : status.connectionType === "BLUETOOTH" ? "✓ Connected (BLE)" : "Pair Bluetooth →"}
              </span>
            </button>

            {/* OPTION 4: Legacy Serial / COM Port */}
            <div className="p-3.5 rounded-2xl border bg-surface border-ink/15 text-ink flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-cardstock text-ink-soft flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono font-bold text-ink-soft">Baud:</span>
                  <select
                    value={serialBaudRate}
                    onChange={(e) => setSerialBaudRate(Number(e.target.value))}
                    className="bg-cardstock border border-ink/15 rounded text-[10px] font-bold px-1.5 py-0.5 text-ink"
                  >
                    <option value={9600}>9600</option>
                    <option value={19200}>19200</option>
                    <option value={38400}>38400</option>
                    <option value={57600}>57600</option>
                    <option value={115200}>115200</option>
                  </select>
                </div>
              </div>
              <div>
                <p className="text-xs font-black text-ink">Serial COM Port</p>
                <p className="text-[10px] text-ink-soft mt-0.5 leading-snug">
                  For older RS232 / Virtual COM port converter adapters
                </p>
              </div>
              <button
                type="button"
                onClick={handlePairSerial}
                disabled={isPairingSerial}
                className="text-xs text-ink font-black hover:text-marigold flex items-center gap-1 cursor-pointer pt-0.5"
              >
                {isPairingSerial ? "Opening COM Port..." : status.connectionType === "SERIAL" ? "✓ Connected (COM Port)" : "Pair COM Port →"}
              </button>
            </div>
          </div>
        </div>

        {/* Paper Width Config */}
        <div className="space-y-2 pt-2 border-t border-ink/10">
          <label className="text-xs font-black text-ink flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-marigold" /> Thermal Paper Roll Width:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handlePaperWidthChange("58mm")}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                status.paperWidth === "58mm"
                  ? "bg-marigold text-white border-marigold shadow-sm"
                  : "bg-surface border-ink/15 text-ink-soft hover:text-ink"
              }`}
            >
              58mm (Standard 2-inch / Essae PR-55)
            </button>
            <button
              onClick={() => handlePaperWidthChange("80mm")}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                status.paperWidth === "80mm"
                  ? "bg-marigold text-white border-marigold shadow-sm"
                  : "bg-surface border-ink/15 text-ink-soft hover:text-ink"
              }`}
            >
              80mm (Wide 3-inch Restaurant POS)
            </button>
          </div>
        </div>

        {/* Automated Background Dispatch Rules */}
        <div className="space-y-2 pt-2 border-t border-ink/10 text-xs">
          <label className="font-black text-ink flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-marigold" /> Automated Kitchen Dispatch Rules:
          </label>

          <div className="space-y-2 bg-surface p-3.5 rounded-2xl border border-ink/15">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-ink">Auto-Print Kitchen Slip (KOT) on New Order</p>
                <p className="text-[10px] text-ink-soft">Prints instant slip with Token #, Time, Items (strictly NO price)</p>
              </div>
              <input
                type="checkbox"
                checked={autoPrintKOT}
                onChange={handleToggleKOT}
                className="w-4 h-4 rounded border-ink/20 cursor-pointer accent-marigold"
              />
            </div>

            <div className="flex items-center justify-between border-t border-ink/10 pt-2">
              <div>
                <p className="font-black text-ink">Auto-Print Cancellation Slip on Refund</p>
                <p className="text-[10px] text-ink-soft">Prints *** ORDER CANCELLED *** slip when student cancels or item is out-of-stock</p>
              </div>
              <input
                type="checkbox"
                checked={autoPrintCancel}
                onChange={handleToggleCancel}
                className="w-4 h-4 rounded border-ink/20 cursor-pointer accent-marigold"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-ink/10 flex items-center justify-between gap-3">
          <button
            onClick={handleTestPrint}
            disabled={isTesting}
            className="px-4 py-2.5 rounded-xl bg-cardstock hover:bg-cardstock-hover border border-ink/15 text-xs font-bold text-ink flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-marigold" /> : <Printer className="w-3.5 h-3.5 text-marigold" />}
            <span>Test Print Receipt 🖨️</span>
          </button>

          <button
            onClick={onClose}
            className="bg-marigold hover:bg-marigold-hover px-6 py-2.5 rounded-xl text-xs font-black text-white transition-colors cursor-pointer shadow-sm"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}

