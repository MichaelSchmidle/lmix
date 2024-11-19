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
</script>

<template>
  <UiPanel>
    <UiPanelHeader has-back-button>
      <template #toggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
      {{ getProductionLabel(production) }}
    </UiPanelHeader>
    <UiPanelContent>

    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
</i18n>
