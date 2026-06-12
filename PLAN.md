# AutoRide Ghana — Car Rental + Car Sales Marketplace App


## Overview
A premium car rental and car sales marketplace app for the Ghanaian market with a stunning deep purple and vibrant orange design. Customers can browse trending cars, filter by brand/location/price, view detailed car specs, book rentals, buy cars, and manage their trips. The platform supports multiple user roles: Customer, Fleet Owner, Dealership, and Admin.

---

## Design
- [x] **Theme**: Deep purple gradient backgrounds with bright orange action buttons and accents
- [x] **Cards**: White elevated cards with rounded corners and subtle shadows for car listings
- [x] **Typography**: Bold headlines with mixed weight styling (e.g. "Trending **Cars**")
- [x] **Images**: Large, hero-style car photos that pop off the purple backgrounds
- [x] **Animations**: Smooth card press effects, page transitions, and micro-interactions
- [x] **Currency**: Ghana Cedis (GH₵) displayed throughout

---

## Features

### Customer Experience
- [x] Browse a curated list of trending rental cars with daily pricing
- [x] Filter cars by brand, price range, location, transmission, and availability
- [x] View detailed car pages with image gallery, specs (seats, transmission, horsepower), and reviews
- [x] Save favorite cars with a heart button
- [x] Book a car by selecting pickup/drop-off dates (interactive date picker) and location
- [x] Complete payment with Mobile Money (MTN, Vodafone, AirtelTigo), card, or wallet
- [x] View booking status and history with detailed trip information
- [x] Submit reviews and ratings after completed trips
- [x] Browse car sales marketplace with advanced filters (condition, brand, price)
- [x] Contact dealers via WhatsApp or phone call directly from listings

### Multi-Role Support
- [x] **Customer**: Browse, book, rent, buy cars, manage favorites and bookings
- [x] **Fleet Owner**: Dashboard with revenue stats, fleet management, earnings, and maintenance alerts
- [x] **Dealership**: Dashboard with listing views, leads tracking, and sales analytics
- [x] **Admin**: Overview dashboard with user management, KYC approvals, revenue analytics, and growth tracking

### Account & Security
- [x] Welcome, Login, Registration, and OTP verification flow
- [x] Auth guard — redirects unauthenticated users to welcome screen
- [x] Role-based route protection — prevents unauthorized dashboard access
- [x] KYC Verification with document upload simulation (Ghana Card, Driver's License, Passport, Selfie)
- [x] Role switching from Profile screen
- [x] Settings with notification toggles, security options (biometric, 2FA), dark mode, and language
- [x] Help & Support with FAQ accordion, contact form, and direct WhatsApp/Call/Email support
- [x] Wallet with balance, transaction history, and top-up options

---

## Screens

### Auth
- [x] 1. **Welcome** — Hero landing with animated entrance, CTA to get started or login
- [x] 2. **Login** — Email/password sign-in with dark themed UI
- [x] 3. **Register** — Account creation with name, email, phone, password
- [x] 4. **OTP Verify** — 4-digit code entry with auto-submit and countdown resend

### Main App (Tab Navigation)
- [x] 5. **Home (Explore)** — Location search bar, trending cars carousel, top brands with real logos, featured cars for sale, promo banner, near-you listings
- [x] 6. **Search & Filters** — Full filter screen with price range chips, brand, transmission, location
- [x] 7. **My Bookings** — Tabbed list (All, Active, Upcoming, Completed) with status badges — tapping opens Booking Detail
- [x] 8. **Profile** — User info, role badge, stats, menu links to Favorites, Notifications, KYC, Settings, Wallet, Help, role dashboards, and logout

### Stack Screens
- [x] 9. **Car Details** — Hero image gallery with dots, specs grid, features chips, owner info, WhatsApp + Call buttons, price bottom bar with "Rent Now"
- [x] 10. **Booking Flow** — Car summary, interactive date picker modal (pickup/return), location selector, live price breakdown, proceed to payment
- [x] 11. **Payment** — Order summary, payment method selection (MoMo providers, card, wallet), secure note, success screen with booking confirmation
- [x] 12. **Booking Detail** — Status banner, car summary, full trip details (dates, location, duration, price, reference), owner contact, "Rate Your Trip" CTA for completed bookings
- [x] 13. **Review** — Star rating selection, written review text area, quick tags, submit confirmation
- [x] 14. **Marketplace** — Car sales listings with search, condition filters, brand filters, dealer info, WhatsApp/Call buttons
- [x] 15. **Favorites** — Saved cars list with animated horizontal card layout
- [x] 16. **Notifications** — Unread count, mark-all-read, typed notification cards (booking, payment, promo, kyc, system)
- [x] 17. **KYC Verification** — Progress bar, required document list with upload simulation, status chips
- [x] 18. **Settings** — Notifications, Security, Appearance, About, Account sections with toggles and actions
- [x] 19. **Help & Support** — WhatsApp/Call/Email quick contact buttons, FAQ accordion, support contact form
- [x] 20. **My Wallet** — Balance card with top-up CTA, stats (total in/out), quick actions, transaction history

### Role Dashboards
- [x] 21. **Fleet Dashboard** — Revenue card, trip stats, active rentals count, fleet vehicle cards with status and maintenance alerts
- [x] 22. **Dealer Dashboard** — Views/Leads/Active stats, listing cards with asking price and featured tags, recent leads with status
- [x] 23. **Admin Dashboard** — Tabbed (Overview/Users/KYC), stats grid, monthly growth bar, pending KYC alerts, user list with role/status badges, KYC approval/reject actions

---

## Navigation
- [x] Bottom tab bar with 4 tabs: **Home**, **Search**, **Bookings**, **Profile**
- [x] Auth guard redirects unauthenticated users to Welcome screen
- [x] Stack screens overlay tabs for deep navigation
- [x] Role-specific dashboard links appear in Profile based on current role

---

## Data
- [x] Realistic mock data featuring popular car brands available in Ghana (Toyota, Mercedes, BMW, Range Rover, Honda, etc.)
- [x] Ghanaian cities as locations (Accra, Kumasi, Tema, Takoradi, Cape Coast, Tamale, East Legon, Airport Area, Cantonments, Osu)
- [x] Prices in Ghana Cedis (GH₵)
- [x] Real brand logos fetched from carlogos.org

---

## App Icon
- [ ] Deep purple gradient background with a sleek white car silhouette and an orange speed accent streak
