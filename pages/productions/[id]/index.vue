<script setup lang="ts">
import type { Production } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const productionStore = useProductionStore()
const { getProductionAssistantUuids, getProductionLabel } = storeToRefs(productionStore)
const assistantStore = useAssistantStore()
const { getAssistant } = storeToRefs(assistantStore)
const turnStore = useTurnStore()
const { getActiveTurnUuid, getAncestorTurnUuid, getChildTurnUuids, getStreamingState, getTurn } = storeToRefs(turnStore)
const { insertAssistantTurn } = turnStore

const props = defineProps({
  production: {
    required: true,
    type: Object as PropType<Production>,
  },
})

// Fetch turns
await turnStore.selectTurns(props.production.uuid)

// Get active top-level turn for this production
const childTurnUuids = computed(() => getChildTurnUuids.value(props.production.uuid, null))
const activeTurnUuid = computed(() => getActiveTurnUuid.value(props.production.uuid))
const ancestorTurnUuid = computed(() => getAncestorTurnUuid.value(activeTurnUuid.value, childTurnUuids.value))
const turn = computed(() => getTurn.value(ancestorTurnUuid.value))

const handleAssistantTurn = async (assistantUuid: string) => {
  try {
    await insertAssistantTurn(props.production.uuid, assistantUuid)
  }
  catch (e) {
    toast.add({
      color: 'rose',
      icon: 'i-ph-x-circle-duotone',
      title: t('insert.error'),
    })
  }
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
      <UContainer v-auto-animate>
        <Turns v-if="ancestorTurnUuid" :turn="turn" />
        <ProductionsNoData v-else :production-uuid="production.uuid" />
        <div class="flex flex-wrap gap-x-4 gap-y-3 justify-center">
          <UButton v-for="assistantUuid in getProductionAssistantUuids(production.uuid)" :key="assistantUuid"
            color="cyan" :disabled="getStreamingState.isStreaming"
            :loading="getStreamingState.isStreaming && getStreamingState.assistantUuid === assistantUuid"
            icon="i-ph-paper-plane-tilt-duotone" :label="getAssistant(assistantUuid)?.name"
            @click="handleAssistantTurn(assistantUuid)" />
        </div>
      </UContainer>
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
  insert:
    error: Failed to insert turn.
</i18n>
