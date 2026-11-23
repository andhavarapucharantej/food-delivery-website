import mongoose, { Schema, Model, Types } from "mongoose";

export interface IOrderItem {
  menuItemId: Types.ObjectId;
  name: string;
  price: number; // integer rupees
  quantity: number;
}

export interface IOrderDeliveryPartner {
  name: string;
  phone: string;
  vehicleNo: string;
  rating: number;
}

export interface IOrder {
  userId: Types.ObjectId;
  restaurantId: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number; // integer rupees
  deliveryAddress: string;
  deliveryCoordinates: {
    lat: number;
    lng: number;
  };
  outForDeliveryAt?: Date;
  deliveryPartner: IOrderDeliveryPartner;
  etaSeconds: number;
  status: "Placed" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer price.",
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer quantity.",
      },
    },
  },
  { _id: false }
);

const OrderDeliveryPartnerSchema = new Schema<IOrderDeliveryPartner>(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    vehicleNo: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: function (val: IOrderItem[]) {
          return Array.isArray(val) && val.length > 0;
        },
        message: "Order must have at least one item.",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer totalAmount.",
      },
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryCoordinates: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    outForDeliveryAt: {
      type: Date,
    },
    deliveryPartner: {
      type: OrderDeliveryPartnerSchema,
      required: true,
    },
    etaSeconds: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "Placed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Placed",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
