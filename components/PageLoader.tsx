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
        return <ShieldCheck className="w-8 h-8 text-orange-400 animate-pulse" />;
      case "canteen":
        return <Utensils className="w-8 h-8 text-orange-400 animate-bounce" />;
      case "order":
        return <ShoppingBag className="w-8 h-8 text-orange-400 animate-pulse" />;
      case "payment":
        return <CreditCard className="w-8 h-8 text-orange-400 animate-pulse" />;
      default:
        return <Sparkles className="w-8 h-8 text-orange-400 animate-spin duration-1000" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Outer spinning glowing border */}
      <div className="relative flex items-center justify-center w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-slate-900"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 border-r-purple-500 animate-spin"></div>
        
        {/* Core Icon */}
        <div className="z-10 bg-slate-950/80 border border-slate-800 rounded-full p-4 shadow-xl">
          {getIcon()}
        </div>
      </div>

      {/* Message Info */}
      <div className="mt-8 text-center space-y-2 max-w-sm px-4">
        <h3 className="text-base font-black text-white tracking-wide">
          {message}{dots}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          {submessage}
        </p>
      </div>

      {/* Decorative Brand footer */}
      <div className="absolute bottom-8 flex items-center gap-1.5 opacity-40">
        <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
          Powered by Kristu Jayanti University
        </span>
      </div>
    </div>
  );
}
