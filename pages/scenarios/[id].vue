<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const scenarioStore = useScenarioStore()
const { getScenario } = storeToRefs(scenarioStore)
const scenario = getScenario.value(route.params.id as string)

if (!scenario) {
  showError({
    statusCode: 404,
    message: t('scenarioNotFound'),
  })
}

useHead({
  title: t('title', { name: scenario?.name }),
})
</script>

<template>
  <UiPanel>
    <UiPanelHeader>
      <template #domainToggle>
        <ScenariosPanelSlideover class="lg:hidden" />
      </template>
      {{ t('title') }}
      <template #mainToggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>
      <ScenariosUpsert :scenario="scenario" />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
en:
  title: Scenario {name}
  scenarioNotFound: Scenario not found
</i18n>