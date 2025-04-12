<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Model, ModelParameter } from "@/types/flux";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { X, Wand2, ExternalLink, AlertTriangle } from "lucide-vue-next";
import DefaultSettingsToolbar from "./DefaultSettingsToolbar.vue";
import { fal } from "@fal-ai/client";
import { toast } from 'vue-sonner';

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

// 初始化所有参数
const initializeAllParameters = () => {
  // 检查所有参数是否有值
  props.model.inputSchema.forEach(param => {
    if (props.parameters[param.key] === undefined && param.default !== undefined) {
      updateParameter(param.key, param.default);
      console.log(`设置参数 ${param.key} 的初始值为 ${param.default}`);
    }
  });

  // 特别处理枚举参数，确保它们有正确的值
  enumParameters.value.forEach(param => {
    // 如果参数值不在选项中，重置为默认值
    const currentValue = props.parameters[param.key];
    if (currentValue !== undefined && param.options && !param.options.includes(currentValue)) {
      updateParameter(param.key, param.default);
      console.log(`重置参数 ${param.key} 的值为 ${param.default}`);
    }
  });
};

// 组件挂载后确保所有参数都有初始值
onMounted(() => {
  // 延迟初始化，确保组件已完全渲染
  setTimeout(() => {
    initializeAllParameters();
  }, 100);
});

// 监听模型变化，重新设置参数
watch(() => props.model.id, () => {
  // 延迟初始化，确保模型数据已更新
  setTimeout(() => {
    initializeAllParameters();
  }, 100);
});

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
  // 参数名称中文映射
  const nameMap: Record<string, string> = {
    // 通用参数
    'prompt': '提示词',
    'negative_prompt': '负面提示词',
    'num_inference_steps': '推理步数',
    'guidance_scale': '引导强度',
    'seed': '随机种子',
    'num_images': '图像数量',
    'image_size': '图像尺寸',
    'aspect_ratio': '宽高比',
    'output_format': '输出格式',
    'safety_tolerance': '安全容差',
    'enable_safety_checker': '启用安全检查',
    'sync_mode': '同步模式',

    // LoRA 相关
    'loras': 'LoRA 权重',
    'path': 'LoRA 路径',
    'scale': '比例',

    // 模型特定参数
    'scheduler': '采样器',
    'style': '风格',
    'width': '宽度',
    'height': '高度',
    'refiner_strength': '精细化强度',
    'apply_watermark': '添加水印',
    'high_noise_frac': '高噪声比例',
    'negative_style': '负面风格',
  };

  // 如果有对应的中文名称，则返回中文，否则格式化英文名称
  return nameMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

// AI扩展提示词功能
const isEnhancingPrompt = ref(false);
const balanceErrorPrompt = ref(false);

// 打开充值页面
const openBillingPage = () => {
  window.open('https://fal.ai/dashboard/billing', '_blank');
};

// 简单增强提示词
const enhancePrompt = async () => {
  if (!props.prompt.trim()) {
    toast.error("请先输入基础提示词");
    return;
  }

  isEnhancingPrompt.value = true;
  toast.info("正在增强提示词...", { duration: 3000 });

  balanceErrorPrompt.value = false;

  try {
    const SYSTEM_PROMPT = `
    You're an AI image generation expert. You will receive a basic prompt and enhance it to create a more detailed and effective prompt for high-quality image generation.

    Important guidelines:
    1. The enhanced prompt should be in English.
    2. Add specific details about style (realistic, anime, painting, etc.), lighting (soft, dramatic, natural), composition (close-up, wide shot, etc.), colors, textures, and atmosphere.
    3. Include relevant artistic references if appropriate (like "in the style of [artist]" or "similar to [art movement]").
    4. Add technical quality indicators (high resolution, detailed, 8K, photorealistic, etc.).
    5. Keep the original intent and subject of the prompt.
    6. The prompt should be 2-4 sentences long, with rich descriptive elements.
    7. Return ONLY the enhanced prompt, no explanations or additional text.
    8. DO NOT add markdown formatting or quotes, return the PLAIN STRING only.
    `;

    const response = await fal.subscribe("fal-ai/any-llm", {
      input: {
        system_prompt: SYSTEM_PROMPT,
        prompt: `
          Enhance this image generation prompt: "${props.prompt}"
          Make it more detailed and effective for AI image generation.
        `.trim(),
        model: "anthropic/claude-3.7-sonnet" as any,
      },
    });

    if (response && response.data && response.data.output) {
      // 更新提示词
      const enhancedPrompt = String(response.data.output);
      emit('update:prompt', enhancedPrompt);
      toast.success("提示词增强成功");
    } else {
      throw new Error("未收到有效的增强提示词");
    }
  } catch (error: any) {
    console.error("增强提示词失败:", error);

    // 检查是否是余额不足错误
    if (error.status === 403 && error.message && error.message.includes('balance')) {
      balanceErrorPrompt.value = true;
      toast.error("账户余额不足", {
        description: "您的FAL.AI账户余额已用尽，请充值后再试。"
      });
    } else if (error.body && error.body.detail && error.body.detail.includes('Exhausted balance')) {
      // 处理返回的JSON错误信息
      balanceErrorPrompt.value = true;
      toast.error("账户余额不足", {
        description: "您的FAL.AI账户余额已用尽，请充值后再试。"
      });
    } else {
      toast.error("增强提示词失败", {
        description: error instanceof Error ? error.message : "请稍后再试"
      });
    }
  } finally {
    isEnhancingPrompt.value = false;
  }
};

// 高级提示词生成
const isGeneratingAdvancedPrompt = ref(false);

const generateAdvancedPrompt = async () => {
  if (!props.prompt.trim()) {
    toast.error("请先输入基础提示词");
    return;
  }

  isGeneratingAdvancedPrompt.value = true;
  toast.info("正在生成高级提示词...", { duration: 3000 });

  balanceErrorPrompt.value = false;

  try {
    const SYSTEM_PROMPT = `
    You're an AI image generation expert. You will receive a basic scene description and convert it into a detailed, structured prompt format for AI image generation. Your task is to analyze the scene, identify all elements, and organize them into a comprehensive tag-based format that will produce high-quality AI-generated images.

    Important guidelines:

    1. First, create a detailed Chinese description (about 100 characters) of the scene, capturing all important visual elements.
    2. Second, list all elements, relationships, and descriptive words as Chinese tags.
    3. Third, translate these tags into English, ensuring accurate and appropriate translations.
    4. Fourth, create a comprehensive comma-separated list of English tags optimized for AI image generation.
    5. Follow the exact output format requested, with the four clearly labeled sections.
    6. **Always** return just the formatted prompt, don't add any extra content, explanations, or apologies.
    7. **DO NOT ADD markdown** formatting or quotes, return the **PLAIN STRING** only.
    `;

    const response = await fal.subscribe("fal-ai/any-llm", {
      input: {
        system_prompt: SYSTEM_PROMPT,
        prompt: `
          请将以下场景描述转换为结构化的AI图像生成提示词格式：

          场景描述：${props.prompt}

          请分析这个场景，识别所有视觉元素，并按照以下四个步骤输出结构化的提示词：

          1. 用约100字的中文详细描述这个场景，包含所有重要的视觉元素、气氛和风格。

          2. 列出所有元素、关系和描述词的中文标签，包括主体、动作、环境、风格、光照、构图等。

          3. 将这些标签翻译成准确的英文标签。

          4. 创建一个用逗号分隔的完整英文标签列表，优化为AI图像生成使用，包含技术质量指标（如高清、细节等）和艺术风格参考。

          请使用以下格式输出：

          """

          第一步 - 场景：{}

          第二步 - 标签（关系词、名词、动词）：{}

          第三步 - tag：{}

          第四步： {}

          """

        `.trim(),
        model: "anthropic/claude-3.7-sonnet" as any,
      },
    });

    if (response && response.data && response.data.output) {
      // 更新提示词
      const advancedPrompt = String(response.data.output);
      emit('update:prompt', advancedPrompt);
      toast.success("标签结构化成功");
    } else {
      throw new Error("未收到有效的结构化标签");
    }
  } catch (error: any) {
    console.error("标签结构化失败:", error);

    // 检查是否是余额不足错误
    if (error.status === 403 && error.message && error.message.includes('balance')) {
      balanceErrorPrompt.value = true;
      toast.error("账户余额不足", {
        description: "您的FAL.AI账户余额已用尽，请充值后再试。"
      });
    } else if (error.body && error.body.detail && error.body.detail.includes('Exhausted balance')) {
      // 处理返回的JSON错误信息
      balanceErrorPrompt.value = true;
      toast.error("账户余额不足", {
        description: "您的FAL.AI账户余额已用尽，请充值后再试。"
      });
    } else {
      toast.error("标签结构化失败", {
        description: error instanceof Error ? error.message : "请稍后再试"
      });
    }
  } finally {
    isGeneratingAdvancedPrompt.value = false;
  }
};
</script>

<template>
  <Card class="h-full">
    <!-- 余额不足错误提示 -->
    <Alert v-if="balanceErrorPrompt" variant="destructive" class="mb-4 mx-4 mt-4">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>账户余额不足</AlertTitle>
      <AlertDescription>
        <p class="mb-2">您的FAL.AI账户余额已用尽，无法继续生成提示词。请前往FAL.AI网站充值您的账户。</p>
        <Button
          variant="outline"
          size="sm"
          class="mt-2 gap-2"
          @click="openBillingPage"
        >
          <ExternalLink class="h-4 w-4" />
          前往充值
        </Button>
      </AlertDescription>
    </Alert>

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
        <div class="flex justify-between items-center">
          <div>
            <Label for="prompt" class="text-sm">提示词</Label>
            <p class="text-xs mt-1 text-red-500">提示词请使用
              <Badge variant="outline" class=" bg-red-300">英文</Badge>
              <Badge variant="outline" class=" bg-red-300">标签化</Badge>
              的形式</p>
          </div>
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              class="gap-1 h-7"
              @click="enhancePrompt"
              :disabled="isEnhancingPrompt || isGeneratingAdvancedPrompt || !prompt.trim()"
            >
              <Wand2 class="h-3.5 w-3.5" />
              <span>{{ isEnhancingPrompt ? '增强中...' : '提示词增强' }}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="gap-1 h-7"
              @click="generateAdvancedPrompt"
              :disabled="isEnhancingPrompt || isGeneratingAdvancedPrompt || !prompt.trim()"
            >
              <Wand2 class="h-3.5 w-3.5" />
              <span>{{ isGeneratingAdvancedPrompt ? '生成中...' : '标签结构化' }}</span>
            </Button>
          </div>
        </div>
        <div class="relative">
          <Textarea
            id="prompt"
            :value="prompt"
            @input="(e: Event) => updatePrompt((e.target as HTMLTextAreaElement).value)"
            placeholder="1girl, school uniform, smile, outdoors, high quality, masterpiece"
            class="min-h-[80px]"
          />
          <div class="absolute top-2 right-2">
          </div>
        </div>
      </div>

      <!-- 枚举参数的网格布局 -->
      <div v-if="enumParameters.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div v-for="param in enumParameters" :key="param.key" class="space-y-1">
          <Label :for="param.key" class="text-sm">{{ formatParamName(param.key) }}</Label>
          <Select
            :model-value="getParamValue(param)"
            @update:model-value="(newValue: any) => updateParameter(param.key, newValue)"
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
              placeholder="LoRA path or URL"
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
