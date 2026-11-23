"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  interpolateCoordinates,
  haversineDistanceMeters,
  formatDistance,
} from "@/lib/geo";

interface TrackingMapProps {
  restaurantCoords: { lat: number; lng: number };
  deliveryCoords: { lat: number; lng: number };
  outForDeliveryAtMs: number;
  etaSeconds: number;
  clockOffset: number;
  restaurantName: string;
}

// Custom DivIcons
const restaurantIcon = L.divIcon({
  className: "custom-map-icon",
  html: `<div style="background:#1C1C1C;color:#FFFFFF;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 5px rgba(0,0,0,0.3);border:2px solid #FFFFFF;">🏪</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const homeIcon = L.divIcon({
  className: "custom-map-icon",
  html: `<div style="background:#2E7D32;color:#FFFFFF;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 5px rgba(0,0,0,0.3);border:2px solid #FFFFFF;">🏠</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const riderIcon = L.divIcon({
  className: "custom-rider-icon",
  html: `<div style="background:#E23744;color:#FFFFFF;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 8px rgba(226,55,68,0.4);border:2px solid #FFFFFF;animation:pulse 2s infinite;">🛵</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function BoundsFitter({
  coords1,
  coords2,
}: {
  coords1: { lat: number; lng: number };
  coords2: { lat: number; lng: number };
}) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([
      [coords1.lat, coords1.lng],
      [coords2.lat, coords2.lng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  }, [map, coords1, coords2]);
  return null;
}

export default function TrackingMap({
  restaurantCoords,
  deliveryCoords,
  outForDeliveryAtMs,
  etaSeconds,
  clockOffset,
  restaurantName,
}: TrackingMapProps) {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const calculateProgress = () => {
      const now = Date.now() + clockOffset;
      const totalEtaMs = Math.max(90, etaSeconds) * 1000;
      const elapsed = Math.max(0, now - outForDeliveryAtMs);
      const frac = Math.min(1, Math.max(0, elapsed / totalEtaMs));
      setProgress(frac);
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 1000);
    return () => clearInterval(interval);
  }, [clockOffset, outForDeliveryAtMs, etaSeconds]);

  // Current interpolated rider coordinates
  const riderPosition = useMemo(() => {
    return interpolateCoordinates(restaurantCoords, deliveryCoords, progress);
  }, [restaurantCoords, deliveryCoords, progress]);

  // Remaining distance to destination
  const remainingMeters = useMemo(() => {
    return haversineDistanceMeters(
      riderPosition.lat,
      riderPosition.lng,
      deliveryCoords.lat,
      deliveryCoords.lng
    );
  }, [riderPosition, deliveryCoords]);

  return (
    <div className="w-full">
      <div className="relative w-full h-[320px] rounded-[8px] overflow-hidden border border-[#E8E8E8]">
        <MapContainer
          center={[restaurantCoords.lat, restaurantCoords.lng]}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-full z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Direct delivery line in brand red */}
          <Polyline
            positions={[
              [restaurantCoords.lat, restaurantCoords.lng],
              [deliveryCoords.lat, deliveryCoords.lng],
            ]}
            pathOptions={{
              color: "#E23744",
              weight: 3,
              opacity: 0.8,
              dashArray: "6, 8",
            }}
          />

          {/* Restaurant Marker */}
          <Marker
            position={[restaurantCoords.lat, restaurantCoords.lng]}
            icon={restaurantIcon}
          />

          {/* Delivery Home Marker */}
          <Marker
            position={[deliveryCoords.lat, deliveryCoords.lng]}
            icon={homeIcon}
          />

          {/* Animated Rider Marker */}
          <Marker
            position={[riderPosition.lat, riderPosition.lng]}
            icon={riderIcon}
          />

          <BoundsFitter
            coords1={restaurantCoords}
            coords2={deliveryCoords}
          />
        </MapContainer>

        {/* Legend Overlay */}
        <div className="absolute top-2 right-2 z-20 bg-[#FFFFFF]/95 backdrop-blur-sm px-3 py-2 rounded-[8px] border border-[#E8E8E8] shadow-sm text-xs flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[#1C1C1C]">
            <span>🏪</span>
            <span className="font-medium truncate max-w-[120px]">{restaurantName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#2E7D32]">
            <span>🏠</span>
            <span className="font-medium">Your Home</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#E23744]">
            <span>🛵</span>
            <span className="font-semibold">Delivery Partner</span>
          </div>
        </div>
      </div>

      {/* Accessible live status */}
      <div
        aria-live="off"
        className="mt-3 flex items-center justify-between p-3 rounded-[8px] bg-[#FAF9F6] border border-[#E8E8E8] text-sm"
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] animate-ping" />
          <span className="font-semibold text-[#1C1C1C]">
            {progress >= 0.98
              ? "Rider arriving at your doorstep!"
              : `Rider is ${formatDistance(remainingMeters / 1000)}`}
          </span>
        </div>
        <span className="text-xs text-[#696969] font-medium">
          {Math.round(progress * 100)}% route completed
        </span>
      </div>
    </div>
  );
}
