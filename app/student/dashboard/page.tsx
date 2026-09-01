"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { useCart } from "@/context/CartContext";
import { getStoredRestaurants, RestaurantAccount } from "@/lib/restaurants-data";
import { PageLoader } from "@/components/PageLoader";
import { getSocket } from "@/lib/socket-client";
import { VendorOffer } from "@/app/vendor/menu/page";
import { 
  Search, 
  Star, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  Store, 
  MapPin,
  Utensils,
  Building2,
  Tag,
  Leaf,
  Flame,
  TrendingUp,
  Receipt,
  RotateCcw,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
  Minus
} from "lucide-react";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { totalCount, totalAmount, addToCart, removeFromCart, clearCart, cartItems } = useCart();
  const [restaurants, setRestaurants] = useState<RestaurantAccount[]>([]);
  const [offers, setOffers] = useState<VendorOffer[]>([]);
  const [discountItems, setDiscountItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [floorFilter, setFloorFilter] = useState<string>("ALL");
  const [selectedCampus, setSelectedCampus] = useState("Airport Road Campus");
  const [canteenLoading, setCanteenLoading] = useState<string | null>(null);

  const handleRedirectToRestaurant = (stallId: string, stallName: string) => {
    setCanteenLoading(stallName);
    router.push(`/student/vendor/${stallId}`);
  };

  // Tab State: BROWSE canteens vs MY_ORDERS history
  const [activeTab, setActiveTab] = useState<"BROWSE" | "ORDERS">("BROWSE");
  const [studentOrders, setStudentOrders] = useState<any[]>([]);
  const [studentEmail, setStudentEmail] = useState("");

  const fetchStudentOrders = async (email: string) => {
    try {
      const res = await fetch(`/api/orders?studentEmail=${email}`);
      const data = await res.json();
      if (data.success) {
        setStudentOrders(data.orders);
      }
    } catch (e) {
      console.error("Failed to load student orders:", e);
    }
  };

  const fetchLiveRestaurants = async () => {
    try {
      const res = await fetch(`/api/restaurants?t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.restaurants) {
        setRestaurants(data.restaurants);
      } else {
        setRestaurants(getStoredRestaurants());
      }
    } catch (e) {
      setRestaurants(getStoredRestaurants());
    }
  };

  useEffect(() => {
    fetchLiveRestaurants();

    const email = localStorage.getItem("campusbites_user_phone") || "";
    setStudentEmail(email);
    if (email) {
      fetchStudentOrders(email);
    }

    const savedCampus = localStorage.getItem("campusbites_student_campus");
    if (savedCampus) {
      setSelectedCampus(savedCampus);
    }

    try {
      const savedOffers = localStorage.getItem("campusbites_all_offers");
      if (savedOffers) {
        setOffers(JSON.parse(savedOffers));
      } else {
        setOffers([]);
      }
    } catch (e) {}

    // Subscribe to real-time menu/discount updates
    try {
      const socket = getSocket();
      socket.on("menu_update", () => {
        fetchLiveRestaurants();
      });
      return () => {
        socket.off("menu_update");
      };
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const loadDiscountItems = async () => {
      if (restaurants.length === 0) return;
      
      const activeCampusRestaurants = restaurants.filter(
        r => (r.campus || "Airport Road Campus") === selectedCampus
      );

      const allDiscounts: any[] = [];
      for (const r of activeCampusRestaurants) {
        try {
          const res = await fetch(`/api/menu?restaurantId=${r.id}`);
          const data = await res.json();
          if (data.success && data.items) {
            const promoItems = data.items.filter((item: any) => 
              item.offerType && item.offerType !== "NONE" && item.offerValue && item.offerValue > 0
            ).map((item: any) => ({
              ...item,
              stallId: r.id,
              stallName: r.name,
              stallInitials: r.tokenPrefix.replace("KJU-", ""),
              campus: r.campus
            }));
            allDiscounts.push(...promoItems);
          }
        } catch (e) {
          console.error("Error loading promo items for stall " + r.id, e);
        }
      }
      setDiscountItems(allDiscounts);
    };

    loadDiscountItems();
  }, [restaurants, selectedCampus]);

  const handleReorder = async (order: any) => {
    // 1. Clear cart
    clearCart();

    // 2. Loop portions and items to re-add to cart
    for (const portion of order.vendorPortions) {
      for (const item of portion.items) {
        // Resolve item fields, generate a unique key
        const generatedId = item.id || `re-${item.name.toLowerCase().replace(/\s+/g, '-')}`;
        for (let q = 0; q < item.quantity; q++) {
          addToCart({
            id: generatedId,
            name: item.name,
            price: item.price,
            stallId: portion.stallId,
            stallName: portion.stallName,
            stallInitials: portion.stallId.replace("vendor-", "STALL-"),
            isVeg: true,
            category: "Veg",
            prepTime: "10 mins"
          });
        }
      }
    }

    // 3. Direct to Cart
    router.push("/student/cart");
  };

  let filtered = restaurants.filter(r => 
    ((r.campus || "Central Campus") === selectedCampus) && (
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (floorFilter !== "ALL") {
    filtered = filtered.filter(r => r.floor === floorFilter);
  }

  return (
    <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col pb-24 sm:pb-12">
      <Navbar 
        cartCount={totalCount} 
        selectedCampus={selectedCampus}
        onCampusChange={(newCampus) => {
          setSelectedCampus(newCampus);
          localStorage.setItem("campusbites_student_campus", newCampus);
        }}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 space-y-8">
        {/* Banner */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-slate-900/90 relative overflow-hidden">
          <div className="max-w-xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 fill-orange-400" />
              <span>Campus Pre-Order Pass • Skip Canteen Lines</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Pre-Order Food Across Campus Canteen Floors 🍔
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Browse open stalls, select your 15-minute lecture break slot, and receive live SMS progress updates!
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-3 bg-slate-950 p-1 rounded-2xl border border-slate-850 w-full sm:w-80 text-xs font-bold">
          <button
            onClick={() => setActiveTab("BROWSE")}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === "BROWSE" 
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                : "text-slate-400 hover:text-white"
            }`}
            suppressHydrationWarning={true}
          >
            Browse Canteens
          </button>
          <button
            onClick={() => {
              setActiveTab("ORDERS");
              if (studentEmail) fetchStudentOrders(studentEmail);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === "ORDERS" 
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                : "text-slate-400 hover:text-white"
            }`}
            suppressHydrationWarning={true}
          >
            My Orders ({studentOrders.length})
          </button>
        </div>

        {activeTab === "BROWSE" ? (
          <>
            {/* HOT DISCOUNTS SECTION */}
            {discountItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <h2 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" /> 
                    Today's Hot Deals & Offers!
                  </h2>
                  <span className="text-[10px] bg-purple-500/10 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                    {discountItems.length} Deals Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {discountItems.map((item) => {
                    const hasOffer = item.offerType && item.offerType !== "NONE" && item.offerValue && item.offerValue > 0;
                    const finalPrice = hasOffer
                      ? item.offerType === "PERCENTAGE"
                        ? Math.max(0, item.price - (item.price * (item.offerValue || 0) / 100))
                        : Math.max(0, item.price - (item.offerValue || 0))
                      : item.price;
                    
                    const itemInCart = cartItems.find((ci) => ci.id === item.id);
                    const qty = itemInCart ? itemInCart.quantity : 0;

                    return (
                      <div 
                        key={item.id} 
                        className="glass-panel p-4 rounded-3xl border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 shadow-xl hover:border-purple-550/30 transition-all relative overflow-hidden group"
                      >
                        {/* Swiggy Style Attractive Tag */}
                        {hasOffer && (
                          <div className="absolute top-0 left-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-br-2xl shadow-lg z-10 flex items-center gap-1">
                            <Tag className="w-3 h-3 text-white" />
                            {item.offerType === "PERCENTAGE" ? `${item.offerValue}% OFF` : `₹${item.offerValue} OFF`}
                          </div>
                        )}

                        <div className="space-y-1.5 flex-1 pr-2 pt-4">
                          <span className="text-[9px] text-slate-500 font-mono block">From {item.stallName}</span>
                          <h3 className="text-xs font-black text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                            {item.name}
                          </h3>
                          
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-[10px] text-slate-500 line-through">₹{item.price.toFixed(2)}</span>
                            <span className="text-xs font-black text-orange-400">₹{finalPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-2 shrink-0 pt-2">
                          <img src={item.image} alt={item.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-800 shadow-md group-hover:scale-105 transition-transform" />
                          
                          {qty === 0 ? (
                            <button
                              onClick={() => addToCart({
                                id: item.id,
                                name: item.name,
                                price: finalPrice,
                                originalPrice: item.price,
                                stallId: item.stallId,
                                stallName: item.stallName,
                                stallInitials: item.stallInitials,
                                isVeg: item.isVeg,
                                category: item.category,
                                prepTime: `${item.prepTime} mins`,
                                takeawayCharge: item.takeawayCharge || 10,
                                campus: item.campus
                              })}
                              className="px-3 py-1 rounded-xl text-[10px] font-black text-orange-400 bg-orange-500/10 hover:bg-orange-500 hover:text-white border border-orange-500/30 transition-all shadow-md cursor-pointer flex items-center gap-0.5"
                            >
                              <Plus className="w-3 h-3" /> ADD
                            </button>
                          ) : (
                            <div className="flex items-center bg-orange-500 text-white rounded-lg p-0.5 font-bold text-[10px] shadow-md">
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="w-5 h-5 rounded-md bg-orange-600 hover:bg-orange-700 flex items-center justify-center transition-colors"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="px-1.5 font-mono">{qty}</span>
                              <button 
                                onClick={() => addToCart({
                                  id: item.id,
                                  name: item.name,
                                  price: finalPrice,
                                  originalPrice: item.price,
                                  stallId: item.stallId,
                                  stallName: item.stallName,
                                  stallInitials: item.stallInitials,
                                  isVeg: item.isVeg,
                                  category: item.category,
                                  prepTime: `${item.prepTime} mins`,
                                  takeawayCharge: item.takeawayCharge || 10,
                                  campus: item.campus
                                })}
                                className="w-5 h-5 rounded-md bg-orange-600 hover:bg-orange-700 flex items-center justify-center transition-colors"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CAMPUS OFFERS & COMBO DEALS CAROUSEL BANNER */}
            {offers.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-400" /> Active Campus Special Offers & Combos
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offers.map((offer) => (
                    <div 
                      key={offer.id} 
                      className="glass-panel p-5 rounded-3xl border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-slate-950/80 flex justify-between items-center gap-4 hover:border-purple-500/50 transition-colors shadow-lg"
                    >
                      <div className="space-y-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-black tracking-wider uppercase">
                          {offer.discountBadge}
                        </span>
                        <h3 className="text-sm font-extrabold text-white">{offer.title}</h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{offer.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg font-black text-purple-400 block">₹{offer.price}</span>
                        <span className="text-[9px] text-slate-500 font-mono">Special combo price</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Floor Selection Quick Chips */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-400" /> Filter by Canteen Floor Location
              </h2>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                {["ALL", "Ground Floor", "1st Floor", "2nd Floor", "3rd Floor"].map((floor) => (
                  <button
                    key={floor}
                    onClick={() => setFloorFilter(floor)}
                    className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                      floorFilter === floor 
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                    suppressHydrationWarning={true}
                  >
                    {floor === "ALL" ? "All Canteens" : floor}
                  </button>
                ))}
              </div>
            </div>

            {/* Canteen Stalls Grid */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-3">
                <div className="space-y-1">
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-orange-400" /> Open Campus Canteens
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Showing canteens for your selected campus. Change your location in the top menu bar if needed.
                  </p>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by stall name or food..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    suppressHydrationWarning={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map((stall) => (
                  <button 
                    key={stall.id} 
                    onClick={() => handleRedirectToRestaurant(stall.id, stall.name)}
                    className="glass-panel p-5 rounded-3xl border-slate-800 hover:border-slate-700 transition-all shadow-lg flex items-center justify-between gap-4 group w-full text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img src={stall.logo} alt={stall.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-800 shrink-0 group-hover:scale-105 transition-transform" />
                      
                      <div className="space-y-1 truncate">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-mono font-bold">
                            {stall.tokenPrefix}
                          </span>
                          {stall.isOpen === false ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-black uppercase tracking-wider">
                              Closed
                            </span>
                          ) : stall.type === "PURE_VEG" ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold flex items-center gap-1">
                              <Leaf className="w-3.5 h-3.5 text-emerald-400" /> PURE VEG
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold">
                              MIXED
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-extrabold text-white group-hover:text-orange-400 transition-colors truncate">{stall.name}</h3>
                        <p className="text-xs text-slate-400 truncate">{stall.cuisine}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                          📍 {stall.location} • <Building2 className="w-3 h-3 text-purple-400" /> {stall.floor}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        <Star className="w-3.5 h-3.5 fill-amber-400" /> {stall.rating}
                      </span>
                      <span className="text-[9px] text-slate-500 mt-1 block">10 mins prep</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* MY ORDERS HISTORY TAB */
          <div className="space-y-6">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-orange-400" /> Previous & Current Orders
            </h2>

            {studentOrders.length === 0 ? (
              <div className="glass-panel p-8 rounded-3xl text-center space-y-4 border-slate-800">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Orders Placed Yet</h3>
                <p className="text-xs text-slate-400">You haven't ordered anything yet! Head back to canteens to buy delicious food.</p>
                <button
                  onClick={() => setActiveTab("BROWSE")}
                  className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold text-white"
                >
                  Browse Menu Stalls
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {studentOrders.map((order) => (
                  <div 
                    key={order.orderId} 
                    className="glass-panel rounded-3xl p-6 border border-slate-850 bg-slate-900/95 shadow-xl space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-lg border border-orange-500/25">
                            {order.masterToken}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" /> {order.placedAt}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block mt-1">ID: {order.orderId}</span>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-sm font-black text-white">₹{order.totalAmount}</span>
                        <button
                          onClick={() => handleReorder(order)}
                          className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-orange-500/20"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reorder Feast
                        </button>
                      </div>
                    </div>

                    {/* Portions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {order.vendorPortions.map((portion: any, idx: number) => {
                        let statusColor = "bg-amber-500/20 text-amber-400 border-amber-500/40";
                        if (portion.status === "READY") statusColor = "bg-purple-500/20 text-purple-300 border-purple-500/40";
                        if (portion.status === "FULFILLED") statusColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
                        if (portion.status === "REFUNDED") statusColor = "bg-red-500/20 text-red-400 border-red-500/40";

                        return (
                          <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-extrabold text-white">{portion.stallName}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusColor}`}>
                                  {portion.status}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 block">Stall Token: <strong className="text-slate-300 font-bold">{portion.tokenNumber}</strong></span>
                              <span className="text-[10px] text-slate-500 block">Pickup Slot: <strong className="text-slate-300 font-bold">{portion.pickupTimeSlot}</strong></span>
                            </div>

                            <div className="space-y-1 pt-2 border-t border-slate-900">
                              {portion.items.map((it: any, itemIdx: number) => (
                                <div key={itemIdx} className="flex justify-between text-[11px] text-slate-400">
                                  <span>{it.quantity}x {it.name}</span>
                                  <span>₹{it.price * it.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav cartCount={totalCount} cartTotal={totalAmount} />

      {canteenLoading && (
        <PageLoader 
          message={`Entering ${canteenLoading}`} 
          submessage="Loading fresh stall menu options & active prep slots..." 
          type="canteen" 
        />
      )}
    </div>
  );
}
