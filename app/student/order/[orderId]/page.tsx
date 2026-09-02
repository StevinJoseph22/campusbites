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
      <div className="min-h-screen bg-paper text-ink flex flex-col justify-center items-center p-4">
        <div className="card-surface p-8 text-center space-y-4 max-w-md">
          <AlertCircle className="w-10 h-10 text-marigold mx-auto" />
          <h2 className="font-display text-lg font-bold text-ink">Order Not Found</h2>
          <Link href="/student/dashboard" className="bg-marigold hover:bg-marigold-hover px-5 py-2.5 rounded text-xs font-bold text-white inline-block transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col pb-16">
      <Navbar />

      {/* REAL-TIME SMS POPUP TOAST */}
      {activeSmsToast && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 card-surface border-marigold/40 p-4 text-ink text-xs font-bold flex items-center justify-between animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-marigold shrink-0" />
            <span>{activeSmsToast}</span>
          </div>
          <button onClick={() => setActiveSmsToast(null)} className="text-ink-soft hover:text-ink text-xs">✕</button>
        </div>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 lg:px-8 py-6 space-y-6">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Success Header Banner */}
        <div className="card-surface p-6 space-y-2">
          <div className="flex items-center gap-2 text-sage text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Order Secured & Paid via Razorpay</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink">
            Grab Your Tokens! Your Meal is on the Way!
          </h1>
          <p className="text-xs text-ink-soft leading-relaxed font-semibold">
            We've sent a confirmation details mail to your student inbox. Keep an eye on the live status roadmap below to watch your food go from pan to pack!
          </p>
        </div>

        {/* SMS NOTIFICATION LOG STREAM */}
        {smsLogs.length > 0 && (
          <div className="card-surface p-4 space-y-2">
            <h3 className="text-xs font-bold text-ink-soft flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-marigold" /> Dispatched SMS Alerts Log ({smsLogs.length}):
            </h3>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {smsLogs.map((log, idx) => (
                <div key={idx} className="bg-paper leader-row p-2.5 rounded text-[11px] text-ink-soft font-mono">
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
              <div key={portion.tokenNumber} className="card-surface p-6 space-y-6 relative overflow-hidden">

                {/* Portion Header & SOLID TOKEN BADGE UPON DELIVERY */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dashed border-ink/15 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-ink-soft font-bold uppercase tracking-wider block">Vendor Stall</span>
                    <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                      <Store className="w-4 h-4 text-marigold" />
                      <span>{portion.stallName}</span>
                    </h3>
                    <p className="text-xs text-ink-soft flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-marigold" /> Pickup Slot: <strong className="font-mono text-ink font-bold">{portion.pickupTimeSlot}</strong>
                    </p>
                  </div>

                  {/* TOKEN NUMBER BADGE (TURNS SOLID SAGE UPON DELIVERY) */}
                  <div className="text-center sm:text-right">
                    <span className="text-[10px] text-ink-soft uppercase font-bold tracking-wider block mb-1">Canteen Token Number</span>
                    <div className={`px-5 py-2.5 rounded font-mono text-xl sm:text-2xl font-bold transition-all inline-block border-2 ${
                      isFulfilled
                        ? "bg-sage text-white border-sage"
                        : isRefunded
                        ? "bg-chili-soft text-chili border-chili/40"
                        : "bg-marigold/10 border-marigold text-marigold"
                    }`}>
                      {isFulfilled ? `✓ ${portion.tokenNumber} (DELIVERED)` : portion.tokenNumber}
                    </div>
                  </div>
                </div>

                {/* OUT OF STOCK REFUND ALERT */}
                {isRefunded && (
                  <div className="p-4 rounded bg-chili-soft border border-chili/40 text-chili text-xs font-bold space-y-1">
                    <p className="flex items-center gap-2 text-chili font-bold text-sm">
                      <XCircle className="w-5 h-5 shrink-0" />
                      <span>Order Rejected by Kitchen (Out of Stock)</span>
                    </p>
                    <p className="text-[11px] text-ink font-mono leading-relaxed">
                      ₹{portion.subtotal} has been automatically refunded to your original Razorpay payment account!
                    </p>
                  </div>
                )}

                {/* INTERACTIVE 4-STAGE ROADMAP */}
                {!isRefunded && portion.status !== "PARTIAL_HOLD" && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-ink-soft flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-marigold" /> Kitchen Order Status Roadmap:
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isFulfilled ? "bg-sage-soft text-sage" : "bg-marigold/10 text-marigold"
                      }`}>
                        {isFulfilled ? "DELIVERED" : isReady ? "READY FOR PICKUP" : isPacking ? "PACKING" : isCooking ? "COOKING IN KITCHEN" : "ORDER PLACED"}
                      </span>
                    </h4>

                    {/* Progress Bar */}
                    <div className="w-full bg-paper h-2 rounded-full overflow-hidden border border-ink/15 relative">
                      <div
                        className="bg-marigold h-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((currentStageIndex + 1) / 4) * 100)}%` }}
                      />
                    </div>

                    {/* Roadmap Stages */}
                    <div className="grid grid-cols-4 gap-2 pt-2 text-[10px] text-center font-bold">
                      <div className={`p-2 rounded border flex flex-col items-center gap-1 ${
                        currentStageIndex >= 0 ? "bg-marigold/10 border-marigold/40 text-marigold" : "bg-paper border-ink/15 text-ink-soft"
                      }`}>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>1. Order Placed</span>
                      </div>

                      <div className={`p-2 rounded border flex flex-col items-center gap-1 ${
                        currentStageIndex >= 1 ? "bg-marigold/10 border-marigold/40 text-marigold" : "bg-paper border-ink/15 text-ink-soft"
                      }`}>
                        <ChefHat className="w-4 h-4" />
                        <span>2. Cooking</span>
                      </div>

                      <div className={`p-2 rounded border flex flex-col items-center gap-1 ${
                        currentStageIndex >= 2 ? "bg-marigold/10 border-marigold/40 text-marigold" : "bg-paper border-ink/15 text-ink-soft"
                      }`}>
                        <PackageCheck className="w-4 h-4" />
                        <span>3. Packing</span>
                      </div>

                      <div className={`p-2 rounded border flex flex-col items-center gap-1 ${
                        currentStageIndex >= 3 ? "bg-sage-soft border-sage/50 text-sage" : "bg-paper border-ink/15 text-ink-soft"
                      }`}>
                        <Bell className="w-4 h-4" />
                        <span>4. Ready for Pickup</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PARTIAL OUT-OF-STOCK HOLD CHOICE BOX */}
                {portion.status === "PARTIAL_HOLD" && (
                  <div className="p-5 rounded border border-marigold bg-marigold/10 text-ink text-xs font-bold space-y-3 my-2">
                    <div className="flex items-start gap-2 text-marigold font-bold text-sm">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-ink font-bold text-base">Item Out of Stock!</span>
                        <span className="font-normal text-ink-soft">An item in this portion is currently unavailable at the kitchen.</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-ink-soft font-normal leading-relaxed">
                      Would you like to continue with the remaining items (partial refund of the out-of-stock item price will be returned) or cancel the whole order?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1.5">
                      <button
                        onClick={() => handleResolveHold(portion.tokenNumber, "CONTINUE")}
                        className="flex-1 bg-marigold hover:bg-marigold-hover text-white font-bold py-2 px-4 rounded text-center transition-colors"
                      >
                        Continue with Remaining Items
                      </button>
                      <button
                        onClick={() => handleResolveHold(portion.tokenNumber, "CANCEL")}
                        className="flex-1 bg-chili-soft hover:opacity-90 text-chili border border-chili/30 font-bold py-2 px-4 rounded text-center transition-colors"
                      >
                        Cancel Whole Order
                      </button>
                    </div>
                  </div>
                )}

                {/* Ordered Items Breakdown */}
                <div className="space-y-2 border-t border-dashed border-ink/15 pt-4">
                  <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block">Items in this portion:</span>
                  <div className="space-y-1.5">
                    {portion.items.map((item, idx) => (
                      <div key={idx} className={`flex justify-between items-center text-xs bg-paper p-2.5 rounded border ${item.outOfStock ? 'border-chili/30 opacity-70 bg-chili-soft' : 'border-ink/15'}`}>
                        <span className={`text-ink ${item.outOfStock ? 'line-through text-ink-soft' : ''}`}>
                          <strong className="text-marigold font-bold">{item.quantity}x</strong> {item.name}
                          {item.outOfStock && <span className="ml-2 text-[9px] bg-chili-soft text-chili px-1 py-0.5 rounded font-bold">OUT OF STOCK</span>}
                        </span>
                        <span className={`font-bold font-mono ${item.outOfStock ? 'text-ink-soft line-through' : 'text-ink'}`}>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center text-xs font-bold text-ink pt-2 border-t border-dashed border-ink/15">
                  <span>Portion Subtotal</span>
                  <span className="text-marigold text-sm font-bold font-mono">₹{portion.subtotal}</span>
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
            <div className="card-surface p-6 space-y-4">
              <h3 className="font-display text-sm font-bold text-ink border-b border-dashed border-ink/15 pb-2.5 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-marigold" /> Bill Invoice Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center leader-row pb-2 text-ink-soft">
                  <span>Food Item Charges (Subtotal)</span>
                  <span className="text-ink font-mono font-bold">₹{itemCharges.toFixed(2)}</span>
                </div>

                {parcelCharges > 0 && (
                  <div className="flex justify-between items-center leader-row pb-2 text-ink-soft">
                    <span>Takeaway Container / Parcel Charges</span>
                    <span className="text-ink font-mono font-bold">₹{parcelCharges.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center leader-row pb-2 text-ink-soft">
                  <span>Platform/System Service Fee</span>
                  <span className="text-ink font-mono font-bold">₹{platformCharges.toFixed(2)}</span>
                </div>

                <div className="pt-1 flex justify-between items-center text-sm font-bold text-ink">
                  <span className="flex items-center gap-1.5">
                    Grand Total Paid
                  </span>
                  <span className="text-marigold font-mono text-base font-bold">₹{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {order.customerNotes && (
                <div className="mt-3 p-3 bg-paper border border-ink/15 rounded text-[11px] text-ink-soft">
                  <strong className="text-marigold font-bold block mb-1">Customer Delivery Instructions:</strong>
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
