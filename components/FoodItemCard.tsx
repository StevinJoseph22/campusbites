"use client";

import React from "react";
import { Plus, Minus, Star } from "lucide-react";

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
    <div className="card-surface rounded p-4 flex flex-col justify-between h-full group">
      <div className="space-y-2">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Veg / Non-Veg indicator icon */}
            <span className={`w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center p-0.5 ${
              item.isVeg ? "border-sage" : "border-chili"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-sage" : "bg-chili"}`} />
            </span>

            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft truncate">
              {item.stallName}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-ink shrink-0">
            <Star className="w-3 h-3 fill-marigold text-marigold" />
            <span>{item.rating}</span>
          </div>
        </div>

        {/* Item Title */}
        <h4 className="font-display text-sm font-semibold text-ink line-clamp-1">
          {item.name}
        </h4>

        {/* Price & Tag */}
        <div className="flex items-center gap-2 font-mono">
          <span className="text-sm font-bold text-ink">₹{item.price}</span>
          {item.tag && (
            <span className="text-[10px] font-sans font-bold text-sage bg-sage-soft px-2 py-0.5 rounded">
              {item.tag}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-[11px] text-ink-soft line-clamp-2 leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Footer Add Button (Aligned at bottom) */}
      <div className="pt-3 mt-3 border-t border-dashed border-ink/15 flex items-center justify-end gap-2">
        {cartQuantity === 0 ? (
          <button
            onClick={() => onAddToCart(item)}
            className="px-4 py-1.5 rounded bg-paper hover:bg-marigold hover:text-white border border-ink/15 hover:border-marigold text-ink font-bold text-xs transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> ADD
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-marigold text-white rounded px-2 py-1">
            <button
              onClick={() => onUpdateQuantity(item.id, -1)}
              className="p-0.5 hover:opacity-80"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-xs min-w-[14px] text-center">{cartQuantity}</span>
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
