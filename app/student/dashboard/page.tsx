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

  const FLOOR_ORDER = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor"];
  const availableFloors = FLOOR_ORDER.filter(floor =>
    restaurants.some(r => (r.campus || "Central Campus") === selectedCampus && r.floor === floor)
  );

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col pb-24 sm:pb-12">
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
        <div className="card-surface relative overflow-hidden border-l-4 border-l-marigold">
          <div className="p-6 sm:p-8 space-y-3">
            <div key={selectedCampus} className="inline-flex items-center gap-2 px-3 py-1 rounded bg-marigold/10 border border-marigold/30 text-marigold text-xs font-bold animate-reveal-up">
              <Sparkles className="w-3.5 h-3.5 fill-marigold" />
              <span>Campus Pre-Order Pass • Skip Canteen Lines</span>
            </div>
            <h1 key={`h-${selectedCampus}`} className="font-display text-2xl sm:text-4xl font-bold text-ink tracking-tight animate-reveal-up [animation-delay:80ms]">
              Pre-Order Food Across Campus Canteen Floors
            </h1>
            <p key={`p-${selectedCampus}`} className="text-xs sm:text-sm text-ink-soft animate-reveal-up [animation-delay:150ms]">
              Browse open stalls, select your 15-minute lecture break slot, and receive live email progress updates!
            </p>
          </div>

          {/* Live ticker of today's open stalls — real data, scrolls like a canteen board */}
          {(() => {
            const openStalls = restaurants.filter(
              r => (r.campus || "Central Campus") === selectedCampus && r.isOpen !== false
            );
            if (openStalls.length === 0) return null;
            const track = [...openStalls, ...openStalls];
            return (
              <div className="border-t border-dashed border-ink/15 bg-paper/60 py-2 overflow-hidden marquee-mask">
                <div className="flex w-max gap-8 animate-marquee">
                  {track.map((stall, i) => (
                    <span key={`${stall.id}-${i}`} className="flex items-center gap-2 text-[11px] font-mono text-ink-soft whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-sage shrink-0" />
                      <span className="font-bold text-ink">{stall.name}</span>
                      <span>· {stall.cuisine}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-cardstock p-1 rounded border border-ink/15 w-full sm:w-80 text-xs font-bold">
          <button
            onClick={() => setActiveTab("BROWSE")}
            className={`flex-1 py-2.5 rounded transition-all ${
              activeTab === "BROWSE"
                ? "bg-marigold text-white"
                : "text-ink-soft hover:text-ink"
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
            className={`flex-1 py-2.5 rounded transition-all ${
              activeTab === "ORDERS"
                ? "bg-marigold text-white"
                : "text-ink-soft hover:text-ink"
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
                <div className="flex items-center justify-between border-b border-dashed border-ink/15 pb-2.5">
                  <h2 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-marigold" />
                    Today's Hot Deals & Offers!
                  </h2>
                  <span className="text-[10px] bg-marigold/10 border border-marigold/30 text-marigold px-2 py-0.5 rounded font-bold">
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
                        className="card-surface hover:bg-cardstock-hover p-4 flex items-center justify-between gap-3 transition-all relative overflow-hidden group"
                      >
                        {/* Attractive Offer Tag */}
                        {hasOffer && (
                          <div className="absolute top-0 left-0 bg-marigold text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-br z-10 flex items-center gap-1">
                            <Tag className="w-3 h-3 text-white" />
                            {item.offerType === "PERCENTAGE" ? `${item.offerValue}% OFF` : `₹${item.offerValue} OFF`}
                          </div>
                        )}

                        <div className="space-y-1.5 flex-1 pr-2 pt-4">
                          <span className="text-[9px] text-ink-soft font-mono block">From {item.stallName}</span>
                          <h3 className="text-xs font-bold text-ink transition-colors line-clamp-1">
                            {item.name}
                          </h3>

                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-[10px] text-ink-soft line-through">₹{item.price.toFixed(2)}</span>
                            <span className="text-xs font-bold text-marigold">₹{finalPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-2 shrink-0 pt-2">
                          <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover border border-ink/15 group-hover:scale-105 transition-transform" />

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
                              className="px-3 py-1 rounded text-[10px] font-bold text-marigold bg-marigold/10 hover:bg-marigold hover:text-white border border-marigold/30 transition-all cursor-pointer flex items-center gap-0.5"
                            >
                              <Plus className="w-3 h-3" /> ADD
                            </button>
                          ) : (
                            <div className="flex items-center bg-marigold text-white rounded p-0.5 font-bold text-[10px]">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-5 h-5 rounded-sm hover:opacity-80 flex items-center justify-center transition-colors"
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
                                className="w-5 h-5 rounded-sm hover:opacity-80 flex items-center justify-center transition-colors"
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
                <h2 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                  <Tag className="w-4 h-4 text-marigold" /> Active Campus Special Offers & Combos
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="card-surface hover:bg-cardstock-hover p-5 flex justify-between items-center gap-4 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <span className="px-2.5 py-0.5 rounded bg-marigold/10 border border-marigold/30 text-marigold text-[10px] font-bold tracking-wider uppercase">
                          {offer.discountBadge}
                        </span>
                        <h3 className="text-sm font-bold text-ink">{offer.title}</h3>
                        <p className="text-[11px] text-ink-soft line-clamp-2">{offer.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg font-mono font-bold text-marigold block">₹{offer.price}</span>
                        <span className="text-[9px] text-ink-soft font-mono">Special combo price</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Floor Selection Quick Chips */}
            <div className="space-y-3">
              <h2 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                <Building2 className="w-4 h-4 text-marigold" /> Filter by Canteen Floor Location
              </h2>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                {["ALL", ...availableFloors].map((floor) => (
                  <button
                    key={floor}
                    onClick={() => setFloorFilter(floor)}
                    className={`px-4 py-2 rounded transition-all whitespace-nowrap ${
                      floorFilter === floor
                        ? "bg-marigold text-white"
                        : "bg-cardstock border border-ink/15 text-ink-soft hover:text-ink"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dashed border-ink/15 pb-3">
                <div className="space-y-1">
                  <h2 className="font-display text-base font-bold text-ink flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-marigold" /> Open Campus Canteens
                  </h2>
                  <p className="text-[10px] text-ink-soft">
                    Showing canteens for your selected campus. Change your location in the top menu bar if needed.
                  </p>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 text-ink-soft absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by stall name or food..."
                    className="w-full bg-cardstock border border-ink/15 rounded pl-9 pr-3 py-1.5 text-xs text-ink placeholder-ink-soft/70 focus:outline-none focus:border-marigold"
                    suppressHydrationWarning={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map((stall) => (
                  <button
                    key={stall.id}
                    onClick={() => handleRedirectToRestaurant(stall.id, stall.name)}
                    className="card-surface hover:bg-cardstock-hover p-5 transition-all flex items-center justify-between gap-4 group w-full text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img src={stall.logo} alt={stall.name} className="w-16 h-16 rounded object-cover border border-ink/15 shrink-0 group-hover:scale-105 transition-transform" />

                      <div className="space-y-1 truncate">
                        <div className="flex items-center gap-2">
                          {stall.isOpen === false ? (
                            <span className="px-2 py-0.5 rounded bg-chili-soft border border-chili/30 text-chili text-[10px] font-bold uppercase tracking-wider">
                              Closed
                            </span>
                          ) : stall.type === "PURE_VEG" ? (
                            <span className="px-2 py-0.5 rounded bg-sage-soft border border-sage/40 text-sage text-[10px] font-bold flex items-center gap-1">
                              <Leaf className="w-3.5 h-3.5 text-sage" /> PURE VEG
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-cardstock text-ink-soft text-[10px] font-bold">
                              MIXED
                            </span>
                          )}
                        </div>

                        <h3 className="font-display text-sm font-bold text-ink group-hover:text-marigold transition-colors truncate">{stall.name}</h3>
                        <p className="text-xs text-ink-soft truncate">{stall.cuisine}</p>
                        <p className="text-[10px] text-ink-soft flex items-center gap-1 truncate">
                          {stall.location}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-ink-soft shrink-0 group-hover:text-marigold group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* MY ORDERS HISTORY TAB */
          <div className="space-y-6">
            <h2 className="font-display text-base font-bold text-ink flex items-center gap-2">
              <Receipt className="w-5 h-5 text-marigold" /> Previous & Current Orders
            </h2>

            {studentOrders.length === 0 ? (
              <div className="card-surface p-8 text-center space-y-4">
                <AlertCircle className="w-8 h-8 text-ink-soft mx-auto" />
                <h3 className="text-sm font-bold text-ink">No Orders Placed Yet</h3>
                <p className="text-xs text-ink-soft">You haven't ordered anything yet! Head back to canteens to buy delicious food.</p>
                <button
                  onClick={() => setActiveTab("BROWSE")}
                  className="bg-marigold hover:bg-marigold-hover px-4 py-2 rounded text-xs font-bold text-white transition-colors"
                >
                  Browse Menu Stalls
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {studentOrders.map((order) => (
                  <div
                    key={order.orderId}
                    className="card-surface p-6 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-dashed border-ink/15 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-marigold bg-marigold/10 px-2.5 py-0.5 rounded border border-marigold/25">
                            {order.masterToken}
                          </span>
                          <span className="text-[10px] text-ink-soft flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-ink-soft" /> {order.placedAt}
                          </span>
                        </div>
                        <span className="text-[10px] text-ink-soft font-mono block mt-1">ID: {order.orderId}</span>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-sm font-mono font-bold text-ink">₹{order.totalAmount}</span>
                        <button
                          onClick={() => handleReorder(order)}
                          className="bg-marigold hover:bg-marigold-hover px-4 py-2 rounded text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reorder Feast
                        </button>
                      </div>
                    </div>

                    {/* Portions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {order.vendorPortions.map((portion: any, idx: number) => {
                        let statusColor = "bg-marigold/10 text-marigold border-marigold/30";
                        if (portion.status === "READY") statusColor = "bg-marigold/10 text-marigold border-marigold/30";
                        if (portion.status === "FULFILLED") statusColor = "bg-sage-soft text-sage border-sage/40";
                        if (portion.status === "REFUNDED") statusColor = "bg-chili-soft text-chili border-chili/40";

                        return (
                          <div key={idx} className="bg-paper p-4 rounded border border-ink/15 space-y-2 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-ink">{portion.stallName}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusColor}`}>
                                  {portion.status}
                                </span>
                              </div>
                              <span className="text-[10px] text-ink-soft block">Stall Token: <strong className="font-mono text-ink font-bold">{portion.tokenNumber}</strong></span>
                              <span className="text-[10px] text-ink-soft block">Pickup Slot: <strong className="font-mono text-ink font-bold">{portion.pickupTimeSlot}</strong></span>
                            </div>

                            <div className="space-y-1 pt-2 border-t border-dashed border-ink/15">
                              {portion.items.map((it: any, itemIdx: number) => (
                                <div key={itemIdx} className="flex justify-between text-[11px] text-ink-soft font-mono">
                                  <span className="font-sans">{it.quantity}x {it.name}</span>
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
