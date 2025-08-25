<template>
  <PagePanel
    route-name="assistants-id"
    :title="title"
  >
    <template #toolbar>
      <div
        v-if="loading"
        class="flex gap-x-4 items-center justify-between w-full"
      >
        <USkeleton class="h-5 w-64" />

        <USkeleton class="h-5 w-24" />
      </div>

      <div
        v-else-if="assistant"
        class="flex gap-x-4 items-center justify-between w-full"
      >
        <span class="text-sm truncate">
          {{
            assistant.name ||
            `${assistant.persona?.name}@${assistant.model?.name}`
          }}
        </span>
        <AssistantsDelete :assistant="assistant" />
      </div>
    </template>

    <AssistantsUpsert :assistant="assistant" />
  </PagePanel>
</template>

<script setup lang="ts">
import type { Assistant } from '~/types/assistants'

const { t } = useI18n({ useScope: 'local' })
const assistantStore = useAssistantStore()
const personaStore = usePersonaStore()
const modelStore = useModelStore()
const { loading } = storeToRefs(assistantStore)

const assistant = computed<Assistant | undefined>(() =>
  assistantStore.getAssistantById(useRoute().params.id as string)
)

const title = t('title')

// Fetch data on component mount if not already loaded
onMounted(async () => {
  const fetchPromises = []

  if (!assistantStore.assistants.length) {
    fetchPromises.push(assistantStore.fetchAssistants())
  }
  if (!personaStore.personas.length) {
    fetchPromises.push(personaStore.fetchPersonas())
  }
  if (!modelStore.models.length) {
    fetchPromises.push(modelStore.fetchModels())
  }

  await Promise.all(fetchPromises)
})

useHead({
  title,
})
</script>

<i18n lang="yaml">
en:
  title: Manage Assistant
</i18n>
