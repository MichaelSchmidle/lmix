<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const productionStore = useProductionStore()
const { $reset: resetProductionStore } = productionStore
const assistantStore = useAssistantStore()
const { $reset: resetAssistantStore } = assistantStore
const modelStore = useModelStore()
const { $reset: resetModelStore } = modelStore
const personaStore = usePersonaStore()
const { $reset: resetPersonaStore } = personaStore
const relationStore = useRelationStore()
const { $reset: resetRelationStore } = relationStore
const scenarioStore = useScenarioStore()
const { $reset: resetScenarioStore } = scenarioStore
const turnStore = useTurnStore()
const { $reset: resetTurnStore } = turnStore
const worldStore = useWorldStore()
const { $reset: resetWorldStore } = worldStore

definePageMeta({
  layout: false,
})

useHead(
  {
    title: t('meta.title'),
  }
)

const delay = 3000
const progress = ref(0)

const animateProgress = () => {
  progress.value = 0
  const startTime = Date.now()
  const duration = delay

  const updateProgress = () => {
    const elapsed = Date.now() - startTime
    progress.value = Math.min((elapsed / duration) * 100, 100)

    if (elapsed < duration) {
      requestAnimationFrame(updateProgress)
    }
  }

  updateProgress()
}

const isSigningOut = ref(false)

watch(() => isSigningOut.value, (newValue) => {
  if (newValue) {
    animateProgress()
  }
})

// Only show sign out animation if we're actually signing out an authenticated user
if (user.value) {
  isSigningOut.value = true

  // Reset all stores
  resetProductionStore()
  resetAssistantStore()
  resetModelStore()
  resetPersonaStore()
  resetRelationStore()
  resetScenarioStore()
  resetTurnStore()
  resetWorldStore()
  supabase.auth.signOut()

  setTimeout(() => {
    isSigningOut.value = false
  }, delay)
}
</script>

<template>
  <UiPanelLayout class="md:grid md:grid-cols-2">
    <UiPanel>
      <UiPanelHeader>
        <NavPanelBrand />
        <template #mainToggle>
          <UTooltip class="md:hidden" :popper="{ placement: 'left' }" text="GitHub">
            <UButton icon="i-ph-github-logo" variant="link" to="https://github.com/MichaelSchmidle/lmix" target="_blank" />
          </UTooltip>
        </template>
      </UiPanelHeader>
      <UiPanelContent>
        <UContainer>
          <UiHero :description="t('description')">
            <template #title>
              <i18n-t class="font-serif" keypath="title" tag="h1">
                <template #lmix>
                  <span class="text-primary">{{ t('lmix') }}</span>
                </template>
              </i18n-t>
            </template>
          </UiHero>
          <SignIn />
        </UContainer>
      </UiPanelContent>
      <UiPanelFooter class="min-h-16">
        <NavPanelUserMenu />
        <NavPanelVersion class="md:hidden" />
      </UiPanelFooter>
    </UiPanel>
    <UiPanel
      class="bg-gradient-to-tr from-cyan-200 to-primary-100 dark:from-cyan-900 dark:to-primary-800 divide-white dark:divide-black hidden md:flex">
      <UiPanelHeader>
        <template #mainToggle>
          <UTooltip :popper="{ placement: 'left' }" text="GitHub">
            <UButton icon="i-ph-github-logo" variant="link" to="https://github.com/michaelschmidle/lmix" target="_blank" />
          </UTooltip>
        </template>
      </UiPanelHeader>
      <SparkleSvg />
      <UiPanelFooter class="justify-end min-h-16">
        <NavPanelVersion />
      </UiPanelFooter>
    </UiPanel>
    <UModal v-model="isSigningOut" prevent-close>
      <UCard>
        <div class="prose dark:prose-invert text-center">
          <p>
            <UProgress class="px-4 py-3" :value="progress" />
          </p>
          <p> {{ t('signingOut') }}</p>
        </div>
      </UCard>
    </UModal>
  </UiPanelLayout>
</template>

<i18n lang="yaml">
en:
  meta:
    title: Dynamic Multi-Agent Productions
  title: Sign Into Your {lmix}
  lmix: LMiX
  description: Create dynamic multi-agent productions where AI assistants can be anything from characters to cosmic forces.
  signingOut: We are signing you out. Please wait.
</i18n>
