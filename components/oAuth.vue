<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const config = useRuntimeConfig()
const client = useSupabaseClient()

interface OAuthProvider {
  id: 'discord' | 'github' | 'google'
  icon: string
  label: string
  enabled: boolean
}

const providers: OAuthProvider[] = [
  {
    id: 'discord',
    icon: 'simple-icons:discord',
    label: t('providers.discord'),
    enabled: false
  },
  {
    id: 'github',
    icon: 'simple-icons:github',
    label: t('providers.github'),
    enabled: true
  },
  {
    id: 'google',
    icon: 'simple-icons:google',
    label: t('providers.google'),
    enabled: false
  },
]

const loading = ref<string | null>(null)

async function signInWithOAuth(provider: OAuthProvider) {
  if (!provider.enabled) return

  try {
    loading.value = provider.id

    const { error } = await client.auth.signInWithOAuth({
      provider: provider.id,
    })

    if (error) throw error
  }
  catch (error) {
    loading.value = null
    console.error('OAuth error:', error)
  }
}
</script>

<template>
  <div class="space-y-8">
    <UDivider>{{ t('title') }}</UDivider>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
      <UButton v-for="provider in providers" :key="provider.id" block :icon="provider.icon" :label="provider.label" size="xl" variant="soft" :disabled="!provider.enabled" :loading="loading === provider.id" @click="signInWithOAuth(provider)" />
    </div>
  </div>
</template>

<i18n lang="yaml">
  en:
    title: Continue With
    providers:
      discord: Discord
      github: GitHub
      google: Google
      reddit: Reddit
</i18n>
