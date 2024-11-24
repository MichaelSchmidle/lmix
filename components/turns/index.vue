<script setup lang="ts">
import { useChat } from '@ai-sdk/vue'
import type { Content, Turn } from '~/types/app'

const { t } = useI18n({ useScope: 'local' })
const { m } = useMarkdown()
const user = useSupabaseUser()
const personaStore = usePersonaStore()
const { getPersona } = storeToRefs(personaStore)

const props = defineProps({
  productionUuid: {
    required: true,
    type: String
  },
  turns: {
    required: true,
    type: Array as PropType<Turn[]>
  }
})

const { messages } = useChat({
  api: '/api/turns',
  id: props.productionUuid,
})

const chatContainer = ref<HTMLElement | null>(null)
const shouldAutoScroll = ref(true)
const sentinel = ref<HTMLElement | null>(null)

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
  watch(() => messages.value.length, () => {
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
    <UContainer v-auto-animate>
      <UiMediaObject v-for="turn in messages" :key="turn.id" class="lg:gap-0">
        <template #media>
          <UTooltip class="lg:-ms-12" :text="turn.role">
            <UAvatar :alt="turn.role" />
          </UTooltip>
        </template>
        <div class="prose dark:prose-invert" v-html="m(turn.content)" />
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