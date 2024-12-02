<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const user = useSupabaseUser()

const modelStore = useModelStore()
const personaStore = usePersonaStore()
const assistantStore = useAssistantStore()

definePageMeta({
  middleware: [
    'personas',
    'assistants',
    'relations',
    'scenarios',
    'worlds',
  ],
})

const { getModelCount } = modelStore
const { getPersonaCount } = personaStore
const { getAssistantCount } = assistantStore
</script>

<template>
  <UiPanel>
    <UiPanelHeader>
      <template #mainToggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
      {{ t('title') }}
    </UiPanelHeader>
    <UiPanelContent>
      <UContainer v-auto-animate>
        <UiHero icon="i-ph-hand-waving-thin" :description="t('hero.description')">
          <template #title>
            <i18n-t class="font-serif" keypath="hero.title" tag="h1">
              <template #name>
                <span class="text-primary">{{ user?.user_metadata.full_name || user.email }}</span>
              </template>
            </i18n-t>
          </template>
        </UiHero>
        <FirstSteps v-if="!getModelCount || !getPersonaCount || !getAssistantCount" />
        <ProductionsUpsert v-else orientation="vertical" />
      </UContainer>
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
en:
  title: New Production
  hero:
    title: Hey, {name}
    description: Create dynamic multi-agent productions where AI assistants can be anything from characters to cosmic forces.
</i18n>
