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
  CheckCircle2,
  ChefHat,
  AlertTriangle,
  Building2,
  BarChart3,
  Printer
} from "lucide-react";

export default function VendorDashboardPage() {
  const router = useRouter();
  const [activeVendor, setActiveVendor] = useState<RestaurantAccount>(RESTAURANT_ACCOUNTS[0]);
  const [activeQueueCount, setActiveQueueCount] = useState(0);
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

        const active = list.filter((o: any) => o.status === "PLACED" || o.status === "CONFIRMED");
        setActiveQueueCount(active.length);

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

    let activeRestId: string | null = null;

    const loadVendorDetailsAndStats = async () => {
      const currentId = typeof window !== "undefined" ? localStorage.getItem("campusbites_active_vendor_id") : null;
      const currentUsername = typeof window !== "undefined" ? localStorage.getItem("campusbites_student_reg") : null;
      const currentName = typeof window !== "undefined" ? localStorage.getItem("campusbites_user_name") : null;

      let currentVendor = getActiveRestaurant();
      try {
        const res = await fetch("/api/restaurants");
        const data = await res.json();
        if (data.success && data.restaurants && data.restaurants.length > 0) {
          const found = data.restaurants.find((r: any) => 
            (currentId && (r.id.toLowerCase() === currentId.toLowerCase() || r.name.toLowerCase() === currentId.toLowerCase() || r.tokenPrefix.toLowerCase() === currentId.toLowerCase() || r.id.toLowerCase().startsWith(currentId.toLowerCase()))) ||
            (currentUsername && (r.id.toLowerCase().includes(currentUsername.toLowerCase()) || r.name.toLowerCase().includes(currentUsername.toLowerCase()))) ||
            (currentName && r.name.toLowerCase() === currentName.toLowerCase())
          );
          if (found) {
            currentVendor = found;
            localStorage.setItem("campusbites_active_vendor_id", found.id);
          } else if (!currentId && data.restaurants[0]) {
            currentVendor = data.restaurants[0];
            localStorage.setItem("campusbites_active_vendor_id", currentVendor.id);
          }
        }
      } catch (e) {
        console.error("Failed to fetch live restaurant details for dashboard:", e);
      }

      activeRestId = currentVendor.id;
      setActiveVendor(currentVendor);
      fetchLiveDashboardStats(currentVendor.id);
      fetchMenuFromDatabase(currentVendor.id);
    };

    loadVendorDetailsAndStats();

    const interval = setInterval(() => {
      const targetId = activeRestId || (typeof window !== "undefined" ? localStorage.getItem("campusbites_active_vendor_id") : null);
      if (targetId) {
        fetchLiveDashboardStats(targetId);
        fetchMenuFromDatabase(targetId);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [router]);


  const outOfStockItems = menuItems.filter(
    item => (!item.available || item.stockCount <= 0) && !acknowledgedItems.includes(item.id)
  );

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col pb-12">
      <VendorNav />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Out of stock alert */}
        {outOfStockItems.length > 0 && (
          <div className="card-surface p-4 border-chili/30 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-chili" />
                <span className="text-sm font-bold text-chili">{outOfStockItems.length} item(s) out of stock</span>
              </div>
              <p className="text-[11px] text-ink-soft">Customers can't order these until restocked</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {outOfStockItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 bg-chili-soft px-3 py-1.5 rounded text-xs">
                  <span className="font-bold text-chili">{item.name}</span>
                  <button
                    onClick={() => setAcknowledgedItems(prev => [...prev, item.id])}
                    className="text-chili/80 hover:text-chili font-bold underline"
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="card-surface p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={activeVendor.logo} alt={activeVendor.name} className="w-14 h-14 rounded object-cover border border-ink/15 shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-marigold/10 border border-marigold/30 text-marigold text-[11px] font-mono font-bold">
                  {activeVendor.tokenPrefix}
                </span>
                <span className="px-2 py-0.5 rounded bg-cardstock border border-ink/15 text-ink-soft text-[11px] font-bold flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {activeVendor.floor}
                </span>
              </div>
              <h1 className="font-display text-lg sm:text-xl font-bold text-ink mt-1">{activeVendor.name}</h1>
              <p className="text-xs text-ink-soft">{activeVendor.location}</p>
            </div>
          </div>

          <Link
            href="/vendor/orders"
            className="bg-marigold hover:bg-marigold-hover transition-colors px-5 py-3 rounded text-xs font-bold text-white flex items-center justify-center gap-2 shrink-0"
          >
            View Live Orders →
          </Link>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-surface p-4 space-y-1">
            <div className="flex justify-between items-center text-ink-soft">
              <span className="text-[10px] font-bold uppercase tracking-wider">In Queue</span>
              <Bell className="w-3.5 h-3.5 text-marigold" />
            </div>
            <p className="text-2xl font-mono font-bold text-ink">{activeQueueCount}</p>
          </div>

          <div className="card-surface p-4 space-y-1">
            <div className="flex justify-between items-center text-ink-soft">
              <span className="text-[10px] font-bold uppercase tracking-wider">Ready</span>
              <ChefHat className="w-3.5 h-3.5 text-sage" />
            </div>
            <p className="text-2xl font-mono font-bold text-sage">{readyCount}</p>
          </div>

          <div className="card-surface p-4 space-y-1">
            <div className="flex justify-between items-center text-ink-soft">
              <span className="text-[10px] font-bold uppercase tracking-wider">Today's Orders</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-marigold" />
            </div>
            <p className="text-2xl font-mono font-bold text-ink">{todayOrdersCount}</p>
          </div>

          <div className="card-surface p-4 space-y-1">
            <div className="flex justify-between items-center text-ink-soft">
              <span className="text-[10px] font-bold uppercase tracking-wider">Today's Revenue</span>
              <IndianRupee className="w-3.5 h-3.5 text-marigold" />
            </div>
            <p className="text-2xl font-mono font-bold text-ink">₹{todayRevenue}</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/vendor/orders" className="card-surface hover:bg-cardstock-hover transition-colors p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-ink block">Live Queue</span>
              <span className="text-[10px] text-ink-soft">Essae PR-55 Auto-Print</span>
            </div>
          </Link>

          <Link href="/vendor/menu" className="card-surface hover:bg-cardstock-hover transition-colors p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-marigold/10 text-marigold flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-ink block">Menu</span>
              <span className="text-[10px] text-ink-soft">Dishes & Pricing</span>
            </div>
          </Link>

          <Link href="/vendor/sales" className="card-surface hover:bg-cardstock-hover transition-colors p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-marigold/10 text-marigold flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-ink block">Sales & Payouts</span>
              <span className="text-[10px] text-ink-soft">Daily Revenue Logs</span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
