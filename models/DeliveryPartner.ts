import mongoose, { Schema, Model } from "mongoose";

export interface IDeliveryPartner {
  name: string;
  phone: string; // masked e.g. "98XXXXXX21"
  vehicleNo: string; // unique
  rating: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const DeliveryPartnerSchema = new Schema<IDeliveryPartner>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 4.8,
    },
  },
  {
    timestamps: true,
  }
);

export const DeliveryPartner: Model<IDeliveryPartner> =
  (mongoose.models.DeliveryPartner as Model<IDeliveryPartner>) ||
  mongoose.model<IDeliveryPartner>("DeliveryPartner", DeliveryPartnerSchema);

export default DeliveryPartner;
