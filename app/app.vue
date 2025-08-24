<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtRouteAnnouncer />

    <NuxtLayout />
  </UApp>
</template>

<script setup lang="ts">
import * as locales from '@nuxt/ui-pro/locale'

const config = useRuntimeConfig()
const { locale } = useI18n()

const lang = computed(() => locales[locale.value].code)
const dir = computed(() => locales[locale.value].dir)

useHead({
  htmlAttrs: {
    lang,
    dir,
  },
  titleTemplate: `%s · ${config.public.PROJECT_DISPLAY_NAME}`,
})
</script>
