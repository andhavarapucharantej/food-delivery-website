"use client";

import React from "react";
import dynamic from "next/dynamic";

interface TrackingMapWrapperProps {
  restaurantCoords: { lat: number; lng: number };
  deliveryCoords: { lat: number; lng: number };
  outForDeliveryAtMs: number;
  etaSeconds: number;
  clockOffset: number;
  restaurantName: string;
}

const DynamicTrackingMap = dynamic(() => import("./TrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] rounded-[8px] bg-[#FAF9F6] border border-[#E8E8E8] flex flex-col items-center justify-center text-sm text-[#696969] animate-pulse">
      <div className="w-9 h-9 rounded-full border-2 border-[#E23744] border-t-transparent animate-spin mb-3" />
      <span className="font-medium text-[#1C1C1C]">Connecting to live rider telemetry...</span>
      <span className="text-xs text-[#696969] mt-1">Preparing map coordinates</span>
    </div>
  ),
});

export function TrackingMapWrapper(props: TrackingMapWrapperProps) {
  return <DynamicTrackingMap {...props} />;
}

export default TrackingMapWrapper;
