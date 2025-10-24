<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-vue-next';
import { signIn } from '@/services/auth';
import { toast } from 'vue-sonner';

const router = useRouter();

// 表单数据
const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

// 表单验证
const validateForm = (): boolean => {
  errorMessage.value = '';

  if (!email.value) {
    errorMessage.value = '请输入邮箱';
    return false;
  }

  if (!password.value) {
    errorMessage.value = '请输入密码';
    return false;
  }

  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    errorMessage.value = '邮箱格式不正确';
    return false;
  }

  if (password.value.length < 6) {
    errorMessage.value = '密码至少需要 6 个字符';
    return false;
  }

  return true;
};

// 处理登录
const handleLogin = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const result = await signIn(email.value, password.value);

    if (result.success) {
      toast.success(result.message);
      // 登录成功，跳转到首页
      router.push('/');
    } else {
      errorMessage.value = result.message;
      toast.error(result.message);
    }
  } catch (error) {
    console.error('登录失败:', error);
    errorMessage.value = '登录失败，请重试';
    toast.error('登录失败，请重试');
  } finally {
    isLoading.value = false;
  }
};

// 跳转到注册页面
const goToSignUp = () => {
  router.push('/signup');
};

// 跳转到忘记密码页面
const goToForgotPassword = () => {
  router.push('/forgot-password');
};
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-muted/40 px-4 py-12">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1">
        <CardTitle class="text-2xl font-bold">登录</CardTitle>
        <CardDescription>
          输入您的邮箱和密码以登录您的账户
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- 错误提示 -->
        <Alert v-if="errorMessage" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>

        <!-- 登录表单 -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- 邮箱输入 -->
          <div class="space-y-2">
            <Label for="email">邮箱</Label>
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
              />
            </div>
          </div>

          <!-- 密码输入 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="password">密码</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                class="px-0 font-normal"
                @click="goToForgotPassword"
                :disabled="isLoading"
              >
                忘记密码？
              </Button>
            </div>
            <div class="relative">
              <Lock class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                v-model="password"
                type="password"
                placeholder="••••••••"
                class="pl-9"
                :disabled="isLoading"
                required
              />
            </div>
          </div>

          <!-- 登录按钮 -->
          <Button type="submit" class="w-full" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isLoading ? '登录中...' : '登录' }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="flex flex-col space-y-4">
        <div class="text-sm text-muted-foreground text-center">
          还没有账户？
          <Button
            variant="link"
            size="sm"
            class="px-1 font-normal"
            @click="goToSignUp"
            :disabled="isLoading"
          >
            立即注册
          </Button>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
