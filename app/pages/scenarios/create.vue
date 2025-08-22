<template>
  <UDashboardPanel id="scenarios-index-panel">
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
            :to="localeRoute('scenarios')"
            variant="ghost"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body> TODO: Create scenario form </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localeRoute = useLocalePath()
const title = t('create')

useHead({
  title,
})
</script>

<i18n lang="yaml">
en:
  create: Create Scenario
</i18n>
