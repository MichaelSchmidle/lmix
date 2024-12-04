// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: {
    enabled: true,
  },
  formkit: {
    autoImport: true
  },
  googleFonts: {
    display: 'swap',
    families: {
      'DM Sans': {
        wght: [300, 400, 500, 600, 700],
        ital: [300, 400, 500, 600, 700],
      },
      'DM Serif Display': {
        wght: [400],
        ital: [400],
      },
      'JetBrains Mono': {
        wght: [400, 500, 600, 700],
        ital: [400, 500, 600, 700],
      },
    },
  },
  i18n: {
    defaultLocale: 'en',
  },
  modules: [
    '@formkit/auto-animate/nuxt',
    '@formkit/nuxt',
    '@nuxt/ui',
    '@nuxtjs/google-fonts',
    '@nuxtjs/i18n',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
  ],
  runtimeConfig: {
    public: {
      openaiVersion: '1',
      lmixVersion: process.env.LMIX_VERSION || 'unspecified',
    }
  },
  supabase: {
    redirectOptions: {
      login: '/sign-in',
      callback: '/sign-in',
      include: undefined,
      exclude: [],
      cookieRedirect: false,
    },
    types: './types/api.ts',
  },
  ui: {
    safelistColors: [
      'cyan',
      'indigo'
    ],
  }
})