<script setup lang="ts">
import type { VerticalNavigationLink } from '#ui/types'

const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const productionStore = useProductionStore()

await productionStore.selectProduction(route.params.id as string)
const { getProduction, getProductionAssistants, getProductionLabel, getProductionPersonas, getProductionRelationships } = storeToRefs(productionStore)
const production = getProduction.value(route.params.id as string)

if (!production) {
  showError({
    statusCode: 404,
    message: t('productionNotFound'),
  })
}

const personaStore = usePersonaStore()
const { getPersonaNavigation } = storeToRefs(personaStore)
const assistantStore = useAssistantStore()
const { getAssistantNavigation } = storeToRefs(assistantStore)
const relationshipStore = useRelationshipStore()
const { getRelationshipNavigation } = storeToRefs(relationshipStore)
const scenarioStore = useScenarioStore()
const { getScenarioNavigation } = storeToRefs(scenarioStore)
const worldStore = useWorldStore()
const { getWorldNavigation } = storeToRefs(worldStore)

useHead({
  title: t('metaTitle', { name: getProductionLabel.value(production!) }),
})

const accordionItems = ref([
  {
    label: t('ensemble'),
    slot: 'ensemble',
  },
])

const personaNavigation = ref<VerticalNavigationLink[]>([])
const assistantNavigation = ref<VerticalNavigationLink[]>([])
const relationshipNavigation = ref<VerticalNavigationLink[]>([])
const scenarioNavigation = ref<VerticalNavigationLink[]>([])
const worldNavigation = ref<VerticalNavigationLink[]>([])

if (production) {
  personaNavigation.value = getPersonaNavigation.value(getProductionPersonas.value(production.uuid), 'i-ph-mask-happy')
  assistantNavigation.value = getAssistantNavigation.value(getProductionAssistants.value(production.uuid), 'i-ph-head-circuit')
  relationshipNavigation.value = getRelationshipNavigation.value(getProductionRelationships.value(production.uuid), 'i-ph-share-network')

  if (production.scenario_uuid) {
    scenarioNavigation.value = getScenarioNavigation.value([production.scenario_uuid], 'i-ph-panorama')
  }

  if (production.world_uuid) {
    worldNavigation.value = getWorldNavigation.value([production.world_uuid], 'i-ph-planet')
  }
}
</script>

<template>
  <UiPanel v-if="production" class="bg-gray-50 dark:bg-gray-950 max-w-[200px]">
    <UiPanelHeader has-back-button>
      {{ t('title') }}
    </UiPanelHeader>
    <UiPanelContent>
      <UButton block :label="t('upsert')" icon="i-ph-gear-duotone" :to="`/productions/${production?.uuid}/edit`" />
      <UAccordion color="gray" default-open :items="accordionItems" variant="ghost" :ui="{ default: { class: 'hover:bg-gray-200 dark:hover:bg-gray-800 font-semibold' } }">
        <template #ensemble>
          <UVerticalNavigation :links="personaNavigation" />
          <UVerticalNavigation :links="assistantNavigation" />
          <UVerticalNavigation :links="relationshipNavigation" />
          <UVerticalNavigation :links="scenarioNavigation" />
          <UVerticalNavigation :links="worldNavigation" />
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
