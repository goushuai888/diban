<script setup lang="ts">
import { ref } from 'vue';
import type { Model, Image, Generation, SuccessResponse, ErrorResponse } from "@/types/flux";
import GenerationSettings from "./image-generator/GenerationSettings.vue";
import ImageDisplay from "./image-generator/ImageDisplay.vue";
import { generateImage } from "@/services/generate-image";
import { saveGeneration } from "@/services/generation-history";
import { toast } from 'vue-sonner';
import { v4 as uuidv4 } from 'uuid';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, AlertTriangle } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { currentUserId } from "@/lib/supabase";

const props = defineProps<{
  model: Model;
}>();

// 初始化参数，使用模型架构中的默认值和自定义默认值
const initParameters = (): Record<string, any> => {
  // 首先从模型架构中获取默认值
  const defaultParams = Object.fromEntries(
    props.model.inputSchema
      .filter(param => param.default !== undefined)
      .map(param => [param.key, param.default])
  );

  // 根据模型ID设置不同的默认值
  let customDefaults: Record<string, any> = {};

  // 通用默认值
  if (hasParameter('output_format')) {
    customDefaults.output_format = 'png';
  }
  if (hasParameter('num_images')) {
    customDefaults.num_images = 1;
  }

  // 根据模型ID设置特定默认值
  if (props.model.id === 'fal-ai/flux-pro/v1.1') {
    if (hasParameter('image_size')) {
      customDefaults.image_size = 'landscape_16_9';
    }
    if (hasParameter('enable_safety_checker')) {
      customDefaults.enable_safety_checker = false;
    }
    if (hasParameter('safety_tolerance')) {
      customDefaults.safety_tolerance = '6';
    }
  }
  else if (props.model.id === 'fal-ai/flux-pro/v1.1-ultra') {
    if (hasParameter('aspect_ratio')) {
      customDefaults.aspect_ratio = '16:9';
    }
    if (hasParameter('enable_safety_checker')) {
      customDefaults.enable_safety_checker = false;
    }
    if (hasParameter('safety_tolerance')) {
      customDefaults.safety_tolerance = '6';
    }
  }
  else if (props.model.id === 'fal-ai/flux-lora') {
    if (hasParameter('image_size')) {
      customDefaults.image_size = 'landscape_16_9';
    }
    if (hasParameter('guidance_scale')) {
      customDefaults.guidance_scale = 7.0;
    }
    if (hasParameter('num_inference_steps')) {
      customDefaults.num_inference_steps = 40;
    }
    if (hasParameter('enable_safety_checker')) {
      customDefaults.enable_safety_checker = false;
    }
    if (hasParameter('loras')) {
      customDefaults.loras = [];
    }
  }

  // 合并默认值，优先使用自定义默认值
  return { ...defaultParams, ...customDefaults };
};

const parameters = ref<Record<string, any>>(initParameters());

// 检查模型是否支持特定参数
function hasParameter(key: string): boolean {
  return props.model.inputSchema.some(param => param.key === key);
}

// 提示词
const prompt = ref('');

// 生成结果
const result = ref<Image | null>(null);

// 生成状态
const isGenerating = ref(false);

// 余额不足错误
const balanceError = ref(false);

// 打开充值页面
const openBillingPage = () => {
  window.open('https://fal.ai/dashboard/billing', '_blank');
};

// 处理加载默认设置
const handleLoadSettings = (settings: { parameters: Record<string, any>, prompt: string }) => {
  // 合并参数，确保所有必要的参数都存在
  const baseParams = initParameters();
  parameters.value = { ...baseParams, ...settings.parameters };
  prompt.value = settings.prompt || '';

  // 如果是LoRA模型但没有loras参数，初始化为空数组
  if (props.model.id === 'fal-ai/flux-lora' && !parameters.value.loras) {
    parameters.value.loras = [];
  }

  console.log('已加载设置:', { parameters: parameters.value, prompt: prompt.value });
};

async function handleGenerate() {
  console.log("🎨 开始客户端图像生成过程");

  if (!prompt.value.trim()) {
    toast.error("请输入提示词");
    return;
  }

  isGenerating.value = true;
  balanceError.value = false;

  try {
    // 准备参数
    const allParameters: Record<string, any> = {
      ...parameters.value,
      prompt: prompt.value,
    };

    // 处理LoRA参数，过滤掉未填写路径的项
    if (allParameters.loras && Array.isArray(allParameters.loras)) {
      allParameters.loras = allParameters.loras.filter((lora: { path: string; scale: number }) =>
        lora.path && lora.path.trim() !== ''
      );

      // 如果没有有效的LoRA项，删除整个loras参数
      if (allParameters.loras.length === 0) {
        delete allParameters.loras;
      }
    }

    console.log("📤 发送生成请求，参数:", allParameters);

    // 获取活动的API密钥
    const ACTIVE_KEY_STORAGE_KEY = 'fal-ai-active-key'; // 直接存储的密钥值
    const API_KEYS_STORAGE_KEY = 'fal-ai-api-keys';
    const ACTIVE_KEY_INDEX_STORAGE_KEY = 'fal-ai-active-key-index';

    // 首先尝试从 ACTIVE_KEY_STORAGE_KEY 获取密钥
    let apiKey = localStorage.getItem(ACTIVE_KEY_STORAGE_KEY) || '';

    // 如果没有直接存储的密钥，尝试从索引获取
    if (!apiKey) {
      const apiKeys = JSON.parse(localStorage.getItem(API_KEYS_STORAGE_KEY) || '[]');
      const activeKeyIndex = parseInt(localStorage.getItem(ACTIVE_KEY_INDEX_STORAGE_KEY) || '-1');

      if (activeKeyIndex >= 0 && activeKeyIndex < apiKeys.length) {
        apiKey = apiKeys[activeKeyIndex].key;
        // 同时存储到 ACTIVE_KEY_STORAGE_KEY 中便于下次直接获取
        localStorage.setItem(ACTIVE_KEY_STORAGE_KEY, apiKey);
      }
    }

    // 调试信息
    console.log('🔑 API密钥状态:', {
      hasActiveKey: !!apiKey,
      keyLength: apiKey.length
    });
    if (!apiKey) {
      toast.error('未设置API密钥', {
        description: '请先在设置中添加并选择一个FAL.AI API密钥'
      });
      isGenerating.value = false;
      return;
    }

    // 调用生成服务
    const response = await generateImage(props.model, allParameters, apiKey);

    if (response.success) {
      // 类型断言，帮助TypeScript正确推断类型
      const successResponse = response as SuccessResponse;
      console.log("📥 收到生成响应:", {
        imageUrl: successResponse.image.url,
        width: successResponse.image.width,
        height: successResponse.image.height,
        seed: successResponse.seed,
        requestId: successResponse.requestId,
      });
      result.value = successResponse.image;

      // 创建新的生成记录
      const newGeneration: Generation = {
        id: uuidv4(),
        modelId: props.model.id,
        modelName: props.model.name,
        prompt: prompt.value,
        parameters: allParameters,
        output: {
          images: [successResponse.image],
          timings: successResponse.timings || {},
          seed: successResponse.seed,
          has_nsfw_concepts: successResponse.has_nsfw_concepts || [],
        },
        timestamp: Date.now(),
        userId: currentUserId,
        isCurrentUser: true
      };

      // 保存生成记录到 Supabase
      await saveGeneration(newGeneration);

      toast.success("图像生成成功", {
        description: `种子: ${successResponse.seed}`
      });
    } else {
      // 类型断言，帮助TypeScript正确推断类型
      const errorResponse = response as ErrorResponse;
      // 处理错误情况
      console.error("✖️ 生成失败:", errorResponse.error);

      // 检查是否是余额不足错误
      if (errorResponse.errorCode === "BALANCE_EXHAUSTED") {
        balanceError.value = true;
        toast.error("账户余额不足", {
          description: "您的FAL.AI账户余额已用尽，请充值后再试。"
        });
      } else {
        toast.error("生成失败", {
          description: errorResponse.error || "请检查您的API密钥和网络连接"
        });
      }
    }
  } catch (error: any) {
    console.error("❌ 生成过程中发生错误:", error);

    // 检查是否是余额不足错误
    if (error.status === 403 && error.message && error.message.includes('balance')) {
      balanceError.value = true;
      toast.error("账户余额不足", {
        description: "您的FAL.AI账户余额已用尽，请充值后再试。"
      });
    } else {
      toast.error("生成失败", {
        description: error.message || "请检查您的API密钥和网络连接"
      });
    }
  } finally {
    isGenerating.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col space-y-8 w-full max-w-6xl mx-auto">
    <!-- 余额不足错误提示 -->
    <Alert v-if="balanceError" variant="destructive" class="mb-4">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>账户余额不足</AlertTitle>
      <AlertDescription>
        <p class="mb-2">您的FAL.AI账户余额已用尽，无法继续生成图像。请前往FAL.AI网站充值您的账户。</p>
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

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <GenerationSettings
        :prompt="prompt"
        @update:prompt="prompt = $event"
        @generate="handleGenerate"
        :is-generating="isGenerating"
        :model="model"
        :parameters="parameters"
        @update:parameters="parameters = $event"
        @loadSettings="handleLoadSettings"
      />
      <ImageDisplay :result="result" />
    </div>
  </div>
</template>
