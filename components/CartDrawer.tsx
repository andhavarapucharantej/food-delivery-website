"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export function CartDrawer() {
  const {
    items,
    restaurantName,
    totalAmount,
    totalCount,
    isDrawerOpen,
    closeDrawer,
    openDrawer,
    updateQuantity,
    clearCart,
    mounted,
  } = useCart();

  if (!mounted) return null;

  return (
    <>
      {/* 1. Mobile Sticky Bottom Bar (shown when cart has items and drawer is closed) */}
      {items.length > 0 && !isDrawerOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-[#FFFFFF] border-t border-[#E8E8E8] p-3 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#1C1C1C]">
              {totalCount} {totalCount === 1 ? "item" : "items"} • ₹{totalAmount}
            </div>
            <div className="text-[11px] text-[#696969] truncate max-w-[180px]">
              From {restaurantName}
            </div>
          </div>
          <button
            onClick={openDrawer}
            className="bg-[#E23744] text-[#FFFFFF] font-bold text-xs px-4 py-2 rounded-[8px] hover:opacity-95 cursor-pointer shadow-xs"
          >
            View Cart 🛒
          </button>
        </div>
      )}

      {/* 2. Slide-out Drawer (Desktop & Mobile expanded) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={closeDrawer}
            className="fixed inset-0 bg-[#1C1C1C]/40 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-md bg-[#FFFFFF] h-full shadow-2xl flex flex-col z-10 border-l border-[#E8E8E8]">
            {/* Header */}
            <div className="p-4 border-b border-[#E8E8E8] flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[#1C1C1C]">Your Cart</h3>
                {restaurantName && (
                  <p className="text-xs text-[#696969] mt-0.5">
                    Ordering from <span className="font-semibold text-[#1C1C1C]">{restaurantName}</span>
                  </p>
                )}
              </div>
              <button
                onClick={closeDrawer}
                className="w-8 h-8 rounded-[8px] bg-[#FAF9F6] border border-[#E8E8E8] text-[#1C1C1C] flex items-center justify-center font-bold hover:bg-[#E8E8E8] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-[#E8E8E8]">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#696969]">
                  <span className="text-4xl mb-3">🍽️</span>
                  <p className="font-bold text-[#1C1C1C] text-sm">Your cart is empty</p>
                  <p className="text-xs mt-1">Explore nearby restaurants to add delicious meals!</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.menuItemId} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      {/* Veg / Non-Veg Icon */}
                      <span
                        className={`w-3.5 h-3.5 border rounded-[3px] flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          item.isVeg ? "border-[#2E7D32]" : "border-[#E23744]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? "bg-[#2E7D32]" : "bg-[#E23744]"
                          }`}
                        />
                      </span>

                      <div>
                        <p className="text-xs font-bold text-[#1C1C1C] leading-snug">{item.name}</p>
                        <p className="text-xs font-semibold text-[#696969] mt-0.5">₹{item.price}</p>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center border border-[#E8E8E8] rounded-[6px] bg-[#FAF9F6] px-1 py-0.5">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, -1)}
                        className="w-6 h-6 flex items-center justify-center text-[#E23744] font-black text-sm hover:bg-[#FFFFFF] rounded cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-extrabold text-[#1C1C1C]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, 1)}
                        className="w-6 h-6 flex items-center justify-center text-[#2E7D32] font-black text-sm hover:bg-[#FFFFFF] rounded cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-xs font-bold text-[#1C1C1C] w-14 text-right">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Checkout CTA */}
            {items.length > 0 && (
              <div className="p-4 border-t border-[#E8E8E8] bg-[#FAF9F6]">
                <div className="flex items-center justify-between text-xs text-[#696969] mb-1">
                  <span>Item Subtotal</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#696969] mb-3">
                  <span>Delivery Fee</span>
                  <span className="text-[#2E7D32] font-semibold">FREE</span>
                </div>

                <div className="flex items-center justify-between text-sm font-extrabold text-[#1C1C1C] pb-3 border-b border-[#E8E8E8] mb-3">
                  <span>Grand Total</span>
                  <span className="text-base text-[#E23744]">₹{totalAmount}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={clearCart}
                    className="px-3 py-2.5 rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] text-xs font-semibold text-[#696969] hover:text-[#E23744] cursor-pointer"
                  >
                    Clear
                  </button>
                  <Link
                    href="/checkout"
                    onClick={closeDrawer}
                    className="flex-1 text-center py-2.5 rounded-[8px] bg-[#E23744] text-[#FFFFFF] text-xs font-bold hover:opacity-95 cursor-pointer shadow-xs"
                  >
                    Proceed to Checkout →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default CartDrawer;
