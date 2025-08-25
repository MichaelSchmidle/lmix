<template>
  <USkeleton
    v-if="loading"
    class="h-128 w-full"
  />

  <UForm
    v-else
    :schema="personaSchema"
    :state="formState"
    :validate-on="['change', 'input']"
    @submit="handleSubmit"
  >
    <UPageCard
      :title="t('title')"
      :description="t('description')"
    >
      <UFormField
        name="name"
        :label="t('fields.name.label')"
        :description="t('fields.name.description')"
        required
      >
        <UInput
          v-model="formState.name"
          autofocus
          :placeholder="t('fields.name.placeholder')"
        />
      </UFormField>

      <UFormField
        name="universalTruth"
        :label="t('fields.universalTruth.label')"
        :description="t('fields.universalTruth.description')"
      >
        <UTextarea
          v-model="formState.universalTruth"
          autoresize
          :placeholder="t('fields.universalTruth.placeholder')"
          :rows="5"
        />
      </UFormField>

      <UFormField
        name="internalTruth"
        :label="t('fields.internalTruth.label')"
        :description="t('fields.internalTruth.description')"
      >
        <UTextarea
          v-model="formState.internalTruth"
          autoresize
          :placeholder="t('fields.internalTruth.placeholder')"
          :rows="5"
        />
      </UFormField>

      <UFormField
        name="externalTruth"
        :label="t('fields.externalTruth.label')"
        :description="t('fields.externalTruth.description')"
      >
        <UTextarea
          v-model="formState.externalTruth"
          autoresize
          :placeholder="t('fields.externalTruth.placeholder')"
          :rows="5"
        />
      </UFormField>
    </UPageCard>

    <!-- Actions -->
    <div class="flex gap-4 justify-end mt-6">
      <UButton
        type="submit"
        :disabled="busy"
        icon="i-ph-check"
        :label="t('actions.save')"
        :loading="busy"
      />
    </div>
  </UForm>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type {
  Persona,
  CreatePersonaInput,
  UpdatePersonaInput,
} from '~/types/personas'

const { t } = useI18n()
const personaStore = usePersonaStore()
const { loading, busy } = storeToRefs(personaStore)
const toast = useToast()

const props = defineProps<{
  persona?: Persona
}>()

const emit = defineEmits(['success'])

// Form state
const formState = ref<CreatePersonaInput | UpdatePersonaInput>({
  name: '',
  universalTruth: null,
  internalTruth: null,
  externalTruth: null,
})

// Validation schema
const personaSchema = z.object({
  name: z.string().min(1, t('validation.name.required')),
  universalTruth: z.string().nullable().optional(),
  internalTruth: z.string().nullable().optional(),
  externalTruth: z.string().nullable().optional(),
})

// Initialize form when persona prop changes
watch(
  () => props.persona,
  (newPersona) => {
    if (newPersona) {
      // Deep copy the persona to form state, excluding system fields
      const { id, userId, createdAt, updatedAt, ...personaData } = newPersona
      formState.value = {
        ...personaData,
        universalTruth: personaData.universalTruth || null,
        internalTruth: personaData.internalTruth || null,
        externalTruth: personaData.externalTruth || null,
      }
    }
  },
  { immediate: true }
)

// Submit handler
const handleSubmit = async () => {
  try {
    let result: Persona

    if (!props.persona) {
      // Create new persona
      result = await personaStore.createPersona(
        formState.value as CreatePersonaInput
      )

      toast.add({
        color: 'success',
        icon: 'i-ph-check-circle-fill',
        title: t('create.success.title'),
        description: t('create.success.description', { name: result.name }),
      })

      emit('success')
    } else {
      // Update existing persona
      result = await personaStore.updatePersona(
        props.persona.id,
        formState.value
      )

      toast.add({
        color: 'success',
        icon: 'i-ph-check-circle-fill',
        title: t('update.success.title'),
        description: t('update.success.description', { name: result.name }),
      })

      // Emit success for modal mode
    }
  } catch (error) {
    console.error(error)

    toast.add({
      color: 'error',
      icon: 'i-ph-x-circle-fill',
      title: props.persona ? t('update.error.title') : t('create.error.title'),
      description: props.persona
        ? t('update.error.description')
        : t('create.error.description'),
    })
  }
}
</script>

<i18n lang="yaml">
en:
  title: Persona Details
  description: Define the character’s name and their three layers of truth.
  fields:
    name:
      label: Name
      description: The character’s name or identifier
      placeholder: Alice Thompson
    universalTruth:
      label: Universal Truth
      description: Public facts that everyone knows about this persona
      placeholder: Therapist with 10 years experience, has an office in Manhattan
    internalTruth:
      label: Internal Truth
      description: Personal secrets and private knowledge known only to this persona
      placeholder: Struggling with her own anxiety, considering career change
    externalTruth:
      label: External Truth
      description: How others perceive this persona
      placeholder: Caring professional, sometimes asks too many personal questions
  actions:
    save: Save Persona
  validation:
    name:
      required: Name is required
  create:
    success:
      title: Persona Created
      description: Persona has been successfully created.
    error:
      title: Creation Failed
      description: Failed to create the persona. Please try again.
  update:
    success:
      title: Persona Updated
      description: Persona has been successfully updated.
    error:
      title: Update Failed
      description: Failed to update the persona. Please try again.
</i18n>
