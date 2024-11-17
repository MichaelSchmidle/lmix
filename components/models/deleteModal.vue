<script setup lang="ts">
import type { Model } from '@/types/app'

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
    <UButton color="rose" icon="i-ph-trash-duotone" :label="t('deleteModel.outside')" @click="isOpen = true" />
    <UModal v-model="isOpen">
      <UCard :ui="{ body: { base: 'space-y-4' } }">
        <template #header>
          {{ t('deleteModel.inside') }}
        </template>
        <i18n-t keypath="deleteModelConfirmation" tag="p" class="prose dark:prose-invert">
          <template #id>
            <code>{{ model.id }}</code>
          </template>
        </i18n-t>
        <UiFormActions>
          <UButton color="gray" variant="ghost" :label="t('cancel')" @click="isOpen = false" />
          <UButton color="rose" icon="i-ph-trash-duotone" :label="t('deleteModel.inside')" :loading="isDeleting" @click="handleDelete" />
        </UiFormActions>
      </UCard>
    </UModal>
  </div>
</template>

<i18n lang="yaml">
  en:
    deleteModel:
      outside: Remove Model…
      inside: Remove Model
    deleteModelConfirmation: Are you sure you want to delete {id}? This action cannot be undone.
    cancel: Cancel
    success: Model removed
    error: Failed to remove model
</i18n>
