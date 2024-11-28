<script setup lang="ts">
import type { Turn } from '~/types/app'
const { t } = useI18n({ useScope: 'local' })

const props = defineProps({
  turn: {
    type: Object as PropType<Turn>,
  },
})

const isModalOpen = ref(false)

const openModal = () => {
  isModalOpen.value = true
}
</script>

<template>
  <slot :open-modal="openModal" />
  <UModal v-model="isModalOpen">
    <UCard>
      <template #header>
        {{ t('title') }}
      </template>
      <FormKit :incomplete-message="false" type="form" :value="turn?.message.content">
        <FormKit type="textarea" auto-height name="performance" :label="t('performance.label')" :help="t('performance.help')" />
        <FormKit type="group" name="vectors">
          <FormKit type="textarea" auto-height name="position" :label="t('vectors.position.label')" />
          <FormKit type="textarea" auto-height name="posture" :label="t('vectors.posture.label')" />
          <FormKit type="textarea" auto-height name="direction" :label="t('vectors.direction.label')" />
          <FormKit type="textarea" auto-height name="momentum" :label="t('vectors.momentum.label')" />
        </FormKit>
        <FormKit type="textarea" auto-height name="meta" :label="t('meta.label')" />
        <FormKit type="textarea" auto-height name="note_to_future_self" :label="t('noteToFutureSelf.label')" />
        <template #actions="{ disabled }">
          <UiFormActions>
            <UButton color="gray" variant="ghost" :label="t('cancel')" @click="isModalOpen = false" />
            <UButton color="cyan" icon="i-ph-check" :label="t('submit')" :loading="(disabled as boolean)" type="submit" />
          </UiFormActions>
        </template>
      </FormKit>
    </UCard>
  </UModal>
</template>

<i18n lang="yaml">
en:
  title: Edit Turn
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
    label: Note to Future Self
    help: Context bridge to next turn to help maintain modified state
  submit: Update
  cancel: Cancel
</i18n>
