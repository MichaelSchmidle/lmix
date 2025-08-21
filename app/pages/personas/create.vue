<template>
  <UDashboardPanel id="personas-index-panel">
    <template #header>
      <UDashboardNavbar
        :title="title"
        toggle-side="right"
      >
        <template #leading>
          <UButton
            class="xl:hidden"
            color="neutral"
            icon="i-ph-arrow-left"
            :to="localeRoute('personas')"
            variant="ghost"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body> TODO: Create persona form </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localeRoute = useLocalePath()
const title = t('create')

useHead({
  title: title,
})
</script>

<i18n lang="yaml">
en:
  create: Create Persona
</i18n>
