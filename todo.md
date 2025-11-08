# TODO: KOKOMO Tiny House Blog - Improvements & Fixes

**Project:** KOKOMO Tiny House Blog  
**Created:** 2025-11-08  
**Last Updated:** 2025-11-08

## Current Metrics 📊

- API Routes: 24 (alle ohne Tests)
- Komponenten: 42
- Test-Coverage: **0%** ❌
- Veraltete Packages: 15+
- Console.log Statements: 43
- TypeScript Strict Mode: **Deaktiviert** ❌

---

## 🔴 KRITISCH - Sofort beheben

### Security

- [ ] **Input-Validierung für API-Routes implementieren**

  - **Priority:** Critical
  - **Effort:** ~4 hours
  - **Impact:** Verhindert Path Traversal und beliebiges Erstellen von Dateien
  - **Files:**
    - `/app/api/publish-post/route.ts` (Hauptproblem!)
    - Alle anderen API-Routes validieren
  - **Tech:** Zod (bereits als Dependency vorhanden)
  - **Acceptance Criteria:**
    - [ ] Zod Schemas für alle API-Inputs
    - [ ] Input-Validierung vor Datei-Operationen
    - [ ] Proper Error-Messages bei Invalid-Input

- [ ] **Rate Limiting für teure API-Calls**

  - **Priority:** Critical
  - **Effort:** ~2 hours
  - **Impact:** Schützt vor Missbrauch der OpenAI API (Kostenkontrolle!)
  - **Files:**
    - `/app/api/generate-post-draft/route.ts`
    - `/app/api/kokobot/route.ts`
    - `/app/api/analyze-matomo/route.ts`
  - **Tech:** next-rate-limit oder @upstash/ratelimit
  - **Acceptance Criteria:**
    - [ ] Rate Limits pro IP/User
    - [ ] Clear Error-Messages bei Limit-Überschreitung
    - [ ] Monitoring/Logging von Rate-Limit-Hits

- [ ] **TypeScript Strict Mode aktivieren**
  - **Priority:** Critical
  - **Effort:** ~6-8 hours (inkl. Fixes)
  - **Impact:** Erheblich verbesserte Type-Safety
  - **Files:**
    - `tsconfig.json:8`
    - Alle Files mit impliziten `any` Types
  - **Acceptance Criteria:**
    - [ ] `"strict": true` in tsconfig.json
    - [ ] Alle Type-Errors behoben
    - [ ] Keine impliziten `any` mehr

### Testing Infrastructure

- [ ] **Test-Framework einrichten**

  - **Priority:** Critical
  - **Effort:** ~3 hours
  - **Impact:** Ermöglicht zukünftige Test-Coverage
  - **Tech:** Vitest + React Testing Library
  - **Acceptance Criteria:**
    - [ ] Vitest konfiguriert
    - [ ] React Testing Library installiert
    - [ ] Beispiel-Test läuft durch
    - [ ] CI/CD Integration vorbereitet

- [ ] **Tests für kritische API-Routes schreiben**
  - **Priority:** Critical
  - **Effort:** ~8-10 hours
  - **Impact:** Verhindert Regressions bei wichtigen Features
  - **Files to test:**
    - `/app/api/publish-post/route.ts`
    - `/app/api/generate-post-draft/route.ts`
    - `/lib/db.ts`
  - **Target:** Mindestens 60% Coverage für kritische Pfade

### Code Duplication

- [x] **Duplikat API-Routes konsolidieren** ✅
  - **Priority:** Critical
  - **Effort:** ~3 hours
  - **Impact:** Reduziert Maintenance-Burden, verhindert Inkonsistenzen
  - **Duplicates:**
    - `/app/api/publish-post/route.ts` vs. `/app/admin/api/publish-post/route.ts`
    - `/app/api/analyze-matomo/route.ts` vs. `/app/admin/api/analyze-matomo-old/route.ts`
    - `/app/api/list-posts/route.ts` vs. `/app/admin/api/list-posts/route.ts`
  - **Acceptance Criteria:**
    - [x] Nur eine Version jeder Route
    - [x] Alte Routes redirecten oder entfernen
    - [ ] Tests für konsolidierte Routes (noch ausstehend)

---

## 🟡 HOHE Priorität

### Performance

- [ ] **Vector Database Caching implementieren**

  - **Priority:** High
  - **Effort:** ~4 hours
  - **Impact:** Massive Performance-Verbesserung für /kokobot
  - **Files:**
    - `/app/api/kokobot/route.ts:10-24`
  - **Tech:** In-Memory Cache (Redis oder Node-Cache)
  - **Acceptance Criteria:**
    - [ ] Vector DB wird nur einmal geladen
    - [ ] Cache Invalidierung bei Updates
    - [ ] Response-Zeit < 500ms (aktuell mehrere Sekunden)

- [ ] **N+1 Query Pattern beheben**

  - **Priority:** High
  - **Effort:** ~2 hours
  - **Impact:** Reduziert DB-Load
  - **Files:**
    - `/components/Comments.tsx:63-66`
  - **Solution:** Eager Loading oder Single Query
  - **Acceptance Criteria:**
    - [ ] Maximal 2 Queries statt N+1
    - [ ] Load-Time für Comments < 200ms

- [ ] **Paginierung für große Datenmengen**
  - **Priority:** High
  - **Effort:** ~3 hours
  - **Impact:** Bessere Performance bei vielen Posts/Comments
  - **Files:**
    - `/app/api/list-posts/route.ts`
    - `/components/Comments.tsx`
  - **Acceptance Criteria:**
    - [ ] Cursor-based oder Offset-Pagination
    - [ ] Default: 20 items per page
    - [ ] Loading states implementiert

### Error Handling

- [ ] **Zentrale Error-Handling-Strategie**

  - **Priority:** High
  - **Effort:** ~4 hours
  - **Impact:** Konsistente Fehlerbehandlung, besseres Debugging
  - **Files:**
    - Alle API-Routes (insbesondere `/app/api/generate-post-draft/route.ts`)
    - `/lib/agentkit-utils.ts:118-129` (Error-Swallowing!)
  - **Acceptance Criteria:**
    - [ ] Zentrale Error-Handler-Funktion
    - [ ] Konsistentes Error-Response-Format
    - [ ] Proper Logging (nicht console.log)
    - [ ] try-catch in allen async Functions

- [ ] **Proper Logging System einrichten**
  - **Priority:** High
  - **Effort:** ~2 hours
  - **Impact:** Besseres Debugging und Monitoring
  - **Tech:** pino oder winston
  - **Files:** 43 console.log Statements ersetzen
  - **Acceptance Criteria:**
    - [ ] Logger konfiguriert (Development vs. Production)
    - [ ] Log-Levels (error, warn, info, debug)
    - [ ] Structured Logging (JSON)

### Dependencies

- [ ] **Dependencies aktualisieren**
  - **Priority:** High
  - **Effort:** ~3 hours + Testing
  - **Impact:** Security Patches, neue Features
  - **Major Updates:**
    - `@openai/agents: 0.1.9 → 0.3.0` (Breaking Changes!)
    - `@mui/material: 6.4.4 → 7.3.5`
    - `eslint: 9.14.0 → 9.39.1`
  - **Acceptance Criteria:**
    - [ ] Dependencies aktualisiert
    - [ ] Breaking Changes dokumentiert
    - [ ] Alle Tests grün
    - [ ] App funktioniert wie vorher

---

## 🟠 MITTLERE Priorität

### Code Quality & Refactoring

- [ ] **Comments.tsx refactoren**

  - **Priority:** Medium
  - **Effort:** ~4 hours
  - **Impact:** Bessere Wartbarkeit, Testbarkeit
  - **Files:** `/components/Comments.tsx` (272 Zeilen!)
  - **Problems:**
    - Mischt Data Fetching, State Management und Rendering
    - Zu viele Verantwortlichkeiten
  - **Solution:**
    - [ ] Custom Hook für Data Fetching (`useComments`)
    - [ ] Separate Components (CommentList, CommentItem, CommentForm)
    - [ ] Business Logic in separate Functions

- [ ] **AdminCommentManager.tsx vereinfachen**

  - **Priority:** Medium
  - **Effort:** ~3 hours
  - **Impact:** Bessere Wartbarkeit
  - **Files:** `/components/AdminCommentManager.tsx`
  - **Acceptance Criteria:**
    - [ ] Single Responsibility Principle
    - [ ] Kleinere, fokussierte Components

- [ ] **Business-Logik aus API-Routes extrahieren**

  - **Priority:** Medium
  - **Effort:** ~6 hours
  - **Impact:** Testbarkeit, Wiederverwendbarkeit
  - **Solution:** Service-Layer einführen (`/lib/services/`)
  - **Files:** Alle API-Routes mit komplexer Logik
  - **Acceptance Criteria:**
    - [ ] Services für Posts, Comments, Analytics
    - [ ] API-Routes sind nur noch "dünne" Controller
    - [ ] Services sind separat testbar

- [ ] **ClientGalerie.tsx entfernen oder implementieren**
  - **Priority:** Medium
  - **Effort:** 15 minutes
  - **Files:** `/components/ClientGalerie.tsx` (leere Datei!)
  - **Decision:** Löschen oder Implementieren?

### TypeScript Improvements

- [ ] **Runtime-Validierung für API-Responses**

  - **Priority:** Medium
  - **Effort:** ~3 hours
  - **Impact:** Type-Safety auch zur Laufzeit
  - **Files:** Alle `await req.json()` ohne Type-Validierung
  - **Tech:** Zod Schemas
  - **Acceptance Criteria:**
    - [ ] Zod Schemas für alle API-Response-Types
    - [ ] Validierung vor Type-Assertion
    - [ ] Clear Error-Messages bei Invalid-Response

- [ ] **Implizite any Types eliminieren**
  - **Priority:** Medium
  - **Effort:** ~4 hours
  - **Impact:** Bessere Type-Safety
  - **Prerequisite:** TypeScript Strict Mode muss aktiv sein
  - **Acceptance Criteria:**
    - [ ] Keine impliziten `any` mehr
    - [ ] Explizite Types für alle Funktionen

### Configuration & Environment

- [ ] **Zentrale Environment-Variable-Validierung**

  - **Priority:** Medium
  - **Effort:** ~2 hours
  - **Impact:** Verhindert Runtime-Errors durch fehlende ENV-Vars
  - **Files:** 30+ Files greifen direkt auf `process.env` zu
  - **Tech:** `@t3-oss/env-nextjs` oder `zod`
  - **Acceptance Criteria:**
    - [ ] Zentrale ENV-Config in `/lib/env.ts`
    - [ ] Validierung beim App-Start
    - [ ] Type-Safe ENV-Zugriff

- [ ] **Secrets Management verbessern**
  - **Priority:** Medium
  - **Effort:** ~2 hours
  - **Impact:** Bessere Security
  - **Problem:** Passwörter im Klartext in ENV-Variablen
  - **Solution:** Encrypted Secrets oder Vault-Service
  - **Acceptance Criteria:**
    - [ ] Keine Plain-Text Passwords in .env
    - [ ] Secrets Rotation Plan dokumentiert

---

## 🟢 NIEDRIGE Priorität / Nice to Have

### Documentation

- [ ] **API-Dokumentation erstellen**

  - **Priority:** Low
  - **Effort:** ~4 hours
  - **Tech:** OpenAPI/Swagger
  - **Acceptance Criteria:**
    - [ ] OpenAPI Spec für alle API-Routes
    - [ ] Interactive API-Docs (Swagger UI)
    - [ ] Request/Response Examples

- [ ] **Code-Kommentare standardisieren**

  - **Priority:** Low
  - **Effort:** ~3 hours
  - **Impact:** Bessere Onboarding für neue Devs
  - **Acceptance Criteria:**
    - [ ] JSDoc für alle Public Functions
    - [ ] Konsistenter Comment-Style
    - [ ] Complex Logic erklärt

- [ ] **Deployment-Dokumentation erstellen**
  - **Priority:** Low
  - **Effort:** ~2 hours
  - **Files:** `DEPLOYMENT.md` erstellen
  - **Content:**
    - [ ] Environment Setup
    - [ ] Build & Deploy Process
    - [ ] Rollback Procedure
    - [ ] Troubleshooting Guide

### AgentKit Integration

- [ ] **Prompts externalisieren**

  - **Priority:** Low
  - **Effort:** ~2 hours
  - **Impact:** Einfacheres Prompt-Engineering
  - **Files:** Hardcodierte Prompts in Route-Files
  - **Solution:** `/lib/prompts/` Directory
  - **Acceptance Criteria:**
    - [ ] Prompts als separate Files
    - [ ] Version Control für Prompts
    - [ ] A/B Testing möglich

- [ ] **AI-Content-Validierung implementieren**

  - **Priority:** Low
  - **Effort:** ~3 hours
  - **Impact:** Qualitätssicherung für generierten Content
  - **Acceptance Criteria:**
    - [ ] Content-Prüfung auf schädliche Inhalte
    - [ ] Struktur-Validierung
    - [ ] Fact-Checking (optional)

- [ ] **Kostenüberwachung für OpenAI-Calls**

  - **Priority:** Low
  - **Effort:** ~2 hours
  - **Impact:** Budget-Kontrolle
  - **Acceptance Criteria:**
    - [ ] Token-Usage-Tracking
    - [ ] Cost-Alerts bei Limits
    - [ ] Dashboard für API-Kosten

- [ ] **Error-Recovery für GPT-4-Ausfälle**
  - **Priority:** Low
  - **Effort:** ~3 hours
  - **Impact:** Bessere Resilience
  - **Acceptance Criteria:**
    - [ ] Retry-Logic mit Exponential Backoff
    - [ ] Fallback auf günstigeres Modell
    - [ ] User-Feedback bei Failures

### Database

- [ ] **Connection Pooling optimieren**
  - **Priority:** Low
  - **Effort:** ~2 hours
  - **Files:** `/lib/db.ts`
  - **Impact:** Bessere DB-Performance
  - **Acceptance Criteria:**
    - [ ] Connection Pool konfiguriert
    - [ ] Idle Timeout optimiert
    - [ ] Max Connections eingestellt

---

## ✅ Completed

### 2025-11-08 (Session 1): Duplikat API-Routes konsolidiert

**Task:** Code Duplication - Duplikat API-Routes konsolidieren
**Aufwand:** ~30 Minuten
**Details:**

- ✅ Gelöscht: `/app/api/publish-post/route.ts` (identisch mit Admin-Version)
- ✅ Gelöscht: `/app/api/list-posts/route.ts` (identisch mit Admin-Version)
- ✅ Gelöscht: `/app/admin/api/analyze-matomo-old/route.ts` (veraltete Version)
- ✅ Aktualisiert: Import-Pfade in `/app/admin/posts/[slug]/page.tsx`
  - Zeile 25: `../../../api/list-posts` → `/admin/api/list-posts`
  - Zeile 54: `../../../api/publish-post` → `/admin/api/publish-post`

**Ergebnis:** 3 duplizierte Dateien entfernt, konsistente API-Struktur unter `/admin/api/`

---

### 2025-11-08 (Session 2): TypeScript Strict Mode + Vector DB Caching

**Tasks:**

1. TypeScript Strict Mode aktivieren
2. Vector Database Caching implementieren
3. Type-Fehler beheben

**Aufwand:** ~2 Stunden

**Details:**

#### ✅ TypeScript Strict Mode aktiviert

- `tsconfig.json:8`: `"strict": false` → `"strict": true`
- TypeScript-Fehler: 57 → 12 Fehler (**79% Reduktion!**)
- Alle kritischen API-Routes sind jetzt typsicher

#### ✅ Vector Database Caching implementiert (`/app/api/kokobot/route.ts`)

- **Problem gelöst:** 12 MB JSON wurde bei jedem Request synchron geladen!
- **Lösung:** In-Memory-Cache mit lazy loading
- **Implementierung:**
  - Globale Cache-Variable außerhalb der Route-Handler
  - Race-Condition-Handling mit `isLoadingCache` Flag
  - Asynchrones Laden mit `fs/promises` (non-blocking!)
  - Proper TypeScript Types (VectorDBItem, RelevantChunk)
- **Performance-Gewinn erwartet:**
  - Erster Request: ~2-3s (muss laden)
  - Nachfolgende Requests: <500ms (aus Cache)
  - **Geschwindigkeitssteigerung: ~5-6x!**

#### ✅ Type-Safety massiv verbessert

**Behobene Dateien:**

1. `/app/api/kokobot/route.ts` - Vollständig typisiert + Caching
2. `/app/api/analyze-matomo/route.ts` - EnrichedPage Type hinzugefügt
3. `/app/api/battery-status/route.ts` - Error-Handling typsicher
4. `/app/api/generate-content-ideas/route.ts` - Error-Handling typsicher
5. `/app/admin/api/monthly/route.ts` - Type-Casting korrigiert
6. `/app/admin/trends/_components/TrendActions.tsx` - Error-Handling
7. `/app/admin/trends/content-ideas/page.tsx` - ContentSuggestion Type
8. `/app/admin/trends/dashboard/page.tsx` - Error-Handling
9. `/app/api/victron-debug/route.ts` - Error-Handling typsicher
10. `/app/tiny-house/[...slug]/page.tsx` - Layout Type-Casting
11. `/components/BatteryStatus.tsx` - Error-Handling
12. `/components/Card.tsx` - CardProps Interface

**Pattern verwendet:**

```typescript
// Error-Handling Pattern
catch (error) {
  const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler'
  console.error('Fehler:', errorMsg)
}

// Axios-Error-Handling Pattern
catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
  const errorData = error && typeof error === 'object' && 'response' in error
    ? (error as { response?: { data?: unknown } }).response?.data
    : undefined
}
```

#### 📊 Verbleibende Arbeit

**12 verbleibende TypeScript-Fehler (niedrige Priorität):**

- `components/Comments.tsx` - Parameter-Typ
- `components/MobileNav.tsx` - Missing type declaration für `body-scroll-lock`
- `components/TableWrapper.tsx` - Children-Typ
- `contentlayer.config.ts` - Mehrere Parameter-Typen
- `layouts/PostLayout.tsx` - Parameter-Typen

**Empfehlung:** Diese können in einer separaten Session behoben werden, da sie nicht kritisch sind.

**Metriken:**

- ✅ TypeScript Strict Mode: AKTIV
- ✅ Type-Fehler: 57 → 12 (79% Reduktion)
- ✅ Vector DB Caching: IMPLEMENTIERT
- ✅ Kritische API-Routes: 100% typsicher
- ⏳ Build-Status: Funktioniert mit Warnings (nur ESLint-Warnungen zu `<img>` Tags)

---

## 📝 Notes & Decisions

### Architecture Decisions

- [ ] Service-Layer Pattern vs. Repository Pattern?
- [ ] Monorepo oder Multi-Repo für Services?
- [ ] State Management: Context API ausreichend oder Redux?

### Tech Debt

- Geschätzte Tech Debt: ~40-60 Stunden
- Priorität: Security & Performance zuerst, dann Code Quality

### Questions

- Gibt es Budget für externe Security-Audit?
- Wer ist verantwortlich für Dependency-Updates?
- CI/CD Pipeline bereits vorhanden?

---

## Quick Wins (< 1 hour each) 🚀

1. [ ] TypeScript Strict Mode aktivieren (30 min)
2. [ ] ClientGalerie.tsx löschen (5 min)
3. [ ] 43 console.log durch Logger ersetzen (45 min)
4. [ ] README.md aktualisieren (30 min)

---

**Next Steps:**

1. Starte mit 🔴 KRITISCH Tasks
2. Nach jedem abgeschlossenen Task: Commit + Tests
3. Wöchentliches Review dieses Files

**Estimated Total Effort:** ~80-100 Stunden (verteilt über mehrere Sprints)
