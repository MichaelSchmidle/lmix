<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

// Define props
const props = defineProps<{ messages: Array<{ id: string; text: string }> }>();

const chatContainer = ref<HTMLElement | null>(null)
const shouldAutoScroll = ref(true)
const sentinel = ref<HTMLElement | null>(null)

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
watch(() => props.messages, () => {
  nextTick(() => {
    if (shouldAutoScroll.value) {
      scrollToBottom()
    }
  })
}, { deep: true })
</script>

<template>
  <div ref="chatContainer" class="chat-history-container flex-1 overflow-y-auto">
    <slot />
    <!-- Sentinel element to observe -->
    <div ref="sentinel" style="height: 1px;"></div>
  </div>
</template>

<style scoped>
.chat-history-container {
  scroll-behavior: smooth;
}
</style>