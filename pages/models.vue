<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()

useHead(
  {
    title: t('title'),
  }
)

const modelStore = useModelStore()
const { getModelNavigation } = storeToRefs(modelStore)
</script>

<template>
  <UiPanel :class="[
    'bg-gray-50 dark:bg-gray-950 max-w-[200px]',
    route.path !== '/models' && 'hidden lg:flex',
  ]">
    <UiPanelHeader>
      {{ t('title') }}
    </UiPanelHeader>
    <UiPanelContent v-auto-animate>
      <UButton block icon="i-ph-circuitry-duotone" :label="t('newModel')" to="/models/new" />
      <UAccordion color="gray" default-open :items="getModelNavigation('i-ph-hard-drive-duotone')" variant="ghost" :ui="{ default: { class: 'hover:bg-gray-200 dark:hover:bg-gray-800 font-semibold' } }">
        <template #item="{ item }">
          <UVerticalNavigation :links="item.content" />
        </template>
      </UAccordion>
      <NoData v-if="!getModelNavigation().length" :message="t('noModels')" />
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
    newModel: New Models
    noModels: No models yet
</i18n>
