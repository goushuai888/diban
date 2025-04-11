<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { School, Github, Heart, ExternalLink } from 'lucide-vue-next';

// Get current year for copyright
const currentYear = new Date().getFullYear();
const router = useRouter();

// Current app version - you can update this as needed
const appVersion = ref('v1.0.0');

// Navigate to different pages
const navigateTo = (route: string) => {
  router.push(route);
};
</script>

<template>
  <footer class="border-t bg-background mt-auto w-full">
    <div class="container mx-auto px-4 py-6 sm:px-6 md:flex md:items-center md:justify-between">
      <!-- Logo and Copyright -->
      <div class="flex items-center justify-center md:justify-start gap-2 mb-4 md:mb-0">
        <School class="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <p class="text-sm text-muted-foreground">
          © {{ currentYear }} Qi Yijiazhen
        </p>
      </div>

      <!-- Links -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
        <Button variant="link" size="sm" class="text-xs text-muted-foreground hover:text-foreground" @click="navigateTo('/terms')">
          Terms of Service
        </Button>
        <Button variant="link" size="sm" class="text-xs text-muted-foreground hover:text-foreground" @click="navigateTo('/privacy')">
          Privacy Policy
        </Button>
        <Button variant="link" size="sm" class="text-xs text-muted-foreground hover:text-foreground" @click="navigateTo('/faq')">
          FAQ &amp; Help
        </Button>
      </div>

      <!-- Version and GitHub -->
      <div class="flex items-center justify-center md:justify-end gap-4 mt-4 md:mt-0">
        <span class="text-xs text-muted-foreground">{{ appVersion }}</span>
        <a 
          href="https://github.com/kiwigaze/HKU-Admin-System" 
          target="_blank" 
          rel="noopener noreferrer"
          class="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Github class="h-4 w-4 mr-1" />
          <span>GitHub</span>
          <ExternalLink class="h-3 w-3 ml-0.5" />
        </a>
      </div>
    </div>
  </footer>
</template>