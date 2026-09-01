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
  totalTakeawayFee: number;
  itemsByStall: Record<string, { stallId: string; stallName: string; campus: string; items: CartItem[] }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("campusbites_cart");
      const savedType = localStorage.getItem("campusbites_order_type");
      if (saved) setCartItems(JSON.parse(saved));
      if (savedType === "TAKEAWAY" || savedType === "DINE_IN") setOrderType(savedType);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("campusbites_cart", JSON.stringify(cartItems));
      localStorage.setItem("campusbites_order_type", orderType);
    } catch (e) {
      console.error(e);
    }
  }, [cartItems, orderType]);

  const addToCart = (itemData: Omit<CartItem, "quantity">) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === itemData.id);
      if (existing) {
        return prev.map(i => i.id === itemData.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...itemData, quantity: 1, takeawayCharge: itemData.takeawayCharge ?? 10 }];
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

  // Takeaway container charges calculate only if orderType === "TAKEAWAY"
  const totalTakeawayFee = orderType === "TAKEAWAY" 
    ? cartItems.reduce((acc, item) => acc + ((item.takeawayCharge ?? 10) * item.quantity), 0)
    : 0;

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
      totalTakeawayFee,
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
