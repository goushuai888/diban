import { fal } from "@fal-ai/client";
import type { Model, GenerateImageResponse } from "@/types/flux";

export async function generateImage(
  model: Model,
  input: Record<string, any>,
  apiKey: string
): Promise<GenerateImageResponse> {
  console.log('🚀 开始图像生成过程:', {
    modelId: model.id,
    inputParams: { ...input, prompt: input.prompt?.substring(0, 50) + '...' } // 截断提示以便日志记录
  });

  try {
    if (!apiKey) {
      console.error('❌ 未提供API密钥');
      throw new Error("请先设置您的FAL.AI API密钥");
    }

    console.log('📝 使用API密钥配置FAL客户端');
    fal.config({
      credentials: apiKey,
    });

    console.log('⏳ 订阅FAL模型...');
    const result = await fal.subscribe(model.id, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`🔄 队列状态: ${update.status}`);
        if (update.status === "IN_PROGRESS") {
          console.log('📊 生成日志:');
          update.logs.map((log) => log.message).forEach((msg) => console.log(`   ${msg}`));
        }
      },
    });

    console.log('📦 完整API响应:', JSON.stringify(result, null, 2));
    console.log('✅ 生成完成:', {
      requestId: result.requestId,
      hasImages: !!result.data?.images?.length
    });

    // 从结果中提取第一张图像
    const image = result.data?.images?.[0];
    if (!image) {
      console.error('❌ 响应中没有图像');
      throw new Error("未生成图像");
    }

    console.log('🎉 成功生成图像:', {
      seed: result.data?.seed,
      requestId: result.requestId,
      image
    });

    return {
      success: true,
      image,
      seed: result.data?.seed,
      requestId: result.requestId,
      timings: result.data?.timings || {},
      has_nsfw_concepts: result.data?.has_nsfw_concepts || [],
    };
  } catch (error) {
    console.error("❌ 图像生成失败:", error);

    // 检查是否是API余额不足错误
    // 根据FAL.AI SDK的错误处理逻辑，错误对象可能是ApiError或ValidationError
    if (error && typeof error === 'object') {
      // 检查是否是ApiError对象
      if ('status' in error && 'body' in error) {
        const apiError = error as { status: number; body: any; message: string };

        // 检查是否是403错误
        if (apiError.status === 403) {
          // 检查错误体中是否包含余额不足信息
          if (apiError.body && apiError.body.detail &&
              typeof apiError.body.detail === 'string' &&
              apiError.body.detail.includes('Exhausted balance')) {
            return {
              success: false,
              error: "账户余额不足，请前往 fal.ai/dashboard/billing 充值您的账户",
              errorCode: "BALANCE_EXHAUSTED"
            };
          }
        }
      }

      // 如果错误消息中包含403和余额不足信息，也进行处理
      // 这是一个后备方案，以防SDK的错误格式发生变化
      if ('message' in error) {
        const errorMessage = (error as { message: string }).message;
        if (errorMessage.includes('403') && errorMessage.includes('Exhausted balance')) {
          return {
            success: false,
            error: "账户余额不足，请前往 fal.ai/dashboard/billing 充值您的账户",
            errorCode: "BALANCE_EXHAUSTED"
          };
        }

        // 尝试从错误消息中提取JSON
        try {
          const errorMatch = errorMessage.match(/\{.*\}/s);
          if (errorMatch) {
            const errorJson = JSON.parse(errorMatch[0]);
            if (errorJson.detail && errorJson.detail.includes('Exhausted balance')) {
              return {
                success: false,
                error: "账户余额不足，请前往 fal.ai/dashboard/billing 充值您的账户",
                errorCode: "BALANCE_EXHAUSTED"
              };
            }
          }
        } catch (parseError) {
          console.error("解析错误消息失败:", parseError);
        }
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "生成图像失败",
    };
  }
}
