<script setup lang="ts">
import { ref } from 'vue';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, Clock, User, TrendingUp } from "lucide-vue-next";

// FSD 权限交易类型
interface FSDListing {
  id: string;
  type: 'buy' | 'sell' | 'rent';
  title: string;
  price: number;
  period?: 'monthly' | 'yearly' | 'permanent';
  seller: string;
  sellerRating: number;
  location: string;
  description: string;
  features: string[];
  postedAt: string;
  status: 'active' | 'pending' | 'sold';
}

// 模拟数据 - 实际应该从API获取
const mockListings: FSDListing[] = [
  {
    id: '1',
    type: 'sell',
    title: 'FSD 永久权限转让 - Model 3',
    price: 48000,
    period: 'permanent',
    seller: '特斯拉车主A',
    sellerRating: 4.9,
    location: '北京',
    description: '2023款 Model 3，FSD 完整功能，支持最新版本，可现场验证',
    features: ['完整功能', '可验证', '支持最新版本', '平台担保'],
    postedAt: '2小时前',
    status: 'active'
  },
  {
    id: '2',
    type: 'rent',
    title: 'FSD 月租服务 - 随时退租',
    price: 1200,
    period: 'monthly',
    seller: '官方认证商家',
    sellerRating: 5.0,
    location: '全国',
    description: '官方认证月租服务，随时退租，无违约金，支持所有特斯拉车型',
    features: ['随时退租', '官方认证', '支持所有车型', '无违约金'],
    postedAt: '1天前',
    status: 'active'
  },
  {
    id: '3',
    type: 'sell',
    title: 'FSD 永久权限 - Model Y 长续航',
    price: 52000,
    period: 'permanent',
    seller: '特斯拉车主B',
    sellerRating: 4.8,
    location: '上海',
    description: '2024款 Model Y，含 FSD 完整授权，急售优惠',
    features: ['2024款', '急售优惠', '可议价', '平台担保'],
    postedAt: '3小时前',
    status: 'active'
  },
  {
    id: '4',
    type: 'rent',
    title: 'FSD 年租套餐 - 性价比之选',
    price: 12800,
    period: 'yearly',
    seller: '官方认证商家',
    sellerRating: 5.0,
    location: '全国',
    description: '年租优惠价，平均每月仅1066元，享受完整 FSD 功能',
    features: ['性价比高', '官方认证', '一年保障', '免费更新'],
    postedAt: '2天前',
    status: 'active'
  },
  {
    id: '5',
    type: 'buy',
    title: '求购 FSD 权限 - Model 3',
    price: 45000,
    period: 'permanent',
    seller: '特斯拉车主C',
    sellerRating: 4.7,
    location: '深圳',
    description: '诚心求购 Model 3 FSD 永久权限，价格可谈',
    features: ['诚信交易', '价格可谈', '现金支付', '快速成交'],
    postedAt: '5小时前',
    status: 'active'
  },
  {
    id: '6',
    type: 'sell',
    title: 'FSD 永久权限 - Model S Plaid',
    price: 58000,
    period: 'permanent',
    seller: '特斯拉车主D',
    sellerRating: 4.9,
    location: '广州',
    description: 'Model S Plaid 顶配，FSD 完整功能，支持城市道路导航',
    features: ['顶配车型', '城市导航', '完整功能', '可现场验证'],
    postedAt: '1天前',
    status: 'active'
  }
];

// 搜索和筛选
const searchQuery = ref('');
const activeTab = ref('all');

// 过滤列表
const filteredListings = (listings: FSDListing[]) => {
  let filtered = listings;

  // 按类型筛选
  if (activeTab.value !== 'all') {
    filtered = filtered.filter(item => item.type === activeTab.value);
  }

  // 按关键词搜索
  if (searchQuery.value) {
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  return filtered;
};

// 格式化价格
const formatPrice = (price: number) => {
  return price.toLocaleString('zh-CN');
};

// 获取类型标签
const getTypeBadge = (type: string) => {
  const badges = {
    sell: { label: '出售', variant: 'default' },
    buy: { label: '求购', variant: 'secondary' },
    rent: { label: '出租', variant: 'outline' }
  };
  return badges[type as keyof typeof badges];
};

// 获取周期标签
const getPeriodLabel = (period?: string) => {
  const labels = {
    monthly: '/月',
    yearly: '/年',
    permanent: '永久'
  };
  return period ? labels[period as keyof typeof labels] : '';
};
</script>

<template>
  <ScrollArea class="h-[calc(100vh-4rem)] w-full">
    <main class="container mx-auto py-8 px-4">
      <div class="flex flex-col items-center space-y-8">
        <div class="text-center">
          <h1 class="text-4xl font-bold mb-3">FSD 权限交易大厅</h1>
          <p class="text-muted-foreground max-w-2xl">
            安全可靠的特斯拉 FSD 完全自动驾驶权限交易平台，买卖出租一站式服务
          </p>
        </div>

        <!-- 搜索栏 -->
        <div class="w-full max-w-md relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="搜索地区、车型或关键词..."
            class="pl-10"
          />
        </div>

        <!-- 交易类型标签页 -->
        <Tabs v-model="activeTab" class="w-full max-w-6xl">
          <TabsList class="grid w-full grid-cols-4">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="sell">出售</TabsTrigger>
            <TabsTrigger value="buy">求购</TabsTrigger>
            <TabsTrigger value="rent">出租</TabsTrigger>
          </TabsList>

          <!-- 全部交易 -->
          <TabsContent value="all" class="mt-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card
                v-for="listing in filteredListings(mockListings)"
                :key="listing.id"
                class="h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              >
                <CardHeader>
                  <div class="flex items-start justify-between mb-2">
                    <Badge :variant="getTypeBadge(listing.type).variant as any">
                      {{ getTypeBadge(listing.type).label }}
                    </Badge>
                    <span class="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock class="h-3 w-3" />
                      {{ listing.postedAt }}
                    </span>
                  </div>
                  <CardTitle class="text-lg line-clamp-2">{{ listing.title }}</CardTitle>
                  <div class="flex items-baseline gap-1 mt-2">
                    <span class="text-2xl font-bold text-primary">¥{{ formatPrice(listing.price) }}</span>
                    <span class="text-sm text-muted-foreground">{{ getPeriodLabel(listing.period) }}</span>
                  </div>
                </CardHeader>

                <CardContent class="space-y-3">
                  <p class="text-sm text-muted-foreground line-clamp-2">
                    {{ listing.description }}
                  </p>

                  <div class="flex items-center gap-4 text-xs text-muted-foreground">
                    <span class="flex items-center gap-1">
                      <User class="h-3 w-3" />
                      {{ listing.seller }}
                    </span>
                    <span class="flex items-center gap-1">
                      <TrendingUp class="h-3 w-3" />
                      {{ listing.sellerRating }}分
                    </span>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <Badge
                      v-for="(feature, index) in listing.features.slice(0, 3)"
                      :key="index"
                      variant="secondary"
                      class="text-xs"
                    >
                      {{ feature }}
                    </Badge>
                  </div>
                </CardContent>

                <CardFooter class="flex gap-2">
                  <Button variant="default" class="flex-1">
                    <Shield class="h-4 w-4 mr-1" />
                    担保交易
                  </Button>
                  <Button variant="outline" class="flex-1">
                    详情
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <!-- 空状态 -->
            <div v-if="filteredListings(mockListings).length === 0" class="text-center py-12">
              <p class="text-muted-foreground">暂无相关交易信息</p>
            </div>
          </TabsContent>

          <!-- 出售列表 -->
          <TabsContent value="sell" class="mt-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card
                v-for="listing in filteredListings(mockListings)"
                :key="listing.id"
                class="h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              >
                <CardHeader>
                  <div class="flex items-start justify-between mb-2">
                    <Badge :variant="getTypeBadge(listing.type).variant as any">
                      {{ getTypeBadge(listing.type).label }}
                    </Badge>
                    <span class="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock class="h-3 w-3" />
                      {{ listing.postedAt }}
                    </span>
                  </div>
                  <CardTitle class="text-lg line-clamp-2">{{ listing.title }}</CardTitle>
                  <div class="flex items-baseline gap-1 mt-2">
                    <span class="text-2xl font-bold text-primary">¥{{ formatPrice(listing.price) }}</span>
                    <span class="text-sm text-muted-foreground">{{ getPeriodLabel(listing.period) }}</span>
                  </div>
                </CardHeader>

                <CardContent class="space-y-3">
                  <p class="text-sm text-muted-foreground line-clamp-2">
                    {{ listing.description }}
                  </p>

                  <div class="flex items-center gap-4 text-xs text-muted-foreground">
                    <span class="flex items-center gap-1">
                      <User class="h-3 w-3" />
                      {{ listing.seller }}
                    </span>
                    <span class="flex items-center gap-1">
                      <TrendingUp class="h-3 w-3" />
                      {{ listing.sellerRating }}分
                    </span>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <Badge
                      v-for="(feature, index) in listing.features.slice(0, 3)"
                      :key="index"
                      variant="secondary"
                      class="text-xs"
                    >
                      {{ feature }}
                    </Badge>
                  </div>
                </CardContent>

                <CardFooter class="flex gap-2">
                  <Button variant="default" class="flex-1">
                    <Shield class="h-4 w-4 mr-1" />
                    担保交易
                  </Button>
                  <Button variant="outline" class="flex-1">
                    详情
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div v-if="filteredListings(mockListings).length === 0" class="text-center py-12">
              <p class="text-muted-foreground">暂无出售信息</p>
            </div>
          </TabsContent>

          <!-- 求购列表 -->
          <TabsContent value="buy" class="mt-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card
                v-for="listing in filteredListings(mockListings)"
                :key="listing.id"
                class="h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              >
                <CardHeader>
                  <div class="flex items-start justify-between mb-2">
                    <Badge :variant="getTypeBadge(listing.type).variant as any">
                      {{ getTypeBadge(listing.type).label }}
                    </Badge>
                    <span class="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock class="h-3 w-3" />
                      {{ listing.postedAt }}
                    </span>
                  </div>
                  <CardTitle class="text-lg line-clamp-2">{{ listing.title }}</CardTitle>
                  <div class="flex items-baseline gap-1 mt-2">
                    <span class="text-2xl font-bold text-primary">¥{{ formatPrice(listing.price) }}</span>
                    <span class="text-sm text-muted-foreground">{{ getPeriodLabel(listing.period) }}</span>
                  </div>
                </CardHeader>

                <CardContent class="space-y-3">
                  <p class="text-sm text-muted-foreground line-clamp-2">
                    {{ listing.description }}
                  </p>

                  <div class="flex items-center gap-4 text-xs text-muted-foreground">
                    <span class="flex items-center gap-1">
                      <User class="h-3 w-3" />
                      {{ listing.seller }}
                    </span>
                    <span class="flex items-center gap-1">
                      <TrendingUp class="h-3 w-3" />
                      {{ listing.sellerRating }}分
                    </span>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <Badge
                      v-for="(feature, index) in listing.features.slice(0, 3)"
                      :key="index"
                      variant="secondary"
                      class="text-xs"
                    >
                      {{ feature }}
                    </Badge>
                  </div>
                </CardContent>

                <CardFooter class="flex gap-2">
                  <Button variant="default" class="flex-1">
                    <Shield class="h-4 w-4 mr-1" />
                    担保交易
                  </Button>
                  <Button variant="outline" class="flex-1">
                    详情
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div v-if="filteredListings(mockListings).length === 0" class="text-center py-12">
              <p class="text-muted-foreground">暂无求购信息</p>
            </div>
          </TabsContent>

          <!-- 出租列表 -->
          <TabsContent value="rent" class="mt-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card
                v-for="listing in filteredListings(mockListings)"
                :key="listing.id"
                class="h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              >
                <CardHeader>
                  <div class="flex items-start justify-between mb-2">
                    <Badge :variant="getTypeBadge(listing.type).variant as any">
                      {{ getTypeBadge(listing.type).label }}
                    </Badge>
                    <span class="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock class="h-3 w-3" />
                      {{ listing.postedAt }}
                    </span>
                  </div>
                  <CardTitle class="text-lg line-clamp-2">{{ listing.title }}</CardTitle>
                  <div class="flex items-baseline gap-1 mt-2">
                    <span class="text-2xl font-bold text-primary">¥{{ formatPrice(listing.price) }}</span>
                    <span class="text-sm text-muted-foreground">{{ getPeriodLabel(listing.period) }}</span>
                  </div>
                </CardHeader>

                <CardContent class="space-y-3">
                  <p class="text-sm text-muted-foreground line-clamp-2">
                    {{ listing.description }}
                  </p>

                  <div class="flex items-center gap-4 text-xs text-muted-foreground">
                    <span class="flex items-center gap-1">
                      <User class="h-3 w-3" />
                      {{ listing.seller }}
                    </span>
                    <span class="flex items-center gap-1">
                      <TrendingUp class="h-3 w-3" />
                      {{ listing.sellerRating }}分
                    </span>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <Badge
                      v-for="(feature, index) in listing.features.slice(0, 3)"
                      :key="index"
                      variant="secondary"
                      class="text-xs"
                    >
                      {{ feature }}
                    </Badge>
                  </div>
                </CardContent>

                <CardFooter class="flex gap-2">
                  <Button variant="default" class="flex-1">
                    <Shield class="h-4 w-4 mr-1" />
                    担保交易
                  </Button>
                  <Button variant="outline" class="flex-1">
                    详情
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div v-if="filteredListings(mockListings).length === 0" class="text-center py-12">
              <p class="text-muted-foreground">暂无出租信息</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  </ScrollArea>
</template>
