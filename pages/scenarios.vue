<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()

useHead({
  title: t('title'),
})

definePageMeta({
  middleware: ['scenarios'],
})

const scenarioStore = useScenarioStore()
const { getScenarioNavigation } = storeToRefs(scenarioStore)
</script>

<template>
  <UiPanel :class="[
    'bg-gray-50 dark:bg-gray-950 max-w-[200px]',
    route.path !== '/scenarios' && 'hidden lg:flex',
  ]">
    <UiPanelHeader>
      {{ t('title') }}
    </UiPanelHeader>
    <UiPanelContent v-auto-animate>
      <UButton block icon="i-ph-panorama-duotone" :label="t('newScenario')" to="/scenarios/new" />
      <UVerticalNavigation :links="getScenarioNavigation" />
      <NoData v-if="!getScenarioNavigation.length" :message="t('noScenarios')" />
    </UiPanelContent>
  </UiPanel>
  <UiPanel v-if="route.path === '/scenarios'">
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
    title: Scenarios
    newScenario: New Scenario
    noScenarios: No scenarios yet
</i18n>