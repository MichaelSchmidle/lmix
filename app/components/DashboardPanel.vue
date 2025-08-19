<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <h1 class="font-bold">{{ title }}</h1>
        </template>
        <template #right>
          <UserMenu />
        </template>
      </UDashboardNavbar>
      <slot name="toolbar" />
    </template>
    <template #body>
      <slot />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

const props = defineProps<{
  title: string
}>()

useHead({
  title: props.title,
})

const items = ref<BreadcrumbItem[]>([
  {
    label: props.title,
  },
])
</script>