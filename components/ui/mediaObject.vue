<script setup lang="ts">
import { twMerge } from 'tailwind-merge'

defineProps<{
    isInverse?: boolean
    collapsible?: boolean
}>()
</script>

<template>
    <div
        :class="twMerge('flex gap-[2ex] items-center', isInverse ? 'flex-row-reverse' : 'flex-row', $attrs.class as string)">
        <div v-if="$slots.media" :class="['self-start', collapsible ? 'hidden sm:flex' : 'flex']">
            <slot name="media" />
        </div>
        <div v-if="$slots.default" :class="['leading-tight', isInverse ? 'text-end' : 'text-start']">
            <slot />
        </div>
    </div>
</template>