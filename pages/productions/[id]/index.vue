<script setup lang="ts">
import type { Production } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const productionStore = useProductionStore()
const turnStore = useTurnStore()
const { getProductionAssistants, getProductionLabel } = storeToRefs(productionStore)

const props = defineProps({
  production: {
    required: true,
    type: Object as PropType<Production>,
  },
})

// Fetch turns
await turnStore.selectTurns(props.production.uuid)

// Get turns for this production
const turns = computed(() => turnStore.getProductionTurns(props.production.uuid))
</script>

<template>
  <UiPanel>
    <UiPanelHeader>
      <template #domainToggle>
        <ProductionsPanelSlideover class="lg:hidden" :production="production" />
      </template>
      {{ getProductionLabel(production) }}
      <template #mainToggle>
        <NavPanelSlideover class="xl:hidden" :production="production" />
      </template>
    </UiPanelHeader>
    <UiPanelContent v-auto-animate>
      <Turns v-if="turns.length" :turns="turns" />
      <ProductionsNoData v-else :production-uuid="production.uuid" :assistant-uuids="getProductionAssistants(production.uuid)" />
    </UiPanelContent>
    <UiPanelFooter>
      <UContainer class="max-w-prose w-full">
        <TurnsUpsert :production="production" />
      </UContainer>
    </UiPanelFooter>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
</i18n>
