<template>
  <PagePanel
    route-name="assistants-create"
    :title="title"
  >
    <!-- Loading state -->
    <USkeleton
      v-if="isLoading"
      class="h-32 w-full rounded-lg"
    />

    <!-- Alert when prerequisites are missing -->
    <UAlert
      v-else-if="showPrerequisiteAlert"
      color="warning"
      icon="i-ph-warning-fill"
      :title="prerequisiteAlertTitle"
      :description="prerequisiteAlertDescription"
      variant="subtle"
    >
      <template #actions>
        <ModelsCreateModal
          v-if="!models.length"
          :block="false"
          color="warning"
          :label="t('prerequisite.models.label')"
          variant="solid"
        />

        <PersonasCreateModal
          v-if="!personas.length"
          :block="false"
          color="warning"
          :label="t('prerequisite.personas.label')"
          variant="solid"
        />
      </template>
    </UAlert>

    <AssistantsUpsert v-if="!isLoading && !showPrerequisiteAlert" />
  </PagePanel>
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const personaStore = usePersonaStore()
const { loading: loadingPersonas, personas } = storeToRefs(personaStore)
const modelStore = useModelStore()
const { loading: loadingModels, models } = storeToRefs(modelStore)
const title = t('title')

useHead({
  title,
})

// Check if stores are still loading
const isLoading = computed(() => loadingPersonas.value || loadingModels.value)

// Show alert when personas or models are missing (but not while loading)
const showPrerequisiteAlert = computed(
  () => !isLoading.value && (!models.value.length || !personas.value.length)
)

// Specific alert messages based on what's missing
const prerequisiteAlertTitle = computed(() => {
  const missingModels = !models.value.length
  const missingPersonas = !personas.value.length

  if (missingModels && missingPersonas) {
    return t('prerequisite.both.title')
  } else if (missingModels) {
    return t('prerequisite.models.title')
  } else {
    return t('prerequisite.personas.title')
  }
})

const prerequisiteAlertDescription = computed(() => {
  const missingModels = !models.value.length
  const missingPersonas = !personas.value.length

  if (missingModels && missingPersonas) {
    return t('prerequisite.both.description')
  } else if (missingModels) {
    return t('prerequisite.models.description')
  } else {
    return t('prerequisite.personas.description')
  }
})

// Fetch personas and models on component mount
onMounted(async () => {
  const fetchPromises = []

  if (!personaStore.personas.length) {
    fetchPromises.push(personaStore.fetchPersonas())
  }
  if (!modelStore.models.length) {
    fetchPromises.push(modelStore.fetchModels())
  }

  await Promise.all(fetchPromises)
})
</script>

<i18n lang="yaml">
en:
  title: Create Assistant
  prerequisite:
    both:
      title: Models and Personas Required
      description: You need to create at least one model and one persona before you can create an assistant.
    models:
      title: Model Required
      description: You need to create at least one model before you can create an assistant.
      label: Create Models
    personas:
      title: Persona Required
      description: You need to create at least one persona before you can create an assistant.
      label: Create Persona
</i18n>
