"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Store, ShoppingBag, Clock, User, QrCode } from "lucide-react";
import { PageLoader } from "@/components/PageLoader";

interface BottomNavProps {
  cartCount?: number;
  cartTotal?: number;
  onOpenCart?: () => void;
}

export function BottomNav({ cartCount = 0, cartTotal = 0, onOpenCart }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigate = (href: string, message: string, type: "auth" | "canteen" | "order" | "payment" | "general") => {
    setIsNavigating(true);
    router.push(href);
  };

  return (
    <>
      {/* Floating Bottom Cart Bar (Visible if cart has items) */}
      {cartCount > 0 && (
        <div className="fixed bottom-16 sm:bottom-6 left-4 right-4 max-w-md mx-auto z-40">
          <button
            onClick={() => handleNavigate("/student/cart", "Opening your Food Cart", "order")}
            className="w-full bg-marigold hover:bg-marigold-hover transition-colors p-3.5 rounded flex items-center justify-between text-white text-left"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded bg-white/20 text-white font-mono font-bold flex items-center justify-center text-xs">
                {cartCount}
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-white">View Food Cart</p>
                <p className="text-[10px] text-white/80 font-medium">Items saved in persistent cart</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-white">₹{cartTotal}</span>
              <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded">Checkout →</span>
            </div>
          </button>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-ink/15 px-4 py-2 z-30">
        <div className="flex items-center justify-around">
          <button
            onClick={() => handleNavigate("/student/dashboard", "Loading Campus Canteens", "canteen")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              pathname === "/student/dashboard" ? "text-marigold" : "text-ink-soft"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Stalls</span>
          </button>

          <button
            onClick={() => handleNavigate("/student/cart", "Opening your Food Cart", "order")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold relative ${
              pathname === "/student/cart" ? "text-marigold" : "text-ink-soft"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-marigold text-white text-[9px] font-mono font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleNavigate("/login", "Accessing Account Settings", "auth")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              pathname === "/login" ? "text-marigold" : "text-ink-soft"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account</span>
          </button>
        </div>
      </div>

      {isNavigating && (
        <PageLoader 
          message="Loading Portal Pages" 
          submessage="Synchronizing student records and fetching live canteen menu data..." 
          type="general" 
        />
      )}
    </>
  );
}
