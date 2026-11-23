"use client";

import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface CheckoutMapProps {
  initialLat: number;
  initialLng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
}

// Custom L.divIcon marker (no broken PNG asset paths)
const createPinIcon = () =>
  L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="background:#E23744;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #FFFFFF;box-shadow:0 3px 6px rgba(0,0,0,0.35);"></div>
        <div style="position:absolute;top:6px;width:10px;height:10px;background:#FFFFFF;border-radius:50%;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });

function MapClickHandler({
  onSelectCoords,
}: {
  onSelectCoords: (coords: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onSelectCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function CheckoutMap({
  initialLat,
  initialLng,
  onChange,
}: CheckoutMapProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });

  const pinIcon = useMemo(() => createPinIcon(), []);

  const handleDragEnd = (event: L.DragEndEvent) => {
    const marker = event.target as L.Marker;
    const { lat, lng } = marker.getLatLng();
    setPosition({ lat, lng });
    onChange({ lat, lng });
  };

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    setPosition(coords);
    onChange(coords);
  };

  return (
    <div className="relative w-full h-[260px] rounded-[8px] overflow-hidden border border-[#E8E8E8]">
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[position.lat, position.lng]}
          icon={pinIcon}
          draggable={true}
          eventHandlers={{
            dragend: handleDragEnd,
          }}
        />
        <MapClickHandler onSelectCoords={handleMapClick} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-20 bg-[#FFFFFF] px-2 py-1 rounded-[6px] border border-[#E8E8E8] text-[11px] text-[#696969] shadow-sm pointer-events-none">
        Drag pin or tap map to adjust delivery point
      </div>
    </div>
  );
}
