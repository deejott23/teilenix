'use client'
import { useState, useRef } from 'react'
import { Plus, Minus, Trash2, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useShopping,
  useAddShoppingItem,
  useToggleShoppingBought,
  useUpdateShoppingQty,
  useDeleteShoppingItem,
  useClearBoughtItems,
} from '@/hooks/useShopping'

// ── Types ──────────────────────────────────────────────
type ShoppingItem = {
  id: string
  trip_id: string
  title: string
  category: string
  quantity: number
  is_bought: boolean
  added_by_participant_id: string | null
  created_at: string
}

// ── Category config ─────────────────────────────────────
const CATEGORIES: { name: string; emoji: string; keywords: string[] }[] = [
  { name: 'Obst', emoji: '🍎', keywords: ['apfel','banane','erdbeere','orange','zitrone','traube','birne','pfirsich','melone','mango','ananas','kiwi','pflaume','himbeere','blaubeere','obst','feige','granatapfel','papaya','maracuja'] },
  { name: 'Gemüse', emoji: '🥦', keywords: ['tomate','gurke','paprika','zwiebel','knoblauch','karotte','möhre','möhrchen','salat','spinat','brokkoli','broccoli','zucchini','aubergine','pilz','champignon','lauch','sellerie','kohl','erbse','bohne','spargel','rucola','radieschen','gemüse','fenchel','kohlrabi','porree'] },
  { name: 'Käse', emoji: '🧀', keywords: ['käse','parmesan','mozzarella','gouda','emmentaler','brie','camembert','feta','ricotta','mascarpone','pecorino','grana','cheddar','gruyère'] },
  { name: 'Fleisch & Fisch', emoji: '🥩', keywords: ['fleisch','hähnchen','huhn','rind','schwein','wurst','schinken','salami','steak','hack','lachs','thunfisch','fisch','garnele','krabben','meeresfrüchte','speck','chorizo','pute','lamm','kalb','ente'] },
  { name: 'Milchprodukte', emoji: '🥛', keywords: ['milch','butter','sahne','joghurt','quark','rahm','ei','eier','skyr','crème','schmand','kefir'] },
  { name: 'Getränke', emoji: '🥤', keywords: ['wasser','saft','wein','bier','cola','limo','kaffee','tee','sprudel','mineralwasser','limonade','prosecco','sekt','whisky','vodka','gin','rum','sirup','nektar'] },
  { name: 'Backwaren', emoji: '🥖', keywords: ['brot','brötchen','baguette','toast','mehl','zucker','hefe','croissant','ciabatta','focaccia','knäckebrot','zwieback'] },
  { name: 'Snacks & Süßes', emoji: '🍫', keywords: ['chips','nuss','schokolade','keks','riegel','cracker','popcorn','bonbon','gummibär','joghurette','nutella','marmelade','honig','mandel','cashew','walnuss','erdnuss','müsli','müsliriegel','kekse'] },
  { name: 'Nudeln & Reis', emoji: '🍝', keywords: ['nudel','pasta','spaghetti','penne','rigatoni','tagliatelle','reis','couscous','quinoa','polenta','gnocchi','lasagne','tortellini','linse','kichererbse','bulgur'] },
  { name: 'Saucen & Gewürze', emoji: '🧂', keywords: ['sauce','soße','ketchup','senf','mayo','mayonnaise','öl','olivenöl','essig','balsamico','salz','pfeffer','gewürz','curry','paprikapulver','oregano','basilikum','thymian','rosmarin','petersilie','zimt','vanille','chili','tabasco','worcester','sojasauce','pesto'] },
  { name: 'Tiefkühl', emoji: '🧊', keywords: ['tiefkühl','eis','gefror','gefroren','pizza','fischstäbchen','spinat gefroren'] },
  { name: 'Haushalt', emoji: '🧹', keywords: ['spüli','spülmittel','seife','klopapier','toilettenpapier','putzmittel','schwamm','müllbeutel','alufolie','frischhaltefolie','backpapier','waschmittel','weichspüler','tüte','beutel','zahnpasta','shampoo','duschgel','deo','sonnencreme'] },
]

function detectCategory(title: string): string {
  const lower = title.toLowerCase()
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(kw => lower.includes(kw))) return cat.name
  }
  return 'Sonstiges'
}

function getCategoryEmoji(category: string): string {
  return CATEGORIES.find(c => c.name === category)?.emoji ?? '🛒'
}

// ── Main component ──────────────────────────────────────
export default function ShoppingListClient({
  tripId,
  initialItems,
}: {
  tripId: string
  initialItems: ShoppingItem[]
}) {
  // TanStack Query — liefert immer den aktuellen Stand (inkl. Realtime-Updates)
  const { data: items = initialItems } = useShopping(tripId, initialItems)

  const addItem       = useAddShoppingItem(tripId)
  const toggleBought  = useToggleShoppingBought(tripId)
  const updateQty     = useUpdateShoppingQty(tripId)
  const deleteItem    = useDeleteShoppingItem(tripId)
  const clearBought   = useClearBoughtItems(tripId)

  const [newTitle, setNewTitle] = useState('')
  const [newQty, setNewQty] = useState(1)
  const [showBought, setShowBought] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeItems = items.filter(i => !i.is_bought)
  const boughtItems = items.filter(i => i.is_bought)

  // Group active items by category
  const grouped = activeItems.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const cat = item.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  // Sort categories by CATEGORIES order, then 'Sonstiges' last
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORIES.findIndex(c => c.name === a)
    const bi = CATEGORIES.findIndex(c => c.name === b)
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  const handleAdd = () => {
    const title = newTitle.trim()
    if (!title) return
    addItem.mutate(
      { title, category: detectCategory(title), quantity: newQty },
      {
        onSuccess: () => {
          setNewTitle('')
          setNewQty(1)
          inputRef.current?.focus()
        },
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="space-y-4 pb-[90px]">

      {/* ── Add item row ── */}
      <div className="bg-card rounded-[18px] card-shadow border border-border p-3.5">
        <div className="flex gap-2 mb-3">
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Artikel eingeben…"
            maxLength={100}
            className="flex-1 px-3.5 py-2.5 rounded-[12px] bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary text-[14px] placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="flex items-center justify-between">
          {/* Qty stepper */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground font-semibold">Menge:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setNewQty(q => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 active:scale-90 transition-all"
              >
                <Minus className="w-3 h-3" strokeWidth={2.5} />
              </button>
              <span className="w-6 text-center text-[14px] font-bold text-foreground">{newQty}</span>
              <button
                type="button"
                onClick={() => setNewQty(q => Math.min(99, q + 1))}
                className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 active:scale-90 transition-all"
              >
                <Plus className="w-3 h-3" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newTitle.trim() || addItem.isPending}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] font-bold text-[13px] transition-all active:scale-95',
              newTitle.trim() ? 'bg-primary text-white hover:bg-primary/90' : 'bg-muted text-muted-foreground'
            )}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Hinzufügen
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {activeItems.length === 0 && boughtItems.length === 0 && (
        <div className="text-center py-12">
          <span className="text-[48px] block mb-3">🛒</span>
          <p className="text-[15px] font-bold text-foreground mb-1">Einkaufszettel ist leer</p>
          <p className="text-[13px] text-muted-foreground">Füge oben den ersten Artikel hinzu!</p>
        </div>
      )}

      {/* ── Active items by category ── */}
      {sortedCategories.map(category => (
        <div key={category} className="space-y-1">
          {/* Category header */}
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[14px]">{getCategoryEmoji(category)}</span>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{category}</span>
          </div>
          {/* Items */}
          <div className="bg-card rounded-[18px] card-shadow border border-border divide-y divide-border overflow-hidden">
            {grouped[category].map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleBought.mutate({ id: item.id, is_bought: !item.is_bought })}
                  className="w-5 h-5 rounded-[6px] border-2 border-border flex-shrink-0 flex items-center justify-center hover:border-primary transition-colors active:scale-90"
                />
                {/* Title */}
                <span className="flex-1 text-[14px] font-medium text-foreground leading-tight">
                  {item.title}
                </span>
                {/* Qty stepper */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQty.mutate({ id: item.id, quantity: Math.max(1, item.quantity - 1) })}
                    className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 active:scale-90 transition-all"
                  >
                    <Minus className="w-2.5 h-2.5" strokeWidth={2.5} />
                  </button>
                  <span className="w-5 text-center text-[13px] font-bold text-foreground">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQty.mutate({ id: item.id, quantity: Math.min(99, item.quantity + 1) })}
                    className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 active:scale-90 transition-all"
                  >
                    <Plus className="w-2.5 h-2.5" strokeWidth={2.5} />
                  </button>
                </div>
                {/* Delete */}
                <button
                  type="button"
                  onClick={() => deleteItem.mutate(item.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 active:scale-90 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── Eingekauft section ── */}
      {boughtItems.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowBought(v => !v)}
            className="w-full flex items-center justify-between px-1 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                ✅ Eingekauft ({boughtItems.length})
              </span>
            </div>
            {showBought
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
            }
          </button>

          {showBought && (
            <div className="space-y-1 mt-1">
              <div className="bg-card rounded-[18px] border border-border divide-y divide-border overflow-hidden opacity-60">
                {boughtItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    {/* Checked checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleBought.mutate({ id: item.id, is_bought: false })}
                      className="w-5 h-5 rounded-[6px] bg-green-500 border-2 border-green-500 flex-shrink-0 flex items-center justify-center active:scale-90 transition-all"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                        <polyline points="2 6 5 9 10 3" />
                      </svg>
                    </button>
                    <span className="flex-1 text-[14px] text-muted-foreground line-through">
                      {item.title}
                    </span>
                    <span className="text-[12px] text-muted-foreground">×{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => deleteItem.mutate(item.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 active:scale-90 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => clearBought.mutate(boughtItems.map(i => i.id))}
                className="w-full py-2 text-[12px] font-semibold text-destructive hover:bg-destructive/10 rounded-[12px] transition-colors"
              >
                Alle eingekauften Artikel löschen
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {(activeItems.length > 0 || boughtItems.length > 0) && (
        <div className="flex items-center gap-2 px-1">
          <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
          <span className="text-[12px] text-muted-foreground">
            {activeItems.length} offen · {boughtItems.length} eingekauft
          </span>
        </div>
      )}
    </div>
  )
}
