<script setup lang="ts">
import type { Relationship } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const relationshipStore = useRelationshipStore()
const { getRelationshipLabel } = storeToRefs(relationshipStore)

const props = defineProps({
  relationship: {
    type: Object as PropType<Relationship>,
    required: true,
  },
})

const emits = defineEmits(['success'])

const isOpen = ref(false)
const isDeleting = ref(false)
const relationshipLabel = computed(() => getRelationshipLabel.value(props.relationship.uuid))

async function handleDelete() {
  try {
    isDeleting.value = true
    await relationshipStore.deleteRelationship(props.relationship.uuid)

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
    <UButton color="gray" icon="i-ph-trash-duotone" :label="t('deleteRelationship.outside')" variant="ghost" @click="isOpen = true" />
    <UModal v-model="isOpen">
      <UCard :ui="{ body: { base: 'space-y-4' } }">
        <template #header>
          {{ t('title') }}
        </template>
        <i18n-t keypath="deleteRelationshipConfirmation" tag="p" class="prose dark:prose-invert">
          <template #label>
            <code>{{ relationshipLabel }}</code>
          </template>
        </i18n-t>
        <UiFormActions>
          <UButton color="gray" variant="ghost" :label="t('cancel')" @click="isOpen = false" />
          <UButton color="rose" icon="i-ph-trash-duotone" :label="t('deleteRelationship.inside')" :loading="isDeleting" @click="handleDelete" />
        </UiFormActions>
      </UCard>
    </UModal>
  </div>
</template>

<i18n lang="yaml">
  en:
    title: Remove Relationship
    deleteRelationship:
      outside: Remove…
      inside: Remove
    deleteRelationshipConfirmation: Are you sure you want to remove the relationship between {label}? This action cannot be undone.
    cancel: Cancel
    success: Relationship removed.
    error: Failed to remove relationship.
</i18n>