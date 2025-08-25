<template>
  <IndexPanel
    route-name="personas"
    :title="title"
  >
    <CreateButton
      :label="t('label')"
      size="lg"
      :to="localeRoute('personas-create')"
    />
    <Personas />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const localeRoute = useLocaleRoute()
const personaStore = usePersonaStore()
const title = t('title')

useHead({
  title,
})

// Fetch personas on component mount
onMounted(async () => {
  if (!personaStore.personas.length) {
    await personaStore.fetchPersonas()
  }
})
</script>

<i18n lang="yaml">
en:
  title: Personas
  label: Create Persona
</i18n>
