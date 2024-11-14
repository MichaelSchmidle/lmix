<script setup lang="ts">
defineProps({
  icon: {
    type: String,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
})
</script>

<template>
  <div class="prose lg:prose-lg xl:prose-xl dark:prose-invert py-12">
    <p>
      <UIcon v-if="icon" :name="icon" class="text-primary h-12 w-12" />
    </p>
    <h1 v-if="title || $slots.title" class="font-serif">
      <slot name="title">{{ title }}</slot>
    </h1>
    <p v-if="description || $slots.description">
      <slot name="description">{{ description }}</slot>
    </p>
  </div>
</template>