// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: {
    enabled: true,
  },
  extends: [
    '@nuxt/ui-pro',
  ],
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
  modules: [
    '@nuxt/ui',
    '@formkit/nuxt',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
  ],
  runtimeConfig: {
    public: {
    },
  },
  supabase: {
    redirectOptions: {
      login: '/',
      callback: '/confirm',
      include: undefined,
      exclude: [],
      cookieRedirect: false,
    },
  },
})