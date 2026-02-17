# Fas 1: Timtaxa + Personlig Dashboard

## Sammanfattning

Utöka Tidsrapportering med timtaxa per projekt och en dashboard-sida som visar tidsfördelning och fakturerbar summa. Kostnadsberäkning visas live i timer-vyn, veckovyn, idag-listan och Excel-rapporten. Dashboarden ger överblick med cirkeldiagram och stapeldiagram.

Denna fas är steg 1 av 3. Fas 2 (organisation/team) och Fas 3 (org-dashboard + veckorapporter) bygger vidare på detta.

## Databasändring

### projects-tabellen

Lägg till kolumn:
- `hourly_rate` — decimal, nullable, default null
- Projekt utan rate visar bara tid (inget belopp)
- Rate i SEK per timme

SQL-migration:
```sql
ALTER TABLE projects ADD COLUMN hourly_rate numeric DEFAULT NULL;
```

### types/database.ts

```typescript
export interface Project {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  user_id: string;
  created_at: string;
  hourly_rate: number | null;  // NEW
}
```

## Ändrade komponenter

### 1. project-form.tsx — Nytt fält "Timtaxa"

- Lägg till input för `hourly_rate` under färgväljaren
- Label: "Timtaxa (kr/h)"
- Placeholder: "Valfritt"
- Typ: number, min 0, step any
- Visas som tom om null (inte 0)
- Sparas som null om tomt

### 2. timer/page.tsx + timer-display.tsx — Live kostnad

- Beräkna `elapsed_seconds × (project.hourly_rate / 3600)` varje sekund
- Visa under elapsed time som dämpad text: "~1 250 kr"
- Använd `~` prefix för att indikera pågående beräkning
- Format: `sv-SE` locale med tusentalsavgränsare, inga decimaler
- Visa bara om projektet har hourly_rate

### 3. today-entries.tsx — Belopp per entry

- Beräkna `duration_hours × hourly_rate`
- Visa högerställt bredvid duration: "2h 30m · 1 875 kr"
- Visa bara om projektet har hourly_rate
- Kräver project-data (join eller lookup)

### 4. week/page.tsx + week-table.tsx — Beloppskolumn

- Ny kolumn "Belopp" längst till höger i tabellen
- Beräkna per cell: `hours × project.hourly_rate`
- Totalrad med summerat belopp
- Visa "–" om projektet saknar rate
- Grand total summerar bara projekt med rate

### 5. Excel-rapport (lib/excel.ts)

- Summering-sheet: ny kolumn "Belopp" per projekt per dag + vecktotal
- Detaljerad logg: ny kolumn "Belopp" per entry
- Per projekt: ny kolumn "Belopp" + subtotal

### 6. Ny sida: /dashboard

- Ny route: `src/app/(app)/dashboard/page.tsx`
- Ersätter inte befintliga sidor — ny flik i navigationen

#### Komponenter:

**Tidsperiodväljare** — Knappar: "Vecka" | "Månad" | "Custom"
- Default: denna vecka
- Vecka/månad navigerar med pilar (som veckovyn)
- Custom: datepicker för start/slut

**Summakort (3 st i rad)**:
- Total arbetad tid (h:mm)
- Fakturerbar summa (kr, bara projekt med rate)
- Antal aktiva projekt

**Cirkeldiagram — Tidsfördelning per projekt**
- Andel av total tid per projekt
- Projektfärg som segment-färg
- Hover/tap visar tid + procent
- Bibliotek: Recharts (lightweight, React-native)

**Stapeldiagram — Timmar per dag**
- Stacked bars (ett segment per projekt)
- X-axel: dagar i perioden
- Y-axel: timmar
- Projektfärg per segment

### 7. bottom-nav.tsx — Ny flik

- Lägg till "Dashboard" som 5:e flik (eller ersätt "Rapporter" position)
- Ikon: stapeldiagram-ikon
- Ordning: Timer | Vecka | Dashboard | Projekt | Rapporter

Alternativ: 5 flikar blir trångt på mobil. Bättre:
- **Ordning: Timer | Dashboard | Vecka | Projekt | Rapporter**
- Eller: Flytta Rapporter in under Dashboard som en sektion

**Beslut:** Behåll 5 flikar men med kompaktare ikoner. Dashboard hamnar på plats 2.

## Nytt npm-beroende

- `recharts` ^2.x — för cirkel/stapeldiagram

## Design-principer

- Samma glasmorfism-stil som resten av appen
- Diagram i glass-card med blur
- Responsivt: diagram stackar vertikalt på mobil
- Summakort i 3-kolumnsgrid (1 kolumn på mobil)
- Svensk formatering genomgående (sv-SE locale)

## Avgränsningar (Fas 1)

- Ingen team/organisation — bara personlig data
- Ingen fakturastatus — bara belopp
- Inga mål/budget per projekt
- Inget dark mode
