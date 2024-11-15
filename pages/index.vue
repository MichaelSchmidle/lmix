<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' })
const user = useSupabaseUser()

useHead(
  {
    title: t('meta.title'),
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
      <UContainer v-auto-animate>
        <Hero icon="i-ph-hand-waving-thin" :description="t('hero.description')">
          <template #title>
            <i18n-t v-if="user" class="font-serif" keypath="hero.title.authenticated" tag="h1">
              <template #name>
                <span class="text-primary">{{ user.user_metadata.name }}</span>
              </template>
            </i18n-t>
            <i18n-t v-else class="font-serif" keypath="hero.title.anonymous" tag="h1">
              <template #lmix>
                <span class="text-primary">{{ t('hero.lmix') }}</span>
              </template>
            </i18n-t>
          </template>
        </Hero>
        <OAuth v-if="!user" />
      </UContainer>
    </UiPanelContent>
  </UiPanel>
</template>

<i18n lang="yaml">
  en:
    title: New Production
    meta:
      title: Dynamic Multi-Agent Productions
    hero:
      title:
        anonymous: Welcome to your {lmix}
        authenticated: Hey, {name}
      lmix: LMiX
      description: Create dynamic multi-agent productions where AI assistants can be anything from characters to cosmic forces.
</i18n>
