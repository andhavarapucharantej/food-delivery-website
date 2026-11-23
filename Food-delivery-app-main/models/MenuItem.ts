import mongoose, { Schema, Model, Types } from "mongoose";

export interface IMenuItem {
  restaurantId: Types.ObjectId;
  name: string;
  description: string;
  price: number; // integer rupees
  category: string; // menu section e.g. "Starters", "Main Course"
  isVeg: boolean;
  image: string;
  isAvailable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value for price.",
      },
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    isVeg: {
      type: Boolean,
      required: true,
      default: true,
    },
    image: {
      type: String,
      default: "/placeholder-food.svg",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index on restaurantId and name
MenuItemSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

export const MenuItem: Model<IMenuItem> =
  (mongoose.models.MenuItem as Model<IMenuItem>) ||
  mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);

export default MenuItem;
