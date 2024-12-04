<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
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
</script>

<template>
  <UiPanelHeader>
    <NavPanelBrand />
    <template v-if="isSlideover" #mainToggle>
      <UButton color="gray" icon="i-ph-x" variant="ghost" @click="$emit('close')" />
    </template>
  </UiPanelHeader>
  <UiPanelContent>
    <UAccordion color="gray" default-open :items="repertoireItems" variant="ghost"
      :ui="{ default: { class: 'hover:bg-gray-200 dark:hover:bg-gray-800 font-semibold' } }">
      <template #repertoire>
        <UVerticalNavigation :links="links" />
      </template>
    </UAccordion>
    <UButton block icon="i-ph-popcorn-duotone" :label="t('newProduction')" to="/" />
    <UAccordion color="gray" default-open :items="productionItems" variant="ghost"
      :ui="{ default: { class: 'hover:bg-gray-200 dark:hover:bg-gray-800 font-semibold' } }">
      <template #productions>
        <UVerticalNavigation v-if="getProductionNavigation.length" :links="getProductionNavigation" />
        <NoData v-else :message="t('noProductions')" />
      </template>
    </UAccordion>
  </UiPanelContent>
  <UiPanelFooter class="min-h-16">
    <NavPanelUserMenu />
    <NavPanelVersion />
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
</i18n>
