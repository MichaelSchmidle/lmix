<template>
  <UDashboardPanel :id="`${route}-panel`">
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

      <UDashboardToolbar
        v-if="$slots.toolbar"
        :ui="{ root: 'gap-x-4 gap-y-3 justify-between' }"
      >
        <slot name="toolbar" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <slot />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
const route = useRoute()
const localeRoute = useLocaleRoute()

defineProps<{
  route: string
  title: string
}>()
</script>
