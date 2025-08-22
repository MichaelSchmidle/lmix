<template>
  <UDashboardPanel id="models-edit-panel">
    <template #header>
      <UDashboardNavbar
        :title="title"
        toggle-side="right"
      >
        <template #leading>
          <UButton
            class="xl:hidden"
            color="neutral"
            icon="i-ph-arrow-left"
            :to="localeRoute('models')"
            variant="ghost"
          />
        </template>
        <template #trailing>
          <UButton
            color="red"
            variant="ghost"
            icon="i-ph-trash"
            @click="confirmDelete"
          >
            {{ t('delete') }}
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-ph-spinner" class="animate-spin text-2xl" />
      </div>
      
      <div v-else-if="!model" class="text-center py-8">
        <p class="text-gray-500">{{ t('notFound') }}</p>
      </div>
      
      <div v-else class="max-w-4xl mx-auto p-6">
        <ModelsForm
          :model="model"
          :loading="saving"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </div>
    </template>
  </UDashboardPanel>

  <!-- Delete Confirmation Modal -->
  <UModal v-model="showDeleteModal">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">{{ t('confirmDelete') }}</h3>
      </template>

      <p class="text-gray-600 dark:text-gray-400">
        {{ t('deleteMessage', { name: model?.name }) }}
      </p>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            @click="showDeleteModal = false"
          >
            {{ t('cancel') }}
          </UButton>
          <UButton
            color="red"
            @click="deleteModel"
            :loading="deleting"
          >
            {{ t('delete') }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Model } from '~/stores/models'

const { t } = useI18n()
const localeRoute = useLocalePath()
const router = useRouter()
const route = useRoute()
const modelsStore = useModelsStore()
const toast = useToast()

const modelId = route.params.id as string
const model = ref<Model | null>(null)
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const showDeleteModal = ref(false)

const title = computed(() => model.value?.name || t('edit'))

useHead({
  title: title.value,
})

// Load model on mount
onMounted(async () => {
  try {
    await modelsStore.fetchModels()
    model.value = modelsStore.getModelById(modelId) || null
  } finally {
    loading.value = false
  }
})

async function handleSubmit(data: any) {
  saving.value = true
  
  try {
    await modelsStore.updateModel(modelId, data)
    toast.add({
      title: t('success'),
      description: t('updateSuccess'),
      color: 'success'
    })
    router.push(localeRoute('/models'))
  } catch (error) {
    toast.add({
      title: t('error'),
      description: error instanceof Error ? error.message : t('updateFailed'),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  router.push(localeRoute('/models'))
}

function confirmDelete() {
  showDeleteModal.value = true
}

async function deleteModel() {
  if (!model.value) return
  
  deleting.value = true
  try {
    await modelsStore.deleteModel(modelId)
    toast.add({
      title: t('success'),
      description: t('deleteSuccess'),
      color: 'success'
    })
    router.push(localeRoute('/models'))
  } catch (error) {
    toast.add({
      title: t('error'),
      description: error instanceof Error ? error.message : t('deleteFailed'),
      color: 'error'
    })
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}
</script>

<i18n lang="yaml">
en:
  edit: Edit Model
  delete: Delete
  notFound: Model not found
  confirmDelete: Confirm Delete
  deleteMessage: Are you sure you want to delete "{name}"? This action cannot be undone.
  cancel: Cancel
  success: Success
  error: Error
  updateSuccess: Model updated successfully
  updateFailed: Failed to update model
  deleteSuccess: Model deleted successfully
  deleteFailed: Failed to delete model
</i18n>