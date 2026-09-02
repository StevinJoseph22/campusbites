"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { PageLoader } from "@/components/PageLoader";
import { useCart } from "@/context/CartContext";
import { getSocket } from "@/lib/socket-client";
import { 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  Store, 
  AlertCircle,
  FileText,
  ShieldCheck,
  Building2,
  PackageCheck,
  MessageSquare
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const timeSlots = (() => {
  const slots: string[] = [];
  let currentHour = 10;
  let currentMin = 0;

  while (currentHour < 17) {
    const startHour12 = currentHour % 12 === 0 ? 12 : currentHour % 12;
    const startAmPm = currentHour >= 12 ? "PM" : "AM";
    const startMinStr = currentMin === 0 ? "00" : currentMin.toString();
    
    let endHour = currentHour;
    let endMin = currentMin + 15;
    if (endMin >= 60) {
      endMin = 0;
      endHour += 1;
    }
    const endHour12 = endHour % 12 === 0 ? 12 : endHour % 12;
    const endAmPm = endHour >= 12 ? "PM" : "AM";
    const endMinStr = endMin === 0 ? "00" : endMin.toString();

    slots.push(`${startHour12}:${startMinStr} ${startAmPm} - ${endHour12}:${endMinStr} ${endAmPm}`);

    currentHour = endHour;
    currentMin = endMin;
  }
  return slots;
})();

function parseTimeToMinutes(timeStr: string): number {
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/^(\d+):(\d+)(?:\s*(AM|PM))?$/);
  if (!match) return 0;
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3];

  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, totalAmount, orderType, clearCart } = useCart();
  const [customerNotes, setCustomerNotes] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(timeSlots[9]); // Defaults to around 12:15 PM slot
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY">("RAZORPAY");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [settingsPlatformFee, setSettingsPlatformFee] = useState(5.0);
  const [settingsTakeawayFee, setSettingsTakeawayFee] = useState(10.0);
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});

  React.useEffect(() => {
    const reg = typeof window !== "undefined" ? localStorage.getItem("campusbites_student_reg") : null;
    if (!reg) {
      router.push("/login?redirect=/student/checkout");
    }
  }, [router]);

  React.useEffect(() => {
    const loadFeesAndSlots = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success && data.settings) {
          setSettingsPlatformFee(data.settings.platformFee);
          setSettingsTakeawayFee(data.settings.takeawayFee);
        }

        const slotRes = await fetch("/api/orders?checkSlots=true");
        const slotData = await slotRes.json();
        if (slotData.success && slotData.slotCounts) {
          setSlotCounts(slotData.slotCounts);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadFeesAndSlots();
  }, []);

  // Group items by vendor stall
  const itemsByStall = cartItems.reduce((acc, item) => {
    if (!acc[item.stallId]) {
      acc[item.stallId] = {
        stallName: item.stallName,
        stallInitials: item.stallInitials,
        items: []
      };
    }
    acc[item.stallId].items.push(item);
    return acc;
  }, {} as Record<string, { stallName: string; stallInitials: string; items: typeof cartItems }>);

  const calculateStallTotal = (items: typeof cartItems) => {
    const foodTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const packagingTotal = orderType === "TAKEAWAY"
      ? items.reduce((sum, i) => sum + settingsTakeawayFee * i.quantity, 0)
      : 0;
    return foodTotal + packagingTotal;
  };

  const calculatedTotal = Object.values(itemsByStall).reduce((sum, group) => sum + calculateStallTotal(group.items), 0) + settingsPlatformFee;

  const handleRazorpayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 0. Validate item availability and time constraints
      // Check if canteen stalls are currently open
      const restRes = await fetch("/api/restaurants");
      const restData = await restRes.json();
      if (!restRes.ok || !restData.success) {
        setErrorMessage("Unable to verify canteen operational hours. Please try again.");
        setIsProcessing(false);
        return;
      }

      const uniqueStallIds = Array.from(new Set(cartItems.map(item => item.stallId)));
      for (const stallId of uniqueStallIds) {
        const stall = restData.restaurants.find((r: any) => r.id === stallId);
        if (stall && stall.isOpen === false) {
          setErrorMessage(`⚠️ The canteen "${stall.name}" has just closed! Please remove their items from your cart to proceed.`);
          setIsProcessing(false);
          return;
        }
      }

      for (const item of cartItems) {
        const menuRes = await fetch(`/api/menu?restaurantId=${item.stallId}`);
        const menuData = await menuRes.json();
        if (!menuRes.ok || !menuData.success) {
          setErrorMessage("Unable to verify canteen menu availability. Please try again.");
          setIsProcessing(false);
          return;
        }
        
        const baseItemId = item.id.includes("::") ? item.id.split("::")[0] : item.id;
        const dbItem = menuData.items.find((i: any) => i.id === baseItemId);
        if (!dbItem) {
          setErrorMessage(`⚠️ "${item.name}" is no longer on the canteen menu!`);
          setIsProcessing(false);
          return;
        }
        
        // Check Out of Stock
        if (!dbItem.available || dbItem.stockCount <= 0) {
          setErrorMessage(`⚠️ Sorry, "${item.name}" has just gone out of stock! Please remove it from your cart to proceed.`);
          setIsProcessing(false);
          return;
        }
        
        // Check Time constraints
        const slotStart = selectedSlot.split("-")[0].trim();
        const slotMin = parseTimeToMinutes(slotStart);
        const itemMin = parseTimeToMinutes(dbItem.availableFrom || "10:00 AM");
        if (slotMin < itemMin) {
          setErrorMessage(`⚠️ "${dbItem.name}" is only available for pickup after ${dbItem.availableFrom}. Please choose a slot after ${dbItem.availableFrom} or remove it from your cart.`);
          setIsProcessing(false);
          return;
        }
      }

      // 1. Create a real order on Razorpay via our backend
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: calculatedTotal,
          currency: "INR",
          receipt: `rcpt_${Date.now()}`
        })
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMessage(data.error || "Failed to initialize Razorpay checkout");
        setIsProcessing(false);
        return;
      }

      // 2. Load Razorpay's checkout widget and actually collect payment
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMessage("Could not load Razorpay checkout. Check your connection and try again.");
        setIsProcessing(false);
        return;
      }

      const regNumForPrefill = typeof window !== "undefined" ? localStorage.getItem("campusbites_student_reg") : null;
      const emailForPrefill = (typeof window !== "undefined" ? localStorage.getItem("campusbites_user_phone") : null) || (regNumForPrefill ? `${regNumForPrefill}@kristujayanti.com` : undefined);

      const razorpay = new window.Razorpay({
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        name: "CampusBites",
        description: "Campus canteen order",
        prefill: emailForPrefill ? { email: emailForPrefill } : undefined,
        theme: { color: "#C8791E" },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          await finalizeOrder(response);
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setErrorMessage("Payment was cancelled. No amount was charged.");
          }
        }
      });

      razorpay.on("payment.failed", () => {
        setIsProcessing(false);
        setErrorMessage("Payment failed. Please try again.");
      });

      razorpay.open();
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setErrorMessage(err.message || "Payment encountered an error. Please try again.");
    }
  };

  const finalizeOrder = async (paymentResponse: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
    try {
      // 3. Verify the payment signature with our backend before treating the order as paid
      const verifyRes = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentResponse)
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success || !verifyData.verified) {
        setIsProcessing(false);
        setErrorMessage("Payment could not be verified. If money was deducted, it will be refunded — please contact support.");
        return;
      }

      // Generate order record & tokens
      const orderId = `cb-order-${Date.now()}`;
      const regNum = typeof window !== "undefined" ? localStorage.getItem("campusbites_student_reg") : null;
      const userPhone = (typeof window !== "undefined" ? localStorage.getItem("campusbites_user_phone") : null) || (regNum ? `${regNum}@kristujayanti.com` : "student@kristujayanti.com");
      const vendorPortions = Object.entries(itemsByStall).map(([stallId, stallGroup], idx) => {
        let initialsCode = "CB";
        const lowerStall = stallId.toLowerCase();
        if (lowerStall.includes("southexpress")) initialsCode = "SE";
        else if (lowerStall.includes("campusgrill")) initialsCode = "TC";
        else if (lowerStall.includes("wokroll")) initialsCode = "WR";
        else if (lowerStall.includes("coldbrew")) initialsCode = "CB";
        else {
          initialsCode = (stallGroup.stallInitials || "CB").replace("KJU-", "").replace("KJC-", "").replace("-CC", "").replace("-ARC", "");
        }

        const campusCode = lowerStall.includes("arc") ? "SRC" : "CC";
        const tokenNum = `KJU-${initialsCode}-${campusCode}-${Math.floor(100 + Math.random() * 900)}`;
        return {
          stallId,
          stallName: stallGroup.stallName,
          tokenNumber: tokenNum,
          pickupTimeSlot: selectedSlot,
          customerNotes,
          items: stallGroup.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
          subtotal: calculateStallTotal(stallGroup.items),
          status: "PLACED" as const
        };
      });

      const newOrder = {
        orderId,
        masterToken: `KJU-MASTER-${Math.floor(1000 + Math.random() * 9000)}`,
        placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        placedTimestamp: Date.now(),
        paymentMethod: `Razorpay (Payment ID: ${paymentResponse.razorpay_payment_id})`,
        paymentStatus: "PAID",
        totalAmount: calculatedTotal,
        customerNotes,
        vendorPortions
      };

      // Save order to Database via API
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          masterToken: newOrder.masterToken,
          totalAmount: calculatedTotal,
          customerNotes,
          vendorPortions,
          email: userPhone,
          studentName: typeof window !== "undefined" ? localStorage.getItem("campusbites_user_name") : null,
          studentRegNumber: regNum
        })
      });

      // Save order to localStorage
      const existingOrders = JSON.parse(localStorage.getItem("campusbites_orders") || "[]");
      localStorage.setItem("campusbites_orders", JSON.stringify([newOrder, ...existingOrders]));

      // Broadcast order event via Socket.io
      const socket = getSocket();
      socket.emit("new_order", newOrder);

      clearCart();
      setIsProcessing(false);
      router.push(`/student/order/${orderId}`);

    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setErrorMessage(err.message || "Payment encountered an error. Please try again.");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-paper text-ink flex flex-col justify-center items-center p-4">
        <div className="card-surface p-8 text-center space-y-4 max-w-md">
          <AlertCircle className="w-10 h-10 text-marigold mx-auto" />
          <h2 className="font-display text-lg font-bold text-ink">Your Cart is Empty</h2>
          <p className="text-xs text-ink-soft">Add dishes from canteens before proceeding to checkout.</p>
          <Link href="/student/dashboard" className="bg-marigold hover:bg-marigold-hover px-5 py-2.5 rounded text-xs font-bold text-white inline-block transition-colors">
            Browse Canteen Stalls
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col pb-16">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 lg:px-8 py-6 space-y-6">
        <Link
          href="/student/cart"
          className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cart Summary
        </Link>

        <div className="card-surface p-6 space-y-2">
          <span className="text-[10px] text-marigold font-bold uppercase tracking-wider block">Final Step</span>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink">
            Razorpay Secure Checkout & Slot Selection
          </h1>
          <p className="text-xs text-ink-soft">
            Selected Service Mode: <strong className="text-marigold font-bold">{orderType}</strong>
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded bg-chili-soft border border-chili/30 text-chili text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleRazorpayPayment} className="space-y-6">
          {/* Pickup Slot Selection */}
          <div className="card-surface p-6 space-y-3">
            <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
              <Clock className="w-4 h-4 text-marigold" /> Select 15-Minute Pickup Time Slot:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
              {timeSlots.map((slot) => {
                const count = slotCounts[slot] || 0;
                let statusText = "Fast Pick (Rush Less)";
                let statusColorClass = "text-sage border-sage/30 bg-sage-soft";

                if (count >= 5) {
                  statusText = `High Rush (${count} orders)`;
                  statusColorClass = "text-chili border-chili/30 bg-chili-soft";
                } else if (count > 0) {
                  statusText = `Moderate (${count})`;
                  statusColorClass = "text-marigold border-marigold/30 bg-marigold/10";
                }

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3.5 rounded border transition-all text-left flex flex-col justify-between gap-2.5 ${
                      selectedSlot === slot
                        ? "bg-marigold/10 border-marigold text-ink"
                        : "bg-paper border-ink/15 text-ink-soft hover:text-ink"
                    }`}
                  >
                    <span className="text-xs font-mono font-bold text-ink">{slot}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border w-fit ${statusColorClass}`}>
                      {statusText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smart Kitchen ETA Estimator */}
          <div className="card-surface p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-marigold/10 text-marigold flex items-center justify-center">
                <Clock className="w-5 h-5 text-marigold" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">Smart Kitchen ETA Estimator</p>
                <p className="text-[11px] text-ink-soft">
                  {(slotCounts[selectedSlot] || 0) >= 5
                    ? `High volume in this slot! Expect +15 mins preparation delay.`
                    : (slotCounts[selectedSlot] || 0) > 0
                      ? `Moderate volume. Standard preparation times apply.`
                      : `Canteen queue is clear! Chefs can pack your order instantly.`}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 font-bold">
              <span className="text-xs font-mono font-bold text-marigold block">
                +{(slotCounts[selectedSlot] || 0) >= 5 ? "15" : (slotCounts[selectedSlot] || 0) > 0 ? "5" : "0"} mins
              </span>
              <span className="text-[8px] text-ink-soft font-mono uppercase tracking-wider">Wait Buffer</span>
            </div>
          </div>

          {/* Customer Cooking Notes */}
          <div className="card-surface p-6 space-y-2">
            <label className="text-sm font-bold text-ink flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-marigold" /> Optional Special Cooking Instructions:
            </label>
            <textarea
              rows={2}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="e.g. Extra spicy, no onions, extra mayonnaise..."
              className="w-full bg-paper border border-ink/15 rounded p-3 text-xs text-ink placeholder-ink-soft/70 focus:outline-none focus:border-marigold"
            />
          </div>

          {/* Order Summary & Payment Button */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex justify-between items-center text-sm font-bold text-ink border-b border-dashed border-ink/15 pb-3">
              <span>Total Payable Amount</span>
              <span className="text-xl font-mono font-bold text-marigold">₹{calculatedTotal}</span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-marigold hover:bg-marigold-hover disabled:opacity-60 py-4 text-sm font-bold text-white rounded flex items-center justify-center gap-2 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              <span>{isProcessing ? "Connecting to Razorpay..." : `Proceed to Pay ₹${calculatedTotal} via Razorpay →`}</span>
            </button>
          </div>
        </form>
      </main>

      {isProcessing && (
        <PageLoader 
          message="Processing Secure Payment" 
          submessage="Connecting to Razorpay gateway... Please do not refresh or close this browser window." 
          type="payment" 
        />
      )}
    </div>
  );
}
