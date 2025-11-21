# Google Docs → Blog Workflow - Quick Reference

Schnelle Übersicht über den Google Docs zu Kokomo Blog Workflow.

---

## 📝 Workflow in 3 Schritten

### 1. Blogpost in Google Docs schreiben

1. **Neues Google Doc** im "Kokomo Blog Posts" Ordner erstellen
2. **Dokumenttitel** = MDX Titel (z.B. "Unser erstes Jahr im Tiny House")
3. **Ersten Absatz schreiben** = Wird automatisch zur Summary
4. **Optional: DRAFT:** Präfix im Dokumenttitel für Entwürfe
5. **Bilder einfügen**:
   - Erstes Bild = Featured/Teaser Image (erscheint im Frontmatter)
   - Weitere Bilder = Content-Bilder (automatisch zu R2 hochgeladen)

### 2. Testen (Optional)

```bash
npm run test:doc "Teil des Titels"
```

Speichert MDX lokal in `/temp/` ohne GitHub Push.

### 3. Veröffentlichen

```bash
# Einzelnen Post veröffentlichen
npm run publish:doc "Unser erstes Jahr"

# Alle neuen Posts veröffentlichen
npm run publish:all-docs

# Vorschau ohne zu publizieren
npm run preview:docs
```

**Das passiert automatisch:**

- ✅ HTML Export von Google Docs
- ✅ Metadaten extrahieren (Titel, Summary, Tags)
- ✅ Bilder zu Cloudflare R2 hochladen
- ✅ Markdown Konvertierung mit `{IMAGE_PATH}` Platzhaltern
- ✅ MDX-Datei generieren
- ✅ GitHub Push → Vercel Deployment

---

## 🔧 Verfügbare Commands

| Command                       | Beschreibung                                    |
| ----------------------------- | ----------------------------------------------- |
| `npm run test:doc "Titel"`    | Test mit R2-Upload, speichert lokal in `/temp/` |
| `npm run publish:doc "Titel"` | Publiziert einzelnes Dokument zu GitHub         |
| `npm run publish:all-docs`    | Publiziert alle Dokumente im Ordner             |
| `npm run preview:docs`        | Zeigt Preview ohne zu publizieren               |

---

## ✨ Was wird automatisch extrahiert?

### Aus dem Google Doc:

- **Titel** = Google Doc Dokumenttitel
- **Summary** = Erster Absatz des Inhalts (max. 200 Zeichen)
- **Datum** = Heute (automatisch)
- **Authors** = `['default']` (automatisch)
- **Draft Status** = `DRAFT:` Präfix im Dokumenttitel
- **Featured Image** = Erstes Bild im Dokument (für Frontmatter)
- **Content-Bilder** = Alle weiteren Bilder (zu R2 hochgeladen)

### Aus Google Drive Properties:

- **Tags** = Aus "Beschreibung" Field des Google Docs
- Falls leer: Default `'tiny house, blog'`

**Tags setzen:**

1. Google Drive öffnen
2. Rechtsklick auf Dokument → "Details anzeigen"
3. "Beschreibung" Feld füllen: `tiny house, nachhaltigkeit, erfahrungen`

---

## 📋 Beispiel-Workflow

```bash
# 1. Google Doc erstellen
# - Dokumenttitel: "10 Tipps für Tiny House Anfänger"
# - Erster Absatz: "Nach einem Jahr im Tiny House haben wir viel gelernt..."
# - 3 Bilder eingefügt

# 2. Testen
npm run test:doc "10 Tipps"
# → Prüft MDX in /temp/10-tipps-fuer-tiny-house-anfaenger.mdx

# 3. Veröffentlichen
npm run publish:doc "10 Tipps"
# → Pushed zu GitHub → Vercel deployt automatisch

# 4. Nach 5-10 Minuten live auf kokomo.house! 🎉
```

---

## 🖼️ Bilder-Handling

### Featured Image (Teaser):

- **Erstes Bild** im Google Doc wird automatisch als Featured Image verwendet
- Wird zu Cloudflare R2 hochgeladen
- Erscheint im MDX Frontmatter: `images: https://...r2.dev/featured-titel.webp`
- Wird **nicht** im Content angezeigt

### Content-Bilder:

- **Alle weiteren Bilder** werden zu Content-Bildern
- Werden automatisch zu R2 hochgeladen
- Im MDX als `![]({IMAGE_PATH}/titel-1.webp)` gespeichert
- Reihenfolge wird beibehalten

---

## ⚠️ Troubleshooting

### Problem: "Kein Google Doc mit Titel '...' gefunden"

→ Suchbegriff muss im Dokumenttitel vorkommen (case-insensitive)

### Problem: "Unable to authenticate"

→ `.env.local` prüfen (siehe [GOOGLE_DOCS_SETUP.md](./GOOGLE_DOCS_SETUP.md))

### Problem: Bilder werden nicht hochgeladen

→ Cloudflare R2 Credentials in `.env.local` prüfen:

- `CLOUDFLARE_BUCKET_2`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`

### Problem: CSS-Code im MDX

→ Script filtert Google Docs CSS automatisch - falls es durchkommt, bitte melden

### Problem: Featured Image erscheint im Content

→ Prüfen, ob Script erfolgreich durchlief - erstes Bild sollte automatisch entfernt werden

---

## 📚 Weitere Dokumentation

- **[GOOGLE_DOCS_QUICKSTART.md](./GOOGLE_DOCS_QUICKSTART.md)** - Ausführliche Einführung mit Beispielen
- **[GOOGLE_DOCS_SETUP.md](./GOOGLE_DOCS_SETUP.md)** - Einmaliges Setup (Google Cloud, Service Account, etc.)

---

## 💡 Tipps & Best Practices

### Template-Dokument

Erstellen Sie ein "📝 Template - Neuer Blogpost" Dokument zum Duplizieren für neue Posts.

### Kollaboration

Google Docs unterstützt Echtzeit-Kollaboration - mehrere Personen können gleichzeitig schreiben!

### Mobile Blogging

Nutzen Sie die Google Docs App auf Smartphone/Tablet zum Schreiben unterwegs.

### Versionierung

Google Docs speichert automatisch alle Versionen:
**Datei → Versionsverlauf → Versionen anzeigen**

### Draft-Modus

Setzen Sie `DRAFT:` Präfix im Dokumenttitel, um an einem Post zu arbeiten ohne ihn zu veröffentlichen:

- `DRAFT: Mein neuer Blogpost` → `draft: true` im MDX

---

## 🔐 Sicherheit

**Niemals committen:**

- ❌ `.env.local`
- ❌ Service Account JSON (in `/secrets/`)
- ❌ Private Keys

Diese Dateien sind bereits in `.gitignore`!

---

## 🚀 Was kommt als Nächstes?

**Aktuell verfügbar:**

- ✅ Automatische Metadaten-Extraktion
- ✅ Bild-Upload zu Cloudflare R2
- ✅ Markdown-Konvertierung
- ✅ GitHub Publishing
- ✅ CSS-Cleanup

**Geplant:**

- 📋 Automatische WebP-Konvertierung
- 📋 Erweiterte Galerie-Features
- 📋 Web-Interface im Admin-Panel

---

**Bei Fragen:** Konsultieren Sie [GOOGLE_DOCS_SETUP.md](./GOOGLE_DOCS_SETUP.md) oder [GOOGLE_DOCS_QUICKSTART.md](./GOOGLE_DOCS_QUICKSTART.md)
