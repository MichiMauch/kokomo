export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  // Prüfe, ob die Vektoren die gleiche Länge haben
  if (vecA.length !== vecB.length) {
    throw new Error('Vektoren müssen die gleiche Länge haben')
  }

  // Berechne das Skalarprodukt
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)

  // Berechne die Magnitude (Länge) der beiden Vektoren
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))

  // Wenn einer der Vektoren ein Nullvektor ist, gib 0 zurück
  if (magnitudeA === 0 || magnitudeB === 0) return 0

  // Berechne die Kosinus-Ähnlichkeit
  return dotProduct / (magnitudeA * magnitudeB)
}
