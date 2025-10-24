<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-vue-next';
import { resetPassword } from '@/services/auth';
import { toast } from 'vue-sonner';

const router = useRouter();

// 表单数据
const email = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const isSuccess = ref(false);

// 表单验证
const validateForm = (): boolean => {
  errorMessage.value = '';

  if (!email.value) {
    errorMessage.value = '请输入邮箱';
    return false;
  }

  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    errorMessage.value = '邮箱格式不正确';
    return false;
  }

  return true;
};

// 处理发送重置邮件
const handleResetPassword = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const result = await resetPassword(email.value);

    if (result.success) {
      isSuccess.value = true;
      toast.success(result.message);
    } else {
      errorMessage.value = result.message;
      toast.error(result.message);
    }
  } catch (error) {
    console.error('发送重置邮件失败:', error);
    errorMessage.value = '发送失败，请重试';
    toast.error('发送失败，请重试');
  } finally {
    isLoading.value = false;
  }
};

// 返回登录页面
const goToLogin = () => {
  router.push('/login');
};

// 重新发送
const resendEmail = () => {
  isSuccess.value = false;
  email.value = '';
};
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-muted/40 px-4 py-12">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1">
        <div class="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            @click="goToLogin"
            :disabled="isLoading"
          >
            <ArrowLeft class="h-4 w-4" />
          </Button>
          <CardTitle class="text-2xl font-bold">忘记密码</CardTitle>
        </div>
        <CardDescription>
          输入您的邮箱，我们将向您发送密码重置链接
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- 成功提示 -->
        <Alert v-if="isSuccess" variant="default" class="border-success bg-success/10">
          <CheckCircle2 class="h-4 w-4 text-success" />
          <AlertDescription class="text-success">
            重置邮件已发送！请查收邮箱并点击邮件中的链接重置密码。
          </AlertDescription>
        </Alert>

        <!-- 错误提示 -->
        <Alert v-else-if="errorMessage" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>

        <!-- 重置密码表单 -->
        <form v-if="!isSuccess" @submit.prevent="handleResetPassword" class="space-y-4">
          <!-- 邮箱输入 -->
          <div class="space-y-2">
            <Label for="email">邮箱地址</Label>
            <div class="relative">
              <Mail class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="your@email.com"
                class="pl-9"
                :disabled="isLoading"
                required
                autofocus
              />
            </div>
            <p class="text-xs text-muted-foreground">
              请输入您注册时使用的邮箱地址
            </p>
          </div>

          <!-- 发送按钮 -->
          <Button type="submit" class="w-full" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isLoading ? '发送中...' : '发送重置邮件' }}
          </Button>
        </form>

        <!-- 成功后的操作 -->
        <div v-else class="space-y-4">
          <div class="space-y-2 text-sm text-muted-foreground">
            <p>邮件已发送到:</p>
            <p class="font-medium text-foreground">{{ email }}</p>
          </div>

          <div class="space-y-2">
            <Button @click="goToLogin" variant="default" class="w-full">
              返回登录
            </Button>
            <Button @click="resendEmail" variant="outline" class="w-full">
              重新发送
            </Button>
          </div>

          <div class="space-y-2 text-xs text-muted-foreground rounded-lg bg-muted p-4">
            <p class="font-medium text-foreground">📧 未收到邮件？</p>
            <ul class="list-disc list-inside space-y-1 ml-2">
              <li>检查垃圾邮件或促销邮件文件夹</li>
              <li>确认邮箱地址输入正确</li>
              <li>等待 2-3 分钟后重试</li>
            </ul>
          </div>
        </div>
      </CardContent>

      <CardFooter v-if="!isSuccess" class="flex flex-col space-y-4">
        <div class="text-sm text-muted-foreground text-center">
          记起密码了？
          <Button
            variant="link"
            size="sm"
            class="px-1 font-normal"
            @click="goToLogin"
            :disabled="isLoading"
          >
            返回登录
          </Button>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
