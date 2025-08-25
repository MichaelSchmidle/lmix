<template>
  <UButton
    icon="i-ph-trash"
    color="red"
    variant="ghost"
    square
    :disabled="assistantStore.busy"
    @click="isOpen = true"
  />

  <UModal
    v-model="isOpen"
    :ui="{ width: 'sm:max-w-md' }"
  >
    <UCard>
      <template #header>
        <h3 class="text-base font-semibold leading-6">
          {{ t('title') }}
        </h3>
      </template>

      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ t('description', { 
          name: assistant.name || `${assistant.persona?.name} + ${assistant.model?.name}` 
        }) }}
      </p>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="white"
            variant="ghost"
            :label="t('actions.cancel')"
            :disabled="assistantStore.busy"
            @click="isOpen = false"
          />
          <UButton
            color="red"
            :label="t('actions.delete')"
            :loading="assistantStore.busy"
            :disabled="assistantStore.busy"
            @click="handleDelete"
          />
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Assistant } from '~/types/assistants'

const props = defineProps<{
  assistant: Assistant
}>()

const { t } = useI18n()
const assistantStore = useAssistantStore()
const toast = useToast()
const router = useRouter()
const localePath = useLocalePath()

const isOpen = ref(false)

const handleDelete = async () => {
  try {
    await assistantStore.deleteAssistant(props.assistant.id)
    
    toast.add({
      color: 'success',
      icon: 'i-ph-check-circle-fill',
      title: t('success.title'),
      description: t('success.description', { 
        name: props.assistant.name || `${props.assistant.persona?.name} + ${props.assistant.model?.name}` 
      }),
    })
    
    isOpen.value = false
    
    // Navigate back to assistants list
    router.push(localePath({ name: 'assistants' }))
  } catch (error) {
    console.error(error)
    
    toast.add({
      color: 'error',
      icon: 'i-ph-x-circle-fill',
      title: t('error.title'),
      description: t('error.description'),
    })
  }
}
</script>

<i18n lang="yaml">
en:
  title: Delete Assistant
  description: "Are you sure you want to delete '{name}'? This action cannot be undone."
  actions:
    cancel: Cancel
    delete: Delete
  success:
    title: Assistant Deleted
    description: "Assistant '{name}' has been successfully deleted."
  error:
    title: Deletion Failed
    description: Failed to delete the assistant. Please try again.
</i18n>