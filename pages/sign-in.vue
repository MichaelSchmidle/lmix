<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })

definePageMeta({
  layout: false,
})

useHead(
  {
    title: t('meta.title'),
  }
)
</script>

<template>
  <UiPanelLayout>
    <UiPanel class="md:w-1/2">
      <UiPanelHeader>
        <NavPanelBrand />
        <template #mainToggle>
          <UTooltip class="md:hidden" text="GitHub">
            <UButton icon="i-ph-github-logo" variant="link" to="https://github.com/michaelschmidle/lmix" />
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
      </UiPanelFooter>
    </UiPanel>
    <UiPanel
      class="bg-gradient-to-tr from-cyan-200 to-primary-100 dark:from-cyan-900 dark:to-primary-800 divide-white dark:divide-black hidden md:flex md:w-1/2">
      <UiPanelHeader>
        <template #mainToggle>
          <UTooltip text="GitHub">
            <UButton icon="i-ph-github-logo" variant="link" to="https://github.com/michaelschmidle/lmix" />
          </UTooltip>
        </template>
      </UiPanelHeader>
      <SparkleSvg />
      <UiPanelFooter class="min-h-16" />
    </UiPanel>
  </UiPanelLayout>
</template>

<i18n lang="yaml">
en:
  meta:
    title: Dynamic Multi-Agent Productions
  title: Sign Into Your {lmix}
  lmix: LMiX
  description: Create dynamic multi-agent productions where AI assistants can be anything from characters to cosmic forces.
</i18n>
