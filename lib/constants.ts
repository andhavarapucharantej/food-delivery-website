export interface CityCentre {
  name: string;
  lat: number;
  lng: number;
}

export interface DeliveryPartnerStatic {
  name: string;
  phone: string;
  vehicleNo: string;
  rating: number;
}

export const CITY_CENTRE: CityCentre = {
  name: "Vijayawada (KL University)",
  lat: 16.4422,
  lng: 80.6225,
};

export const SEEDED_DELIVERY_PARTNERS: DeliveryPartnerStatic[] = [
  {
    name: "Ramesh Kumar",
    phone: "98XXXXXX21",
    vehicleNo: "AP-16-EA-1021",
    rating: 4.8,
  },
  {
    name: "Suresh Patel",
    phone: "98XXXXXX34",
    vehicleNo: "AP-16-MB-4534",
    rating: 4.9,
  },
  {
    name: "Priya Sharma",
    phone: "97XXXXXX56",
    vehicleNo: "AP-16-TC-8856",
    rating: 4.7,
  },
  {
    name: "Amit Verma",
    phone: "99XXXXXX78",
    vehicleNo: "AP-16-JD-1278",
    rating: 4.9,
  },
  {
    name: "Deepa Rao",
    phone: "96XXXXXX90",
    vehicleNo: "AP-16-KN-3490",
    rating: 4.8,
  },
  {
    name: "Vikram Singh",
    phone: "98XXXXXX12",
    vehicleNo: "AP-16-PL-5612",
    rating: 4.6,
  },
  {
    name: "Rajesh Nair",
    phone: "97XXXXXX43",
    vehicleNo: "AP-16-RX-7843",
    rating: 4.9,
  },
  {
    name: "Anjali Joshi",
    phone: "99XXXXXX65",
    vehicleNo: "AP-16-QW-9065",
    rating: 4.8,
  },
  {
    name: "Mohammed Ali",
    phone: "96XXXXXX87",
    vehicleNo: "AP-16-VB-2387",
    rating: 4.7,
  },
  {
    name: "Karthik Reddy",
    phone: "98XXXXXX09",
    vehicleNo: "AP-16-ZX-6709",
    rating: 4.9,
  },
];

export const ORDER_STATUSES = [
  "Placed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CUISINES = [
  "All",
  "Biryani",
  "North Indian",
  "South Indian",
  "Pizza",
  "Burgers",
  "Desserts",
  "Chinese",
] as const;
