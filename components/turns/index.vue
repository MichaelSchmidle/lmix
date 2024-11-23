<script setup lang="ts">
import type { Turn } from '~/types/app'
import { useChat } from '@ai-sdk/vue'

const { t } = useI18n({ useScope: 'local' })
const { m } = useMarkdown()
const user = useSupabaseUser()
const turnStore = useTurnStore()

const props = defineProps({
  turns: {
    required: true,
    type: Array as PropType<Turn[]>
  }
})

const chatContainer = ref<HTMLElement | null>(null)
const shouldAutoScroll = ref(true)
const sentinel = ref<HTMLElement | null>(null)

// Helper to safely get message content
const getMessageContent = (turn: Turn) => {
  const message = turn.message as { content: string }
  return message?.content || ''
}

// Scroll handling
const scrollToBottom = () => {
  if (chatContainer.value && shouldAutoScroll.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const observerCallback = (entries: IntersectionObserverEntry[]) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      shouldAutoScroll.value = false
    }
  })
}

// Lifecycle hooks
onMounted(() => {
  scrollToBottom()

  const observer = new IntersectionObserver(observerCallback, {
    root: chatContainer.value,
    threshold: 0
  })

  if (sentinel.value) {
    observer.observe(sentinel.value)
  }

  // Watch for changes in turns and scroll to bottom
  watch(() => props.turns.length, () => {
    nextTick(() => {
      scrollToBottom()
    })
  })

  // Cleanup
  onBeforeUnmount(() => {
    if (sentinel.value) {
      observer.unobserve(sentinel.value)
    }
  })
})
</script>

<template>
  <div ref="chatContainer">
    <UContainer>
      <UiMediaObject v-for="turn in turns" :key="turn.uuid" class="lg:gap-0">
        <template #media>
          <UAvatar :alt="turn.sender_persona_name" class="lg:-ms-12"
            :src="turn.sender_persona_name === 'User' ? user.user_metadata.avatar_url : undefined" />
        </template>
        <div class="prose dark:prose-invert" v-html="m(getMessageContent(turn))" />
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
    submitted: Message sent.
    failed: Failed to send message.
    unexpectedError: An unexpected error occurred.
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