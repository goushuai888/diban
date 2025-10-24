<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Sparkles, Zap, Image, Shield, DollarSign, Clock } from "lucide-vue-next";

// 热门 FSD 权限交易套餐
const featuredPackages = [
  {
    id: 'fsd-monthly',
    title: 'FSD 月租',
    price: '¥1,200',
    period: '/月',
    features: ['随时退租', '灵活方便', '适合体验用户']
  },
  {
    id: 'fsd-transfer',
    title: 'FSD 永久转移',
    price: '¥48,000',
    period: '一次性',
    features: ['永久使用', '可转让', '保值增值']
  },
  {
    id: 'fsd-yearly',
    title: 'FSD 年租',
    price: '¥12,800',
    period: '/年',
    features: ['性价比高', '长期使用', '省心省力']
  }
];
</script>

<template>
  <ScrollArea class="h-[calc(100vh-4rem)] w-full">
    <main class="container mx-auto py-8 px-4">
    <div class="flex flex-col items-center space-y-12">
      <!-- 英雄区域 -->
      <div class="w-full max-w-5xl text-center py-12">
        <h1 class="text-5xl font-bold mb-6">特斯拉 FSD 权限交易平台</h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          安全、便捷的特斯拉 FSD 完全自动驾驶权限担保交易服务，让您的特斯拉解锁智能驾驶新体验
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <RouterLink to="/tradinghall">进入交易大厅</RouterLink>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <RouterLink to="/signup">立即注册</RouterLink>
          </Button>
        </div>
      </div>

      <!-- 特点区域 -->
      <div class="w-full max-w-5xl">
        <h2 class="text-3xl font-bold text-center mb-8">为什么选择我们</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Sparkles class="h-8 w-8 text-primary mb-2" />
              <CardTitle>担保交易</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-muted-foreground">平台全程担保，确保买卖双方权益，资金安全有保障</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Zap class="h-8 w-8 text-primary mb-2" />
              <CardTitle>极速转移</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-muted-foreground">专业团队快速处理，FSD 权限转移流程高效便捷</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Image class="h-8 w-8 text-primary mb-2" />
              <CardTitle>透明定价</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-muted-foreground">市场化定价机制，买卖双方自由协商，公开透明</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- 热门套餐 -->
      <div class="w-full max-w-5xl">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-3xl font-bold">热门套餐</h2>
          <Button variant="ghost" asChild>
            <RouterLink to="/tradinghall" class="flex items-center gap-2">
              查看全部 <ArrowRight class="h-4 w-4" />
            </RouterLink>
          </Button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card
            v-for="pkg in featuredPackages"
            :key="pkg.id"
            class="h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
          >
            <CardHeader>
              <CardTitle>{{ pkg.title }}</CardTitle>
              <div class="flex items-baseline gap-1 mt-2">
                <span class="text-3xl font-bold text-primary">{{ pkg.price }}</span>
                <span class="text-sm text-muted-foreground">{{ pkg.period }}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul class="space-y-2">
                <li v-for="(feature, index) in pkg.features" :key="index" class="flex items-center gap-2 text-sm">
                  <Shield class="h-4 w-4 text-primary" />
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" class="w-full" asChild>
                <RouterLink to="/tradinghall">立即购买</RouterLink>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  </main>
  </ScrollArea>
</template>
