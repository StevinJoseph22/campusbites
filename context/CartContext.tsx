"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stallId: string;
  stallName: string;
  stallInitials: string;
  isVeg: boolean;
  category: string;
  prepTime: string;
  takeawayCharge?: number; // Container charge per item (e.g. ₹10)
  campus?: string;
  originalPrice?: number; // Pre-discount unit price
  isDineInOnly?: boolean; // Strictly dine-in only (no parcel/takeaway packaging)
}

interface CartContextType {
  cartItems: CartItem[];
  orderType: "DINE_IN" | "TAKEAWAY";
  setOrderType: (type: "DINE_IN" | "TAKEAWAY") => void;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalAmount: number;
  /** Platform fee: platformFeePercent% of the food subtotal, applies to every order. */
  platformFee: number;
  /** Convenience fee: convenienceFeePercent% of the food subtotal, applies to every order. */
  convenienceFee: number;
  /** Flat packaging charge, applies only when orderType is TAKEAWAY. */
  totalTakeawayFee: number;
  /** totalAmount + platformFee + convenienceFee + totalTakeawayFee — the single source of truth for the payable total. */
  grandTotal: number;
  platformFeePercent: number;
  convenienceFeePercent: number;
  packagingFee: number;
  hasDineInOnlyItems: boolean;
  dineInOnlyItemNames: string[];
  itemsByStall: Record<string, { stallId: string; stallName: string; campus: string; items: CartItem[] }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");
  // Platform fee and convenience fee are each a % of the food subtotal (default 2% + 2% = 4% total);
  // packaging is a flat ₹ charge for takeaway only (default ₹10). All admin-configurable via /api/settings.
  const [platformFeePercent, setPlatformFeePercent] = useState(2);
  const [convenienceFeePercent, setConvenienceFeePercent] = useState(2);
  const [packagingFee, setPackagingFee] = useState(10);
  // Guards the persist-effect below from firing with the initial empty state
  // and wiping out a saved cart before the load-effect has restored it.
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("campusbites_cart");
      const savedType = localStorage.getItem("campusbites_order_type");
      if (saved) setCartItems(JSON.parse(saved));
      if (savedType === "TAKEAWAY" || savedType === "DINE_IN") setOrderType(savedType);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoaded(true);
    }

    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setPlatformFeePercent(data.settings.platformFee);
          setConvenienceFeePercent(data.settings.convenienceFee);
          setPackagingFee(data.settings.takeawayFee);
        }
      })
      .catch(e => console.error("Failed to load fee settings:", e));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("campusbites_cart", JSON.stringify(cartItems));
      localStorage.setItem("campusbites_order_type", orderType);
    } catch (e) {
      console.error(e);
    }
  }, [cartItems, orderType, isLoaded]);

  const addToCart = (itemData: Omit<CartItem, "quantity">) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === itemData.id);
      if (existing) {
        return prev.map(i => i.id === itemData.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...itemData, quantity: 1, isDineInOnly: Boolean(itemData.isDineInOnly), takeawayCharge: itemData.takeawayCharge ?? 10 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(i => i.id !== itemId));
    } else {
      setCartItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
    }
  };

  const clearCart = () => setCartItems([]);

  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Dine-in only items check
  const dineInOnlyItems = cartItems.filter(i => i.isDineInOnly);
  const hasDineInOnlyItems = dineInOnlyItems.length > 0;
  const dineInOnlyItemNames = dineInOnlyItems.map(i => i.name);

  // Platform fee and convenience fee each apply to every order, dine-in or takeaway: a % of the food subtotal.
  const platformFee = Math.round(totalAmount * (platformFeePercent / 100) * 100) / 100;
  const convenienceFee = Math.round(totalAmount * (convenienceFeePercent / 100) * 100) / 100;

  // Packaging is a single flat charge for the whole order, only when taking away.
  const totalTakeawayFee = orderType === "TAKEAWAY" ? packagingFee : 0;

  // Round the final sum too — adding already-rounded decimals (e.g. 3.2 + 3.2) can still
  // land on a binary-float artifact like 176.39999999999998 without this.
  const grandTotal = Math.round((totalAmount + platformFee + convenienceFee + totalTakeawayFee) * 100) / 100;

  const itemsByStall = cartItems.reduce((acc, item) => {
    if (!acc[item.stallId]) {
      acc[item.stallId] = {
        stallId: item.stallId,
        stallName: item.stallName,
        campus: item.campus || "Central Campus",
        items: []
      };
    }
    acc[item.stallId].items.push(item);
    return acc;
  }, {} as Record<string, { stallId: string; stallName: string; campus: string; items: CartItem[] }>);

  return (
    <CartContext.Provider value={{
      cartItems,
      orderType,
      setOrderType,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalCount,
      totalAmount,
      platformFee,
      convenienceFee,
      totalTakeawayFee,
      grandTotal,
      platformFeePercent,
      convenienceFeePercent,
      packagingFee,
      hasDineInOnlyItems,
      dineInOnlyItemNames,
      itemsByStall
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
