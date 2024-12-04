#!/usr/bin/env node

import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SUPABASE_REPO = 'supabase/supabase'

// Get the directory where this script lives
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const deployDir = path.join(rootDir, 'deploy')

async function fetchJson(url) {
  const options = {
    headers: {
      'User-Agent': 'Supabase-Update-Script'
    }
  }

  return new Promise((resolve, reject) => {
    https.get(url, options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data))
        } else {
          reject(new Error(`Failed to fetch ${url}: ${res.statusCode} ${data}`))
        }
      })
    }).on('error', reject)
  })
}

async function downloadFile(url, targetPath) {
  // Ensure target directory exists
  const targetDir = path.dirname(targetPath)
  fs.mkdirSync(targetDir, { recursive: true })

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(targetPath)
        res.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve()
        })
      } else {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`))
      }
    }).on('error', reject)
  })
}

async function downloadDirectory(dirPath, targetDir, tag) {
  console.log(`📂 Downloading ${dirPath}...`)
  
  const url = `https://api.github.com/repos/${SUPABASE_REPO}/contents/${dirPath}?ref=${tag}`
  const contents = await fetchJson(url)

  for (const item of contents) {
    const targetPath = path.join(targetDir, item.name)

    if (item.type === 'dir') {
      fs.mkdirSync(targetPath, { recursive: true })
      await downloadDirectory(`${dirPath}/${item.name}`, targetPath, tag)
    } else if (item.type === 'file') {
      console.log(`📄 Downloading ${item.path}...`)
      await downloadFile(item.download_url, targetPath)
    }
  }
}

// Get tag from command line
const tag = process.argv[2]
if (!tag) {
  console.error('❌ Error: Version tag is required')
  console.error('Usage: npm run dev:update-deploy-supabase -- <tag>')
  console.error('Example: npm run dev:update-deploy-supabase -- v1.0.0')
  process.exit(1)
}

console.log(`🚀 Updating Supabase docker files to ${tag}...`)

// Create supabase directory if it doesn't exist
const supabaseDir = path.join(deployDir, 'supabase')
fs.mkdirSync(supabaseDir, { recursive: true })

// Clean up existing docker directory
const dockerDir = path.join(supabaseDir, 'docker')
fs.rmSync(dockerDir, { recursive: true, force: true })

// Download the entire docker directory
await downloadDirectory('docker', dockerDir, tag)

// Update version file
fs.writeFileSync(path.join(deployDir, 'SUPABASE_VERSION'), tag)

console.log('✅ Update complete!')
