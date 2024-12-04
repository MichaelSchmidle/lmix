<script setup lang="ts">
import { twMerge } from 'tailwind-merge'
</script>

<template>
  <div :class="twMerge('flex items-center justify-between px-4 py-3', $attrs.class as string)">
    <slot />
  </div>
</template>
