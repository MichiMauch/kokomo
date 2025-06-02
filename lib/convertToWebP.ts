export async function convertImageToWebP(
  file: File,
  targetRatio?: number,
  maxWidth: number = 0
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')

        // Standard-Konvertierung (behält Originalmaße bei)
        let width = img.width
        let height = img.height

        // Schritt 1: Größenbegrenzung anwenden, falls angegeben (maxWidth > 0)
        if (maxWidth > 0 && width > maxWidth) {
          // Maßstabsgetreue Verkleinerung
          const scale = maxWidth / width
          width = maxWidth
          height = Math.round(height * scale)
        }

        // Schritt 2: Falls ein Ziel-Seitenverhältnis angegeben wurde, Bild entsprechend zuschneiden
        if (targetRatio) {
          const currentRatio = width / height

          if (currentRatio > targetRatio) {
            // Bild ist breiter als gewünscht - Breite beschneiden
            width = Math.round(height * targetRatio)
          } else if (currentRatio < targetRatio) {
            // Bild ist höher als gewünscht - Höhe beschneiden
            height = Math.round(width / targetRatio)
          }
        }

        // Canvas auf die Zielgröße setzen
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) return reject('Canvas context fehlt')

        // Skalierungslogik
        // Bei Größenänderung oder Zuschneideoperationen müssen wir die richtige Quellregion berechnen
        if (maxWidth > 0 || targetRatio) {
          // Wenn nur die Größe angepasst wurde (ohne Zuschneiden)
          if (maxWidth > 0 && !targetRatio) {
            // Einfache Skalierung des gesamten Bildes
            ctx.drawImage(img, 0, 0, width, height)
          }
          // Wenn zugeschnitten werden muss (mit oder ohne vorherige Größenanpassung)
          else {
            if (maxWidth > 0 && img.width > maxWidth) {
              // Bei vorheriger Größenanpassung: Wir arbeiten mit dem skalierten Bild
              // Erstelle zuerst ein skaliertes Bild
              const tempCanvas = document.createElement('canvas')
              const tempCtx = tempCanvas.getContext('2d')
              if (!tempCtx) return reject('Temporärer Canvas context fehlt')

              const scale = maxWidth / img.width
              const scaledWidth = maxWidth
              const scaledHeight = Math.round(img.height * scale)

              tempCanvas.width = scaledWidth
              tempCanvas.height = scaledHeight
              tempCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight)

              // Dann berechne den Ausschnitt für das Zuschneiden
              const sourceX = (scaledWidth - width) / 2
              const sourceY = (scaledHeight - height) / 2
              const sourceWidth = width
              const sourceHeight = height

              // Zeichne den zugeschnittenen Bereich auf das Ziel-Canvas
              ctx.drawImage(
                tempCanvas,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                0,
                0,
                width,
                height
              )
            } else {
              // Ohne vorherige Größenanpassung: Direkt aus dem Originalbild zuschneiden
              const sourceX = (img.width - width) / 2
              const sourceY = (img.height - height) / 2
              const sourceWidth = width
              const sourceHeight = height

              ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height)
            }
          }
        } else {
          // Standardfall: Bild unverändert zeichnen
          ctx.drawImage(img, 0, 0)
        }

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject('WebP Konvertierung fehlgeschlagen')
          },
          'image/webp',
          0.8 // Qualitätsfaktor (0–1)
        )
      }
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
