<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'destructive' | 'warning' | 'success';
  }>(),
  {
    variant: 'default',
  }
);

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        warning:
          'border-warning/50 text-warning dark:border-warning [&>svg]:text-warning',
        success:
          'border-success/50 text-success dark:border-success [&>svg]:text-success',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
</script>

<template>
  <div
    :class="cn(alertVariants({ variant: props.variant }), $attrs.class ?? '')"
    role="alert"
  >
    <slot />
  </div>
</template>
