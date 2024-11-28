<script setup lang="ts">
import type { HorizontalNavigationLink } from '#ui/types'
import type { Persona, Turn } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const { m } = useMarkdown()
const toast = useToast()
const personaStore = usePersonaStore()
const { getPersona } = storeToRefs(personaStore)
const turnStore = useTurnStore()
const { getActiveTurnUuid, getAncestorTurnUuid, getChildTurnUuids, getTurn, getLatestDescendantTurn } = storeToRefs(turnStore)
const { insertAssistantTurn, deleteTurn, setActiveTurn } = turnStore

const props = defineProps({
  turn: {
    required: true,
    type: Object as PropType<Turn>,
  }
})

const turn = computed(() => getTurn.value(props.turn.uuid))
const persona = computed(() => turn.value?.message.metadata?.persona_uuid ? getPersona.value(turn.value?.message.metadata?.persona_uuid) : undefined)
const name = computed(() => persona.value?.name || t('user'))
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

const items: HorizontalNavigationLink[] = []

if (props.turn.assistant_uuid) {
  items.push({
    icon: 'i-ph-arrows-clockwise',
    label: t('regenerate.label'),
    click: async () => {
      try {
        await insertAssistantTurn(
          props.turn.production_uuid,
          props.turn.assistant_uuid!,
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
    },
  })
}

items.push({
    icon: 'i-ph-trash',
    label: t('delete.label'),
    click: async () => {
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
    },
  })
</script>

<template>
  <template v-if="turn">
    <UiMediaObject class="xl:gap-0">
      <template #media>
        <UTooltip class="xl:-ms-16" :text="name">
          <UAvatar :alt="name" size="md" />
        </UTooltip>
      </template>
      <div class="space-y-4">
        <div class="prose dark:prose-invert prose-a:text-primary prose-headings:font-serif"
          v-html="m(turn.message.content.performance, true)" />
        <UiFormActions>
          <div v-if="siblingTurnUuids.length > 1">
            <UTooltip :text="t('navigation.back')">
              <UButton 
                color="gray" 
                icon="i-ph-arrow-u-up-left" 
                size="xs" 
                variant="ghost"
                :disabled="currentSiblingIndex <= 0"
                @click="navigateToSibling('back')" 
              />
            </UTooltip>
            <UTooltip :text="t('navigation.forward')">
              <UButton 
                color="gray" 
                icon="i-ph-arrow-u-up-right" 
                size="xs" 
                variant="ghost"
                :disabled="currentSiblingIndex === -1 || currentSiblingIndex >= siblingTurnUuids.length - 1"
                @click="navigateToSibling('forward')" 
              />
            </UTooltip>
          </div>
          <UTooltip v-for="item in items" :key="item.label" :text="item.label">
            <UButton color="gray" :icon="item.icon" size="xs" variant="ghost" @click="item.click" />
          </UTooltip>
        </UiFormActions>
      </div>
    </UiMediaObject>
    <Turns v-if="ancestorTurn" :turn="ancestorTurn" />
  </template>
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
  delete:
    label: Remove
    success: Turn removed.
    error: Failed to remove turn.
</i18n>
