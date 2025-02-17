import { formatDate } from 'pliny/utils/formatDate'

export function formatDateTime(date: string, locale: string): string {
  const now = new Date()
  const commentDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000)

  // Weniger als 1 Minute
  if (diffInSeconds < 60) {
    return 'gerade eben'
  }

  // Weniger als 1 Stunde
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `vor ${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'}`
  }

  // Weniger als 24 Stunden
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `vor ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`
  }

  // Weniger als 7 Tage
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`
  }

  // Für ältere Dates: vollständiges Datum mit Uhrzeit
  return `${formatDate(date, locale)} ${new Date(date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
}
