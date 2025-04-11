<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-vue-next";
import type { Image } from "@/types/flux";

defineProps<{
  result: Image | null;
}>();

const openImage = (url: string) => {
  window.open(url, '_blank');
};
</script>

<template>
  <Card class="h-full">
    <CardHeader class="flex flex-row items-center justify-between">
      <div>
        <CardTitle>生成的图像</CardTitle>
        <CardDescription>您的AI生成的艺术作品将显示在这里</CardDescription>
      </div>
      <Button
        v-if="result"
        variant="outline"
        size="icon"
        @click="result && openImage(result.url)"
        title="下载图像"
      >
        <Download class="h-4 w-4" />
      </Button>
    </CardHeader>
    <CardContent>
      <img
        v-if="result"
        :src="result.url"
        alt="生成的图像"
        :width="result.width"
        :height="result.height"
        class="rounded-lg w-full object-cover"
      />
      <div v-else class="flex items-center justify-center h-[300px] bg-muted rounded-lg">
        <p class="text-muted-foreground">尚未生成图像</p>
      </div>
    </CardContent>
  </Card>
</template>
