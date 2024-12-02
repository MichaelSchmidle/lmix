<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const toast = useToast()
const productionStore = useProductionStore()
const { $reset: resetProductionStore } = productionStore
const assistantStore = useAssistantStore()
const { $reset: resetAssistantStore } = assistantStore
const modelStore = useModelStore()
const { $reset: resetModelStore } = modelStore
const personaStore = usePersonaStore()
const { $reset: resetPersonaStore } = personaStore
const relationStore = useRelationStore()
const { $reset: resetRelationStore } = relationStore
const scenarioStore = useScenarioStore()
const { $reset: resetScenarioStore } = scenarioStore
const turnStore = useTurnStore()
const { $reset: resetTurnStore } = turnStore
const worldStore = useWorldStore()
const { $reset: resetWorldStore } = worldStore

const userItems = computed(() => {
  const baseItems = [
    [
      {
        class: 'cursor-auto',
        label: t('colorMode'),
        slot: 'colorMode',
      },
    ],
  ]

  if (user.value) {
    return [
      [
        {
          class: 'hover:bg-inherit dark:hover:bg-inherit cursor-auto select-text text-gray-500 dark:text-gray-400 text-start',
          label: t('account', { email: user.value.email }),
          slot: 'account',
        },
      ],
      ...baseItems,
      [
        {
          click: handleExport,
          icon: 'i-ph-download-simple',
          label: t('export'),
        },
        {
          click: handleSignOut,
          icon: 'i-ph-sign-out',
          label: t('signOut'),
        },
      ],
    ]
  }

  return baseItems
})

const isSigningOut = ref(false)

async function handleSignOut() {
  isSigningOut.value = true

  // Reset all stores
  resetProductionStore()
  resetAssistantStore()
  resetModelStore()
  resetPersonaStore()
  resetRelationStore()
  resetScenarioStore()
  resetTurnStore()
  resetWorldStore()

  navigateTo('/sign-in')

  const signOutPromise = supabase.auth.signOut()
  const delayPromise = new Promise(resolve => setTimeout(resolve, 2000))

  await Promise.all([signOutPromise, delayPromise])
  isSigningOut.value = false
}

const handleExport = () => {
  try {
    exportData()
  }
  catch (error) {
    console.error(error)
    toast.add({
      color: 'rose',
      icon: 'i-ph-x-circle',
      title: t('export.error'),
    })
  }
}
</script>

<template>
  <UDropdown :items="userItems">
    <UAvatar v-if="user?.user_metadata.avatar_url" :alt="user.user_metadata.full_name"
      :src="user.user_metadata.avatar_url" />
    <UAvatar v-else icon="i-ph-user" :ui="{ background: 'bg-gray-200' }" />
    <template v-if="user" #account>
      <i18n-t keypath="account" tag="span" @click.stop>
        <template #email><strong class="truncate">{{ user.email }}</strong></template>
      </i18n-t>
    </template>
    <template #colorMode>
      <div class="flex flex-1 items-center justify-between" @click.stop>
        <span class="cursor-text">{{ t('colorMode') }}</span>
        <UiColorModeToggle />
      </div>
    </template>
  </UDropdown>
  <UModal v-model="isSigningOut" prevent-close>
    <UCard>
      <div class="prose dark:prose-invert text-center">
        <p>
          <UIcon class="animate-spin h-12 w-12 text-primary" name="i-ph-circle-notch" />
        </p>
        <p> {{ t('signingOut') }}</p>
      </div>
    </UCard>
  </UModal>
</template>

<i18n lang="yaml">
en:
  account: Signed in as {email}
  colorMode: Color Mode
  colorTheme: Color Theme
  export: Export Repertoire
  exportError: Failed to export data
  signOut: Sign Out
  signingOut: We are signing you out. Please wait.
</i18n>
