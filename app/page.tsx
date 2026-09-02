"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { StallCard, StallProps } from "@/components/StallCard";
import { FoodItemCard, FoodItemProps } from "@/components/FoodItemCard";
import { CartDrawer, CartItem } from "@/components/CartDrawer";
import { BottomNav } from "@/components/BottomNav";
import { 
  Zap, 
  Flame, 
  Sparkles, 
  Store, 
  ShoppingBag,
  Clock,
  Layers,
  Award
} from "lucide-react";

// Categories
const CATEGORY_PILLS = [
  { id: "all", label: "🔥 All Items" },
  { id: "fastfood", label: "🍔 Burgers & Wraps" },
  { id: "southindian", label: "🥗 South Indian" },
  { id: "beverages", label: "☕ Cold Coffee & Drinks" },
  { id: "snacks", label: "🍟 Fries & Snacks" },
];

// Swiggy/Zomato style Fast Selling Bestseller Items
const BESTSELLER_ITEMS: FoodItemProps[] = [
  {
    id: "item-1",
    name: "Double Cheese Chicken Burger",
    price: 160,
    description: "Juicy grilled chicken patty topped with melted cheddar cheese & signature sauce.",
    category: "fastfood",
    stallName: "The Campus Grill & Burgers",
    isVeg: false,
    rating: 4.9,
    prepTime: "8 mins",
    tag: "Bestseller"
  },
  {
    id: "item-2",
    name: "Butter Masala Dosa",
    price: 90,
    description: "Crispy golden crepe filled with spiced potato masala & pure butter. Served with chutneys.",
    category: "southindian",
    stallName: "South Express Dosa Counter",
    isVeg: true,
    rating: 4.8,
    prepTime: "5 mins",
    tag: "Fast Prep"
  },
  {
    id: "item-3",
    name: "Cold Coffee with Ice Cream",
    price: 70,
    description: "Rich blended espresso coffee topped with a scoop of vanilla ice cream.",
    category: "beverages",
    stallName: "Cold Brew & Sandwich Bar",
    isVeg: true,
    rating: 4.9,
    prepTime: "3 mins",
    tag: "Top Rated"
  },
  {
    id: "item-4",
    name: "Peri Peri Loaded Fries",
    price: 110,
    description: "Crispy french fries tossed in spicy peri-peri seasoning and cheese dip.",
    category: "snacks",
    stallName: "The Campus Grill & Burgers",
    isVeg: true,
    rating: 4.7,
    prepTime: "6 mins",
  },
  {
    id: "item-5",
    name: "Schezwan Hakka Noodles",
    price: 130,
    description: "Wok-tossed noodles with crunchy veggies and fiery Schezwan garlic sauce.",
    category: "fastfood",
    stallName: "Wok & Roll Noodle Hub",
    isVeg: true,
    rating: 4.6,
    prepTime: "10 mins",
  },
  {
    id: "item-6",
    name: "Paneer Cheese Grilled Sandwich",
    price: 120,
    description: "Multi-grain bread toasted with spiced cottage cheese, veggies & mozzarella.",
    category: "snacks",
    stallName: "Cold Brew & Sandwich Bar",
    isVeg: true,
    rating: 4.8,
    prepTime: "5 mins",
    tag: "Student Fav"
  },
];

// College Canteen Stalls List
const COLLEGE_STALLS: StallProps[] = [
  {
    id: "stall-1",
    name: "The Campus Grill & Burgers",
    category: "Burgers & Wraps",
    rating: 4.9,
    reviewsCount: 142,
    prepTime: "8-12 mins",
    itemCount: 16,
    tag: "Top Rated",
    bgGradient: "from-orange-950/40 to-slate-950"
  },
  {
    id: "stall-2",
    name: "South Express Dosa Counter",
    category: "South Indian",
    rating: 4.8,
    reviewsCount: 210,
    prepTime: "5-8 mins",
    itemCount: 20,
    tag: "Express",
    bgGradient: "from-amber-950/40 to-slate-950"
  },
  {
    id: "stall-3",
    name: "Wok & Roll Noodle Hub",
    category: "Pan-Asian",
    rating: 4.7,
    reviewsCount: 98,
    prepTime: "10-14 mins",
    itemCount: 14,
    bgGradient: "from-red-950/40 to-slate-950"
  },
  {
    id: "stall-4",
    name: "Cold Brew & Sandwich Bar",
    category: "Beverages & Snacks",
    rating: 4.9,
    reviewsCount: 315,
    prepTime: "3-5 mins",
    itemCount: 24,
    tag: "5-min Pickup",
    bgGradient: "from-emerald-950/40 to-slate-950"
  },
];

export default function Home() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "item-1",
      name: "Double Cheese Chicken Burger",
      price: 160,
      quantity: 1,
      stallName: "The Campus Grill & Burgers",
      category: "fastfood"
    },
    {
      id: "item-3",
      name: "Cold Coffee with Ice Cream",
      price: 70,
      quantity: 1,
      stallName: "Cold Brew & Sandwich Bar",
      category: "beverages"
    }
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddToCart = (foodItem: FoodItemProps) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === foodItem.id);
      if (existing) {
        return prev.map(item => item.id === foodItem.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        id: foodItem.id,
        name: foodItem.name,
        price: foodItem.price,
        quantity: 1,
        stallName: foodItem.stallName,
        category: foodItem.category
      }];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const getItemQuantity = (id: string) => {
    const found = cartItems.find(item => item.id === id);
    return found ? found.quantity : 0;
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const filteredFoodItems = BESTSELLER_ITEMS.filter(item => {
    const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.stallName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col pb-24 md:pb-12 selection:bg-marigold selection:text-white">
      {/* Header with Search and Cart props */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 space-y-8">
        {/* Top Promo Banner */}
        <div className="card-surface p-5 sm:p-6 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-marigold bg-paper px-3 py-1 rounded border border-ink/15 inline-block">
              Pre-Order & Skip Lunch Queues
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink tracking-tight">
              Order from Multiple College Stalls in 1 Basket
            </h1>
            <p className="text-xs text-ink-soft max-w-xl">
              Select your lecture break time slot. Food is freshly prepared right as you arrive.
            </p>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-marigold hover:bg-marigold-hover transition-colors px-5 py-3 rounded text-xs font-bold text-white flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
          >
            <ShoppingBag className="w-4 h-4" /> View Cart ({totalCartCount})
          </button>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_PILLS.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedCategory(pill.id)}
              className={`px-4 py-2 rounded text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === pill.id
                  ? "bg-marigold text-white"
                  : "bg-cardstock border border-ink/15 text-ink-soft hover:text-ink"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Section 1: Fast Selling / Popular Right Now */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-semibold text-ink flex items-center gap-2">
                <Flame className="w-5 h-5 text-marigold" /> Fast Selling Student Favorites
              </h2>
              <p className="text-xs text-ink-soft">Popular dishes ready in under 10 minutes</p>
            </div>

            <span className="text-xs text-ink-soft font-medium hidden sm:inline-block">
              {filteredFoodItems.length} items available
            </span>
          </div>

          {/* Equal Height Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {filteredFoodItems.map((item) => (
              <FoodItemCard
                key={item.id}
                item={item}
                cartQuantity={getItemQuantity(item.id)}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
              />
            ))}
          </div>
        </section>

        {/* Section 2: College Canteen Stalls / Restaurants — fixed "Seven Slots" grid, never paginated */}
        <section id="stalls" className="space-y-4 pt-4 border-t border-dashed border-ink/15">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-semibold text-ink flex items-center gap-2">
              <Store className="w-5 h-5 text-marigold" /> College Canteen Stalls
            </h2>
            <p className="text-xs text-ink-soft">Browse stalls in North Campus food court</p>
          </div>

          {/* Equal Height Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            {COLLEGE_STALLS.map((stall) => (
              <StallCard key={stall.id} stall={stall} />
            ))}
          </div>
        </section>
      </main>

      {/* Cart Slide-over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      {/* Mobile Floating Bottom Nav Bar */}
      <BottomNav
        cartCount={totalCartCount}
        cartTotal={totalCartPrice}
        onOpenCart={() => setIsCartOpen(true)}
      />
    </div>
  );
}
