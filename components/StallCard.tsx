"use client";

import React from "react";
import { Clock, Star, ChevronRight, Zap } from "lucide-react";

export interface StallProps {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewsCount?: number;
  prepTime: string;
  isOpen?: boolean;
  itemCount: number;
  isVeg?: boolean;
  tag?: string;
  bgGradient?: string;
}

export function StallCard({ stall }: { stall: StallProps }) {
  return (
    <div className="card-surface hover:bg-cardstock-hover transition-colors rounded overflow-hidden flex flex-col justify-between h-full group cursor-pointer">
      {/* Stall Header */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft bg-paper border border-ink/15 px-2.5 py-0.5 rounded">
              {stall.category}
            </span>

            <div className="flex items-center gap-1 text-ink text-xs font-mono font-semibold shrink-0">
              <Star className="w-3 h-3 fill-marigold text-marigold" />
              <span>{stall.rating}</span>
              {stall.reviewsCount && <span className="text-[10px] text-ink-soft">({stall.reviewsCount})</span>}
            </div>
          </div>

          <h3 className="font-display text-lg font-semibold text-ink line-clamp-1">
            {stall.name}
          </h3>

          <p className="text-[11px] text-ink-soft mt-1 line-clamp-1">
            Popular student pre-orders · Freshly prepared
          </p>
        </div>

        {stall.tag && (
          <div className="mt-3">
            <span className="bg-sage-soft text-sage text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit">
              <Zap className="w-3 h-3" /> {stall.tag}
            </span>
          </div>
        )}
      </div>

      {/* Card Content Footer */}
      <div className="p-4 border-t border-dashed border-ink/15">
        <div className="flex items-center justify-between text-xs text-ink-soft mb-3 font-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-semibold">{stall.prepTime}</span>
          </div>

          <span className="text-[11px]">{stall.itemCount} Items</span>
        </div>

        <button className="w-full py-2.5 px-3 rounded text-xs font-bold text-ink bg-paper group-hover:bg-marigold group-hover:text-white border border-ink/15 group-hover:border-marigold transition-all flex items-center justify-center gap-1.5">
          <span>Explore Stall Menu</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
