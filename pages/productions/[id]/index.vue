<script setup lang="ts">
import type { Production } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const productionStore = useProductionStore()
const { getProductionLabel } = storeToRefs(productionStore)

const props = defineProps({
  production: {
    required: true,
    type: Object as PropType<Production>,
  },
})

useHead({
  title: t('title', { label: getProductionLabel.value(props.production) }),
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
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>

    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: Production {label}
</i18n>
