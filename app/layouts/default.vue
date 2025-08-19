<template>
  <UDashboardGroup>
    <UDashboardSidebar>
      <template #header>
        <HomeButton />
      </template>
      <NavigationMenu />
      <template #footer>
        <i18n-t class="text-muted text-xs" keypath="copyright" tag="p">
          <template #year>{{ config.public.BUILD_YEAR }}</template>
          <template #name>
            <ULink target="_blank" to="https://www.lmix.ai/">{{ config.public.PROJECT_DISPLAY_NAME }}</ULink>
          </template>
        </i18n-t>
      </template>
    </UDashboardSidebar>
    <NuxtPage />
  </UDashboardGroup>
</template>

<script setup lang="ts">
const { t } = useI18n()
const config = useRuntimeConfig()
</script>

<i18n lang="yaml">
en:
  copyright: © {year} by {name}
</i18n>
