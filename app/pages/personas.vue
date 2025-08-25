<template>
  <IndexPanel
    route-name="personas"
    :title="title"
  >
    <PersonasCreateLink size="lg" />
    <Personas />
  </IndexPanel>
  <NuxtPage />
</template>

<script setup lang="ts">
const { t } = useI18n()
const personaStore = usePersonaStore()
const title = t('title')

useHead({
  title,
})

// Fetch personas on component mount
onMounted(async () => {
  if (!personaStore.personasList.length) {
    await personaStore.fetchPersonas()
  }
})
</script>

<i18n lang="yaml">
en:
  title: Personas
</i18n>
