<script setup lang="ts">
import type { Production } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const productionStore = useProductionStore()
const { getProductionAssistantUuids, getProductionLabel } = storeToRefs(productionStore)
const assistantStore = useAssistantStore()
const { getAssistant } = storeToRefs(assistantStore)
const turnStore = useTurnStore()
const { getStreamingState } = storeToRefs(turnStore)
const { insertAssistantTurn } = turnStore

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

const handleAssistantKickoff = async (assistantUuid: string) => {
  await insertAssistantTurn(props.production.uuid, assistantUuid)
}
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
      <ProductionsNoData v-else :production-uuid="production.uuid" />
      <div class="flex flex-wrap gap-x-4 gap-y-3 justify-center">
        <UButton v-for="assistantUuid in getProductionAssistantUuids(production.uuid)" :key="assistantUuid" color="cyan"
          :loading="getStreamingState.isStreaming" icon="i-ph-play-circle-duotone"
          :label="getAssistant(assistantUuid)?.name" @click="handleAssistantKickoff(assistantUuid)" />
      </div>
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
