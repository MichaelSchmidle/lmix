<template>
  <UModal
    v-model:open="open"
    :title="t('title')"
    :description="t('description')"
  >
    <template #body>
      <PersonasUpsert @success="handleSuccess" />
    </template>

    <CreateButton
      v-bind="props"
      @click="open = true"
    />
  </UModal>
</template>

<script setup lang="ts">
import type { ButtonProps } from '#ui/types'
import type { Persona } from '~/types/personas'

const { t } = useI18n({ useScope: 'local' })

const props = withDefaults(
  defineProps<{
    block?: ButtonProps['block']
    color?: ButtonProps['color']
    label: ButtonProps['label']
    size?: ButtonProps['size']
    variant?: ButtonProps['variant']
  }>(),
  {
    block: true,
    color: 'primary',
    size: 'md',
    variant: 'outline',
  }
)

const emit = defineEmits<{
  success: [persona: Persona]
}>()

const open = ref(false)

const handleSuccess = (persona: Persona) => {
  open.value = false
  emit('success', persona)
}
</script>

<i18n lang="yaml">
en:
  title: Create New Persona
  description: Add a new character with their unique perspective and knowledge.
</i18n>
