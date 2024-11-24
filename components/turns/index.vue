<script setup lang="ts">
import type { Content, Turn } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const { m } = useMarkdown()

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
      <div ref="sentinel" style="height: 1px;" />
    </UContainer>
  </div>
</template>

<i18n lang="yaml">
en:
  turn:
    placeholder: Your turn…
    help: Press {enter} to send, {shiftEnter} for new lines.
  persona:
    placeholder: Select persona…
    help: The persona to use for this turn.
  assistant:
    placeholder: Select assistant…
    help: The assistant to use for this turn.
    required: Please select an assistant.
  send:
    tooltip: Send message
</i18n>