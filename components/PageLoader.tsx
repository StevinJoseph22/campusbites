"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Utensils, CreditCard, ShoppingBag, ShieldCheck } from "lucide-react";

interface PageLoaderProps {
  message?: string;
  submessage?: string;
  type?: "auth" | "canteen" | "order" | "payment" | "general";
}

export function PageLoader({ 
  message = "Loading...", 
  submessage = "Please wait a moment while we process your request.",
  type = "general" 
}: PageLoaderProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const getIcon = () => {
    switch (type) {
      case "auth":
        return <ShieldCheck className="w-8 h-8 text-marigold animate-pulse" />;
      case "canteen":
        return <Utensils className="w-8 h-8 text-marigold animate-bounce" />;
      case "order":
        return <ShoppingBag className="w-8 h-8 text-marigold animate-pulse" />;
      case "payment":
        return <CreditCard className="w-8 h-8 text-marigold animate-pulse" />;
      default:
        return <Sparkles className="w-8 h-8 text-marigold animate-spin duration-1000" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-paper/95 backdrop-blur-sm">
      {/* Spinning ring */}
      <div className="relative flex items-center justify-center w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-ink/10"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-marigold border-ink/10 animate-spin"></div>

        {/* Core Icon */}
        <div className="z-10 bg-surface border border-ink/15 rounded-full p-4">
          {getIcon()}
        </div>
      </div>

      {/* Message Info */}
      <div className="mt-8 text-center space-y-2 max-w-sm px-4">
        <h3 className="font-display text-base font-semibold text-ink tracking-wide">
          {message}{dots}
        </h3>
        <p className="text-xs text-ink-soft leading-relaxed">
          {submessage}
        </p>
      </div>

      {/* Decorative Brand footer */}
      <div className="absolute bottom-8 flex items-center gap-1.5 opacity-60">
        <span className="text-[10px] font-mono font-semibold tracking-wider text-ink-soft uppercase">
          Powered by Kristu Jayanti University
        </span>
      </div>
    </div>
  );
}
