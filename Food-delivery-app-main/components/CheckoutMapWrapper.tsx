"use client";

import React from "react";
import dynamic from "next/dynamic";

interface CheckoutMapWrapperProps {
  initialLat: number;
  initialLng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
}

const DynamicCheckoutMap = dynamic(() => import("./CheckoutMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[260px] rounded-[8px] bg-[#FAF9F6] border border-[#E8E8E8] flex flex-col items-center justify-center text-sm text-[#696969] animate-pulse">
      <div className="w-8 h-8 rounded-full border-2 border-[#E23744] border-t-transparent animate-spin mb-2" />
      <span>Loading interactive map...</span>
    </div>
  ),
});

export function CheckoutMapWrapper(props: CheckoutMapWrapperProps) {
  return <DynamicCheckoutMap {...props} />;
}

export default CheckoutMapWrapper;
