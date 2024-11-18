<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const productionStore = useProductionStore()
const { getProduction, getProductionLabel } = storeToRefs(productionStore)
const assistantStore = useAssistantStore()
const { getAssistantNavigation } = storeToRefs(assistantStore)
const personaStore = usePersonaStore()
const { getPersonaNavigation } = storeToRefs(personaStore)
const relationshipStore = useRelationshipStore()
const { getRelationshipNavigation } = storeToRefs(relationshipStore)
const production = getProduction.value(route.params.id as string)

useHead({
  title: t('title', { name: production?.name }),
})

if (!production) {
  showError({
    statusCode: 404,
    message: t('productionNotFound'),
  })
}

useHead({
  title: t('metaTitle', { name: getProductionLabel.value(production!) }),
})

definePageMeta({
  middleware: [
    'assistants',
    'personas',
    'relationships',
    'scenarios',
    'worlds',
  ],
})

const accordionItems = ref([
  {
    label: t('ensemble'),
    slot: 'ensemble',
  },
])
</script>

<template>
  <UiPanel class="bg-gray-50 dark:bg-gray-950 max-w-[200px]">
    <UiPanelHeader has-back-button>
      {{ t('title') }}
    </UiPanelHeader>
    <UiPanelContent>
      <UButton block :label="t('upsert')" icon="i-ph-gear-duotone" :to="`/productions/${production?.uuid}/edit`" />
      <UAccordion color="gray" default-open :items="accordionItems" variant="ghost" :ui="{ default: { class: 'hover:bg-gray-200 dark:hover:bg-gray-800 font-semibold' } }">
        <template #ensemble>
          <UVerticalNavigation v-if="production?.production_personas?.length" :links="getPersonaNavigation(production?.production_personas, 'i-ph-mask-happy')" />
          <UVerticalNavigation v-if="production?.production_assistants?.length" :links="getAssistantNavigation(production?.production_assistants, 'i-ph-head-circuit')" />
          <UVerticalNavigation v-if="production?.production_relationships?.length" :links="getRelationshipNavigation(production?.production_relationships, 'i-ph-share-network')" />
          <UVerticalNavigation v-if="production?.scenario" :links="[{ label: production.scenario?.name, to: `/scenarios/${production?.scenario_uuid}`, icon: 'i-ph-panorama' }]" />
          <UVerticalNavigation v-if="production?.world" :links="[{ label: production.world?.name, to: `/worlds/${production?.world_uuid}`, icon: 'i-ph-planet' }]" />
        </template>
      </UAccordion>
    </UiPanelContent>
  </UiPanel>
  <NuxtPage />
</template>

<i18n lang="yaml">
  en:
    metaTitle: Production {name}
    title: Production
    productionNotFound: Production not found
    ensemble: Ensemble
    upsert: Settings
</i18n>
