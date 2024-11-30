<script setup lang="ts">
import type { DropdownItem } from '#ui/types'
import type { Turn } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const user = useSupabaseUser()
const { m } = useMarkdown()
const toast = useToast()
const personaStore = usePersonaStore()
const { getPersona } = storeToRefs(personaStore)
const turnStore = useTurnStore()
const { getActiveTurnUuid, getAncestorTurnUuid, getChildTurnUuids, getLatestDescendantTurn, getStreamingState, getTurn } = storeToRefs(turnStore)
const { insertAssistantTurn, deleteTurn, setActiveTurn } = turnStore
const productionStore = useProductionStore()
const { getProduction, getProductionAssistantUuids } = storeToRefs(productionStore)
const assistantStore = useAssistantStore()
const { getAssistant } = storeToRefs(assistantStore)

const props = defineProps({
  turn: {
    required: true,
    type: Object as PropType<Turn>,
  }
})

const production = computed(() => getProduction.value(props.turn.production_uuid))
const turn = computed(() => getTurn.value(props.turn.uuid))
const persona = computed(() => turn.value?.message.metadata?.persona_uuid ? getPersona.value(turn.value?.message.metadata?.persona_uuid) : undefined)
const name = computed(() => persona.value?.name || (turn.value?.message.role === 'assistant' ? turn.value?.message.content.persona_name : user.value?.user_metadata.name || t('user')))
const avatarUrl = computed(() => persona.value?.avatar_url || (turn.value?.message.role === 'user' ? user.value?.user_metadata.avatar_url : undefined))
const siblingTurnUuids = computed(() => getChildTurnUuids.value(props.turn.production_uuid, props.turn.parent_turn_uuid))
const childTurnUuids = computed(() => getChildTurnUuids.value(props.turn.production_uuid, props.turn.uuid))
const activeTurnUuid = computed(() => getActiveTurnUuid.value(props.turn.production_uuid))
const ancestorTurnUuid = computed(() => activeTurnUuid.value ? getAncestorTurnUuid.value(activeTurnUuid.value, childTurnUuids.value) : undefined)
const ancestorTurn = computed(() => ancestorTurnUuid.value ? getTurn.value(ancestorTurnUuid.value) : undefined)
const currentSiblingIndex = computed(() => {
  const currentTurnUuid = activeTurnUuid.value
  if (!currentTurnUuid) return -1

  // Find the ancestor of the active turn that is in our siblings list
  const ancestorUuid = getAncestorTurnUuid.value(currentTurnUuid, siblingTurnUuids.value)
  if (!ancestorUuid) return -1

  return siblingTurnUuids.value.indexOf(ancestorUuid)
})

const navigateToSibling = (direction: 'back' | 'forward') => {
  const currentIndex = currentSiblingIndex.value
  if (currentIndex === -1) return

  const newIndex = direction === 'back' ? currentIndex - 1 : currentIndex + 1
  if (newIndex < 0 || newIndex >= siblingTurnUuids.value.length) return

  const siblingUuid = siblingTurnUuids.value[newIndex]
  const latestDescendant = getLatestDescendantTurn.value(siblingUuid)
  if (latestDescendant) {
    setActiveTurn(props.turn.production_uuid, latestDescendant.uuid)
  }
}

const items = computed(() => {
  const assistantUuids = getProductionAssistantUuids.value(props.turn.production_uuid)
  return assistantUuids.map((assistantUuid: string) => {
    return [{
      click: () => handleRegenerateTurn(assistantUuid),
      label: getAssistant.value(assistantUuid)?.name,
      icon: 'i-ph-head-circuit',
    }] as DropdownItem[]
  })
})

const showTurn = computed(() => {
  return props.turn.is_directive ? production.value?.show_directives : true
})

const handleRegenerateTurn = async (assistantUuid: string) => {
  try {
    await insertAssistantTurn(
      props.turn.production_uuid,
      assistantUuid,
      props.turn.parent_turn_uuid,
    )
  }
  catch (e) {
    console.error(e)
    toast.add({
      color: 'rose',
      icon: 'i-ph-x-circle',
      title: t('regenerate.error'),
    })
  }
}

const handleDeleteTurn = async () => {
  try {
    await deleteTurn(props.turn.uuid)
    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle',
      title: t('delete.success'),
    })
  }
  catch (e) {
    console.error(e)
    toast.add({
      color: 'rose',
      icon: 'i-ph-x-circle',
      title: t('delete.error'),
    })
  }
}
</script>

<template>
  <div v-if="turn && showTurn" class="space-y-4" v-auto-animate>
    <UiMediaObject class="xl:gap-0" :key="turn.created_at">
      <template #media>
        <UTooltip class="xl:-ms-16" :text="name">
          <UAvatar class="prose" :alt="name" size="md" :src="avatarUrl" />
        </UTooltip>
      </template>
      <div
        :class="['prose dark:prose-invert prose-a:text-primary prose-headings:font-serif', turn.is_directive ? 'prose-sm' : undefined]"
        v-html="m(turn.message.content.performance, true)" />
    </UiMediaObject>
    <div class="grid sm:grid-cols-2 gap-4">
      <div class="flex gap-2">
        <UiBadgesDirective v-if="turn.is_directive" />
        <div v-if="getStreamingState.isStreaming && getStreamingState.turnUuid === turn.uuid"
          class="animate-pulse flex gap-2" :ui="{ rounded: 'rounded-full' }">
          <UBadge v-for="property in getStreamingState.streamingProperties" :key="property" color="gray" size="xs"
            variant="soft" :ui="{ rounded: 'rounded-full' }">
            {{ t(`streaming.${property}`) }}
          </UBadge>
        </div>
      </div>
      <UiFormActions class="gap-2" v-auto-animate>
        <div v-if="siblingTurnUuids.length > 1">
          <UTooltip :popper="{ placement: 'top' }" :text="t('navigation.back')">
            <UButton color="gray" icon="i-ph-arrow-u-up-left" size="2xs" variant="ghost"
              :disabled="currentSiblingIndex <= 0 || getStreamingState.isStreaming"
              @click="navigateToSibling('back')" />
          </UTooltip>
          <UTooltip :popper="{ placement: 'top' }" :text="t('navigation.forward')">
            <UButton color="gray" icon="i-ph-arrow-u-up-right" size="2xs" variant="ghost"
              :disabled="currentSiblingIndex === -1 || currentSiblingIndex >= siblingTurnUuids.length - 1 || getStreamingState.isStreaming"
              @click="navigateToSibling('forward')" />
          </UTooltip>
        </div>
        <UTooltip v-if="turn.assistant_uuid" :popper="{ placement: 'top' }" :text="t('regenerate.label')">
          <UButton color="gray" :disabled="getStreamingState.isStreaming" icon="i-ph-arrow-clockwise" size="2xs"
            variant="ghost" @click="handleRegenerateTurn(turn.assistant_uuid)" />
        </UTooltip>
        <UTooltip v-if="turn.assistant_uuid" :popper="{ placement: 'top' }" :text="t('switch.label')">
          <UDropdown :items="items">
            <UButton color="gray" :disabled="getStreamingState.isStreaming" icon="i-ph-user-switch" size="2xs"
              variant="ghost" />
          </UDropdown>
        </UTooltip>
        <UTooltip :popper="{ placement: 'top' }" :text="t('edit.label')">
          <TurnsUpdate :turn="turn" #default="{ openModal }">
            <UButton color="gray" :disabled="getStreamingState.isStreaming" icon="i-ph-eye" size="2xs" variant="ghost"
              @click="openModal" />
          </TurnsUpdate>
        </UTooltip>
        <UTooltip :popper="{ placement: 'top' }" :text="t('delete.label')">
          <UButton color="gray" :disabled="getStreamingState.isStreaming" icon="i-ph-trash" size="2xs" variant="ghost"
            @click="handleDeleteTurn" />
        </UTooltip>
      </UiFormActions>
    </div>
  </div>
  <Turns v-if="ancestorTurn" :turn="ancestorTurn" />
</template>

<i18n lang="yaml">
en:
  user: User
  navigation:
    back: Back
    forward: Forward
  regenerate:
    label: Regenerate
    error: Failed to regenerate turn.
  switch:
    label: Regenerate with…
    error: Failed to regenerate turn.
  edit:
    label: Show & edit details…
  delete:
    label: Remove
    success: Turn removed.
    error: Failed to remove turn.
  streaming:
    performance: Performing
    vectors: Vectorizing
    meta: Commenting
    note_to_self: Noting
</i18n>
