<script setup lang="ts">
import type { Assistant } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const assistantStore = useAssistantStore()

const props = defineProps({
  assistant: {
    type: Object as PropType<Assistant>,
    required: true,
  },
})

const emits = defineEmits(['success'])

const isOpen = ref(false)
const isDeleting = ref(false)

async function handleDelete() {
  try {
    isDeleting.value = true
    await assistantStore.deleteAssistant(props.assistant.uuid)

    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle-duotone',
      title: t('success'),
    })

    emits('success')
  }
  catch (error) {
    console.error(error)
    toast.add({
      color: 'rose',
      icon: 'i-ph-x-circle-duotone',
      title: t('error'),
    })
  }
  finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div>
    <UButton color="gray" icon="i-ph-trash-duotone" :label="t('deleteAssistant.outside')" variant="ghost" @click="isOpen = true" />
    <UModal v-model="isOpen">
      <UCard :ui="{ body: { base: 'space-y-4' } }">
        <template #header>
          {{ t('title') }}
        </template>
        <i18n-t keypath="deleteAssistantConfirmation" tag="p" class="prose dark:prose-invert">
          <template #name>
            <code>{{ assistant.name }}</code>
          </template>
        </i18n-t>
        <UiFormActions>
          <UButton color="gray" variant="ghost" :label="t('cancel')" @click="isOpen = false" />
          <UButton color="rose" icon="i-ph-trash-duotone" :label="t('deleteAssistant.inside')" :loading="isDeleting" @click="handleDelete" />
        </UiFormActions>
      </UCard>
    </UModal>
  </div>
</template>

<i18n lang="yaml">
  en:
    title: Remove Assistant
    deleteAssistant:
      outside: Remove…
      inside: Remove
    deleteAssistantConfirmation: Are you sure you want to remove {name}? This action cannot be undone.
    cancel: Cancel
    success: Assistant removed.
    error: Failed to remove assistant.
</i18n>