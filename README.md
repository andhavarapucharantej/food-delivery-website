# Food-delivery-app

A full-stack food delivery web application inspired by Zomato and Swiggy, built with Next.js 16 App Router, TypeScript (strict, zero `any`), Tailwind CSS v4, and MongoDB Atlas with Mongoose.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Server & Client Components)
- **Language**: TypeScript (strict mode, zero `any`)
- **Styling**: Tailwind CSS v4 (CSS-first, `@theme` tokens in `app/globals.css`, `@tailwindcss/postcss`)
- **Database & ODM**: MongoDB Atlas + Mongoose
- **Auth & Security**: `jose` (HS256 JWT, 7-day expiry) + `bcryptjs`
- **Mapping & Tracking**: Leaflet & `react-leaflet` v5 (dynamic client import, custom `divIcon` markers, OpenStreetMap)
- **Deployment Target**: Vercel

## Project Structure
- `lib/`: Core helpers (`constants.ts`, `mongodb.ts`, `auth.ts`, `serialize.ts`, `images.ts`, `geo.ts`)
- `models/`: Mongoose models (`User`, `Restaurant`, `MenuItem`, `DeliveryPartner`, `Order`)
- `proxy.ts`: Edge/middleware authentication & route-protection layer
- `public/`: Static assets including `placeholder-food.svg`

## Setup & Running
1. Copy `.env.example` to `.env` and fill in:
   - `MONGODB_URI`
   - `JWT_SECRET` (min 32 characters)
   - `SEED_SECRET`
   - `ADMIN_EMAIL` & `ADMIN_PASSWORD`
   - `SIMULATE_DELIVERY=true`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```
4. Build & Lint:
   ```bash
   npm run lint
   npm run build
   ```
