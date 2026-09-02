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
import { MenuItem, MenuItemVariant } from "@/app/vendor/menu/page";
import {
  Store,
  ArrowLeft,
  Plus,
  Minus,
  Search,
  Check,
  Flame,
  Leaf,
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
  const [expandedVariantItemId, setExpandedVariantItemId] = useState<string | null>(null);

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

  const parseVariants = (item: MenuItem): MenuItemVariant[] => {
    if (!item.variants) return [];
    try {
      const parsed = JSON.parse(item.variants);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col pb-24 sm:pb-12">
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
          className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Canteen Stalls
        </button>

        {/* Vendor Header */}
        <div className="card-surface p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={stall.logo} alt={stall.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded object-cover border border-ink/15 shrink-0" />

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded bg-marigold/10 border border-marigold/30 text-marigold text-xs font-mono font-bold">
                  {stall.tokenPrefix}
                </span>
                {stall.type === "PURE_VEG" ? (
                  <span className="px-2.5 py-0.5 rounded bg-sage-soft border border-sage/40 text-sage text-xs font-bold flex items-center gap-1">
                    <Leaf className="w-3 h-3" /> PURE VEG
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded bg-cardstock text-ink-soft text-xs font-bold border border-ink/15">
                    MIXED
                  </span>
                )}
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink">{stall.name}</h1>
              <p className="text-xs text-ink-soft">{stall.location}</p>
            </div>
          </div>
        </div>

        {stall.isOpen === false && (
          <div className="p-4 rounded bg-chili-soft border border-chili/30 text-chili text-xs font-bold flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-sm text-ink">Stall Currently Closed</p>
              <p className="text-ink-soft font-medium mt-0.5">This canteen is currently closed. You can view the menu, but ordering & cart additions are locked.</p>
            </div>
          </div>
        )}

        {/* Search & Filter Chips */}
        <div className="card-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-ink-soft absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes in menu..."
              className="w-full bg-paper border border-ink/15 rounded pl-9 pr-3 py-1.5 text-xs text-ink placeholder-ink-soft/70 focus:outline-none focus:border-marigold"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto text-xs font-bold">
            <button
              onClick={() => setFilterVeg("ALL")}
              className={`px-3 py-1.5 rounded transition-all ${
                filterVeg === "ALL"
                  ? "bg-marigold text-white"
                  : "bg-paper border border-ink/15 text-ink-soft hover:text-ink"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilterVeg("VEG")}
              className={`px-3 py-1.5 rounded transition-all flex items-center gap-1 ${
                filterVeg === "VEG"
                  ? "bg-sage text-white"
                  : "bg-paper border border-ink/15 text-ink-soft hover:text-ink"
              }`}
            >
              <Leaf className="w-3.5 h-3.5" /> Pure Veg
            </button>
            <button
              onClick={() => setFilterVeg("NON_VEG")}
              className={`px-3 py-1.5 rounded transition-all flex items-center gap-1 ${
                filterVeg === "NON_VEG"
                  ? "bg-chili text-white"
                  : "bg-paper border border-ink/15 text-ink-soft hover:text-ink"
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Non-Veg
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

            const variants = parseVariants(item);
            const hasVariants = variants.length > 0;
            const lowestVariantPrice = hasVariants ? Math.min(...variants.map(v => v.price)) : item.price;

            const hasOffer = item.offerType && item.offerType !== "NONE" && item.offerValue && item.offerValue > 0;
            const finalPrice = hasOffer
              ? item.offerType === "PERCENTAGE"
                ? Math.max(0, item.price - (item.price * (item.offerValue || 0) / 100))
                : Math.max(0, item.price - (item.offerValue || 0))
              : item.price;

            return (
              <div key={item.id} className="flex flex-col">
              <div
                className="card-surface p-5 flex flex-col sm:flex-row gap-4 justify-between hover:bg-cardstock-hover transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                      item.isVeg ? "border-sage" : "border-chili"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-sage" : "bg-chili"}`} />
                    </span>
                    <h3 className="font-display text-base font-semibold text-ink">{item.name}</h3>

                    {/* OFFER BADGE */}
                    {hasOffer && (
                      <span className="px-2.5 py-0.5 rounded bg-marigold border border-marigold text-white text-[10px] font-bold tracking-wide uppercase flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {item.offerType === "PERCENTAGE" ? `${item.offerValue}% OFF` : `₹${item.offerValue} OFF`}
                      </span>
                    )}

                    {/* LOW STOCK WARNING BADGE */}
                    {isLowStock && (
                      <span className="px-2.5 py-0.5 rounded bg-chili-soft border border-chili/40 text-chili text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Only {remainingStock} Left!</span>
                      </span>
                    )}

                    {item.stockType === "UNLIMITED" && (
                      <span className="px-2 py-0.5 rounded bg-sage-soft border border-sage/40 text-sage text-[10px] font-bold">
                        Live Fresh Prep
                      </span>
                    )}

                    {item.availableFrom && item.availableFrom !== "10:00 AM" && (
                      <span className="px-2 py-0.5 rounded bg-cardstock border border-ink/15 text-ink-soft text-[10px] font-bold flex items-center gap-1">
                        <span>Lunch: after {item.availableFrom} only</span>
                      </span>
                    )}

                    {isOutOfStock && (
                      <span className="px-2 py-0.5 rounded bg-chili-soft border border-chili/40 text-chili text-[10px] font-bold">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed">{item.description}</p>

                  <div className="pt-1 flex items-center gap-3 font-mono">
                    {hasVariants ? (
                      <span className="text-sm font-bold text-marigold">From ₹{lowestVariantPrice.toFixed(2)}</span>
                    ) : hasOffer ? (
                      <>
                        <span className="text-[11px] text-ink-soft line-through">₹{item.price.toFixed(2)}</span>
                        <span className="text-sm font-bold text-marigold">₹{finalPrice.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-marigold">₹{item.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
                  <img src={item.image} alt={item.name} className="w-24 h-24 rounded object-cover border border-ink/15" />

                  {stall.isOpen === false ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded text-xs font-bold text-ink-soft bg-cardstock border border-ink/15 cursor-not-allowed"
                    >
                      Stall Closed
                    </button>
                  ) : isOutOfStock ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded text-xs font-bold text-ink-soft bg-cardstock border border-ink/15 cursor-not-allowed"
                    >
                      Sold Out
                    </button>
                  ) : hasVariants ? (
                    <button
                      onClick={() => setExpandedVariantItemId(expandedVariantItemId === item.id ? null : item.id)}
                      className="px-5 py-2 rounded text-xs font-bold text-white bg-marigold hover:bg-marigold-hover transition-all flex items-center gap-1"
                    >
                      {expandedVariantItemId === item.id ? "Hide Styles" : "Select Style"}
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
                      className="px-5 py-2 rounded text-xs font-bold text-marigold bg-marigold/10 hover:bg-marigold hover:text-white border border-marigold/30 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> ADD
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-marigold text-white rounded p-1 font-bold text-xs">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded bg-marigold-hover flex items-center justify-center transition-colors"
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
                        className="w-7 h-7 rounded bg-marigold-hover flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {hasVariants && expandedVariantItemId === item.id && (
                <div className="card-surface border-t-0 rounded-t-none -mt-px p-4 space-y-2">
                  {variants.map((variant) => {
                    const variantId = `${item.id}::${variant.label}`;
                    const variantQty = getItemQuantity(variantId);
                    return (
                      <div key={variant.label} className="flex items-center justify-between gap-3 py-1.5 border-b border-dashed border-ink/15 last:border-b-0">
                        <div className="flex items-baseline gap-3">
                          <span className="text-xs font-bold text-ink">{variant.label}</span>
                          <span className="text-xs font-mono text-ink-soft">₹{variant.price.toFixed(2)}</span>
                        </div>
                        {variantQty === 0 ? (
                          <button
                            onClick={() => addToCart({
                              id: variantId,
                              name: `${item.name} (${variant.label})`,
                              price: variant.price,
                              stallId: stall.id,
                              stallName: stall.name,
                              stallInitials: stall.tokenPrefix.replace("KJU-", ""),
                              isVeg: item.isVeg,
                              category: item.category,
                              prepTime: `${item.prepTime} mins`,
                              takeawayCharge: item.takeawayCharge || 10,
                              campus: stall.campus
                            })}
                            className="px-3 py-1 rounded text-[11px] font-bold text-marigold bg-marigold/10 hover:bg-marigold hover:text-white border border-marigold/30 transition-all flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> ADD
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-marigold text-white rounded p-0.5 font-bold text-[11px]">
                            <button
                              onClick={() => removeFromCart(variantId)}
                              className="w-6 h-6 rounded bg-marigold-hover flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-1.5 font-mono">{variantQty}</span>
                            <button
                              onClick={() => addToCart({
                                id: variantId,
                                name: `${item.name} (${variant.label})`,
                                price: variant.price,
                                stallId: stall.id,
                                stallName: stall.name,
                                stallInitials: stall.tokenPrefix.replace("KJU-", ""),
                                isVeg: item.isVeg,
                                category: item.category,
                                prepTime: `${item.prepTime} mins`,
                                takeawayCharge: item.takeawayCharge || 10,
                                campus: stall.campus
                              })}
                              className="w-6 h-6 rounded bg-marigold-hover flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
