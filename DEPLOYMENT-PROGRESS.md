# TeileniX – Deployment-Konzept A+D: Fortschritt

Implementierung der Kombination **Variante A (PWA)** + **Variante D (Vercel Edge + Supabase Realtime)**.

---

## Übersicht

| # | Feature | Status | Datei(en) |
|---|---------|--------|-----------|
| 1 | PWA Manifest + Icons | ✅ Fertig | `public/manifest.json`, `public/icons/` |
| 2 | Service Worker (Workbox) | ✅ Fertig | `public/sw.js` |
| 3 | SW-Registrierung im Layout | ✅ Fertig | `src/components/pwa/ServiceWorkerRegister.tsx` |
| 4 | PWA Meta-Tags (apple-mobile-web-app) | ✅ Fertig | `src/app/layout.tsx` |
| 5 | Offline-Seite (/offline) | ✅ Fertig | `src/app/offline/page.tsx` |
| 6 | iOS Install-Banner | ✅ Fertig | `src/components/pwa/InstallBanner.tsx` |
| 7 | Offline-Indikator | ✅ Fertig | `src/components/pwa/OfflineIndicator.tsx` |
| 8 | Supabase Realtime – Ausgaben | ✅ Fertig | `src/components/realtime/RealtimePageRefresher.tsx` + expenses/page.tsx |
| 9 | Supabase Realtime – Packliste | ✅ Fertig | packlist/page.tsx |
| 10 | Supabase Realtime – Einkaufszettel | ✅ Fertig | einkauf/page.tsx |
| 11 | Supabase Realtime – Ausflüge | ✅ Fertig | planen/page.tsx |
| 12 | Offline-Queue für Ausgaben | ✅ Fertig | `src/lib/offline-queue.ts` + ExpenseForm.tsx |
| 13 | Deploy auf Vercel | ✅ Fertig | Vercel CI/CD |

---

## Was bereits vor diesem Sprint fertig war

- `public/manifest.json` — vollständig mit allen Icon-Größen und Shortcuts
- `public/sw.js` — Workbox-basierter Service Worker mit Network-First-Navigation,
  StaleWhileRevalidate für Static Assets, CacheFirst für Images
- `src/components/pwa/ServiceWorkerRegister.tsx` — registriert SW im Browser
- `src/app/layout.tsx` — alle Apple PWA Meta-Tags (`apple-mobile-web-app-capable` etc.)
- `src/app/offline/page.tsx` — einfache Offline-Fehlerseite
- Optimistic UI bereits in `VoteButtons`, `ShoppingListClient`, `ActivityFeed`

---

## Was in diesem Sprint umgesetzt wurde

### 1. iOS Install-Banner (`src/components/pwa/InstallBanner.tsx`)
- Erkennt: iOS-Gerät + Safari + nicht im Standalone-Modus
- Zeigt Bottom-Sheet mit Schritt-für-Schritt-Anleitung (Teilen-Symbol → "Zum Home-Bildschirm")
- Erscheint nach dem 3. Seitenaufruf (Counter in localStorage)
- Kann dauerhaft geschlossen werden (localStorage-Flag)
- Eingebunden in `src/app/layout.tsx`

### 2. Offline-Indikator (`src/components/pwa/OfflineIndicator.tsx`)
- Zeigt roten Banner "Du bist offline" wenn `navigator.onLine === false`
- Hört auf `window` `online`/`offline` Events
- Verschwindet automatisch sobald Verbindung wiederhergestellt
- Eingebunden in `src/app/layout.tsx`

### 3. Supabase Realtime (`src/components/realtime/RealtimePageRefresher.tsx`)
- Generische Client-Komponente: Abonniert Supabase Realtime für `INSERT/UPDATE/DELETE`
- Filtert auf `trip_id = <tripId>` um nur relevante Änderungen zu empfangen
- Ruft `router.refresh()` auf — Next.js re-fetched die Server-Daten
- Minimale Debounce (300ms) verhindert zu häufige Refreshes
- Eingebunden auf folgenden Seiten:
  - `expenses/page.tsx` → Tabelle `expenses`
  - `packlist/page.tsx` → Tabelle `packlist_items`
  - `einkauf/page.tsx` → Tabelle `shopping_items`
  - `planen/page.tsx` → Tabelle `trip_activities` + `trip_activity_votes`

### 4. Offline-Queue (`src/lib/offline-queue.ts`)
- localStorage-basierte Warteschlange für fehlgeschlagene API-Requests
- `enqueueRequest(endpoint, body)` — speichert Anfrage lokal
- `processQueue()` — sendet alle ausstehenden Anfragen beim Reconnect
- `getQueueLength()` — für UI-Feedback
- Replay wird automatisch beim `online`-Event ausgelöst
- In `ExpenseForm.tsx` integriert: wenn POST fehlschlägt (offline), wird
  die Ausgabe in die Queue gelegt mit Toast "Gespeichert – wird synchronisiert"

---

## Nächste mögliche Schritte (Post-Gruppentest)

- **Variante B (Capacitor)**: Native App für App Store, falls Gruppentest gut läuft
- **Push Notifications**: Supabase → Webhook → Push Service (ab iOS 16.4)
- **Background Sync API**: Ersetze localStorage-Queue durch echtes Background Sync
- **Expo / React Native (Variante C)**: Nur bei langfristiger Weiterentwicklung sinnvoll
