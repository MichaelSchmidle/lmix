<script setup lang="ts">
import type { World } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const worldStore = useWorldStore()

const props = defineProps({
  world: {
    type: Object as PropType<World>,
    required: true,
  },
})

const emits = defineEmits(['success'])

const isOpen = ref(false)
const isDeleting = ref(false)

async function handleDelete() {
  try {
    isDeleting.value = true
    await worldStore.deleteWorld(props.world.uuid)

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
    <UButton color="gray" icon="i-ph-trash-duotone" :label="t('deleteWorld.outside')" variant="ghost"
      @click="isOpen = true" />
    <UModal v-model="isOpen">
      <UCard :ui="{ body: { base: 'space-y-4' } }">
        <template #header>
          {{ t('title') }}
        </template>
        <i18n-t keypath="deleteWorldConfirmation" tag="p" class="prose dark:prose-invert">
          <template #name>
            <code>{{ world.name }}</code>
          </template>
        </i18n-t>
        <UiFormActions>
          <UButton color="gray" variant="ghost" :label="t('cancel')" size="lg" @click="isOpen = false" />
          <UButton color="rose" icon="i-ph-trash-duotone" :label="t('deleteWorld.inside')" :loading="isDeleting"
            size="lg" @click="handleDelete" />
        </UiFormActions>
      </UCard>
    </UModal>
  </div>
</template>

<i18n lang="yaml">
en:
  title: Remove World
  deleteWorld:
    outside: Remove…
    inside: Remove
  deleteWorldConfirmation: Are you sure you want to remove {name}? This action cannot be undone.
  cancel: Cancel
  success: World removed.
  error: Failed to remove world.
</i18n>