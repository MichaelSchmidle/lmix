<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const productionStore = useProductionStore()
const { getProductionNavigation } = storeToRefs(productionStore)

const props = defineProps({
  isSlideover: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close'])

const repertoireItems = [
  {
    label: t('repertoire'),
    slot: 'repertoire',
  },
]

const links = [
  { icon: 'i-ph-circuitry', label: t('models'), to: '/models' },
  { icon: 'i-ph-mask-happy', label: t('personas'), to: '/personas' },
  { icon: 'i-ph-head-circuit', label: t('assistants'), to: '/assistants' },
  { icon: 'i-ph-share-network', label: t('relations'), to: '/relations' },
  { icon: 'i-ph-panorama', label: t('scenarios'), to: '/scenarios' },
  { icon: 'i-ph-planet', label: t('worlds'), to: '/worlds' },
]

const productionItems = [
  { icon: 'i-ph-popcorn-duotone', label: t('productions'), slot: 'productions' },
]

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

  const signOutPromise = supabase.auth.signOut()
  const delayPromise = new Promise(resolve => setTimeout(resolve, 2000))

  await Promise.all([signOutPromise, delayPromise])
  isSigningOut.value = false

  navigateTo('/')
}
</script>

<template>
  <UiPanelHeader>
    <UButton to="/" variant="link">
      <Logotype class="h-4 text-primary hover:text-primary-600 dark:hover:text-primary-500 w-auto" />
    </UButton>
    <template v-if="isSlideover" #mainToggle>
      <UButton color="gray" icon="i-ph-x" variant="ghost" @click="$emit('close')" />
    </template>
  </UiPanelHeader>
  <UiPanelContent>
    <UAccordion color="gray" default-open :items="repertoireItems" variant="ghost" :ui="{ default: { class: 'hover:bg-gray-200 dark:hover:bg-gray-800 font-semibold' } }">
      <template #repertoire>
        <UVerticalNavigation :links="links" />
      </template>
    </UAccordion>
    <UButton block icon="i-ph-popcorn-duotone" :label="t('newProduction')" to="/" />
    <UAccordion color="gray" default-open :items="productionItems" variant="ghost" :ui="{ default: { class: 'hover:bg-gray-200 dark:hover:bg-gray-800 font-semibold' } }">
      <template #productions>
        <UVerticalNavigation v-if="getProductionNavigation.length" :links="getProductionNavigation" />
        <NoData v-else :message="t('noProductions')" />
      </template>
    </UAccordion>
  </UiPanelContent>
  <UiPanelFooter>
    <UDropdown :items="userItems">
      <UAvatar v-if="user?.user_metadata.avatar_url" :src="user.user_metadata.avatar_url" />
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
  </UiPanelFooter>
</template>

<i18n lang="yaml">
  en:
    repertoire: Repertoire
    models: Models
    personas: Personas
    assistants: Assistants
    relations: Relations
    scenarios: Scenarios
    worlds: Worlds
    newProduction: New Production
    productions: Productions
    noProductions: No productions yet
    account: Signed in as {email}
    colorMode: Color Mode
    colorTheme: Color Theme
    signOut: Sign Out
    signingOut: We are signing you out. Please wait.
</i18n>
