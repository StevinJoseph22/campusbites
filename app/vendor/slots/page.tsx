"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { VendorNav } from "@/components/VendorNav";
import { 
  Clock, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  Calendar,
  Lock,
  Sparkles
} from "lucide-react";

export interface PickupSlotData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  bookedCount: number;
}

const INITIAL_SLOTS: PickupSlotData[] = [
  {
    id: "slot-1",
    date: "Today (Aug 7)",
    startTime: "12:15 PM",
    endTime: "12:30 PM",
    maxCapacity: 50,
    bookedCount: 22,
  },
  {
    id: "slot-2",
    date: "Today (Aug 7)",
    startTime: "12:30 PM",
    endTime: "12:45 PM",
    maxCapacity: 60,
    bookedCount: 48,
  },
  {
    id: "slot-3",
    date: "Today (Aug 7)",
    startTime: "01:00 PM",
    endTime: "01:15 PM",
    maxCapacity: 40,
    bookedCount: 40,
  },
  {
    id: "slot-4",
    date: "Today (Aug 7)",
    startTime: "01:15 PM",
    endTime: "01:30 PM",
    maxCapacity: 50,
    bookedCount: 0,
  },
];

export default function VendorSlotsPage() {
  const [slots, setSlots] = useState<PickupSlotData[]>(INITIAL_SLOTS);

  // Form state
  const [date, setDate] = useState("Today (Aug 7)");
  const [startTime, setStartTime] = useState("01:30 PM");
  const [endTime, setEndTime] = useState("01:45 PM");
  const [maxCapacity, setMaxCapacity] = useState<number | "">(50);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime || !maxCapacity) return;

    const newSlot: PickupSlotData = {
      id: `slot-${Date.now()}`,
      date,
      startTime,
      endTime,
      maxCapacity: Number(maxCapacity),
      bookedCount: 0,
    };

    setSlots(prev => [...prev, newSlot]);
    setStartTime("");
    setEndTime("");
  };

  const handleDeleteSlot = (slot: PickupSlotData) => {
    if (slot.bookedCount > 0) {
      setErrorMessage(`Cannot delete slot "${slot.startTime} - ${slot.endTime}" because it has ${slot.bookedCount} active booking(s).`);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    if (confirm(`Delete slot "${slot.startTime} - ${slot.endTime}"?`)) {
      setSlots(prev => prev.filter(s => s.id !== slot.id));
    }
  };

  return (
    <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col pb-12">
      <VendorNav />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">Pickup Time Slots Management</h2>
          <p className="text-xs text-slate-400">
            Control order capacity per 15-minute lecture break slot to prevent kitchen bottlenecks.
          </p>
        </div>

        {/* Error Alert for Deletion Restriction */}
        {errorMessage && (
          <div className="glass-panel p-4 rounded-2xl border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Slot Creation Form Card */}
          <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4 h-fit">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Clock className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-bold text-white">Create New Time Slot</h3>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
                <div className="relative flex items-center">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Start Time</label>
                  <input
                    type="text"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="12:15 PM"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">End Time</label>
                  <input
                    type="text"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="12:30 PM"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Max Order Capacity</label>
                <div className="relative flex items-center">
                  <Users className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                  <input
                    type="number"
                    required
                    min={5}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    placeholder="50"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Maximum food items allowed in this slot.</span>
              </div>

              <button
                type="submit"
                className="w-full btn-primary-gradient py-2.5 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" /> Add Time Slot
              </button>
            </form>
          </div>

          {/* Existing Slots Table & Capacity Progress */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Active Slots & Booking Capacity</span>
                <span className="text-xs font-normal text-slate-400">({slots.length} Slots)</span>
              </h3>

              {/* Status Legend */}
              <div className="flex items-center gap-3 text-[10px] font-semibold">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500" /> &lt;70%</span>
                <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500" /> 70-99%</span>
                <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500" /> 100% Full</span>
              </div>
            </div>

            <div className="space-y-3">
              {slots.map((slot) => {
                const percentage = Math.min(100, Math.round((slot.bookedCount / slot.maxCapacity) * 100));
                
                let badgeBg = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
                let progressBg = "bg-emerald-500";
                let statusLabel = "Available";

                if (percentage >= 100) {
                  badgeBg = "bg-red-500/10 border-red-500/30 text-red-400";
                  progressBg = "bg-red-500";
                  statusLabel = "Slot Full / Locked";
                } else if (percentage >= 70) {
                  badgeBg = "bg-amber-500/10 border-amber-500/30 text-amber-400";
                  progressBg = "bg-amber-500";
                  statusLabel = "Filling Fast";
                }

                return (
                  <div key={slot.id} className="glass-panel p-4 rounded-2xl border-slate-800/80 hover:border-slate-700 transition-colors space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-white">{slot.startTime} - {slot.endTime}</span>
                          <span className="text-[10px] text-slate-500">({slot.date})</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-300 mt-0.5">
                          {slot.bookedCount} / {slot.maxCapacity} items booked
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${badgeBg}`}>
                          {statusLabel}
                        </span>

                        <button
                          onClick={() => handleDeleteSlot(slot)}
                          className={`p-2 rounded-xl border transition-all ${
                            slot.bookedCount > 0
                              ? "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed"
                              : "bg-slate-900 hover:bg-red-500/20 border-slate-800 text-slate-400 hover:text-red-400"
                          }`}
                          title={slot.bookedCount > 0 ? "Cannot delete slot with active bookings" : "Delete Slot"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                        <div 
                          className={`h-full ${progressBg} transition-all duration-300`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{percentage}% Occupied</span>
                        <span>{slot.maxCapacity - slot.bookedCount} Spots Left</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
