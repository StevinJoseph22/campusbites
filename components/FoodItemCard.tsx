"use client";

import React from "react";
import { Plus, Minus, Star, Clock, Flame } from "lucide-react";

export interface FoodItemProps {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  stallName: string;
  isVeg: boolean;
  rating: number;
  prepTime: string;
  tag?: string;
}

interface FoodItemCardProps {
  item: FoodItemProps;
  cartQuantity: number;
  onAddToCart: (item: FoodItemProps) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}

export function FoodItemCard({ 
  item, 
  cartQuantity, 
  onAddToCart, 
  onUpdateQuantity 
}: FoodItemCardProps) {
  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-4 border-slate-800/80 flex flex-col justify-between h-full group">
      <div className="space-y-2">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Veg / Non-Veg indicator icon */}
            <span className={`w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center p-0.5 ${
              item.isVeg ? "border-emerald-500 text-emerald-500" : "border-red-500 text-red-500"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-emerald-500" : "bg-red-500"}`} />
            </span>

            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
              {item.stallName}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20 shrink-0">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{item.rating}</span>
          </div>
        </div>

        {/* Item Title */}
        <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
          {item.name}
        </h4>

        {/* Price & Tag */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-orange-400">₹{item.price}</span>
          {item.tag && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {item.tag}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Footer Prep Time & Add Button (Aligned at bottom) */}
      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" /> {item.prepTime}
        </span>

        {/* Swiggy/Zomato style ADD Button */}
        {cartQuantity === 0 ? (
          <button
            onClick={() => onAddToCart(item)}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-orange-500 hover:text-white border border-slate-800 hover:border-orange-500 text-orange-400 font-bold text-xs transition-all flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> ADD
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-orange-500 text-white rounded-xl px-2 py-1 shadow-md shadow-orange-500/30">
            <button 
              onClick={() => onUpdateQuantity(item.id, -1)}
              className="p-0.5 hover:opacity-80"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-extrabold text-xs min-w-[14px] text-center">{cartQuantity}</span>
            <button 
              onClick={() => onUpdateQuantity(item.id, 1)}
              className="p-0.5 hover:opacity-80"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
