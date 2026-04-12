-- UX Audit Seed — 12 Findings by Claude (bypasses RLS, runs as superuser)
INSERT INTO feedback_comments (page_path, feature_label, comment, detail_text, tester_email, tester_name, status, category) VALUES

(
  '/dashboard',
  'Dashboard',
  'Leere Startseite ohne Orientierung: Neuen Nutzern fehlt ein klarer "Was tue ich jetzt?"-Hinweis. Es gibt keinen sichtbaren Einstieg wenn noch keine Reise vorhanden ist.',
  E'**Problem:** Die Dashboard-Leerseite zeigt nur einen "Neue Reise" Button ohne Erklärung was die App kann oder wie man startet.\n\n**Empfehlung:**\n- Illustrated empty state mit 3-Schritt-Erklärung (Reise erstellen → Leute einladen → Ausgaben erfassen)\n- Optionaler Schnellstart-Button "Demo-Reise ansehen"\n- Onboarding-Checklist (Profil vervollständigen, erste Reise anlegen)',
  'claude@teilenix.app',
  'Claude (UX-Audit)',
  'offen',
  'UX-Audit Claude'
),

(
  '/trips/new',
  'Trip-Übersicht',
  'Emoji-Pflichtfeld verwirrt Erstnutzer: Der Emoji-Picker erscheint sofort als erstes Feld mit 60+ Optionen. Ältere Nutzer wissen nicht was von ihnen erwartet wird.',
  E'**Problem:** Das Emoji steht visuell als prominentester Eingabepunkt, ohne Erklärung wozu es dient.\n\n**Empfehlung:**\n- Emoji optional machen oder ans Ende setzen\n- Tooltip/Label "Wähle ein Symbol für deine Reise (optional)"\n- Standard-Emoji vorbelegen (✈️) damit Nutzer direkt weitermachen können',
  'claude@teilenix.app',
  'Claude (UX-Audit)',
  'offen',
  'UX-Audit Claude'
),

(
  '/trips/[id]/expenses/new',
  'Ausgaben',
  'Ausgaben-Formular überwältigt Erstnutzer mit zu vielen Optionen gleichzeitig: Multi-Payer, Split-Modus und individuelle Anteile erscheinen alle auf einmal ohne Erklärung.',
  E'**Problem:** Das Formular zeigt sofort "Bezahlt von (mehrere möglich)", Split-Modus-Umschalter und Anteil-Regler. Für den Normalfall (einer zahlt, alle teilen gleich) braucht man 80% dieser Komplexität nicht.\n\n**Empfehlung:**\n- "Einfach-Modus" als Standard: Nur Titel, Betrag, Datum, Wer hat gezahlt\n- "Erweiterte Optionen"-Klappbereich für Split-Anpassungen\n- Hilfetext beim Split-Modus: "Gleichmäßig aufteilen reicht für die meisten Fälle"\n- Tooltips auf komplexen Feldern (ℹ️-Icon)',
  'claude@teilenix.app',
  'Claude (UX-Audit)',
  'offen',
  'UX-Audit Claude'
),

(
  '/trips/[id]/expenses',
  'Ausgaben',
  'Dreifach-Navigation erzeugt Orientierungslosigkeit: App-Nav + Trip-Bottom-Nav + Geld-Sub-Nav sind 3 Ebenen tief. Nutzer verlieren sich zwischen Tabs.',
  E'**Problem:** Nutzer navigieren: AppNav (Reisen/Profil/Hilfe) → TripBottomNav (Home/Geld/Planen/Listen) → GeldSubNav (Ausgaben/Abrechnung/Statistik). Das sind 3 unabhängige Navigations-Ebenen die gleichzeitig sichtbar sind.\n\n**Empfehlung:**\n- Sub-Nav (Geld/Listen) mit Breadcrumb-Hint verbinden: "Geld > Ausgaben"\n- Zurück-Pfeil auf Sub-Seiten damit der Weg klar ist\n- Erwägen: Sub-Nav in Tabs innerhalb der Seite statt extra Navigationsleiste',
  'claude@teilenix.app',
  'Claude (UX-Audit)',
  'offen',
  'UX-Audit Claude'
),

(
  '/trips/[id]/participants',
  'Teilnehmer',
  'Einladefunktion ist zu versteckt: Der "Einladen"-Button liegt tief in der Teilnehmer-Seite vergraben. Neue Nutzer suchen vergeblich wie man Freunde hinzufügt.',
  NULL,
  'claude@teilenix.app',
  'Claude (UX-Audit)',
  'offen',
  'UX-Audit Claude'
),

(
  '/trips/[id]/packlist',
  'Packliste',
  'Abgehakte Items bleiben sichtbar und erzeugen Unruhe: Durchgestrichene Packlisten-Einträge bleiben in der Hauptliste. Bei langer Liste wird es unübersichtlich.',
  E'**Problem:** Alle abgehakten Items bleiben sichtbar (durchgestrichen). Bei 30+ Items sieht die Liste chaotisch aus und man sieht nicht mehr schnell was noch fehlt.\n\n**Empfehlung:**\n- "Erledigte ausblenden"-Toggle (Standard: ausgeblendet)\n- Oder: Erledigte Items automatisch ans Ende verschieben\n- Fortschrittsbalken oben: "12 von 20 gepackt"',
  'claude@teilenix.app',
  'Claude (UX-Audit)',
  'offen',
  'UX-Audit Claude'
),

(
  '/trips/[id]/settlement',
  'Abrechnung',
  'Abrechnung ist für Laien unverständlich: Schuldner/Gläubiger-Pfeile und Fachbegriffe (Settlement) erklären nicht was der Nutzer konkret tun soll.',
  E'**Problem:** Die Abrechnung zeigt "A schuldet B 23,50 €" mit Pfeilen, aber es gibt keine Anleitung was das bedeutet oder wie man es abwickelt. Der Begriff "Settlement" ist Englisch/Fachsprache.\n\n**Empfehlung:**\n- Seite umbenennen in "Ausgleich" oder "Wer zahlt wem?"\n- Kurze Erklärung oben: "Diese Beträge gleichen alle Ausgaben fair aus."\n- Klare Handlungsaufforderung: "Überweise [Betrag] an [Person]"\n- Optional: WhatsApp/iMessage-Teilen-Button für einfache Weiterleitung',
  'claude@teilenix.app',
  'Claude (UX-Audit)',
  'offen',
  'UX-Audit Claude'
),

(
  '/trips/[id]/essen',
  'Essensplan',
  'Zettelwand ist für neue Nutzer nicht selbsterklärend: Der Begriff "Zettelwand" und die leere Seite geben keinen Hinweis was die Funktion macht oder wie man beginnt.',
  NULL,
  'claude@teilenix.app',
  'Claude (UX-Audit)',
  'offen',
  'UX-Audit Claude'
),

(
  '/dashboard',
  'Allgemein',
  'Feedback-FAB überlappt auf älteren Smartphones mit Bottom-Nav: Der Feedback-Button (bottom-[84px]) sitzt auf manchen Geräten direkt über dem Bottom-Nav und verdeckt Navigation.',
  NULL,
  'claude@teilenix.app',
  'Claude (UX-Audit)',
  'offen',
  'UX-Audit Claude'
),

(
  '/dashboard',
  'Allgemein',
  'Kein Offline-Indikator trotz Offline-Queue: Die App hat eine Offline-Queue für Ausgaben, zeigt aber keinen sichtbaren Hinweis wenn keine Verbindung besteht. Nutzer denken Eingaben gingen verloren.',
  E'**Problem:** Bei fehlender Internetverbindung werden Ausgaben zwar in der Offline-Queue gespeichert, aber es gibt kein Banner/Toast der das kommuniziert. Nutzer sehen ihre Eingabe scheinbar verschwinden.\n\n**Empfehlung:**\n- Persistent Banner "Offline – Daten werden synchronisiert sobald Verbindung besteht"\n- Pending-Indikator auf gespeicherten Items (⏳-Icon)\n- Erfolgs-Toast nach Sync: "3 Ausgaben synchronisiert ✓"',
  'claude@teilenix.app',
  'Claude (UX-Audit)',
  'offen',
  'UX-Audit Claude'
),

(
  '/profile',
  'Allgemein',
  'Profilbild-Bearbeitung nicht erkennbar: Der Avatar auf der Profil-Seite hat kein Bearbeiten-Icon. Nutzer ahnen nicht, dass sie es antippen können.',
  NULL,
  'claude@teilenix.app',
  'Claude (UX-Audit)',
  'offen',
  'UX-Audit Claude'
),

(
  '/trips/[id]',
  'Trip-Übersicht',
  'Bilanz-Zahlen auf Trip-Übersicht ohne Erklärung: Plus- und Minuszahlen in den Kacheln erklären nicht ob es Schulden oder Guthaben sind. Für Laien ist unklar was zu tun ist.',
  E'**Problem:** Die Trip-Übersicht zeigt Beträge wie "+34,50 €" und "-12,00 €" ohne Kontext. Ist das gut oder schlecht? Bin ich der Schuldner oder Gläubiger?\n\n**Empfehlung:**\n- Beschriftungen: "Du bekommst noch" vs. "Du schuldest noch"\n- Farbkodierung mit Legende: Grün = Guthaben, Rot = Schulden\n- Info-Icon (ℹ️) das erklärt wie die Berechnung funktioniert',
  'claude@teilenix.app',
  'Claude (UX-Audit)',
  'offen',
  'UX-Audit Claude'
);
