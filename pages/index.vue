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
        <Hero icon="i-ph-hand-waving-thin" :description="t('description')">
          <template #title>
            <i18n-t keypath="title">
              <template #lmix>
                <span class="text-primary">{{ t('lmix') }}</span>
              </template>
            </i18n-t>
          </template>
        </Hero>
      </UContainer>
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: Welcome to your {lmix}
    lmix: LMiX
    description: Create dynamic multi-agent productions where AI assistants can be anything from characters to cosmic forces.
</i18n>
