import crypto from 'crypto'

export function getGravatarUrl(email: string, size = 80): string {
  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex')

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`
}

export function getUIAvatarUrl(name: string, size = 80): string {
  // Erstelle eine URL-sichere Version des Namens
  const safeName = encodeURIComponent(name)
  // Generiere eine zufällige Hintergrundfarbe basierend auf dem Namen
  const colors = ['1abc9c', '2ecc71', '3498db', '9b59b6', 'f1c40f', 'e67e22', 'e74c3c', '34495e']
  const colorIndex =
    name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  const backgroundColor = colors[colorIndex]

  return `https://ui-avatars.com/api/?name=${safeName}&size=${size}&background=${backgroundColor}&color=fff`
}

export async function getAvatarUrl(name: string, email?: string, size = 80): Promise<string> {
  if (email) {
    try {
      // Prüfe ob ein Gravatar existiert
      const gravatarUrl = getGravatarUrl(email, size)
      const response = await fetch(gravatarUrl, { method: 'HEAD' })
      if (response.ok) {
        return gravatarUrl
      }
    } catch (error) {
      console.error('Failed to check Gravatar:', error)
    }
  }

  // Fallback zu UI Avatars
  return getUIAvatarUrl(name, size)
}
