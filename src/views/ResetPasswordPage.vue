<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, AlertCircle, CheckCircle2 } from 'lucide-vue-next';
import { updatePassword } from '@/services/auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'vue-sonner';

const router = useRouter();

// 表单数据
const newPassword = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const isSuccess = ref(false);
const isValidSession = ref(false);
const isCheckingSession = ref(true);

// 检查是否有有效的重置会话
onMounted(async () => {
  try {
    // 检查当前会话
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      isValidSession.value = true;
    } else {
      errorMessage.value = '重置链接无效或已过期，请重新发起密码重置';
    }
  } catch (error) {
    console.error('检查会话失败:', error);
    errorMessage.value = '验证失败，请重新发起密码重置';
  } finally {
    isCheckingSession.value = false;
  }
});

// 表单验证
const validateForm = (): boolean => {
  errorMessage.value = '';

  if (!newPassword.value) {
    errorMessage.value = '请输入新密码';
    return false;
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = '密码至少需要 6 个字符';
    return false;
  }

  if (!confirmPassword.value) {
    errorMessage.value = '请确认新密码';
    return false;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致';
    return false;
  }

  return true;
};

// 处理重置密码
const handleResetPassword = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const result = await updatePassword(newPassword.value);

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
    console.error('重置密码失败:', error);
    errorMessage.value = '重置失败，请重试';
    toast.error('重置失败，请重试');
  } finally {
    isLoading.value = false;
  }
};

// 返回登录页面
const goToLogin = () => {
  router.push('/login');
};

// 重新发起密码重置
const goToForgotPassword = () => {
  router.push('/forgot-password');
};
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-muted/40 px-4 py-12">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1">
        <CardTitle class="text-2xl font-bold">重置密码</CardTitle>
        <CardDescription>
          请输入您的新密码
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- 检查会话中 -->
        <div v-if="isCheckingSession" class="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
          <p class="text-sm text-muted-foreground">正在验证重置链接...</p>
        </div>

        <!-- 会话无效 -->
        <template v-else-if="!isValidSession">
          <Alert variant="destructive">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription>{{ errorMessage }}</AlertDescription>
          </Alert>

          <div class="space-y-2">
            <Button @click="goToForgotPassword" variant="default" class="w-full">
              重新发起密码重置
            </Button>
            <Button @click="goToLogin" variant="outline" class="w-full">
              返回登录
            </Button>
          </div>
        </template>

        <!-- 重置密码表单 -->
        <template v-else>
          <!-- 成功提示 -->
          <Alert v-if="isSuccess" variant="default" class="border-success bg-success/10">
            <CheckCircle2 class="h-4 w-4 text-success" />
            <AlertDescription class="text-success">
              密码重置成功！即将跳转到登录页面...
            </AlertDescription>
          </Alert>

          <!-- 错误提示 -->
          <Alert v-else-if="errorMessage" variant="destructive">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription>{{ errorMessage }}</AlertDescription>
          </Alert>

          <!-- 表单 -->
          <form v-if="!isSuccess" @submit.prevent="handleResetPassword" class="space-y-4">
            <!-- 新密码输入 -->
            <div class="space-y-2">
              <Label for="new-password">新密码</Label>
              <div class="relative">
                <Lock class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  v-model="newPassword"
                  type="password"
                  placeholder="至少 6 个字符"
                  class="pl-9"
                  :disabled="isLoading"
                  required
                  autofocus
                />
              </div>
            </div>

            <!-- 确认新密码输入 -->
            <div class="space-y-2">
              <Label for="confirm-password">确认新密码</Label>
              <div class="relative">
                <Lock class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  v-model="confirmPassword"
                  type="password"
                  placeholder="再次输入新密码"
                  class="pl-9"
                  :disabled="isLoading"
                  required
                />
              </div>
            </div>

            <!-- 密码强度提示 -->
            <div class="rounded-lg bg-muted p-3">
              <p class="text-xs font-medium text-foreground mb-2">密码要求：</p>
              <ul class="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-2">
                <li :class="newPassword.length >= 6 ? 'text-success' : ''">
                  至少 6 个字符
                </li>
                <li :class="newPassword && confirmPassword && newPassword === confirmPassword ? 'text-success' : ''">
                  两次密码输入一致
                </li>
              </ul>
            </div>

            <!-- 重置按钮 -->
            <Button type="submit" class="w-full" :disabled="isLoading">
              <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              {{ isLoading ? '重置中...' : '重置密码' }}
            </Button>
          </form>

          <!-- 成功后的操作 -->
          <div v-else class="flex justify-center pt-4">
            <Button @click="goToLogin" variant="default">
              前往登录
            </Button>
          </div>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
