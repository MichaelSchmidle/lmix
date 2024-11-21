<script setup lang="ts">
import type { Turn } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })

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

// Scroll to bottom function
const scrollToBottom = () => {
  if (!chatContainer.value) return
  chatContainer.value.scrollTo({
    top: chatContainer.value.scrollHeight,
    behavior: 'smooth'
  })
}

// Intersection Observer callback
const observerCallback = (entries: IntersectionObserverEntry[]) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      shouldAutoScroll.value = true
    } else {
      shouldAutoScroll.value = false
    }
  })
}

// Lifecycle hooks
onMounted(() => {
  scrollToBottom()

  const observer = new IntersectionObserver(observerCallback, {
    root: chatContainer.value,
    threshold: 1.0
  })

  if (sentinel.value) {
    observer.observe(sentinel.value)
  }

  onUnmounted(() => {
    if (sentinel.value) {
      observer.unobserve(sentinel.value)
    }
  })
})

// Watch for changes in chat messages
watch(() => props.turns, () => {
  nextTick(() => {
    if (shouldAutoScroll.value) {
      scrollToBottom()
    }
  })
}, { deep: true })
</script>

<template>
  <div ref="chatContainer" class="chat-history-container flex-1 overflow-y-auto p-4">
    <div v-for="turn in turns" :key="turn.uuid" class="mb-4">
      <div class="text-sm text-gray-500">
        {{ turn.sender_persona_name }}
      </div>
      <div class="mt-1">
        {{ getMessageContent(turn) }}
      </div>
    </div>
    <div ref="sentinel" style="height: 1px;" />
  </div>
</template>

<style scoped>
.chat-history-container {
  scroll-behavior: smooth;
}
</style>