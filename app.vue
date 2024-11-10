<script setup>
useHead({
  templateParams: {
    separator: '·'
  },
  titleTemplate: '%s %separator LMiX'
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>