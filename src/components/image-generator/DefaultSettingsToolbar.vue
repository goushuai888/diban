<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'vue-sonner';
import { Save, Settings, Check, Trash2 } from "lucide-vue-next";

const props = defineProps<{
  modelId: string;
  parameters: Record<string, any>;
  prompt: string;
}>();

const emit = defineEmits<{
  (e: 'loadSettings', settings: { parameters: Record<string, any>, prompt: string }): void;
}>();

// 状态
const isDialogOpen = ref(false);
const savedSettings = ref<Array<{ name: string, parameters: Record<string, any>, prompt: string }>>([]);
const newSettingName = ref('');

// 存储键
const getStorageKey = () => `fal-ai-default-settings-${props.modelId}`;

// 默认预设设置
const getDefaultPresets = (modelId: string): Array<{ name: string, parameters: Record<string, any>, prompt: string }> => {
  // 根据模型ID返回不同的默认预设
  const presets: Record<string, Array<{ name: string, parameters: Record<string, any>, prompt: string }>> = {
    'fal-ai/flux-pro/v1.1': [
      {
        name: '高清写实风景',
        parameters: {
          image_size: 'landscape_16_9',
          output_format: 'png',
          num_images: 1,
          enable_safety_checker: false,
          safety_tolerance: '6'
        },
        prompt: '美丽的自然风景，高清摄影，阳光明媚，4K超清，精细的细节'
      },
      {
        name: '动漫风格人物',
        parameters: {
          image_size: 'portrait_4_3',
          output_format: 'png',
          num_images: 1,
          enable_safety_checker: true,
          safety_tolerance: '4'
        },
        prompt: '动漫风格的年轻女性角色，彩色插画，精美的线条，精致的细节'
      },
      {
        name: '未来科技风',
        parameters: {
          image_size: 'square_hd',
          output_format: 'png',
          num_images: 1,
          enable_safety_checker: false,
          safety_tolerance: '6'
        },
        prompt: '未来科技风格，高科技城市，青蓝色调，全息式渲染，精细的细节，8K超清'
      }
    ],
    'fal-ai/flux-pro/v1.1-ultra': [
      {
        name: '超宽屏风景',
        parameters: {
          aspect_ratio: '21:9',
          output_format: 'png',
          num_images: 1,
          enable_safety_checker: false,
          safety_tolerance: '6'
        },
        prompt: '壮丽的山脉风景，超宽屏全景，阳光明媚，8K超清，精细的细节'
      },
      {
        name: '电影海报风格',
        parameters: {
          aspect_ratio: '2:3',
          output_format: 'png',
          num_images: 1,
          enable_safety_checker: true,
          safety_tolerance: '4'
        },
        prompt: '电影海报风格，高对比度，强烈的视觉冲击，精美的排版，高质量渲染'
      },
      {
        name: '方形产品展示',
        parameters: {
          aspect_ratio: '1:1',
          output_format: 'png',
          num_images: 1,
          enable_safety_checker: false,
          safety_tolerance: '6'
        },
        prompt: '产品展示照片，简洁的背景，专业的灯光，高清细节，商业摄影'
      }
    ],
    'fal-ai/flux-lora': [
      {
        name: 'LoRA 写实风格',
        parameters: {
          image_size: 'landscape_16_9',
          output_format: 'png',
          num_images: 1,
          num_inference_steps: 40,
          guidance_scale: 7.0,
          enable_safety_checker: false,
          loras: []
        },
        prompt: '高清写实照片，自然光线，精细的细节，专业摄影'
      },
      {
        name: 'LoRA 动漫风格',
        parameters: {
          image_size: 'portrait_4_3',
          output_format: 'png',
          num_images: 1,
          num_inference_steps: 35,
          guidance_scale: 5.0,
          enable_safety_checker: true,
          loras: []
        },
        prompt: '动漫风格插画，鲜艳的色彩，精美的线条，精致的细节'
      },
      {
        name: 'LoRA 概念设计',
        parameters: {
          image_size: 'landscape_4_3',
          output_format: 'png',
          num_images: 1,
          num_inference_steps: 45,
          guidance_scale: 8.0,
          enable_safety_checker: false,
          loras: []
        },
        prompt: '概念设计图，未来风格，强烈的透视感，精细的细节，高质量渲染'
      }
    ]
  };

  // 返回指定模型的预设，如果没有则返回空数组
  return presets[modelId] || [];
};

// 加载保存的设置
onMounted(() => {
  loadSavedSettings();
});

// 监听模型ID变化，重新加载设置
watch(() => props.modelId, () => {
  loadSavedSettings();
});

// 加载保存的设置
function loadSavedSettings() {
  const storageKey = getStorageKey();
  const savedData = localStorage.getItem(storageKey);

  if (savedData) {
    try {
      savedSettings.value = JSON.parse(savedData);
    } catch (error) {
      console.error('解析保存的设置失败:', error);
      savedSettings.value = [];
    }
  } else {
    // 如果没有保存的设置，使用默认预设
    savedSettings.value = getDefaultPresets(props.modelId);

    // 如果有默认预设，将其保存到localStorage
    if (savedSettings.value.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(savedSettings.value));
      console.log(`已加载 ${savedSettings.value.length} 个默认预设设置到 ${props.modelId}`);
    } else {
      savedSettings.value = [];
    }
  }

  // 如果没有活动的设置但有默认预设，自动加载第一个预设
  if (savedSettings.value.length > 0 && !props.prompt) {
    // 延迟加载默认设置，确保组件已完全渲染
    setTimeout(() => {
      loadSettings(savedSettings.value[0]);
    }, 300);
  }
}

// 保存当前设置
function saveCurrentSettings() {
  if (!newSettingName.value.trim()) {
    toast.error('请输入设置名称');
    return;
  }

  // 检查是否已存在同名设置
  const existingIndex = savedSettings.value.findIndex(s => s.name === newSettingName.value);

  const settingToSave = {
    name: newSettingName.value,
    parameters: { ...props.parameters },
    prompt: props.prompt
  };

  if (existingIndex >= 0) {
    // 更新现有设置
    savedSettings.value[existingIndex] = settingToSave;
    toast.success(`已更新设置: ${newSettingName.value}`);
  } else {
    // 添加新设置
    savedSettings.value.push(settingToSave);
    toast.success(`已保存设置: ${newSettingName.value}`);
  }

  // 保存到localStorage
  localStorage.setItem(getStorageKey(), JSON.stringify(savedSettings.value));

  // 重置表单并关闭对话框
  newSettingName.value = '';
  isDialogOpen.value = false;
}

// 加载设置
function loadSettings(setting: { name: string, parameters: Record<string, any>, prompt: string }) {
  emit('loadSettings', {
    parameters: { ...setting.parameters },
    prompt: setting.prompt
  });
  toast.success(`已加载设置: ${setting.name}`);
}

// 删除设置
function deleteSetting(index: number) {
  const settingName = savedSettings.value[index].name;
  savedSettings.value.splice(index, 1);
  localStorage.setItem(getStorageKey(), JSON.stringify(savedSettings.value));
  toast.success(`已删除设置: ${settingName}`);
}
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- 保存设置对话框 -->
    <Dialog v-model:open="isDialogOpen">
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" class="gap-1">
          <Save class="h-4 w-4" />
          保存设置
        </Button>
      </DialogTrigger>

      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>保存默认设置</DialogTitle>
          <DialogDescription>
            保存当前的生成参数和提示词作为默认设置，方便下次使用。
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="setting-name" class="text-right">
              设置名称
            </Label>
            <Input
              id="setting-name"
              v-model="newSettingName"
              placeholder="例如: 高清风景"
              class="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button @click="saveCurrentSettings">保存设置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 加载设置下拉菜单 -->
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" class="gap-1">
          <Settings class="h-4 w-4" />
          默认设置
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-56">
        <div v-if="savedSettings.length === 0" class="px-2 py-1.5 text-sm text-muted-foreground">
          暂无保存的设置
        </div>

        <div v-else>
          <div v-for="(setting, index) in savedSettings" :key="index" class="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm">
            <button
              class="flex-1 text-left text-sm"
              @click="loadSettings(setting)"
            >
              {{ setting.name }}
            </button>

            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6"
              @click="deleteSetting(index)"
            >
              <Trash2 class="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
