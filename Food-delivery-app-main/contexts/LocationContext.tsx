"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CITY_CENTRE } from "@/lib/constants";
import { useToast } from "./ToastContext";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationState {
  coords: Coordinates | null;
  city: string;
  mode: "gps" | "city";
}

interface LocationContextType {
  location: LocationState;
  isLocating: boolean;
  mounted: boolean;
  setCity: (city: string) => void;
  useMyLocation: () => void;
  setManualCoords: (coords: Coordinates) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = "fd_location_pref";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationState>({
    coords: null,
    city: CITY_CENTRE.name,
    mode: "city",
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const toast = useToast();

  // Hydration safety: read localStorage only on client after mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as LocationState;
        if (parsed && typeof parsed.city === "string") {
          // Auto-migrate previous default to new default
          if (parsed.city === "Bengaluru") {
            const migrated: LocationState = {
              city: CITY_CENTRE.name,
              coords: null,
              mode: "city",
            };
            setLocation(migrated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          } else {
            setLocation(parsed);
          }
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  const persistLocation = (next: LocationState) => {
    setLocation(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage write errors
    }
  };

  const setCity = (cityName: string) => {
    persistLocation({
      coords: null,
      city: cityName,
      mode: "city",
    });
  };

  const setManualCoords = (coords: Coordinates) => {
    persistLocation({
      ...location,
      coords,
    });
  };

  // Called ONLY on click of "Use my location", NEVER on page load
  const useMyLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        persistLocation({
          coords: { lat: latitude, lng: longitude },
          city: CITY_CENTRE.name, // or detected area
          mode: "gps",
        });
        toast.success("GPS Location updated successfully");
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = "Could not fetch GPS location";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permission denied. Using city selector.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out. Using city selector.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location information unavailable. Using city selector.";
        }
        toast.error(errorMsg);
        // Fall back to city mode
        persistLocation({
          coords: null,
          city: location.city || CITY_CENTRE.name,
          mode: "city",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [location.city, toast]);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLocating,
        mounted,
        setCity,
        useMyLocation,
        setManualCoords,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
