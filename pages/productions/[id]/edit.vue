<script setup lang="ts">
import type { Production } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const productionStore = useProductionStore()
const { getProductionLabel } = storeToRefs(productionStore)

definePageMeta({
  middleware: [
    'assistants',
    'personas',
    'relations',
    'scenarios',
    'worlds',
  ],
})

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
      <ProductionsUpsert :production="production" />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
</i18n>
