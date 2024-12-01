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
        <PersonasPanelSlideover class="lg:hidden" />
      </template>
      {{ t('title') }}
      <template #mainToggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>
      <PersonasUpsert />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
en:
  title: New Persona
</i18n>