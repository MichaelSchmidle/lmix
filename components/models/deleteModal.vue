<script setup lang="ts">
import type { Model } from '@/types/app'
import type { LMiXError } from '@/types/errors'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const modelStore = useModelStore()

const props = defineProps({
  model: {
    type: Object as PropType<Model>,
    required: true,
  },
})

const emits = defineEmits(['success'])

const isOpen = ref(false)
const isDeleting = ref(false)
const assistantsUsingModel = ref<{ name: string; uuid: string }[]>([])
const isInUse = computed(() => assistantsUsingModel.value.length > 0)

// Check if model is in use when component is mounted
onMounted(async () => {
  try {
    assistantsUsingModel.value = await modelStore.getModelAssistants(props.model.uuid)
  }
  catch (error) {
    // Log error in development
    if (import.meta.dev) {
      console.error('Failed to check model usage:', error)
    }
    // Default to empty list to allow deletion attempt
    assistantsUsingModel.value = []
  }
})

async function handleDelete() {
  try {
    isDeleting.value = true
    await modelStore.deleteModel(props.model.uuid)

    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle-duotone',
      title: t('success'),
    })

    emits('success')
  }
  catch (error) {
    // Log error in development
    if (import.meta.dev) {
      console.error('Model deletion failed:', error)
    }

    // Show appropriate error message based on error type
    const lmixError = error as LMiXError
    if (lmixError.code === 'MODEL_IN_USE') {
      toast.add({
        color: 'rose',
        icon: 'i-ph-x-circle-duotone',
        title: t('modelInUseError'),
      })
    }
    else {
      toast.add({
        color: 'rose',
        icon: 'i-ph-x-circle-duotone',
        title: t('error'),
      })
    }
  }
  finally {
    isDeleting.value = false
    isOpen.value = false
  }
}
</script>

<template>
  <div>
    <UButton color="gray" icon="i-ph-trash-duotone" :label="t('deleteModel.outside')" variant="ghost" @click="isOpen = true" />
    <UModal v-model="isOpen">
      <UCard :ui="{ body: { base: 'space-y-4' } }">
        <template #header>
          {{ t('title') }}
        </template>
        <div class="prose dark:prose-invert">
        <i18n-t v-if="!isInUse" keypath="deleteModelConfirmation" tag="p">
          <template #id>
            <code>{{ model.id }}</code>
          </template>
        </i18n-t>
        <template v-else>
          <i18n-t keypath="modelInUse.warning" tag="p" class="prose dark:prose-invert">
            <template #id>
              <code>{{ model.id }}</code>
            </template>
          </i18n-t>
          <ul>
            <li v-for="assistant in assistantsUsingModel" :key="assistant.uuid">
              <UButton :label="assistant.name" size="md" :to="`/assistants/${assistant.uuid}`" variant="link" />
            </li>
          </ul>
          <p class="mt-4">{{ t('modelInUse.hint') }}</p>
        </template>
      </div>
        <UiFormActions>
          <UButton color="gray" variant="ghost" :label="t('cancel')" @click="isOpen = false" />
          <UButton v-if="!isInUse" color="rose" icon="i-ph-trash-duotone" :label="t('deleteModel.inside')" :loading="isDeleting" @click="handleDelete" />
        </UiFormActions>
      </UCard>
    </UModal>
  </div>
</template>

<i18n lang="yaml">
  en:
    title: Remove Model
    deleteModel:
      outside: Remove…
      inside: Remove
    deleteModelConfirmation: Are you sure you want to remove {id}? This action cannot be undone.
    modelInUse:
      warning: 'Cannot remove {id} because it’s currently being used by these assistants:'
      hint: Please remove or reconfigure all assistants using this model first.
    modelInUseError: Cannot delete model because it is in use by one or more assistants.
    cancel: Cancel
    success: Model removed.
    error: Failed to remove model.
</i18n>
