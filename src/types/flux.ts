/**
 * 模型参数类型
 */
export type ModelParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'enum'
  | 'image'  // 图像数据的特殊类型
  | 'file'   // 文件上传的特殊类型
  | 'json';  // 结构化JSON数据

/**
 * 验证规则接口
 */
export interface ValidationRule {
  min?: number;
  max?: number;
  pattern?: string;
  custom?: (value: unknown) => boolean;
}

/**
 * 属性定义接口
 */
export interface PropertyDefinition {
  type: string;
  description?: string;
  validation?: ValidationRule;
  default?: unknown;
}

/**
 * 模型参数接口
 */
export interface ModelParameter {
  key: string;
  type: ModelParameterType;
  description?: string;
  required?: boolean;
  default?: unknown;
  options?: unknown[];  // 枚举类型参数
  items?: {
    type: string;
    properties?: Record<string, PropertyDefinition>;
  };  // 数组项类型
  validation?: ValidationRule;
}

/**
 * 模型接口
 */
export interface Model {
  name: string;
  id: string;
  inputSchema: ModelParameter[];
  outputSchema: ModelParameter[];
}

/**
 * 图像接口
 */
export interface Image {
  url: string;
  width: number;
  height: number;
  content_type: string;
  [key: string]: unknown;  // 允许额外的图像属性
}

/**
 * 生成结果接口
 */
export interface Generation {
  id: string;
  modelId: string;
  modelName: string;
  prompt: string;
  parameters: Record<string, any>;
  output: {
    images: Image[];
    timings: Record<string, any>;
    seed: number;
    has_nsfw_concepts: boolean[];
  };
  timestamp: number;
  userId?: string; // 用户ID，用于区分不同用户的生成记录
  isCurrentUser?: boolean; // 是否是当前用户的记录，前端显示用
}

/**
 * Supabase生成记录表类型
 */
export interface SupabaseGeneration {
  id: string;
  user_id: string;
  model_id: string;
  model_name: string;
  prompt: string;
  parameters: Record<string, any>;
  output: {
    images: Image[];
    timings: Record<string, any>;
    seed: number;
    has_nsfw_concepts: boolean[];
  };
  created_at: string;
}

/**
 * 生成图像响应接口 - 成功
 */
export interface SuccessResponse {
  success: true;
  image: Image;
  seed: number;
  requestId: string;
  timings: Record<string, any>;
  has_nsfw_concepts: boolean[];
}

/**
 * 生成图像响应接口 - 失败
 */
export interface ErrorResponse {
  success: false;
  error: string;
  errorCode?: string; // 错误代码，用于标识特定类型的错误
}

/**
 * 生成图像响应类型
 */
export type GenerateImageResponse = SuccessResponse | ErrorResponse;
