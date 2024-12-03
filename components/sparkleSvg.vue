<script setup lang="ts">

interface Line {
  x1: number
  x2: number
  y: number
  rotation: number
  opacity: number
}

const lines = ref<Line[]>([])

const generateRandomLines = () => {
  const newLines: Line[] = []
  const numberOfLines = 24
  const angleIncrement = 360 / numberOfLines / 2
  const initialRotation = Math.random() * 360 // Random starting angle between 0 and 360 degrees

  for (let i = 0; i < numberOfLines; i++) {
    // Generate random length (between 50 and 700 pixels)
    const length = Math.random() * 640 + 60
    const centerX = 400
    const x1 = centerX - length / 2
    const x2 = centerX + length / 2

    // Calculate evenly distributed rotation with random starting point
    const rotation = (initialRotation + i * angleIncrement) % 360

    // Generate random opacity (0.1-1.0)
    const opacity = (Math.random() * 0.9 + 0.1).toFixed(2)

    newLines.push({
      x1,
      x2,
      y: 400, // Keep center Y constant
      rotation,
      opacity: Number(opacity),
    })
  }

  lines.value = newLines
}

onMounted(() => {
  generateRandomLines()
})
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:svgjs="http://svgjs.dev/svgjs" viewBox="0 0 800 800" height="100%" width="100%"
    preserve-aspect-ratio="xMidYMid slice">
    <g fill="none" stroke-width="4" stroke="currentColor" stroke-linecap="round">
      <line v-for="(line, index) in lines" :key="index" :x1="line.x1" :x2="line.x2" :y1="line.y" :y2="line.y"
        :transform="`rotate(${line.rotation}, 400, 400)`" :opacity="line.opacity"
        :class="Math.random() < 0.5 ? 'text-primary' : 'text-cyan-500 dark:text-cyan-400'">
      </line>
    </g>
  </svg>
</template>
