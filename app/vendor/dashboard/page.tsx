"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VendorNav } from "@/components/VendorNav";
import { RESTAURANT_ACCOUNTS, getActiveRestaurant, RestaurantAccount } from "@/lib/restaurants-data";
import { 
  Bell, 
  IndianRupee, 
  UtensilsCrossed, 
  Store, 
  ChefHat, 
  CheckCircle2, 
  Flame, 
  TrendingUp, 
  BarChart3, 
  QrCode, 
  Building2, 
  Users,
  Clock,
  AlertTriangle
} from "lucide-react";

export default function VendorDashboardPage() {
  const router = useRouter();
  const [activeVendor, setActiveVendor] = useState<RestaurantAccount>(RESTAURANT_ACCOUNTS[0]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeRushCount, setActiveRushCount] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [acknowledgedItems, setAcknowledgedItems] = useState<string[]>([]);

  const fetchLiveDashboardStats = async (vendorId: string) => {
    try {
      const res = await fetch(`/api/orders?restaurantId=${vendorId}`);
      const data = await res.json();
      if (data.success && data.orders) {
        const list = data.orders;
        setOrders(list);

        const active = list.filter((o: any) => 
          o.status === "PLACED" || o.status === "ACCEPTED" || o.status === "COOKING" || o.status === "PACKING"
        );
        setActiveRushCount(active.length);

        const ready = list.filter((o: any) => o.status === "READY");
        setReadyCount(ready.length);

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayMs = startOfToday.getTime();

        const todayList = list.filter((o: any) => o.timestamp >= todayMs);
        setTodayOrdersCount(todayList.length);

        const revenueSum = todayList
          .filter((o: any) => o.status !== "REFUNDED")
          .reduce((sum: number, o: any) => sum + o.subtotal, 0);
        setTodayRevenue(revenueSum);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("campusbites_user_role");
      if (role !== "VENDOR") {
        if (role === "STUDENT") router.push("/student/dashboard");
        else if (role === "ADMIN") router.push("/admin");
        else router.push("/login");
        return;
      }
    }

    const currentId = typeof window !== "undefined" ? localStorage.getItem("campusbites_active_vendor_id") : null;
    
    const fetchMenuFromDatabase = async (restaurantId: string) => {
      try {
        const res = await fetch(`/api/menu?restaurantId=${restaurantId}`);
        const data = await res.json();
        if (data.success) {
          setMenuItems(data.items || []);
        }
      } catch (e) {
        console.error("Failed to load menu items inside live dashboard:", e);
      }
    };

    const loadVendorDetailsAndStats = async () => {
      let currentVendor = getActiveRestaurant();
      try {
        const res = await fetch("/api/restaurants");
        const data = await res.json();
        if (data.success && data.restaurants && currentId) {
          const found = data.restaurants.find((r: any) => r.id === currentId);
          if (found) {
            currentVendor = found;
          }
        }
      } catch (e) {
        console.error("Failed to fetch live restaurant details for dashboard:", e);
      }

      setActiveVendor(currentVendor);
      fetchLiveDashboardStats(currentVendor.id);
      fetchMenuFromDatabase(currentVendor.id);
    };

    loadVendorDetailsAndStats();

    if (currentId) {
      const interval = setInterval(() => {
        fetchLiveDashboardStats(currentId);
        fetchMenuFromDatabase(currentId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [router]);

  const TOP_SELLING_DISHES = [
    { name: "Double Cheese Chicken Burger", category: "Non-Veg", sales: 84, revenue: "₹13,440" },
    { name: "Peri Peri Loaded Fries", category: "Veg", sales: 62, revenue: "₹6,820" },
    { name: "Crispy Chicken Wrap", category: "Non-Veg", sales: 48, revenue: "₹6,720" },
    { name: "Cold Coffee with Ice Cream", category: "Veg", sales: 95, revenue: "₹8,550" },
  ];

  return (
    <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col pb-12">
      <VendorNav />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
        {/* OUT OF STOCK ALERTS BANNER */}
        {menuItems.filter(item => (!item.available || item.stockCount <= 0) && !acknowledgedItems.includes(item.id)).length > 0 && (
          <div className="glass-panel p-4 rounded-2xl border-red-500/50 bg-red-950/40 text-red-200 text-xs font-bold space-y-2.5 shadow-2xl relative animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
                <span className="text-sm font-black text-white">⚠️ Stock Warning: {menuItems.filter(item => (!item.available || item.stockCount <= 0) && !acknowledgedItems.includes(item.id)).length} Item(s) Out of Stock!</span>
              </div>
              <p className="text-[10px] text-slate-400">Students cannot purchase these until stock is replenished</p>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-1">
              {menuItems.filter(item => (!item.available || item.stockCount <= 0) && !acknowledgedItems.includes(item.id)).map((item) => (
                <div key={item.id} className="flex items-center gap-2 bg-slate-950/80 border border-red-500/30 px-3 py-1.5 rounded-xl">
                  <span className="text-white font-extrabold">{item.name}</span>
                  <span className="text-[10px] text-slate-500">({item.stockType === "COUNTED" ? `0 left` : `Disabled`})</span>
                  <button
                    onClick={() => setAcknowledgedItems(prev => [...prev, item.id])}
                    className="ml-2 text-[10px] text-red-400 hover:text-red-300 font-bold bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30 transition-colors"
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Executive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border-slate-800">
          <div className="flex items-center gap-4">
            <img src={activeVendor.logo} alt={activeVendor.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500/40 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold">
                  {activeVendor.tokenPrefix}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-extrabold flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-purple-400" /> {activeVendor.floor}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">{activeVendor.name}</h1>
              <p className="text-xs text-slate-400">{activeVendor.location}</p>
            </div>
          </div>

          <Link
            href="/vendor/orders"
            className="btn-primary-gradient px-6 py-3.5 rounded-2xl text-xs font-extrabold text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:scale-105 transition-transform shrink-0"
          >
            <Flame className="w-4 h-4 text-orange-200 animate-pulse" />
            <span>Launch Live Orders Queue (Rush Matrix) →</span>
          </Link>
        </div>

        {/* Operational Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass-panel p-5 rounded-3xl border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Active Rush Queue</span>
              <Bell className="w-4 h-4 text-orange-400 animate-pulse" />
            </div>
            <p className="text-3xl font-extrabold text-white">{activeRushCount} Orders</p>
            <p className="text-[11px] text-slate-400">Orders in kitchen prep</p>
          </div>

          <div className="glass-panel p-5 rounded-3xl border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Ready at Counter</span>
              <ChefHat className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-400">{readyCount} Orders</p>
            <p className="text-[11px] text-slate-400">Awaiting student pickup</p>
          </div>

          <div className="glass-panel p-5 rounded-3xl border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Today's Total Orders</span>
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{todayOrdersCount} Orders</p>
            <p className="text-[11px] text-slate-400">Total orders received today</p>
          </div>

          <div className="glass-panel p-5 rounded-3xl border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Today's Net Revenue</span>
              <IndianRupee className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-extrabold text-amber-400">₹{todayRevenue}</p>
            <p className="text-[11px] text-slate-400">Net canteen earnings today</p>
          </div>
        </div>

        {/* Operational Quick Launch Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/vendor/orders"
            className="glass-panel p-5 rounded-3xl border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                Live Rush Matrix Queue
              </h3>
              <p className="text-[11px] text-slate-400">
                Manage 30+ rush orders with high-density compact cards.
              </p>
            </div>
          </Link>

          <Link
            href="/vendor/sales"
            className="glass-panel p-5 rounded-3xl border-slate-800 hover:border-orange-500/40 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                Sales Report & Analytics
              </h3>
              <p className="text-[11px] text-slate-400">
                View dynamic charts, filter custom days & historical sales.
              </p>
            </div>
          </Link>

          <Link
            href="/vendor/menu"
            className="glass-panel p-5 rounded-3xl border-slate-800 hover:border-orange-500/40 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                Menu Item Manager
              </h3>
              <p className="text-[11px] text-slate-400">
                Bulk CSV import/export, pricing & dish availability.
              </p>
            </div>
          </Link>

          <Link
            href="/vendor/slots"
            className="glass-panel p-5 rounded-3xl border-slate-800 hover:border-orange-500/40 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                Pickup Slot Capacity
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure 15-minute lecture break slot limits.
              </p>
            </div>
          </Link>
        </div>

        {/* Analytics Section: Top Selling Dishes & Rush Hour Surge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-400" /> Today's Top Selling Dishes
              </h3>
              <span className="text-xs font-normal text-slate-400">Updated hourly</span>
            </div>

            <div className="space-y-3">
              {TOP_SELLING_DISHES.map((dish, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-orange-500/10 text-orange-400 font-extrabold flex items-center justify-center text-xs border border-orange-500/20">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">{dish.name}</p>
                      <p className="text-[10px] text-slate-400">{dish.category}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-orange-400">{dish.sales} orders</p>
                    <p className="text-[10px] text-slate-400">{dish.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <BarChart3 className="w-5 h-5 text-amber-400" /> Rush Hour Traffic Surge
            </h3>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-xs">
                  <Flame className="w-4 h-4 text-amber-400" /> Peak Surge: 12:15 PM - 01:15 PM
                </p>
                <p className="text-[11px] text-amber-200/80">
                  Lecture break surge expects ~120 students per slot across {activeVendor.floor}.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>Slot 12:15 PM - 12:30 PM</span>
                  <span className="font-bold text-emerald-400">48 / 60 Slots</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full w-[80%]" />
                </div>

                <div className="flex justify-between text-slate-300 text-[11px] pt-2">
                  <span>Slot 12:30 PM - 12:45 PM</span>
                  <span className="font-bold text-amber-400">58 / 60 Slots</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full w-[95%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
