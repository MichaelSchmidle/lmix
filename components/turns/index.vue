<script setup lang="ts">
import type { Turn } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const { m } = useMarkdown()
const toast = useToast()
const personaStore = usePersonaStore()
const { getPersona } = storeToRefs(personaStore)
const turnStore = useTurnStore()
const { getActiveTurnUuid, getAncestorTurnUuid, getChildTurnUuids, getTurn } = storeToRefs(turnStore)
const { insertAssistantTurn, deleteTurn } = turnStore

const props = defineProps({
  turn: {
    required: true,
    type: Object as PropType<Turn>,
  }
})

const turn = computed(() => turnStore.getTurn(props.turn.uuid))
const persona = computed(() => getPersona.value(turn.value?.message.metadata?.persona_uuid))
const name = computed(() => persona.value?.name || t('user'))
const childTurnUuids = computed(() => turnStore.getChildTurnUuids(props.turn.production_uuid, props.turn.uuid))
const activeTurnUuid = computed(() => getActiveTurnUuid.value(props.turn.uuid))
const ancestorTurnUuid = computed(() => turnStore.getAncestorTurnUuid(activeTurnUuid.value, childTurnUuids.value))
const siblingTurnUuids = computed(() => turnStore.getChildTurnUuids(props.turn.production_uuid, props.turn.parent_turn_uuid))

const items = [
  {
    icon: 'i-ph-arrows-clockwise',
    label: t('regenerate.label'),
    click: async () => {
      try {
        await insertAssistantTurn(
          props.turn.production_uuid,
          props.turn.assistant_uuid,
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
  },
  {
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
  },
]
</script>

<template>
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
        <div v-if="siblingTurnUuids.length">
          <UTooltip :text="t('navigation.back')">
            <UButton color="gray" icon="i-ph-arrow-u-up-left" size="xs" variant="ghost" />
          </UTooltip>
          <UTooltip :text="t('navigation.forward')">
            <UButton color="gray" icon="i-ph-arrow-u-up-right" size="xs" variant="ghost" />
          </UTooltip>
        </div>
        <UTooltip v-for="item in items" :key="item.label" :text="item.label">
          <UButton color="gray" :icon="item.icon" size="xs" variant="ghost" @click="item.click" />
        </UTooltip>
      </UiFormActions>
    </div>
  </UiMediaObject>
  <Turns v-if="ancestorTurnUuid" :turn="turn" />
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
