# KOKOMO BLOG WORKFLOW SYSTEM

# Diese Datei wird nicht in Git committed (siehe .gitignore)

## AKTIVIERUNG

Wenn der User schreibt: "Blogpost-Strategie für: [Thema]"
Dann automatisch 3-Phasen-Workflow ausführen:

## PHASE 1: STRATEGISCHE PLANUNG (automatisch)

1. **🎯 ZIELSETZUNG**

   - Was soll der Post erreichen?
   - Welchen Mehrwert bietet er?
   - Wie passt er zur KOKOMO-Mission?

2. **👥 ZIELGRUPPEN-ANALYSE**

   - Primäre Zielgruppe definieren
   - Sekundäre Zielgruppen
   - Bedürfnisse und Pain Points

3. **🔍 SEO & KEYWORDS**

   - Haupt-Keywords identifizieren
   - Long-tail Keywords
   - Suchintention analysieren

4. **📊 CONTENT-POSITIONIERUNG**

   - Bezug zu bestehenden KOKOMO Posts
   - Unique Selling Point des Artikels
   - Content-Gap Analysis

5. **📝 DETAILLIERTE GLIEDERUNG**
   - Headline-Vorschläge
   - Hauptkapitel mit Unterpunkten
   - Call-to-Actions
   - Geschätzte Wortanzahl

## PHASE 2: REVIEW & APPROVAL (warten)

- Strategie präsentieren
- Feedback einholen
- Anpassungen vornehmen
- Freigabe abwarten ("OK", "Go", "Freigabe" etc.)

## PHASE 3: CONTENT-ERSTELLUNG (nach Freigabe)

1. **Vollständigen Blogpost schreiben**

   - Basierend auf genehmigter Strategie
   - KOKOMO-Stil und -Tonalität
   - MDX-Format ohne problematische Imports
   - Optimiert für Contentlayer

2. **GitHub-Deployment**
   - Direkt auf main branch pushen
   - Aussagekräftige Commit-Message
   - Bestätigung des erfolgreichen Deployments

## BLOG-KONTEXT: KOKOMO

- Tiny House Blog von Michael & Partner
- Fokus: Nachhaltiges Leben, Tiny House Erfahrungen, Schweiz
- Zielgruppe: Tiny House Interessierte, Nachhaltigkeits-Enthusiasten
- Stil: Persönlich, authentisch, praxisorientiert
- Bestehende Themen: Baurecht, Autarkie, Wasser/Strom, Lifestyle

## TECHNISCHE ANFORDERUNGEN

- MDX-Format
- Keine `import` Statements im MDX
- Keine `<MDXGallery>` Komponenten (vorerst)
- Korrekte Frontmatter-Metadaten
- SEO-optimierte Titel und Summary
- Schweiz-spezifische Inhalte bevorzugt

## AKTIVIERUNG IN NEUEM CHAT

User sagt: "Aktiviere Blog-Workflow" oder "Lies BLOG-WORKFLOW.md"
→ System ist scharf gestellt für "Blogpost-Strategie für: [Thema]"
