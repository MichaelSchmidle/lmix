<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const route = useRoute()
const worldStore = useWorldStore()
const { getWorld } = storeToRefs(worldStore)
const world = getWorld.value(route.params.id as string)

if (!world) {
  showError({
    statusCode: 404,
    message: t('worldNotFound'),
  })
}

useHead({
  title: t('title', { name: world?.name }),
})
</script>

<template>
  <UiPanel>
    <UiPanelHeader>
      <template #domainToggle>
        <WorldsPanelSlideover class="lg:hidden" />
      </template>
      {{ t('title') }}
      <template #mainToggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
    </UiPanelHeader>
    <UiPanelContent>
      <WorldsUpsert :world="world" />
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: World {name}
    worldNotFound: World not found
</i18n>