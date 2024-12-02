<script setup lang="ts">
import type { Relation } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const relationStore = useRelationStore()
const { getRelationLabel } = storeToRefs(relationStore)

const props = defineProps({
  relation: {
    type: Object as PropType<Relation>,
    required: true,
  },
})

const emits = defineEmits(['success'])

const isOpen = ref(false)
const isDeleting = ref(false)
const relationLabel = computed(() => getRelationLabel.value(props.relation.uuid))

async function handleDelete() {
  try {
    isDeleting.value = true
    await relationStore.deleteRelation(props.relation.uuid)

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
    <UButton color="gray" icon="i-ph-trash-duotone" :label="t('deleteRelation.outside')" variant="ghost"
      @click="isOpen = true" />
    <UModal v-model="isOpen">
      <UCard :ui="{ body: { base: 'space-y-4' } }">
        <template #header>
          {{ t('title') }}
        </template>
        <i18n-t keypath="deleteRelationConfirmation" tag="p" class="prose dark:prose-invert">
          <template #label>
            <code>{{ relationLabel }}</code>
          </template>
        </i18n-t>
        <UiFormActions>
          <UButton color="gray" variant="ghost" :label="t('cancel')" size="lg" @click="isOpen = false" />
          <UButton color="rose" icon="i-ph-trash-duotone" :label="t('deleteRelation.inside')" :loading="isDeleting"
            size="lg" @click="handleDelete" />
        </UiFormActions>
      </UCard>
    </UModal>
  </div>
</template>

<i18n lang="yaml">
en:
  title: Remove Relation
  deleteRelation:
    outside: Remove…
    inside: Remove
  deleteRelationConfirmation: Are you sure you want to remove the relation between {label}? This action cannot be undone.
  cancel: Cancel
  success: Relation removed.
  error: Failed to remove relation.
</i18n>