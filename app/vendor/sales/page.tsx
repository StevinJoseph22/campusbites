"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VendorNav } from "@/components/VendorNav";
import { getActiveRestaurant, RestaurantAccount, RESTAURANT_ACCOUNTS } from "@/lib/restaurants-data";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  IndianRupee, 
  ShoppingBag, 
  ChevronRight, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter
} from "lucide-react";

export default function VendorSalesReportPage() {
  const router = useRouter();
  const [activeVendor, setActiveVendor] = useState<RestaurantAccount>(RESTAURANT_ACCOUNTS[0]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [daysFilter, setDaysFilter] = useState<"1" | "7" | "30" | "custom">("7");
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Comparative today vs yesterday
  const [todaySales, setTodaySales] = useState(0);
  const [yesterdaySales, setYesterdaySales] = useState(0);

  const fetchOrders = async (vendorId: string) => {
    try {
      const res = await fetch(`/api/orders?restaurantId=${vendorId}`);
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
        calculateTodayVsYesterday(data.orders);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
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
    
    const loadVendorDetailsAndSales = async () => {
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
        console.error("Failed to fetch live restaurant details for sales page:", e);
      }

      setActiveVendor(currentVendor);
      fetchOrders(currentVendor.id);
    };

    loadVendorDetailsAndSales();
  }, [router]);

  const calculateTodayVsYesterday = (allOrders: any[]) => {
    const now = new Date();
    
    // Today boundary
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Yesterday boundary
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    
    const todayList = allOrders.filter(o => o.timestamp >= startOfToday && o.status !== "REFUNDED");
    const yesterdayList = allOrders.filter(o => o.timestamp >= startOfYesterday && o.timestamp < startOfToday && o.status !== "REFUNDED");

    const tSum = todayList.reduce((sum, o) => sum + o.subtotal, 0);
    const ySum = yesterdayList.reduce((sum, o) => sum + o.subtotal, 0);

    setTodaySales(tSum);
    setYesterdaySales(ySum);
  };

  // Filter orders based on active filter
  const getFilteredOrders = () => {
    if (daysFilter === "1") {
      const startOfToday = new Date();
      startOfToday.setHours(0,0,0,0);
      return orders.filter(o => o.timestamp >= startOfToday.getTime());
    }
    
    if (daysFilter === "7") {
      const startOf7Days = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return orders.filter(o => o.timestamp >= startOf7Days);
    }

    if (daysFilter === "30") {
      const startOf30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return orders.filter(o => o.timestamp >= startOf30Days);
    }

    if (daysFilter === "custom") {
      const filterDateStart = new Date(customDate);
      filterDateStart.setHours(0,0,0,0);
      const filterDateEnd = new Date(customDate);
      filterDateEnd.setHours(23,59,59,999);
      
      return orders.filter(o => o.timestamp >= filterDateStart.getTime() && o.timestamp <= filterDateEnd.getTime());
    }

    return orders;
  };

  const filteredOrders = getFilteredOrders();

  // Metrics for filtered orders
  const totalRevenue = filteredOrders.filter(o => o.status !== "REFUNDED").reduce((sum, o) => sum + o.subtotal, 0);
  const totalOrdersCount = filteredOrders.length;
  const completedOrdersCount = filteredOrders.filter(o => o.status === "FULFILLED" || o.status === "DELIVERED").length;
  const cancelledOrdersCount = filteredOrders.filter(o => o.status === "REFUNDED").length;
  const totalRefundedAmount = filteredOrders.filter(o => o.status === "REFUNDED").reduce((sum, o) => sum + o.subtotal, 0);
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Demand Indicator (Cook More)
  const completedOrdersList = filteredOrders.filter(o => o.status === "FULFILLED" || o.status === "DELIVERED");
  const dishQuantities: Record<string, number> = {};
  completedOrdersList.forEach(o => {
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach((it: any) => {
        if (!it.outOfStock) {
          dishQuantities[it.name] = (dishQuantities[it.name] || 0) + it.quantity;
        }
      });
    }
  });

  let topDishName = "None yet";
  let topDishQty = 0;
  Object.entries(dishQuantities).forEach(([name, qty]) => {
    if (qty > topDishQty) {
      topDishName = name;
      topDishQty = qty;
    }
  });

  // Comparison logic
  const percentDiff = yesterdaySales > 0 
    ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 
    : todaySales > 0 ? 100 : 0;

  // Build daily sales trend list for the graph (last 7 days by default)
  const getGraphData = () => {
    const daysToGenerate = daysFilter === "30" ? 30 : 7;
    const dataList = [];
    const now = new Date();

    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const startMs = d.setHours(0, 0, 0, 0);
      const endMs = d.setHours(23, 59, 59, 999);

      const dayOrders = orders.filter(o => o.timestamp >= startMs && o.timestamp <= endMs && o.status !== "REFUNDED");
      const salesSum = dayOrders.reduce((sum, o) => sum + o.subtotal, 0);

      dataList.push({
        label: d.toLocaleDateString([], { weekday: "short", day: "numeric" }),
        sales: salesSum,
        count: dayOrders.length
      });
    }
    return dataList;
  };

  const graphData = getGraphData();
  const maxSalesVal = Math.max(...graphData.map(g => g.sales), 100);

  return (
    <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col pb-12">
      <VendorNav />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-orange-400" /> Sales Report & Revenue Analytics
            </h2>
            <p className="text-xs text-slate-400">
              Track your canteen performance, view historical transactions, and analyze top revenue trends.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setDaysFilter("1")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                daysFilter === "1" ? "bg-orange-500 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDaysFilter("7")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                daysFilter === "7" ? "bg-orange-500 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDaysFilter("30")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                daysFilter === "30" ? "bg-orange-500 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Last 30 Days
            </button>
            
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <button
                onClick={() => setDaysFilter("custom")}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  daysFilter === "custom" ? "bg-orange-500 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>History Date</span>
              </button>
              
              {daysFilter === "custom" && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white focus:outline-none"
                />
              )}
            </div>
          </div>
        </div>

        {/* Comparison Alert Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-panel p-6 rounded-3xl border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Today vs Yesterday Sales</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">₹{todaySales}</span>
                <span className="text-xs text-slate-400">vs yesterday: ₹{yesterdaySales}</span>
              </div>
              <p className="text-xs text-slate-400">
                Calculated quietly in real-time based on SQLite order records.
              </p>
            </div>

            <div className={`px-4 py-2.5 rounded-2xl font-bold flex items-center gap-1.5 shrink-0 ${
              percentDiff >= 0 
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}>
              {percentDiff >= 0 ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : <ArrowDownRight className="w-5 h-5 text-red-400" />}
              <div>
                <span className="text-sm font-black">{percentDiff >= 0 ? "+" : ""}{percentDiff.toFixed(1)}%</span>
                <span className="text-[10px] block opacity-80">canteen trend</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-br from-slate-900 to-slate-950">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Average Ticket Size</span>
              <p className="text-3xl font-black text-orange-400">₹{avgOrderValue}</p>
              <p className="text-[10px] text-slate-400">Avg value spent per customer order</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold shadow-md">
              <Percent className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Dashboard Analytics & Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SVG Sales Trend Chart */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-400" /> Daily Revenue Trend
              </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {daysFilter === "30" ? "Last 30 days" : "Last 7 days"}
              </span>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500">Loading charts...</div>
            ) : (
              <div className="space-y-4">
                {/* SVG Visual Graph */}
                <div className="w-full h-56 flex items-end gap-3 px-2 pt-4 border-b border-l border-slate-800">
                  {graphData.map((data, idx) => {
                    const heightPercent = (data.sales / maxSalesVal) * 80 + 10; // offset for minimum height
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 bg-slate-950 border border-slate-800 p-2 rounded-xl text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-xl pointer-events-none z-10 w-24 text-center">
                          <p className="font-bold text-orange-400">₹{data.sales}</p>
                          <p className="text-[9px] text-slate-400">{data.count} orders</p>
                        </div>
                        
                        {/* Interactive Bar */}
                        <div 
                          style={{ height: `${heightPercent}%` }} 
                          className="w-full bg-gradient-to-t from-orange-600/40 to-orange-500 rounded-t-lg group-hover:from-orange-500 group-hover:to-amber-400 transition-all duration-300 shadow-md group-hover:shadow-orange-500/20"
                        />
                        
                        {/* Label */}
                        <span className="text-[9px] text-slate-500 font-semibold mt-2 truncate w-full text-center">
                          {data.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>← Previous Period</span>
                  <span>Today</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics Panel */}
          <div className="glass-panel p-6 rounded-3xl border-slate-800 flex flex-col justify-between gap-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Filter className="w-5 h-5 text-purple-400" /> Filter Overview
            </h3>

            <div className="space-y-3 flex-1 pt-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 font-bold">Total Income</span>
                <span className="font-black text-emerald-400 text-base flex items-center">
                  <IndianRupee className="w-4 h-4" /> {totalRevenue}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 font-bold">Orders Received</span>
                <span className="font-extrabold text-white text-sm">
                  {totalOrdersCount}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 font-bold">Completed Orders</span>
                <span className="font-extrabold text-emerald-500 text-sm">
                  {completedOrdersCount}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 font-bold">Orders Cancelled</span>
                <span className="font-extrabold text-rose-500 text-sm">
                  {cancelledOrdersCount}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 font-bold">Total Refunded</span>
                <span className="font-black text-rose-500 text-sm flex items-center">
                  <IndianRupee className="w-3.5 h-3.5" /> {totalRefundedAmount}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">🔥 Demand Indicator (Cook More)</span>
                <p className="text-white font-extrabold text-xs">{topDishName}</p>
                {topDishQty > 0 && (
                  <p className="text-[10px] text-orange-400 font-semibold">{topDishQty} units cooked & delivered</p>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] leading-relaxed">
                🚀 Tip: Compare metrics under various period filters to understand student demand patterns at the counter.
              </div>
            </div>
          </div>
        </div>

        {/* Historical Transactions List */}
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-400" /> Transaction History under Filter ({filteredOrders.length})
          </h3>

          <div className="glass-panel rounded-3xl border-slate-800 overflow-hidden bg-slate-900/40">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 font-extrabold text-slate-400">
                    <th className="p-4">Time</th>
                    <th className="p-4">Order Token</th>
                    <th className="p-4">Items Ordered</th>
                    <th className="p-4 text-right">Subtotal</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                        No orders recorded during this filter range.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-4 text-slate-400 font-mono">
                          {order.placedAt || "00:00"}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono font-bold">
                            {order.tokenNumber}
                          </span>
                        </td>
                        <td className="p-4 min-w-[200px]">
                          <div className="space-y-1 font-semibold">
                            {order.items?.map((it: any, i: number) => (
                              <p key={i} className="text-white text-xs">
                                {it.name} <span className="text-[10px] text-slate-500">x{it.quantity}</span>
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-right font-bold text-white text-xs">
                          ₹{order.subtotal}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            order.status === "DELIVERED" 
                              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                              : order.status === "READY"
                              ? "bg-blue-500/15 border border-blue-500/30 text-blue-400"
                              : order.status === "REFUNDED"
                              ? "bg-red-500/15 border border-red-500/30 text-red-400"
                              : "bg-orange-500/15 border border-orange-500/30 text-orange-400"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
