"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { CITY_CENTRE } from "@/lib/constants";
import { RESTAURANT_IMAGES } from "@/lib/images";

interface AdminRestaurant {
  _id: string;
  name: string;
  slug: string;
  cuisine: string[];
  image: string;
  rating: number;
  deliveryTime: number;
  location: string;
  coordinates: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  isOpen: boolean;
  menuItemsCount?: number;
}

export default function AdminRestaurantsPage() {
  const toast = useToast();
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [cuisineStr, setCuisineStr] = useState("North Indian, Biryani");
  const [image, setImage] = useState<string>(RESTAURANT_IMAGES.biryani);
  const [rating, setRating] = useState("4.5");
  const [deliveryTime, setDeliveryTime] = useState("30");
  const [locationName, setLocationName] = useState(CITY_CENTRE.name);
  const [lat, setLat] = useState(CITY_CENTRE.lat.toString());
  const [lng, setLng] = useState(CITY_CENTRE.lng.toString());
  const [isOpen, setIsOpen] = useState(true);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch("/api/admin/restaurants");
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data.restaurants || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleToggleOpen = async (restaurant: AdminRestaurant) => {
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurant._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: !restaurant.isOpen }),
      });
      if (res.ok) {
        toast.success(`Updated "${restaurant.name}" open status`);
        fetchRestaurants();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string, restName: string) => {
    const confirmDelete = window.confirm(
      `Delete "${restName}"? This will CASCADE DELETE all its menu items too!`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Deleted ${restName} and all its menu items`);
        fetchRestaurants();
      } else {
        toast.error("Failed to delete restaurant");
      }
    } catch {
      toast.error("Error deleting restaurant");
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const cuisines = cuisineStr
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        cuisine: cuisines,
        image: image.trim(),
        rating: parseFloat(rating),
        deliveryTime: parseInt(deliveryTime, 10),
        location: locationName.trim(),
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        isOpen,
      };

      const res = await fetch("/api/admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create restaurant");
      }

      toast.success("Restaurant added successfully!");
      setIsModalOpen(false);
      setName("");
      setSlug("");
      fetchRestaurants();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating restaurant";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1C1C1C]">
            Restaurant Management
          </h1>
          <p className="text-xs text-[#696969] mt-0.5">
            Create, update GeoJSON coordinates, and toggle live store status
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-[8px] bg-[#E23744] text-[#FFFFFF] text-xs font-bold hover:opacity-95 cursor-pointer shadow-xs"
        >
          + Add Restaurant
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-[#696969]">Loading restaurants...</div>
      ) : (
        <div className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-[#E8E8E8] text-[#696969] font-bold">
                <tr>
                  <th className="p-3">Restaurant</th>
                  <th className="p-3">Cuisines</th>
                  <th className="p-3">Coordinates (GeoJSON)</th>
                  <th className="p-3">Menu Items</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E8]">
                {restaurants.map((rest) => (
                  <tr key={rest._id} className="hover:bg-[#FAF9F6]">
                    <td className="p-3">
                      <div className="font-bold text-[#1C1C1C]">{rest.name}</div>
                      <div className="text-[11px] text-[#696969]">
                        /{rest.slug} • {rest.location}
                      </div>
                    </td>
                    <td className="p-3 text-[#696969]">
                      {rest.cuisine.join(", ")}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#1C1C1C]">
                      [{rest.coordinates.coordinates[0].toFixed(4)}, {rest.coordinates.coordinates[1].toFixed(4)}]
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-[#1C1C1C]">
                        {rest.menuItemsCount || 0} dishes
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleOpen(rest)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          rest.isOpen
                            ? "bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/30"
                            : "bg-[#E23744]/10 text-[#E23744] border border-[#E23744]/30"
                        }`}
                      >
                        {rest.isOpen ? "Active (Open)" : "Closed"}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(rest._id, rest.name)}
                        className="px-2.5 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Restaurant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-[#1C1C1C]/40 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-lg bg-[#FFFFFF] rounded-[8px] border border-[#E8E8E8] shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-extrabold text-[#1C1C1C] mb-4">
              Add New Restaurant
            </h2>

            <form onSubmit={handleCreateRestaurant} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1C1C1C] mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Royal Kitchen"
                  className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1C1C1C] mb-1">
                  Custom Slug (optional)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. royal-kitchen"
                  className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1C1C] mb-1">
                    Cuisines (comma separated)
                  </label>
                  <input
                    type="text"
                    value={cuisineStr}
                    onChange={(e) => setCuisineStr(e.target.value)}
                    className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1C1C1C] mb-1">City / Location</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1C1C1C] mb-1">Image URL</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1C1C] mb-1">
                    Latitude (-90..90)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1C1C1C] mb-1">
                    Longitude (-180..180)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1C1C] mb-1">Avg Delivery Mins</label>
                  <input
                    type="number"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1C1C1C] mb-1">Rating (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isOpenCheck"
                  checked={isOpen}
                  onChange={(e) => setIsOpen(e.target.checked)}
                />
                <label htmlFor="isOpenCheck" className="text-xs font-semibold text-[#1C1C1C]">
                  Accepting live orders now (isOpen: true)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E8E8]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-[6px] border border-[#E8E8E8] font-semibold text-[#696969]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-[6px] bg-[#E23744] text-[#FFFFFF] font-bold"
                >
                  {submitting ? "Saving..." : "Create Restaurant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
