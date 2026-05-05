# Eazyplans — Implementation Plan

## Context

Building an event hall management system (Eazyplans) from scratch.  
The working directory is currently **empty** — no files exist yet.  
Full spec is defined in the two PDFs (system spec + work plan).

---

## Assessment of the Original Work Plan

### What's good
- Tech stack is solid: Next.js 14 + Supabase + shadcn/ui + Resend + Vercel
- Phased approach (10 sprints) is sensible
- Database schema covers all entities
- Role-based access and conflict-prevention mechanism are well thought out

### Gaps & improvements added
| Gap | Fix |
|---|---|
| No folder structure defined | Defined App Router structure below |
| No Next.js middleware for auth | Add `middleware.ts` to protect all routes + role redirect |
| `booking_locks` table missing from schema | Added explicitly |
| Hebrew RTL not planned | Configure `dir="rtl"` in root layout from day 1 |
| Image storage not decided | Use Supabase Storage (already in stack, no extra account) |
| Cron job for reminders not fully specified | Vercel Cron (`vercel.json`) running at 09:00 Israel time |
| Types not generated from DB | Use `supabase gen types` for full type safety |
| Mobile-first not built in from start | Responsive Tailwind classes from day 1 |
| Secretary sub-roles (2 tiers in spec) | Simplified to 1 secretary tier (admin + secretary + venue_owner) |

---

## Final Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI components | Tailwind CSS + shadcn/ui |
| Calendar | react-big-calendar |
| Charts | recharts |
| Forms | react-hook-form + zod |
| Backend / DB | Supabase (PostgreSQL + RLS + Realtime) |
| Auth | Supabase Auth |
| Image storage | Supabase Storage |
| Email | Resend |
| Hosting | Vercel |
| Cron jobs | Vercel Cron (`vercel.json`) |
| Version control | GitHub |

---

## User Roles (3 total)

| Role | What they can do |
|---|---|
| `admin` | Full access: venues, events, leads, discounts, stats, user management |
| `secretary` | Search venues, book events (no discounts) |
| `venue_owner` | See own venue calendar, approve/reject bookings, add own events |

---

## Project Folder Structure

```
eazyplans/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # root layout — dir="rtl", font
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx              # protected shell with sidebar
│   │   │   ├── dashboard/page.tsx      # admin stats
│   │   │   ├── calendar/page.tsx       # hall owner calendar
│   │   │   ├── booking/page.tsx        # booking wizard (secretary/admin)
│   │   │   ├── events/page.tsx         # events management table
│   │   │   ├── venues/
│   │   │   │   ├── page.tsx            # venues list
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx       # venue detail + edit
│   │   │   ├── leads/page.tsx          # leads (admin only)
│   │   │   └── settings/page.tsx       # user management (admin only)
│   │   └── api/
│   │       └── cron/
│   │           └── reminders/route.ts  # Vercel Cron — daily 09:00
│   ├── components/
│   │   ├── ui/                         # shadcn auto-generated
│   │   ├── layout/                     # Sidebar, Navbar, RoleGate
│   │   ├── calendar/                   # CalendarView, EventCard, EventForm
│   │   ├── venues/                     # VenueCard, VenueForm, ImageGallery
│   │   ├── events/                     # EventsTable, StatusBadge
│   │   ├── booking/                    # BookingWizard (steps 1–6)
│   │   └── leads/                      # LeadsTable, LeadCard
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # browser Supabase client
│   │   │   └── server.ts               # server component client
│   │   ├── email/
│   │   │   ├── resend.ts
│   │   │   └── templates/              # owner-request, client-confirm, reminder
│   │   └── utils.ts
│   ├── types/
│   │   └── database.ts                 # generated: supabase gen types typescript
│   └── middleware.ts                   # auth guard + role-based redirect
├── supabase/
│   └── migrations/                     # SQL migration files (versioned)
├── public/
├── vercel.json                         # cron schedule
├── .env.local
└── package.json
```

---

## Database Schema

```sql
-- Users (Supabase Auth + custom profile table)
users: id (UUID, FK auth.users), email, full_name,
       role (admin | secretary | venue_owner), created_at

-- Venues
venues: id, name, address, city, neighborhood, max_capacity,
        price_morning, price_evening, price_full_day, price_shabbat,
        description_short, description_long,
        parking_info, public_transport_info,
        hours_morning_start, hours_morning_end,
        hours_evening_start, hours_evening_end,
        hours_full_start, hours_full_end,
        hours_shabbat_start, hours_shabbat_end,
        owner_user_id (FK → users), is_active, created_at

-- Venue Images
venue_images: id, venue_id (FK), storage_path, is_primary, created_at

-- Events
events: id, venue_id (FK), date (date), event_type (morning|evening|full_day|shabbat),
        event_purpose (wedding|bar_mitzvah|birthday|conference|other),
        status (pending|approved|rejected|cancelled),
        client_name, client_phone, client_email,
        price_listed, discount_amount, price_final,
        notes, created_by (FK → users), created_at, updated_at
        -- UNIQUE constraint: (venue_id, date, event_type)
        -- DB trigger: full_day blocks morning + evening on same date

-- Leads
leads: id, client_name, client_phone, client_email,
       status (new|considering|waiting_for_date|date_taken|booked|cancelled),
       notes, created_at, updated_at

-- Lead ↔ Venue interest (many-to-many)
lead_venue_interests: id, lead_id (FK), venue_id (FK), created_at

-- Booking Locks (conflict prevention — MISSING FROM ORIGINAL PLAN, added here)
booking_locks: id, venue_id (FK), date, event_type,
               locked_by_user_id (FK → users),
               locked_until (timestamptz), created_at

-- Email Logs
email_logs: id, event_id (FK), recipient_email,
            email_type (owner_request | client_confirm | reminder),
            sent_at, status (sent | failed)

-- Waitlist (scaffold now, implement later)
waitlist: id, lead_id (FK), venue_id (FK), requested_date, created_at
```

### RLS Policy Summary
| Table | admin | secretary | venue_owner |
|---|---|---|---|
| venues | full CRUD | SELECT | SELECT own + UPDATE own |
| events | full CRUD | INSERT + SELECT | SELECT + UPDATE own |
| leads | full CRUD | none | none |
| booking_locks | full | INSERT + DELETE own | none |
| users | full | none | SELECT own |

---

## Implementation Phases

### Phase 0 — Bootstrap (Day 1)
1. `npx create-next-app@latest eazyplans --typescript --tailwind --app --src-dir`
2. `npx shadcn@latest init`
3. Install packages: `@supabase/ssr @supabase/supabase-js resend react-big-calendar date-fns recharts react-hook-form zod`
4. Create GitHub repo, push initial commit
5. Create Supabase project, run initial migration
6. Create Vercel project, link to GitHub
7. Set up `.env.local` with all keys
8. Set `dir="rtl"` + Hebrew font in `app/layout.tsx`
9. Scaffold `middleware.ts` for auth + role-based redirect on login

### Phase 1 — Auth + Venues (Weeks 1–2)
- Login page with Supabase Auth (email/password)
- `middleware.ts`: protect `/app/*`, redirect unauthenticated → `/login`, redirect by role after login
- Run all DB migrations via Supabase CLI
- Generate TypeScript types: `supabase gen types typescript --project-id ... > src/types/database.ts`
- Venues list page + search
- Add/edit venue form (all fields including pricing per event type)
- Image upload to Supabase Storage + gallery component (add/delete images)
- Venue detail page (read-only view)

### Phase 2 — Calendar + Events (Weeks 3–4)
- Hall owner calendar using `react-big-calendar` (month / week / day views)
- Color coding: morning=blue, evening=purple, full_day=green, shabbat=orange
- Status styling: approved=solid fill, pending=dashed border, waitlist=transparent
- Click empty date → event form modal (add event)
- Click existing event → detail modal (view / edit / delete / approve / reject)
- Venue selector dropdown at top if owner has multiple venues
- Supabase Realtime subscription → calendar updates instantly when secretary books

### Phase 3 — Booking Wizard (Weeks 5–6)
- 6-step `BookingWizard` component:
  - Step 1: Date picker + event type (morning / evening / full_day / shabbat)
  - Step 2: Filters — city, neighborhood, guest count, price range
  - Step 3: Available venues grid (thumbnail + price + capacity)
  - Step 4: Venue detail modal (full gallery, description, pricing table, hours, parking/transit)
  - Step 5: Booking form — client info, event purpose, notes; price auto-loaded; discount field (admin only); final price
  - Step 6: Confirmation → save → send email to owner
- On entering Step 5: INSERT into `booking_locks` for 10 min
- On save or timeout: DELETE lock
- Trying to book a locked slot shows "currently being booked, try again in X min"
- Full day blocks morning + evening (enforced in query and DB trigger)

### Phase 4 — Leads & Customers (Week 7)
- Leads table with status filter chips (new / considering / waiting / date_taken / booked / cancelled)
- Lead detail card: personal info, current status, linked venues, linked events, free-text notes
- Status update dropdown
- Link lead to venue interests and events

### Phase 5 — Email Automations (Week 8)
- Configure Resend (add domain or use sandbox)
- 3 HTML email templates in Hebrew (RTL):
  - **Owner approval request**: event date, type, client name/phone, venue
  - **Client confirmation**: venue name, date, hours, final price, full address, parking, transit, contact info
  - **Day-before reminder**: event tomorrow, venue details, directions
- Owner email triggered: on event save (server action after DB insert)
- Client email triggered: when event status changes to `approved`
- `vercel.json` cron job:
  ```json
  { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 6 * * *" }] }
  ```
  (UTC 06:00 = Israel 09:00)

### Phase 6 — Dashboard & Statistics (Week 9)
- **Admin view**: busiest months (bar chart), popular venues (ranked list), event type breakdown (pie), lead→event conversion rate, avg booking lead time
- **Venue owner view**: same metrics scoped to their venue(s) only
- All charts via `recharts`
- Date range selector (default: current year)

### Phase 7 — Polish + Deploy (Week 10)
- Responsive layout on mobile (all screens pass)
- Loading skeletons for data-heavy pages
- Error boundaries + error states
- Empty states for all lists
- Connect custom domain in Vercel
- End-to-end test of full flow (book → approve → email → reminder)
- Go live!

---

## Business Rules Enforced in Code

1. **One event per slot**: unique constraint `(venue_id, date, event_type)` in DB
2. **Full day blocks morning + evening**: DB trigger checks before INSERT
3. **Only admin can give discounts**: `discount_amount` field hidden for secretary in UI + RLS blocks UPDATE
4. **Venue owner isolation**: RLS ensures owner only reads/writes their own venues
5. **Required booking fields**: `client_name`, `client_phone`, `client_email` — Zod validation on form
6. **Currency**: all prices in ₪
7. **Date format**: stored as `YYYY-MM-DD` in DB, displayed as `DD/MM/YYYY` in UI
8. **Week starts Sunday**: configured in `react-big-calendar` locale

---

## Verification Checklist

| Phase | How to verify |
|---|---|
| 0 | App loads at `localhost:3000`, unauthenticated → redirects to `/login` |
| 1 | Admin can create venue with images; owner logs in and sees only their venue |
| 2 | Owner sees calendar; add event → appears colored + correctly styled; secretary booking appears in real time |
| 3 | Secretary runs full 6-step flow; locked slot shows error for second secretary; full_day blocks morning+evening |
| 4 | Admin sees leads, can update status, link to venue/event |
| 5 | Booking triggers owner email; approval triggers client email; cron sends reminder for next-day events |
| 6 | Dashboard shows correct data; admin sees all venues, owner sees only theirs |
| 7 | Mobile layout correct; no console errors; Vercel production URL live |
