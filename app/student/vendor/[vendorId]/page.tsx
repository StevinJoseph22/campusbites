"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { PageLoader } from "@/components/PageLoader";
import { useCart } from "@/context/CartContext";
import { getStoredRestaurants, RestaurantAccount } from "@/lib/restaurants-data";
import { getSocket } from "@/lib/socket-client";
import { MenuItem } from "@/app/vendor/menu/page";
import { 
  Store, 
  Star, 
  Clock, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Search, 
  Check, 
  Flame,
  Leaf,
  Building2,
  AlertTriangle,
  Tag
} from "lucide-react";

export default function StudentVendorPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const vendorId = (params?.vendorId as string) || "vendor-1";
  const [selectedCampus, setSelectedCampus] = useState("Airport Road Campus");

  useEffect(() => {
    const saved = localStorage.getItem("campusbites_student_campus");
    if (saved) setSelectedCampus(saved);
  }, []);
  
  const { cartItems, totalCount, totalAmount, addToCart, removeFromCart } = useCart();
  const [stall, setStall] = useState<RestaurantAccount | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [filterVeg, setFilterVeg] = useState<"ALL" | "VEG" | "NON_VEG">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMenuFromDatabase = async (restaurantId: string) => {
    try {
      const res = await fetch(`/api/menu?restaurantId=${restaurantId}&t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (e) {
      console.error("Failed to fetch menu from database:", e);
    }
  };

  useEffect(() => {
    const fetchStallAndMenu = async () => {
      try {
        const res = await fetch(`/api/restaurants?t=${Date.now()}`);
        const data = await res.json();
        if (data.success && data.restaurants) {
          const found = data.restaurants.find((r: any) => r.id === vendorId);
          if (found) {
            setStall(found);
            fetchMenuFromDatabase(found.id);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to fetch live restaurant for details:", e);
      }

      // Local storage fallback
      const list = getStoredRestaurants();
      const found = list.find(r => r.id === vendorId) || list[0];
      setStall(found);
      if (found) {
        fetchMenuFromDatabase(found.id);
      }
    };

    fetchStallAndMenu();

    // Subscribe to real-time menu updates
    try {
      const socket = getSocket();
      socket.on("menu_update", (data: any) => {
        if (!data || data.restaurantId === vendorId) {
          fetchStallAndMenu();
        }
      });
      return () => {
        socket.off("menu_update");
      };
    } catch (e) {
      console.error(e);
    }
  }, [vendorId]);

  if (!stall) return null;

  const filteredItems = items.filter(item => {
    if (filterVeg === "VEG" && !item.isVeg) return false;
    if (filterVeg === "NON_VEG" && item.isVeg) return false;
    if (searchQuery.trim() && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getItemQuantity = (itemId: string) => {
    const found = cartItems.find(i => i.id === itemId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col pb-24 sm:pb-12">
      <Navbar 
        cartCount={totalCount} 
        selectedCampus={selectedCampus}
        onCampusChange={(newCampus) => {
          localStorage.setItem("campusbites_student_campus", newCampus);
          router.push("/student/dashboard");
        }}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 space-y-6">
        <button 
          onClick={() => {
            setIsLoadingDashboard(true);
            router.push("/student/dashboard");
          }}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Canteen Stalls
        </button>

        {/* Vendor Header */}
        <div className="glass-panel p-6 rounded-3xl border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={stall.logo} alt={stall.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-orange-500/30 shrink-0" />
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold">
                  {stall.tokenPrefix}
                </span>
                {stall.type === "PURE_VEG" ? (
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-extrabold flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-emerald-400" /> PURE VEG
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-extrabold border border-slate-700">
                    MIXED
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-extrabold flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-purple-400" /> {stall.floor}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{stall.name}</h1>
              <p className="text-xs text-slate-400">📍 {stall.location}</p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
            <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
              <Star className="w-4 h-4 fill-amber-400" /> {stall.rating}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> Avg Prep: 10 mins
            </span>
          </div>
        </div>

        {stall.isOpen === false && (
          <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-300">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="font-extrabold text-sm text-white">Stall Currently Closed</p>
              <p className="text-slate-400 font-medium mt-0.5">This canteen is currently closed. You can view the menu, but ordering & cart additions are locked.</p>
            </div>
          </div>
        )}

        {/* Search & Filter Chips */}
        <div className="glass-panel p-4 rounded-2xl border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes in menu..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto text-xs font-bold">
            <button
              onClick={() => setFilterVeg("ALL")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterVeg === "ALL" 
                  ? "bg-orange-500 text-white shadow-md" 
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilterVeg("VEG")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                filterVeg === "VEG" 
                  ? "bg-emerald-600 text-white shadow-md" 
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Leaf className="w-3.5 h-3.5 text-emerald-400" /> Pure Veg
            </button>
            <button
              onClick={() => setFilterVeg("NON_VEG")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                filterVeg === "NON_VEG" 
                  ? "bg-red-600 text-white shadow-md" 
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-red-400" /> Non-Veg
            </button>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map((item) => {
            const qty = getItemQuantity(item.id);
            const remainingStock = item.stockType === "COUNTED" ? Math.max(0, item.stockCount - qty) : 999;
            const isLowStock = item.stockType === "COUNTED" && remainingStock > 0 && remainingStock <= 5;
            const isOutOfStock = !item.available || (item.stockType === "COUNTED" && remainingStock <= 0);

            const hasOffer = item.offerType && item.offerType !== "NONE" && item.offerValue && item.offerValue > 0;
            const finalPrice = hasOffer
              ? item.offerType === "PERCENTAGE"
                ? Math.max(0, item.price - (item.price * (item.offerValue || 0) / 100))
                : Math.max(0, item.price - (item.offerValue || 0))
              : item.price;

            return (
              <div 
                key={item.id} 
                className="glass-panel rounded-3xl p-5 border-slate-800 flex flex-col sm:flex-row gap-4 justify-between hover:border-slate-700 transition-all shadow-xl"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                      item.isVeg ? "border-emerald-500" : "border-red-500"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-emerald-500" : "bg-red-500"}`} />
                    </span>
                    <h3 className="text-base font-bold text-white">{item.name}</h3>

                    {/* SWIGGY STYLE OFFER BADGE */}
                    {hasOffer && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 border border-purple-500/50 text-white text-[10px] font-black tracking-wide uppercase shadow-lg shadow-purple-950/40 animate-pulse flex items-center gap-1">
                        <Tag className="w-3 h-3 text-white" />
                        {item.offerType === "PERCENTAGE" ? `${item.offerValue}% OFF` : `₹${item.offerValue} OFF`}
                      </span>
                    )}

                    {/* LOW STOCK WARNING BADGE */}
                    {isLowStock && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-extrabold flex items-center gap-1 animate-bounce">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>🔥 Only {remainingStock} Left!</span>
                      </span>
                    )}

                    {item.stockType === "UNLIMITED" && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
                        ⚡ Live Fresh Prep
                      </span>
                    )}

                    {item.availableFrom && item.availableFrom !== "10:00 AM" && (
                      <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/40 text-sky-300 text-[10px] font-bold flex items-center gap-1">
                        <span>⏰ Lunch: after {item.availableFrom} only</span>
                      </span>
                    )}

                    {isOutOfStock && (
                      <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                  
                  <div className="pt-1 flex items-center gap-3 font-mono">
                    {hasOffer ? (
                      <>
                        <span className="text-[11px] text-slate-500 line-through">₹{item.price.toFixed(2)}</span>
                        <span className="text-sm font-extrabold text-orange-400">₹{finalPrice.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-sm font-extrabold text-orange-400">₹{item.price.toFixed(2)}</span>
                    )}
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-sans">
                      <Clock className="w-3 h-3 text-slate-500" /> {item.prepTime} mins
                    </span>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
                  <img src={item.image} alt={item.name} className="w-24 h-24 rounded-2xl object-cover border border-slate-800" />

                  {stall.isOpen === false ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-900 border border-slate-800 cursor-not-allowed"
                    >
                      Stall Closed
                    </button>
                  ) : isOutOfStock ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-900 border border-slate-800 cursor-not-allowed"
                    >
                      Sold Out
                    </button>
                  ) : qty === 0 ? (
                    <button
                      onClick={() => addToCart({
                        id: item.id,
                        name: item.name,
                        price: finalPrice,
                        originalPrice: hasOffer ? item.price : undefined,
                        stallId: stall.id,
                        stallName: stall.name,
                        stallInitials: stall.tokenPrefix.replace("KJU-", ""),
                        isVeg: item.isVeg,
                        category: item.category,
                        prepTime: `${item.prepTime} mins`,
                        takeawayCharge: item.takeawayCharge || 10,
                        campus: stall.campus
                      })}
                      className="px-5 py-2 rounded-xl text-xs font-extrabold text-orange-400 bg-orange-500/10 hover:bg-orange-500 hover:text-white border border-orange-500/30 transition-all shadow-md flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> ADD
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-orange-500 text-white rounded-xl p-1 font-bold text-xs shadow-lg shadow-orange-500/20">
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded-lg bg-orange-600 hover:bg-orange-700 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 font-mono">{qty}</span>
                      <button 
                        onClick={() => addToCart({
                          id: item.id,
                          name: item.name,
                          price: finalPrice,
                          originalPrice: hasOffer ? item.price : undefined,
                          stallId: stall.id,
                          stallName: stall.name,
                          stallInitials: stall.tokenPrefix.replace("KJU-", ""),
                          isVeg: item.isVeg,
                          category: item.category,
                          prepTime: `${item.prepTime} mins`,
                          takeawayCharge: item.takeawayCharge || 10,
                          campus: stall.campus
                        })}
                        className="w-7 h-7 rounded-lg bg-orange-600 hover:bg-orange-700 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav cartCount={totalCount} cartTotal={totalAmount} />

      {isLoadingDashboard && (
        <PageLoader 
          message="Returning to Dashboard" 
          submessage="Loading live floor details & open canteens list..." 
          type="canteen" 
        />
      )}
    </div>
  );
}
