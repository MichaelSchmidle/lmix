<script setup lang="ts">
import type { FormKitNode } from '@formkit/core'
import type { Persona, PersonaInsert } from '@/types/app'
import { LMiXError } from '@/types/errors'
import { ref, computed } from 'vue'

const { t } = useI18n({ useScope: 'local' })
const toast = useToast()
const personaStore = usePersonaStore()

const props = defineProps({
  persona: {
    type: Object as PropType<Persona>,
    default: undefined,
  },
})

const isUpdate = computed(() => !!props.persona)

const handleSubmit = async (persona: PersonaInsert, node: FormKitNode) => {
  try {
    const uuid = await personaStore.upsertPersona(persona)

    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle',
      title: t(isUpdate.value ? 'personaUpdated' : 'personaCreated'),
    })

    navigateTo(`/personas/${uuid}`)
  }
  catch (error: any) {
    console.error(error)
    node.setErrors([error instanceof LMiXError ? t(error.message) : t('saveFailed')])
  }
}

const handleNavigation = (to: string) => {
  navigateTo(to)
}

const fileInput = ref<HTMLInputElement | null>(null)

const handleAvatarUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  try {
    const file = input.files[0]
    await personaStore.uploadAvatar(props.persona!.uuid, file)

    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle',
      title: t('avatar.uploaded'),
    })
  }
  catch (error: any) {
    console.error(error)
    toast.add({
      color: 'red',
      icon: 'i-ph-warning-circle',
      title: error instanceof LMiXError ? t(error.message) : t('avatar.uploadFailed'),
    })
  }
}

const handleAvatarDelete = async () => {
  try {
    await personaStore.deleteAvatar(props.persona!.uuid)

    toast.add({
      color: 'lime',
      icon: 'i-ph-check-circle',
      title: t('avatar.deleted'),
    })
  }
  catch (error: any) {
    console.error(error)
    toast.add({
      color: 'red',
      icon: 'i-ph-warning-circle',
      title: error instanceof LMiXError ? t(error.message) : t('avatar.deleteFailed'),
    })
  }
}
</script>

<template>
  <UiSection icon="i-ph-mask-happy-thin" :title="t(isUpdate ? 'titleUpdate' : 'titleInsert')"
    :description="t(isUpdate ? 'descriptionUpdate' : 'descriptionInsert')">
    <UCard>
      <div v-if="isUpdate" class="mx-auto relative w-fit">
        <UAvatar :alt="persona?.name" :src="persona?.avatar_url || undefined" size="3xl" />
        <div class="absolute bottom-0 right-0">
          <input type="file" accept="image/*" class="hidden" ref="fileInput" @change="handleAvatarUpload">
          <UButton v-if="persona?.avatar_url" color="rose" icon="i-ph-trash" size="2xs" @click="handleAvatarDelete" />
          <UButton v-else color="cyan" icon="i-ph-user-focus" size="2xs" @click="fileInput?.click()" />
        </div>
      </div>
      <FormKit :incomplete-message="false" type="form" @submit="handleSubmit" :value="persona">
        <FormKit type="text" name="name" :label="t('name.label')" validation="required|not:User"
          :validation-messages="{ required: t('name.required'), not: t('name.notUser') }" />
        <FormKit type="textarea" auto-height name="public_knowledge" :label="t('publicKnowledge.label')"
          :help="t('publicKnowledge.help')" />
        <FormKit type="textarea" auto-height name="private_knowledge" :label="t('privateKnowledge.label')"
          :help="t('privateKnowledge.help')" />
        <FormKit type="textarea" auto-height name="public_perception" :label="t('publicPerception.label')"
          :help="t('publicPerception.help')" />
        <FormKit type="textarea" auto-height name="self_perception" :label="t('selfPerception.label')"
          :help="t('selfPerception.help')" />
        <template #actions="{ disabled }">
          <UiFormActions>
            <PersonasDeleteModal v-if="persona" :persona="persona" @success="handleNavigation('/personas/add')" />
            <UButton color="cyan" :icon="isUpdate ? 'i-ph-check' : 'i-ph-plus'"
              :label="t(isUpdate ? 'updatePersona' : 'createPersona')" :loading="(disabled as boolean)" type="submit" />
          </UiFormActions>
        </template>
      </FormKit>
    </UCard>
  </UiSection>
</template>

<i18n lang="yaml">
en:
  titleInsert: Create
  titleUpdate: Update
  descriptionInsert: 'Personas act through three layers of truth: universal, internal, and external. By leaving universal and external empty, personas can act as invisible, inexplicable forces that shape a production without being perceived by other personas – perfect for creating hidden forces or practical helpers.'
  descriptionUpdate: Configure this persona’s avatar, name, and layers of truth.
  name:
    label: Name
    help: A persona’s name is visible to all assistants in a production. For personas that should be “inexplicable”, consider using neutral names (e.g. ‘Presence’ or ‘Force’) to maintain mystery. Descriptive names might reveal too much about their nature.
    required: Name is required.
    notUser: ‘User’ is a reserved name, please choose a different name.
  selfPerception:
    label: Self Perception
    help: How the persona views themselves
  publicPerception:
    label: Public Perception
    help: How others perceive the persona
  privateKnowledge:
    label: Private Knowledge
    help: What only the persona knows
  publicKnowledge:
    label: Public Knowledge
    help: What others know for a fact about the persona
  createPersona: Create
  updatePersona: Update
  personaCreated: Persona created.
  personaUpdated: Persona updated.
  saveFailed: Failed to save persona.
  avatar:
    label: Avatar
    help: 'Upload an image (maximum file size: 6MB)'
    invalidType: Please upload an image file
    tooLarge: Image must be smaller than 6MB
    uploaded: Avatar uploaded successfully.
    deleted: Avatar removed successfully.
    uploadFailed: Failed to upload avatar.
    deleteFailed: Failed to remove avatar.
</i18n>