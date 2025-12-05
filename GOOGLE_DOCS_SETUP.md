# Google Docs Integration Setup

Diese Anleitung führt Sie durch die Einrichtung der Google Docs Integration für Ihren Kokomo Blog.

## Übersicht

Das System ermöglicht es Ihnen, Blogposts in Google Docs zu schreiben und sie automatisch in MDX-Dateien zu konvertieren, die dann auf Ihrer Website veröffentlicht werden.

## Voraussetzungen

- Google Account mit Zugriff auf Google Drive
- Node.js und npm installiert
- Zugriff auf das Kokomo Repository

## Schritt 1: Google Cloud Projekt erstellen

1. Gehen Sie zur [Google Cloud Console](https://console.cloud.google.com/)
2. Klicken Sie auf "Projekt erstellen" (oder wählen Sie ein bestehendes Projekt)
3. Geben Sie dem Projekt einen Namen (z.B. "Kokomo Blog Sync")
4. Klicken Sie auf "Erstellen"

## Schritt 2: APIs aktivieren

1. Navigieren Sie zu "APIs & Dienste" > "Bibliothek"
2. Suchen Sie nach "Google Drive API" und klicken Sie darauf
3. Klicken Sie auf "Aktivieren"
4. Wiederholen Sie den Vorgang für "Google Docs API"

## Schritt 3: Service Account erstellen

1. Navigieren Sie zu "APIs & Dienste" > "Anmeldedaten"
2. Klicken Sie auf "Anmeldedaten erstellen" > "Dienstkonto"
3. Geben Sie einen Namen ein (z.B. "Kokomo Blog Sync Service")
4. Beschreibung (optional): "Service Account für Blog-Synchronisation"
5. Klicken Sie auf "Erstellen und fortfahren"
6. Bei "Diesem Dienstkonto Zugriff auf das Projekt gewähren":
   - Wählen Sie "Leser" (oder keine Rolle, da wir nur Drive-Zugriff brauchen)
7. Klicken Sie auf "Fertig"

## Schritt 4: Service Account Key erstellen

1. Klicken Sie auf das gerade erstellte Service Account
2. Navigieren Sie zum Tab "Schlüssel"
3. Klicken Sie auf "Schlüssel hinzufügen" > "Neuen Schlüssel erstellen"
4. Wählen Sie "JSON" als Typ
5. Klicken Sie auf "Erstellen"
6. Die JSON-Datei wird automatisch heruntergeladen - **BEWAHREN SIE DIESE SICHER AUF!**

Die heruntergeladene JSON-Datei sieht ungefähr so aus:

```json
{
  "type": "service_account",
  "project_id": "kokomo-blog-sync-...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "kokomo-blog-sync@kokomo-blog-sync-....iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

## Schritt 5: Google Drive Ordner erstellen

1. Gehen Sie zu [Google Drive](https://drive.google.com/)
2. Erstellen Sie einen neuen Ordner (z.B. "Kokomo Blog Posts")
3. **Wichtig:** Teilen Sie diesen Ordner mit dem Service Account:
   - Rechtsklick auf den Ordner > "Freigeben"
   - Geben Sie die Service Account Email ein (z.B. `kokomo-blog-sync@....iam.gserviceaccount.com`)
   - Berechtigungen: **"Betrachter"** ist ausreichend
   - Klicken Sie auf "Senden"
4. Notieren Sie sich die **Ordner-ID** aus der URL:
   - URL: `https://drive.google.com/drive/folders/1abc...xyz`
   - Ordner-ID: `1abc...xyz` (der Teil nach `/folders/`)

## Schritt 6: Environment Variables konfigurieren

Öffnen Sie Ihre `.env.local` Datei und fügen Sie folgende Zeilen hinzu:

```bash
# Google Docs Integration
GOOGLE_DOCS_SERVICE_ACCOUNT_EMAIL=ihr-service@projekt.iam.gserviceaccount.com
GOOGLE_DOCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nIhr\nPrivate\nKey\nHier\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=1abc...xyz
```

**Wichtig:**

- `GOOGLE_DOCS_SERVICE_ACCOUNT_EMAIL`: Die `client_email` aus der JSON-Datei
- `GOOGLE_DOCS_PRIVATE_KEY`: Der komplette `private_key` aus der JSON-Datei (inkl. `-----BEGIN...` und `...END PRIVATE KEY-----`)
- `GOOGLE_DRIVE_FOLDER_ID`: Die Ordner-ID aus Schritt 5

**Tipp:** Der Private Key muss in Anführungszeichen stehen, da er Newlines (`\n`) enthält.

## Schritt 7: Google Docs Custom Properties einrichten

Für jeden Blogpost müssen Sie Custom Properties im Google Doc setzen. So geht's:

### Template-Dokument erstellen

1. Erstellen Sie ein neues Google Doc in Ihrem "Kokomo Blog Posts" Ordner
2. Nennen Sie es z.B. "📝 Template - Neuer Blogpost"
3. Fügen Sie folgenden Inhalt ein:

```
[Titel Ihres Blogposts]

[Ihr Content hier...]
```

### Custom Properties setzen

Custom Properties werden **nicht direkt in Google Docs** gesetzt, sondern über **Google Drive**:

**Option A: Via Google Drive UI (Einfachste Methode)**

1. Öffnen Sie Google Drive
2. Rechtsklick auf Ihr Google Doc
3. Wählen Sie "Details anzeigen" (rechte Sidebar öffnet sich)
4. Scrollen Sie zu "Eigenschaften"
5. Klicken Sie auf "Eigenschaft hinzufügen"

**Hinweis:** Diese Funktion ist möglicherweise nur in Google Workspace (ehemals G Suite) verfügbar, nicht im kostenlosen Google Account.

**Option B: Via Apps Script (Empfohlen für Consumer Accounts)**

Da Custom Properties über die normale UI möglicherweise nicht verfügbar sind, nutzen wir ein **spezielles Format im Google Doc** selbst:

### Empfohlenes Format: Frontmatter im Google Doc

Fügen Sie am **Anfang Ihres Google Docs** folgende Struktur ein:

```yaml
---
title: '100 Tage im Tiny House - 6 Fragen'
date: '2024-01-15'
tags: 'tiny house, erfahrungen, nachhaltigkeit, selbstversorgung'
summary: 'Unsere Erfahrungen nach 100 Tagen im Tiny House - Von Heizung bis Wasserversorgung'
draft: 'false'
authors: 'default'
layout: 'PostLayout'
---
```

**Wichtig:**

- Die `---` Linien müssen **exakt so** sein (3 Bindestriche)
- Format: `key: "value"` (mit Anführungszeichen für Werte)
- Alle Felder sind **erforderlich** außer `layout` (optional)
- Tags sind **kommagetrennt**
- Datum im Format `YYYY-MM-DD`

**Nach dem Frontmatter** (nach der zweiten `---` Linie) schreiben Sie Ihren normalen Content.

### Beispiel-Dokument:

```yaml
---
title: "Unsere erste Woche im Tiny House"
date: "2024-11-20"
tags: "tiny house, erfahrungsbericht, umzug"
summary: "Wie es sich anfühlt, nach Jahren in einer Wohnung plötzlich auf 25qm zu leben"
draft: "false"
authors: "default"
---

# Unsere erste Woche im Tiny House

Es ist vollbracht! Nach Monaten der Planung sind wir endlich in unser Tiny House eingezogen.

## Die größten Herausforderungen

Die Umstellung von 80qm auf 25qm war anfangs gewöhnungsbedürftig...

![]() <- Hier können Sie Bilder einfügen (einfach Copy-Paste)

## Was uns überrascht hat

...
```

## Schritt 8: Vercel Environment Variables setzen

Damit das Sync-Script auch in Vercel Functions laufen kann (falls Sie das später wollen), fügen Sie die gleichen Environment Variables auch in Vercel hinzu:

1. Gehen Sie zu [Vercel Dashboard](https://vercel.com/)
2. Wählen Sie Ihr Kokomo Projekt
3. Navigieren Sie zu "Settings" > "Environment Variables"
4. Fügen Sie hinzu:
   - `GOOGLE_DOCS_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_DOCS_PRIVATE_KEY`
   - `GOOGLE_DRIVE_FOLDER_ID`
5. Wichtig: Setzen Sie diese für alle Environments (Production, Preview, Development)

## Schritt 9: Test durchführen

Testen Sie die Einrichtung mit:

```bash
npm run preview:docs
```

Dieser Befehl sollte alle Google Docs in Ihrem Ordner auflisten und zeigen, welche publiziert würden (ohne tatsächlich zu publizieren).

## Nutzung

### Einen neuen Blogpost schreiben

1. Erstellen Sie ein neues Google Doc in Ihrem "Kokomo Blog Posts" Ordner
2. Fügen Sie das Frontmatter am Anfang des Dokuments ein (siehe oben)
3. Schreiben Sie Ihren Content
4. Fügen Sie Bilder direkt ein (Copy-Paste oder Upload)
5. Speichern (wird automatisch gespeichert)

### Blogpost veröffentlichen

```bash
# Spezifisches Dokument nach Titel
npm run publish:doc "Unsere erste Woche im Tiny House"

# Alle neuen/geänderten Dokumente
npm run publish:all-docs

# Vorschau (Dry-Run, publiziert nicht)
npm run preview:docs
```

## Troubleshooting

### Fehler: "Unable to authenticate"

- Prüfen Sie, ob `GOOGLE_DOCS_SERVICE_ACCOUNT_EMAIL` und `GOOGLE_DOCS_PRIVATE_KEY` korrekt gesetzt sind
- Stellen Sie sicher, dass der Private Key die kompletten `-----BEGIN/END PRIVATE KEY-----` Zeilen enthält
- Prüfen Sie, ob Newlines (`\n`) im Key erhalten geblieben sind

### Fehler: "Folder not found"

- Prüfen Sie die `GOOGLE_DRIVE_FOLDER_ID`
- Stellen Sie sicher, dass der Ordner mit dem Service Account geteilt wurde
- Die Service Account Email sollte in der Freigabe-Liste des Ordners erscheinen

### Fehler: "Access denied"

- Google Drive API und Google Docs API müssen aktiviert sein
- Service Account benötigt "Betrachter"-Rechte auf dem Ordner

### Bilder werden nicht hochgeladen

- Stellen Sie sicher, dass Cloudflare R2 Credentials korrekt sind
- Prüfen Sie `CLOUDFLARE_R2_*` Environment Variables

## Sicherheit

**WICHTIG:**

- **NIEMALS** die Service Account JSON-Datei in Git committen
- `.env.local` ist bereits in `.gitignore` und sollte dort bleiben
- Der Private Key sollte nur lokal und in Vercel Environment Variables gespeichert werden
- Teilen Sie den Private Key niemals öffentlich

## Weitere Hilfe

Bei Problemen oder Fragen:

1. Prüfen Sie die Console-Ausgabe des Sync-Scripts (Fehlermeldungen sind in der Regel sehr spezifisch)
2. Testen Sie die API-Verbindung mit `npm run preview:docs`
3. Prüfen Sie die Google Cloud Console > "APIs & Dienste" > "Dashboard" für API-Nutzungsstatistiken

## Nächste Schritte

Sobald alles funktioniert, können Sie:

- Mehrere Blogposts gleichzeitig schreiben (in Google Docs)
- Mit anderen kollaborieren (Google Docs Sharing)
- Mobile schreiben (Google Docs App)
- Offline arbeiten (Google Docs Offline Mode)
- Einfach mit `npm run publish:doc "Titel"` veröffentlichen

Viel Erfolg mit Ihrem neuen Workflow! 🚀
