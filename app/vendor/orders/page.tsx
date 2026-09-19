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
  Archive,
  Search,
  XCircle,
  Check,
  AlertTriangle,
  Printer,
  Sliders,
  PackageCheck,
  Utensils
} from "lucide-react";
import { ThermalReceiptModal } from "@/components/ThermalReceiptModal";
import { PrinterSettingsModal } from "@/components/PrinterSettingsModal";
import { hardwarePrinter, ThermalSlipData } from "@/lib/hardware-printer";
import { VendorOrdersSkeleton } from "@/components/Skeletons";

export default function VendorOrdersPage() {
  const [mounted, setMounted] = useState(false);
  const [activeVendor, setActiveVendor] = useState<RestaurantAccount | null>(null);
  const [orders, setOrders] = useState<VendorOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<VendorOrderRecord | null>(null);
  const [selectedThermalOrder, setSelectedThermalOrder] = useState<ThermalSlipData | null>(null);
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);
  const [autoPrintKOT, setAutoPrintKOT] = useState<boolean>(true);
  const [autoPrintCancelled, setAutoPrintCancelled] = useState<boolean>(true);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [acknowledgedItems, setAcknowledgedItems] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsub = hardwarePrinter.subscribe(() => {
      setPrinterConnected(hardwarePrinter.getStatus().isConnected);
    });
    setPrinterConnected(hardwarePrinter.getStatus().isConnected);
    hardwarePrinter.tryAutoReconnect();
    return () => unsub();
  }, []);

  const fetchOrdersFromDatabase = async (restaurantId: string) => {
    try {
      const res = await fetch(`/api/orders?restaurantId=${restaurantId}`);
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(prev => {
          const prevIds = new Set(prev.map(o => o.orderId));
          const newOrders = data.orders.filter((o: any) => !prevIds.has(o.orderId));

          if (newOrders.length > 0) {
            const hasNewActive = newOrders.some((o: any) => o.status === "PLACED");
            if (hasNewActive) {
              playChimeSound();
              setToastMessage(`New order — Token ${newOrders[0].tokenNumber}`);
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
      const res = await fetch(`/api/menu?restaurantId=${restaurantId}&lite=true`);
      const data = await res.json();
      if (data.success) {
        setMenuItems(data.items || []);
      }
    } catch (e) {
      console.error("Failed to load menu items inside live orders queue page:", e);
    }
  };

  useEffect(() => {
    let activeRestId: string | null = null;

    const loadVendorDetailsAndOrders = async () => {
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
        console.error("Failed to fetch live restaurant details for orders page:", e);
      }

      activeRestId = currentVendor.id;
      setActiveVendor(currentVendor);
      await Promise.all([
        fetchOrdersFromDatabase(currentVendor.id),
        fetchMenuFromDatabase(currentVendor.id)
      ]);
      setLoading(false);
    };

    loadVendorDetailsAndOrders();

    const interval = setInterval(() => {
      const targetId = activeRestId || (typeof window !== "undefined" ? localStorage.getItem("campusbites_active_vendor_id") : null);
      if (targetId) {
        fetchOrdersFromDatabase(targetId);
        fetchMenuFromDatabase(targetId);
      }
    }, 3000);
    return () => clearInterval(interval);
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

  // Thermal Slip Helper (strictly items, token, time, NO price)
  const createSlipData = (order: VendorOrderRecord, isCancellation = false, cancelReason?: string): ThermalSlipData => ({
    tokenNumber: order.tokenNumber,
    orderId: order.orderId,
    stallName: activeVendor?.name || order.stallName || "Campus Canteen",
    campus: activeVendor?.campus || "Central Campus",
    placedAt: order.placedAt || new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    }),
    pickupTimeSlot: order.pickupTimeSlot,
    studentName: order.studentName,
    studentRegNumber: order.studentRegNumber,
    orderType: order.orderType || (order.isParcel ? "TAKEAWAY" : "DINE_IN"),
    customerNotes: order.customerNotes,
    status: isCancellation ? "CANCELLED" : order.status,
    isCancellation,
    cancelReason,
    items: (order.items || []).map(i => ({
      name: i.name,
      quantity: Number(i.quantity) || 1,
      outOfStock: Boolean(i.outOfStock)
    }))
  });

  // Load auto-print preferences
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKOT = localStorage.getItem("campusbites_autoprint_kot");
      if (savedKOT !== null) setAutoPrintKOT(savedKOT === "true");
      const savedCancel = localStorage.getItem("campusbites_autoprint_cancelled");
      if (savedCancel !== null) setAutoPrintCancelled(savedCancel === "true");
    }
  }, []);

  const toggleAutoPrintKOT = () => {
    setAutoPrintKOT(prev => {
      const next = !prev;
      localStorage.setItem("campusbites_autoprint_kot", String(next));
      return next;
    });
  };

  const toggleAutoPrintCancelled = () => {
    setAutoPrintCancelled(prev => {
      const next = !prev;
      localStorage.setItem("campusbites_autoprint_cancelled", String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!activeVendor) return;
    const socket = getSocket();

    const handleNewOrder = (incoming: any) => {
      fetchOrdersFromDatabase(activeVendor.id);

      if (incoming.vendorPortions) {
        incoming.vendorPortions.forEach((portion: any) => {
          if (portion.stallId === activeVendor.id) {
            playChimeSound();
            setToastMessage(`New order — Token ${portion.tokenNumber}`);
            setTimeout(() => setToastMessage(null), 5000);

            // AUTO-PRINT KITCHEN SLIP (KOT) directly to hardware printer in background (0 clicks)
            if (autoPrintKOT) {
              hardwarePrinter.printSlip({
                tokenNumber: portion.tokenNumber,
                orderId: incoming.orderId,
                stallName: activeVendor.name,
                campus: activeVendor.campus,
                placedAt: incoming.placedAt || new Date().toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                  timeZone: "Asia/Kolkata"
                }),
                pickupTimeSlot: portion.pickupTimeSlot,
                studentName: incoming.studentName,
                studentRegNumber: incoming.studentRegNumber,
                customerNotes: portion.customerNotes,
                status: "PLACED",
                items: (portion.items || []).map((i: any) => ({
                  name: i.name,
                  quantity: Number(i.quantity) || 1,
                  outOfStock: Boolean(i.outOfStock)
                }))
              });
            }
          }
        });
      }
    };

    const handleStatusUpdate = (data: { tokenNumber: string; status: string }) => {
      fetchOrdersFromDatabase(activeVendor.id);
      
      // AUTO-PRINT CANCELLATION SLIP on hardware printer when order cancelled/refunded
      if (data.status === "REFUNDED" && autoPrintCancelled) {
        const target = orders.find(o => o.tokenNumber === data.tokenNumber);
        if (target) {
          hardwarePrinter.printSlip(createSlipData(target, true, "Cancelled by student / Out of stock"));
        }
      }
    };

    socket.on("vendor_new_order", handleNewOrder);
    socket.on("order_status_updated", handleStatusUpdate);

    return () => {
      socket.off("vendor_new_order", handleNewOrder);
      socket.off("order_status_updated", handleStatusUpdate);
    };
  }, [activeVendor, autoPrintKOT, autoPrintCancelled, orders]);

  const handleUpdateStatus = async (tokenNumber: string, newStatus: "CONFIRMED" | "READY" | "FULFILLED" | "REFUNDED") => {
    if (!activeVendor) return;

    const targetOrder = orders.find(o => o.tokenNumber === tokenNumber);

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

    // TRIGGER HARDWARE THERMAL PRINTER (0-click silent execution)
    if (newStatus === "CONFIRMED" && targetOrder) {
      if (autoPrintKOT) {
        hardwarePrinter.printSlip(createSlipData(targetOrder, false));
      }
    } else if (newStatus === "REFUNDED" && targetOrder) {
      if (autoPrintCancelled) {
        hardwarePrinter.printSlip(createSlipData(targetOrder, true, "Rejected / Out of Stock by Kitchen"));
      }
    }

    const userPhone = localStorage.getItem("campusbites_user_phone") || "student@kristujayanti.com";

    let emailText = "";
    if (newStatus === "CONFIRMED") emailText = `Your order ${tokenNumber} has been confirmed and is being prepared`;
    else if (newStatus === "READY") emailText = `Your order ${tokenNumber} is ready for pickup`;
    else if (newStatus === "FULFILLED") emailText = `Your order ${tokenNumber} has been picked up. Thanks for ordering!`;
    else if (newStatus === "REFUNDED") emailText = `Your order ${tokenNumber} was refunded — item unavailable`;

    setToastMessage(`Email sent to ${userPhone}: "${emailText}"`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFlagOutOfStock = async (tokenNumber: string, itemName: string) => {
    if (!activeVendor) return;
    if (!confirm(`Flag "${itemName}" as out of stock for Token ${tokenNumber}? This puts the order on hold and alerts the student.`)) {
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

  if (!mounted || loading || !activeVendor) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-paper text-ink flex flex-col pb-12">
        <VendorNav />
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
          <VendorOrdersSkeleton />
        </main>
      </div>
    );
  }

  const outOfStockItems = menuItems.filter(item => (!item.available || item.stockCount <= 0) && !acknowledgedItems.includes(item.id));

  const activeOrders = orders.filter(o => o.status !== "FULFILLED" && o.status !== "REFUNDED");
  const archivedOrders = orders.filter(o => o.status === "FULFILLED" || o.status === "REFUNDED");

  const newOrders = activeOrders.filter(o => o.status === "PLACED");
  const preparingOrders = activeOrders.filter(o => o.status === "CONFIRMED");
  const readyOrders = activeOrders.filter(o => o.status === "READY");

  const searchedOrders = orders.filter(o =>
    o.tokenNumber.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
    o.items.some(i => i.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
  );

  const ItemsList = ({ order }: { order: VendorOrderRecord }) => (
    <div className="space-y-1 text-xs">
      {order.items.map((item, idx) => (
        <div key={idx} className={`flex justify-between items-center p-2 rounded border ${item.outOfStock ? "border-chili/30 bg-chili-soft opacity-70" : "border-ink/15 bg-paper"}`}>
          <span className={item.outOfStock ? "line-through text-ink-soft" : "text-ink"}>
            <strong className="text-marigold font-mono">{item.quantity}x</strong> {item.name}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-ink-soft">₹{item.price * item.quantity}</span>
            {!item.outOfStock && order.status !== "READY" && (
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => handleFlagOutOfStock(order.tokenNumber, item.name)}
                className="text-[9px] text-chili font-bold bg-chili-soft px-1.5 py-0.5 rounded cursor-pointer"
                title="Flag out of stock"
              >
                OOS
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const OrderMeta = ({ order }: { order: VendorOrderRecord }) => {
    const isParcelOrder = order.isParcel || order.orderType === "TAKEAWAY" || (order.packagingFeeAmount && order.packagingFeeAmount > 0);
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          <p className="text-xs text-ink-soft">
            Placed <strong className="text-ink">{order.placedAt || "just now"}</strong> · Slot <strong className="text-ink">{order.pickupTimeSlot}</strong>
          </p>
          {isParcelOrder ? (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-[10px] font-black tracking-wide flex items-center gap-1 shadow-sm">
              <PackageCheck className="w-3.5 h-3.5" /> PARCEL / TAKEAWAY
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30 text-[10px] font-bold tracking-wide flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5" /> DINE-IN
            </span>
          )}
        </div>
        {(order.studentName || order.studentRegNumber) && (
          <p className="text-xs text-ink-soft">
            {order.studentName || "—"} <span className="font-mono">({order.studentRegNumber || "—"})</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div suppressHydrationWarning className="min-h-screen bg-paper text-ink flex flex-col pb-12">
      <VendorNav />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {outOfStockItems.length > 0 && (
              <div className="card-surface p-4 border-chili/30 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-chili" />
                    <span className="text-sm font-bold text-chili">{outOfStockItems.length} item(s) out of stock</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {outOfStockItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 bg-chili-soft px-3 py-1.5 rounded text-xs">
                      <span className="font-bold text-chili">{item.name}</span>
                      <button onClick={() => setAcknowledgedItems(prev => [...prev, item.id])} className="text-chili/80 hover:text-chili font-bold underline">
                        Acknowledge
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-ink">{activeVendor.name} — Orders</h1>
                <p className="text-xs text-ink-soft">Live queue with Essae PR-55 thermal printer auto-dispatch</p>
              </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Hardware Printer Pairing Button */}
            <button
              onClick={() => setIsPrinterSettingsOpen(true)}
              className={`px-3 py-2 rounded border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                printerConnected
                  ? "bg-sage-soft border-sage/40 text-sage hover:bg-sage hover:text-white"
                  : "bg-cardstock border-ink/15 text-ink-soft hover:text-ink hover:border-marigold"
              }`}
              title="Configure USB (WebSerial) / Bluetooth thermal receipt printer for 0-click silent printing"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${printerConnected ? "bg-sage animate-pulse" : "bg-ink-soft/40"}`} />
                {printerConnected ? "Printer: Ready" : "Pair Printer"}
              </span>
            </button>

            {/* Auto-print toggles */}
            <div className="flex items-center gap-1.5 bg-cardstock p-1 rounded border border-ink/15 text-xs font-bold">
              <button
                type="button"
                onClick={toggleAutoPrintKOT}
                className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  autoPrintKOT ? "bg-marigold text-white shadow-sm" : "text-ink-soft hover:text-ink"
                }`}
                title="Automatically print Kitchen Order Tickets (KOT) when order arrives or is confirmed"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Auto KOT: {autoPrintKOT ? "ON" : "OFF"}</span>
              </button>
              <button
                type="button"
                onClick={toggleAutoPrintCancelled}
                className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                  autoPrintCancelled ? "bg-chili text-white shadow-sm" : "text-ink-soft hover:text-ink"
                }`}
                title="Automatically print cancellation slips when user cancels or order is out of stock"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Auto Cancel: {autoPrintCancelled ? "ON" : "OFF"}</span>
              </button>
            </div>

            {/* View tab toggles */}
            <div className="flex items-center gap-1.5 bg-cardstock p-1 rounded border border-ink/15 text-xs font-bold">
              <button
                onClick={() => { setActiveTab("ACTIVE"); setSearchQuery(""); }}
                className={`px-4 py-2 rounded transition-all flex items-center gap-1.5 ${
                  activeTab === "ACTIVE" && searchQuery.trim() === "" ? "bg-marigold text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                Active ({activeOrders.length})
              </button>
              <button
                onClick={() => { setActiveTab("ARCHIVED"); setSearchQuery(""); }}
                className={`px-4 py-2 rounded transition-all flex items-center gap-1.5 ${
                  activeTab === "ARCHIVED" && searchQuery.trim() === "" ? "bg-marigold text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                <Archive className="w-3.5 h-3.5" /> History ({archivedOrders.length})
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by token number or dish name..."
            className="w-full bg-cardstock border border-ink/15 rounded pl-10 pr-4 py-2.5 text-xs text-ink placeholder-ink-soft/70 focus:outline-none focus:border-b-2 focus:border-b-marigold"
          />
        </div>

        {toastMessage && (
          <div className="card-surface p-3.5 border-marigold/40 text-xs font-bold text-ink flex items-center gap-2">
            <Bell className="w-4 h-4 text-marigold shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {searchQuery.trim() !== "" ? (
          <div className="space-y-4">
            {searchedOrders.length === 0 ? (
              <div className="card-surface p-12 text-center space-y-2">
                <Search className="w-8 h-8 text-ink-soft mx-auto" />
                <p className="text-ink-soft text-xs font-bold">No matching orders.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchedOrders.map((order) => {
                  const isDelivered = order.status === "FULFILLED";
                  const isRefunded = order.status === "REFUNDED";
                  return (
                    <div key={order.tokenNumber} className="card-surface p-5 space-y-3 relative">
                      {isDelivered && <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-sage-soft text-sage text-[10px] font-bold">DELIVERED</span>}
                      {isRefunded && <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-chili-soft text-chili text-[10px] font-bold">REFUNDED</span>}

                      <div className="flex justify-between items-center">
                        <span className="text-lg font-mono font-bold text-marigold">{order.tokenNumber}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedThermalOrder(createSlipData(order, isRefunded))}
                            className="text-ink-soft hover:text-marigold p-1.5 rounded bg-paper border border-ink/15 transition-colors cursor-pointer"
                            title="Print Essae PR-55 Thermal Slip (KOT - No Price)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setSelectedReceiptOrder(order)} 
                            className="text-ink-soft hover:text-marigold p-1.5 rounded bg-paper border border-ink/15 transition-colors cursor-pointer"
                            title="Digital Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <OrderMeta order={order} />
                      <ItemsList order={order} />

                      {!isDelivered && !isRefunded && (
                        order.status === "PARTIAL_HOLD" ? (
                          <div className="w-full text-center py-2.5 rounded bg-marigold/10 text-marigold text-xs font-bold">Awaiting student decision…</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            {order.status === "PLACED" && (
                              <>
                                <button onClick={() => handleUpdateStatus(order.tokenNumber, "CONFIRMED")} className="bg-marigold hover:bg-marigold-hover text-white py-2 text-xs font-bold rounded flex items-center justify-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Confirm
                                </button>
                                <button onClick={() => handleUpdateStatus(order.tokenNumber, "REFUNDED")} className="bg-chili-soft text-chili py-2 text-xs font-bold rounded flex items-center justify-center gap-1">
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              </>
                            )}
                            {order.status === "CONFIRMED" && (
                              <button onClick={() => handleUpdateStatus(order.tokenNumber, "READY")} className="col-span-2 bg-marigold hover:bg-marigold-hover text-white py-2 text-xs font-bold rounded flex items-center justify-center gap-1">
                                <Bell className="w-3.5 h-3.5" /> Mark Ready
                              </button>
                            )}
                            {order.status === "READY" && (
                              <button onClick={() => handleUpdateStatus(order.tokenNumber, "FULFILLED")} className="col-span-2 bg-sage hover:opacity-90 text-white py-2 text-xs font-bold rounded flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Picked Up
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "ACTIVE" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* NEW */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded bg-marigold/10 text-marigold text-xs font-bold">
                <span>New ({newOrders.length})</span>
              </div>
              <div className="space-y-3">
                {newOrders.map((order) => (
                  <div key={order.tokenNumber} className="card-surface p-4 border-marigold/40 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-mono font-bold text-marigold">{order.tokenNumber}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedThermalOrder(createSlipData(order, false))}
                          className="text-ink-soft hover:text-marigold p-1.5 rounded bg-paper border border-ink/15 transition-colors cursor-pointer"
                          title="Print Essae PR-55 Thermal Slip (KOT - No Price)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setSelectedReceiptOrder(order)} className="text-ink-soft hover:text-marigold p-1.5 rounded bg-paper border border-ink/15 transition-colors cursor-pointer">
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <OrderMeta order={order} />
                    <ItemsList order={order} />
                    {order.status === "PARTIAL_HOLD" ? (
                      <div className="w-full text-center py-2 rounded bg-marigold/10 text-marigold text-[11px] font-bold">Awaiting student decision…</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button onClick={() => handleUpdateStatus(order.tokenNumber, "CONFIRMED")} className="bg-marigold hover:bg-marigold-hover text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                          <Check className="w-3.5 h-3.5" /> Confirm
                        </button>
                        <button onClick={() => handleUpdateStatus(order.tokenNumber, "REFUNDED")} className="bg-chili-soft text-chili py-2 rounded text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PREPARING */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded bg-cardstock text-ink-soft text-xs font-bold">
                <span className="flex items-center gap-1.5"><ChefHat className="w-3.5 h-3.5" /> Preparing ({preparingOrders.length})</span>
              </div>
              <div className="space-y-3">
                {preparingOrders.map((order) => (
                  <div key={order.tokenNumber} className="card-surface p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-mono font-bold text-marigold">{order.tokenNumber}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedThermalOrder(createSlipData(order, false))}
                          className="text-ink-soft hover:text-marigold p-1.5 rounded bg-paper border border-ink/15 transition-colors cursor-pointer"
                          title="Print Essae PR-55 Thermal Slip (KOT - No Price)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setSelectedReceiptOrder(order)} className="text-ink-soft hover:text-marigold p-1.5 rounded bg-paper border border-ink/15 transition-colors cursor-pointer">
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <OrderMeta order={order} />
                    <ItemsList order={order} />
                    {order.status === "PARTIAL_HOLD" ? (
                      <div className="w-full text-center py-2 rounded bg-marigold/10 text-marigold text-[11px] font-bold">Awaiting student decision…</div>
                    ) : (
                      <button onClick={() => handleUpdateStatus(order.tokenNumber, "READY")} className="w-full bg-marigold hover:bg-marigold-hover text-white py-2.5 rounded text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                        <Bell className="w-4 h-4" /> Mark Ready
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* READY */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded bg-sage-soft text-sage text-xs font-bold">
                <span className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" /> Ready for Pickup ({readyOrders.length})</span>
              </div>
              <div className="space-y-3">
                {readyOrders.map((order) => (
                  <div key={order.tokenNumber} className="card-surface p-4 border-sage/40 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-mono font-bold text-sage">{order.tokenNumber}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedThermalOrder(createSlipData(order, false))}
                          className="text-ink-soft hover:text-sage p-1.5 rounded bg-paper border border-ink/15 transition-colors cursor-pointer"
                          title="Print Essae PR-55 Thermal Slip (KOT - No Price)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setSelectedReceiptOrder(order)} className="text-ink-soft hover:text-sage p-1.5 rounded bg-paper border border-ink/15 transition-colors cursor-pointer">
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <OrderMeta order={order} />
                    <button onClick={() => handleUpdateStatus(order.tokenNumber, "FULFILLED")} className="w-full bg-sage hover:opacity-90 transition-opacity text-white py-2.5 rounded text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                      <CheckCircle2 className="w-4 h-4" /> Picked Up / Delivered
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedOrders.map((order) => (
              <div key={order.tokenNumber} className="card-surface p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono font-bold text-ink">{order.tokenNumber}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${order.status === "FULFILLED" ? "bg-sage-soft text-sage" : "bg-chili-soft text-chili"}`}>
                      {order.status === "FULFILLED" ? "Delivered" : "Refunded / Cancelled"}
                    </span>
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => setSelectedThermalOrder(createSlipData(order, order.status === "REFUNDED", order.status === "REFUNDED" ? "Refunded / Cancelled Order" : undefined))}
                      className="text-ink-soft hover:text-marigold p-1 rounded bg-paper border border-ink/15 transition-colors cursor-pointer"
                      title="Reprint Thermal Slip"
                    >
                      <Printer className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <OrderMeta order={order} />
                <ItemsList order={order} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* DIGITAL RECEIPT MODAL */}
      {selectedReceiptOrder && (
        <DigitalReceiptModal
          orderId={selectedReceiptOrder.orderId}
          tokenNumber={selectedReceiptOrder.tokenNumber}
          stallName={selectedReceiptOrder.stallName}
          pickupTimeSlot={selectedReceiptOrder.pickupTimeSlot}
          items={selectedReceiptOrder.items}
          subtotal={selectedReceiptOrder.subtotal}
          customerNotes={selectedReceiptOrder.customerNotes}
          studentName={selectedReceiptOrder.studentName}
          studentRegNumber={selectedReceiptOrder.studentRegNumber}
          orderType={selectedReceiptOrder.orderType || (selectedReceiptOrder.isParcel ? "TAKEAWAY" : "DINE_IN")}
          status={selectedReceiptOrder.status}
          onClose={() => setSelectedReceiptOrder(null)}
          onFulfill={() => {
            handleUpdateStatus(selectedReceiptOrder.tokenNumber, "FULFILLED");
            setSelectedReceiptOrder(null);
          }}
        />
      )}

      {/* ESSAE PR-55 THERMAL RECEIPT MODAL */}
      {selectedThermalOrder && (
        <ThermalReceiptModal
          order={selectedThermalOrder}
          onClose={() => setSelectedThermalOrder(null)}
        />
      )}

      {/* HARDWARE PRINTER PAIRING & SETTINGS MODAL */}
      <PrinterSettingsModal
        isOpen={isPrinterSettingsOpen}
        onClose={() => setIsPrinterSettingsOpen(false)}
      />
    </div>
  );
}
