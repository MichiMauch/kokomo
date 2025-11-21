#!/usr/bin/env node

/**
 * Test Script für Google Docs Integration
 * Testet den kompletten Workflow und publiziert zu GitHub
 */

import { google } from 'googleapis'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import * as cheerio from 'cheerio'
import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

// Load environment variables
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') })

// Configuration
const CONFIG = {
  google: {
    serviceAccountEmail: process.env.GOOGLE_DOCS_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_DOCS_PRIVATE_KEY,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
  },
  r2: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    bucketName: process.env.CLOUDFLARE_BUCKET_2,
    publicUrl: process.env.NEXT_PUBLIC_CLOUDFLARE_R2_URL,
  },
  github: {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_REPO_OWNER,
    repo: process.env.GITHUB_REPO_NAME,
    branch: process.env.GITHUB_BRANCH || 'main',
    path: process.env.GITHUB_PATH || 'data/tiny-house',
  },
}

// Initialize S3Client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${CONFIG.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CONFIG.r2.accessKeyId,
    secretAccessKey: CONFIG.r2.secretAccessKey,
  },
})

// Initialize Google APIs
let drive, docs

async function initGoogleAPIs() {
  const credentials = {
    type: 'service_account',
    client_email: CONFIG.google.serviceAccountEmail,
    private_key: CONFIG.google.privateKey,
  }

  const auth = google.auth.fromJSON(credentials)
  auth.scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/documents.readonly',
  ]

  await auth.authorize()

  drive = google.drive({ version: 'v3', auth })
  docs = google.docs({ version: 'v1', auth })
}

// Turndown service
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
})
turndownService.use(gfm)

/**
 * Get Google Doc as HTML
 */
async function getGoogleDocHTML(docId) {
  const response = await drive.files.export({
    fileId: docId,
    mimeType: 'text/html',
  })
  return response.data
}

/**
 * Get Google Doc description
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
 * Download image from URL
 */
async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    })
    return Buffer.from(response.data)
  } catch (error) {
    console.error(chalk.red(`   Fehler beim Download von ${url}: ${error.message}`))
    throw error
  }
}

/**
 * Upload image to Cloudflare R2
 */
async function uploadImageToR2(buffer, filename, contentType = 'image/webp') {
  try {
    const key = filename

    const command = new PutObjectCommand({
      Bucket: CONFIG.r2.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    await s3Client.send(command)

    const publicUrl = `${CONFIG.r2.publicUrl}/${key}`
    return publicUrl
  } catch (error) {
    console.error(chalk.red(`   Fehler beim R2-Upload: ${error.message}`))
    throw error
  }
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
 * Extract metadata from doc
 */
async function extractMetadata(docId, docName, htmlContent) {
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

  // Get tags from description
  let tags = 'tiny house, blog'
  try {
    const description = await getGoogleDocDescription(docId)
    if (description && description.trim()) {
      tags = description.trim()
    }
  } catch (error) {
    // Use default
  }

  // Find images
  const images = []
  let featuredImage = null
  const imgTags = $('img')
  imgTags.each((i, img) => {
    const src = $(img).attr('src')
    const alt = $(img).attr('alt') || ''
    if (src) {
      if (i === 0) {
        // First image is the featured/teaser image
        featuredImage = { src, alt }
      } else {
        // Other images are content images
        images.push({ src, alt })
      }
    }
  })

  return {
    title: title || 'Untitled',
    summary: summary || 'Keine Zusammenfassung',
    tags,
    isDraft,
    featuredImage,
    images,
  }
}

/**
 * Convert to Markdown
 */
function convertToMarkdown(htmlContent) {
  const $ = cheerio.load(htmlContent)
  $('style, script').remove()
  return turndownService.turndown($.html())
}

/**
 * Generate frontmatter YAML
 */
function generateFrontmatter(metadata, featuredImageUrl = null) {
  const tagsArray = metadata.tags.split(',').map((t) => t.trim())
  const tagsFormatted = `[${tagsArray.map((t) => `'${t}'`).join(', ')}]`

  // Add images field if featured image is provided
  const imageField = featuredImageUrl ? `\nimages: ${featuredImageUrl}` : ''

  return `---
title: '${metadata.title}'
date: '${new Date().toISOString().split('T')[0]}'
tags: ${tagsFormatted}
authors: ['default']
summary: '${metadata.summary}'
draft: ${metadata.isDraft ? 'true' : 'false'}
layout: PostLayout${imageField}
---`
}

/**
 * Generate slug
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
 * Test a single doc
 */
async function testDoc(doc) {
  console.log(chalk.bold.cyan(`\n📄 Teste: "${doc.name}"\n`))

  const spinner = ora('Lade Google Doc...').start()

  try {
    // Export HTML
    spinner.text = 'Exportiere als HTML...'
    const htmlContent = await getGoogleDocHTML(doc.id)

    // Extract metadata
    spinner.text = 'Extrahiere Metadaten...'
    const metadata = await extractMetadata(doc.id, doc.name, htmlContent)

    spinner.succeed('Metadaten extrahiert')

    // Show metadata
    console.log(chalk.bold('\n📋 Metadaten:\n'))
    console.log(chalk.white(`  Titel: ${chalk.green(metadata.title)}`))
    console.log(chalk.white(`  Summary: ${chalk.gray(metadata.summary)}`))
    console.log(chalk.white(`  Tags: ${chalk.yellow(metadata.tags)}`))
    console.log(
      chalk.white(
        `  Draft: ${metadata.isDraft ? chalk.red('true') : chalk.green('false')}`
      )
    )
    console.log(chalk.white(`  Datum: ${chalk.cyan(new Date().toISOString().split('T')[0])}`))
    console.log(chalk.white(`  Autor: ${chalk.cyan('Sibylle & Michi')}`))

    // Generate slug for image filenames
    const slug = generateSlug(metadata.title)

    // Upload featured image
    let featuredImageUrl = null
    if (metadata.featuredImage) {
      console.log(chalk.white(`\n🖼️  Featured Image (Teaser):`))
      console.log(
        chalk.gray(`    ${metadata.featuredImage.src.substring(0, 60)}...${metadata.featuredImage.alt ? ` (${metadata.featuredImage.alt})` : ''}`)
      )

      const uploadSpinner = ora('Lade Featured Image herunter...').start()
      try {
        const imageBuffer = await downloadImage(metadata.featuredImage.src)
        uploadSpinner.text = 'Lade zu Cloudflare R2 hoch...'
        const filename = `featured-${slug}.webp`
        featuredImageUrl = await uploadImageToR2(imageBuffer, filename)
        uploadSpinner.succeed(`Featured Image hochgeladen: ${chalk.cyan(featuredImageUrl)}`)
      } catch (error) {
        uploadSpinner.fail('Fehler beim Featured Image Upload')
        throw error
      }
    }

    // Upload content images
    const uploadedImages = []
    if (metadata.images.length > 0) {
      console.log(chalk.white(`\n🖼️  Content-Bilder: ${chalk.green(metadata.images.length)}`))

      for (let i = 0; i < metadata.images.length; i++) {
        const img = metadata.images[i]
        console.log(
          chalk.gray(`    ${i + 1}. ${img.src.substring(0, 60)}...${img.alt ? ` (${img.alt})` : ''}`)
        )

        const uploadSpinner = ora(`Lade Bild ${i + 1}/${metadata.images.length} herunter...`).start()
        try {
          const imageBuffer = await downloadImage(img.src)
          uploadSpinner.text = `Lade Bild ${i + 1}/${metadata.images.length} zu R2 hoch...`
          const filename = `${slug}-${i + 1}.webp`
          const imageUrl = await uploadImageToR2(imageBuffer, filename)
          uploadedImages.push({ originalSrc: img.src, url: imageUrl, alt: img.alt, filename: filename })
          uploadSpinner.succeed(`Bild ${i + 1} hochgeladen: ${chalk.cyan(imageUrl)}`)
        } catch (error) {
          uploadSpinner.fail(`Fehler beim Upload von Bild ${i + 1}`)
          throw error
        }
      }
    }

    // Replace images in HTML before converting to markdown (more reliable than regex on markdown)
    const convertSpinner = ora('Bereite HTML vor...').start()
    const $ = cheerio.load(htmlContent)

    // Remove style and script tags (Google Docs CSS/JS that we don't need)
    $('style, script').remove()

    const imgTags = $('img')

    // Remove featured image (first image)
    if (metadata.featuredImage) {
      $(imgTags[0]).remove()
    }

    // Replace content images with placeholder URLs
    uploadedImages.forEach((uploadedImage, index) => {
      // Find the image by its index (after featured was removed)
      const imgIndex = metadata.featuredImage ? index + 1 : index
      if (imgTags[imgIndex]) {
        $(imgTags[imgIndex]).attr('src', `{IMAGE_PATH}/${uploadedImage.filename}`)
      }
    })

    convertSpinner.text = 'Konvertiere zu Markdown...'
    let markdown = turndownService.turndown($.html())
    convertSpinner.succeed(`Markdown generiert (${markdown.length} Zeichen)`)

    // Remove Google Docs CSS that somehow makes it through Turndown
    // Pattern: CSS rules like "ol.lst-... {}" or ".lst-... > li:before{}"
    markdown = markdown.replace(/[\s\S]*?(?=\n\n[A-Z])/s, (match) => {
      // If the match contains lots of CSS patterns, remove it
      if (match.includes('counter-reset') || match.includes('list-style-type') || match.includes('.lst-')) {
        return ''
      }
      return match
    })

    // Alternative: Remove lines that look like CSS (contain { } and typical CSS keywords)
    markdown = markdown.split('\n').filter(line => {
      const isCSSLine = line.includes('{') && line.includes('}') &&
                        (line.includes('counter-') || line.includes('list-style') ||
                         line.includes('.lst-') || line.includes(':before') || line.includes(':after'))
      return !isCSSLine
    }).join('\n')

    // Clean up extra newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim()

    // Generate frontmatter
    const frontmatter = generateFrontmatter(metadata, featuredImageUrl)

    // Combine to MDX
    const mdxContent = `${frontmatter}\n\n${markdown}`

    // Show preview
    console.log(chalk.bold('\n📝 MDX Preview (erste 500 Zeichen):\n'))
    console.log(chalk.gray('─'.repeat(80)))
    console.log(mdxContent.substring(0, 500))
    if (mdxContent.length > 500) {
      console.log(chalk.gray('\n[... gekürzt ...]'))
    }
    console.log(chalk.gray('─'.repeat(80)))

    // Save to temp folder
    const tempDir = path.join(PROJECT_ROOT, 'temp')
    await fs.mkdir(tempDir, { recursive: true })

    const filename = `${slug}.mdx`
    const filepath = path.join(tempDir, filename)

    await fs.writeFile(filepath, mdxContent, 'utf-8')

    console.log(chalk.green(`\n✅ MDX gespeichert: ${chalk.white(filepath)}`))

    // Push to GitHub
    const pushSpinner = ora('Publiziere zu GitHub...').start()
    try {
      const commitMessage = `📝 Blogpost via Google Docs: ${metadata.title}`
      await publishToGitHub(filename, mdxContent, commitMessage)
      pushSpinner.succeed(
        `Erfolgreich zu GitHub gepusht: ${chalk.cyan(`${CONFIG.github.owner}/${CONFIG.github.repo}/${CONFIG.github.path}/${filename}`)}`
      )
    } catch (error) {
      pushSpinner.fail('Fehler beim GitHub Push')
      throw error
    }

    console.log(chalk.gray(`\n   Lokale MDX-Datei: ${filepath}\n`))

    return { metadata, mdxContent, filepath }
  } catch (error) {
    spinner.fail('Fehler beim Testen')
    console.error(chalk.red(`   ${error.message}`))
    throw error
  }
}

/**
 * Main
 */
async function main() {
  console.log(chalk.bold.cyan('\n🧪 Google Docs Test-Script (mit GitHub Push)\n'))

  const args = process.argv.slice(2)
  const command = args[0]

  // Init
  const initSpinner = ora('Initialisiere Google APIs...').start()
  try {
    await initGoogleAPIs()
    initSpinner.succeed('APIs initialisiert')
  } catch (error) {
    initSpinner.fail('Fehler bei Initialisierung')
    console.error(chalk.red(error.message))
    process.exit(1)
  }

  // Get docs
  const listSpinner = ora('Lade Google Docs...').start()
  const response = await drive.files.list({
    q: `'${CONFIG.google.folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
    fields: 'files(id, name)',
    orderBy: 'modifiedTime desc',
  })

  const docsFiles = response.data.files
  listSpinner.succeed(`${docsFiles.length} Dokument(e) gefunden`)

  if (docsFiles.length === 0) {
    console.log(chalk.yellow('\nKeine Google Docs gefunden.'))
    return
  }

  // Test docs
  if (command === '--title') {
    const title = args.slice(1).join(' ')
    if (!title) {
      console.error(chalk.red('\n❌ Bitte geben Sie einen Titel an'))
      process.exit(1)
    }

    const doc = docsFiles.find((d) => d.name.toLowerCase().includes(title.toLowerCase()))
    if (!doc) {
      console.error(chalk.red(`\n❌ Kein Doc mit Titel "${title}" gefunden`))
      process.exit(1)
    }

    await testDoc(doc)
  } else {
    // Test all
    console.log(chalk.bold(`\nTeste ${docsFiles.length} Dokument(e)...\n`))

    for (const doc of docsFiles) {
      await testDoc(doc)
    }
  }

  console.log(
    chalk.bold.green(
      `\n✨ Workflow abgeschlossen! MDX-Dateien wurden in ${chalk.white('/temp/')} gespeichert und zu GitHub gepusht.\n`
    )
  )
  console.log(
    chalk.cyan(
      `🚀 Ihre Änderungen wurden nach ${chalk.white(`${CONFIG.github.owner}/${CONFIG.github.repo}`)} gepusht und lösen automatisch ein Vercel Deployment aus.\n`
    )
  )
}

main().catch((error) => {
  console.error(chalk.red('\n❌ Fehler:'), error.message)
  process.exit(1)
})
