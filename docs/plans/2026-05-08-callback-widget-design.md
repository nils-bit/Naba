# Callback Widget — Design

**Date:** 2026-05-08  
**Status:** Approved

---

## Context

Build a standalone callback widget product similar to leadcaller.com. Visitors on a website see a floating button, enter their name and phone number, optionally schedule a callback time, and submit. The site owner receives an email + SMS notification and manages leads in an admin dashboard.

This is a personal tool (not SaaS) — one owner, one widget, embedded on one website.

---

## Architecture

**New standalone Next.js project** (separate from Tidsrapportering), deployed to Vercel. New Supabase project for clean separation.

### Services
| Service | Purpose | Cost |
|---|---|---|
| Vercel | Hosting + API routes | Free |
| Supabase | Database + auth (magic link) | Free tier |
| Resend | Email notifications | 3,000/month free |
| Twilio | SMS notifications | ~$0.01/SMS pay-as-you-go |

### Two outputs
1. **Admin dashboard** — `yourapp.vercel.app` — Next.js app, magic link auth
2. **Embeddable widget** — `yourapp.vercel.app/widget.js` — Vite bundle, vanilla JS, ~10KB gzipped

---

## Widget

A floating button in the bottom-right corner. Clicking opens a card with:

1. Name field + phone number field
2. Social proof line: "X people have requested a callback this week"
3. Toggle: **Call me as soon as possible** / **Schedule a time** (date/time picker constrained to configured business hours)
4. Submit → thank-you confirmation

### Embed
```html
<script src="https://yourapp.vercel.app/widget.js"></script>
```

Widget fetches config (colors, heading text, social proof count) from the API at load time. Built with Vite — no framework dependencies, no impact on host site.

---

## Database Schema

```sql
-- New Supabase project

leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  status      text not null default 'pending',  -- pending | contacted | converted | no-answer
  scheduled_at timestamptz,                      -- null = ASAP
  source_url  text,
  notes       text,
  created_at  timestamptz default now()
)

business_hours (
  id             uuid primary key default gen_random_uuid(),
  day_of_week    int not null,  -- 0=Sun, 6=Sat
  start_time     time not null,
  end_time       time not null,
  max_slots_per_hour int not null default 2
)

settings (
  id                       uuid primary key default gen_random_uuid(),
  notification_email       text,
  notification_phone       text,
  widget_primary_color     text default '#2563eb',
  widget_heading_text      text default 'Request a callback',
  social_proof_window_days int  default 7,
  callback_promise_minutes int  default 30
)
```

---

## Admin Dashboard

| Route | Purpose |
|---|---|
| `/leads` | Table: name, phone, status, scheduled time, source URL. Click to change status. |
| `/schedule` | Calendar view of upcoming scheduled callbacks |
| `/analytics` | Cards (total leads, conversion %, avg response) + leads-per-day bar chart |
| `/settings` | Business hours editor, widget appearance, notification email + phone |

Auth: magic link (same Supabase pattern as Tidsrapportering).

---

## Notifications

On lead submission, fire both:
- **Email** (Resend): subject "New callback request — [Name]", body includes phone, scheduled time or "ASAP", and source URL
- **SMS** (Twilio): "New callback: [Name] [phone] — [time or ASAP]"

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/leads` | POST | Receive widget submission, store lead, send notifications |
| `/api/widget-config` | GET | Return colors, heading text, social proof count (public, cached) |
| `/api/available-slots` | GET | Return available scheduling slots based on business_hours |
| `/api/leads/[id]` | PATCH | Update lead status from dashboard |

---

## Verification Plan

1. Load `widget.js` in a plain HTML file — confirm widget renders and form submits
2. Check Supabase `leads` table for new row with correct fields
3. Confirm email received via Resend logs
4. Confirm SMS received via Twilio logs
5. Open admin `/leads` — verify lead appears, change status
6. Test schedule flow — pick a time slot, confirm `scheduled_at` saved correctly
7. Open `/analytics` — verify lead count and chart update
