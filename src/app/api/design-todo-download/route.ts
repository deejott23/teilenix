import { NextResponse } from 'next/server'

const MARKDOWN = `# share|pa – Design TODO

Generiert: ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
Basis: konzept.html + Icon-Set (24×24, currentColor Sprite)

---

## Icons & Navigation
- [ ] AppNav (Desktop): Lucide → Custom Icons (#trip, #user, #bell)
- [ ] TripBottomNav: Lucide → Custom Icons (#expense, #calendar, #trip, #settle)
- [x] SVG-Sprite /public/icons.svg bereitgestellt (24 Icons)
- [x] Icon-Komponente src/components/ui/icon.tsx erstellt
- [x] CategoryIcon auf SVG-Icons umgestellt

## Buttons & CTAs
- [ ] Alle primären CTAs: Border-Radius r-sm=8px (statt rounded-2xl)
- [ ] FAB: Petrol-Schatten shadow-[0_4px_12px_rgba(27,92,88,.3)]
- [ ] Sekundärer Button: bg-primary/10 text-primary
- [ ] Danger-Button: bg-[#EF4444]
- [ ] Button-Hover: primary-700 #144442 durchgehend

## Expense-Bereich
- [ ] ExpenseCard: Kategorie-Farbe food=#FFF4ED/#E94E1B, hotel=#EFF6FF/#2563EB, transport=#F3F4F6/#4B5563, activity=#FEF3C7/#B45309
- [ ] ExpenseForm: Kategorie-Chips mit SVG-Icons statt Emoji
- [ ] Bezahlt-Badge: chip success mit #paid Icon
- [ ] Zahlungsstatus-Chips: chip warn (#pending) / chip success (#paid)
- [x] CategoryIcon: SVG-Icons mit Kategorie-Farben

## Trip-Karten & Dashboard
- [ ] TripCard: Status-Badge als Chip (Aktiv/Fertig)
- [ ] TripCard: #trip Icon
- [ ] BalanceSummaryCard: Stat-Grid Typografie
- [ ] Dashboard-Header: share|pa Wordmark

## Abrechnung / Settlement
- [ ] Transfer-Zeilen: #settle Icon + chip-Styling
- [ ] Saldo: chip success (#paid) / chip danger (#balance)
- [ ] Teilzahlungen: Button mit #add Icon

## Formulare & Inputs
- [ ] Input focus-ring: 3px rgba(27,92,88,.12)
- [ ] Select Chevron: #chevron-right aus Sprite
- [ ] Datepicker: #calendar aus Sprite
- [ ] Form-Labels: 12px 500 muted-foreground

## Packliste
- [ ] Edit-Icon: #edit aus Sprite (statt Lucide Pencil)
- [ ] Delete-Icon: #delete aus Sprite (statt Lucide Trash2)
- [x] Progress-Bar: #1b5c58 / #2d7a4f

## Planen (Ausflüge & Essen)
- [ ] Ausflug-Karte: #location Icon
- [ ] Ausflug-Karte: Datum mit #calendar Icon
- [ ] Essen-Karte: #cat-food Icon statt Emoji
- [ ] Voting-Buttons: konsistente Chip-Größe

## Einstellungen
- [ ] Settings-Kacheln: #settings, #group, #expense Icons
- [ ] Invite-Panel: #share Icon statt Lucide Share2
- [ ] Kategorie-Liste: Custom Icons pro Kategorie

## Statistiken / ReiseBlatt
- [ ] Kategorie-Donut: Slice-Farben nach Palette
- [ ] ReiseBlatt-Headlines: Typografie-Hierarchie
- [ ] Ranglisten-Bars: Petrol-Gradient

## Profil & Auth
- [ ] Login-Page: Feature-Pills als Chip-Konzept
- [ ] Google-Sign-In-Button: Angleichen

---

## Farbpalette (Referenz)

| Rolle           | Hex       |
|-----------------|-----------|
| Primary Petrol  | \`#1b5c58\` |
| Primary 700     | \`#144442\` |
| Primary 100     | \`#E6F0EF\` |
| Primary 50      | \`#F2F8F7\` |
| Background      | \`#F7FAF9\` |
| Green           | \`#3DB36A\` |
| Orange          | \`#E94E1B\` |
| Teal            | \`#2AA8C9\` |
| Sun             | \`#F39200\` |
| Success         | \`#10B981\` |
| Warning         | \`#F59E0B\` |
| Error           | \`#EF4444\` |

## Icon-Sprite Referenz

Kern: \`trip\`, \`group\`, \`expense\`, \`balance\`, \`settle\`, \`share\`, \`add\`, \`paid\`, \`pending\`
Kategorien: \`cat-food\`, \`cat-hotel\`, \`cat-transport\`, \`cat-activity\`, \`cat-shopping\`, \`cat-other\`
System: \`user\`, \`settings\`, \`bell\`, \`calendar\`, \`location\`, \`back\`, \`chevron-right\`, \`edit\`, \`delete\`

Verwendung:
\`\`\`tsx
import { Icon } from '@/components/ui/icon'
<Icon name="trip" size={20} />
\`\`\`
`

export async function GET() {
  return new NextResponse(MARKDOWN, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sharepa-design-todo.md"',
    },
  })
}
