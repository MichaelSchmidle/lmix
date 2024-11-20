<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const productionStore = useProductionStore()
const { getProduction } = storeToRefs(productionStore)

await productionStore.selectProduction(route.params.id as string)
const production = computed(() => getProduction.value(route.params.id as string))

if (!production.value) {
  showError({ statusCode: 404, message: t('productionNotFound') })
}
</script>

<template>
  <UiPanel :class="[
    'bg-gray-50 dark:bg-gray-950 max-w-[calc(100vw-64px)] sm:max-w-[200px]',
    'hidden lg:flex',
  ]">
    <ProductionsPanel v-if="production" :production="production" />
  </UiPanel>
  <NuxtPage :production="production" />
</template>

<i18n lang="yaml">
  en:
    productionNotFound: Production not found
</i18n>
