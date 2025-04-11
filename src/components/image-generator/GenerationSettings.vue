<script setup lang="ts">
import { computed } from 'vue';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Model, ModelParameter } from "@/types/flux";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-vue-next";
import DefaultSettingsToolbar from "./DefaultSettingsToolbar.vue";

const props = defineProps<{
  prompt: string;
  isGenerating: boolean;
  model: Model;
  parameters: Record<string, any>;
}>();

const emit = defineEmits<{
  (e: 'update:prompt', value: string): void;
  (e: 'update:parameters', value: Record<string, any>): void;
  (e: 'generate'): void;
  (e: 'loadSettings', settings: { parameters: Record<string, any>, prompt: string }): void;
}>();

const updatePrompt = (value: string) => {
  emit('update:prompt', value);
};

// 加载默认设置
const loadSettings = (settings: { parameters: Record<string, any>, prompt: string }) => {
  emit('loadSettings', settings);
};

const updateParameter = (key: string, value: any) => {
  const newParameters = { ...props.parameters, [key]: value };
  emit('update:parameters', newParameters);
};

// 过滤出各类参数
const enumParameters = computed(() => {
  return props.model.inputSchema
    .filter(param => param.type === 'enum' && param.key !== 'prompt');
});

const booleanParameters = computed(() => {
  return props.model.inputSchema
    .filter(param => param.type === 'boolean' && param.key !== 'sync_mode' && param.key !== 'enable_safety_checker');
});

const numberParameters = computed(() => {
  return props.model.inputSchema
    .filter(param => param.type === 'number' && param.key !== 'loras');
});

const loraParameters = computed(() => {
  return props.model.inputSchema
    .filter(param => param.key === 'loras');
});

// 格式化参数名称
const formatParamName = (key: string) => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// 获取参数值
const getParamValue = (param: ModelParameter) => {
  return props.parameters[param.key] ?? param.default;
};

// 特殊配置
const getSliderConfig = (key: string) => {
  const configs = {
    guidance_scale: {
      min: 1,
      max: 10,
      step: 0.1,
      default: 3.5,
      decimals: 1
    },
    num_inference_steps: {
      min: 1,
      max: 50,
      step: 1,
      default: 35,
      decimals: 0
    }
  };
  return configs[key as keyof typeof configs];
};

// 处理LoRA添加
const addLora = (param: ModelParameter) => {
  const loras = getParamValue(param) as Array<{ path: string; scale: number }> || [];
  const newLoras = [...loras, { path: "", scale: 1 }];
  updateParameter(param.key, newLoras);
};

// 处理LoRA移除
const removeLora = (param: ModelParameter, index: number) => {
  const loras = getParamValue(param) as Array<{ path: string; scale: number }> || [];
  const newLoras = [...loras];
  newLoras.splice(index, 1);
  updateParameter(param.key, newLoras);
};

// 处理LoRA更新
const updateLoraPath = (param: ModelParameter, index: number, value: string) => {
  const loras = getParamValue(param) as Array<{ path: string; scale: number }> || [];
  const newLoras = [...loras];
  newLoras[index].path = value;
  updateParameter(param.key, newLoras);
};

const updateLoraScale = (param: ModelParameter, index: number, value: number) => {
  const loras = getParamValue(param) as Array<{ path: string; scale: number }> || [];
  const newLoras = [...loras];
  newLoras[index].scale = value;
  updateParameter(param.key, newLoras);
};
</script>

<template>
  <Card class="h-full">
    <CardHeader class="pb-4">
      <div class="flex justify-between items-start">
        <div>
          <CardTitle>设置</CardTitle>
          <CardDescription>为 {{ model.name }} 配置您的图像生成</CardDescription>
        </div>
        <DefaultSettingsToolbar
          :modelId="model.id"
          :parameters="parameters"
          :prompt="prompt"
          @loadSettings="loadSettings"
        />
      </div>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="space-y-1">
        <Label for="prompt" class="text-sm">提示词</Label>
        <Textarea
          id="prompt"
          :value="prompt"
          @input="(e: Event) => updatePrompt((e.target as HTMLTextAreaElement).value)"
          placeholder="输入您的图像生成提示词..."
          class="min-h-[80px]"
        />
      </div>

      <!-- 枚举参数的网格布局 -->
      <div v-if="enumParameters.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div v-for="param in enumParameters" :key="param.key" class="space-y-1">
          <Label :for="param.key" class="text-sm">{{ formatParamName(param.key) }}</Label>
          <Select
            :value="getParamValue(param)"
            @update:modelValue="(newValue: any) => updateParameter(param.key, newValue)"
          >
            <SelectTrigger :id="param.key">
              <SelectValue placeholder="选择选项" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in param.options"
                :key="option as string"
                :value="option as string"
              >
                {{ option as string }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- 布尔参数的网格布局 -->
      <div v-if="booleanParameters.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <div
          v-for="param in booleanParameters"
          :key="param.key"
          class="flex items-center justify-between space-x-2 py-1"
        >
          <Label :for="param.key" class="text-sm">{{ formatParamName(param.key) }}</Label>
          <Switch
            :id="param.key"
            :checked="getParamValue(param)"
            @update:checked="(newValue: boolean) => updateParameter(param.key, newValue)"
          />
        </div>
      </div>

      <!-- 数字参数的网格布局 -->
      <div v-if="numberParameters.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <template v-for="param in numberParameters" :key="param.key">
          <!-- 特殊处理 guidance_scale 和 num_inference_steps -->
          <div v-if="param.key === 'guidance_scale' || param.key === 'num_inference_steps'" class="space-y-1">
            <div class="flex items-center justify-between">
              <Label :for="param.key" class="text-sm">
                {{ formatParamName(param.key) }}
              </Label>
              <span class="text-sm w-12 text-right">
                {{ Number(getParamValue(param) || getSliderConfig(param.key).default).toFixed(getSliderConfig(param.key).decimals) }}
              </span>
            </div>
            <Slider
              :id="param.key"
              :min="getSliderConfig(param.key).min"
              :max="getSliderConfig(param.key).max"
              :step="getSliderConfig(param.key).step"
              :model-value="[getParamValue(param) || getSliderConfig(param.key).default]"
              @update:model-value="(values: number[] | undefined) => values && updateParameter(param.key, values[0])"
              class="w-full"
            />
          </div>

          <!-- 其他数字参数的默认输入 -->
          <div v-else class="space-y-1">
            <Label :for="param.key" class="text-sm">{{ formatParamName(param.key) }}</Label>
            <Input
              :id="param.key"
              type="number"
              :value="getParamValue(param)"
              class="h-8"
              @input="(e: Event) => updateParameter(param.key, Number((e.target as HTMLInputElement).value))"
            />
          </div>
        </template>
      </div>

      <!-- LoRA参数 -->
      <div v-for="param in loraParameters" :key="param.key" class="space-y-3">
        <Label class="text-sm">LoRA 权重</Label>
        <div
          v-for="(lora, index) in (getParamValue(param) as Array<{ path: string; scale: number }> || [])"
          :key="index"
          class="grid grid-cols-4 gap-2 relative group"
        >
          <div class="col-span-2">
            <Input
              placeholder="LoRA 路径或URL"
              :value="lora.path"
              @input="(e: Event) => updateLoraPath(param, index, (e.target as HTMLInputElement).value)"
            />
          </div>
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">比例</span>
              <span class="text-xs w-8 text-right">{{ lora.scale.toFixed(1) }}</span>
            </div>
            <Slider
              :min="0"
              :max="2"
              :step="0.1"
              :model-value="[lora.scale]"
              @update:model-value="(values: number[] | undefined) => values && updateLoraScale(param, index, values[0])"
              class="w-full"
            />
          </div>
          <!-- 删除按钮 -->
          <div class="flex items-center justify-center">
            <Button
              variant="destructive"
              size="icon"
              class="h-8 w-8 opacity-70 group-hover:opacity-100 transition-opacity"
              @click="removeLora(param, index)"
              title="移除此LoRA"
            >
              <X class="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          v-if="(getParamValue(param) as Array<{ path: string; scale: number }> || []).length < 3"
          variant="outline"
          size="sm"
          class="w-full"
          @click="addLora(param)"
        >
          添加 LoRA
        </Button>
      </div>
    </CardContent>
    <CardFooter>
      <Button
        @click="$emit('generate')"
        :disabled="isGenerating || !prompt"
        class="w-full"
      >
        {{ isGenerating ? "生成中..." : "生成图像" }}
      </Button>
    </CardFooter>
  </Card>
</template>
