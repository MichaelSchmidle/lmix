<script setup lang="ts">
import type { Production } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const productionStore = useProductionStore()
const { getProductionAssistants, getProductionLabel } = storeToRefs(productionStore)

const props = defineProps({
  production: {
    required: true,
    type: Object as PropType<Production>,
  },
})
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
    <UiPanelContent>
      <Turns :messages="[]" />
      <ProductionsNoData :assistant-uuids="getProductionAssistants(production.uuid)" />
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
