<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })

useHead({
  title: t('title'),
})

definePageMeta({
  middleware: [
    'worlds',
  ],
})
</script>

<template>
  <UiPanel>
    <UiPanelHeader has-back-button>
      {{ t('title') }}
      <template #toggle>
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
</i18n>