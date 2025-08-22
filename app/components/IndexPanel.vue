<template>
  <UDashboardPanel
    :id="`${route}-panel`"
    :class="[
      'md:max-w-64',
      hasPage ? 'hidden xl:flex' : 'border-default border-r',
    ]"
  >
    <template #header>
      <UDashboardNavbar
        :title="title"
        toggle-side="right"
      />
    </template>
    <template #body>
      <slot />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
const route = useRoute()
const localeRoute = useLocaleRoute()

const props = defineProps<{
  route: string
  title: string
}>()

const hasPage = computed(() => route.name !== localeRoute(props.route)?.name)
</script>
