<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { Turn, TurnUpdate } from '~/types/app'
import { LMiXError } from '~/types/errors'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const turnStore = useTurnStore()
const { updateTurn } = turnStore
const productionStore = useProductionStore()
const { getProductionAssistantUuids } = storeToRefs(productionStore)
const assistantStore = useAssistantStore()
const { getAssistantOptions } = storeToRefs(assistantStore)

const props = defineProps({
  turn: {
    type: Object as PropType<Turn>,
  },
})

const isModalOpen = ref(false)

const openModal = () => {
  isModalOpen.value = true
}

const handleSubmit = async (turn: TurnUpdate, node: FormKitNode) => {
  try {
    await updateTurn(turn)

    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle',
      title: t('success'),
    })

    isModalOpen.value = false
  }
  catch (error) {
    console.error(error)
    node.setErrors([error instanceof LMiXError ? t(error.message) : t('saveFailed')])
  }
}
</script>

<template>
  <slot :open-modal="openModal" />
  <UModal v-model="isModalOpen">
    <UCard>
      <template #header>
        {{ t('title') }}
      </template>
      <FormKit v-if="turn" :incomplete-message="false" type="form" :value="turn" @submit="handleSubmit">
        <FormKit v-if="turn.message.role === 'assistant'" type="dropdown" name="assistant_uuid"
          :label="t('assistant.label')"
          :options="getAssistantOptions(getProductionAssistantUuids(turn.production_uuid))" />
        <FormKit type="group" name="message">
          <FormKit type="group" name="content">
            <FormKit type="textarea" auto-height name="performance" :label="t('performance.label')"
              :help="t('performance.help')" />
            <template v-if="turn.message.role === 'assistant'">
              <FormKit type="group" name="vectors">
                <FormKit type="textarea" auto-height name="position" :label="t('vectors.position.label')" />
                <FormKit type="textarea" auto-height name="posture" :label="t('vectors.posture.label')" />
                <FormKit type="textarea" auto-height name="direction" :label="t('vectors.direction.label')" />
                <FormKit type="textarea" auto-height name="momentum" :label="t('vectors.momentum.label')" />
              </FormKit>
              <FormKit type="textarea" auto-height name="meta" :label="t('meta.label')" />
              <FormKit type="textarea" auto-height name="note_to_self" :label="t('noteToFutureSelf.label')" />
            </template>
          </FormKit>
        </FormKit>
        <FormKit v-if="turn.message.role === 'user'" type="checkbox" name="is_directive" :label="t('directive.label')"
          :help="t('directive.help')" />
        <template #actions="{ disabled }">
          <UiFormActions>
            <UButton color="gray" variant="ghost" :label="t('cancel')" @click="isModalOpen = false" />
            <UButton color="cyan" icon="i-ph-check" :label="t('submit')" :loading="(disabled as boolean)"
              type="submit" />
          </UiFormActions>
        </template>
      </FormKit>
    </UCard>
  </UModal>
</template>

<i18n lang="yaml">
en:
  title: Edit Turn
  assistant:
    label: Assistant
  performance:
    label: Performance
    help: Core dialogue or action that advances the scene. Write naturally, in-character, and with dramatic purpose.
  vectors:
    position:
      label: Position
      help: Spatial position relative to scene elements
    posture:
      label: Posture
      help: Physical stance and body language
    direction:
      label: Direction
      help: Facing or movement direction
    momentum:
      label: Momentum
      help: Quality and intention of movement
  meta:
    label: Meta Commentary
    help: In-character commentary on scene dynamics, written in first person from the persona’s perspective, breaking the fourth wall
  noteToFutureSelf:
    label: Note to Self
    help: Context bridge to next turn to help maintain modified state
  directive:
    label: Directive
    help: Provides instructions for the immediately following turn. Can be hidden in the production history.
  cancel: Cancel
  submit: Update
  success: Turn updated.
  saveFailed: Failed to save turn.
</i18n>
