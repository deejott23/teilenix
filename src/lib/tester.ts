// Emails that have the tester role — add/remove here to manage testers
const TESTER_EMAILS = [
  'tobimail@gmail.com',
  'simon.schwenk@gmail.com',
]

export function isTesterEmail(email: string | undefined | null): boolean {
  if (!email) return false
  return TESTER_EMAILS.includes(email.toLowerCase())
}

// All testers can access the /feedback overview
export function isAdminEmail(email: string | undefined | null): boolean {
  return isTesterEmail(email)
}

export function featureLabelFromPath(path: string): string {
  const segments: Record<string, string> = {
    expenses: 'Ausgaben',
    packlist: 'Packliste',
    einkauf: 'Einkaufsliste',
    essen: 'Essensplan',
    planen: 'Planung',
    participants: 'Teilnehmer',
    stats: 'Statistiken',
    settlement: 'Abrechnung',
    dashboard: 'Dashboard',
    settings: 'Einstellungen',
  }
  for (const [key, label] of Object.entries(segments)) {
    if (path.includes(`/${key}`)) return label
  }
  if (path.match(/\/trips\/[^/]+$/)) return 'Trip-Übersicht'
  return 'Allgemein'
}
