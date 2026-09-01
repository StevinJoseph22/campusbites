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
    totalTakeawayFee, 
    itemsByStall 
  } = useCart();

  const platformFee = cartItems.length > 0 ? 5 : 0;
  const takeawayFee = orderType === "TAKEAWAY" ? totalTakeawayFee : 0;
  const grandTotal = totalAmount + takeawayFee + platformFee;
  const stallGroupList = Object.values(itemsByStall);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="glass-panel p-8 rounded-3xl text-center space-y-4 max-w-md border-slate-800">
          <ShoppingBag className="w-12 h-12 text-orange-400 mx-auto" />
          <h2 className="text-xl font-extrabold text-white">Your Cart is Empty</h2>
          <p className="text-xs text-slate-400">Add food items from any canteen stall to build your custom food cart.</p>
          <Link href="/student/dashboard" className="btn-primary-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-white inline-block shadow-lg shadow-orange-500/20">
            Browse Campus Stalls
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col pb-16">
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
          <Link href="/student/dashboard" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Clear Cart
          </button>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-orange-500" /> Jayanti Food Cart
          </h1>
          <p className="text-xs text-slate-400">
            Items from {stallGroupList.length} different canteen stall(s) combined into one checkout.
          </p>
        </div>

        {/* DINE-IN VS TAKEAWAY SELECTOR */}
        <div className="glass-panel p-5 rounded-3xl border-slate-800 space-y-3">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Choose Meal Service Type:
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setOrderType("DINE_IN")}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                orderType === "DINE_IN"
                  ? "bg-orange-500/20 border-orange-500 text-white ring-1 ring-orange-500 shadow-md"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Dine-In (Canteen Table)</p>
                  <p className="text-[10px] text-slate-400">Served on tray • ₹0 Packaging Fee</p>
                </div>
              </div>
              {orderType === "DINE_IN" && <span className="text-xs font-bold text-orange-400">✓ Selected</span>}
            </button>

            <button
              onClick={() => setOrderType("TAKEAWAY")}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                orderType === "TAKEAWAY"
                  ? "bg-orange-500/20 border-orange-500 text-white ring-1 ring-orange-500 shadow-md"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Takeaway / Parcel</p>
                  <p className="text-[10px] text-slate-400">Packed containers • +₹{totalTakeawayFee} Packaging Fee</p>
                </div>
              </div>
              {orderType === "TAKEAWAY" && <span className="text-xs font-bold text-orange-400">✓ Selected</span>}
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
                className={`glass-panel p-5 rounded-3xl space-y-4 shadow-xl border-2 transition-all ${
                  isArc 
                    ? "border-blue-500/30 bg-blue-950/10 shadow-blue-950/20" 
                    : "border-orange-500/30 bg-orange-950/10 shadow-orange-950/20"
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Store className={`w-4 h-4 ${isArc ? "text-blue-400" : "text-orange-400"}`} />
                    <div>
                      <h3 className="text-sm font-extrabold text-white">{group.stallName}</h3>
                      <p className={`text-[10px] font-bold ${isArc ? "text-blue-400" : "text-orange-400"}`}>
                        🏢 {group.campus}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {group.items.length} item(s)
                  </span>
                </div>

              <div className="space-y-3">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      <p className="text-[11px] text-orange-400 font-semibold flex items-center gap-1.5">
                        {item.originalPrice && (
                          <span className="text-[10px] text-slate-500 line-through font-mono">₹{item.originalPrice.toFixed(2)}</span>
                        )}
                        <span className="font-mono">₹{item.price.toFixed(2)} each</span>
                      </p>
                      {orderType === "TAKEAWAY" && (
                        <p className="text-[10px] text-slate-400">Parcel Container: +₹{item.takeawayCharge || 10}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold">
                        <button onClick={() => removeFromCart(item.id)} className="p-1 text-slate-400 hover:text-white">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 font-mono text-white">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="p-1 text-slate-400 hover:text-white">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-extrabold text-white min-w-[50px] text-right">
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
        <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Bill Breakdown</h3>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Items Food Total</span>
              <span className="font-semibold text-white">₹{totalAmount}</span>
            </div>

            {orderType === "TAKEAWAY" && (
              <div className="flex justify-between text-purple-300">
                <span>Takeaway Packaging Containers Fee</span>
                <span className="font-bold">₹{totalTakeawayFee}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-slate-400">Platform Express Fee</span>
              <span className="font-semibold text-white">₹{platformFee}</span>
            </div>

            <div className="flex justify-between text-sm font-extrabold text-white pt-3 border-t border-slate-800">
              <span>Grand Total</span>
              <span className="text-orange-400">₹{grandTotal}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setIsRedirecting(true);
              router.push("/student/checkout");
            }}
            className="w-full btn-primary-gradient py-3.5 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-transform active:scale-98"
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
