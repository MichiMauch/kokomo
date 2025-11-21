# Google Docs Integration - Quick Start

Diese Anleitung hilft Ihnen, schnell mit dem Google Docs → Kokomo Blog Workflow zu starten.

## ⚡ In 5 Minuten loslegen

### Schritt 1: Google Cloud Setup (einmalig)

Folgen Sie der detaillierten Anleitung in **[GOOGLE_DOCS_SETUP.md](./GOOGLE_DOCS_SETUP.md)** um:

1. ✅ Google Cloud Projekt erstellen
2. ✅ Drive & Docs APIs aktivieren
3. ✅ Service Account erstellen
4. ✅ Service Account Key herunterladen
5. ✅ Google Drive Ordner erstellen und teilen
6. ✅ Environment Variables setzen

**Wichtig:** Dieser Schritt muss nur **einmal** durchgeführt werden!

### Schritt 2: Ersten Blogpost in Google Docs schreiben

1. **Erstellen Sie ein Google Doc** in Ihrem "Kokomo Blog Posts" Ordner

2. **Schreiben Sie einfach normal** - KEIN MDX/YAML nötig! ✨

```
Unser erstes Jahr im Tiny House

Nach einem aufregenden Jahr voller Herausforderungen und schöner Momente möchten wir unsere Erfahrungen teilen.

Die ersten Monate

Die Umstellung von 80qm auf 25qm war anfangs gewöhnungsbedürftig, aber nach ein paar Wochen haben wir uns eingelebt.

[Fügen Sie hier Bilder ein - einfach Copy-Paste!]

Was uns überrascht hat

Die größte Überraschung war, wie wenig Platz man tatsächlich braucht...
```

3. **Optional: Tags setzen** (via Google Drive Properties)
   - Rechtsklick auf Google Doc im Drive
   - "Details anzeigen" → "Eigenschaften"
   - Property hinzufügen: `tags` = "tiny house, nachhaltigkeit, erfahrungen"

**Das Script extrahiert automatisch:**

- ✅ **Titel** = Erste Überschrift ("Unser erstes Jahr im Tiny House")
- ✅ **Summary** = Erster Absatz ("Nach einem aufregenden Jahr...")
- ✅ **Datum** = Heute (automatisch)
- ✅ **Autor** = "Sibylle & Michi" (automatisch)
- ✅ **Tags** = Aus Properties (oder "tiny house, blog" als Default)

4. **Speichern** (Google Docs speichert automatisch)

### Schritt 3: Blogpost veröffentlichen

Öffnen Sie Ihr Terminal im Projekt-Ordner und führen Sie aus:

```bash
npm run publish:doc "Mein erster Blogpost"
```

Das Script wird:

- ✅ Ihr Google Doc finden
- ✅ Frontmatter extrahieren und validieren
- ✅ Content zu Markdown konvertieren
- ✅ MDX-Datei generieren
- ✅ Zu GitHub pushen
- ✅ Vercel Deployment starten

**Fertig!** Nach 5-10 Minuten ist Ihr Blogpost live auf kokomo.house 🎉

## 📝 Täglicher Workflow

### Neuen Blogpost schreiben

1. Google Docs öffnen
2. Neues Dokument im "Kokomo Blog Posts" Ordner erstellen
3. Frontmatter einfügen (siehe Template unten)
4. Content schreiben
5. Bilder einfügen (Copy-Paste)
6. Speichern

### Veröffentlichen

```bash
# Spezifischer Post
npm run publish:doc "Titel des Posts"

# Alle neuen Posts
npm run publish:all-docs

# Vorschau (ohne zu publizieren)
npm run preview:docs
```

## 📋 Content-Struktur

**Einfache Struktur - kein kompliziertes Format nötig!**

```
[Hauptüberschrift - wird zum Titel]

[Erster Absatz - wird zur Summary]

[Unterüberschrift]

[Ihr Content mit Bildern und Formatierung...]
```

**Automatisch extrahiert:**

- **Titel**: Ihre erste große Überschrift
- **Summary**: Ihr erster normaler Absatz (max. 200 Zeichen)
- **Datum**: Automatisch auf heute gesetzt
- **Autor**: Automatisch "Sibylle & Michi"
- **Tags**: Aus Google Doc Properties (oder Default "tiny house, blog")

**Tags setzen (optional):**

1. Google Drive öffnen
2. Rechtsklick auf Ihr Dokument → "Details anzeigen"
3. Unter "Eigenschaften" → "Eigenschaft hinzufügen"
4. Name: `tags`, Wert: `tiny house, nachhaltigkeit, erfahrungen`

## 🎨 Formatierung

Google Docs Features werden automatisch konvertiert:

| Google Docs   | Markdown                         |
| ------------- | -------------------------------- |
| **Fett**      | `**Fett**`                       |
| _Kursiv_      | `*Kursiv*`                       |
| Überschrift 1 | `# Überschrift`                  |
| Überschrift 2 | `## Überschrift`                 |
| Link          | `[Text](URL)`                    |
| Aufzählung    | `- Item`                         |
| Nummerierung  | `1. Item`                        |
| Bild          | `![alt]({IMAGE_PATH}/bild.webp)` |
| Tabelle       | Markdown Table                   |

## 🖼️ Bilder

### Einfügen

- Copy-Paste direkt ins Google Doc
- Oder: Einfügen → Bild → Upload/URL

### Was passiert automatisch?

- ✅ Bilder werden aus Google Doc extrahiert
- ✅ Zu Cloudflare R2 hochgeladen
- ✅ Zu WebP konvertiert
- ✅ Im Markdown verlinkt mit `{IMAGE_PATH}/filename.webp`
- ✅ Aufeinanderfolgende Bilder werden zu Galerien gruppiert

### Galerie erstellen

Fügen Sie einfach mehrere Bilder nacheinander ein - das Script gruppiert sie automatisch!

## ⚙️ Verfügbare Kommandos

```bash
# Einzelnen Post veröffentlichen (sucht nach Titel)
npm run publish:doc "Teil des Titels"

# Alle Posts veröffentlichen
npm run publish:all-docs

# Vorschau aller Docs (Dry-Run, publiziert nicht)
npm run preview:docs
```

## 🔍 Troubleshooting

### "Kein Frontmatter gefunden"

→ Stellen Sie sicher, dass Sie `---` am Anfang und Ende des Frontmatter haben

### "Fehlende Frontmatter-Felder"

→ Alle erforderlichen Felder (`title`, `date`, `tags`, `summary`, `authors`) müssen vorhanden sein

### "Unable to authenticate"

→ Prüfen Sie Ihre `.env.local` Environment Variables (siehe [GOOGLE_DOCS_SETUP.md](./GOOGLE_DOCS_SETUP.md))

### "Folder not found"

→ Stellen Sie sicher, dass der Google Drive Ordner mit dem Service Account geteilt wurde

### "Kein Google Doc mit Titel '...' gefunden"

→ Der Suchbegriff muss im Dokument-Titel vorkommen (case-insensitive)

## 💡 Tipps & Tricks

### Template-Dokument erstellen

Erstellen Sie ein Dokument "📝 Template - Neuer Blogpost" mit vorbereitetem Frontmatter. Duplizieren Sie es für jeden neuen Post.

### Kollaboration

Teilen Sie Ihr Google Doc mit anderen - mehrere Personen können gleichzeitig schreiben!

### Mobile Blogging

Nutzen Sie die Google Docs App auf Smartphone/Tablet zum Schreiben unterwegs.

### Offline arbeiten

Google Docs hat einen Offline-Modus - aktivieren Sie ihn in den Drive-Einstellungen.

### Draft-Modus

Setzen Sie `draft: "true"` im Frontmatter, um an einem Post zu arbeiten, ohne ihn zu veröffentlichen.

### Versionierung

Google Docs speichert automatisch alle Versionen. Zugriff via: Datei → Versionsverlauf

## 📊 Workflow-Beispiel

```
Tag 1 (Montag):
- Idee: "10 Tipps für Tiny House Anfänger"
- Google Doc erstellen
- Frontmatter einfügen (draft: "true")
- Erste Notizen schreiben
- Mit Partner teilen für Feedback

Tag 2 (Dienstag):
- Content ausarbeiten
- Bilder hinzufügen
- Partner reviewt und kommentiert

Tag 3 (Mittwoch):
- Kommentare einarbeiten
- Finalen Check
- draft: "false" setzen
- Terminal: npm run publish:doc "10 Tipps"
- 10 Minuten warten → Live! 🚀
```

## 🔐 Sicherheit

**Niemals committen:**

- ❌ `.env.local`
- ❌ Service Account JSON-Datei
- ❌ Private Keys

Diese Dateien sind bereits in `.gitignore` und sollten dort bleiben!

## 🚀 Nächste Schritte

**Phase 1 (Jetzt verfügbar):**

- ✅ Text-Content aus Google Docs
- ✅ Frontmatter-Extraktion
- ✅ Markdown-Konvertierung
- ✅ GitHub Publishing
- ⏳ Basis-Bild-Support (in Entwicklung)

**Phase 2 (Geplant):**

- 📋 Automatische WebP-Konvertierung
- 📋 Erweiterte Galerie-Features
- 📋 Batch-Import bestehender Posts

**Phase 3 (Optional):**

- 📋 Web-Interface im Admin-Panel
- 📋 One-Click Publishing aus dem Browser
- 📋 Publish-Button direkt in Google Docs

## 📚 Weitere Ressourcen

- **[GOOGLE_DOCS_SETUP.md](./GOOGLE_DOCS_SETUP.md)** - Detaillierte Setup-Anleitung
- **[Google Docs API Docs](https://developers.google.com/docs/api)** - Offizielle API-Dokumentation
- **[Google Drive API Docs](https://developers.google.com/drive/api)** - Drive API-Referenz

## 🆘 Hilfe benötigt?

1. Prüfen Sie die Fehlermeldung im Terminal (oft sehr aussagekräftig)
2. Konsultieren Sie [GOOGLE_DOCS_SETUP.md](./GOOGLE_DOCS_SETUP.md) für Setup-Probleme
3. Testen Sie mit `npm run preview:docs` (zeigt was publiziert würde ohne zu publizieren)
4. Prüfen Sie `.env.local` auf korrekte Environment Variables

---

**Viel Erfolg mit Ihrem neuen Google Docs Workflow! 🎉**

Bei Fragen oder Problemen, konsultieren Sie die ausführliche [GOOGLE_DOCS_SETUP.md](./GOOGLE_DOCS_SETUP.md) Dokumentation.
