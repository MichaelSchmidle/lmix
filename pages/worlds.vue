<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()

useHead({
  title: t('title'),
})

definePageMeta({
  middleware: ['worlds'],
})

const worldStore = useWorldStore()
const { getWorldNavigation } = storeToRefs(worldStore)
</script>

<template>
  <UiPanel :class="[
    'bg-gray-50 dark:bg-gray-950 max-w-[200px]',
    route.path !== '/worlds' && 'hidden lg:flex',
  ]">
    <UiPanelHeader>
      {{ t('title') }}
    </UiPanelHeader>
    <UiPanelContent v-auto-animate>
      <UButton block icon="i-ph-planet-duotone" :label="t('newWorld')" to="/worlds/new" />
      <UVerticalNavigation :links="getWorldNavigation" />
      <NoData v-if="!getWorldNavigation.length" :message="t('noWorlds')" />
    </UiPanelContent>
  </UiPanel>
  <UiPanel v-if="route.path === '/worlds'">
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
    title: Worlds
    newWorld: New World
    noWorlds: No worlds yet
</i18n>