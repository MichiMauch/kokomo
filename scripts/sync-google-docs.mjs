#!/usr/bin/env node

/**
 * Google Docs → Kokomo Blog Sync Script
 *
 * Konvertiert Google Docs aus einem konfigurierten Drive-Ordner
 * in MDX-Dateien und publiziert sie via GitHub.
 */

import { google } from 'googleapis'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import * as cheerio from 'cheerio'
import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import https from 'https'
import http from 'http'

// Get project root first
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

// Load environment variables with absolute path
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') })

// Configuration
const CONFIG = {
  google: {
    serviceAccountEmail: process.env.GOOGLE_DOCS_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_DOCS_PRIVATE_KEY,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
  },
  github: {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_REPO_OWNER,
    repo: process.env.GITHUB_REPO_NAME,
    branch: process.env.GITHUB_BRANCH || 'main',
    path: process.env.GITHUB_PATH || 'data/tiny-house',
  },
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    bucket: process.env.CLOUDFLARE_BUCKET_2,
    publicUrl: process.env.NEXT_PUBLIC_CLOUDFLARE_R2_URL,
  },
}

// Validate configuration
function validateConfig() {
  const required = [
    'GOOGLE_DOCS_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_DOCS_PRIVATE_KEY',
    'GOOGLE_DRIVE_FOLDER_ID',
    'GITHUB_TOKEN',
    'GITHUB_REPO_OWNER',
    'GITHUB_REPO_NAME',
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error(chalk.red('❌ Fehlende Environment Variables:'))
    missing.forEach((key) => console.error(chalk.red(`  - ${key}`)))
    console.error(
      chalk.yellow('\nBitte konsultieren Sie GOOGLE_DOCS_SETUP.md für Setup-Anweisungen.')
    )
    process.exit(1)
  }
}

// Initialize Google APIs
let drive, docs

async function initGoogleAPIs() {
  // Create credentials object for authentication
  const credentials = {
    type: 'service_account',
    client_email: CONFIG.google.serviceAccountEmail,
    private_key: CONFIG.google.privateKey,
  }

  // Authenticate using fromJSON method (modern approach)
  const auth = google.auth.fromJSON(credentials)
  auth.scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/documents.readonly',
  ]

  await auth.authorize()

  drive = google.drive({ version: 'v3', auth })
  docs = google.docs({ version: 'v1', auth })
}

// Initialize Cloudflare R2 (S3-compatible) with AWS SDK v3
let s3Client

function initCloudflareR2() {
  s3Client = new S3Client({
    endpoint: `https://${CONFIG.cloudflare.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: CONFIG.cloudflare.accessKeyId,
      secretAccessKey: CONFIG.cloudflare.secretAccessKey,
    },
    region: 'auto',
  })
}

// Initialize Turndown (HTML → Markdown converter)
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
})

// Add GitHub Flavored Markdown support
turndownService.use(gfm)

// Custom Turndown rules
turndownService.addRule('strikethrough', {
  filter: ['del', 's'],
  replacement: (content) => `~~${content}~~`,
})

/**
 * List all Google Docs in the configured folder
 */
async function listGoogleDocs() {
  const spinner = ora('Suche nach Google Docs...').start()

  try {
    const response = await drive.files.list({
      q: `'${CONFIG.google.folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
      fields: 'files(id, name, modifiedTime, properties)',
      orderBy: 'modifiedTime desc',
    })

    spinner.succeed(`${response.data.files.length} Google Docs gefunden`)
    return response.data.files
  } catch (error) {
    spinner.fail('Fehler beim Laden der Google Docs')
    throw error
  }
}

/**
 * Extract metadata from Google Doc structure (natural workflow)
 * No YAML needed - extracts from document structure automatically
 */
async function extractMetadataFromDoc(docId, docName, htmlContent) {
  const $ = cheerio.load(htmlContent)

  // Use Google Doc name as title
  let title = docName

  // Check for DRAFT prefix in document name
  let isDraft = false
  if (title && title.toUpperCase().startsWith('DRAFT:')) {
    isDraft = true
    title = title.substring(6).trim()
  }

  // Find summary - first paragraph with substantial text
  let summary = null
  const paragraphs = $('body p').toArray()

  for (const p of paragraphs) {
    const text = $(p).text().trim()

    // Skip empty or very short paragraphs
    if (!text || text.length < 10) continue

    // Skip all-caps short paragraphs (likely headings)
    if (text === text.toUpperCase() && text.length < 50) continue

    // This is our summary
    summary = text
    if (summary.length > 200) {
      summary = summary.substring(0, 200).trim() + '...'
    }
    break
  }

  // Get tags from Google Doc Description
  let tags = 'tiny house, blog' // default

  try {
    const description = await getGoogleDocDescription(docId)
    if (description && description.trim()) {
      tags = description.trim()
    }
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Konnte Google Doc Beschreibung nicht laden, nutze Default-Tags'))
  }

  // Generate metadata
  const frontmatter = {
    title: title || 'Untitled',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    tags: tags,
    summary: summary || 'Keine Zusammenfassung verfügbar',
    authors: ['default'],
    draft: isDraft ? 'true' : 'false',
  }

  // Return original HTML (don't remove anything)
  return { frontmatter, contentWithoutFrontmatter: htmlContent }
}

/**
 * Get Google Doc description via Drive API (used for tags)
 */
async function getGoogleDocDescription(docId) {
  try {
    const response = await drive.files.get({
      fileId: docId,
      fields: 'description',
    })

    return response.data.description || ''
  } catch (error) {
    return ''
  }
}

/**
 * Validate frontmatter has required fields
 */
function validateFrontmatter(frontmatter, docTitle) {
  const required = ['title', 'date', 'tags', 'summary', 'authors']
  const missing = required.filter((key) => !frontmatter[key])

  if (missing.length > 0) {
    console.error(chalk.red(`❌ Fehlende Frontmatter-Felder in "${docTitle}":`))
    missing.forEach((key) => console.error(chalk.red(`  - ${key}`)))
    console.error(
      chalk.yellow(
        '\nBitte fügen Sie ein Frontmatter am Anfang des Google Docs hinzu.'
      )
    )
    console.error(chalk.yellow('Siehe GOOGLE_DOCS_SETUP.md für Details.'))
    return false
  }

  return true
}

/**
 * Generate frontmatter YAML string
 */
function generateFrontmatterYAML(frontmatter, featuredImageUrl = null) {
  const defaults = {
    draft: 'false',
    layout: 'PostLayout',
    authors: 'default',
  }

  const merged = { ...defaults, ...frontmatter }

  // Convert tags string to array format
  const tagsArray = merged.tags.split(',').map((t) => t.trim())
  const tagsFormatted = `[${tagsArray.map((t) => `'${t}'`).join(', ')}]`

  // Convert authors string to array format
  const authorsArray = merged.authors.split(',').map((a) => a.trim())
  const authorsFormatted = `[${authorsArray.map((a) => `'${a}'`).join(', ')}]`

  // Add images field if featured image is provided
  const imageField = featuredImageUrl ? `\nimages: ${featuredImageUrl}` : ''

  return `---
title: '${merged.title}'
date: '${merged.date}'
tags: ${tagsFormatted}
authors: ${authorsFormatted}
summary: '${merged.summary}'
draft: ${merged.draft}
layout: ${merged.layout}${imageField}
---`
}

/**
 * Convert Google Docs HTML to Markdown
 */
async function convertToMarkdown(htmlContent) {
  // Clean up Google Docs specific HTML
  const $ = cheerio.load(htmlContent)

  // Remove style tags and scripts
  $('style, script').remove()

  // Convert to Markdown using Turndown
  const markdown = turndownService.turndown($.html())

  return markdown
}

/**
 * Generate slug from title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Extract images from Google Doc HTML
 * Returns array of { url, alt, buffer }
 */
async function extractImages(htmlContent) {
  const $ = cheerio.load(htmlContent)
  const images = []

  const imgTags = $('img')

  for (let i = 0; i < imgTags.length; i++) {
    const img = imgTags[i]
    const src = $(img).attr('src')
    const alt = $(img).attr('alt') || ''

    if (!src) continue

    // Download image from Google
    try {
      const buffer = await downloadImage(src)

      images.push({
        url: src,
        alt,
        buffer,
        originalIndex: i,
        isFeatured: i === 0, // First image is the featured/teaser image
      })
    } catch (error) {
      console.error(chalk.yellow(`⚠️  Konnte Bild nicht laden: ${src.substring(0, 50)}...`))
      console.error(chalk.gray(`   ${error.message}`))
    }
  }

  return images
}

/**
 * Download image from URL to Buffer
 */
async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http

    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`))
          return
        }

        const chunks = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => resolve(Buffer.concat(chunks)))
        response.on('error', reject)
      })
      .on('error', reject)
  })
}

/**
 * Upload image to Cloudflare R2
 * Returns public URL
 */
async function uploadImageToR2(buffer, filename) {
  // Get file extension from filename
  const ext = path.extname(filename)
  const contentType = getContentType(ext)

  const command = new PutObjectCommand({
    Bucket: CONFIG.cloudflare.bucket,
    Key: filename,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  })

  await s3Client.send(command)

  return `${CONFIG.cloudflare.publicUrl}/${filename}`
}

/**
 * Get content type from file extension
 */
function getContentType(ext) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  }
  return types[ext.toLowerCase()] || 'application/octet-stream'
}

/**
 * Get Google Doc as HTML export
 */
async function getGoogleDocHTML(docId) {
  const response = await drive.files.export({
    fileId: docId,
    mimeType: 'text/html',
  })

  return response.data
}

/**
 * Publish MDX file to GitHub
 */
async function publishToGitHub(filename, content, commitMessage) {
  const fullPath = `${CONFIG.github.path}/${filename}`

  // Check if file already exists (to get SHA for update)
  let sha
  try {
    const getShaRes = await fetch(
      `https://api.github.com/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/contents/${fullPath}`,
      { headers: { Authorization: `token ${CONFIG.github.token}` } }
    )

    if (getShaRes.status === 200) {
      const shaData = await getShaRes.json()
      sha = shaData.sha
    }
  } catch (error) {
    // File doesn't exist yet, that's fine
  }

  // Push to GitHub
  const res = await fetch(
    `https://api.github.com/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/contents/${fullPath}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${CONFIG.github.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(content).toString('base64'),
        branch: CONFIG.github.branch,
        ...(sha && { sha }),
      }),
    }
  )

  if (!res.ok) {
    const error = await res.json()
    throw new Error(`GitHub API Error: ${error.message}`)
  }

  return await res.json()
}

/**
 * Process a single Google Doc
 */
async function processGoogleDoc(doc, options = {}) {
  const { preview = false } = options

  console.log(chalk.cyan(`\n📄 Verarbeite: "${doc.name}"`))

  const spinner = ora('Lade Google Doc...').start()

  try {
    // Step 1: Export as HTML
    spinner.text = 'Exportiere als HTML...'
    const htmlContent = await getGoogleDocHTML(doc.id)

    // Step 2: Extract metadata automatically from doc structure
    spinner.text = 'Extrahiere Metadaten...'
    const { frontmatter, contentWithoutFrontmatter } = await extractMetadataFromDoc(
      doc.id,
      doc.name,
      htmlContent
    )

    if (!frontmatter || !frontmatter.title) {
      spinner.fail('Kein Titel gefunden')
      console.error(
        chalk.yellow(
          '⚠️  Bitte fügen Sie eine Überschrift am Anfang des Google Docs hinzu.'
        )
      )
      return null
    }

    // Step 3: Validate frontmatter (simplified - most fields are auto-generated)
    if (!validateFrontmatter(frontmatter, doc.name)) {
      spinner.fail('Ungültige Metadaten')
      return null
    }

    // Step 4: Generate slug (needed for image filenames)
    const slug = generateSlug(frontmatter.title)

    // Step 5: Extract images BEFORE converting to Markdown
    spinner.text = 'Extrahiere Bilder...'
    const images = await extractImages(contentWithoutFrontmatter)

    let featuredImageUrl = null
    const uploadedImages = []

    if (images.length > 0) {
      spinner.text = `Lade ${images.length} Bild(er) zu R2 hoch...`

      // Step 5.5: Upload images to R2
      for (const image of images) {
        try {
          // Generate unique filename
          const timestamp = Date.now()
          const randomStr = Math.random().toString(36).substring(7)
          const ext = path.extname(new URL(image.url).pathname) || '.jpg'
          const prefix = image.isFeatured ? 'featured' : slug
          const filename = `${prefix}-${timestamp}-${randomStr}${ext}`

          // Upload to R2
          const r2Url = await uploadImageToR2(image.buffer, filename)

          // If this is the featured image, save URL for frontmatter
          if (image.isFeatured) {
            featuredImageUrl = r2Url
          } else {
            uploadedImages.push({ url: image.url, filename: filename })
          }

        } catch (error) {
          spinner.warn(`Fehler beim Upload von Bild: ${error.message}`)
        }
      }

      spinner.succeed(`${images.length} Bild(er) verarbeitet`)
    }

    // Step 6: Replace images in HTML before converting to markdown
    spinner.text = 'Bereite HTML vor...'
    const $ = cheerio.load(contentWithoutFrontmatter)

    // Remove style and script tags
    $('style, script').remove()

    const imgTags = $('img')

    // Remove featured image (first image)
    if (images.length > 0 && images[0].isFeatured) {
      $(imgTags[0]).remove()
    }

    // Replace content images with placeholder URLs
    uploadedImages.forEach((uploadedImage, index) => {
      // Find the image by its index (after featured was removed)
      const imgIndex = images[0]?.isFeatured ? index + 1 : index
      if (imgTags[imgIndex]) {
        $(imgTags[imgIndex]).attr('src', `{IMAGE_PATH}/${uploadedImage.filename}`)
      }
    })

    // Step 7: Convert to Markdown
    spinner.text = 'Konvertiere zu Markdown...'
    let markdown = turndownService.turndown($.html())

    // Remove Google Docs CSS that somehow makes it through Turndown
    markdown = markdown.split('\n').filter(line => {
      const isCSSLine = line.includes('{') && line.includes('}') &&
                        (line.includes('counter-') || line.includes('list-style') ||
                         line.includes('.lst-') || line.includes(':before') || line.includes(':after'))
      return !isCSSLine
    }).join('\n')

    // Clean up extra newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim()

    // Step 6: Generate frontmatter YAML
    const frontmatterYAML = generateFrontmatterYAML(frontmatter, featuredImageUrl)

    // Step 6: Combine to MDX
    const mdxContent = `${frontmatterYAML}\n\n${markdown}`

    // Step 7: Generate filename (slug already generated earlier)
    const filename = `${slug}.mdx`

    spinner.succeed('MDX generiert')

    // Preview mode: just show what would be done
    if (preview) {
      console.log(chalk.gray('  Dateiname:'), filename)
      console.log(chalk.gray('  Titel:'), frontmatter.title)
      console.log(chalk.gray('  Datum:'), frontmatter.date)
      console.log(chalk.gray('  Tags:'), frontmatter.tags)
      console.log(chalk.gray('  MDX Länge:'), mdxContent.length, 'Zeichen')
      console.log(chalk.yellow('  [PREVIEW MODE - Nicht publiziert]'))
      return { filename, content: mdxContent, frontmatter }
    }

    // Step 8: Publish to GitHub
    const publishSpinner = ora('Publiziere zu GitHub...').start()

    const commitMessage = `📝 Blogpost via Google Docs: ${frontmatter.title}`
    await publishToGitHub(filename, mdxContent, commitMessage)

    publishSpinner.succeed('Erfolgreich zu GitHub gepusht')

    console.log(chalk.green(`✅ "${frontmatter.title}" erfolgreich publiziert!`))
    console.log(chalk.gray(`   Datei: ${CONFIG.github.path}/${filename}`))

    return { filename, content: mdxContent, frontmatter }
  } catch (error) {
    spinner.fail('Fehler beim Verarbeiten')
    console.error(chalk.red(`   ${error.message}`))
    throw error
  }
}

/**
 * Main CLI
 */
async function main() {
  console.log(chalk.bold.cyan('\n🚀 Google Docs → Kokomo Blog Sync\n'))

  // Parse CLI arguments
  const args = process.argv.slice(2)
  const command = args[0]

  // Validate config
  validateConfig()

  // Initialize APIs
  const initSpinner = ora('Initialisiere APIs...').start()
  try {
    await initGoogleAPIs()
    initCloudflareR2()
    initSpinner.succeed('APIs initialisiert')
  } catch (error) {
    initSpinner.fail('Fehler bei API-Initialisierung')
    console.error(chalk.red(error.message))
    process.exit(1)
  }

  try {
    if (command === '--preview') {
      // Preview mode: show all docs without publishing
      const docs = await listGoogleDocs()

      if (docs.length === 0) {
        console.log(chalk.yellow('Keine Google Docs gefunden.'))
        return
      }

      console.log(chalk.bold('\nGefundene Dokumente:\n'))
      for (const doc of docs) {
        await processGoogleDoc(doc, { preview: true })
      }
    } else if (command === '--title') {
      // Publish specific doc by title
      const title = args.slice(1).join(' ')
      if (!title) {
        console.error(chalk.red('❌ Bitte geben Sie einen Titel an'))
        console.log(chalk.yellow('Verwendung: npm run publish:doc "Titel des Posts"'))
        process.exit(1)
      }

      const docs = await listGoogleDocs()
      const doc = docs.find((d) => d.name.toLowerCase().includes(title.toLowerCase()))

      if (!doc) {
        console.error(chalk.red(`❌ Kein Google Doc mit Titel "${title}" gefunden`))
        process.exit(1)
      }

      await processGoogleDoc(doc)
    } else if (command === '--id') {
      // Publish specific doc by ID
      const docId = args[1]
      if (!docId) {
        console.error(chalk.red('❌ Bitte geben Sie eine Google Docs ID an'))
        process.exit(1)
      }

      const doc = { id: docId, name: 'Document' }
      await processGoogleDoc(doc)
    } else if (command === '--all') {
      // Publish all docs
      const docs = await listGoogleDocs()

      if (docs.length === 0) {
        console.log(chalk.yellow('Keine Google Docs gefunden.'))
        return
      }

      console.log(chalk.bold(`\nVerarbeite ${docs.length} Dokumente...\n`))

      let success = 0
      let failed = 0

      for (const doc of docs) {
        try {
          const result = await processGoogleDoc(doc)
          if (result) success++
          else failed++
        } catch (error) {
          failed++
        }
      }

      console.log(chalk.bold.green(`\n✅ Erfolgreich: ${success}`))
      if (failed > 0) {
        console.log(chalk.bold.red(`❌ Fehlgeschlagen: ${failed}`))
      }
    } else {
      // Show help
      console.log(chalk.bold('Verwendung:\n'))
      console.log('  npm run publish:doc "Titel"     Publiziert ein spezifisches Dokument')
      console.log('  npm run publish:all-docs        Publiziert alle Dokumente')
      console.log('  npm run preview:docs            Zeigt alle Dokumente ohne zu publizieren')
      console.log('\nOptionen:')
      console.log('  --title "Titel"    Suche nach Titel')
      console.log('  --id <docId>       Nutze Google Docs ID')
      console.log('  --all              Verarbeite alle Docs')
      console.log('  --preview          Preview-Modus (keine Publikation)')
    }

    console.log(chalk.cyan('\n✨ Fertig!\n'))
  } catch (error) {
    console.error(chalk.red('\n❌ Fehler:'), error.message)
    process.exit(1)
  }
}

// Run main
main()
