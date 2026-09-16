"use client";

import React from "react";
import { UtensilsCrossed } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-paper/95 backdrop-blur-sm transition-all duration-300">
      {/* Animated Food Center */}
      <div className="relative flex items-center justify-center w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-ink/10" />
        <div className="absolute inset-0 rounded-full border-4 border-t-marigold border-ink/10 animate-spin" />
        <div className="z-10 bg-cardstock border border-ink/15 rounded-full p-4 shadow-lg shadow-marigold/10">
          <UtensilsCrossed className="w-8 h-8 text-marigold animate-pulse" />
        </div>
      </div>

      {/* Brand & Loading text */}
      <div className="text-center space-y-2 max-w-xs px-4">
        <h3 className="font-display text-lg font-bold text-ink tracking-wide">
          CampusBites
        </h3>
        <div className="flex items-center justify-center gap-1.5 text-xs text-ink-soft">
          <span className="inline-block w-2 h-2 rounded-full bg-marigold animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="inline-block w-2 h-2 rounded-full bg-marigold animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="inline-block w-2 h-2 rounded-full bg-marigold animate-bounce" style={{ animationDelay: "300ms" }} />
          <span className="ml-1 font-semibold text-ink-soft">Loading fresh delights...</span>
        </div>
      </div>
    </div>
  );
}
