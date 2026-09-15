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
  ArrowUpRight,
  ArrowDownRight,
  Download,
  AlertTriangle
} from "lucide-react";

export default function VendorSalesReportPage() {
  const router = useRouter();
  const [activeVendor, setActiveVendor] = useState<RestaurantAccount>(RESTAURANT_ACCOUNTS[0]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [daysFilter, setDaysFilter] = useState<"1" | "7" | "30" | "custom">("7");
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const [todaySales, setTodaySales] = useState(0);
  const [yesterdaySales, setYesterdaySales] = useState(0);

  const handleExportVendorExcel = async () => {
    if (typeof window === "undefined") return;
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = activeVendor.name;
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("Sales & OOS Refunds");
      sheet.columns = [
        { header: "Placing Time", key: "time", width: 18 },
        { header: "Token Number", key: "token", width: 18 },
        { header: "Customer", key: "customer", width: 22 },
        { header: "Dish Name", key: "dishName", width: 28 },
        { header: "Unit Price (INR)", key: "price", width: 16 },
        { header: "Quantity", key: "quantity", width: 12 },
        { header: "Item Total (INR)", key: "total", width: 16 },
        { header: "Stock / Refund Status", key: "stockStatus", width: 25 },
        { header: "Order Status", key: "orderStatus", width: 16 }
      ];

      // Header style
      const headerRow = sheet.getRow(1);
      headerRow.height = 26;
      headerRow.eachCell((cell: any) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      let netFoodTotal = 0;
      let totalRefunded = 0;

      filteredOrders.forEach((order) => {
        const isOrderRefunded = order.status === "REFUNDED";
        const customerName = order.studentName || order.studentRegNumber || "Student";

        (order.items || []).forEach((it: any) => {
          const itemPrice = Number(it.price) || 0;
          const itemQty = Number(it.quantity) || 1;
          const itemSubtotal = itemPrice * itemQty;
          const isOos = Boolean(it.outOfStock || it.refunded || isOrderRefunded);

          if (isOos) {
            totalRefunded += itemSubtotal;
          } else {
            netFoodTotal += itemSubtotal;
          }

          const stockStatusStr = isOos ? "OUT OF STOCK / REFUNDED" : "In Stock (Fulfilled)";

          const row = sheet.addRow([
            order.placedAt || "--",
            order.tokenNumber,
            customerName,
            it.name,
            itemPrice,
            itemQty,
            itemSubtotal,
            stockStatusStr,
            order.status
          ]);
          row.height = 20;

          // Highlight Out of Stock / Refunded rows in RED color!
          if (isOos) {
            row.eachCell((cell: any) => {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFEAEA" } // Light Red Fill
              };
              cell.font = {
                color: { argb: "FFB91C1C" }, // Bold Dark Red Font
                bold: true
              };
            });
          }
        });
      });

      // Total summary row
      const summaryRow = sheet.addRow([
        "TOTAL",
        "-",
        "-",
        "-",
        "-",
        "-",
        netFoodTotal,
        `Refunded: ₹${totalRefunded}`,
        "-"
      ]);
      summaryRow.height = 24;
      summaryRow.eachCell((cell: any) => {
        cell.font = { bold: true, color: { argb: "FF0F172A" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
        cell.border = {
          top: { style: "medium", color: { argb: "FF475569" } },
          bottom: { style: "double", color: { argb: "FF0F172A" } }
        };
      });

      // Auto fit columns
      sheet.columns.forEach((column: any) => {
        let maxLen = 14;
        column.eachCell?.({ includeEmpty: true }, (cell: any) => {
          const valStr = cell.value ? cell.value.toString() : "";
          maxLen = Math.max(maxLen, valStr.length + 3);
        });
        column.width = Math.min(maxLen, 40);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeVendor.id}_Sales_Report_${Date.now()}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Vendor Excel export failed", e);
    }
  };

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
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    const todayList = allOrders.filter(o => o.timestamp >= startOfToday && o.status !== "REFUNDED");
    const yesterdayList = allOrders.filter(o => o.timestamp >= startOfYesterday && o.timestamp < startOfToday && o.status !== "REFUNDED");

    setTodaySales(todayList.reduce((sum, o) => sum + o.subtotal, 0));
    setYesterdaySales(yesterdayList.reduce((sum, o) => sum + o.subtotal, 0));
  };

  const getFilteredOrders = () => {
    if (daysFilter === "1") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
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
      filterDateStart.setHours(0, 0, 0, 0);
      const filterDateEnd = new Date(customDate);
      filterDateEnd.setHours(23, 59, 59, 999);
      return orders.filter(o => o.timestamp >= filterDateStart.getTime() && o.timestamp <= filterDateEnd.getTime());
    }
    return orders;
  };

  const filteredOrders = getFilteredOrders();

  const totalRevenue = filteredOrders.filter(o => o.status !== "REFUNDED").reduce((sum, o) => sum + o.subtotal, 0);
  const totalOrdersCount = filteredOrders.length;
  const completedOrdersCount = filteredOrders.filter(o => o.status === "FULFILLED").length;
  const cancelledOrdersCount = filteredOrders.filter(o => o.status === "REFUNDED").length;
  const totalRefundedAmount = filteredOrders.filter(o => o.status === "REFUNDED").reduce((sum, o) => sum + o.subtotal, 0);
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  const completedOrdersList = filteredOrders.filter(o => o.status === "FULFILLED");
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

  const percentDiff = yesterdaySales > 0
    ? ((todaySales - yesterdaySales) / yesterdaySales) * 100
    : todaySales > 0 ? 100 : 0;

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
    <div className="min-h-screen bg-paper text-ink flex flex-col pb-12">
      <VendorNav />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ink flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-marigold" /> Sales Report
            </h2>
            <p className="text-xs text-ink-soft">Track revenue and past orders for your stall.</p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold card-surface p-1.5">
            {(["1", "7", "30"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setDaysFilter(f)}
                className={`px-3 py-1.5 rounded transition-colors ${
                  daysFilter === f ? "bg-marigold text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                {f === "1" ? "Today" : `Last ${f} Days`}
              </button>
            ))}

            <div className="flex items-center gap-2 pl-2 border-l border-ink/10">
              <button
                onClick={() => setDaysFilter("custom")}
                className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                  daysFilter === "custom" ? "bg-marigold text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Pick Date</span>
              </button>

              {daysFilter === "custom" && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="bg-paper border border-ink/15 rounded px-2 py-1 text-ink focus:outline-none"
                />
              )}
            </div>
          </div>
        </div>

        {/* Comparison Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 card-surface p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">Today vs Yesterday</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-ink">₹{todaySales}</span>
                <span className="text-xs text-ink-soft">vs yesterday: ₹{yesterdaySales}</span>
              </div>
            </div>

            <div className={`px-4 py-2 rounded font-bold flex items-center gap-1.5 shrink-0 ${
              percentDiff >= 0
                ? "bg-sage-soft border border-sage/30 text-sage"
                : "bg-chili-soft border border-chili/30 text-chili"
            }`}>
              {percentDiff >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="text-sm font-mono font-bold">{percentDiff >= 0 ? "+" : ""}{percentDiff.toFixed(1)}%</span>
            </div>
          </div>

          <div className="card-surface p-5 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">Avg Order Value</span>
              <p className="text-2xl font-mono font-bold text-marigold">₹{avgOrderValue}</p>
            </div>
            <div className="w-10 h-10 rounded bg-marigold/10 text-marigold flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Graph + Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card-surface p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-marigold" /> Daily Revenue Trend
              </h3>
              <span className="text-[10px] font-mono text-ink-soft uppercase tracking-wider">
                {daysFilter === "30" ? "Last 30 days" : "Last 7 days"}
              </span>
            </div>

            {loading ? (
              <div className="h-56 flex items-center justify-center text-xs text-ink-soft">Loading...</div>
            ) : (
              <div className="w-full h-56 flex items-end gap-2 px-2 pt-4 border-b border-l border-ink/10">
                {graphData.map((data, idx) => {
                  const heightPercent = (data.sales / maxSalesVal) * 80 + 10;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative">
                      <div className="absolute bottom-full mb-2 bg-ink text-paper p-2 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-24 text-center">
                        <p className="font-bold">₹{data.sales}</p>
                        <p className="text-[9px] opacity-80">{data.count} orders</p>
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-marigold/70 group-hover:bg-marigold rounded-t transition-all"
                      />
                      <span className="text-[9px] text-ink-soft font-semibold mt-2 truncate w-full text-center">
                        {data.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card-surface p-5 space-y-3">
            <h3 className="text-sm font-bold text-ink border-b border-ink/10 pb-3">Summary</h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded bg-cardstock">
                <span className="text-ink-soft font-bold">Total Revenue</span>
                <span className="font-mono font-bold text-sage">₹{totalRevenue}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded bg-cardstock">
                <span className="text-ink-soft font-bold">Orders</span>
                <span className="font-mono font-bold text-ink">{totalOrdersCount}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded bg-cardstock">
                <span className="text-ink-soft font-bold">Fulfilled</span>
                <span className="font-mono font-bold text-sage">{completedOrdersCount}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded bg-cardstock">
                <span className="text-ink-soft font-bold">Refunded</span>
                <span className="font-mono font-bold text-chili">{cancelledOrdersCount} (₹{totalRefundedAmount})</span>
              </div>

              {topDishQty > 0 && (
                <div className="p-2.5 rounded bg-marigold/10 border border-marigold/20">
                  <span className="text-ink-soft text-[10px] uppercase font-bold tracking-wider">Top Selling Dish</span>
                  <p className="text-ink font-bold text-xs mt-0.5">{topDishName}</p>
                  <p className="text-[10px] text-marigold font-semibold">{topDishQty} sold in this period</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-marigold" /> Transaction History ({filteredOrders.length})
            </h3>

            <button
              onClick={handleExportVendorExcel}
              className="bg-marigold hover:bg-marigold-hover py-1.5 px-3.5 rounded text-xs font-bold text-white flex items-center gap-1.5 active:scale-95 transition-transform self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Sales Report (.xlsx)</span>
            </button>
          </div>

          <div className="card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-cardstock border-b border-ink/10 font-bold text-ink-soft">
                    <th className="p-3">Time</th>
                    <th className="p-3">Token</th>
                    <th className="p-3">Items & Stock Status</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-ink-soft font-medium">
                        No orders in this range.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order, idx) => {
                      const isOrderRefunded = order.status === "REFUNDED";
                      return (
                        <tr key={idx} className={`transition-colors ${isOrderRefunded ? "bg-chili/5 hover:bg-chili/10" : "hover:bg-cardstock-hover"}`}>
                          <td className="p-3 text-ink-soft font-mono">{order.placedAt || "--"}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-marigold/10 border border-marigold/30 text-marigold font-mono font-bold">
                              {order.tokenNumber}
                            </span>
                          </td>
                          <td className="p-3 min-w-[240px]">
                            <div className="space-y-1">
                              {order.items?.map((it: any, i: number) => {
                                const isOos = Boolean(it.outOfStock || it.refunded || isOrderRefunded);
                                return (
                                  <div key={i} className="flex items-center justify-between gap-2 text-xs">
                                    <span className={isOos ? "text-chili line-through font-medium" : "text-ink"}>
                                      {it.name} <span className="text-[10px] text-ink-soft">x{it.quantity}</span>
                                    </span>
                                    {isOos ? (
                                      <span className="px-1.5 py-0.5 rounded bg-chili-soft border border-chili/30 text-chili text-[9px] font-bold shrink-0 flex items-center gap-0.5">
                                        <AlertTriangle className="w-2.5 h-2.5" /> Out of Stock (Refunded)
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-mono text-ink-soft">
                                        ₹{(Number(it.price) || 0) * (Number(it.quantity) || 1)}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-ink">
                            <span className={isOrderRefunded ? "text-chili line-through" : "text-ink"}>
                              ₹{order.subtotal}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === "FULFILLED"
                                ? "bg-sage-soft border border-sage/30 text-sage"
                                : order.status === "READY"
                                ? "bg-marigold/10 border border-marigold/30 text-marigold"
                                : order.status === "REFUNDED"
                                ? "bg-chili-soft border border-chili/30 text-chili"
                                : "bg-cardstock border border-ink/15 text-ink-soft"
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
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
