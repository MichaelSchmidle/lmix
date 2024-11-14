<script setup lang="ts">
import { twMerge } from 'tailwind-merge'
</script>

<template>
  <div :class="twMerge('flex flex-col divide-y divide-gray-200 dark:divide-gray-800 h-screen w-full', $attrs.class as string)">
    <slot />
  </div>
</template>
