// Main repository env.d.ts
interface ImportMetaEnv {
  // Supabase Configuration
  readonly SUPABASE_URL: string
  readonly SUPABASE_KEY: string
  readonly NUXT_PUBLIC_SUPABASE_URL: string
  readonly NUXT_PUBLIC_SUPABASE_KEY: string

  // Runtime Configuration
  readonly NUXT_PUBLIC_APP_VERSION?: string
  readonly NUXT_PUBLIC_APP_NAME?: string

  // Development Configuration
  readonly NODE_ENV?: 'development' | 'production' | 'test'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 