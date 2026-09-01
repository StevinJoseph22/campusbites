"use client";

import React, { useState } from "react";
import { 
  X, 
  Trash2, 
  Clock, 
  ShoppingBag, 
  ArrowRight, 
  CheckCircle2, 
  QrCode, 
  ShieldCheck,
  Plus,
  Minus,
  Sparkles,
  Store
} from "lucide-react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stallName: string;
  category: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
}

const TIME_SLOTS = [
  "12:15 PM (Next Slot)",
  "12:30 PM",
  "12:45 PM",
  "01:00 PM",
  "01:15 PM",
  "01:30 PM"
];

export function CartDrawer({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemoveItem 
}: CartDrawerProps) {
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const platformFee = items.length > 0 ? 5 : 0;
  const total = subtotal + platformFee;

  // Group items by stall name (Multi-vendor feature)
  const itemsByStall = items.reduce((acc, item) => {
    if (!acc[item.stallName]) {
      acc[item.stallName] = [];
    }
    acc[item.stallName].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setOrderComplete(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-950 text-slate-100 h-full flex flex-col justify-between border-l border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between glass-panel">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Your Campus Cart</h2>
              <p className="text-[11px] text-slate-400">
                {items.length === 0 ? "Cart is empty" : `${items.length} unique items selected`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {orderComplete ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Order Confirmed! 🎉</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Your pre-order has been sent to the vendor stalls. Show your digital token at the pickup counter.
              </p>
              
              {/* QR Token Box */}
              <div className="glass-panel p-5 rounded-2xl border-orange-500/30 bg-orange-500/5 max-w-xs mx-auto text-center space-y-2">
                <div className="w-24 h-24 bg-white p-2 rounded-xl mx-auto flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-slate-950" />
                </div>
                <p className="text-xs font-mono font-bold text-orange-400">TOKEN: #CB-7892</p>
                <p className="text-[11px] text-slate-400">Target Pickup: <strong className="text-white">{selectedSlot}</strong></p>
              </div>

              <button 
                onClick={() => {
                  setOrderComplete(false);
                  onClose();
                }}
                className="w-full btn-primary-gradient py-3 text-xs font-bold text-white rounded-xl"
              >
                Back to Campus Stalls
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Your basket is empty</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Explore popular canteen stalls and add burgers, dosas, or cold coffee to build your combined cart!
              </p>
            </div>
          ) : (
            <>
              {/* Multi-Vendor Alert */}
              <div className="glass-panel p-3.5 rounded-xl border-orange-500/20 bg-orange-500/5 flex items-center gap-2 text-xs text-orange-400">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Combined Cart: Items from {Object.keys(itemsByStall).length} vendor stall(s)</span>
              </div>

              {/* Items grouped by Stall */}
              {Object.entries(itemsByStall).map(([stallName, stallItems]) => (
                <div key={stallName} className="glass-panel p-4 rounded-xl border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white pb-2 border-b border-slate-800/80">
                    <Store className="w-3.5 h-3.5 text-orange-400" />
                    <span>{stallName}</span>
                  </div>

                  <div className="space-y-3">
                    {stallItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-200">{item.name}</p>
                          <p className="text-slate-400 text-[11px]">₹{item.price} each</p>
                        </div>

                        {/* Quantity Control */}
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
                          <button 
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 hover:text-orange-400 text-slate-400"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-white w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 hover:text-orange-400 text-slate-400"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-bold text-white w-12 text-right">
                          ₹{item.price * item.quantity}
                        </span>

                        <button 
                          onClick={() => onRemoveItem(item.id)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Pickup Time Slot Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Select Break Pickup Time Slot
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                        selectedSlot === slot
                          ? "bg-orange-500/20 border border-orange-500 text-orange-400"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Checkout */}
        {!orderComplete && items.length > 0 && (
          <div className="p-4 border-t border-slate-800 glass-panel space-y-3">
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="text-slate-200">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Campus Express Fee</span>
                <span className="text-slate-200">₹{platformFee}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Payable</span>
                <span className="text-orange-400">₹{total}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full btn-primary-gradient py-3 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
            >
              {isCheckingOut ? (
                <span>Generating Digital QR Token...</span>
              ) : (
                <>
                  <span>Pay & Get QR Token (₹{total})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
