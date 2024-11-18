<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()

useHead({
  title: t('title'),
})

definePageMeta({
  middleware: ['assistants'],
})

const assistantStore = useAssistantStore()
const { getAssistantNavigation } = storeToRefs(assistantStore)
</script>

<template>
  <UiPanel :class="[
    'bg-gray-50 dark:bg-gray-950 max-w-[200px]',
    route.path !== '/assistants' && 'hidden lg:flex',
  ]">
    <UiPanelHeader>
      {{ t('title') }}
    </UiPanelHeader>
    <UiPanelContent v-auto-animate>
      <UButton block icon="i-ph-head-circuit-duotone" :label="t('newAssistant')" to="/assistants/new" />
      <UVerticalNavigation :links="getAssistantNavigation" />
      <NoData v-if="!getAssistantNavigation.length" :message="t('noAssistants')" />
    </UiPanelContent>
  </UiPanel>
  <UiPanel v-if="route.path === '/assistants'">
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
    title: Assistants
    newAssistant: New Assistant
    noAssistants: No assistants yet
</i18n>