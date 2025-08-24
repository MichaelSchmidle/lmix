<template>
  <UDashboardPanel :id="`${routeName}-panel`">
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
            :to="localeRoute(routeName)"
            variant="ghost"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar v-if="$slots.toolbar">
        <slot name="toolbar" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <slot />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
const localeRoute = useLocaleRoute()

defineProps<{
  routeName: string
  title: string
}>()
</script>
