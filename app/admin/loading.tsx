"use client";

import React from "react";
import { Building2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col pb-12">
      {/* Top Bar Skeleton */}
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-ink/10 h-16 flex items-center px-4 sm:px-8 max-w-7xl mx-auto w-full justify-between animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-marigold/20" />
          <div className="w-36 h-6 bg-cardstock rounded-lg" />
        </div>
        <div className="w-24 h-8 bg-cardstock rounded-lg" />
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        {/* Banner */}
        <div className="card-surface p-6 flex justify-between items-center bg-cardstock/50">
          <div className="space-y-2">
            <div className="w-56 h-7 bg-cardstock-hover rounded-lg" />
            <div className="w-80 h-4 bg-cardstock rounded" />
          </div>
          <div className="w-36 h-10 bg-marigold/20 rounded-xl" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-surface p-5 space-y-2">
              <div className="w-24 h-3 bg-cardstock-hover rounded" />
              <div className="w-16 h-8 bg-cardstock-hover rounded-md" />
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="card-surface p-5 space-y-4">
          <div className="w-44 h-5 bg-cardstock-hover rounded" />
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-cardstock-hover/40 rounded-xl flex items-center px-4 justify-between">
                <div className="w-48 h-4 bg-cardstock-hover rounded" />
                <div className="w-20 h-6 bg-cardstock-hover rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
