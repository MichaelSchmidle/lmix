<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })

const props = defineProps({
  productionUuid: {
    required: true,
    type: String,
  },
})

// Array of different endings to cycle through
const titleEndings = ref([
  t('story'),
  t('adventure'),
  t('tale'),
  t('simulation'),
  t('exploration'),
  t('journey'),
  t('game'),
  t('discovery'),
  t('experience'),
])

const currentText = ref('')
const isDeleting = ref(false)
const currentIndex = ref(0)

// Typing speed variables (in milliseconds)
const typingSpeed = 100
const deletingSpeed = 50
const pauseBeforeDelete = 4000
const pauseBetweenWords = 400

// Add these new refs
const maxCycles = ref(1)
const cycleCount = ref(0)
const animationTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// Handle the typing animation
const typeText = async () => {
  const currentEnding = titleEndings.value[currentIndex.value]

  if (isDeleting.value) {
    currentText.value = currentEnding.substring(0, currentText.value.length - 1)
    if (currentText.value === '') {
      isDeleting.value = false
      currentIndex.value = (currentIndex.value + 1) % titleEndings.value.length

      // Increment cycle count when we complete a full word cycle
      if (currentIndex.value === 0) {
        cycleCount.value++
        // Check if this is the final cycle
        if (cycleCount.value >= maxCycles.value) {
          // Reset to first word, but keep animating
          currentIndex.value = 0
          await new Promise(resolve => setTimeout(resolve, pauseBetweenWords))
          // Continue with typing animation for the first word
          animationTimer.value = setTimeout(typeText, typingSpeed)
          return
        }
      }

      await new Promise(resolve => setTimeout(resolve, pauseBetweenWords))
    }
  }
  else {
    currentText.value = currentEnding.substring(0, currentText.value.length + 1)
    if (currentText.value === currentEnding) {
      // If this is the final word of the last cycle, don't delete
      if (cycleCount.value >= maxCycles.value) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, pauseBeforeDelete))
      isDeleting.value = true
    }
  }

  // Only set next animation if we haven't completed the final word
  if (cycleCount.value < maxCycles.value || isDeleting.value || currentText.value !== currentEnding) {
    animationTimer.value = setTimeout(typeText, isDeleting.value ? deletingSpeed : typingSpeed)
  }
}

// Start the animation when component mounts
onMounted(() => {
  typeText()
})

// Clean up the timer when component unmounts
onBeforeUnmount(() => {
  if (animationTimer.value !== null)
    clearTimeout(animationTimer.value)
})
</script>

<template>
  <UContainer class="max-w-prose w-full">
    <UiHero icon="i-ph-popcorn-thin" :description="t('description')">
      <template #title>
        <i18n-t class="font-serif prose dark:prose-invert prose-xl relative" keypath="title" tag="h1"><template
            #type>&nbsp;<span class="text-primary">{{ currentText }}</span><span
              class="absolute -ms-1 typing-cursor">|</span>&nbsp;</template></i18n-t>
      </template>
    </UiHero>
  </UContainer>
</template>

<style scoped>
.typing-cursor {
  display: inline-block;
  animation: blink 1s step-end infinite;
}

@keyframes blink {

  from,
  to {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}
</style>

<i18n lang="yaml">
en:
  title: A New{type}Awaits
  story: Story
  adventure: Adventure
  tale: Tale
  simulation: Simulation
  experience: Experience
  journey: Journey
  game: Game
  discovery: Discovery
  exploration: Exploration
  description: Take the first turn to start your production – or simply trigger an assistant to get it started for you.
</i18n>
