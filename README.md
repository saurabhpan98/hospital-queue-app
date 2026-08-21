# MediQueue — Live Hospital Token Tracker

A working prototype: patients search hospitals/doctors and see live token numbers
with no login; hospital owners register, get admin-approved, add hospitals and
submit a ₹2000/month payment request per hospital for admin review; doctors
register, build a profile, request to join a hospital, and once approved control
their own live queue. Every approval/rejection anywhere in the system fires an
in-app notification to the person waiting on it.

## Stack
- **Frontend**: React (Vite) + Tailwind CSS + Framer Motion + React Router
- **Backend**: Node.js + Express + JWT auth
- **Database**: MongoDB Atlas (Mongoose)

## Folder structure
```
hospital-queue-app/
  backend/     Express API, JWT auth, Mongoose models
  frontend/    React + Tailwind SPA
```

## 1. Set up MongoDB Atlas
1. Create a free cluster at https://cloud.mongodb.com
2. Create a database user + password
3. Network Access → allow your IP (or 0.0.0.0/0 for local dev)
4. Copy the connection string (looks like `mongodb+srv://user:pass@cluster.mongodb.net/...`)

## 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# edit .env: paste your MONGO_URI, set a JWT_SECRET, set ADMIN_EMAIL/ADMIN_PASSWORD
npm run seed:admin   # creates your one admin account, run once
npm run dev          # starts on http://localhost:5000
```

## 3. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env   # default already points at localhost:5000/api
npm run dev             # starts on http://localhost:5173
```

Open http://localhost:5173.

## How the roles work

**Patient** — no login. Home page searches hospitals or doctors, click through to see
the live token number, how late the doctor is running, and the average time each
patient spends inside the cabin. On a doctor's page, patients can also type in the
number printed on their physical token to get an estimated wait time and how many
people are ahead of them (added feature — see below). Everything auto-refreshes
every 6–8s.

**Admin** — log in at `/login` with the credentials from `npm run seed:admin`.
- Approves/rejects hospital owner registrations (with an optional reason)
- Reviews owner-submitted payment requests and approves/rejects them (with reason)
- Views all hospitals with a manual subscription override (admin "manages everything")
- Views all doctors

**Hospital Owner** — registers at `/register`, account starts `pending`.
- If **rejected** by admin: can edit their name/phone and resubmit for another review
- Once **approved**: can add hospitals, edit hospital details any time, and submit a
  payment request (with a reference/transaction note) per hospital for admin review
- If a payment request is **rejected**: sees the admin's reason, can edit the
  reference and resubmit
- Approves/rejects doctors who request to join their hospital(s)
- Can edit their own profile (name/phone) any time

**Doctor** — registers at `/register`, creates a profile, picks a hospital to
request, waits for the owner's approval.
- If the owner **rejects** the request: doctor can request the same or a different
  hospital again (resubmit)
- Once **approved**: gets a live control panel — toggle online/offline, "Next
  patient" to increment the token, set how many minutes they're running late, or
  manually set the token number
- Can edit their profile (specialization, fee, bio, etc.) any time, including
  after approval

**Notifications** — every authenticated role has a bell icon in the navbar
(polls every 15s) showing unread count. Fires on: owner approved/rejected, payment
request submitted/approved/rejected, doctor request submitted/approved/rejected.
Click a notification to mark it read, or "Mark all read".

## Data model summary
- `User` — role (`admin`/`owner`/`doctor`) + approval `status`. Owners default to
  `pending`; doctors default to `approved` (they're gated by the *hospital*, not admin).
- `Hospital` — owned by a `User`. `subscriptionStatus` (`unpaid`/`active`/`expired`)
  is driven by admin decision on `paymentStatus` (`none`/`pending`/`approved`/`rejected`),
  which the owner sets by submitting a payment request.
- `DoctorProfile` — one per doctor `User`, holds `requestedHospital`/`hospital`/
  `requestStatus`, and a `live` sub-object (`currentToken`, `delayMinutes`, `isActive`).
- `Notification` — one row per event, targeted at a specific `User`, with `read` flag.

Only doctors on an **active-subscription** hospital show up on the public patient pages.

## What to extend first
1. **Real payments** — swap the payment-reference text field for an actual Razorpay/
   Stripe checkout, and auto-approve via webhook instead of manual admin review
   (or keep manual review as a fraud check on top of a real gateway).
2. **Real-time updates** — replace polling (notifications every 15s, live token
   every 6–8s) with Socket.IO or MongoDB Change Streams so updates push instantly.
3. **Subscription expiry cron** — a scheduled job (node-cron) to flip hospitals from
   `active` to `expired` when `nextDueAt` passes, and auto-hide their doctors.
4. **Queue history & analytics** — persist a token log so "avg time in cabin" is
   measured from real data instead of a doctor-set estimate, and give owners a
   dashboard of patient volume per doctor/day.
5. **Doctor multi-hospital support** — currently one doctor = one hospital at a time;
   many real doctors work across 2–3 hospitals with different schedules.
6. **SMS/WhatsApp alerts** — notify a patient by phone when their token is close,
   since they have no account to poll a notification bell.
7. **File uploads** — doctor profile photos, hospital registration documents, and
   a real payment receipt upload for the admin to verify before approval.
