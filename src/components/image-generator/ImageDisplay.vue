<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-vue-next";
import { Skeleton } from "@/components/ui/skeleton";
import type { Image } from "@/types/flux";

defineProps<{
  result: Image | null;
  isGenerating: boolean;
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
      <!-- 生成中的骨架屏 -->
      <div v-if="isGenerating" class="relative h-[300px] rounded-lg overflow-hidden">
        <Skeleton class="absolute inset-0 h-full w-full" />
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-2"></div>
            <p class="text-muted-foreground">正在生成图像...</p>
          </div>
        </div>
      </div>
      <!-- 已生成的图像 -->
      <img
        v-else-if="result"
        :src="result.url"
        alt="生成的图像"
        :width="result.width"
        :height="result.height"
        class="rounded-lg w-full object-cover"
      />
      <!-- 未生成状态 -->
      <div v-else class="flex items-center justify-center h-[300px] bg-muted rounded-lg">
        <p class="text-muted-foreground">尚未生成图像</p>
      </div>
    </CardContent>
  </Card>
</template>
