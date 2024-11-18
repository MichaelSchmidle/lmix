<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const productionStore = useProductionStore()
const { getProduction } = storeToRefs(productionStore)
const production = getProduction.value(route.params.id as string)

if (!production) {
  showError({
    statusCode: 404,
    message: t('productionNotFound'),
  })
}

useHead({
  title: t('title', { name: production?.name }),
})
</script>

<template>
  <UiPanel>
    <UiPanelHeader has-back-button>
      {{ production?.name }}
      <template #toggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>
      <ProductionsUpsert :production="production" />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: Production {name}
    productionNotFound: Production not found
</i18n>