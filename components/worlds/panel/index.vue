<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const worldStore = useWorldStore()
const { getWorldNavigation } = storeToRefs(worldStore)

const props = defineProps({
  isSlideover: {
    default: false,
    type: Boolean,
  },
})
</script>

<template>
  <UiPanelHeader>
    <template v-if="isSlideover" #domainToggle>
      <UButton color="gray" icon="i-ph-x" variant="ghost" @click="$emit('close')" />
    </template>
    {{ t('title') }}
  </UiPanelHeader>
  <UiPanelContent v-auto-animate>
    <UButton block icon="i-ph-panorama-duotone" :label="t('newWorld')" to="/worlds/add" />
    <UVerticalNavigation :links="getWorldNavigation()" />
    <NoData v-if="!getWorldNavigation().length" :message="t('noWorlds')" />
  </UiPanelContent>
</template>

<i18n lang="yaml">
  en:
    title: Worlds
    newWorld: New World
    noWorlds: No worlds yet
</i18n>
