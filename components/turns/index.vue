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
      <UiMediaObject v-for="turn in turns" :key="`${turn.production_uuid}-${turn.parent_turn_uuid || 'root'}-${turn.uuid}`" class="xl:gap-0">
        <template #media>
          <UTooltip class="xl:-ms-16" :text="turn.message.content.persona_name">
            <UAvatar :alt="turn.message.content.persona_name" size="md" />
          </UTooltip>
        </template>
        <div class="prose dark:prose-invert" v-html="m(turn.message.content.performance, true)" />
      </UiMediaObject>
    </UContainer>
  </div>
</template>

<i18n lang="yaml">
en:
</i18n>