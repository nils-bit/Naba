# Tidsrapportering PWA — Design

## Syfte

En webbapp (PWA) för att tracka arbetstid per projekt under dagen, med automatisk Excel-rapport varje fredag. Fungerar på desktop och mobil med synk via Supabase.

## Användarprofil

- 5-10 projekt per vecka
- Valfri taggning av tidspass (möte, kodning, etc.)
- Rapporter primärt för eget bruk, ibland delas med chef/kund

## Teknikstack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, next-pwa
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Excel:** exceljs
- **Deployment:** Vercel (gratis tier)
- **Cron:** Vercel Cron för automatisk fredagsrapport

## Datamodell

### projects
| Kolumn     | Typ      | Beskrivning               |
|------------|----------|---------------------------|
| id         | uuid     | PK                        |
| name       | text     | Projektnamn               |
| color      | text     | Färgkod för UI            |
| archived   | boolean  | Arkiverat projekt         |
| user_id    | uuid     | FK till auth.users        |
| created_at | timestamp| Skapad                    |

### time_entries
| Kolumn     | Typ       | Beskrivning                     |
|------------|-----------|---------------------------------|
| id         | uuid      | PK                              |
| project_id | uuid      | FK till projects                |
| user_id    | uuid      | FK till auth.users              |
| start_time | timestamp | Starttid                        |
| end_time   | timestamp | Sluttid (null = pågående)       |
| tag        | text      | Valfri tagg (möte, kodning etc) |
| note       | text      | Valfri kort anteckning          |
| created_at | timestamp | Skapad                          |

### tags
| Kolumn | Typ  | Beskrivning             |
|--------|------|-------------------------|
| id     | uuid | PK                      |
| name   | text | Taggnamn                |
| user_id| uuid | FK till auth.users      |

Row Level Security (RLS) på alla tabeller — varje användare ser bara sin egen data.

## UI & Flöde

### Huvudvy (Timer)
- Stor "Starta timer"-knapp
- Klicka → välj projekt (senast använda överst)
- Valfritt: lägg till tagg och anteckning
- Pågående timer visas med projekt, förfluten tid, stopp-knapp
- Dagens registreringar under timern

### Projektsida
- Lista alla projekt med färgkodning
- Lägg till / redigera / arkivera
- Total tid per projekt (vecka/månad)

### Veckovy
- Tabell: projekt (rader) × veckodagar (kolumner)
- Timmar per cell, totaler per rad och kolumn
- Klickbara celler för detaljer

### Rapportsida
- Knapp "Generera rapport" (välj datumintervall)
- Lista med automatiskt genererade fredagsrapporter

### Navigation
- Bottenmeny: Timer | Vecka | Projekt | Rapporter
- Responsiv layout (desktop + mobil)

### PWA
- Installerbar via webbläsaren
- Offline: visa cachad data, köa entries för synk

## Excel-rapport

### Flik 1: Summering
- Projekt (rader) × veckodagar mån-fre (kolumner)
- Timmar per cell, totaler per rad/kolumn, veckototal
- Professionell formatering: färgade headers, borders, fetstil

### Flik 2: Detaljerad logg
- Varje entry: Datum | Projekt | Tagg | Start | Stopp | Varaktighet | Anteckning
- Kronologisk ordning, subtotaler per dag

### Flik 3: Per projekt
- En sektion per projekt med dess entries och total
- Användbart för att dela med kunder

### Generering
- **Automatiskt:** Vercel Cron fredag kl 17:00 → `/api/generate-report`
- **Manuellt:** Knapp i UI → samma endpoint med valt datumintervall
- Sparas i Supabase Storage
- Filnamn: `tidsrapport-YYYY-vNN.xlsx`

## Projektstruktur

```
src/
  app/
    page.tsx                — Timer-vy
    projects/page.tsx       — Projekthantering
    week/page.tsx           — Veckovy
    reports/page.tsx        — Rapportsida
    api/generate-report/    — Excel-generering
  components/               — Delade UI-komponenter
  lib/
    supabase.ts             — Supabase-klient
    excel.ts                — Rapportgenerering
  types/                    — TypeScript-typer
```

## Auth

Supabase Auth med magic link (e-post). Inget lösenord.
