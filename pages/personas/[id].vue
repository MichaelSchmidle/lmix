<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const personaStore = usePersonaStore()
const { getPersona } = storeToRefs(personaStore)
const persona = computed(() => getPersona.value(route.params.id as string))

if (!persona) {
  showError({
    statusCode: 404,
    message: t('personaNotFound'),
  })
}

useHead({
  title: t('title', { name: persona.value?.name }),
})

// Use middleware instead of direct store calls
definePageMeta({
  middleware: [
    'personas',
    'relations',
  ],
})
</script>

<template>
  <UiPanel>
    <UiPanelHeader>
      <template #domainToggle>
        <PersonasPanelSlideover class="lg:hidden" />
      </template>
      {{ persona?.name }}
      <template #mainToggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>
      <PersonasUpsert :persona="persona" />
      <PersonasRelations v-if="persona" :persona="persona" />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
en:
  title: Persona {name}
  personaNotFound: Persona not found
</i18n>