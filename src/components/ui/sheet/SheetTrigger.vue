<script setup lang="ts">
import { inject } from 'vue'

const sheet = inject('sheet', {
  open: { value: false },
  onOpenChange: (value: boolean) => {},
})

const handleClick = () => {
  sheet.onOpenChange(true)
}
</script>

<template>
  <div @click="handleClick">
    <slot />
  </div>
</template>
