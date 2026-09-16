"use client";

import React from "react";
import { VendorNav } from "@/components/VendorNav";
import { VendorOrdersSkeleton } from "@/components/Skeletons";

export default function VendorLoading() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col pb-12">
      <VendorNav />
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <VendorOrdersSkeleton />
      </main>
    </div>
  );
}
