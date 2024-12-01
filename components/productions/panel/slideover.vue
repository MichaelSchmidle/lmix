<script setup lang="ts">
import type { Production } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })

const props = defineProps({
  production: {
    required: true,
    type: Object as PropType<Production>,
  },
})

const isOpen = ref(false)
</script>

<template>
  <div>
    <UTooltip :text="t('navigation')">
      <UButton color="gray" icon="i-ph-dots-three-vertical" variant="ghost" @click="isOpen = true" />
    </UTooltip>
    <USlideover side="left" v-model="isOpen"
      :ui="{ background: 'bg-gray-100 dark:bg-gray-900', base: 'divide-y divide-gray-200 dark:divide-gray-800', width: 'max-w-[360px]' }">
      <ProductionsPanel is-slideover :production="production" @close="isOpen = false" />
    </USlideover>
  </div>
</template>

<i18n lang="yaml">
en:
  navigation: Show Production Ensemble
</i18n>
