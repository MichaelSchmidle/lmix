<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const props = defineProps({
  isSlideover: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close'])

const stageItems = [
  {
    label: t('stage'),
    slot: 'stage',
  },
]

const links = [
  { icon: 'i-ph-circuitry', label: t('models'), to: '/models' },
  { icon: 'i-ph-mask-happy', label: t('personas'), to: '/personas' },
  { icon: 'i-ph-head-circuit', label: t('assistants'), to: '/assistants' },
  { icon: 'i-ph-panorama', label: t('scenarios'), to: '/scenarios' },
  { icon: 'i-ph-planet', label: t('worlds'), to: '/worlds' },
]

const productionItems = [
  { icon: 'i-ph-film-script', label: t('productions'), slot: 'productions' },
]

const userItems = [
  [
    {
      disabled: true,
      label: t('account'),
      slot: 'user',
    },
  ],
  [
    {
      click: handleSignOut,
      icon: 'i-ph-sign-out',
      label: t('signOut'),
    },
  ],
]

const isSigningOut = ref(false)

async function handleSignOut() {
  isSigningOut.value = true

  const signOutPromise = supabase.auth.signOut()
  const delayPromise = new Promise(resolve => setTimeout(resolve, 2000))
  await Promise.all([signOutPromise, delayPromise])
  isSigningOut.value = false

  // Navigate to home page after sign out
  navigateTo('/')
}
</script>

<template>
  <UiPanelHeader>
    <UButton to="/" variant="link">
      <Logotype class="h-4 text-primary hover:text-primary-600 dark:hover:text-primary-500 w-auto" />
    </UButton>
    <template v-if="isSlideover" #toggle>
      <UButton color="gray" icon="i-ph-x" variant="ghost" @click="$emit('close')" />
    </template>
  </UiPanelHeader>
  <UiPanelContent>
    <UAccordion color="gray" default-open :items="stageItems" variant="ghost">
      <template #stage>
        <UVerticalNavigation :links="links" />
      </template>
    </UAccordion>
    <UButton block icon="i-ph-film-script-duotone" :label="t('newProduction')" to="/" />
    <UAccordion color="gray" default-open :items="productionItems" variant="ghost">
      <template #productions>
        <NoData :message="t('noProductions')" />
      </template>
    </UAccordion>
  </UiPanelContent>
  <UiPanelFooter>
    <UDropdown v-if="user" :items="userItems" :ui="{ item: { disabled: 'cursor-text select-text' } }">
      <UAvatar :src="user.user_metadata.avatar_url" />
      <template #user>
        <p class="text-start">{{ t('account', { email: user.email }) }}</p>
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
    <UiColorThemeToggle />
    <UiColorModeToggle />
  </UiPanelFooter>
</template>

<i18n lang="yaml">
  en:
    stage: Stage
    models: Models
    personas: Personas
    assistants: Assistants
    scenarios: Scenarios
    worlds: Worlds
    newProduction: New Production
    productions: Productions
    noProductions: No productions yet
    account: Signed in as {email}
    signOut: Sign Out
    signingOut: We are signing you out. Please wait.
</i18n>
