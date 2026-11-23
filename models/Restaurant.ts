import mongoose, { Schema, Model } from "mongoose";

export interface IGeoPoint {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface IRestaurant {
  name: string;
  slug: string;
  cuisine: string[];
  image: string;
  rating: number;
  deliveryTime: number; // in minutes
  location: string; // city name string
  coordinates: IGeoPoint;
  isOpen: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const GeoPointSchema = new Schema<IGeoPoint>(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true,
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
      validate: {
        validator: function (val: number[]) {
          return (
            Array.isArray(val) &&
            val.length === 2 &&
            val[0] >= -180 &&
            val[0] <= 180 && // lng
            val[1] >= -90 &&
            val[1] <= 90 // lat
          );
        },
        message: "Coordinates must be a valid GeoJSON [longitude, latitude] pair.",
      },
    },
  },
  { _id: false }
);

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    cuisine: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.0,
    },
    deliveryTime: {
      type: Number,
      required: true,
      default: 30, // minutes
    },
    location: {
      type: String,
      required: true,
      trim: true, // city name string
    },
    coordinates: {
      type: GeoPointSchema,
      required: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geospatial queries
RestaurantSchema.index({ coordinates: "2dsphere" });

export const Restaurant: Model<IRestaurant> =
  (mongoose.models.Restaurant as Model<IRestaurant>) ||
  mongoose.model<IRestaurant>("Restaurant", RestaurantSchema);

export default Restaurant;
