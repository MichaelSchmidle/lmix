<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()

useHead(
  {
    title: t('title'),
  }
)

const modelItems = [
  { icon: 'i-ph-circuitry', label: 'Models' },
]
</script>

<template>
  <UiPanel :class="[
    'bg-gray-50 dark:bg-gray-950 max-w-[200px]',
    route.path !== '/models' && 'hidden lg:flex',
  ]">
    <UiPanelHeader>
      {{ t('title') }}
    </UiPanelHeader>
    <UiPanelContent>
      <UButton block icon="i-ph-circuitry" :label="t('newModel')" to="/models/new" />
      <UAccordion color="gray" default-open :items="modelItems" variant="ghost" />
    </UiPanelContent>
  </UiPanel>
  <UiPanel v-if="route.path === '/models'">
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
    title: Models
    newModel: New Model
</i18n>
