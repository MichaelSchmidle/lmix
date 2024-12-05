<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const scenarioStore = useScenarioStore()
const { getScenarioNavigation } = storeToRefs(scenarioStore)

const props = defineProps({
  isSlideover: {
    default: false,
    type: Boolean,
  },
})
</script>

<template>
  <UiPanelHeader>
    <template v-if="isSlideover" #domainToggle>
      <UButton color="gray" icon="i-ph-x" variant="ghost" @click="$emit('close')" />
    </template>
    {{ t('title') }}
  </UiPanelHeader>
  <UiPanelContent v-auto-animate>
    <UButton block icon="i-ph-panorama-duotone" :label="t('newScenario')" to="/scenarios/add" />
    <UVerticalNavigation v-if="getScenarioNavigation().length" :links="getScenarioNavigation()" />
    <NoData v-else :message="t('noScenarios')" />
  </UiPanelContent>
</template>

<i18n lang="yaml">
en:
  title: Scenarios
  newScenario: New Scenario
  noScenarios: No scenarios yet
</i18n>
