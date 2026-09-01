"use client";

import React from "react";
import { Clock, Star, Flame, ChevronRight, Zap } from "lucide-react";

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
    <div className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col justify-between h-full group cursor-pointer border-slate-800/80">
      {/* Stall Banner Header */}
      <div className={`p-4 bg-gradient-to-br ${stall.bgGradient || 'from-slate-900 to-slate-950'} border-b border-slate-800/60 relative flex-1 flex flex-col justify-between`}>
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
              {stall.category}
            </span>

            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md text-amber-400 text-xs font-semibold shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{stall.rating}</span>
              {stall.reviewsCount && <span className="text-[10px] text-slate-500">({stall.reviewsCount})</span>}
            </div>
          </div>

          <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
            {stall.name}
          </h3>

          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
            Popular student pre-orders • Freshly prepared
          </p>
        </div>

        {stall.tag && (
          <div className="mt-3 inline-self-start">
            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
              <Zap className="w-3 h-3" /> {stall.tag}
            </span>
          </div>
        )}
      </div>

      {/* Card Content Footer */}
      <div className="p-4 bg-slate-950/60">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">{stall.prepTime}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>{stall.itemCount} Items</span>
          </div>
        </div>

        <button className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 group-hover:bg-orange-500 group-hover:text-white border border-slate-800 group-hover:border-orange-500 transition-all flex items-center justify-center gap-1.5 shadow-sm">
          <span>Explore Stall Menu</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
