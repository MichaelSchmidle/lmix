<script setup lang="ts">
import type { Persona } from '@/types/app'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const personaStore = usePersonaStore()

const props = defineProps({
  persona: {
    type: Object as PropType<Persona>,
    required: true,
  },
})

const emits = defineEmits(['success'])

const isOpen = ref(false)
const isDeleting = ref(false)

async function handleDelete() {
  try {
    isDeleting.value = true
    await personaStore.deletePersona(props.persona.uuid)

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
    <UButton color="gray" icon="i-ph-trash-duotone" :label="t('deletePersona.outside')" variant="ghost" @click="isOpen = true" />
    <UModal v-model="isOpen">
      <UCard :ui="{ body: { base: 'space-y-4' } }">
        <template #header>
          {{ t('deletePersona.inside') }}
        </template>
        <i18n-t keypath="deletePersonaConfirmation" tag="p" class="prose dark:prose-invert">
          <template #name>
            <code>{{ persona.name }}</code>
          </template>
        </i18n-t>
        <UiFormActions>
          <UButton color="gray" variant="ghost" :label="t('cancel')" @click="isOpen = false" />
          <UButton color="rose" icon="i-ph-trash-duotone" :label="t('deletePersona.inside')" :loading="isDeleting" @click="handleDelete" />
        </UiFormActions>
      </UCard>
    </UModal>
  </div>
</template>

<i18n lang="yaml">
  en:
    deletePersona:
      outside: Remove Persona…
      inside: Remove Persona
    deletePersonaConfirmation: Are you sure you want to delete {name}? This action cannot be undone.
    cancel: Cancel
    success: Persona removed.
    error: Failed to remove persona.
</i18n>