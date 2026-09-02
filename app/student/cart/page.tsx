"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { PageLoader } from "@/components/PageLoader";
import { useCart } from "@/context/CartContext";
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Store, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  Utensils,
  Package,
  Clock
} from "lucide-react";

export default function StudentCartPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState("Airport Road Campus");

  React.useEffect(() => {
    const saved = localStorage.getItem("campusbites_student_campus");
    if (saved) setSelectedCampus(saved);
  }, []);

  const {
    cartItems,
    orderType,
    setOrderType,
    removeFromCart,
    addToCart,
    updateQuantity,
    clearCart,
    totalCount,
    totalAmount,
    convenienceFee,
    totalTakeawayFee,
    grandTotal,
    platformFeePercent,
    itemsByStall
  } = useCart();

  const platformFee = convenienceFee;
  const takeawayFee = totalTakeawayFee;
  const stallGroupList = Object.values(itemsByStall);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-paper text-ink flex flex-col justify-center items-center p-4">
        <div className="card-surface p-8 text-center space-y-4 max-w-md">
          <ShoppingBag className="w-12 h-12 text-marigold mx-auto" />
          <h2 className="font-display text-xl font-bold text-ink">Your Cart is Empty</h2>
          <p className="text-xs text-ink-soft">Add food items from any canteen stall to build your custom food cart.</p>
          <Link href="/student/dashboard" className="bg-marigold hover:bg-marigold-hover px-5 py-2.5 rounded text-xs font-bold text-white inline-block transition-colors">
            Browse Campus Stalls
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col pb-16">
      <Navbar 
        cartCount={totalCount} 
        selectedCampus={selectedCampus}
        onCampusChange={(newCampus) => {
          setSelectedCampus(newCampus);
          localStorage.setItem("campusbites_student_campus", newCampus);
        }}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/student/dashboard" className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <button onClick={clearCart} className="text-xs text-chili hover:opacity-80 font-semibold flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Clear Cart
          </button>
        </div>

        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-marigold" /> Jayanti Food Cart
          </h1>
          <p className="text-xs text-ink-soft">
            Items from {stallGroupList.length} different canteen stall(s) combined into one checkout.
          </p>
        </div>

        {/* DINE-IN VS TAKEAWAY SELECTOR */}
        <div className="card-surface p-5 space-y-3">
          <h2 className="text-xs font-bold text-ink-soft uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-marigold" /> Choose Meal Service Type:
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setOrderType("DINE_IN")}
              className={`p-4 rounded border text-left flex items-center justify-between transition-all ${
                orderType === "DINE_IN"
                  ? "bg-marigold/10 border-marigold text-ink"
                  : "bg-paper border-ink/15 text-ink-soft hover:text-ink"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-marigold/10 text-marigold flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">Dine-In (Canteen Table)</p>
                  <p className="text-[10px] text-ink-soft">Served on tray • ₹0 Packaging Fee</p>
                </div>
              </div>
              {orderType === "DINE_IN" && <span className="text-xs font-bold text-marigold">✓ Selected</span>}
            </button>

            <button
              onClick={() => setOrderType("TAKEAWAY")}
              className={`p-4 rounded border text-left flex items-center justify-between transition-all ${
                orderType === "TAKEAWAY"
                  ? "bg-marigold/10 border-marigold text-ink"
                  : "bg-paper border-ink/15 text-ink-soft hover:text-ink"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-cardstock text-ink-soft flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">Takeaway / Parcel</p>
                  <p className="text-[10px] text-ink-soft">Packed containers • +₹{totalTakeawayFee} Packaging Fee</p>
                </div>
              </div>
              {orderType === "TAKEAWAY" && <span className="text-xs font-bold text-marigold">✓ Selected</span>}
            </button>
          </div>
        </div>

        {/* Grouped Stall Items */}
        <div className="space-y-6">
          {stallGroupList.map((group) => {
            const isArc = group.campus === "Airport Road Campus";
            return (
              <div
                key={group.stallId}
                className={`card-surface p-5 space-y-4 border-2 transition-all ${
                  isArc
                    ? "border-marigold/40"
                    : "border-ink/30"
                }`}
              >
                <div className="flex items-center justify-between border-b border-dashed border-ink/15 pb-3">
                  <div className="flex items-center gap-2">
                    <Store className={`w-4 h-4 ${isArc ? "text-marigold" : "text-ink-soft"}`} />
                    <div>
                      <h3 className="font-display text-sm font-bold text-ink">{group.stallName}</h3>
                      <p className={`text-[10px] font-bold ${isArc ? "text-marigold" : "text-ink-soft"}`}>
                        {group.campus}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-ink-soft">
                    {group.items.length} item(s)
                  </span>
                </div>

              <div className="space-y-3">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 bg-paper p-3 rounded border border-ink/15">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-ink">{item.name}</h4>
                      <p className="text-[11px] text-marigold font-semibold flex items-center gap-1.5">
                        {item.originalPrice && (
                          <span className="text-[10px] text-ink-soft line-through font-mono">₹{item.originalPrice.toFixed(2)}</span>
                        )}
                        <span className="font-mono">₹{item.price.toFixed(2)} each</span>
                      </p>
                      {orderType === "TAKEAWAY" && (
                        <p className="text-[10px] text-ink-soft">Parcel Container: +₹{item.takeawayCharge || 10}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-cardstock border border-ink/15 rounded p-1 text-xs font-bold">
                        <button onClick={() => removeFromCart(item.id)} className="p-1 text-ink-soft hover:text-ink">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 font-mono text-ink">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="p-1 text-ink-soft hover:text-ink">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-bold font-mono text-ink min-w-[50px] text-right">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        </div>

        {/* Bill Summary */}
        <div className="card-surface p-6 space-y-4">
          <h3 className="font-display text-sm font-bold text-ink border-b border-dashed border-ink/15 pb-3">Bill Breakdown</h3>

          <div className="space-y-2 text-xs text-ink">
            <div className="flex justify-between leader-row pb-2">
              <span className="text-ink-soft">Items Food Total</span>
              <span className="font-semibold font-mono text-ink">₹{totalAmount}</span>
            </div>

            {orderType === "TAKEAWAY" && (
              <div className="flex justify-between leader-row pb-2 text-ink-soft">
                <span>Takeaway Packaging Containers Fee</span>
                <span className="font-bold font-mono text-ink">₹{totalTakeawayFee}</span>
              </div>
            )}

            <div className="flex justify-between leader-row pb-2">
              <span className="text-ink-soft">Platform Express Fee</span>
              <span className="font-semibold font-mono text-ink">₹{platformFee}</span>
            </div>

            <div className="flex justify-between text-sm font-bold text-ink pt-1">
              <span>Grand Total</span>
              <span className="font-mono text-marigold">₹{grandTotal}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setIsRedirecting(true);
              router.push("/student/checkout");
            }}
            className="w-full bg-marigold hover:bg-marigold-hover py-3.5 text-xs font-bold text-white rounded flex items-center justify-center gap-2 transition-colors"
          >
            <span>Proceed to Checkout & Razorpay Payment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {isRedirecting && (
        <PageLoader 
          message="Loading Checkout Console" 
          submessage="Retrieving active canteen queue counts and calculating dynamic prep time estimates..." 
          type="order" 
        />
      )}
    </div>
  );
}
