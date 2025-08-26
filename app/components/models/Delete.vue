<template>
  <UModal
    v-model:open="open"
    :dismissible="!isDeleting"
    :title="t('modal.title')"
    :description="t('modal.description')"
  >
    <template #content>
      <UPageCard :title="t('content.title')">
        <template #description>
          <i18n-t keypath="content.description">
            <template #name>
              <span class="prose dark:prose-invert">
                <code>{{ model.name }}</code>
              </span>
            </template>
          </i18n-t>
        </template>

        <UAlert
          color="warning"
          icon="i-ph-warning-fill"
          :title="t('content.alert.title')"
          :description="t('content.alert.description')"
        />

        <p
          v-if="errorMessage"
          class="text-error text-sm"
        >
          {{ t('error') }}
        </p>

        <div class="flex gap-x-4 justify-end mt-6">
          <UButton
            color="neutral"
            :label="t('cancel')"
            variant="ghost"
            :disabled="isDeleting"
            @click="handleClose"
          />

          <UButton
            color="error"
            icon="i-ph-trash-simple-fill"
            :label="t('delete')"
            :loading="isDeleting"
            @click="handleDelete"
          />
        </div>
      </UPageCard>
    </template>

    <UButton
      color="error"
      icon="i-ph-trash-simple-fill"
      :label="t('delete')"
      size="sm"
      variant="ghost"
    />
  </UModal>
</template>

<script setup lang="ts">
import type { Model } from '~/types/models'
const { t } = useI18n()
const modelStore = useModelStore()
const localeRoute = useLocaleRoute()
const toast = useToast()

const props = defineProps<{
  model: Model
}>()

const open = ref(false)
const isDeleting = ref(false)
const errorMessage = ref<string | null>(null)

const handleClose = () => {
  if (!isDeleting.value) {
    open.value = false
    errorMessage.value = null
  }
}

const handleDelete = async () => {
  isDeleting.value = true
  errorMessage.value = null

  try {
    await modelStore.deleteModel(props.model.id)

    toast.add({
      color: 'success',
      icon: 'i-ph-check-circle-fill',
      title: t('success.title'),
      description: t('success.description', { name: props.model.name }),
    })

    // Navigate to models index after successful deletion
    await navigateTo(localeRoute('models'))
  } catch (error) {
    console.error('Failed to delete model:', error)
    errorMessage.value = t('error')
  } finally {
    isDeleting.value = false
  }
}

// Clear error when modal opens
watch(open, (newValue) => {
  if (newValue) {
    errorMessage.value = null
  }
})
</script>

<i18n lang="yaml">
en:
  modal:
    title: Confirm Deletion
    description: Deleting a model requires confirmation.
  content:
    title: Delete Model
    description: You are about to remove the model {name} from LMiX.
    alert:
      title: Warning
      description: Deleting a model is permanent and cannot be undone. Are you sure you want to delete it?
  cancel: Cancel
  delete: Delete
  success:
    title: Model Deleted
    description: The model has been successfully deleted.
  error: Failed to delete the model. Please try again.
</i18n>
