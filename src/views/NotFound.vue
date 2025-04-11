<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, ArrowLeft } from 'lucide-vue-next';

const router = useRouter();

const goBack = () => {
  router.back();
};

const goHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
    <div class="flex flex-col items-center justify-center space-y-4 text-center">
      <div class="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileQuestion class="h-10 w-10 text-primary" aria-hidden="true" />
      </div>
      
      <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">404</h1>
      
      <h2 class="text-xl font-semibold sm:text-2xl">Page not found</h2>
      
      <p class="max-w-md text-muted-foreground">
        Sorry, we couldn't find the page you're looking for. The page might have been removed, 
        renamed, or doesn't exist.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 mt-4">
        <Button
          variant="outline"
          class="flex items-center gap-2"
          @click="goBack"
        >
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          Go Back
        </Button>
        
        <Button
          class="flex items-center gap-2"
          @click="goHome"
        >
          <Home class="h-4 w-4" aria-hidden="true" />
          Return Home
        </Button>
      </div>
    </div>
    <div class="mt-10 text-sm text-muted-foreground">
      <p>© {{ new Date().getFullYear() }} Qi Yijiazhen. All rights reserved.</p>
    </div>  
  </div>
</template>