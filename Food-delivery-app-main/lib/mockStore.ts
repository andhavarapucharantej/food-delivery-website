import { CITY_CENTRE, SEEDED_DELIVERY_PARTNERS } from "./constants";
import { RESTAURANT_IMAGES, FOOD_IMAGES } from "./images";
import { haversineDistanceKm, computeEtaSeconds, geoJsonToLatLng } from "./geo";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  address: string;
}

export interface MockRestaurant {
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
}

export interface MockMenuItem {
  _id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  image: string;
  isAvailable: boolean;
}

export interface MockOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface MockOrder {
  _id: string;
  userId: string;
  restaurantId: {
    _id: string;
    name: string;
    image: string;
    location: string;
    coordinates: {
      type: "Point";
      coordinates: [number, number];
    };
  };
  items: MockOrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryCoordinates: {
    lat: number;
    lng: number;
  };
  deliveryPartner: {
    name: string;
    phone: string;
    vehicleNo: string;
    rating: number;
  };
  etaSeconds: number;
  outForDeliveryAt?: string;
  status: "Placed" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";
  createdAt: string;
}

interface MockStoreState {
  users: MockUser[];
  restaurants: MockRestaurant[];
  menuItems: MockMenuItem[];
  orders: MockOrder[];
}

declare global {
  var mockStoreGlobal: MockStoreState | undefined;
}

function initializeMockData(): MockStoreState {
  const users: MockUser[] = [
    {
      id: "usr_admin_001",
      name: "Charan",
      email: "charan@admin.com",
      password: "Bitcoin@100",
      role: "admin",
      address: "Tastevio Admin Office, KL University Gate, Vijayawada",
    },
    {
      id: "usr_admin_alias",
      name: "Charan",
      email: "admin@example.com",
      password: "Bitcoin@100",
      role: "admin",
      address: "Tastevio Admin Office, KL University Gate, Vijayawada",
    },
    {
      id: "usr_demo_001",
      name: "Charan",
      email: "charan@tastevio.com",
      password: "Bitcoin@100",
      role: "user",
      address: "Hostel Block 4, Room 312, KL University, Vaddeswaram, Vijayawada",
    },
    {
      id: "usr_demo_002",
      name: "Sai",
      email: "sai@tastevio.com",
      password: "Bitcoin@100",
      role: "user",
      address: "Room 205, Tulasi Residency, Beside KL University, Vijayawada",
    },
    {
      id: "usr_demo_003",
      name: "Sita Ram",
      email: "sitaram@tastevio.com",
      password: "Bitcoin@100",
      role: "user",
      address: "Faculty Quarters F-12, KL University, Vaddeswaram, Vijayawada",
    },
    {
      id: "usr_demo_004",
      name: "Priya",
      email: "priya@tastevio.com",
      password: "Bitcoin@100",
      role: "user",
      address: "Girls Hostel Block B, KL University, Vijayawada",
    },
    {
      id: "usr_demo_005",
      name: "Kalifia",
      email: "kalifia@tastevio.com",
      password: "Bitcoin@100",
      role: "user",
      address: "Green Fields Road, Near KL University, Vijayawada",
    },
    {
      id: "usr_demo_005_alias",
      name: "Kalifia",
      email: "khalifa@tastevio.com",
      password: "Bitcoin@100",
      role: "user",
      address: "Green Fields Road, Near KL University, Vijayawada",
    },
    {
      id: "usr_demo_legacy",
      name: "Charan (Demo)",
      email: "demo@example.com",
      password: "Bitcoin@100",
      role: "user",
      address: "Hostel Block 4, Room 312, KL University, Vaddeswaram, Vijayawada",
    },
  ];

  const restaurants: MockRestaurant[] = [
    {
      _id: "rest_biryani_01",
      name: "Royal Biryani Darbar",
      slug: "royal-biryani-darbar",
      cuisine: ["Biryani", "North Indian"],
      image: RESTAURANT_IMAGES.biryani,
      rating: 4.6,
      deliveryTime: 25,
      location: CITY_CENTRE.name,
      coordinates: {
        type: "Point",
        coordinates: [80.624, 16.445], // ~0.3 km from KL University
      },
      isOpen: true,
    },
    {
      _id: "rest_south_02",
      name: "Udupi Grand Tiffin",
      slug: "udupi-grand-tiffin",
      cuisine: ["South Indian"],
      image: RESTAURANT_IMAGES.southIndian,
      rating: 4.8,
      deliveryTime: 18,
      location: CITY_CENTRE.name,
      coordinates: {
        type: "Point",
        coordinates: [80.621, 16.4395], // ~0.4 km from KL University
      },
      isOpen: true,
    },
    {
      _id: "rest_pizza_03",
      name: "Bella Napoli Pizzeria",
      slug: "bella-napoli-pizzeria",
      cuisine: ["Pizza"],
      image: RESTAURANT_IMAGES.italian,
      rating: 4.7,
      deliveryTime: 30,
      location: CITY_CENTRE.name,
      coordinates: {
        type: "Point",
        coordinates: [80.619, 16.448], // ~0.7 km from KL University
      },
      isOpen: true,
    },
    {
      _id: "rest_burger_04",
      name: "Burger & Brew Diner",
      slug: "burger-and-brew-diner",
      cuisine: ["Burgers"],
      image: RESTAURANT_IMAGES.burgers,
      rating: 4.5,
      deliveryTime: 22,
      location: CITY_CENTRE.name,
      coordinates: {
        type: "Point",
        coordinates: [80.628, 16.441], // ~0.6 km from KL University
      },
      isOpen: true,
    },
  ];

  const menuItems: MockMenuItem[] = [
    // Biryani dishes
    {
      _id: "dish_01",
      restaurantId: "rest_biryani_01",
      name: "Hyderabadi Chicken Dum Biryani",
      description: "Fragrant basmati rice layered with succulent chicken pieces and traditional spices.",
      price: 320,
      category: "Main Course",
      isVeg: false,
      image: FOOD_IMAGES.chickenBiryani,
      isAvailable: true,
    },
    {
      _id: "dish_02",
      restaurantId: "rest_biryani_01",
      name: "Royal Paneer Tikka Biryani",
      description: "Tandoori spiced paneer cubes slow-cooked with basmati rice and saffron.",
      price: 260,
      category: "Main Course",
      isVeg: true,
      image: FOOD_IMAGES.vegBiryani,
      isAvailable: true,
    },
    {
      _id: "dish_03",
      restaurantId: "rest_biryani_01",
      name: "Murgh Butter Chicken",
      description: "Boneless tandoori chicken simmered in a creamy, velvety tomato butter gravy.",
      price: 290,
      category: "Main Course",
      isVeg: false,
      image: FOOD_IMAGES.butterChicken,
      isAvailable: true,
    },
    {
      _id: "dish_04",
      restaurantId: "rest_biryani_01",
      name: "Shahi Gulab Jamun (2 Pcs)",
      description: "Warm, melt-in-mouth milk solids soaked in aromatic cardamom-rose syrup.",
      price: 80,
      category: "Desserts",
      isVeg: true,
      image: FOOD_IMAGES.gulabJamun,
      isAvailable: true,
    },

    // South Indian dishes
    {
      _id: "dish_05",
      restaurantId: "rest_south_02",
      name: "Special Ghee Masala Dosa",
      description: "Golden crisp crepe roasted with pure desi ghee, filled with spiced potato masala.",
      price: 110,
      category: "South Indian",
      isVeg: true,
      image: FOOD_IMAGES.masalaDosa,
      isAvailable: true,
    },
    {
      _id: "dish_06",
      restaurantId: "rest_south_02",
      name: "Steamed Idli & Medu Vada Combo",
      description: "Two fluffy steamed rice cakes and one crispy lentil doughnut with sambar & chutney.",
      price: 90,
      category: "South Indian",
      isVeg: true,
      image: FOOD_IMAGES.idliVada,
      isAvailable: true,
    },
    {
      _id: "dish_07",
      restaurantId: "rest_south_02",
      name: "Dal Makhani with Garlic Naan",
      description: "Black lentils slow-cooked overnight with cream, butter, and handmade garlic naan.",
      price: 220,
      category: "Main Course",
      isVeg: true,
      image: FOOD_IMAGES.dalMakhani,
      isAvailable: true,
    },
    {
      _id: "dish_08",
      restaurantId: "rest_south_02",
      name: "Traditional South Filter Coffee",
      description: "Authentic decoction brewed filter coffee frothed with rich hot milk.",
      price: 45,
      category: "Beverages",
      isVeg: true,
      image: FOOD_IMAGES.filterCoffee,
      isAvailable: true,
    },

    // Pizza dishes
    {
      _id: "dish_09",
      restaurantId: "rest_pizza_03",
      name: "Classic Margherita Pizza (10\")",
      description: "San Marzano tomato sauce, fresh mozzarella fior di latte, and basil leaves.",
      price: 340,
      category: "Pizza",
      isVeg: true,
      image: FOOD_IMAGES.margheritaPizza,
      isAvailable: true,
    },
    {
      _id: "dish_10",
      restaurantId: "rest_pizza_03",
      name: "Farmhouse Loaded Pizza (10\")",
      description: "Topped with bell peppers, sweet corn, black olives, red onions, and mozzarella.",
      price: 410,
      category: "Pizza",
      isVeg: true,
      image: FOOD_IMAGES.farmhousePizza,
      isAvailable: true,
    },
    {
      _id: "dish_11",
      restaurantId: "rest_pizza_03",
      name: "Cheesy Stuffed Garlic Bread",
      description: "Freshly baked dough brushed with herb butter and filled with molten cheese.",
      price: 160,
      category: "Starters",
      isVeg: true,
      image: FOOD_IMAGES.garlicBread,
      isAvailable: true,
    },
    {
      _id: "dish_12",
      restaurantId: "rest_pizza_03",
      name: "Belgian Chocolate Fudge Brownie",
      description: "Rich dark chocolate brownie served with warm chocolate fudge glaze.",
      price: 150,
      category: "Desserts",
      isVeg: true,
      image: FOOD_IMAGES.chocolateBrownie,
      isAvailable: true,
    },

    // Burger dishes
    {
      _id: "dish_13",
      restaurantId: "rest_burger_04",
      name: "Flame Grilled Chicken Burger",
      description: "Juicy chicken patty grilled over flames with cheddar, lettuce, and secret sauce.",
      price: 240,
      category: "Burgers",
      isVeg: false,
      image: FOOD_IMAGES.chickenBurger,
      isAvailable: true,
    },
    {
      _id: "dish_14",
      restaurantId: "rest_burger_04",
      name: "Crispy Paneer Deluxe Burger",
      description: "Spiced crumbed paneer block topped with pickled jalapenos and cheese spread.",
      price: 210,
      category: "Burgers",
      isVeg: true,
      image: FOOD_IMAGES.vegBurger,
      isAvailable: true,
    },
    {
      _id: "dish_15",
      restaurantId: "rest_burger_04",
      name: "Peri Peri Crispy French Fries",
      description: "Hot crispy potato fries dusted with piquant peri peri seasoning.",
      price: 120,
      category: "Starters",
      isVeg: true,
      image: FOOD_IMAGES.frenchFries,
      isAvailable: true,
    },
    {
      _id: "dish_16",
      restaurantId: "rest_burger_04",
      name: "Paneer Butter Masala Bowl",
      description: "Tender paneer cubes in velvety butter gravy served with two warm rotis.",
      price: 230,
      category: "Main Course",
      isVeg: true,
      image: FOOD_IMAGES.paneerButterMasala,
      isAvailable: true,
    },
  ];

  const nowMs = Date.now();
  const sampleOrder: MockOrder = {
    _id: "ord_live_sample_01",
    userId: "usr_demo_001",
    restaurantId: {
      _id: "rest_biryani_01",
      name: "Royal Biryani Darbar",
      image: RESTAURANT_IMAGES.biryani,
      location: CITY_CENTRE.name,
      coordinates: {
        type: "Point",
        coordinates: [80.624, 16.445],
      },
    },
    items: [
      {
        menuItemId: "dish_01",
        name: "Hyderabadi Chicken Dum Biryani",
        price: 320,
        quantity: 2,
      },
      {
        menuItemId: "dish_04",
        name: "Shahi Gulab Jamun (2 Pcs)",
        price: 80,
        quantity: 1,
      },
    ],
    totalAmount: 720,
    deliveryAddress: "Hostel Block 4, KL University, Vaddeswaram, Vijayawada",
    deliveryCoordinates: {
      lat: 16.4422,
      lng: 80.6225,
    },
    deliveryPartner: {
      name: SEEDED_DELIVERY_PARTNERS[0].name,
      phone: SEEDED_DELIVERY_PARTNERS[0].phone,
      vehicleNo: SEEDED_DELIVERY_PARTNERS[0].vehicleNo,
      rating: SEEDED_DELIVERY_PARTNERS[0].rating,
    },
    etaSeconds: 180,
    outForDeliveryAt: new Date(nowMs - 30000).toISOString(),
    status: "Out for Delivery",
    createdAt: new Date(nowMs - 90000).toISOString(),
  };

  return {
    users,
    restaurants,
    menuItems,
    orders: [sampleOrder],
  };
}

const mockStore: MockStoreState = global.mockStoreGlobal ?? initializeMockData();

if (!global.mockStoreGlobal) {
  global.mockStoreGlobal = mockStore;
}

export const MockDB = {
  getUsers: () => mockStore.users,
  findUserByEmail: (email: string) =>
    mockStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  findUserById: (id: string) => mockStore.users.find((u) => u.id === id),
  addUser: (user: MockUser) => {
    mockStore.users.push(user);
    return user;
  },

  getRestaurants: () => mockStore.restaurants,
  findRestaurantById: (id: string) =>
    mockStore.restaurants.find((r) => r._id === id),
  addRestaurant: (rest: MockRestaurant) => {
    mockStore.restaurants.unshift(rest);
    return rest;
  },
  updateRestaurant: (id: string, updates: Partial<MockRestaurant>) => {
    const idx = mockStore.restaurants.findIndex((r) => r._id === id);
    if (idx > -1) {
      mockStore.restaurants[idx] = { ...mockStore.restaurants[idx], ...updates };
      return mockStore.restaurants[idx];
    }
    return null;
  },
  deleteRestaurant: (id: string) => {
    mockStore.restaurants = mockStore.restaurants.filter((r) => r._id !== id);
    mockStore.menuItems = mockStore.menuItems.filter((m) => m.restaurantId !== id);
  },

  getMenuItems: () => mockStore.menuItems,
  findMenuItemsByRestaurant: (restId: string) =>
    mockStore.menuItems.filter((m) => m.restaurantId === restId),
  findMenuItemById: (id: string) =>
    mockStore.menuItems.find((m) => m._id === id),
  addMenuItem: (item: MockMenuItem) => {
    mockStore.menuItems.unshift(item);
    return item;
  },
  updateMenuItem: (id: string, updates: Partial<MockMenuItem>) => {
    const idx = mockStore.menuItems.findIndex((m) => m._id === id);
    if (idx > -1) {
      mockStore.menuItems[idx] = { ...mockStore.menuItems[idx], ...updates };
      return mockStore.menuItems[idx];
    }
    return null;
  },
  deleteMenuItem: (id: string) => {
    mockStore.menuItems = mockStore.menuItems.filter((m) => m._id !== id);
  },

  getOrders: () => mockStore.orders,
  findOrderById: (id: string) => mockStore.orders.find((o) => o._id === id),
  addOrder: (order: MockOrder) => {
    mockStore.orders.unshift(order);
    return order;
  },
  updateOrder: (id: string, updates: Partial<MockOrder>) => {
    const idx = mockStore.orders.findIndex((o) => o._id === id);
    if (idx > -1) {
      mockStore.orders[idx] = { ...mockStore.orders[idx], ...updates };
      return mockStore.orders[idx];
    }
    return null;
  },
};
