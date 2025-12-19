# Parking Flow (বাংলা সারসংক্ষেপ)

একটি ফুল-স্ট্যাক পার্কিং প্ল্যাটফর্ম: Next.js ফ্রন্টএন্ড + Laravel (JWT) ব্যাকএন্ড। ড্রাইভাররা নিকটস্থ স্পেস খুঁজে বুক করতে পারে, প্রোভাইডার/অ্যাডমিন একই ড্যাশবোর্ডে স্পেস, অ্যাভেইলেবিলিটি ও বুকিং ম্যানেজ করে।

## টেক স্ট্যাক
- ফ্রন্টএন্ড: Next.js 16 (App Router), React 19, Tailwind CSS 4
- ব্যাকএন্ড: Laravel + JWT (tymon/jwt-auth), REST API `/api/v1`
- ম্যাপ: Leaflet (কোনো API key লাগে না), ঐচ্ছিক Google Places autocomplete

## দ্রুত শুরু
1) ব্যাকএন্ড (`ParkingApi`)
   ```bash
   # .env কনফিগার করুন (DB/APP_URL), তারপর
   php artisan migrate --seed
   php artisan serve   # ডিফল্ট http://127.0.0.1:8000
   ```
2) ফ্রন্টএন্ড (`Parking_frontend`)
   `./.env.local` তৈরি করুন:
   ```bash
   NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api/v1
   # ঐচ্ছিক:
   # NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY
   ```
   রান করুন:
   ```bash
   npm install
   npm run dev      # http://localhost:3000
   # npm run build && npm start   # প্রোডাকশন
   ```

## ভূমিকা ও ফ্লো
- **Driver**: ঠিকানা/ম্যাপ পিন দিয়ে সার্চ, দূরত্ব ও অ্যাভেইলেবিলিটি দেখা, বুক/ক্যানসেল, লাইভ GPS সাপোর্ট।
- **Provider/Admin**: স্পেস তৈরি, অ্যাভেইলেবিলিটি উইন্ডো সেট, বুকিং স্টেট পরিচালনা (confirm, check-in/out, cancel), আয় স্ন্যাপশট।
- **Auth**: ফোন + পাসওয়ার্ড; JWT ক্লায়েন্টে `localStorage` এ রাখা হয়।

## মূল UI স্ক্রিন
- `app/page.js`: ল্যান্ডিং + সার্চ (অ্যাড্রেস ইনপুট, ম্যাপ পিকার, রেজাল্ট লিস্ট)।
- `app/login/page.js`, `app/register/page.js`: লগইন/রেজিস্ট্রেশন, রোল নির্বাচন সহ।
- `app/dashboard/page.js`: রোল-ভিত্তিক ট্যাব (Driver, Provider/Admin), লাইভ ম্যাপ, স্পেস/অ্যাভেইলেবিলিটি ফর্ম, বুকিং অ্যাকশন, দ্রুত এনালিটিকস।
- কম্পোনেন্ট: `app/components/MapPicker.js`, `LiveMap.js`, `SearchPanel.js`, `SpaceForm.js`, `BookingsList.js` ইত্যাদি।

## API ডাটা মডেল (Laravel)
- `users`: id, name, phone (unique), email?, role [driver|provider|admin], password, last_lat?, last_lng?, last_located_at?, timestamps.
- `parking_spaces`: id, provider_id→users, title, description?, address?, place_label?, lat, lng, capacity, height_limit?, is_active, timestamps.
- `space_availability`: id, space_id→parking_spaces, start_ts, end_ts, base_price_per_hour, is_active, timestamps.
- `bookings`: id, user_id→users, space_id→parking_spaces, start_ts, end_ts, hours, price_total, status [reserved|confirmed|checked_in|checked_out|completed|cancelled], hold_expires_at?, checked_in_at?, checked_out_at?, timestamps.
- ER ডায়াগ্রাম: `er-diagram.svg` / `er-diagram.png` (ফ্রন্টএন্ড রুট)।

## নোট ও রিস্ক
- JWT `localStorage` এ আছে; নিরাপত্তা বাড়াতে httpOnly কুকি + রিফ্রেশ টোকেন বিবেচনা করুন।
- ম্যাপ/জিওকোড বাইরের সার্ভিসে নির্ভর; প্রোডাকশনে রেট-লিমিট/ফলব্যাক যুক্ত করুন।
- অটোমেটেড টেস্ট নেই; Auth, Search, Booking, Provider ফ্লোর জন্য E2E/ইন্টেগ্রেশন টেস্ট যোগ করুন।

## স্ক্রিপ্ট
- ফ্রন্টএন্ড: `npm run dev`, `npm run build`, `npm start`
- ব্যাকএন্ড: `php artisan serve`, `php artisan migrate --seed`

## সিড ক্রেডেনশিয়াল (উদাহরণ)
- ব্যাকএন্ড সিডার: `01700000001/02/03` + `password` (driver/provider/admin)।
