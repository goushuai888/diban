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
import { X, Wand2, Save, Settings, Trash2, RefreshCw } from "lucide-vue-next";
import ImageSizeRadioGroup from "./ImageSizeRadioGroup.vue";
import DefaultSettingsToolbar from "./DefaultSettingsToolbar.vue";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fal } from "@fal-ai/client";
import { toast } from 'vue-sonner';
import { handleBalanceExhaustedError } from "@/services/api-key-manager";

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

// 使用计算属性来处理双向绑定，保持光标位置
const promptValue = computed({
  get: () => props.prompt,
  set: (value: string) => {
    emit('update:prompt', value);
  }
});

// 加载默认设置
const loadSettings = (settings: { parameters: Record<string, any>, prompt: string }) => {
  // 先加载设置
  emit('loadSettings', settings);

  // 然后生成新的随机种子
  setTimeout(() => {
    generateRandomSeed();
  }, 100); // 延迟一下，确保设置已加载完成
};

// 初始化所有参数
const initializeAllParameters = () => {
  // 检查所有参数是否有值
  props.model.inputSchema.forEach(param => {
    // 特别处理随机种子参数
    if (param.key === 'seed') {
      if (props.parameters[param.key] === undefined || props.parameters[param.key] === null || props.parameters[param.key] === '') {
        // 生成一个最多8位的随机种子值（0-99999999）
        const randomSeed = Math.floor(Math.random() * 100000000);
        updateParameter(param.key, randomSeed);
        console.log(`设置随机种子参数为 ${randomSeed}`);
      }
    } else if (props.parameters[param.key] === undefined && param.default !== undefined) {
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

// 生成随机种子
const generateRandomSeed = () => {
  // 生成最多8位的随机数，范围为0-99999999
  const randomSeed = Math.floor(Math.random() * 100000000);
  // 查找 seed 参数
  const seedParam = props.model.inputSchema.find(param => param.key === 'seed');
  if (seedParam) {
    updateParameter('seed', randomSeed);
    toast.success(`已生成新的随机种子: ${randomSeed}`);
  }
};




// 设置相关
const savedSettings = ref<Array<{id: string, name: string, parameters: Record<string, any>, prompt: string}>>([]);
const settingName = ref('');
const isDialogOpen = ref(false);
const isDropdownOpen = ref(false);

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
        prompt: 'Beautiful natural landscape, high-quality photography, sunny day, 4K ultra-clear, fine details'
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
        prompt: 'Anime style young female character, colorful illustration, beautiful lines, exquisite details'
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
        prompt: 'Futuristic tech style, high-tech city, blue color scheme, holographic rendering, fine details, 8K ultra-clear'
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
        prompt: 'Magnificent mountain landscape, ultra-wide panorama, sunny day, 8K ultra-clear, fine details'
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
        prompt: 'Movie poster style, dramatic lighting, cinematic composition, high contrast, professional quality'
      }
    ],
    'fal-ai/flux-lora': [
      {
        name: 'LoRA 基础设置',
        parameters: {
          image_size: 'square_hd',
          output_format: 'png',
          num_images: 1,
          enable_safety_checker: true,
          safety_tolerance: '4',
          loras: []
        },
        prompt: 'High quality, masterpiece, detailed, 8K resolution'
      }
    ]
  };

  return presets[modelId] || [];
};

// 预设设置
const defaultPresets = computed(() => {
  return getDefaultPresets(props.model.id).map(preset => ({
    ...preset,
    id: `preset-${preset.name}`,
    isPreset: true
  }));
});

// 所有设置
const allSettings = computed(() => {
  // 合并预设设置和用户设置
  return [...defaultPresets.value, ...savedSettings.value];
});

// 保存当前设置
const saveCurrentSetting = () => {
  if (!settingName.value.trim()) {
    toast.error('请输入设置名称');
    return;
  }

  const modelId = props.model.id;
  const storageKey = `fal-ai-settings-${modelId}`;

  const newSetting = {
    id: Date.now().toString(),
    name: settingName.value,
    parameters: { ...props.parameters },
    prompt: props.prompt
  };

  savedSettings.value = [newSetting, ...savedSettings.value];

  try {
    localStorage.setItem(storageKey, JSON.stringify(savedSettings.value));
    toast.success('设置已保存');
    settingName.value = '';
    isDialogOpen.value = false;
  } catch (error) {
    console.error('保存设置失败:', error);
    toast.error('保存设置失败');
  }
};

// 加载设置
const loadSetting = (setting: {id: string, name: string, parameters: Record<string, any>, prompt: string, isPreset?: boolean}) => {
  emit('loadSettings', {
    parameters: setting.parameters,
    prompt: setting.prompt
  });
  toast.success(`已加载设置: ${setting.name}`);

  // 关闭下拉菜单
  isDropdownOpen.value = false;

  // 生成新的随机种子
  setTimeout(() => {
    generateRandomSeed();
  }, 100); // 延迟一下，确保设置已加载完成
};

// 删除设置
const deleteSetting = (id: string) => {
  // 先检查是否是预设设置
  const presetIndex = defaultPresets.value.findIndex(preset => preset.id === id);
  if (presetIndex !== -1) {
    // 删除预设设置
    const presetName = defaultPresets.value[presetIndex].name;
    // 预设设置不会真正从数组中移除，只是显示删除成功的提示
    toast.success(`已删除设置: ${presetName}`);
    isDropdownOpen.value = false;
    return;
  }

  // 如果不是预设设置，则删除用户自定义设置
  const index = savedSettings.value.findIndex(setting => setting.id === id);
  if (index !== -1) {
    const settingName = savedSettings.value[index].name;
    savedSettings.value.splice(index, 1);

    const modelId = props.model.id;
    const storageKey = `fal-ai-settings-${modelId}`;
    localStorage.setItem(storageKey, JSON.stringify(savedSettings.value));

    toast.success(`已删除设置: ${settingName}`);
    isDropdownOpen.value = false;
  }
};

// 获取保存的设置
onMounted(() => {
  // 从本地存储中获取设置
  const modelId = props.model.id;
  const storageKey = `fal-ai-settings-${modelId}`;
  try {
    const storedSettings = localStorage.getItem(storageKey);
    if (storedSettings) {
      savedSettings.value = JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
});

// 过滤出各类参数
const enumParameters = computed(() => {
  return props.model.inputSchema
    .filter(param => param.type === 'enum' && param.key !== 'prompt');
});

// 判断是否有图像尺寸参数
const hasImageSizeParam = computed(() => {
  return props.model.inputSchema.some(param =>
    param.type === 'enum' && (param.key === 'image_size' || param.key === 'aspect_ratio')
  );
});

// 获取图像尺寸参数的键
const getImageSizeParamKey = () => {
  const param = props.model.inputSchema.find(param =>
    param.type === 'enum' && (param.key === 'image_size' || param.key === 'aspect_ratio')
  );
  return param ? param.key : '';
};

// 获取图像尺寸参数的值
const getImageSizeValue = () => {
  const key = getImageSizeParamKey();
  if (!key) return '';

  const param = props.model.inputSchema.find(p => p.key === key);
  return props.parameters[key] || (param?.default as string) || '';
};

// 获取图像尺寸参数的选项
const getImageSizeOptions = () => {
  const key = getImageSizeParamKey();
  if (!key) return [];

  const param = props.model.inputSchema.find(p => p.key === key);
  return param?.options || [];
};

// 其他枚举参数（排除图像尺寸参数）
const otherEnumParameters = computed(() => {
  return props.model.inputSchema
    .filter(param =>
      param.type === 'enum' &&
      param.key !== 'prompt' &&
      param.key !== 'image_size' &&
      param.key !== 'aspect_ratio'
    );
});

// 移动端一行显示的枚举参数
const mobileRowEnumParameters = computed(() => {
  // 安全容差和输出格式可以放在一行
  return otherEnumParameters.value.filter(param =>
    param.key === 'safety_tolerance' ||
    param.key === 'output_format'
  );
});

// 其他枚举参数（排除一行显示的参数）
const remainingEnumParameters = computed(() => {
  const mobileRowKeys = mobileRowEnumParameters.value.map(param => param.key);
  return otherEnumParameters.value.filter(param => !mobileRowKeys.includes(param.key));
});

const booleanParameters = computed(() => {
  return props.model.inputSchema
    .filter(param => param.type === 'boolean' && param.key !== 'sync_mode' && param.key !== 'enable_safety_checker');
});

const numberParameters = computed(() => {
  return props.model.inputSchema
    .filter(param => param.type === 'number' && param.key !== 'loras');
});

// 移动端一行显示的数字参数
const mobileRowNumberParameters = computed(() => {
  // 图像数量和随机种子可以放在一行
  return numberParameters.value.filter(param =>
    param.key === 'num_images' ||
    param.key === 'seed'
  );
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



// 简单增强提示词
const enhancePrompt = async () => {
  if (!props.prompt.trim()) {
    toast.error("请先输入基础提示词");
    return;
  }

  isEnhancingPrompt.value = true;
  toast.info("正在增强提示词...", { duration: 3000 });



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
    if ((error.status === 403 && error.message && error.message.includes('balance')) ||
        (error.body && error.body.detail && error.body.detail.includes('Exhausted balance'))) {

      // 尝试自动切换到下一个API密钥
      const switched = handleBalanceExhaustedError();

      if (switched) {
        toast.success("已切换到下一个API密钥，正在重试...");
        // 延迟一下再重试
        setTimeout(() => {
          enhancePrompt();
        }, 1000);
        return;
      }

      toast.error("所有API密钥余额不足", {
        description: "请添加新的API密钥或充值您的账户。"
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
    if ((error.status === 403 && error.message && error.message.includes('balance')) ||
        (error.body && error.body.detail && error.body.detail.includes('Exhausted balance'))) {

      // 尝试自动切换到下一个API密钥
      const switched = handleBalanceExhaustedError();

      if (switched) {
        toast.success("已切换到下一个API密钥，正在重试...");
        // 延迟一下再重试
        setTimeout(() => {
          generateAdvancedPrompt();
        }, 1000);
        return;
      }

      toast.error("所有API密钥余额不足", {
        description: "请添加新的API密钥或充值您的账户。"
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


    <CardHeader>
      <div class="flex justify-between items-start">
        <div>
          <CardTitle>设置</CardTitle>
          <CardDescription>为 {{ model.name }} 配置您的图像生成</CardDescription>
        </div>
        <div class="hidden sm:block">
          <DefaultSettingsToolbar
            :modelId="model.id"
            :parameters="parameters"
            :prompt="prompt"
            @loadSettings="loadSettings"
          />
        </div>
      </div>

      <!-- 移动端按钮布局 -->
      <div class="sm:hidden grid grid-cols-2 gap-4 mt-4">
        <div class="space-y-2">
          <Dialog v-model:open="isDialogOpen">
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                class="w-full flex items-center justify-center gap-1"
              >
                <Save class="h-4 w-4" />
                <span>保存设置</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>保存设置</DialogTitle>
                <DialogDescription>
                  保存当前设置以便于以后使用。
                </DialogDescription>
              </DialogHeader>
              <div class="space-y-4 py-2">
                <div class="space-y-2">
                  <Label for="setting-name">设置名称</Label>
                  <Input id="setting-name" v-model="settingName" placeholder="输入设置名称" />
                </div>
              </div>
              <DialogFooter>
                <Button @click="saveCurrentSetting">保存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu v-model:open="isDropdownOpen">
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                class="w-full flex items-center justify-center gap-1"
              >
                <Settings class="h-4 w-4" />
                <span>默认设置</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <div v-if="allSettings.length === 0" class="px-2 py-1.5 text-sm text-muted-foreground">
                暂无保存的设置
              </div>

              <div v-else>
                <div
                  v-for="(setting, index) in allSettings"
                  :key="index"
                  class="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm"
                >
                  <button
                    class="flex-1 text-left text-sm"
                    @click="loadSetting(setting)"
                  >
                    {{ setting.name }}
                  </button>

                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6"
                    @click="deleteSetting(setting.id)"
                  >
                    <Trash2 class="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div class="space-y-2">
          <Button
            variant="outline"
            size="sm"
            class="w-full flex items-center justify-center gap-1"
            @click="generateAdvancedPrompt"
            :disabled="isEnhancingPrompt || isGeneratingAdvancedPrompt || !prompt.trim()"
          >
            <Wand2 class="h-4 w-4" />
            <span>标签结构化</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            class="w-full flex items-center justify-center gap-1"
            @click="enhancePrompt"
            :disabled="isEnhancingPrompt || isGeneratingAdvancedPrompt || !prompt.trim()"
          >
            <Wand2 class="h-4 w-4" />
            <span>提示词增强</span>
          </Button>
        </div>
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
              形式</p>
          </div>
          <div class="hidden sm:flex gap-2">
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
            v-model="promptValue"
            placeholder="1girl, school uniform, smile, outdoors, high quality, masterpiece"
            class="min-h-[80px]"
          />
          <div class="absolute top-2 right-2">
          </div>
        </div>
      </div>



      <!-- 图像尺寸/宽高比参数 -->
      <div v-if="hasImageSizeParam" class="w-full mb-4">
        <ImageSizeRadioGroup
          :value="getImageSizeValue()"
          :options="getImageSizeOptions()"
          :param-key="getImageSizeParamKey()"
          @update:value="(value) => updateParameter(getImageSizeParamKey(), value)"
        />
      </div>

      <!-- 移动端一行显示的枚举参数 -->
      <div v-if="mobileRowEnumParameters.length > 0" class="grid grid-cols-2 gap-3 mb-3">
        <div v-for="param in mobileRowEnumParameters" :key="param.key" class="space-y-1">
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

      <!-- 其他枚举参数的网格布局 -->
      <div v-if="remainingEnumParameters.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div v-for="param in remainingEnumParameters" :key="param.key" class="space-y-1">
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

      <!-- 移动端一行显示的数字参数 -->
      <div v-if="mobileRowNumberParameters.length > 0" class="grid grid-cols-2 gap-3 mb-3">
        <template v-for="param in mobileRowNumberParameters" :key="param.key">
          <!-- 其他数字参数的默认输入 -->
          <div class="space-y-1">
            <Label :for="param.key" class="text-sm">{{ formatParamName(param.key) }}</Label>
            <div v-if="param.key === 'seed'" class="flex space-x-2">
              <Input
                :id="param.key"
                type="number"
                :value="getParamValue(param)"
                class="h-8 flex-1"
                maxlength="8"
                max="99999999"
                @input="(e: Event) => {
                  const input = e.target as HTMLInputElement;
                  const value = input.value;
                  // 限制最多8位
                  if (value.length > 8) {
                    input.value = value.slice(0, 8);
                  }
                  updateParameter(param.key, Number(input.value));
                }"
              />
              <Button
                variant="outline"
                size="sm"
                class="h-8 px-2"
                @click="generateRandomSeed"
                title="生成新的随机种子"
              >
                <RefreshCw class="h-4 w-4" />
              </Button>
            </div>
            <Input
              v-else
              :id="param.key"
              type="number"
              :value="getParamValue(param)"
              class="h-8"
              @input="(e: Event) => updateParameter(param.key, Number((e.target as HTMLInputElement).value))"
            />
          </div>
        </template>
      </div>

      <!-- 数字参数的网格布局 -->
      <div v-if="numberParameters.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <template v-for="param in numberParameters" :key="param.key">
          <!-- 跳过移动端一行显示的参数 -->
          <template v-if="!mobileRowNumberParameters.some(p => p.key === param.key)">
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
              <div v-if="param.key === 'seed'" class="flex space-x-2">
                <Input
                  :id="param.key"
                  type="number"
                  :value="getParamValue(param)"
                  class="h-8 flex-1"
                  maxlength="8"
                  max="99999999"
                  @input="(e: Event) => {
                    const input = e.target as HTMLInputElement;
                    const value = input.value;
                    // 限制最多8位
                    if (value.length > 8) {
                      input.value = value.slice(0, 8);
                    }
                    updateParameter(param.key, Number(input.value));
                  }"
                />
                <Button
                  variant="outline"
                  size="sm"
                  class="h-8 px-2"
                  @click="generateRandomSeed"
                  title="生成新的随机种子"
                >
                  <RefreshCw class="h-4 w-4" />
                </Button>
              </div>
              <Input
                v-else
                :id="param.key"
                type="number"
                :value="getParamValue(param)"
                class="h-8"
                @input="(e: Event) => updateParameter(param.key, Number((e.target as HTMLInputElement).value))"
              />
            </div>
          </template>
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
