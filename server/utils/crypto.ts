import crypto from 'crypto'

// Use environment variable or fallback to a default for development
// In production, this MUST be set via environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-key-32-chars-change-in-prod!'
const IV_LENGTH = 16
const ALGORITHM = 'aes-256-cbc'
const KEY_MASK = '••••••••'

// Ensure key is 32 bytes
const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))

/**
 * Encrypt a string value
 */
export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(text, 'utf8')
    encrypted = Buffer.concat([encrypted, cipher.final()])
    
    // Return iv:encrypted format
    return iv.toString('hex') + ':' + encrypted.toString('hex')
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt an encrypted string
 */
export function decrypt(text: string | null | undefined): string | null {
  if (!text) return null
  
  try {
    const parts = text.split(':')
    if (parts.length !== 2) {
      // Not encrypted or invalid format - return as is for backward compatibility
      return text
    }
    
    const iv = Buffer.from(parts[0]!, 'hex')
    const encryptedText = Buffer.from(parts[1]!, 'hex')
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    
    return decrypted.toString('utf8')
  } catch (error) {
    console.error('Decryption failed:', error)
    // Return null instead of throwing to handle migration gracefully
    return null
  }
}

/**
 * Check if a value is the masked placeholder
 */
export function isMaskedKey(value: string | null | undefined): boolean {
  return value === KEY_MASK
}

/**
 * Get the mask placeholder for API keys
 */
export function getMaskedKey(): string {
  return KEY_MASK
}

/**
 * Mask an API key for display (show last 4 characters)
 */
export function maskApiKey(apiKey: string | null | undefined): string | null {
  if (!apiKey) return null
  return KEY_MASK
}