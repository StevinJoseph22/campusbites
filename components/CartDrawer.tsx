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
    <div className="fixed inset-0 z-50 overflow-hidden bg-ink/60 flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface text-ink h-full flex flex-col justify-between border-l border-ink/15">
        {/* Header */}
        <div className="p-4 border-b border-ink/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-marigold/10 border border-marigold/30 text-marigold flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-ink">Your Campus Cart</h2>
              <p className="text-[11px] text-ink-soft">
                {items.length === 0 ? "Cart is empty" : `${items.length} unique items selected`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded bg-cardstock border border-ink/15 text-ink-soft hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {orderComplete ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded bg-sage-soft border border-sage/30 text-sage flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-bold text-ink">Order Confirmed!</h3>
              <p className="text-xs text-ink-soft max-w-xs mx-auto">
                Your pre-order has been sent to the vendor stalls. Show your digital token at the pickup counter.
              </p>

              {/* QR Token Box */}
              <div className="card-surface p-5 max-w-xs mx-auto text-center space-y-2">
                <div className="w-24 h-24 bg-paper border border-ink/15 p-2 rounded mx-auto flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-ink" />
                </div>
                <p className="text-xs font-mono font-bold text-marigold">TOKEN: #CB-7892</p>
                <p className="text-[11px] text-ink-soft">Target Pickup: <strong className="font-mono text-ink">{selectedSlot}</strong></p>
              </div>

              <button
                onClick={() => {
                  setOrderComplete(false);
                  onClose();
                }}
                className="w-full bg-marigold hover:bg-marigold-hover py-3 text-xs font-bold text-white rounded transition-colors"
              >
                Back to Campus Stalls
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-cardstock border border-ink/15 text-ink-soft flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-ink">Your basket is empty</p>
              <p className="text-xs text-ink-soft max-w-xs mx-auto">
                Explore popular canteen stalls and add burgers, dosas, or cold coffee to build your combined cart!
              </p>
            </div>
          ) : (
            <>
              {/* Multi-Vendor Alert */}
              <div className="bg-marigold/10 border border-marigold/30 p-3.5 rounded flex items-center gap-2 text-xs text-marigold">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Combined Cart: Items from {Object.keys(itemsByStall).length} vendor stall(s)</span>
              </div>

              {/* Items grouped by Stall */}
              {Object.entries(itemsByStall).map(([stallName, stallItems]) => (
                <div key={stallName} className="card-surface p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-ink pb-2 border-b border-dashed border-ink/15">
                    <Store className="w-3.5 h-3.5 text-marigold" />
                    <span>{stallName}</span>
                  </div>

                  <div className="space-y-3">
                    {stallItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex-1">
                          <p className="font-semibold text-ink">{item.name}</p>
                          <p className="text-ink-soft text-[11px] font-mono">₹{item.price} each</p>
                        </div>

                        {/* Quantity Control */}
                        <div className="flex items-center gap-2 bg-paper border border-ink/15 rounded p-1">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 hover:text-marigold text-ink-soft"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-ink w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 hover:text-marigold text-ink-soft"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-mono font-bold text-ink w-12 text-right">
                          ₹{item.price * item.quantity}
                        </span>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-ink-soft hover:text-chili p-1"
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
                <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-marigold" /> Select Break Pickup Time Slot
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded text-xs font-mono font-semibold text-left transition-all border ${
                        selectedSlot === slot
                          ? "bg-marigold/10 border-marigold text-marigold"
                          : "bg-paper border-ink/15 text-ink-soft hover:text-ink"
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
          <div className="p-4 border-t border-ink/15 bg-surface space-y-3">
            <div className="space-y-1.5 text-xs text-ink-soft">
              <div className="flex justify-between leader-row pb-1.5">
                <span>Items Subtotal</span>
                <span className="text-ink font-mono">₹{subtotal}</span>
              </div>
              <div className="flex justify-between leader-row pb-1.5">
                <span>Campus Express Fee</span>
                <span className="text-ink font-mono">₹{platformFee}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-ink pt-1">
                <span>Total Payable</span>
                <span className="font-mono text-marigold">₹{total}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-marigold hover:bg-marigold-hover disabled:opacity-60 py-3 text-xs font-bold text-white rounded transition-colors flex items-center justify-center gap-2"
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
