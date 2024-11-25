<script setup lang="ts">
import type { Message, Turn } from '~/types/app'

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
        <div class="prose dark:prose-invert" v-html="m(turn.message.content.performance, true)" />
      </UiMediaObject>
      <UiMediaObject v-if="getStreamingTurn" class="lg:gap-0">
        <template #media>
          <UTooltip class="lg:-ms-12" :text="getStreamingTurn.role">
            <UAvatar :alt="getStreamingTurn.role" />
          </UTooltip>
        </template>
        <div class="prose dark:prose-invert" v-html="m(JSON.stringify(getStreamingTurn.content) || '', true)" />
      </UiMediaObject>
    </UContainer>
  </div>
</template>

<i18n lang="yaml">
en:
</i18n>