import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

// Design-TODO – Liste aller Komponenten/Bereiche, die noch kein neues Design haben
const TODO_ITEMS = [
  {
    section: 'Icons & Navigation',
    status: 'teilweise',
    items: [
      { done: true,  text: 'SVG-Sprite /public/icons.svg bereitgestellt (24 Icons)' },
      { done: true,  text: 'Icon-Komponente src/components/ui/icon.tsx erstellt' },
      { done: true,  text: 'CategoryIcon auf SVG-Icons umgestellt' },
      { done: false, text: 'AppNav (Desktop): Lucide-Icons für Reisen/Profil/Hilfe → Custom Icons (trip, user, bell)' },
      { done: false, text: 'TripBottomNav: Lucide-Icons → Custom Icons (expense, calendar, trip, settle, bell)' },
      { done: false, text: 'TripBottomNav: Home-Tab Icon → custom trip/suitcase' },
    ],
  },
  {
    section: 'Buttons & CTAs',
    status: 'offen',
    items: [
      { done: false, text: 'Alle primären CTAs: Border-Radius anpassen (r-sm=8px statt rounded-2xl)' },
      { done: false, text: 'FAB (Float-Action-Button) auf Petrol-Schatten updaten: shadow-[0_4px_12px_rgba(27,92,88,.3)]' },
      { done: false, text: 'Sekundärer Button: bg-primary/10 text-primary statt aktuelles variant="outline"' },
      { done: false, text: 'Danger-Button: bg-[#EF4444] statt bg-destructive (Einheitlichkeit)' },
      { done: false, text: 'Button-Hover-States durchgehend prüfen (primary-700 #144442 als Hover)' },
    ],
  },
  {
    section: 'Expense-Bereich',
    status: 'teilweise',
    items: [
      { done: true,  text: 'CategoryIcon: Emoji → farbige SVG-Icons nach Designspec' },
      { done: false, text: 'ExpenseCard: Kategorie-Icon-Farbe im Listenelement sichtbar machen (expense-icon food/hotel/transport/activity)' },
      { done: false, text: 'ExpenseForm: Kategorie-Auswahl als Chips mit Icons (statt Emoji-Text-Combo)' },
      { done: false, text: 'Bezahlt-Badge: chip success mit Icon #paid statt grünem Text' },
      { done: false, text: 'Zahlungsstatus-Chips (Offen/Bezahlt) in ExpenseCard → chip warn / chip success' },
    ],
  },
  {
    section: 'Trip-Karten & Dashboard',
    status: 'offen',
    items: [
      { done: false, text: 'TripCard: Status-Badge (Aktiv/Fertig) als Chip statt custom Span' },
      { done: false, text: 'TripCard: Icon-Bereich mit custom #trip Icon' },
      { done: false, text: 'BalanceSummaryCard: Stat-Grid (3 Kacheln) Typografie angleichen (l/v-Klassen)' },
      { done: false, text: 'Dashboard-Header: share|pa Wordmark mit korrektem Font-Weight' },
    ],
  },
  {
    section: 'Abrechnung / Settlement',
    status: 'offen',
    items: [
      { done: false, text: 'SettlementCard: Transfer-Zeilen mit #settle Icon + chip-Styling' },
      { done: false, text: 'Saldo-Zeilen: Positiv = chip success mit #paid Icon, Negativ = chip danger mit #balance Icon' },
      { done: false, text: 'Teilzahlungen erfassen: Button mit #add Icon' },
    ],
  },
  {
    section: 'Formulare & Inputs',
    status: 'offen',
    items: [
      { done: false, text: 'Input focus-ring: 3px ring rgba(27,92,88,.12) statt aktuell' },
      { done: false, text: 'Select/Dropdown: Chevron-Right Icon aus Sprite (statt Lucide ChevronDown)' },
      { done: false, text: 'Datepicker-Trigger: calendar Icon aus Sprite' },
      { done: false, text: 'Form-Labels: font-size 12px font-weight 500 color muted-foreground (konsistent)' },
    ],
  },
  {
    section: 'Packliste',
    status: 'offen',
    items: [
      { done: false, text: 'Packlist-Item: Edit-Icon aus Sprite (#edit) statt Pencil (Lucide)' },
      { done: false, text: 'Packlist-Item: Delete-Icon aus Sprite (#delete) statt Trash2 (Lucide)' },
      { done: false, text: 'Progress-Bar: bereits auf Petrol (#1b5c58), aber grüner Abschluss-State prüfen' },
      { done: true,  text: 'Progress-Bar Farben: #1b5c58 / #2d7a4f — erledigt' },
    ],
  },
  {
    section: 'Planen (Ausflüge & Essen)',
    status: 'offen',
    items: [
      { done: false, text: 'Ausflug-Karte: Location-Icon aus Sprite (#location)' },
      { done: false, text: 'Ausflug-Karte: Datum mit Calendar-Icon aus Sprite (#calendar)' },
      { done: false, text: 'Essen-Karte: cat-food Icon statt Emoji' },
      { done: false, text: 'Voting-Buttons: konsistente Chip-Größe und Abstände' },
    ],
  },
  {
    section: 'Einstellungen',
    status: 'offen',
    items: [
      { done: false, text: 'Settings-Navigations-Kacheln: #settings, #group, #expense Icons aus Sprite' },
      { done: false, text: 'Invite-Panel: #share Icon statt Lucide Share2' },
      { done: false, text: 'Kategorie-Liste: Custom Icons pro Kategorie (cat-food etc.)' },
    ],
  },
  {
    section: 'Statistiken / ReiseBlatt',
    status: 'offen',
    items: [
      { done: false, text: 'SpendingOverTimeChart: Linien-Farbe bereits #1b5c58 — prüfen ob Chart-Tooltip stimmt' },
      { done: false, text: 'Kategorie-Donut: Slice-Farben nach Designpalette' },
      { done: false, text: 'ReiseBlatt-Headlines: Schriften-Hierarchie aus Designkonzept' },
      { done: false, text: 'Ranglisten-Bars: Petrol-Gradient statt aktuelle Farben' },
    ],
  },
  {
    section: 'Profil & Auth',
    status: 'offen',
    items: [
      { done: false, text: 'Login-Page: Hero-Gradient auf korrektes Petrol (oklch-Werte prüfen)' },
      { done: false, text: 'Login-Page: Feature-Pills Styling nach Chip-Konzept' },
      { done: false, text: 'Google-Sign-In-Button: Icon + Styling angleichen' },
    ],
  },
]

const totalItems = TODO_ITEMS.flatMap(s => s.items).length
const doneItems  = TODO_ITEMS.flatMap(s => s.items).filter(i => i.done).length

export default function DesignTodoPage() {
  return (
    <div className="pb-8">
      {/* Header */}
      <div className="-mx-4 -mt-7 mb-6 px-6 pt-8 pb-7 rounded-b-3xl"
        style={{ background: 'linear-gradient(150deg, #1b5c58 0%, #144442 100%)' }}>
        <p className="text-[10px] font-bold tracking-[0.14em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Design System
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Design-TODO</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {doneItems}/{totalItems} Elemente abgeschlossen
        </p>
        {/* Progress bar */}
        <div className="mt-4 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(doneItems/totalItems*100)}%`, background: '#3DB36A' }} />
        </div>
      </div>

      {/* Download link */}
      <div className="bg-card card-shadow rounded-2xl p-4 mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Als Markdown downloaden</p>
          <p className="text-xs text-muted-foreground mt-0.5">Für Issues, Tickets oder Übergabe an Designer</p>
        </div>
        <a
          href="/api/design-todo-download"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#1b5c58' }}
        >
          Download
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {TODO_ITEMS.map(section => {
          const done = section.items.filter(i => i.done).length
          return (
            <div key={section.section} className="bg-card card-shadow rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <h2 className="font-bold text-foreground text-sm">{section.section}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: done === section.items.length ? '#ECFDF5' : '#FFF4ED',
                    color: done === section.items.length ? '#047857' : '#B45309',
                  }}>
                  {done}/{section.items.length}
                </span>
              </div>
              <ul className="divide-y divide-border/50">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 px-5 py-3">
                    <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-[10px]"
                      style={item.done
                        ? { background: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857' }
                        : { background: 'transparent', borderColor: '#E0E6E5', color: 'transparent' }
                      }>
                      {item.done ? '✓' : ''}
                    </span>
                    <span className={`text-xs leading-relaxed ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Back link */}
      <div className="mt-6 text-center">
        <Link href="/dashboard" className="text-sm text-primary font-semibold hover:underline">
          ← Zurück zum Dashboard
        </Link>
      </div>
    </div>
  )
}
