<script setup>
useHead({
  templateParams: {
    separator: '·'
  },
  titleTemplate: 'LMiX %separator %s'
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