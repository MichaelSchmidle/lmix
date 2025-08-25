<template>
  <PagePanel
    route-name="personas-id"
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
        v-else-if="persona"
        class="flex gap-x-4 items-center justify-between w-full"
      >
        <span class="text-sm truncate">{{ persona.name }}</span>
        <PersonasDelete :persona="persona" />
      </div>
    </template>

    <PersonasUpsert :persona="persona" />
  </PagePanel>
</template>

<script setup lang="ts">
import type { Persona } from '~/types/personas'

const { t } = useI18n({ useScope: 'local' })
const personaStore = usePersonaStore()
const { loading } = storeToRefs(personaStore)

const persona = computed<Persona | undefined>(() =>
  personaStore.getPersonaById(useRoute().params.id as string)
)

const title = t('title')

// Fetch personas on component mount if not already loaded
onMounted(async () => {
  if (!personaStore.personas.length) {
    await personaStore.fetchPersonas()
  }
})

useHead({
  title,
})
</script>

<i18n lang="yaml">
en:
  title: Manage Persona
</i18n>
