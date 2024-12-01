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
        <ModelsPanelSlideover class="lg:hidden" />
      </template>
      {{ t('title') }}
      <template #mainToggle>
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
  title: New Models
</i18n>
