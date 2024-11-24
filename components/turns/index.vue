<script setup lang="ts">
import type { Turn } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const { m } = useMarkdown()
const turnStore = useTurnStore()
const { getStreamingTurn } = storeToRefs(turnStore)

const props = defineProps({
  turns: {
    required: true,
    type: Array as PropType<Turn[]>
  }
})
</script>

<template>
  <div ref="chatContainer">
    <UContainer v-auto-animate>
      <UiMediaObject v-for="turn in turns" :key="turn.uuid" class="lg:gap-0">
        <template #media>
          <UTooltip class="lg:-ms-12" :text="turn.message.role">
            <UAvatar :alt="turn.message.role" />
          </UTooltip>
        </template>
        <div class="prose dark:prose-invert" v-html="m(JSON.stringify(turn.message.content))" />
      </UiMediaObject>
      <UiMediaObject v-if="getStreamingTurn?.message" class="lg:gap-0">
        <template #media>
          <UTooltip class="lg:-ms-12" :text="getStreamingTurn.message.role">
            <UAvatar :alt="getStreamingTurn.message.role" />
          </UTooltip>
        </template>
        <div class="prose dark:prose-invert" v-html="m(JSON.stringify(getStreamingTurn.message.content) || '')" />
      </UiMediaObject>
    </UContainer>
  </div>
</template>

<i18n lang="yaml">
en:
</i18n>