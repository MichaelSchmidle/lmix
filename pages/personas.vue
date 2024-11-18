<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()

useHead({
  title: t('title'),
})

definePageMeta({
  middleware: ['personas'],
})

const personaStore = usePersonaStore()
const { getPersonaNavigation } = storeToRefs(personaStore)
</script>

<template>
  <UiPanel :class="[
    'bg-gray-50 dark:bg-gray-950 max-w-[200px]',
    route.path !== '/personas' && 'hidden lg:flex',
  ]">
    <UiPanelHeader>
      {{ t('title') }}
    </UiPanelHeader>
    <UiPanelContent v-auto-animate>
      <UButton block icon="i-ph-mask-happy-duotone" :label="t('newPersona')" to="/personas/new" />
      <UVerticalNavigation :links="getPersonaNavigation" />
      <NoData v-if="!getPersonaNavigation.length" :message="t('noPersonas')" />
    </UiPanelContent>
  </UiPanel>
  <UiPanel v-if="route.path === '/personas'">
    <UiPanelHeader has-back-button>
      <template #toggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent />
  </UiPanel>
  <NuxtPage v-else />
</template>

<i18n lang="yaml">
  en:
    title: Personas
    newPersona: New Persona
    noPersonas: No personas yet
</i18n>