"use client";

import React from "react";
import { StudentDashboardSkeleton } from "@/components/Skeletons";

export default function StudentLoading() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col pb-24 sm:pb-12">
      {/* Top Navbar Skeleton Placeholder */}
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-ink/10 h-16 flex items-center px-4 max-w-7xl mx-auto w-full justify-between animate-pulse">
        <div className="w-32 h-7 bg-cardstock rounded-lg" />
        <div className="flex gap-2">
          <div className="w-24 h-8 bg-cardstock rounded-lg" />
          <div className="w-10 h-8 bg-cardstock rounded-lg" />
        </div>
      </header>

      <main className="flex-1 w-full">
        <StudentDashboardSkeleton />
      </main>
    </div>
  );
}
