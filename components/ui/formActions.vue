<script setup lang="ts">
import { twMerge } from 'tailwind-merge'
</script>

<template>
  <div :class="twMerge('flex gap-[1ch] items-center justify-end', $attrs.class as string)">
    <slot />
  </div>
</template>
