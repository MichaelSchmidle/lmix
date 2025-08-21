<template>
  <UDashboardPanel id="models-index-panel">
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
            :to="localeRoute('models')"
            variant="ghost"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body> TODO: Create model form </template>
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
  create: Create Model
</i18n>
