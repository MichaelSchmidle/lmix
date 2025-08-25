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
                <code>{{ world.name }}</code>
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
          {{ errorMessage }}
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
import type { World } from '~/types/worlds'

const { t } = useI18n()
const worldStore = useWorldStore()
const localeRoute = useLocaleRoute()
const toast = useToast()

const props = defineProps<{
  world: World
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
    await worldStore.deleteWorld(props.world.id)

    toast.add({
      color: 'success',
      icon: 'i-ph-check-circle-fill',
      title: t('success.title'),
      description: t('success.description', { name: props.world.name }),
    })

    // Navigate to worlds index after successful deletion
    await navigateTo(localeRoute('worlds'))
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : t('error.description')
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
    description: Deleting a world requires confirmation.
  content:
    title: Delete World
    description: You are about to remove the world {name} from LMiX.
    alert:
      title: Warning
      description: Deleting a world is permanent and cannot be undone. Are you sure you want to delete it?
  cancel: Cancel
  delete: Delete
  success:
    title: World Deleted
    description: The world has been successfully deleted.
  error:
    description: Failed to delete the world. Please try again.
</i18n>