<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import type { Generation } from "@/types/flux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Trash2, X, Calendar, Image as ImageIcon, Clock, User, Users, Check } from "lucide-vue-next";
import { formatDistanceToNow, format } from "date-fns";
import { zhCN } from 'date-fns/locale';
import { fetchGenerations, deleteGeneration, clearAllGenerations } from "@/services/generation-history";
// import { isCurrentUserRecord } from "@/lib/supabase";

// 状态
const generations = ref<Generation[]>([]);
const searchQuery = ref('');
const selectedModel = ref<string>('all');
const selectedTab = ref('grid');
const lightboxOpen = ref(false);
const currentImageIndex = ref(0);
const currentGeneration = ref<Generation | null>(null);
const isNSFW = ref(false);
const isDeleting = ref(false);
const selectedGenerations = ref<Set<string>>(new Set());
const sortOrder = ref<'newest' | 'oldest'>('newest');
const isLoading = ref(false);
const showOnlyMine = ref(true);

// 加载生成历史
onMounted(async () => {
  await loadGenerations();
});

// 监听筛选条件变化，重新加载生成历史
watch(showOnlyMine, async () => {
  await loadGenerations();
});

// 加载生成历史
async function loadGenerations() {
  isLoading.value = true;
  try {
    generations.value = await fetchGenerations(100, showOnlyMine.value);
  } catch (error) {
    console.error('加载生成历史失败:', error);
  } finally {
    isLoading.value = false;
  }
}

// 计算属性
const filteredGenerations = computed(() => {
  let filtered = generations.value.filter(gen => {
    const matchesSearch = searchQuery.value === '' ||
      gen.prompt.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesModel = selectedModel.value === 'all' || gen.modelId === selectedModel.value;
    return matchesSearch && matchesModel;
  });

  // 排序
  filtered = [...filtered].sort((a, b) => {
    if (sortOrder.value === 'newest') {
      return b.timestamp - a.timestamp;
    } else {
      return a.timestamp - b.timestamp;
    }
  });

  return filtered;
});

const uniqueModels = computed(() => {
  const models = new Set(generations.value.map(gen => gen.modelId));
  return Array.from(models);
});

const isAllSelected = computed(() => {
  return filteredGenerations.value.length > 0 &&
    filteredGenerations.value.every(gen => selectedGenerations.value.has(gen.id));
});

const hasSelected = computed(() => selectedGenerations.value.size > 0);

// 方法
const openLightbox = (generation: Generation, imageIndex: number = 0) => {
  if (isDeleting.value) return;

  currentGeneration.value = generation;
  currentImageIndex.value = imageIndex;
  isNSFW.value = generation.output.has_nsfw_concepts?.[imageIndex] || false;
  lightboxOpen.value = true;
};

const closeLightbox = () => {
  lightboxOpen.value = false;
};

const downloadImage = (url: string) => {
  window.open(url, '_blank');
};

const formatDate = (timestamp: number) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: zhCN });
};

const formatFullDate = (timestamp: number) => {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
};

const hasNextImage = computed(() => {
  if (!currentGeneration.value) return false;
  return currentImageIndex.value < currentGeneration.value.output.images.length - 1;
});

const hasPreviousImage = computed(() => {
  return currentImageIndex.value > 0;
});

const nextImage = () => {
  if (hasNextImage.value) {
    currentImageIndex.value++;
    if (currentGeneration.value) {
      isNSFW.value = currentGeneration.value.output.has_nsfw_concepts?.[currentImageIndex.value] || false;
    }
  }
};

const previousImage = () => {
  if (hasPreviousImage.value) {
    currentImageIndex.value--;
    if (currentGeneration.value) {
      isNSFW.value = currentGeneration.value.output.has_nsfw_concepts?.[currentImageIndex.value] || false;
    }
  }
};

const toggleSelection = (id: string) => {
  if (isDeleting.value) {
    if (selectedGenerations.value.has(id)) {
      selectedGenerations.value.delete(id);
    } else {
      selectedGenerations.value.add(id);
    }
  }
};

const toggleAllSelection = () => {
  if (isAllSelected.value) {
    selectedGenerations.value.clear();
  } else {
    filteredGenerations.value.forEach(gen => {
      selectedGenerations.value.add(gen.id);
    });
  }
};

const toggleDeleteMode = () => {
  isDeleting.value = !isDeleting.value;
  if (!isDeleting.value) {
    selectedGenerations.value.clear();
  }
};

const deleteSelected = async () => {
  if (selectedGenerations.value.size === 0) return;

  isLoading.value = true;
  try {
    // 删除选中的记录
    for (const id of selectedGenerations.value) {
      await deleteGeneration(id);
    }

    // 重新加载生成历史
    await loadGenerations();

    selectedGenerations.value.clear();
    isDeleting.value = false;
  } catch (error) {
    console.error('删除生成记录失败:', error);
  } finally {
    isLoading.value = false;
  }
};

const clearAllHistory = async () => {
  if (confirm('确定要清空所有生成历史吗？此操作不可撤销。')) {
    isLoading.value = true;
    try {
      await clearAllGenerations();
      await loadGenerations();
      selectedGenerations.value.clear();
      isDeleting.value = false;
    } catch (error) {
      console.error('清空生成历史失败:', error);
    } finally {
      isLoading.value = false;
    }
  }
};
</script>

<template>
  <ScrollArea class="h-[calc(100vh-4rem)] w-full">
    <div class="container mx-auto py-8 px-4">
      <div class="flex flex-col space-y-6">
      <!-- 标题和操作栏 -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 class="text-3xl font-bold">生成历史</h1>

        <div class="flex flex-wrap gap-2">
          <Button
            v-if="!isDeleting"
            variant="outline"
            size="sm"
            @click="toggleDeleteMode"
            class="gap-2"
          >
            <Trash2 class="h-4 w-4" />
            选择删除
          </Button>

          <Button
            v-else
            variant="destructive"
            size="sm"
            @click="toggleDeleteMode"
            class="gap-2"
          >
            <X class="h-4 w-4" />
            取消选择
          </Button>

          <Button
            v-if="isDeleting && hasSelected"
            variant="destructive"
            size="sm"
            @click="deleteSelected"
            class="gap-2"
          >
            <Trash2 class="h-4 w-4" />
            删除选中 ({{ selectedGenerations.size }})
          </Button>

          <Button
            v-if="generations.length > 0 && !isDeleting"
            variant="outline"
            size="sm"
            @click="clearAllHistory"
            class="gap-2"
          >
            <Trash2 class="h-4 w-4" />
            清空历史
          </Button>
        </div>
      </div>

      <!-- 筛选和搜索 -->
      <div class="flex flex-col sm:flex-row justify-between gap-4">
        <div class="flex flex-wrap gap-2">
          <div class="w-[200px]">
            <Tabs v-model="selectedTab" class="w-full">
              <TabsList class="grid w-full grid-cols-2">
                <TabsTrigger value="grid">网格</TabsTrigger>
                <TabsTrigger value="list">列表</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Select v-model="sortOrder">
            <SelectTrigger class="w-[120px]">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">最新优先</SelectItem>
              <SelectItem value="oldest">最早优先</SelectItem>
            </SelectContent>
          </Select>

          <!-- 只显示我的记录开关 -->
          <div class="flex items-center space-x-2">
            <Switch id="show-only-mine" v-model="showOnlyMine" />
            <Label for="show-only-mine" class="flex items-center gap-1">
              <User v-if="showOnlyMine" class="h-4 w-4" />
              <Users v-else class="h-4 w-4" />
              <span>只显示我的</span>
            </Label>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <div class="relative">
            <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="搜索提示词..."
              class="pl-8 w-[200px]"
            />
          </div>

          <Select v-model="selectedModel">
            <SelectTrigger class="w-[180px]">
              <SelectValue placeholder="选择模型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有模型</SelectItem>
              <SelectItem v-for="model in uniqueModels" :key="model" :value="model">
                {{ model.split('/').pop() }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- 网格视图 -->
      <div v-if="selectedTab === 'grid'">
        <Card v-if="filteredGenerations.length > 0">
          <CardContent class="p-4">
            <div v-if="isDeleting" class="flex justify-between items-center mb-4">
              <Button
                variant="outline"
                size="sm"
                @click="toggleAllSelection"
                class="gap-2"
              >
                {{ isAllSelected ? '取消全选' : '全选' }}
              </Button>

              <span class="text-sm text-muted-foreground">
                已选择 {{ selectedGenerations.size }} 项
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div
                v-for="generation in filteredGenerations"
                :key="generation.id"
                class="group relative overflow-hidden rounded-lg border cursor-pointer"
                @click="isDeleting ? toggleSelection(generation.id) : openLightbox(generation)"
              >
                <!-- 选择框 -->
                <div
                  v-if="isDeleting"
                  class="absolute top-2 right-2 z-10 flex items-center justify-center h-6 w-6 rounded-full"
                  :class="selectedGenerations.has(generation.id) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
                >
                  <Check v-if="selectedGenerations.has(generation.id)" class="h-4 w-4" />
                </div>

                <div class="aspect-square overflow-hidden">
                  <img
                    :src="generation.output.images[0].url"
                    :alt="generation.prompt"
                    class="h-full w-full object-cover transition-all group-hover:scale-105"
                  />
                </div>
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <Badge v-if="generation.isCurrentUser" variant="outline" class="bg-primary/80 text-white border-primary/20 flex items-center gap-1">
                        <User class="h-3 w-3" />
                        我的
                      </Badge>
                      <Badge v-else variant="outline" class="bg-black/50 text-white border-white/20 flex items-center gap-1">
                        <Users class="h-3 w-3" />
                        其他用户
                      </Badge>
                    </div>
                    <p class="text-white text-sm line-clamp-3">{{ generation.prompt }}</p>
                  </div>
                  <div class="flex justify-between items-center">
                    <Badge variant="outline" class="bg-black/50 text-white border-white/20">
                      {{ formatDate(generation.timestamp) }}
                    </Badge>
                    <div class="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        class="h-7 w-7 bg-black/50 border-white/20"
                        @click.stop="downloadImage(generation.output.images[0].url)"
                      >
                        <Download class="h-3.5 w-3.5 text-white" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div v-else class="text-center py-8">
          <p class="text-muted-foreground">没有找到生成历史</p>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-if="selectedTab === 'list'">
        <Card v-if="filteredGenerations.length > 0">
          <CardContent class="p-4">
            <div v-if="isDeleting" class="flex justify-between items-center mb-4">
              <Button
                variant="outline"
                size="sm"
                @click="toggleAllSelection"
                class="gap-2"
              >
                {{ isAllSelected ? '取消全选' : '全选' }}
              </Button>

              <span class="text-sm text-muted-foreground">
                已选择 {{ selectedGenerations.size }} 项
              </span>
            </div>

            <div class="space-y-4">
              <div
                v-for="generation in filteredGenerations"
                :key="generation.id"
                class="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                @click="isDeleting ? toggleSelection(generation.id) : openLightbox(generation)"
              >
                <!-- 选择框 -->
                <div
                  v-if="isDeleting"
                  class="absolute top-2 right-2 z-10 flex items-center justify-center h-6 w-6 rounded-full"
                  :class="selectedGenerations.has(generation.id) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'"
                >
                  <Check v-if="selectedGenerations.has(generation.id)" class="h-4 w-4" />
                </div>

                <!-- 缩略图 -->
                <div class="w-full sm:w-32 h-32 overflow-hidden rounded-md flex-shrink-0">
                  <img
                    :src="generation.output.images[0].url"
                    :alt="generation.prompt"
                    class="h-full w-full object-cover"
                  />
                </div>

                <!-- 详情 -->
                <div class="flex-1 flex flex-col">
                  <h3 class="font-medium line-clamp-2">{{ generation.prompt }}</h3>

                  <div class="mt-2 flex flex-wrap gap-2">
                    <Badge v-if="generation.isCurrentUser" variant="default" class="flex items-center gap-1 bg-primary text-primary-foreground">
                      <User class="h-3 w-3" />
                      我的
                    </Badge>
                    <Badge v-else variant="secondary" class="flex items-center gap-1">
                      <Users class="h-3 w-3" />
                      其他用户
                    </Badge>

                    <Badge variant="outline" class="flex items-center gap-1">
                      <Calendar class="h-3 w-3" />
                      {{ formatFullDate(generation.timestamp) }}
                    </Badge>

                    <Badge variant="outline" class="flex items-center gap-1">
                      <ImageIcon class="h-3 w-3" />
                      {{ generation.modelName }}
                    </Badge>

                    <Badge variant="outline" class="flex items-center gap-1">
                      <Clock class="h-3 w-3" />
                      种子: {{ generation.output.seed }}
                    </Badge>
                  </div>

                  <div class="mt-auto pt-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      class="gap-1"
                      @click.stop="downloadImage(generation.output.images[0].url)"
                    >
                      <Download class="h-3.5 w-3.5" />
                      下载
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div v-else class="text-center py-8">
          <p class="text-muted-foreground">没有找到生成历史</p>
        </div>
      </div>

      <!-- Lightbox Dialog -->
      <Dialog v-model:open="lightboxOpen" @update:open="closeLightbox">
        <DialogContent class="max-w-screen-lg w-full h-[90vh] p-0 gap-0 overflow-hidden mx-auto my-0 inset-0">
          <div class="relative h-full flex flex-col overflow-hidden">
            <!-- Top Bar -->
            <div class="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
              <div class="flex items-center gap-4">
                <div v-if="currentGeneration" class="flex items-center gap-2">
                  <Switch
                    id="nsfw"
                    v-model="isNSFW"
                  />
                  <Label for="nsfw" class="text-white">NSFW</Label>
                </div>
              </div>
              <Button variant="ghost" size="icon" class="text-white" @click="closeLightbox">
                <X class="h-5 w-5" />
              </Button>
            </div>

            <!-- Image Display -->
            <div class="flex-1 flex items-center justify-center bg-black/90 overflow-hidden">
              <img
                v-if="currentGeneration && currentGeneration.output.images[currentImageIndex]"
                :src="currentGeneration.output.images[currentImageIndex].url"
                :alt="currentGeneration.prompt"
                class="max-h-[calc(100%-120px)] max-w-full object-contain"
              />
            </div>

            <!-- Bottom Bar -->
            <div class="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/50 to-transparent">
              <div class="flex justify-between items-center">
                <div class="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    class="bg-black/30 border-white/20 text-white"
                    :disabled="!hasPreviousImage"
                    @click="previousImage"
                  >
                    上一张
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    class="bg-black/30 border-white/20 text-white"
                    :disabled="!hasNextImage"
                    @click="nextImage"
                  >
                    下一张
                  </Button>
                </div>
                <div class="flex gap-2">
                  <Button
                    v-if="currentGeneration"
                    variant="outline"
                    size="sm"
                    class="bg-black/30 border-white/20 text-white"
                    @click="downloadImage(currentGeneration.output.images[currentImageIndex].url)"
                  >
                    <Download class="h-4 w-4 mr-2" />
                    下载
                  </Button>
                </div>
              </div>
              <div v-if="currentGeneration" class="mt-2">
                <p class="text-white text-sm">{{ currentGeneration.prompt }}</p>
                <div class="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" class="bg-black/30 border-white/20 text-white">
                    种子: {{ currentGeneration.output.seed }}
                  </Badge>
                  <Badge variant="outline" class="bg-black/30 border-white/20 text-white">
                    {{ currentGeneration.modelName }}
                  </Badge>
                  <Badge variant="outline" class="bg-black/30 border-white/20 text-white">
                    {{ formatDate(currentGeneration.timestamp) }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  </ScrollArea>
</template>
