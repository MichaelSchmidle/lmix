<template>
  <USkeleton
    v-if="loading"
    class="h-128 w-full"
  />

  <UForm
    v-else
    :schema="worldSchema"
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
        name="description"
        :label="t('fields.description.label')"
        :description="t('fields.description.description')"
        required
      >
        <UTextarea
          v-model="formState.description"
          autoresize
          :placeholder="t('fields.description.placeholder')"
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
import type { World, CreateWorldInput, UpdateWorldInput } from '~/types/worlds'

const { t } = useI18n()
const worldStore = useWorldStore()
const { loading, busy } = storeToRefs(worldStore)
const toast = useToast()

const props = defineProps<{
  world?: World
}>()

const emit = defineEmits(['success'])

// Form state
const formState = ref<CreateWorldInput | UpdateWorldInput>({
  name: '',
  description: '',
})

// Validation schema
const worldSchema = z.object({
  name: z.string().min(1, t('validation.name.required')),
  description: z.string().min(1, t('validation.description.required')),
})

// Initialize form when world prop changes
watch(
  () => props.world,
  (newWorld) => {
    if (newWorld) {
      // Deep copy the world to form state, excluding system fields
      const { id, userId, createdAt, updatedAt, ...worldData } = newWorld
      formState.value = {
        ...worldData,
      }
    }
  },
  { immediate: true }
)

// Submit handler
const handleSubmit = async () => {
  try {
    let result: World

    if (!props.world) {
      // Create new world
      result = await worldStore.createWorld(formState.value as CreateWorldInput)

      toast.add({
        color: 'success',
        icon: 'i-ph-check-circle-fill',
        title: t('create.success.title'),
        description: t('create.success.description', { name: result.name }),
      })

      emit('success')
    } else {
      // Update existing world
      result = await worldStore.updateWorld(props.world.id, formState.value)

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
      title: props.world ? t('update.error.title') : t('create.error.title'),
      description: props.world
        ? t('update.error.description')
        : t('create.error.description'),
    })
  }
}
</script>

<i18n lang="yaml">
en:
  title: World Details
  description: Define the world’s name and immutable laws/setting.
  fields:
    name:
      label: Name
      description: The world’s name or identifier
      placeholder: Modern NYC
    description:
      label: Description
      description: Immutable laws and setting that define this world
      placeholder: Present day New York City with all its complexity, from Wall Street to the Bronx. Modern technology, diverse population, urban challenges and opportunities.
  actions:
    save: Save World
  validation:
    name:
      required: Name is required
    description:
      required: Description is required
  create:
    success:
      title: World Created
      description: World has been successfully created.
    error:
      title: Creation Failed
      description: Failed to create the world. Please try again.
  update:
    success:
      title: World Updated
      description: World has been successfully updated.
    error:
      title: Update Failed
      description: Failed to update the world. Please try again.
</i18n>
