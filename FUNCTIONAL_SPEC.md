# TeileniX – Funktionsspezifikation

> Vollständige Beschreibung aller Features, Datenmodelle und Geschäftslogik für externe Entwickler.

---

## Inhaltsverzeichnis

1. [App-Übersicht](#1-app-übersicht)
2. [Technologie-Stack](#2-technologie-stack)
3. [Datenmodell](#3-datenmodell)
4. [Authentifizierung & Nutzerprofile](#4-authentifizierung--nutzerprofile)
5. [Dashboard](#5-dashboard)
6. [Reisen (Trips)](#6-reisen-trips)
7. [Teilnehmer & Gruppen](#7-teilnehmer--gruppen)
8. [Ausgaben](#8-ausgaben)
9. [Abrechnung (Settlement)](#9-abrechnung-settlement)
10. [Statistiken](#10-statistiken)
11. [Einladungssystem](#11-einladungssystem)
12. [Kategorien](#12-kategorien)
13. [API-Endpunkte](#13-api-endpunkte)
14. [Supabase RPC-Prozeduren](#14-supabase-rpc-prozeduren)
15. [Algorithmen & Berechnungslogik](#15-algorithmen--berechnungslogik)
16. [UI-Komponenten & Patterns](#16-ui-komponenten--patterns)
17. [Sicherheit & Autorisierung](#17-sicherheit--autorisierung)
18. [Lokalisierung & Formatierung](#18-lokalisierung--formatierung)

---

## 1. App-Übersicht

**TeileniX** ist eine kollaborative Web-App zur fairen Aufteilung von Gruppenausgaben – z.B. auf Reisen, bei Familienfeiern oder Wohngemeinschaften. Mehrere Personen können gemeinsam Ausgaben erfassen und die App berechnet automatisch, wer wem wie viel schuldet, um die Anzahl der nötigen Überweisungen zu minimieren.

### Kernideen

- Ausgaben werden von einem oder mehreren Zahlern (Payers) bezahlt und auf alle oder ausgewählte Teilnehmer aufgeteilt.
- Teilnehmer können Einzelpersonen oder Gruppen (z.B. Familien) mit individueller Share-Gewichtung sein.
- Die Abrechnung basiert auf einem Greedy-Algorithmus, der mit minimaler Anzahl an Transfers auskommt.
- Alle Beträge werden intern als ganzzahlige Cent-Werte gespeichert (keine Fließkommaprobleme).

---

## 2. Technologie-Stack

| Schicht | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Sprache | TypeScript |
| UI | React 19 + shadcn/ui (Radix UI) |
| Styling | Tailwind CSS 4 |
| Datenbank | Supabase (PostgreSQL) |
| Auth | Supabase Auth – Google OAuth |
| Formulare | react-hook-form + zod |
| Charts | recharts |
| PDF-Export | @react-pdf/renderer |
| Toast/Notifications | sonner |
| Icons | lucide-react |
| QR-Codes | qrcode.react |
| Deployment | Vercel + Supabase Cloud |

**Sprache der UI:** Deutsch (de-DE)

---

## 3. Datenmodell

### 3.1 `profiles`

Nutzerprofil, das beim ersten Login automatisch angelegt wird.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID (PK) | Entspricht der Supabase Auth User-ID |
| `email` | string | Google-E-Mail, read-only |
| `display_name` | string | Anzeigename, editierbar |
| `avatar_url` | string \| null | Google-Profilbild-URL |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### 3.2 `trips`

Eine Reise/Gruppe mit ihren Einstellungen.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID (PK) | |
| `name` | string (max 100) | Name der Reise |
| `description` | string \| null | Optionale Beschreibung (max 500) |
| `created_by` | UUID (FK → profiles) | Ersteller / Owner |
| `status` | `'active' \| 'ended'` | Aktiv oder abgeschlossen |
| `start_date` | date \| null | Optionales Startdatum |
| `end_date` | date \| null | Optionales Enddatum (>= start_date) |
| `invite_code` | string (8 Zeichen, unique) | Code zum Beitreten |
| `cover_emoji` | string \| null | Emoji-Icon (aus 60+ Optionen) |
| `cover_image_url` | string \| null | Bild-URL (für zukünftige Funktion) |
| `enabled_categories` | string[] | Aktivierte Kategorien-Schlüssel |
| `custom_categories` | JSONB | Array von `{key, label, emoji, isOverride}` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### 3.3 `trip_participants`

Repräsentiert einen Teilnehmer (Person oder Gruppe) an einer Reise.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID (PK) | |
| `trip_id` | UUID (FK → trips) | |
| `name` | string | Anzeigename |
| `shares` | integer (1–20) | Anteile bei proportionaler Aufteilung |
| `user_id` | UUID \| null | FK → profiles; null bei Gästen und Gruppen |
| `is_group` | boolean | true = Gruppe, false = Einzelperson/Gast |
| `joined_at` | timestamp | |

**Typen:**
- **Registrierter User:** `user_id != null`, `is_group = false`
- **Gast:** `user_id = null`, `is_group = false`
- **Gruppe:** `is_group = true`, `user_id = null`

---

### 3.4 `trip_participant_members`

Mitglieder einer Gruppe. Nur relevant wenn `is_group = true`.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID (PK) | |
| `participant_id` | UUID (FK → trip_participants) | Die Gruppe |
| `user_id` | UUID \| null | Verknüpfter Account (optional) |
| `display_name` | string | Name des Mitglieds |
| `is_guest` | boolean | true = kein Account |
| `added_at` | timestamp | |

---

### 3.5 `expenses`

Eine Ausgabe innerhalb einer Reise.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID (PK) | |
| `trip_id` | UUID (FK → trips) | |
| `paid_by_participant_id` | UUID (FK → trip_participants) | Hauptzahler |
| `co_payers` | JSONB \| null | Array von `{participant_id, amount_cents}` |
| `title` | string (max 100) | Bezeichnung der Ausgabe |
| `description` | string \| null | Optionale Notiz |
| `amount_cents` | integer (> 0) | Gesamtbetrag in Cent |
| `currency` | string | `'EUR'` (aktuell fest) |
| `category` | string | Kategorie-Schlüssel |
| `expense_date` | date | Datum der Ausgabe |
| `split_mode` | `'proportional' \| 'custom'` | Aufteilungsmodus |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**`co_payers` Format:**
```json
[
  { "participant_id": "uuid-1", "amount_cents": 3000 },
  { "participant_id": "uuid-2", "amount_cents": 2000 }
]
```
> Der Hauptzahler (`paid_by_participant_id`) zahlt den Rest: `total - sum(co_payers)`.

---

### 3.6 `expense_splits`

Aufteilung einer Ausgabe auf Teilnehmer.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID (PK) | |
| `expense_id` | UUID (FK → expenses) | |
| `participant_id` | UUID (FK → trip_participants) | |
| `shares` | integer | Anteile dieses Teilnehmers an der Ausgabe |

---

## 4. Authentifizierung & Nutzerprofile

### Login-Flow

1. User klickt „Mit Google anmelden" auf `/login`
2. Supabase Auth leitet zu Google OAuth weiter
3. Nach Rückkehr: Callback-Route prüft ob Profil existiert
4. Falls nicht: RPC `auto_setup_user` wird aufgerufen → Profil wird angelegt
5. Redirect zu `/dashboard`

### Profilseite (`/profile`)

- Zeigt: Name, E-Mail (read-only), Avatar
- Editierbar: `display_name` (sofort gespeichert per PATCH)
- Abmelden-Button (Supabase Sign Out)

---

## 5. Dashboard

**Route:** `/dashboard`

Startseite nach dem Login.

### Elemente

- Begrüßung: „Hallo, {Vorname} 👋" + Anzahl aktiver Reisen
- Button **„Neue Reise planen"** → `/trips/new`
- Button **„Einladung erhalten?"** → Dialog mit Code-Eingabe

### Reisenliste

- **Aktive Reisen:** Chronologisch, als Cards mit Emoji, Name, Datum, Teilnehmeranzahl
- **Abgeschlossene Reisen:** Eingeklappter Bereich „Abgeschlossen (N)" mit gleichem Card-Layout
- **Leerer Zustand:** Emoji + Aufforderung, erste Reise zu erstellen

---

## 6. Reisen (Trips)

### 6.1 Reise erstellen (`/trips/new`)

**Formularfelder:**

| Feld | Typ | Validierung |
|---|---|---|
| Emoji (cover_emoji) | Emoji-Picker (60+ Icons) | Optional |
| Name | Text | Pflicht, max 100 Zeichen |
| Beschreibung | Textarea | Optional, max 500 Zeichen |
| Startdatum | Datepicker | Optional |
| Enddatum | Datepicker | Optional, muss >= Startdatum sein |

**Ablauf:**
1. POST `/api/trips`
2. RPC `create_trip_with_participant` → Reise + erster Teilnehmer (Ersteller) werden atomisch angelegt
3. 8-stelliger zufälliger `invite_code` wird generiert
4. Redirect zu `/trips/[tripId]?new=1`

---

### 6.2 Reiseübersicht (`/trips/[tripId]`)

**Angezeigt werden:**
- Meta-Strip: Datumsbereich, Teilnehmeranzahl, Status-Badge (● Aktiv / Abgeschlossen)
- **Meine Bilanz-Card:** Gesamt bezahlt / Gesamt geschuldet / Netto-Saldo
  - Positiv (grün): Person bekommt Geld zurück
  - Negativ (rot): Person schuldet noch Geld
- Teilnehmerliste mit individuellen Salden
- Button **„Reise beenden"** (nur für Ersteller, nur bei aktiven Reisen)
- Leerer Zustand wenn noch keine Ausgaben

**Navigation (Tabs):**
- Überblick
- Ausgaben
- Abrechnung
- Statistiken
- Einstellungen (nur Ersteller: Teilnehmer, Kategorien)

---

### 6.3 Reise beenden

- Nur der Ersteller kann eine Reise beenden
- Aktion ist **irreversibel**
- Status wird auf `'ended'` gesetzt
- Danach: Read-only, keine Ausgaben mehr editierbar

---

## 7. Teilnehmer & Gruppen

**Route:** `/trips/[tripId]/participants`

### 7.1 Teilnehmertypen

#### Registrierter User
- Hat TeileniX-Account (Google Login)
- Tritt via Einladungscode bei
- Kann selbst Ausgaben anlegen

#### Gast
- Wird vom Ersteller manuell hinzugefügt (z.B. Kinder, Freunde ohne App)
- Kein Account erforderlich
- `is_guest = true`

#### Gruppe
- Repräsentiert Familie oder Team als abrechnungsrelevante Einheit
- Kann Mitglieder enthalten (`trip_participant_members`)
- Wird bei der Abrechnung als Ganzes behandelt
- Mitglieder-Einzel-Zahlungen werden zur Gruppe addiert

---

### 7.2 Shares-System

**Zweck:** Bestimmt den Anteil einer Person/Gruppe an proportionalen Ausgaben.

- Standard: 1 Share pro Teilnehmer
- Empfehlung: Paare = 2 Shares, Familien = 3+ Shares
- Kostenanteil = `Gesamtbetrag × (eigene Shares / Gesamt-Shares)`
- Shares-Bereich: 1–20

---

### 7.3 Verwaltung (Ersteller-Aktionen)

**Gast hinzufügen:** Name eingeben → Teilnehmer mit is_guest=true wird angelegt

**Gruppe hinzufügen:**
- Name + initiale Share-Anzahl
- Mitglieder können direkt beim Erstellen hinzugefügt werden

**Shares ändern (bei bestehenden Ausgaben):**
Dialog mit zwei Optionen:
1. **Nur für neue Ausgaben** (Standard, nicht-destruktiv) – alte Splits bleiben unverändert
2. **Alle proportionalen Ausgaben neu berechnen** – berechnet nur `split_mode = 'proportional'` Ausgaben neu; custom Splits bleiben immer erhalten

**Teilnehmer entfernen:** Nur möglich wenn dem Teilnehmer keine Ausgaben zugeordnet sind.

---

## 8. Ausgaben

### 8.1 Ausgabe erstellen / bearbeiten

**Routes:** `/trips/[tripId]/expenses/new`, `/trips/[tripId]/expenses/edit/[expenseId]`

---

#### Karte 1: Grunddaten

| Feld | Typ | Details |
|---|---|---|
| Titel | Text | Pflicht, max 100; Placeholder „z.B. Abendessen am Hafen" |
| Betrag | Währungsinput | € Prefix; unterstützt DE-Format (1.250,50) und EN-Format; intern Cent |
| Datum | Datepicker | Default: heute (lokale Zeit, nicht UTC) |
| Kategorie | Emoji-Buttons | 7 Standardkategorien + custom; Smart-Vorschlag beim Tippen |

---

#### Karte 2: Zahler & Aufteilung

**Zahler (Multi-Select):**
- Einer oder mehrere Teilnehmer können als Zahler ausgewählt werden
- Bei mehreren Zahlern: Proportionsbalken + Betragseingabe pro Zahler
- Button **„Gleich aufteilen"** verteilt Gesamtbetrag gleichmäßig
- Validierung: Summe der Zahlbeträge muss Gesamtbetrag ergeben

**Aufteilungsmodus:**

| Modus | Schlüssel | Beschreibung |
|---|---|---|
| Alle (proportional) | `proportional` | Kosten nach Shares aller Teilnehmer verteilt; Default |
| Individuell | `custom` | Manuelle Auswahl wer zahlt + eigene Share-Gewichte |

**Proportional:** Anzeige-only Liste aller Teilnehmer mit berechneten Beträgen

**Custom:**
- Checkboxen für jeden Teilnehmer (wer ist dabei?)
- Editierbare Share-Zahl pro Teilnehmer
- Mindestens 1 Teilnehmer muss ausgewählt sein

---

### 8.2 Ausgaben-Liste (`/trips/[tripId]/expenses`)

- Sortierung: Neueste zuerst (expense_date DESC, dann created_at DESC)
- Jede Card zeigt: Kategorie-Emoji, Titel, Betrag, Zahler, Aufteilungs-Teilnehmer
- Edit/Delete-Buttons bei aktiven Reisen

---

### 8.3 Validierungsregeln

```
title: min 1 Zeichen, max 100
amount_cents: integer > 0
category: muss in enabled_categories der Reise sein
splits: Array mit mind. 1 Eintrag
splits[].shares: integer > 0
co_payers: Summe der Beträge muss < Gesamtbetrag sein
```

---

## 9. Abrechnung (Settlement)

**Route:** `/trips/[tripId]/settlement`

### 9.1 Übersichts-Header

- Gesamtausgaben (formatiert)
- Anzahl nötiger Transfers oder „Alles ausgeglichen ✓"
- Button „Reise beenden" (nur Ersteller, nur aktive Reisen)

---

### 9.2 Wer zahlt wem?

Liste aller nötigen Überweisungen im Format:
> **Person A** zahlt **€X** an **Person B**

---

### 9.3 Saldo-Tabelle (BalanceTable)

Pro Teilnehmer (abrechnungsrelevant):

| Spalte | Beschreibung |
|---|---|
| Name | Teilnehmer-Name |
| Bezahlt | Gesamtbetrag, den sie tatsächlich bezahlt haben |
| Schuldet | Ihr anteiliger Gesamtbetrag (was sie hätten zahlen sollen) |
| Saldo | `Bezahlt – Schuldet` (grün = bekommt zurück, rot = schuldet) |

---

### 9.4 Gruppen-Mitgliederaufschlüsselung

Wenn Gruppen vorhanden: Zeigt für jede Gruppe, welche Mitglieder wie viel bezahlt haben.

---

### 9.5 Ausgaben-Detailbericht

Eingeklappte Liste aller Ausgaben mit:
- Titel, Betrag, Zahler
- Aufteilung mit Beträgen pro Teilnehmer

---

### 9.6 PDF-Export

Button „Abrechnung exportieren" → Generiert PDF mit:
- Reisename, Datum, Gesamt
- Saldo-Tabelle
- Transfer-Liste

---

## 10. Statistiken

**Route:** `/trips/[tripId]/stats`

### Elemente

**Gesamtzusammenfassung:** Gesamtbetrag + Anzahl Ausgaben

**Ausgaben nach Kategorie:**
- Pie-Chart oder Bar-Chart (recharts)
- Nur bei mind. 1 Ausgabe

**Ausgaben über Zeit:**
- Liniendiagramm, kumulativer Verlauf
- X-Achse: Ausgaben-Daten; Y-Achse: kumulierte Cent
- Nur bei mind. 2 Ausgaben

**Leaderboard-Cards:**

| Card | Inhalt |
|---|---|
| Großzügigster | Wer hat am meisten bezahlt |
| Meiste Ausgaben | Wer hat am meisten Ausgaben erfasst |
| Größte Schulden | Wer schuldet am meisten (nur wenn Schulden vorhanden) |

---

## 11. Einladungssystem

### 11.1 Invite Code

- 8-stelliger alphanumerischer Code
- Wird bei Reiseerstellung automatisch generiert
- Angezeigt in den Reise-Einstellungen (Tab „Teilnehmer")
- Kopieren-Button + optionaler QR-Code

### 11.2 Beitreten

**Flow:**
1. User klickt „Einladung erhalten?" im Dashboard
2. Gibt 8-stelligen Code ein
3. Wählt Shares (1–20, Default 1)
4. POST `/api/trips/{tripId}/join` mit Code
5. RPC `join_trip_by_code` validiert Code, prüft aktiven Status, legt `trip_participant` an

**Einschränkungen:**
- Nur aktive Reisen können beigetreten werden
- Jeder User kann einer Reise nur einmal beitreten
- Code muss exakt übereinstimmen

---

## 12. Kategorien

### 12.1 Standard-Kategorien (7)

| Emoji | Schlüssel | Label |
|---|---|---|
| 🍽️ | `food` | Essen & Trinken |
| 🚗 | `transport` | Transport |
| 🏠 | `accommodation` | Unterkunft |
| 🎡 | `activities` | Aktivitäten |
| 🛍️ | `shopping` | Einkauf |
| 💊 | `health` | Gesundheit |
| 📦 | `other` | Sonstiges |

### 12.2 Custom Kategorien

Der Ersteller kann in den Reise-Einstellungen:
- Standard-Kategorien aktivieren/deaktivieren
- Standard-Kategorien umbenennen (eigenes Emoji + Label)
- Komplett neue Kategorien hinzufügen

**Dateiformat in `custom_categories`:**
```json
[
  { "key": "food", "label": "Essen & Trinken", "emoji": "🍽️", "isOverride": true },
  { "key": "custom_abc123", "label": "Souvenirs", "emoji": "🎁", "isOverride": false }
]
```

### 12.3 Smart Auto-Suggestion

- Pro Kategorie: Liste von Keywords (DE + EN)
- Beim Tippen des Titels: Case-insensitive Substring-Matching
- Anzeige: visueller „✦ Vorschlag"-Indikator
- User kann Vorschlag überschreiben

**Beispiel-Keywords:**
- `food`: pizza, restaurant, abendessen, lunch, frühstück, kaffee, ...
- `transport`: uber, taxi, bahn, flug, bus, benzin, parkhaus, ...
- `accommodation`: hotel, airbnb, hostel, unterkunft, ...

---

## 13. API-Endpunkte

Alle Endpunkte erfordern eine gültige Supabase-Session (Cookie-basiert).

### Trips

| Methode | Route | Beschreibung |
|---|---|---|
| POST | `/api/trips` | Neue Reise erstellen |
| GET | `/api/trips/[tripId]` | Reise-Details abrufen |
| PATCH | `/api/trips/[tripId]` | Reise-Einstellungen aktualisieren |
| POST | `/api/trips/[tripId]/end` | Reise beenden (nur Ersteller) |
| POST | `/api/trips/[tripId]/join` | Reise per Code beitreten |

### Teilnehmer

| Methode | Route | Beschreibung |
|---|---|---|
| GET | `/api/trips/[tripId]/participants` | Alle Teilnehmer abrufen |
| POST | `/api/trips/[tripId]/participants` | Gast oder Gruppe hinzufügen |
| PATCH | `/api/trips/[tripId]/participants/[id]` | Teilnehmer aktualisieren (Name, Shares) |
| DELETE | `/api/trips/[tripId]/participants/[id]` | Teilnehmer entfernen |
| POST | `/api/trips/[tripId]/participants/[id]/members` | Mitglied zu Gruppe hinzufügen |

### Ausgaben

| Methode | Route | Beschreibung |
|---|---|---|
| POST | `/api/expenses` | Ausgabe erstellen |
| GET | `/api/expenses?tripId=` | Ausgaben einer Reise abrufen |
| PATCH | `/api/expenses/[expenseId]` | Ausgabe aktualisieren |
| DELETE | `/api/expenses/[expenseId]` | Ausgabe löschen |

### Abrechnung

| Methode | Route | Beschreibung |
|---|---|---|
| GET | `/api/settlement/[tripId]` | Settlement berechnen |

**Response-Format `/api/settlement/[tripId]`:**
```json
{
  "balances": [
    {
      "participantId": "uuid",
      "name": "Anna",
      "totalPaidCents": 12000,
      "totalOwedCents": 8000,
      "netBalanceCents": 4000
    }
  ],
  "transfers": [
    {
      "fromParticipantId": "uuid",
      "toParticipantId": "uuid",
      "fromName": "Ben",
      "toName": "Anna",
      "amountCents": 4000
    }
  ],
  "totalSpentCents": 25000
}
```

---

## 14. Supabase RPC-Prozeduren

### `auto_setup_user(p_display_name, p_email, p_avatar_url)`
- Wird beim ersten Login aufgerufen
- Legt Profil in `profiles` an falls noch nicht vorhanden
- Rückgabe: void

### `create_trip_with_participant(p_name, p_start_date, p_end_date, p_cover_emoji)`
- Legt Reise + ersten Teilnehmer (Ersteller) atomisch an
- Generiert zufälligen 8-stelligen `invite_code`
- Rückgabe: `trip_id` (UUID)

### `create_expense_with_splits(p_trip_id, p_paid_by_participant_id, p_title, p_description, p_amount_cents, p_currency, p_category, p_expense_date, p_split_mode, p_co_payers, p_splits)`
- Erstellt Ausgabe + alle Splits atomisch
- `p_splits`: Array von `{participant_id, shares}`
- Rückgabe: `expense_id` (UUID)

### `update_expense_with_splits(...gleiche Parameter + p_expense_id)`
- Aktualisiert Ausgabe und ersetzt alle Splits
- Atomar: alte Splits werden gelöscht, neue angelegt
- Rückgabe: void

### `join_trip_by_code(p_code, p_shares)`
- Validiert Code + Reisestatus
- Prüft doppeltes Beitreten
- Legt `trip_participant` an
- Rückgabe: `{trip_id, trip_name}`

### `get_trip_by_invite_code(p_code)`
- Liefert Reise-Preview für Code-Eingabe-Dialog
- Rückgabe: `{trip_id, name, status, participant_count}`

### `user_in_trip(p_trip_id)`
- Prüft ob aktueller User Mitglied ist
- Rückgabe: boolean

### `created_by_user(p_trip_id)`
- Prüft ob aktueller User Ersteller ist
- Rückgabe: boolean

---

## 15. Algorithmen & Berechnungslogik

### 15.1 Settlement-Algorithmus (Greedy)

**Ziel:** Alle Schulden mit minimaler Anzahl an Transfers ausgleichen.

**Schritt 1 – Saldo berechnen:**
```
Für jeden abrechnungsrelevanten Teilnehmer P:
  bezahlt = Summe aller Ausgaben, bei denen P Haupt- oder Mitzahler ist
  geschuldet = Summe aller Splits, in denen P enthalten ist
  nettoSaldo = bezahlt - geschuldet
```

**Schritt 2 – Transfers erzeugen:**
```
gläubiger = alle mit nettoSaldo > 0, absteigend sortiert
schuldner  = alle mit nettoSaldo < 0, aufsteigend sortiert

Solange beide Listen nicht leer:
  G = größter Gläubiger, S = größter Schuldner
  betrag = min(G.saldo, |S.saldo|)
  Transfer: S zahlt betrag an G
  G.saldo -= betrag
  S.saldo += betrag
  Falls saldo == 0: aus Liste entfernen
```

**Beispiel:**
```
Anna bezahlt 120€, schuldet 80€ → Saldo +40€
Ben bezahlt 20€, schuldet 80€  → Saldo -60€
Chris bezahlt 50€, schuldet 40€ → Saldo +10€

Transfers:
1. Ben → Anna: 40€   (Anna ausgeglichen, Ben schuldet noch 20€)
2. Ben → Chris: 20€  (Ben und Chris ausgeglichen)
→ 2 Transfers statt 3
```

---

### 15.2 Ausgaben-Aufteilung (proportional)

```
Gesamt-Shares = Summe der Shares aller beteiligten Teilnehmer
Für jeden Teilnehmer T (außer letztem):
  T.anteil = floor(amount_cents * T.shares / Gesamt-Shares)
Letzter Teilnehmer:
  T.anteil = amount_cents - Summe(alle anderen Anteile)
  // verhindert Rundungsfehler
```

---

### 15.3 Gruppen-Buchhaltung

- Gruppen selbst schulden/zahlen nichts direkt
- Mitglieder-Zahlungen werden zur Gruppen-Bilanz addiert
- Splits werden der Gruppe (nicht ihren Mitgliedern) zugeordnet
- Abrechnung läuft auf Gruppenebene
- Mitglieder-Aufschlüsselung nur zur Transparenz angezeigt

---

### 15.4 Multi-Payer-Logik

Bei mehreren Zahlern wird `paid_by_participant_id` als Hauptzahler gesetzt; alle weiteren als `co_payers`.

```
Hauptzahler bezahlt: amount_cents - Summe(co_payer_amounts)
co_payer[i] bezahlt: co_payers[i].amount_cents
```

**Validierung:**
- `Summe(co_payer_amounts) < amount_cents` (Hauptzahler muss mind. 1 Cent zahlen)
- `Summe(alle Zahlbeträge) == amount_cents`

---

## 16. UI-Komponenten & Patterns

### 16.1 Navigation

- **AppNav:** Sidebar (Desktop) / Bottom Navigation (Mobile)
  - Links: Dashboard, Profil, Hilfe
- **TripTabNav:** Tabs innerhalb einer Reise (Überblick, Ausgaben, Abrechnung, Statistiken, Einstellungen)

### 16.2 Schlüssel-Komponenten

| Komponente | Zweck |
|---|---|
| `ExpenseForm` | Multi-Payer + Split-Editor, Smart-Suggestion |
| `ExpenseCard` | Einzelne Ausgabe in der Liste |
| `SplitOverrideEditor` | Custom-Split Auswahl und Share-Eingabe |
| `CategoryIcon` | Emoji + Label für eine Kategorie |
| `TripParticipantManager` | Gäste/Gruppen verwalten, Shares bearbeiten |
| `TripCategorySettings` | Kategorien aktivieren/deaktivieren/umbenennen |
| `TripInvitePanel` | Invite Code anzeigen, kopieren, QR-Code |
| `BalanceTable` | Saldo-Übersicht pro Teilnehmer |
| `SettlementTransferList` | Liste der nötigen Überweisungen |
| `GroupMemberBreakdown` | Mitglieder-Zahlungen pro Gruppe |
| `ExpenseDetailReport` | Eingeklappter Ausgaben-Bericht |
| `SettlementExportButton` | PDF-Generierung und Download |
| `SpendingByCategoryChart` | Recharts Pie/Bar Chart |
| `SpendingOverTimeChart` | Recharts Line Chart, kumulativ |
| `LeaderboardCard` | Wer zahlt am meisten etc. |
| `BalanceSummaryCard` | Eigene Bilanz auf Trip-Übersicht |
| `CollapsibleEndedTrips` | Eingeklappte Liste abgeschlossener Reisen |

### 16.3 Interaktionsmuster

**Proportionsbalken (Multi-Payer):**
- Visueller gestapelter Balken zeigt %-Anteile der Zahler
- Grauer Bereich = noch nicht zugeordneter Betrag
- Aktualisiert sich bei jeder Betragseingabe live

**Recalculation-Dialog:**
- Erscheint beim Ändern von Shares, wenn Ausgaben vorhanden
- Klare Auswahl: „nur neue" vs. „alle proportionalen neu berechnen"
- Custom Splits werden niemals automatisch verändert

**Toast-Benachrichtigungen (sonner):**
- Erfolg: „Ausgabe gespeichert!"
- Fehler: Spezifische Fehlermeldung aus der API
- Lade-Status: Button-Label wechselt zu „Wird gespeichert..."

**Leere Zustände:**
- Kontextbezogene Meldungen mit Emoji
- Immer mit Call-to-Action (z.B. „Erste Ausgabe erfassen")

### 16.4 Design-System

- **Primary Color:** Teal (#1b5c58 → #134844 Gradient)
- **Card-Stil:** `card-shadow` Klasse, `rounded-2xl`
- **Komponentenbibliothek:** shadcn/ui (Button, Input, Label, Select, Checkbox, Dialog, Tabs, Badge, Avatar, …)
- **Icons:** lucide-react

---

## 17. Sicherheit & Autorisierung

### Authentifizierung
- Alle Routen erfordern eingeloggten User (Redirect zu `/login`)
- Session via Supabase Auth (HTTP-Only Cookie)

### Autorisierung

| Aktion | Berechtigung |
|---|---|
| Reise-Daten lesen | Nur Mitglieder der Reise |
| Ausgaben anlegen | Nur Mitglieder aktiver Reisen |
| Ausgaben bearbeiten/löschen | Nur bei aktiven Reisen |
| Reise beenden | Nur Ersteller |
| Teilnehmer hinzufügen/entfernen | Nur Ersteller |
| Kategorien konfigurieren | Nur Ersteller |
| Shares ändern | Nur Ersteller |

### Validierung
- Client-seitig: zod-Schemas in Formularen
- Server-seitig: RPC-Validierungen in PostgreSQL
- Keine direkte SQL-Manipulation vom Client

---

## 18. Lokalisierung & Formatierung

### Sprache
- Gesamte UI: **Deutsch (de-DE)**
- Alle Labels, Placeholder, Fehlermeldungen, Hilfetexte auf Deutsch

### Währungsformatierung

**Eingabe:** Unterstützt beide Formate:
- Deutsches Format: `1.250,50` (Punkt als Tausendertrenner, Komma als Dezimaltrennzeichen)
- Englisches Format: `1,250.50`

**Anzeige:** `€1.250,50` (de-DE Locale)

**Intern:** Immer als Integer-Cent (`125050`)

### Datumsformatierung

| Kontext | Format |
|---|---|
| Datepicker-Input | `YYYY-MM-DD` (ISO) |
| Kurze Anzeige | `15. Jul 2024` |
| Lange Anzeige | `Montag, 15. Juli 2024` |
| Heute (robust) | `todayISO()` Hilfsfunktion – lokale Zeit, nicht UTC |

---

## Hilfe-Seite (`/help`)

Interaktive Dokumentation mit anklickbarem Inhaltsverzeichnis, deckt ab:
1. Erste Schritte (Login, Profil)
2. Reise erstellen & verwalten
3. Einladen & Beitreten
4. Teilnehmertypen & Shares
5. Ausgaben erfassen & Kategorien
6. Abrechnung mit Beispiel
7. Profil verwalten
8. Reise beenden

---

*Zuletzt aktualisiert: März 2026*
