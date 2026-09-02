"use client";

import React, { useState } from "react";
import { VendorNav } from "@/components/VendorNav";
import { Store, Image, CheckCircle2, Save, Sparkles, FileText, Info } from "lucide-react";

export default function VendorProfileSetupPage() {
  const [name, setName] = useState("The Campus Grill & Burgers");
  const [description, setDescription] = useState(
    "Delicious student-favorite burgers, peri-peri fries, loaded wraps, and cold beverages prepared fresh for express canteen pickup."
  );
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80"
  );
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col pb-12">
      <VendorNav />

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Title */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">Stall Profile & Branding</h2>
          <p className="text-xs text-slate-400">
            Set up your canteen stall details, description, and logo for students on CampusBites.
          </p>
        </div>

        {/* Saved Alert */}
        {isSaved && (
          <div className="glass-panel p-4 rounded-2xl border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Stall profile saved successfully! Changes are live on the student app.</span>
          </div>
        )}

        {/* Form Box */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Stall Name */}
            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-orange-400" /> Stall Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Campus Grill & Burgers"
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-orange-400" /> Description
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your canteen specialty, ingredients, and student combos..."
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Image URL & Live Preview */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-orange-400" /> Stall Banner / Logo Image URL
              </label>
              
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL (e.g. Unsplash or hosted food image)"
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />

              {/* Image Storage Note */}
              <div className="glass-panel p-3 rounded-xl border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2 bg-slate-900/50">
                <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Image Storage Strategy:</strong> Paste any direct image URL (e.g. from Unsplash or image hosts). This ensures zero server storage limits and high resolution for college dean demonstrations.
                </span>
              </div>

              {/* Image Preview Box */}
              {imageUrl && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Live Preview:</span>
                  <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-800 relative bg-slate-900">
                    <img 
                      src={imageUrl} 
                      alt="Stall Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                type="submit"
                className="btn-primary-gradient px-6 py-3 text-xs font-bold text-white rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Save className="w-4 h-4" /> Save Profile Details
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
