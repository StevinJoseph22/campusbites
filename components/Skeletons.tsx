"use client";

import React from "react";
import { UtensilsCrossed, Sparkles, ChefHat, Store, Package, BarChart3 } from "lucide-react";

export function FoodSpinner({
  label = "Loading CampusBites...",
  sublabel = "Preparing fresh menu and orders for you",
  icon = "utensils"
}: {
  label?: string;
  sublabel?: string;
  icon?: "utensils" | "chef" | "store" | "package" | "chart";
}) {
  const renderIcon = () => {
    switch (icon) {
      case "chef":
        return <ChefHat className="w-7 h-7 text-marigold animate-bounce" />;
      case "store":
        return <Store className="w-7 h-7 text-marigold animate-pulse" />;
      case "package":
        return <Package className="w-7 h-7 text-marigold animate-bounce" />;
      case "chart":
        return <BarChart3 className="w-7 h-7 text-marigold animate-pulse" />;
      default:
        return <UtensilsCrossed className="w-7 h-7 text-marigold animate-spin" style={{ animationDuration: "3s" }} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute inset-0 rounded-full border-3 border-ink/10" />
        <div className="absolute inset-0 rounded-full border-3 border-t-marigold border-ink/10 animate-spin" />
        <div className="z-10 bg-cardstock border border-ink/15 rounded-full p-3 shadow-inner">
          {renderIcon()}
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="font-display text-sm font-bold text-ink">{label}</h4>
        <p className="text-xs text-ink-soft max-w-xs">{sublabel}</p>
      </div>
    </div>
  );
}

export function VendorMenuSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Search and Action Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-72 h-10 bg-cardstock border border-ink/10 rounded-xl" />
        <div className="flex items-center gap-2">
          <div className="w-28 h-9 bg-cardstock border border-ink/10 rounded-lg" />
          <div className="w-24 h-9 bg-cardstock border border-ink/10 rounded-lg" />
          <div className="w-28 h-9 bg-marigold/20 border border-marigold/30 rounded-lg" />
        </div>
      </div>

      {/* Dish Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card-surface p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-14 h-5 bg-cardstock-hover rounded-md" />
                <div className="w-16 h-5 bg-cardstock-hover rounded-md" />
              </div>
              <div className="w-3/4 h-5 bg-cardstock-hover rounded-md" />
              <div className="space-y-1.5">
                <div className="w-full h-3 bg-cardstock-hover rounded" />
                <div className="w-2/3 h-3 bg-cardstock-hover rounded" />
              </div>
            </div>

            <div className="pt-3 border-t border-ink/10 space-y-2.5">
              <div className="flex justify-between items-center">
                <div className="w-20 h-3 bg-cardstock-hover rounded" />
                <div className="w-16 h-3 bg-cardstock-hover rounded" />
              </div>
              <div className="flex justify-between items-center">
                <div className="w-24 h-4 bg-cardstock-hover rounded" />
                <div className="w-20 h-6 bg-cardstock-hover rounded-md" />
              </div>
              <div className="flex gap-2 pt-1">
                <div className="flex-1 h-8 bg-cardstock-hover rounded-lg" />
                <div className="w-9 h-8 bg-cardstock-hover rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VendorOrdersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top action row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="w-48 h-7 bg-cardstock-hover rounded-lg" />
          <div className="w-64 h-3.5 bg-cardstock rounded" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-28 h-8 bg-cardstock border border-ink/10 rounded-lg" />
          <div className="w-36 h-8 bg-cardstock border border-ink/10 rounded-lg" />
          <div className="w-36 h-8 bg-cardstock border border-ink/10 rounded-lg" />
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-cardstock p-1 rounded-xl border border-ink/10">
          <div className="w-28 h-8 bg-cardstock-hover rounded-lg" />
          <div className="w-28 h-8 bg-cardstock-hover rounded-lg" />
        </div>
        <div className="w-full sm:w-64 h-9 bg-cardstock border border-ink/10 rounded-xl" />
      </div>

      {/* Order Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card-surface p-4 space-y-4 border border-ink/10">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="w-28 h-6 bg-marigold/20 rounded-md" />
                <div className="w-36 h-3 bg-cardstock-hover rounded" />
              </div>
              <div className="w-20 h-6 bg-cardstock-hover rounded-full" />
            </div>

            <div className="space-y-2 py-2 border-y border-ink/10">
              <div className="flex justify-between">
                <div className="w-32 h-4 bg-cardstock-hover rounded" />
                <div className="w-8 h-4 bg-cardstock-hover rounded" />
              </div>
              <div className="flex justify-between">
                <div className="w-24 h-4 bg-cardstock-hover rounded" />
                <div className="w-8 h-4 bg-cardstock-hover rounded" />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 h-9 bg-cardstock-hover rounded-lg" />
              <div className="w-10 h-9 bg-cardstock-hover rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VendorDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="card-surface p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-cardstock/60">
        <div className="space-y-2">
          <div className="w-56 h-7 bg-cardstock-hover rounded-lg" />
          <div className="w-72 h-4 bg-cardstock rounded" />
        </div>
        <div className="flex gap-2">
          <div className="w-32 h-10 bg-marigold/20 rounded-xl" />
          <div className="w-28 h-10 bg-cardstock-hover rounded-xl" />
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-20 h-3 bg-cardstock-hover rounded" />
              <div className="w-8 h-8 bg-cardstock-hover rounded-lg" />
            </div>
            <div className="w-16 h-7 bg-cardstock-hover rounded-md" />
            <div className="w-24 h-2.5 bg-cardstock rounded" />
          </div>
        ))}
      </div>

      {/* Live Orders Skeleton */}
      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-ink/10 pb-3">
          <div className="w-36 h-5 bg-cardstock-hover rounded" />
          <div className="w-20 h-4 bg-cardstock rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-cardstock-hover/40 flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="w-28 h-4 bg-cardstock-hover rounded" />
                <div className="w-40 h-3 bg-cardstock rounded" />
              </div>
              <div className="w-20 h-7 bg-cardstock-hover rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VendorSalesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="w-48 h-7 bg-cardstock-hover rounded-lg" />
          <div className="w-64 h-3 bg-cardstock rounded" />
        </div>
        <div className="w-56 h-9 bg-cardstock border border-ink/10 rounded-xl" />
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 card-surface p-5 flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-32 h-3 bg-cardstock-hover rounded" />
            <div className="w-28 h-8 bg-cardstock-hover rounded-md" />
          </div>
          <div className="w-20 h-8 bg-sage/20 rounded-lg" />
        </div>
        <div className="card-surface p-5 flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-28 h-3 bg-cardstock-hover rounded" />
            <div className="w-20 h-8 bg-marigold/20 rounded-md" />
          </div>
          <div className="w-10 h-10 bg-cardstock-hover rounded-lg" />
        </div>
      </div>

      {/* Chart Skeleton */}
      <div className="card-surface p-5 space-y-4">
        <div className="w-40 h-5 bg-cardstock-hover rounded" />
        <div className="w-full h-52 flex items-end gap-3 px-4 pt-6 border-b border-l border-ink/10">
          {[40, 70, 50, 90, 60, 85, 95].map((h, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
              <div style={{ height: `${h}%` }} className="w-full bg-marigold/30 rounded-t-md" />
              <div className="w-8 h-2 bg-cardstock-hover rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StudentDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      {/* Header Greeting & Campus */}
      <div className="card-surface p-6 bg-gradient-to-r from-cardstock via-cardstock-hover/40 to-cardstock flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="w-44 h-7 bg-cardstock-hover rounded-lg" />
          <div className="w-60 h-4 bg-cardstock rounded" />
        </div>
        <div className="w-44 h-9 bg-cardstock border border-ink/10 rounded-xl" />
      </div>

      {/* Search and Category Pills */}
      <div className="space-y-3">
        <div className="w-full h-12 bg-cardstock border border-ink/10 rounded-2xl" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-24 h-8 shrink-0 bg-cardstock border border-ink/10 rounded-full" />
          ))}
        </div>
      </div>

      {/* Stalls / Food Grid */}
      <div className="space-y-3">
        <div className="w-40 h-5 bg-cardstock-hover rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card-surface overflow-hidden space-y-3 border border-ink/10">
              <div className="w-full h-40 bg-cardstock-hover" />
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-32 h-5 bg-cardstock-hover rounded" />
                  <div className="w-14 h-5 bg-sage/20 rounded-md" />
                </div>
                <div className="w-full h-3 bg-cardstock rounded" />
                <div className="flex items-center justify-between pt-2 border-t border-ink/10">
                  <div className="w-20 h-4 bg-cardstock-hover rounded" />
                  <div className="w-24 h-8 bg-marigold/20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StudentMenuSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-5xl mx-auto w-full p-4 sm:p-6 pb-24">
      {/* Stall Hero Banner Skeleton */}
      <div className="card-surface p-6 flex flex-col sm:flex-row items-center gap-5 border border-ink/10">
        <div className="w-24 h-24 rounded-2xl bg-cardstock-hover shrink-0" />
        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="w-48 h-6 bg-cardstock-hover rounded mx-auto sm:mx-0" />
          <div className="w-64 h-4 bg-cardstock rounded mx-auto sm:mx-0" />
          <div className="flex gap-2 justify-center sm:justify-start pt-1">
            <div className="w-20 h-5 bg-cardstock-hover rounded-full" />
            <div className="w-24 h-5 bg-cardstock-hover rounded-full" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-64 h-10 bg-cardstock border border-ink/10 rounded-xl" />
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="w-20 h-8 bg-cardstock-hover rounded-full" />
          <div className="w-20 h-8 bg-cardstock-hover rounded-full" />
          <div className="w-24 h-8 bg-cardstock-hover rounded-full" />
        </div>
      </div>

      {/* Dish List Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card-surface p-4 flex gap-4 border border-ink/10">
            <div className="w-24 h-24 rounded-xl bg-cardstock-hover shrink-0" />
            <div className="flex-1 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="w-12 h-4 bg-sage/20 rounded" />
                  <div className="w-14 h-4 bg-marigold/20 rounded" />
                </div>
                <div className="w-32 h-4 bg-cardstock-hover rounded" />
                <div className="w-full h-3 bg-cardstock rounded" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="w-16 h-5 bg-cardstock-hover rounded" />
                <div className="w-20 h-7 bg-marigold/20 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
