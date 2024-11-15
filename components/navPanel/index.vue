<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })

const props = defineProps({
  isSlideover: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close'])

const stageItems = [
  { label: t('stage'), slot: 'stage' },
]

const links = [
  { icon: 'i-ph-circuitry', label: t('models'), to: '/models' },
  { icon: 'i-ph-mask-happy', label: t('personas'), to: '/personas' },
  { icon: 'i-ph-head-circuit', label: t('assistants'), to: '/assistants' },
  { icon: 'i-ph-panorama', label: t('scenarios'), to: '/scenarios' },
  { icon: 'i-ph-planet', label: t('worlds'), to: '/worlds' },
]

const productionItems = [
  { icon: 'i-ph-film-script', label: t('productions'), slot: 'productions' },
]
</script>

<template>
  <UiPanelHeader>
    <UButton to="/" variant="link">
      <Logotype class="h-4 text-primary hover:text-primary-600 dark:hover:text-primary-500 w-auto" />
    </UButton>
    <template v-if="isSlideover" #toggle>
      <UButton color="gray" icon="i-ph-x" variant="ghost" @click="$emit('close')" />
    </template>
  </UiPanelHeader>
  <UiPanelContent>
    <UAccordion color="gray" default-open :items="stageItems" variant="ghost">
      <template #stage>
        <UVerticalNavigation :links="links" />
      </template>
    </UAccordion>
    <UButton block icon="i-ph-film-script-duotone" :label="t('newProduction')" to="/" />
    <UAccordion color="gray" default-open :items="productionItems" variant="ghost">
      <template #productions>
        <NoData :message="t('noProductions')" />
      </template>
    </UAccordion>
  </UiPanelContent>
  <UiPanelFooter>
    <UiColorThemeToggle />
    <UiColorModeToggle />
  </UiPanelFooter>
</template>

<i18n lang="yaml">
  en:
    stage: Stage
    models: Models
    personas: Personas
    assistants: Assistants
    scenarios: Scenarios
    worlds: Worlds
    newProduction: New Production
    productions: Productions
    noProductions: No productions yet
</i18n>
