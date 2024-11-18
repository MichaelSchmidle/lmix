<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const personaStore = usePersonaStore()
const { getPersona } = storeToRefs(personaStore)
const persona = getPersona.value(route.params.id as string)

if (!persona) {
  showError({
    statusCode: 404,
    message: t('personaNotFound'),
  })
}

useHead({
  title: t('title', { name: persona?.name }),
})
</script>

<template>
  <UiPanel>
    <UiPanelHeader has-back-button>
      {{ persona?.name }}
      <template #toggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>
      <PersonasUpsert :persona="persona" />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: Persona {name}
    personaNotFound: Persona not found
</i18n>