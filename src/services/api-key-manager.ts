import { fal } from "@fal-ai/client";
import { toast } from "vue-sonner";

// 常量
const API_KEYS_STORAGE_KEY = 'fal-ai-api-keys';
const ACTIVE_KEY_INDEX_STORAGE_KEY = 'fal-ai-active-key-index';
const ACTIVE_KEY_STORAGE_KEY = 'fal-ai-active-key';

// 类型
interface ApiKeyInfo {
  key: string;
  name: string;
  isSystem?: boolean;
  balance?: number;
  lastChecked?: number;
  group?: string;
  isValid?: boolean;
  invalidReason?: string;
  isLoading?: boolean;
}

/**
 * 获取所有API密钥
 */
export function getAllApiKeys(): ApiKeyInfo[] {
  try {
    const storedKeys = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (storedKeys) {
      return JSON.parse(storedKeys);
    }
  } catch (error) {
    console.error('解析API密钥失败:', error);
  }
  return [];
}

/**
 * 获取当前活动的API密钥索引
 */
export function getActiveKeyIndex(): number {
  try {
    const storedIndex = localStorage.getItem(ACTIVE_KEY_INDEX_STORAGE_KEY);
    if (storedIndex && !isNaN(Number(storedIndex))) {
      return Number(storedIndex);
    }
  } catch (error) {
    console.error('解析活动密钥索引失败:', error);
  }
  return -1;
}

/**
 * 设置活动API密钥
 */
export function setActiveKey(index: number): boolean {
  const keys = getAllApiKeys();

  if (index >= 0 && index < keys.length) {
    // 检查密钥是否失效
    if (keys[index].isValid === false) {
      console.warn(`无法激活失效的API密钥: ${keys[index].name}`);
      return false;
    }

    // 设置活动密钥
    const key = keys[index].key;
    configureFalClient(key);
    localStorage.setItem(ACTIVE_KEY_INDEX_STORAGE_KEY, index.toString());
    localStorage.setItem(ACTIVE_KEY_STORAGE_KEY, key);

    return true;
  }

  return false;
}

/**
 * 配置FAL客户端
 */
export function configureFalClient(apiKey: string) {
  fal.config({
    credentials: apiKey,
  });
}

/**
 * 标记密钥为无效
 */
export function markKeyAsInvalid(index: number, reason: string = 'unknown'): void {
  const keys = getAllApiKeys();

  if (index >= 0 && index < keys.length) {
    keys[index].isValid = false;
    keys[index].invalidReason = reason;

    // 保存更新后的密钥列表
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
  }
}

/**
 * 切换到下一个有效的API密钥
 * 如果当前是最后一个密钥，则切换到第一个密钥
 * 返回是否成功切换
 */
export function switchToNextValidKey(): boolean {
  const keys = getAllApiKeys();
  if (keys.length === 0) return false;

  const currentIndex = getActiveKeyIndex();
  if (currentIndex === -1) return false;

  // 标记当前密钥为无效（余额不足）
  markKeyAsInvalid(currentIndex, 'balance_exhausted');

  // 从下一个索引开始查找有效的密钥
  let nextIndex = (currentIndex + 1) % keys.length;
  const startIndex = nextIndex; // 记录起始索引，防止无限循环

  do {
    // 如果找到有效的密钥，则激活它
    if (keys[nextIndex].isValid !== false) {
      const success = setActiveKey(nextIndex);
      if (success) {
        toast.success(`已自动切换到下一个API密钥: ${keys[nextIndex].name}`);
        return true;
      }
    }

    // 移动到下一个索引
    nextIndex = (nextIndex + 1) % keys.length;
  } while (nextIndex !== startIndex); // 如果已经遍历了所有密钥，则退出循环

  // 如果没有找到有效的密钥，则提示用户
  toast.error('所有API密钥都已失效，请添加新的API密钥');
  return false;
}

/**
 * 处理余额不足错误
 * 自动切换到下一个有效的API密钥
 * 返回是否成功处理
 */
export function handleBalanceExhaustedError(): boolean {
  return switchToNextValidKey();
}

/**
 * 从 Vercel Blob 获取 API 密钥
 * 只有在 localStorage 中不存在密钥时才会调用
 */
export async function loadApiKeysFromBlob(): Promise<ApiKeyInfo[]> {
  try {
    console.log('正在从 Vercel Blob 获取 API 密钥...');

    // 调用 Vercel 函数代理 API
    const response = await fetch('/api/blob-keys');

    if (!response.ok) {
      if (response.status === 404) {
        console.log('未找到密钥文件');
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const blobKeys: ApiKeyInfo[] = data.keys || [];

    console.log(`从 Blob 成功加载 ${blobKeys.length} 个 API 密钥`);
    return blobKeys;

  } catch (error) {
    console.error('从 Vercel Blob 获取 API 密钥失败:', error);
    return [];
  }
}

/**
 * 初始化 API 密钥
 * 检查 localStorage，如果不存在则从 Blob 加载
 */
export async function initializeApiKeys(): Promise<ApiKeyInfo[]> {
  // 首先检查 localStorage 中是否已有密钥
  const existingKeys = getAllApiKeys();

  if (existingKeys.length > 0) {
    console.log('localStorage 中已存在 API 密钥，跳过 Blob 加载');
    return existingKeys;
  }

  // 如果 localStorage 中没有密钥，则从 Blob 加载
  console.log('localStorage 中无 API 密钥，尝试从 Blob 加载');
  const blobKeys = await loadApiKeysFromBlob();

  if (blobKeys.length > 0) {
    // 将从 Blob 获取的密钥保存到 localStorage
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(blobKeys));
    console.log(`已将 ${blobKeys.length} 个密钥从 Blob 缓存到 localStorage`);
  }

  return blobKeys;
}
