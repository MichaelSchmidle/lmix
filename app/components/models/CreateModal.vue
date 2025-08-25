<template>
  <UModal
    v-model:open="open"
    :title="t('title')"
    :description="t('description')"
  >
    <template #body>
      <ModelsInsert @success="handleSuccess" />
    </template>

    <CreateButton
      v-bind="props"
      @click="open = true"
    />
  </UModal>
</template>

<script setup lang="ts">
import type { ButtonProps } from '#ui/types'
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

const open = ref(false)

const handleSuccess = () => {
  open.value = false
}
</script>

<i18n lang="yaml">
en:
  title: Create New Models
  description: Add new models to power your assistants.
</i18n>
