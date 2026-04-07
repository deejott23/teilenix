import { HelpCircle, Plane, Users, Receipt, BarChart2, CreditCard, Tag, LogOut, QrCode, UserCircle, ChevronRight, ListChecks, Settings } from 'lucide-react'

interface SectionProps {
  id: string
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

function Section({ id, icon, title, children }: SectionProps) {
  return (
    <section id={id} className="bg-card card-shadow rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
        <h2 className="font-bold text-foreground text-base">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  )
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[11px] font-bold flex-shrink-0 mt-0.5">
        {num}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 bg-primary/5 border border-primary/15 rounded-xl px-3.5 py-3">
      <span className="text-base flex-shrink-0">💡</span>
      <p className="text-xs text-foreground/80 leading-relaxed">{children}</p>
    </div>
  )
}

function InfoRow({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs font-semibold text-primary w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-muted-foreground leading-relaxed">{desc}</span>
    </div>
  )
}

export default function HelpPage() {
  const toc = [
    { id: 'start',       label: 'Erste Schritte'       },
    { id: 'trips',       label: 'Reisen'                },
    { id: 'invite',      label: 'Einladen & Beitreten' },
    { id: 'teilnehmer',  label: 'Teilnehmer & Gruppen' },
    { id: 'ausgaben',    label: 'Ausgaben'              },
    { id: 'packlist',    label: 'Packliste'             },
    { id: 'kategorien',  label: 'Kategorien'            },
    { id: 'einstellungen', label: 'Einstellungen'       },
    { id: 'abrechnung',  label: 'Abrechnung'            },
    { id: 'profil',      label: 'Profil'                },
    { id: 'abschluss',   label: 'Reise abschließen'    },
  ]

  return (
    <div className="pb-8">

      {/* Header */}
      <div className="bg-card card-shadow rounded-2xl p-5 mb-4 flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-6 h-6 text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Hilfe & Anleitung</h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Hier findest du alles, was du brauchst, um TeileniX optimal zu nutzen — von der ersten Reise bis zur fairen Abrechnung.
          </p>
        </div>
      </div>

      {/* Table of contents */}
      <div className="bg-card card-shadow rounded-2xl p-4 mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Inhalt</p>
        <div className="grid grid-cols-2 gap-1">
          {toc.map((item, i) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
            >
              <span className="text-[10px] text-muted-foreground/50 w-4">{i + 1}.</span>
              {item.label}
              <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-4">

        {/* 1. Erste Schritte */}
        <Section id="start" icon={<Plane className="w-4 h-4" strokeWidth={2} />} title="Erste Schritte">
          <p className="text-sm text-muted-foreground leading-relaxed">
            TeileniX ist dein Begleiter für faire Reisekostenaufteilung. In wenigen Minuten bist du startklar.
          </p>
          <div className="space-y-3">
            <Step num={1} title="Mit Google anmelden" desc="Nutze deinen Google-Account für die schnelle und sichere Anmeldung — kein Passwort nötig." />
            <Step num={2} title="Anzeigename prüfen" desc="Im Profil (unten rechts) kannst du deinen Namen anpassen. Der geänderte Name erscheint automatisch überall in deinen Reisen." />
            <Step num={3} title="Reise erstellen oder beitreten" desc="Erstelle deine erste Reise über «Neue Reise planen» oder tritt einer bestehenden Reise über «Einladung erhalten?» bei." />
          </div>
          <Tip>Du musst nichts vorkonfigurieren — einfach loslegen und die erste Ausgabe eintragen!</Tip>
        </Section>

        {/* 2. Reisen */}
        <Section id="trips" icon={<Plane className="w-4 h-4" strokeWidth={2} />} title="Reisen">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Jede Reise ist ein eigenständiger Bereich mit eigenen Teilnehmern, Ausgaben, Packliste und einer Abrechnung.
          </p>
          <div className="space-y-2">
            <InfoRow label="Neue Reise" desc="Über «Neue Reise planen» auf dem Dashboard eine Reise anlegen. Name, optional Beschreibung, Start- und Enddatum sowie ein Emoji-Icon wählen." />
            <InfoRow label="Icon & Titelbild" desc="Jede Reise hat ein Emoji als Icon. Durch Antippen des Icons im Header kann das Emoji geändert oder ein eigenes Foto hochgeladen werden. Alle Teilnehmer können das Bild ändern." />
            <InfoRow label="Reisestatus" desc="Aktive Reisen ermöglichen neue Ausgaben und Packliste-Einträge. Abgeschlossene Reisen sind gesperrt, die Abrechnung bleibt dauerhaft abrufbar." />
            <InfoRow label="Dashboard" desc="Alle aktiven Reisen erscheinen oben. Abgeschlossene Reisen sind eingeklappt und können über «Abgeschlossen (N)» aufgeklappt werden." />
          </div>
          <div className="space-y-3 mt-2">
            <Step num={1} title="Neue Reise anlegen" desc="Tippe auf «Neue Reise planen», wähle ein Emoji, vergib einen Namen (z.B. «Mallorca 2026») und optional Start- und Enddatum." />
            <Step num={2} title="Titelbild setzen (optional)" desc="Im Header der Reise das Emoji antippen → Tab «Foto» → Bild hochladen (JPG, PNG, WebP, max. 5 MB)." />
            <Step num={3} title="Teilnehmer einladen" desc="Im Tab «Einstellungen» findest du den Einladungscode. Teile ihn mit deiner Gruppe." />
          </div>
        </Section>

        {/* 3. Einladen & Beitreten */}
        <Section id="invite" icon={<QrCode className="w-4 h-4" strokeWidth={2} />} title="Einladen & Beitreten">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Jede Reise hat einen eindeutigen 8-stelligen Einladungscode. Damit können Mitreisende der Reise beitreten.
          </p>
          <div className="space-y-2">
            <InfoRow label="Code finden" desc="Im Tab «Einstellungen» deiner Reise → Bereich «Teilnehmer» → Einladungscode anzeigen und kopieren." />
            <InfoRow label="Code teilen" desc="Sende den Code per Nachricht, zeige ihn direkt oder nutze den Teilen-Button." />
            <InfoRow label="Einladung erhalten?" desc="Auf dem Dashboard den Button «Einladung erhalten?» tippen, 8-stelligen Code eintippen und beitreten." />
            <InfoRow label="Anteile wählen" desc="Beim Beitreten kann die Anzahl Anteile festgelegt werden (relevant für die Kostenaufteilung bei unterschiedlicher Gruppengröße)." />
          </div>
          <Tip>Der Einladungscode ist nur für aktive Reisen gültig. Abgeschlossene Reisen können nicht mehr betreten werden.</Tip>
        </Section>

        {/* 4. Teilnehmer & Gruppen */}
        <Section id="teilnehmer" icon={<Users className="w-4 h-4" strokeWidth={2} />} title="Teilnehmer & Gruppen">
          <p className="text-sm text-muted-foreground leading-relaxed">
            TeileniX unterstützt sowohl Einzelpersonen als auch Gruppen (z.B. Familien) als Teilnehmer einer Reise.
          </p>
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Teilnehmertypen</p>
            <InfoRow label="Registrierter Nutzer" desc="Hat einen TeileniX-Account und ist der Reise selbst beigetreten. Kann Ausgaben erfassen." />
            <InfoRow label="Gast (+Gast)" desc="Wird manuell hinzugefügt — für Personen ohne Account (z.B. Kinder, Freunde ohne App)." />
            <InfoRow label="Gruppe (+Gruppe)" desc="Steht für eine Familie oder Personengruppe. Anteile werden gemeinsam gerechnet." />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Anteile (Shares)</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Anteile bestimmen, wie die Kosten unter den Teilnehmern aufgeteilt werden.
            </p>
            <InfoRow label="1 Anteil" desc="Standard für eine Einzelperson." />
            <InfoRow label="2 Anteile" desc="Sinnvoll z.B. für ein Paar, das zusammen bucht." />
            <InfoRow label="3+ Anteile" desc="Für größere Familien oder Gruppen." />
          </div>
          <Tip>Gruppen erscheinen als ein Eintrag in der Ausgabenliste, werden aber nach Anteilen abgerechnet. Perfekt für Familien!</Tip>
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">So geht&apos;s</p>
            <Step num={1} title="Gast hinzufügen" desc="Im Tab «Einstellungen» → Bereich «Teilnehmer» → «+Gast» tippen, Name eingeben." />
            <Step num={2} title="Gruppe anlegen" desc="Im Bereich «Gruppen» → «+Gruppe» tippen, Gruppenname und Anteile festlegen." />
            <Step num={3} title="Teilnehmer bearbeiten" desc="Auf den Namen tippen → Name und Anteile können jederzeit geändert werden." />
          </div>
        </Section>

        {/* 5. Ausgaben */}
        <Section id="ausgaben" icon={<Receipt className="w-4 h-4" strokeWidth={2} />} title="Ausgaben erfassen">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ausgaben können von jedem Teilnehmer erfasst werden. TeileniX berechnet automatisch, wer wem wie viel schuldet.
          </p>
          <div className="space-y-3">
            <Step num={1} title="«Neue Ausgabe» tippen" desc="Im Tab «Ausgaben» auf den Button «Neue Ausgabe» oben tippen." />
            <Step num={2} title="Details eingeben" desc="Bezeichnung eingeben — die Kategorie wird automatisch vorgeschlagen. Betrag und Datum ergänzen." />
            <Step num={3} title="Bezahlt von" desc="Auswählen, wer den Betrag vorstreckt hat. Es können auch mehrere Zahler mit je eigenem Betrag angegeben werden." />
            <Step num={4} title="Aufteilung wählen" desc="«Alle» teilt proportional zu den Anteilen auf. «Individuell» ermöglicht manuelle Auswahl der Beteiligten und eigene Anteile." />
          </div>
          <div className="space-y-2 mt-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Aufteilungsmodi</p>
            <InfoRow label="Alle (Standard)" desc="Der Betrag wird auf alle Teilnehmer proportional zu ihren Anteilen aufgeteilt." />
            <InfoRow label="Individuell" desc="Du wählst manuell aus, welche Teilnehmer beteiligt sind und kannst die Anteile anpassen." />
          </div>
          <Tip>Ausgaben können nachträglich bearbeitet oder gelöscht werden — solange die Reise aktiv ist.</Tip>
        </Section>

        {/* 6. Packliste */}
        <Section id="packlist" icon={<ListChecks className="w-4 h-4" strokeWidth={2} />} title="Packliste">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Im Tab «Packliste» hat jede Reise eine gemeinsame Packliste — für persönliches Gepäck, Gruppenartikel und alles, was noch jemand mitbringen muss.
          </p>
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Die drei Bereiche</p>
            <InfoRow label="🎒 Ich/Wir bringe mit" desc="Dinge, die du persönlich für die Gruppe mitbringst — für alle sichtbar (z.B. Bluetooth-Lautsprecher, Kartenspiel)." />
            <InfoRow label="🛍️ Gruppe sucht" desc="Artikel, die die Gruppe noch braucht — jeder kann ein Item hinzufügen und die benötigte Menge festlegen. Andere können sich bereit erklären, es mitzubringen." />
            <InfoRow label="📦 Gruppe bringt mit" desc="Zeigt, welche «Gruppe sucht»-Items bereits (teil-)gedeckt sind — wer bringt wie viele Einheiten mit." />
          </div>
          <div className="space-y-2 mt-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Schnellfilter</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mit den Filter-Chips oben («Alle» / «🎒 Bringe mit» / «🛍️ Gruppe sucht» / «🔒 Gruppe») lässt sich die Liste auf einen bestimmten Typ einschränken.
            </p>
          </div>
          <div className="space-y-3 mt-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">So geht&apos;s</p>
            <Step num={1} title="Item hinzufügen" desc="Den «Packliste»-Button unten rechts antippen → Typ auswählen (Ich bringe mit / Gruppe sucht) → Bezeichnung eingeben." />
            <Step num={2} title="Abhaken" desc="Die Checkbox links am Item antippen, um es als eingepackt zu markieren. Das Häkchen wird nur für dich gespeichert." />
            <Step num={3} title="Item bearbeiten" desc="Auf das Stift-Icon tippen, um den Namen eines eigenen Items zu ändern." />
            <Step num={4} title="«Gruppe sucht»-Item decken" desc="Bei einem offenen Item im Bereich «Gruppe sucht» auf «Ich bringe das» (bzw. «Wir bringen das» als Gruppe) tippen und ggf. die Menge anpassen." />
            <Step num={5} title="Menge anpassen" desc="Bei «Gruppe sucht»-Items: Benötigte Menge mit + / − einstellen. Mehrere Personen können anteilig mitbringen." />
          </div>
          <Tip>Der «Gruppe bringt mit»-Bereich aktualisiert sich automatisch, sobald jemand ein «Gruppe sucht»-Item übernimmt oder selbst etwas hinzufügt.</Tip>
        </Section>

        {/* 7. Kategorien */}
        <Section id="kategorien" icon={<Tag className="w-4 h-4" strokeWidth={2} />} title="Kategorien anpassen">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Im Tab «Einstellungen» kannst du die Ausgabenkategorien für jede Reise individuell anpassen — aktivieren, umbenennen oder eigene anlegen.
          </p>
          <div className="space-y-2">
            <InfoRow label="Standardkategorien" desc="7 vordefinierte Kategorien: Essen & Trinken, Transport, Unterkunft, Aktivitäten, Einkauf, Gesundheit, Sonstiges." />
            <InfoRow label="Aktivieren/Deaktivieren" desc="Nicht benötigte Kategorien einfach deaktivieren." />
            <InfoRow label="Umbenennen" desc="Das Stift-Icon neben einer Kategorie antippen, um Name und Emoji zu ändern." />
            <InfoRow label="Eigene Kategorien" desc="Über «+ Eigene» können individuelle Kategorien mit eigenem Emoji und Namen erstellt werden." />
          </div>
          <div className="space-y-2 mt-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Automatischer Vorschlag</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Beim Eingeben des Ausgabentitels erkennt die App Schlüsselwörter und wählt automatisch eine passende Kategorie — erkennbar am <span className="text-foreground font-medium">✦ Vorschlag</span>-Hinweis.
            </p>
          </div>
          <Tip>Eigene Kategorien sind ideal für spezielle Reisen — z.B. «🎿 Skipass» oder «🎵 Konzert».</Tip>
        </Section>

        {/* 8. Einstellungen */}
        <Section id="einstellungen" icon={<Settings className="w-4 h-4" strokeWidth={2} />} title="Einstellungen">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Im Tab «Einstellungen» findest du alle reisespezifischen Konfigurationen. Die interne Navigation am Anfang des Tabs ermöglicht schnellen Zugriff auf alle Bereiche.
          </p>
          <div className="space-y-2">
            <InfoRow label="Teilnehmer" desc="Neue Teilnehmer hinzufügen, bestehende bearbeiten oder entfernen. Hier findest du auch den Einladungscode." />
            <InfoRow label="Kategorien" desc="Ausgabenkategorien aktivieren, umbenennen oder eigene anlegen." />
            <InfoRow label="Abrechnung" desc="Direktlink zur Abrechnung — Salden, Überweisungen und Teilzahlungen auf einen Blick." />
            <InfoRow label="Reise abschließen" desc="Nur für den Ersteller der Reise sichtbar. Beendet die Reise dauerhaft." />
          </div>
          <Tip>Die Navigations-Kacheln am Anfang des Einstellungs-Tabs führen dich direkt zu dem gewünschten Bereich.</Tip>
        </Section>

        {/* 9. Abrechnung */}
        <Section id="abrechnung" icon={<CreditCard className="w-4 h-4" strokeWidth={2} />} title="Abrechnung & Teilzahlungen">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Die Abrechnung ist über den Tab «Einstellungen» → «Abrechnung» erreichbar. Du siehst jederzeit den aktuellen Stand — wer hat bezahlt, wer schuldet noch was.
          </p>
          <div className="space-y-2">
            <InfoRow label="Salden-Übersicht" desc="Zeigt für jeden Teilnehmer: Gesamtbetrag bezahlt, Anteil laut Aufteilung und die Differenz (positiv = bekommt Geld zurück, negativ = schuldet noch)." />
            <InfoRow label="Überweisungen" desc="TeileniX berechnet die minimale Anzahl an Zahlungen, um alle Schulden auszugleichen." />
            <InfoRow label="Teilzahlungen" desc="Hat jemand bereits einen Teil seines Anteils direkt bezahlt? Mit «Teilzahlung erfassen» (Button neben «Wer zahlt wem?») kann diese Zahlung erfasst werden — sie wird automatisch in der Abrechnung berücksichtigt." />
            <InfoRow label="Statistiken" desc="Im Tab «Statistiken» gibt es eine Ausgabenübersicht nach Kategorien sowie Bestenlisten — inkl. Packliste-Spaßstatistiken." />
          </div>

          <div className="bg-muted rounded-xl p-3.5 space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Beispiel: Teilzahlung</p>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Ben schuldet Anna noch €60. Ben zahlt direkt €30 bar an Anna.<br />
              → «Teilzahlung erfassen» → Von: Ben → An: Anna → €30<br />
              → Die Abrechnung zeigt jetzt noch €30 ausstehend.
            </p>
          </div>

          <div className="bg-muted rounded-xl p-3.5 space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Beispiel: Abrechnung</p>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Anna hat €120 bezahlt, ihr Anteil wäre €80 → sie bekommt €40 zurück.<br />
              Ben hat €20 bezahlt, sein Anteil wäre €80 → er schuldet €60.<br />
              → Ben zahlt €40 an Anna und €20 an Chris.
            </p>
          </div>
        </Section>

        {/* 10. Profil */}
        <Section id="profil" icon={<UserCircle className="w-4 h-4" strokeWidth={2} />} title="Profil">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Im Profil (Tab unten rechts) kannst du deinen Anzeigenamen anpassen.
          </p>
          <div className="space-y-2">
            <InfoRow label="Name ändern" desc="Auf den Stift neben deinem Namen tippen, neuen Namen eingeben und mit Enter oder ✓ bestätigen. Der neue Name erscheint sofort in allen deinen Reisen." />
            <InfoRow label="E-Mail-Adresse" desc="Wird über deinen Google-Account verwaltet und kann in TeileniX nicht geändert werden." />
            <InfoRow label="Profilbild" desc="Wird automatisch von Google übernommen." />
          </div>
          <Tip>Dein Anzeigename ist für alle Mitreisenden in gemeinsamen Reisen sichtbar — und wird auch in der Packliste und Abrechnung angezeigt.</Tip>
        </Section>

        {/* 11. Reise abschließen */}
        <Section id="abschluss" icon={<LogOut className="w-4 h-4" strokeWidth={2} />} title="Reise abschließen">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Wenn alle Ausgaben erfasst sind, kann der Ersteller der Reise diese abschließen.
          </p>
          <div className="space-y-3">
            <Step num={1} title="Tab «Einstellungen» öffnen" desc="Nur der Ersteller der Reise sieht den Abschluss-Button — unter «Reise abschließen» ganz unten." />
            <Step num={2} title="«Reise abschließen» tippen" desc="Nach Bestätigung wechselt der Status zu «Fertig» — keine neuen Ausgaben mehr möglich." />
            <Step num={3} title="Finale Abrechnung" desc="Die Abrechnung bleibt dauerhaft abrufbar. Alle Teilnehmer können sie weiterhin einsehen." />
          </div>
          <div className="bg-destructive/8 border border-destructive/15 rounded-xl px-3.5 py-3 flex gap-2.5">
            <span className="text-base flex-shrink-0">⚠️</span>
            <p className="text-xs text-foreground/80 leading-relaxed">
              <strong>Achtung:</strong> Abgeschlossene Reisen können nicht wieder aktiviert werden. Stelle sicher, dass alle Ausgaben vollständig erfasst sind.
            </p>
          </div>
        </Section>

        {/* Footer */}
        <div className="bg-card card-shadow rounded-2xl p-5 text-center">
          <p className="text-sm font-semibold text-foreground mb-1">Noch Fragen?</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            TeileniX · Entwickelt für stressfreie Reisen und faire Abrechnungen.
          </p>
        </div>

      </div>
    </div>
  )
}
