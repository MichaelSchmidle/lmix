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

function cleanupDirectory(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
    console.log(`🧹 Cleaned up ${dir}`)
  }
}

async function downloadDirectory(dirPath, targetDir, commitHash) {
  console.log(`📂 Downloading directory ${dirPath}...`)

  const apiUrl = `https://api.github.com/repos/${SUPABASE_REPO}/contents/${dirPath}?ref=${commitHash}`
  const contents = await fetchJson(apiUrl)

  for (const item of contents) {
    const targetPath = path.join(targetDir, item.name)

    if (item.type === 'dir') {
      fs.mkdirSync(targetPath, { recursive: true })
      await downloadDirectory(`${dirPath}/${item.name}`, targetPath, commitHash)
    } else if (item.type === 'file') {
      console.log(`📄 Downloading file ${item.path}...`)
      await downloadFile(item.download_url, targetPath)
    }
  }
}

// Get commit hash from command line
const commitHash = process.argv[2]
if (!commitHash) {
  console.error('❌ Error: Commit hash is required')
  process.exit(1)
}

console.log(`🚀 Updating Supabase deploy files from commit ${commitHash}...`)

// Create supabase directory if it doesn't exist
const supabaseDir = path.join(deployDir, 'supabase')
fs.mkdirSync(supabaseDir, { recursive: true })

// Clean up existing content
const supabaseDockerDir = path.join(supabaseDir, 'docker')
cleanupDirectory(supabaseDockerDir)

// Download files
await downloadDirectory('docker', supabaseDockerDir, commitHash)

// Update commit hash file
fs.writeFileSync(path.join(deployDir, 'SUPABASE_COMMIT_HASH'), commitHash)

console.log('✅ Update complete!')
