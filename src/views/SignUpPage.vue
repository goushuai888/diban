<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-vue-next';
import { signUp } from '@/services/auth';
import { toast } from 'vue-sonner';

const router = useRouter();

// 表单数据
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
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

  if (!password.value) {
    errorMessage.value = '请输入密码';
    return false;
  }

  if (password.value.length < 6) {
    errorMessage.value = '密码至少需要 6 个字符';
    return false;
  }

  if (!confirmPassword.value) {
    errorMessage.value = '请确认密码';
    return false;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致';
    return false;
  }

  return true;
};

// 处理注册
const handleSignUp = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const result = await signUp(email.value, password.value);

    if (result.success) {
      isSuccess.value = true;
      toast.success(result.message);

      // 3秒后跳转到登录页面
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } else {
      errorMessage.value = result.message;
      toast.error(result.message);
    }
  } catch (error) {
    console.error('注册失败:', error);
    errorMessage.value = '注册失败，请重试';
    toast.error('注册失败，请重试');
  } finally {
    isLoading.value = false;
  }
};

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-muted/40 px-4 py-12">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1">
        <CardTitle class="text-2xl font-bold">注册</CardTitle>
        <CardDescription>
          创建一个新账户以开始使用 Fal.AI
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- 成功提示 -->
        <Alert v-if="isSuccess" variant="default" class="border-success bg-success/10">
          <CheckCircle2 class="h-4 w-4 text-success" />
          <AlertDescription class="text-success">
            注册成功！验证邮件已发送到您的邮箱，请查收并验证。即将跳转到登录页面...
          </AlertDescription>
        </Alert>

        <!-- 错误提示 -->
        <Alert v-else-if="errorMessage" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>

        <!-- 注册表单 -->
        <form v-if="!isSuccess" @submit.prevent="handleSignUp" class="space-y-4">
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
            <p class="text-xs text-muted-foreground">
              我们将向此邮箱发送验证邮件
            </p>
          </div>

          <!-- 密码输入 -->
          <div class="space-y-2">
            <Label for="password">密码</Label>
            <div class="relative">
              <Lock class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                v-model="password"
                type="password"
                placeholder="至少 6 个字符"
                class="pl-9"
                :disabled="isLoading"
                required
              />
            </div>
          </div>

          <!-- 确认密码输入 -->
          <div class="space-y-2">
            <Label for="confirm-password">确认密码</Label>
            <div class="relative">
              <Lock class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                v-model="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                class="pl-9"
                :disabled="isLoading"
                required
              />
            </div>
          </div>

          <!-- 注册按钮 -->
          <Button type="submit" class="w-full" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isLoading ? '注册中...' : '注册' }}
          </Button>
        </form>

        <!-- 注册成功后的操作 -->
        <div v-else class="flex justify-center pt-4">
          <Button @click="goToLogin" variant="outline">
            前往登录
          </Button>
        </div>
      </CardContent>

      <CardFooter v-if="!isSuccess" class="flex flex-col space-y-4">
        <div class="text-sm text-muted-foreground text-center">
          已有账户？
          <Button
            variant="link"
            size="sm"
            class="px-1 font-normal"
            @click="goToLogin"
            :disabled="isLoading"
          >
            立即登录
          </Button>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
