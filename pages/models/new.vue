<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })

useHead({
  title: t('title'),
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
      <ModelsInsert />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: New Model
</i18n>
