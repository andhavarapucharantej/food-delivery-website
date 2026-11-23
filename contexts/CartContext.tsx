"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useToast } from "./ToastContext";

export interface CartItem {
  menuItemId: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  price: number; // integer rupees
  quantity: number;
  isVeg: boolean;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  totalAmount: number;
  totalCount: number;
  isDrawerOpen: boolean;
  mounted: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => boolean;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "fd_cart_state";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const toast = useToast();

  // Read localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore storage read error
    }
  }, []);

  const persistCart = (next: CartItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage write error
    }
  };

  const restaurantId = useMemo(() => {
    return items.length > 0 ? items[0].restaurantId : null;
  }, [items]);

  const restaurantName = useMemo(() => {
    return items.length > 0 ? items[0].restaurantName : null;
  }, [items]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const totalCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const addItem = (
    newItem: Omit<CartItem, "quantity">,
    qtyToAdd = 1
  ): boolean => {
    // Single restaurant enforcement
    if (items.length > 0 && items[0].restaurantId !== newItem.restaurantId) {
      const confirmReplace = window.confirm(
        `Your cart contains dishes from "${items[0].restaurantName}". Discard items and start an order from "${newItem.restaurantName}"?`
      );
      if (!confirmReplace) {
        return false;
      }
      // Replace with new restaurant item
      const freshItems: CartItem[] = [{ ...newItem, quantity: qtyToAdd }];
      persistCart(freshItems);
      toast.info(`Cart reset with items from ${newItem.restaurantName}`);
      return true;
    }

    const existingIndex = items.findIndex(
      (i) => i.menuItemId === newItem.menuItemId
    );

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...items];
      updated[existingIndex].quantity += qtyToAdd;
    } else {
      updated = [...items, { ...newItem, quantity: qtyToAdd }];
    }

    persistCart(updated);
    toast.success(`Added "${newItem.name}" to cart`);
    return true;
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    const updated = items
      .map((item) => {
        if (item.menuItemId === menuItemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter((i): i is CartItem => i !== null);

    persistCart(updated);
  };

  const removeItem = (menuItemId: string) => {
    const updated = items.filter((i) => i.menuItemId !== menuItemId);
    persistCart(updated);
  };

  const clearCart = () => {
    setItems([]);
    setIsDrawerOpen(false);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
      } catch {
        // Ignore storage write error
      }
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        restaurantName,
        totalAmount,
        totalCount,
        isDrawerOpen,
        mounted,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        toggleDrawer: () => setIsDrawerOpen((prev) => !prev),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
