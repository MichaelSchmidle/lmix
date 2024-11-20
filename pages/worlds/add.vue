<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })

useHead({
  title: t('title'),
})
</script>

<template>
  <UiPanel>
    <UiPanelHeader>
      <template #domainToggle>
        <WorldsPanelSlideover class="lg:hidden" />
      </template>
      {{ t('title') }}
      <template #mainToggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>
      <WorldsUpsert />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: New World
    worlds: World Navigation
</i18n>