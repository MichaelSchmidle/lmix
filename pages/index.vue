<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })

useHead(
  {
    title: t('title'),
  }
)
</script>

<template>
  <UiPanel>
    <UiPanelHeader>
      <template #toggle>
        <NavPanelSlideover class="xl:hidden" />
      </template>
      {{ t('title') }}
    </UiPanelHeader>
    <UiPanelContent>
      <UContainer>
        <Hero icon="i-ph-hand-waving-thin" :description="t('hero.description')">
          <template #title>
            <i18n-t class="font-serif" keypath="hero.title" tag="h1">
              <template #lmix>
                <span class="text-primary">{{ t('hero.lmix') }}</span>
              </template>
            </i18n-t>
          </template>
        </Hero>
        <OAuth />
      </UContainer>
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: New Production
    hero:
      title: Welcome to your {lmix}
      lmix: LMiX
      description: Create dynamic multi-agent productions where AI assistants can be anything from characters to cosmic forces.
</i18n>
