"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { PageLoader } from "@/components/PageLoader";
import { getSocket } from "@/lib/socket-client";
import { 
  Clock, 
  CheckCircle2, 
  Store, 
  ArrowLeft, 
  ChefHat, 
  PackageCheck,
  Bell,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  FileText,
  CreditCard,
  Building2,
  Check,
  XCircle,
  RotateCcw,
  Smartphone,
  MessageSquare,
  Receipt
} from "lucide-react";

interface VendorPortion {
  stallId: string;
  stallName: string;
  tokenNumber: string;
  pickupTimeSlot: string;
  customerNotes?: string;
  items: Array<{ name: string; price: number; quantity: number; outOfStock?: boolean }>;
  subtotal: number;
  status: "PLACED" | "ACCEPTED" | "COOKING" | "PACKING" | "READY" | "FULFILLED" | "REFUNDED" | "PARTIAL_HOLD";
}

interface OrderRecord {
  orderId: string;
  masterToken: string;
  placedAt: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  customerNotes?: string;
  vendorPortions: VendorPortion[];
}

export default function StudentOrderConfirmationPage() {
  const params = useParams();
  const orderId = (params?.orderId as string) || "";
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [smsLogs, setSmsLogs] = useState<string[]>([]);
  const [activeSmsToast, setActiveSmsToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/orders?orderId=${orderId}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        // Fallback to localStorage
        const savedOrders = JSON.parse(localStorage.getItem("campusbites_orders") || "[]");
        const found = savedOrders.find((o: any) => o.orderId === orderId) || savedOrders[0];
        if (found) setOrder(found);
      }
    } catch (e) {
      console.error(e);
      // Fallback to localStorage
      const savedOrders = JSON.parse(localStorage.getItem("campusbites_orders") || "[]");
      const found = savedOrders.find((o: any) => o.orderId === orderId) || savedOrders[0];
      if (found) setOrder(found);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveHold = async (tokenNumber: string, resolution: "CONTINUE" | "CANCEL") => {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenNumber, resolution })
      });
      const data = await res.json();
      if (data.success && orderId) {
        await fetchOrderDetails();
        // Emit socket update event to let vendor know instantly
        const socket = getSocket();
        socket.emit("update_order_status", { tokenNumber, status: resolution === "CONTINUE" ? "ACCEPTED" : "REFUNDED" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();

      const interval = setInterval(() => {
        fetchOrderDetails();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [orderId]);

  useEffect(() => {
    const socket = getSocket();
    const userPhone = localStorage.getItem("campusbites_user_phone") || "9876543210";

    const handleStatusUpdate = (data: { tokenNumber: string; status: string }) => {
      // Sync all database changes (out of stock flags, new subtotal, and status changes) instantly
      fetchOrderDetails();

      // GENERATE SMS STREAM LOG & TOAST
      let smsText = "";
      if (data.status === "COOKING") smsText = `Chef is now COOKING your order ${data.tokenNumber} in kitchen 🍳`;
      else if (data.status === "PACKING") smsText = `Order ${data.tokenNumber} is PACKED and being checked 📦`;
      else if (data.status === "READY") smsText = `Order ${data.tokenNumber} is READY for counter pickup! 🔔`;
        else if (data.status === "FULFILLED") smsText = `Order ${data.tokenNumber} has been DELIVERED! Thank you for dining with CampusBites! 🎉`;
        else if (data.status === "REFUNDED") smsText = `Order ${data.tokenNumber} Out of Stock — Refund processed via Razorpay ❌`;

        if (smsText) {
          const formattedSms = `📱 SMS to +91 ${userPhone}: "${smsText}"`;
          setActiveSmsToast(formattedSms);
          setSmsLogs(logs => [formattedSms, ...logs]);
          setTimeout(() => setActiveSmsToast(null), 5000);
        }
    };

    socket.on("order_status_updated", handleStatusUpdate);

    return () => {
      socket.off("order_status_updated", handleStatusUpdate);
    };
  }, []);

  if (loading) {
    return (
      <PageLoader 
        message="Loading Order Details" 
        submessage="Connecting to kitchen dispatch feeds and checking token statuses..." 
        type="order" 
      />
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="glass-panel p-8 rounded-3xl text-center space-y-4 max-w-md">
          <AlertCircle className="w-10 h-10 text-orange-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Order Not Found</h2>
          <Link href="/student/dashboard" className="btn-primary-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-white inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col pb-16">
      <Navbar />

      {/* REAL-TIME SMS POPUP TOAST */}
      {activeSmsToast && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 glass-panel p-4 rounded-2xl border-orange-500/60 bg-orange-500/20 text-white text-xs font-bold flex items-center justify-between shadow-2xl animate-in slide-in-from-top ring-2 ring-orange-500/50">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-orange-400 animate-bounce shrink-0" />
            <span>{activeSmsToast}</span>
          </div>
          <button onClick={() => setActiveSmsToast(null)} className="text-white text-xs">✕</button>
        </div>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 lg:px-8 py-6 space-y-6">
        <Link 
          href="/student/dashboard" 
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Success Header Banner */}
        <div className="glass-panel p-6 rounded-3xl border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Order Secured & Paid via Razorpay</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            🔥 Grab Your Tokens! Your Meal is on the Way!
          </h1>
          <p className="text-xs text-slate-350 leading-relaxed font-semibold">
            We've sent a confirmation details mail to your student inbox. Keep an eye on the live status roadmap below to watch your food go from pan to pack!
          </p>
        </div>

        {/* SMS NOTIFICATION LOG STREAM */}
        {smsLogs.length > 0 && (
          <div className="glass-panel p-4 rounded-3xl border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-orange-400" /> Dispatched SMS Alerts Log ({smsLogs.length}):
            </h3>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {smsLogs.map((log, idx) => (
                <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-orange-300 font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vendor Portions & Interactive 4-Stage Roadmap */}
        <div className="space-y-6">
          {order.vendorPortions.map((portion) => {
            const isPlaced = portion.status === "PLACED";
            const isAccepted = portion.status === "ACCEPTED";
            const isCooking = portion.status === "COOKING";
            const isPacking = portion.status === "PACKING";
            const isReady = portion.status === "READY";
            const isFulfilled = portion.status === "FULFILLED";
            const isRefunded = portion.status === "REFUNDED";

            let currentStageIndex = 0;
            if (isAccepted || isCooking) currentStageIndex = 1;
            if (isPacking) currentStageIndex = 2;
            if (isReady) currentStageIndex = 3;
            if (isFulfilled) currentStageIndex = 4;

            return (
              <div key={portion.tokenNumber} className="glass-panel rounded-3xl p-6 border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
                
                {/* Portion Header & SOLID EMERALD TOKEN BADGE UPON DELIVERY */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vendor Stall</span>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Store className="w-4 h-4 text-orange-400" />
                      <span>{portion.stallName}</span>
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Pickup Slot: <strong className="text-white font-bold">{portion.pickupTimeSlot}</strong>
                    </p>
                  </div>

                  {/* TOKEN NUMBER BADGE (TURNS SOLID EMERALD GREEN UPON DELIVERY) */}
                  <div className="text-center sm:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Canteen Token Number</span>
                    <div className={`px-5 py-2.5 rounded-2xl font-mono text-xl sm:text-2xl font-black transition-all shadow-xl inline-block ${
                      isFulfilled
                        ? "bg-emerald-600 text-white border-2 border-emerald-400 shadow-emerald-500/40 ring-4 ring-emerald-500/20"
                        : isRefunded
                        ? "bg-red-950 text-red-400 border border-red-500/40"
                        : "bg-orange-500/20 border-2 border-orange-500 text-orange-400"
                    }`}>
                      {isFulfilled ? `✓ ${portion.tokenNumber} (DELIVERED)` : portion.tokenNumber}
                    </div>
                  </div>
                </div>

                {/* OUT OF STOCK REFUND ALERT */}
                {isRefunded && (
                  <div className="glass-panel p-4 rounded-2xl border-red-500/50 bg-red-500/10 text-red-300 text-xs font-bold space-y-1">
                    <p className="flex items-center gap-2 text-red-400 font-extrabold text-sm">
                      <XCircle className="w-5 h-5 shrink-0" />
                      <span>Order Rejected by Kitchen (Out of Stock)</span>
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      ₹{portion.subtotal} has been automatically refunded to your original Razorpay payment account!
                    </p>
                  </div>
                )}

                {/* INTERACTIVE 4-STAGE ROADMAP */}
                {!isRefunded && portion.status !== "PARTIAL_HOLD" && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Kitchen Order Status Roadmap:
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isFulfilled ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-300"
                      }`}>
                        {isFulfilled ? "DELIVERED" : isReady ? "READY FOR PICKUP" : isPacking ? "PACKING" : isCooking ? "COOKING IN KITCHEN" : "ORDER PLACED"}
                      </span>
                    </h4>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 relative">
                      <div 
                        className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((currentStageIndex + 1) / 4) * 100)}%` }}
                      />
                    </div>

                    {/* Roadmap Stages */}
                    <div className="grid grid-cols-4 gap-2 pt-2 text-[10px] text-center font-bold">
                      <div className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                        currentStageIndex >= 0 ? "bg-orange-500/10 border-orange-500/40 text-orange-300" : "bg-slate-950 border-slate-900 text-slate-500"
                      }`}>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>1. Order Placed</span>
                      </div>

                      <div className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                        currentStageIndex >= 1 ? "bg-orange-500/10 border-orange-500/40 text-orange-300" : "bg-slate-950 border-slate-900 text-slate-500"
                      }`}>
                        <ChefHat className="w-4 h-4" />
                        <span>2. Cooking 🍳</span>
                      </div>

                      <div className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                        currentStageIndex >= 2 ? "bg-purple-500/10 border-purple-500/40 text-purple-300" : "bg-slate-950 border-slate-900 text-slate-500"
                      }`}>
                        <PackageCheck className="w-4 h-4" />
                        <span>3. Packing 📦</span>
                      </div>

                      <div className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                        currentStageIndex >= 3 ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 ring-1 ring-emerald-500" : "bg-slate-950 border-slate-900 text-slate-500"
                      }`}>
                        <Bell className="w-4 h-4" />
                        <span>4. Ready for Pickup 🔔</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PARTIAL OUT-OF-STOCK HOLD CHOICE BOX */}
                {portion.status === "PARTIAL_HOLD" && (
                  <div className="glass-panel p-5 rounded-2xl border-amber-500 bg-amber-500/10 text-amber-300 text-xs font-bold space-y-3 shadow-lg my-2 border">
                    <div className="flex items-start gap-2 text-amber-400 font-extrabold text-sm">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-white font-black text-base">⚠️ Item Out of Stock!</span>
                        <span>An item in this portion is currently unavailable at the kitchen.</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Would you like to continue with the remaining items (partial refund of the out-of-stock item price will be returned) or cancel the whole order?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1.5">
                      <button
                        onClick={() => handleResolveHold(portion.tokenNumber, "CONTINUE")}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-2 px-4 rounded-xl text-center transition-colors"
                      >
                        ✓ Continue with Remaining Items
                      </button>
                      <button
                        onClick={() => handleResolveHold(portion.tokenNumber, "CANCEL")}
                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-extrabold py-2 px-4 rounded-xl text-center transition-colors"
                      >
                        ✕ Cancel Whole Order
                      </button>
                    </div>
                  </div>
                )}

                {/* Ordered Items Breakdown */}
                <div className="space-y-2 border-t border-slate-800 pt-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Items in this portion:</span>
                  <div className="space-y-1.5">
                    {portion.items.map((item, idx) => (
                      <div key={idx} className={`flex justify-between items-center text-xs bg-slate-950 p-2.5 rounded-xl border ${item.outOfStock ? 'border-red-500/30 opacity-70 bg-red-950/20' : 'border-slate-800/80'}`}>
                        <span className={`text-slate-200 ${item.outOfStock ? 'line-through text-slate-500' : ''}`}>
                          <strong className="text-orange-400 font-bold">{item.quantity}x</strong> {item.name}
                          {item.outOfStock && <span className="ml-2 text-[9px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded font-extrabold">OUT OF STOCK</span>}
                        </span>
                        <span className={`font-bold ${item.outOfStock ? 'text-slate-500 line-through' : 'text-white'}`}>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center text-xs font-bold text-white pt-2 border-t border-slate-800/60">
                  <span>Portion Subtotal</span>
                  <span className="text-orange-400 text-sm font-extrabold">₹{portion.subtotal}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Invoice Summary Receipt */}
        {(() => {
          const itemCharges = order.vendorPortions.reduce((sum, portion) => {
            return sum + portion.items.reduce((iSum, i) => iSum + i.price * i.quantity, 0);
          }, 0);

          const parcelCharges = order.vendorPortions.reduce((sum, portion) => {
            const portionItemCharges = portion.items.reduce((iSum, i) => iSum + i.price * i.quantity, 0);
            return sum + Math.max(0, portion.subtotal - portionItemCharges);
          }, 0);

          const platformCharges = Math.max(0, order.totalAmount - order.vendorPortions.reduce((sum, p) => sum + p.subtotal, 0));

          return (
            <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4 bg-slate-950/20">
              <h3 className="text-sm font-black text-white border-b border-slate-800 pb-2.5 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-orange-400" /> Bill Invoice Summary
              </h3>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Food Item Charges (Subtotal)</span>
                  <span className="text-white font-bold">₹{itemCharges.toFixed(2)}</span>
                </div>
                
                {parcelCharges > 0 && (
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Takeaway Container / Parcel Charges</span>
                    <span className="text-white font-bold">₹{parcelCharges.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-slate-400">
                  <span>Platform/System Service Fee</span>
                  <span className="text-white font-bold">₹{platformCharges.toFixed(2)}</span>
                </div>

                <div className="border-t border-slate-800/80 my-2 pt-2.5 flex justify-between items-center text-sm font-black text-white">
                  <span className="flex items-center gap-1.5">
                    Grand Total Paid
                  </span>
                  <span className="text-orange-400 text-base font-black">₹{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {order.customerNotes && (
                <div className="mt-3 p-3 bg-slate-950/60 border border-slate-850 rounded-2xl text-[11px] text-slate-400">
                  <strong className="text-orange-400 font-bold block mb-1">Customer Delivery Instructions:</strong>
                  "{order.customerNotes}"
                </div>
              )}
            </div>
          );
        })()}
      </main>
    </div>
  );
}
