"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";

interface TiltCardProps {
  title: string;
  badge: string;
  description: string;
  accentColor: string;
  icon: string;
  extraDepthContent: React.ReactNode;
}

function TiltCard({
  title,
  badge,
  description,
  accentColor,
  icon,
  extraDepthContent,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((centerY - y) / centerY) * 14;
    const rotateY = ((x - centerX) / centerX) * 14;
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="perspective-1000 w-full"
    >
      <div
        style={{
          transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${
            isHovered ? 1.02 : 1
          }, ${isHovered ? 1.02 : 1}, 1)`,
          transformStyle: "preserve-3d",
          transition: isHovered ? "transform 0.08s ease-out" : "transform 0.5s ease-out",
        }}
        className="rounded-[12px] bg-[#FFFFFF] border border-[#E8E8E8] p-6 shadow-md hover:shadow-xl transition-shadow relative overflow-hidden"
      >
        {/* Subtle Specular Sheen Effect in 3D */}
        <div
          style={{
            transform: "translateZ(10px)",
            background: isHovered
              ? `radial-gradient(circle at 50% 20%, rgba(226, 55, 68, 0.08), transparent 70%)`
              : "none",
          }}
          className="absolute inset-0 pointer-events-none transition-all duration-300"
        />

        {/* Top Header Badge in 3D */}
        <div
          style={{ transform: "translateZ(25px)" }}
          className="flex items-center justify-between mb-4"
        >
          <span
            style={{ color: accentColor, borderColor: `${accentColor}30`, backgroundColor: `${accentColor}10` }}
            className="text-[11px] font-black tracking-wide uppercase px-2.5 py-1 rounded-[6px] border"
          >
            {badge}
          </span>
          <span className="text-2xl">{icon}</span>
        </div>

        {/* 3D Visual Centerpiece */}
        <div
          style={{ transform: "translateZ(45px)", transformStyle: "preserve-3d" }}
          className="my-5 flex items-center justify-center min-h-[120px]"
        >
          {extraDepthContent}
        </div>

        {/* Card Copy in 3D */}
        <div style={{ transform: "translateZ(30px)" }}>
          <h3 className="text-base font-extrabold text-[#1C1C1C] mb-1.5">{title}</h3>
          <p className="text-xs text-[#696969] leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function ThreeDSection() {
  const [cubeRotation, setCubeRotation] = useState({ x: -15, y: 35 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    setCubeRotation((prev) => ({
      x: prev.x - deltaY * 0.5,
      y: prev.y + deltaX * 0.5,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <section className="mt-16 pt-12 border-t border-[#E8E8E8] bg-gradient-to-b from-transparent to-[#FAF9F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-[#E23744]/10 border border-[#E23744]/20 rounded-full px-3 py-1 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#E23744] animate-pulse" />
            <span className="text-[11px] font-black text-[#E23744] uppercase tracking-wider">
              3D Interactive Telemetry
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1C1C1C] tracking-tight">
            Next-Gen Campus Delivery Experience
          </h2>
          <p className="text-xs sm:text-sm text-[#696969] mt-2">
            Engineered exclusively for KL University & Vijayawada with live 3D telemetry,
            doorstep GPS precision, and thermal freshness locking.
          </p>
        </div>

        {/* 3D Interactive Perspective Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* 3D Card 1: Express Rider Fleet */}
          <TiltCard
            title="3D Express Campus Fleet"
            badge="⚡ Instant Dispatch"
            accentColor="#E23744"
            icon="🛵"
            description="Dedicated AP-16 riders stationed right at Vaddeswaram gate. Zero detours, reaching KL University hostels in 12–15 minutes."
            extraDepthContent={
              <div className="relative flex flex-col items-center justify-center animate-float-3d">
                <div
                  style={{ transform: "translateZ(40px)" }}
                  className="w-20 h-20 rounded-full bg-[#E23744]/10 border border-[#E23744]/30 flex items-center justify-center shadow-lg"
                >
                  <span className="text-4xl filter drop-shadow-md">🛵</span>
                </div>
                {/* 3D floating tag */}
                <div
                  style={{ transform: "translateZ(55px)" }}
                  className="mt-2 bg-[#1C1C1C] text-[#FFFFFF] text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                  <span>Avg 12 Mins • Live</span>
                </div>
              </div>
            }
          />

          {/* 3D Card 2: Thermal Freshness Locking */}
          <TiltCard
            title="3D Thermal Freshness Lock"
            badge="🔥 65°C Guaranteed"
            accentColor="#2E7D32"
            icon="🍲"
            description="Multi-layered insulation crates preserving piping-hot dum biryanis, crusty pizzas, and fresh tiffins all the way to your study desk."
            extraDepthContent={
              <div className="relative flex flex-col items-center justify-center animate-float-3d">
                <div
                  style={{ transform: "translateZ(40px)" }}
                  className="w-20 h-20 rounded-full bg-[#2E7D32]/10 border border-[#2E7D32]/30 flex items-center justify-center shadow-lg"
                >
                  <span className="text-4xl filter drop-shadow-md">🍕</span>
                </div>
                <div
                  style={{ transform: "translateZ(55px)" }}
                  className="mt-2 bg-[#2E7D32] text-[#FFFFFF] text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5"
                >
                  <span>🔥 Fresh & Steam Hot</span>
                </div>
              </div>
            }
          />

          {/* 3D Card 3: Precise Campus Geofence Radar */}
          <TiltCard
            title="3D KL Campus Radar"
            badge="📍 Doorstep Precision"
            accentColor="#1C1C1C"
            icon="🛰️"
            description="Building-level GPS pinpointing covering FED, SAC, Central Library, and Hostels Block 1–4 without calls or confusion."
            extraDepthContent={
              <div className="relative flex flex-col items-center justify-center">
                {/* Pulsing Radar Ring */}
                <div className="absolute w-24 h-24 rounded-full border-2 border-[#E23744]/40 animate-radar-ping pointer-events-none" />
                <div
                  style={{ transform: "translateZ(40px)" }}
                  className="w-20 h-20 rounded-full bg-[#1C1C1C] text-[#FFFFFF] border border-[#E8E8E8] flex items-center justify-center shadow-lg relative z-10"
                >
                  <span className="text-3xl filter drop-shadow-md">🎓</span>
                </div>
                <div
                  style={{ transform: "translateZ(55px)" }}
                  className="mt-2 bg-[#FFFFFF] border border-[#E8E8E8] text-[#1C1C1C] text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1"
                >
                  <span>📍 KL Univ Vaddeswaram</span>
                </div>
              </div>
            }
          />
        </div>

        {/* Interactive 3D Cube Showcase */}
        <div className="rounded-[12px] bg-[#1C1C1C] text-[#FFFFFF] p-8 sm:p-12 shadow-2xl relative overflow-hidden mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7">
              <span className="inline-block bg-[#E23744] text-[#FFFFFF] text-[10px] font-black px-2.5 py-1 rounded-[4px] uppercase tracking-wider mb-3">
                Interactive 3D Visualizer
              </span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#FFFFFF] mb-3">
                Full 360° Order Telemetry Cube
              </h3>
              <p className="text-xs sm:text-sm text-[#E8E8E8]/80 leading-relaxed max-w-xl mb-6">
                Drag the 3D cube with your mouse or finger to inspect live Tastevio telemetry pillars.
                Real-time connection established between Vijayawada food hubs and KL University student desks.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/orders"
                  className="px-4 py-2.5 rounded-[8px] bg-[#E23744] hover:bg-[#E23744]/90 text-[#FFFFFF] text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5"
                >
                  <span>📦 Track Live Orders</span>
                </Link>
                <div className="px-3.5 py-2.5 rounded-[8px] bg-[#FFFFFF]/10 border border-[#FFFFFF]/15 text-xs text-[#FFFFFF] font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
                  <span>KL Campus Telemetry: Active</span>
                </div>
              </div>
            </div>

            {/* Right: Interactive 3D Cube */}
            <div
              className="lg:col-span-5 flex flex-col items-center justify-center py-6 select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div className="perspective-1000 w-44 h-44 cursor-grab active:cursor-grabbing">
                <div
                  style={{
                    transform: `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg)`,
                    transformStyle: "preserve-3d",
                    transition: isDragging ? "none" : "transform 0.4s ease-out",
                  }}
                  className="w-full h-full relative preserve-3d"
                >
                  {/* Face 1: Front */}
                  <div
                    style={{ transform: "translateZ(88px)" }}
                    className="absolute inset-0 bg-[#E23744] text-[#FFFFFF] rounded-[10px] border-2 border-[#FFFFFF]/30 flex flex-col items-center justify-center p-3 text-center shadow-xl backface-hidden"
                  >
                    <span className="text-3xl mb-1">🛵</span>
                    <span className="font-extrabold text-xs">Tastevio</span>
                    <span className="text-[10px] text-[#FFFFFF]/80">Express Fleet</span>
                  </div>

                  {/* Face 2: Back */}
                  <div
                    style={{ transform: "rotateY(180deg) translateZ(88px)" }}
                    className="absolute inset-0 bg-[#1C1C1C] text-[#FFFFFF] rounded-[10px] border-2 border-[#E23744] flex flex-col items-center justify-center p-3 text-center shadow-xl backface-hidden"
                  >
                    <span className="text-3xl mb-1">🎓</span>
                    <span className="font-extrabold text-xs">KL University</span>
                    <span className="text-[10px] text-[#2E7D32] font-bold">Campus Hub</span>
                  </div>

                  {/* Face 3: Right */}
                  <div
                    style={{ transform: "rotateY(90deg) translateZ(88px)" }}
                    className="absolute inset-0 bg-[#2E7D32] text-[#FFFFFF] rounded-[10px] border-2 border-[#FFFFFF]/30 flex flex-col items-center justify-center p-3 text-center shadow-xl backface-hidden"
                  >
                    <span className="text-3xl mb-1">🍕</span>
                    <span className="font-extrabold text-xs">Hot & Crisp</span>
                    <span className="text-[10px] text-[#FFFFFF]/80">Oven Fresh</span>
                  </div>

                  {/* Face 4: Left */}
                  <div
                    style={{ transform: "rotateY(-90deg) translateZ(88px)" }}
                    className="absolute inset-0 bg-[#FFFFFF] text-[#1C1C1C] rounded-[10px] border-2 border-[#E8E8E8] flex flex-col items-center justify-center p-3 text-center shadow-xl backface-hidden"
                  >
                    <span className="text-3xl mb-1">🍛</span>
                    <span className="font-extrabold text-xs">Royal Biryani</span>
                    <span className="text-[10px] text-[#696969]">4.8★ Top Rated</span>
                  </div>

                  {/* Face 5: Top */}
                  <div
                    style={{ transform: "rotateX(90deg) translateZ(88px)" }}
                    className="absolute inset-0 bg-[#FAF9F6] text-[#E23744] rounded-[10px] border-2 border-[#E23744] flex flex-col items-center justify-center p-3 text-center shadow-xl backface-hidden"
                  >
                    <span className="text-3xl mb-1">⚡</span>
                    <span className="font-black text-xs">15 Mins</span>
                    <span className="text-[10px] text-[#1C1C1C]">Doorstep Arrival</span>
                  </div>

                  {/* Face 6: Bottom */}
                  <div
                    style={{ transform: "rotateX(-90deg) translateZ(88px)" }}
                    className="absolute inset-0 bg-[#1C1C1C] text-[#2E7D32] rounded-[10px] border-2 border-[#2E7D32] flex flex-col items-center justify-center p-3 text-center shadow-xl backface-hidden"
                  >
                    <span className="text-3xl mb-1">🏷️</span>
                    <span className="font-black text-xs">₹0 Delivery</span>
                    <span className="text-[10px] text-[#FFFFFF]/80">On Campus Orders</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#696969] mt-4 flex items-center gap-1">
                <span>🖱️ Click & drag to rotate 3D cube</span>
              </p>
            </div>
          </div>
        </div>

        {/* Site Footer at Last */}
        <footer className="border-t border-[#E8E8E8] py-8 text-xs text-[#696969]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-[6px] bg-[#E23744] text-[#FFFFFF] font-black text-xs flex items-center justify-center">
                TV
              </span>
              <span className="font-extrabold text-sm text-[#1C1C1C]">Tastevio</span>
              <span className="text-[11px] text-[#696969]">
                • KL University Campus Express, Vijayawada
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <Link href="/" className="hover:text-[#E23744] transition-colors">
                Restaurants
              </Link>
              <Link href="/orders" className="hover:text-[#E23744] transition-colors">
                My Orders
              </Link>
              <Link href="/admin" className="hover:text-[#E23744] transition-colors">
                Admin Portal
              </Link>
            </div>

            <p className="text-[11px]">
              © {new Date().getFullYear()} Tastevio Technologies. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </section>
  );
}

export default ThreeDSection;
