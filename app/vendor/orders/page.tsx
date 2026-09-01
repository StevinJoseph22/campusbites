"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { VendorNav } from "@/components/VendorNav";
import { DigitalReceiptModal } from "@/components/DigitalReceiptModal";
import { getSocket } from "@/lib/socket-client";
import { getActiveRestaurant, RestaurantAccount } from "@/lib/restaurants-data";
import { deduplicateAndSortOrders, VendorOrderRecord } from "@/lib/order-utils";
import { 
  ChefHat, 
  CheckCircle2, 
  Bell, 
  Receipt,
  Flame,
  Archive,
  Search,
  Building2,
  PackageCheck,
  XCircle,
  Smartphone,
  Check,
  Activity,
  AlertTriangle
} from "lucide-react";

export default function VendorOrdersPage() {
  const [activeVendor, setActiveVendor] = useState<RestaurantAccount | null>(null);
  const [orders, setOrders] = useState<VendorOrderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<VendorOrderRecord | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [acknowledgedItems, setAcknowledgedItems] = useState<string[]>([]);

  const fetchOrdersFromDatabase = async (restaurantId: string) => {
    try {
      const res = await fetch(`/api/orders?restaurantId=${restaurantId}`);
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(prev => {
          // Play chime for any new active order that arrived
          const prevIds = new Set(prev.map(o => o.orderId));
          const newOrders = data.orders.filter((o: any) => !prevIds.has(o.orderId));
          
          if (newOrders.length > 0) {
            const hasNewActive = newOrders.some((o: any) => o.status === "PENDING" || o.status === "PREPARING" || o.status === "PLACED" || o.status === "ACCEPTED");
            if (hasNewActive) {
              playChimeSound();
              setToastMessage(`🚨 NEW RUSH ORDER! Token: ${newOrders[0].tokenNumber}`);
              setTimeout(() => setToastMessage(null), 6000);
            }
          }
          return data.orders;
        });
      }
    } catch (e) {
      console.error("Failed to load orders from database:", e);
    }
  };

  const fetchMenuFromDatabase = async (restaurantId: string) => {
    try {
      const res = await fetch(`/api/menu?restaurantId=${restaurantId}`);
      const data = await res.json();
      if (data.success) {
        setMenuItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to load menu items inside live orders queue page:", e);
    }
  };

  useEffect(() => {
    const currentId = typeof window !== "undefined" ? localStorage.getItem("campusbites_active_vendor_id") : null;
    
    const loadVendorDetailsAndOrders = async () => {
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
        console.error("Failed to fetch live restaurant details for orders page:", e);
      }

      setActiveVendor(currentVendor);
      fetchOrdersFromDatabase(currentVendor.id);
      fetchMenuFromDatabase(currentVendor.id);
    };

    loadVendorDetailsAndOrders();

    if (currentId) {
      const interval = setInterval(() => {
        fetchOrdersFromDatabase(currentId);
        fetchMenuFromDatabase(currentId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, []);

  const playChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  useEffect(() => {
    if (!activeVendor) return;
    const socket = getSocket();

    const handleNewOrder = (incoming: any) => {
      // Reload orders from DB to avoid any stale data
      fetchOrdersFromDatabase(activeVendor.id);
      
      if (incoming.vendorPortions) {
        incoming.vendorPortions.forEach((portion: any) => {
          if (portion.stallId === activeVendor.id) {
            playChimeSound();
            setToastMessage(`🚨 NEW RUSH ORDER! Token: ${portion.tokenNumber}`);
            setTimeout(() => setToastMessage(null), 5000);
          }
        });
      }
    };

    socket.on("vendor_new_order", handleNewOrder);
    return () => {
      socket.off("vendor_new_order", handleNewOrder);
    };
  }, [activeVendor]);

  const handleUpdateStatus = async (tokenNumber: string, newStatus: "ACCEPTED" | "COOKING" | "PACKING" | "READY" | "FULFILLED" | "REFUNDED") => {
    if (!activeVendor) return;
    
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenNumber, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrdersFromDatabase(activeVendor.id);
      }
    } catch (e) {
      console.error(e);
    }

    const socket = getSocket();
    socket.emit("update_order_status", {
      tokenNumber,
      status: newStatus
    });

    const userPhone = localStorage.getItem("campusbites_user_phone") || "student@kristujayanti.com";

    let smsText = "";
    if (newStatus === "ACCEPTED" || newStatus === "COOKING") smsText = `Chef is now COOKING your order ${tokenNumber} in kitchen 🍳`;
    else if (newStatus === "PACKING") smsText = `Order ${tokenNumber} is PACKED 📦`;
    else if (newStatus === "READY") smsText = `Order ${tokenNumber} is READY for counter pickup! 🔔`;
    else if (newStatus === "FULFILLED") smsText = `Order ${tokenNumber} DELIVERED! Thank you for dining with CampusBites! 🎉`;
    else if (newStatus === "REFUNDED") smsText = `Order ${tokenNumber} Out of Stock — Refund processed via Razorpay ❌`;

    setToastMessage(`📧 Real Email Alert Sent to ${userPhone}: "${smsText}"`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFlagOutOfStock = async (tokenNumber: string, itemName: string) => {
    if (!activeVendor) return;
    if (!confirm(`Are you sure you want to flag "${itemName}" as Out of Stock for Token ${tokenNumber}? This will put the order on hold and alert the student.`)) {
      return;
    }
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenNumber, flagOutOfStockItem: itemName })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrdersFromDatabase(activeVendor.id);
        const socket = getSocket();
        socket.emit("update_order_status", { tokenNumber, status: "PARTIAL_HOLD" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!activeVendor) return null;

  const activeOrders = orders.filter(o => o.status !== "FULFILLED" && o.status !== "REFUNDED");
  const archivedOrders = orders.filter(o => o.status === "FULFILLED" || o.status === "REFUNDED");

  const placedOrders = activeOrders.filter(o => o.status === "PLACED");
  const cookingOrders = activeOrders.filter(o => o.status === "COOKING" || o.status === "ACCEPTED");
  const readyOrders = activeOrders.filter(o => o.status === "PACKING" || o.status === "READY");

  // Search filter across ALL orders (both active and delivered/refunded)
  const searchedOrders = orders.filter(o => 
    o.tokenNumber.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
    o.items.some(i => i.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col pb-12">
      <VendorNav />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* OUT OF STOCK ALERTS BANNER */}
        {menuItems.filter(item => (!item.available || item.stockCount <= 0) && !acknowledgedItems.includes(item.id)).length > 0 && (
          <div className="glass-panel p-4 rounded-2xl border-red-500/50 bg-red-950/40 text-red-200 text-xs font-bold space-y-2.5 shadow-2xl relative animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-sm font-black text-white">⚠️ Stock Alert: {menuItems.filter(item => (!item.available || item.stockCount <= 0) && !acknowledgedItems.includes(item.id)).length} Item(s) Out of Stock!</span>
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

        {/* Header Console */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border-slate-800 bg-slate-900/90 shadow-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold">
                {activeVendor.tokenPrefix} Kitchen Command Console
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1">
                <Building2 className="w-3 h-3 text-purple-400" /> {activeVendor.floor}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 mt-1">
              <Activity className="w-6 h-6 text-orange-500 animate-pulse" /> {activeVendor.name} High-Speed Live Queue
            </h2>
            <p className="text-xs text-slate-400">
              Live Kanban Matrix • Automated Real-Time Email Dispatcher on Stage Transitions
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => {
                setActiveTab("ACTIVE");
                setSearchQuery(""); // Clear search when switching tabs
              }}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === "ACTIVE" && searchQuery.trim() === ""
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Active Rush Queue ({activeOrders.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("ARCHIVED");
                setSearchQuery(""); // Clear search when switching tabs
              }}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === "ARCHIVED" && searchQuery.trim() === ""
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>History ({archivedOrders.length})</span>
            </button>
          </div>
        </div>

        {/* Live Kitchen Search Bar */}
        <div className="glass-panel p-4 rounded-2xl border-slate-800 bg-slate-950 flex items-center justify-between gap-3 shadow-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live queue by Token Number (e.g. 745) or Ordered Dish name..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-bold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-3.5 text-xs text-slate-500 hover:text-white font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Real-time Email Alert Toast */}
        {toastMessage && (
          <div className="glass-panel p-4 rounded-2xl border-orange-500/60 bg-orange-500/20 text-white text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top duration-200 shadow-2xl ring-2 ring-orange-500/50">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-orange-400 animate-bounce" />
              <span className="text-sm font-extrabold">{toastMessage}</span>
            </div>
          </div>
        )}

        {/* SEARCH RESULTS VIEW VS KANBAN rush queue view */}
        {searchQuery.trim() !== "" ? (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-extrabold flex items-center justify-between">
              <span>🔍 Queue & History Search Results ({searchedOrders.length} matching orders)</span>
              <button onClick={() => setSearchQuery("")} className="text-purple-400 hover:text-white font-bold text-[10px] uppercase">✕ Clear Search</button>
            </div>

            {searchedOrders.length === 0 ? (
              <div className="glass-panel p-12 text-center rounded-3xl border-slate-800 space-y-2">
                <Search className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-slate-400 text-xs font-extrabold">No matching orders found in active queue or history.</p>
                <p className="text-[10px] text-slate-500">Check token number spelling or try matching dish names.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchedOrders.map((order) => {
                  const isDelivered = order.status === "FULFILLED";
                  const isRefunded = order.status === "REFUNDED";

                  return (
                    <div
                      key={order.tokenNumber}
                      className={`glass-panel rounded-3xl p-5 border border-slate-800 bg-slate-900/90 shadow-xl space-y-4 relative flex flex-col justify-between ${
                        isDelivered ? "border-emerald-500/30 opacity-80 bg-slate-900/50" : isRefunded ? "border-red-500/30 opacity-60 bg-slate-900/40" : ""
                      }`}
                    >
                      {/* Status overlays */}
                      {isDelivered && (
                        <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-[10px] font-extrabold">
                          ✓ DELIVERED
                        </div>
                      )}
                      {isRefunded && (
                        <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-extrabold">
                          ✕ REFUNDED
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-mono font-black text-orange-400 bg-orange-500/10 px-3.5 py-1 rounded-xl border border-orange-500/30">
                            {order.tokenNumber}
                          </span>
                          <button
                            onClick={() => setSelectedReceiptOrder(order)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 border border-slate-800"
                          >
                            <Receipt className="w-3.5 h-3.5 text-orange-400" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Time & Slot</span>
                          <p className="text-xs text-white font-bold">{order.placedAt} • {order.pickupTimeSlot}</p>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Ordered Items</span>
                          <ul className="space-y-1 bg-slate-950/80 p-3 rounded-2xl border border-slate-850">
                            {order.items.map((it, idx) => (
                              <li key={idx} className={`flex justify-between items-center text-xs font-medium ${it.outOfStock ? 'text-red-400 opacity-70' : 'text-slate-300'}`}>
                                <span className={it.outOfStock ? 'line-through text-slate-500' : ''}>
                                  {it.name} <strong className="text-orange-400">x{it.quantity}</strong>
                                  {it.outOfStock && <span className="ml-2 text-[9px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded font-extrabold">OOS</span>}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] text-slate-500">₹{it.price * it.quantity}</span>
                                  {!it.outOfStock && (order.status === "PLACED" || order.status === "ACCEPTED" || order.status === "COOKING") && (
                                    <button
                                      onClick={() => handleFlagOutOfStock(order.tokenNumber, it.name)}
                                      className="text-[9px] text-red-400 hover:text-red-300 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20"
                                      title="Flag Out of Stock"
                                    >
                                      ✕ OOS
                                    </button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {order.customerNotes && order.customerNotes !== "No notes" && (
                          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-bold leading-relaxed">
                            💡 Note: "{order.customerNotes}"
                          </div>
                        )}
                      </div>

                      {/* Action buttons inside search view */}
                      {!isDelivered && !isRefunded && (
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 mt-3">
                          {order.status === "PARTIAL_HOLD" ? (
                            <div className="w-full text-center py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold animate-pulse col-span-2">
                              ⏳ Awaiting Student Decision...
                            </div>
                          ) : (
                            <>
                              {(order.status === "PLACED" || order.status === "ACCEPTED") && (
                                <button
                                  onClick={() => handleUpdateStatus(order.tokenNumber, "COOKING")}
                                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors col-span-2"
                                >
                                  <ChefHat className="w-4 h-4" />
                                  <span>Accept & Cook Order</span>
                                </button>
                              )}
                              {order.status === "COOKING" && (
                                <button
                                  onClick={() => handleUpdateStatus(order.tokenNumber, "READY")}
                                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors col-span-2"
                                >
                                  <PackageCheck className="w-4 h-4" />
                                  <span>Mark Packed & Ready</span>
                                </button>
                              )}
                              {order.status === "READY" && (
                                <button
                                  onClick={() => handleUpdateStatus(order.tokenNumber, "FULFILLED")}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors col-span-2 shadow-lg shadow-emerald-600/20"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Mark Delivered & Close</span>
                                </button>
                              )}
                              {order.status !== "FULFILLED" && order.status !== "READY" && (
                                <button
                                  onClick={() => handleUpdateStatus(order.tokenNumber, "REFUNDED")}
                                  className="bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Refund</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "ACTIVE" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: NEW INCOMING ORDERS (PLACED) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400 animate-bounce" /> 1. NEW PLACED ({placedOrders.length})
                </span>
                <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded-md">NEEDS ACCEPTANCE</span>
              </div>

              <div className="space-y-4">
                {placedOrders.map((order) => (
                  <div key={order.tokenNumber} className="glass-panel rounded-3xl p-5 border-2 border-amber-500 bg-slate-900/95 ring-2 ring-amber-500/50 shadow-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-mono font-black text-orange-400 bg-orange-500/10 px-3.5 py-1 rounded-xl border border-orange-500/30">
                        {order.tokenNumber}
                      </span>
                      <button onClick={() => setSelectedReceiptOrder(order)} className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 border border-slate-800">
                        <Receipt className="w-3.5 h-3.5 text-orange-400" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300">Placed: <strong className="text-white">{order.placedAt || "Just now"}</strong> • Slot: <strong className="text-white">{order.pickupTimeSlot}</strong></p>

                    <div className="space-y-1 text-xs">
                      {order.items.map((item, idx) => (
                        <div key={idx} className={`flex justify-between items-center bg-slate-950 p-2 rounded-xl border ${item.outOfStock ? 'border-red-500/30 opacity-70' : 'border-slate-850'}`}>
                          <span className={item.outOfStock ? 'line-through text-slate-500' : ''}>
                            <strong className="text-orange-400 font-bold">{item.quantity}x</strong> {item.name}
                            {item.outOfStock && <span className="ml-2 text-[9px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded font-extrabold">OOS</span>}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">₹{item.price * item.quantity}</span>
                            {!item.outOfStock && (
                              <button
                                onClick={() => handleFlagOutOfStock(order.tokenNumber, item.name)}
                                className="text-[9px] text-red-400 hover:text-red-300 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20"
                                title="Flag Out of Stock"
                              >
                                ✕ OOS
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                      {order.status === "PARTIAL_HOLD" ? (
                        <div className="w-full text-center py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold animate-pulse col-span-2">
                          ⏳ Awaiting Student Decision...
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.tokenNumber, "COOKING")}
                            className="btn-primary-gradient py-2.5 rounded-xl font-extrabold text-white shadow-md flex items-center justify-center gap-1"
                          >
                            <Check className="w-4 h-4" /> Accept & Cook
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.tokenNumber, "REFUNDED")}
                            className="bg-red-500/10 border border-red-500/30 text-red-400 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-4 h-4" /> Reject & Refund
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: COOKING IN KITCHEN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-extrabold">
                <span className="flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-orange-400" /> 2. IN KITCHEN COOKING ({cookingOrders.length})
                </span>
                <span className="text-[10px] font-mono bg-orange-500/20 px-2 py-0.5 rounded-md">PREPARATION</span>
              </div>

              <div className="space-y-4">
                {cookingOrders.map((order) => (
                  <div key={order.tokenNumber} className="glass-panel rounded-3xl p-5 border border-orange-500/40 bg-slate-900/90 shadow-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-mono font-black text-orange-400 bg-orange-500/10 px-3 py-1 rounded-xl border border-orange-500/30">
                        {order.tokenNumber}
                      </span>
                      <button onClick={() => setSelectedReceiptOrder(order)} className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 border border-slate-800">
                        <Receipt className="w-3.5 h-3.5 text-orange-400" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-350">Placed: <strong className="text-white">{order.placedAt || "Just now"}</strong> • Slot: <strong className="text-slate-100">{order.pickupTimeSlot}</strong></p>

                    <div className="space-y-1 text-xs">
                      {order.items.map((item, idx) => (
                        <div key={idx} className={`flex justify-between items-center bg-slate-950 p-2 rounded-xl border ${item.outOfStock ? 'border-red-500/30 opacity-70' : 'border-slate-850'}`}>
                          <span className={item.outOfStock ? 'line-through text-slate-500' : ''}>
                            <strong className="text-orange-400 font-bold">{item.quantity}x</strong> {item.name}
                            {item.outOfStock && <span className="ml-2 text-[9px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded font-extrabold">OOS</span>}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">₹{item.price * item.quantity}</span>
                            {!item.outOfStock && (
                              <button
                                onClick={() => handleFlagOutOfStock(order.tokenNumber, item.name)}
                                className="text-[9px] text-red-400 hover:text-red-300 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20"
                                title="Flag Out of Stock"
                              >
                                ✕ OOS
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.status === "PARTIAL_HOLD" ? (
                      <div className="w-full text-center py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold animate-pulse">
                        ⏳ Awaiting Student Decision...
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(order.tokenNumber, "PACKING")}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <PackageCheck className="w-4 h-4" /> Move to Packing (SMS) 📦
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 3: READY FOR COUNTER */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
                <span className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-emerald-400" /> 3. READY FOR COUNTER ({readyOrders.length})
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded-md">COUNTER PICKUP</span>
              </div>

              <div className="space-y-4">
                {readyOrders.map((order) => (
                  <div key={order.tokenNumber} className="glass-panel rounded-3xl p-5 border border-emerald-500/40 bg-slate-950/90 shadow-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-mono font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                        {order.tokenNumber}
                      </span>
                      <button onClick={() => setSelectedReceiptOrder(order)} className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 border border-slate-800">
                        <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-400">Placed: <strong className="text-white">{order.placedAt || "Just now"}</strong> • Slot: <strong className="text-slate-200">{order.pickupTimeSlot}</strong></p>

                    {order.status === "PACKING" ? (
                      <button
                        onClick={() => handleUpdateStatus(order.tokenNumber, "READY")}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Bell className="w-4 h-4" /> Mark Ready (Send SMS) 🔔
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(order.tokenNumber, "FULFILLED")}
                        className="w-full btn-primary-gradient py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/25"
                      >
                        <Check className="w-4 h-4 stroke-[3]" /> Complete & Deliver (Send SMS)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* ARCHIVED DELIVERED & REFUNDED ORDERS */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedOrders.map((order) => (
              <div key={order.tokenNumber} className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-950/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-mono font-extrabold text-slate-300">{order.tokenNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    order.status === "FULFILLED" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400">Total: ₹{order.subtotal}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Digital Receipt Modal */}
      {selectedReceiptOrder && (
        <DigitalReceiptModal
          orderId={selectedReceiptOrder.orderId}
          tokenNumber={selectedReceiptOrder.tokenNumber}
          stallName={selectedReceiptOrder.stallName}
          pickupTimeSlot={selectedReceiptOrder.pickupTimeSlot}
          items={selectedReceiptOrder.items}
          subtotal={selectedReceiptOrder.subtotal}
          customerNotes={selectedReceiptOrder.customerNotes}
          status={selectedReceiptOrder.status}
          onClose={() => setSelectedReceiptOrder(null)}
          onFulfill={() => {
            handleUpdateStatus(selectedReceiptOrder.tokenNumber, "FULFILLED");
            setSelectedReceiptOrder(null);
          }}
        />
      )}
    </div>
  );
}
