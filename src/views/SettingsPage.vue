<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lock, User, Trash2, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-vue-next';
import { getCurrentUser, changePassword, deleteAccount, signOut, getPendingDeletion, cancelAccountDeletion } from '@/services/auth';
import { toast } from 'vue-sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const router = useRouter();

// 当前用户
const currentUser = ref<SupabaseUser | null>(null);
const isLoading = ref(true);

// 修改密码表单
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const isChangingPassword = ref(false);
const passwordError = ref('');
const passwordSuccess = ref('');

// 删除账户对话框
const showDeleteDialog = ref(false);
const deleteConfirmText = ref('');
const isDeletingAccount = ref(false);
// 二次确认对话框
const showFinalConfirmDialog = ref(false);

// 待删除状态
interface PendingDeletion {
  id: string;
  user_id: string;
  requested_at: string;
  scheduled_deletion_at: string;
  cancel_token: string;
  reason?: string;
}
const pendingDeletion = ref<PendingDeletion | null>(null);
const isCancelingDeletion = ref(false);

// 获取当前用户信息
onMounted(async () => {
  isLoading.value = true;
  try {
    currentUser.value = await getCurrentUser();
    if (!currentUser.value) {
      toast.error('请先登录');
      router.push('/login');
      return;
    }

    // 检查账户是否处于待删除状态
    pendingDeletion.value = await getPendingDeletion();
  } catch (error) {
    console.error('获取用户信息失败:', error);
    toast.error('获取用户信息失败');
    router.push('/login');
  } finally {
    isLoading.value = false;
  }
});

// 处理修改密码
const handleChangePassword = async () => {
  passwordError.value = '';
  passwordSuccess.value = '';

  // 验证表单
  if (!passwordForm.value.oldPassword) {
    passwordError.value = '请输入旧密码';
    return;
  }

  if (!passwordForm.value.newPassword) {
    passwordError.value = '请输入新密码';
    return;
  }

  if (passwordForm.value.newPassword.length < 6) {
    passwordError.value = '新密码至少需要 6 个字符';
    return;
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = '两次输入的新密码不一致';
    return;
  }

  if (passwordForm.value.oldPassword === passwordForm.value.newPassword) {
    passwordError.value = '新密码不能与旧密码相同';
    return;
  }

  isChangingPassword.value = true;

  try {
    const result = await changePassword(
      currentUser.value!.email!,
      passwordForm.value.oldPassword,
      passwordForm.value.newPassword
    );

    if (result.success) {
      passwordSuccess.value = result.message;
      toast.success('密码修改成功！即将退出登录，请使用新密码重新登录');

      // 清空表单
      passwordForm.value = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      };

      // 延迟2秒后退出登录并跳转到登录页
      setTimeout(async () => {
        try {
          await signOut();
          router.push('/login');
        } catch (error) {
          console.error('退出登录失败:', error);
          // 即使退出失败也强制跳转到登录页
          router.push('/login');
        }
      }, 2000);
    } else {
      passwordError.value = result.message;
      toast.error(result.message);
    }
  } catch (error) {
    console.error('修改密码失败:', error);
    passwordError.value = '修改密码失败，请重试';
    toast.error('修改密码失败，请重试');
  } finally {
    isChangingPassword.value = false;
  }
};

// 第一步：验证输入并显示二次确认对话框
const handleDeleteAccountFirstStep = () => {
  if (deleteConfirmText.value !== '删除我的账户') {
    toast.error('请输入正确的确认文字');
    return;
  }

  // 显示二次确认对话框
  showFinalConfirmDialog.value = true;
};

// 第二步：最终确认并执行删除（申请删除，进入冷静期）
const handleDeleteAccountFinalConfirm = async () => {
  isDeletingAccount.value = true;

  try {
    const result = await deleteAccount();

    if (result.success) {
      toast.success(result.message);
      showDeleteDialog.value = false;
      showFinalConfirmDialog.value = false;

      // 重新获取待删除状态
      pendingDeletion.value = await getPendingDeletion();

      // 清空输入框
      deleteConfirmText.value = '';
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    console.error('删除账户失败:', error);
    toast.error('删除账户失败，请重试');
  } finally {
    isDeletingAccount.value = false;
  }
};

// 取消账户删除
const handleCancelDeletion = async () => {
  isCancelingDeletion.value = true;

  try {
    const result = await cancelAccountDeletion();

    if (result.success) {
      toast.success(result.message);
      pendingDeletion.value = null;
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    console.error('取消删除失败:', error);
    toast.error('取消删除失败，请重试');
  } finally {
    isCancelingDeletion.value = false;
  }
};

// 计算剩余天数
const getRemainingDays = (scheduledAt: string) => {
  const now = new Date();
  const scheduled = new Date(scheduledAt);
  const diff = scheduled.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
};

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<template>
  <div class="w-full bg-background px-4 py-12">
    <div class="mx-auto max-w-4xl space-y-6 pb-12">
      <!-- 页面标题 -->
      <div>
        <h1 class="text-3xl font-bold tracking-tight">个人设置</h1>
        <p class="text-muted-foreground mt-2">管理您的账户信息和偏好设置</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <!-- 账户信息 -->
      <Card v-if="!isLoading && currentUser">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User class="h-6 w-6" />
            </div>
            <div>
              <CardTitle>账户信息</CardTitle>
              <CardDescription>您当前的账户详细信息</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label class="text-muted-foreground">邮箱地址</Label>
              <p class="font-medium">{{ currentUser.email }}</p>
            </div>
            <div class="space-y-2">
              <Label class="text-muted-foreground">账户创建时间</Label>
              <p class="font-medium">
                {{ new Date(currentUser.created_at).toLocaleDateString('zh-CN') }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 修改密码 -->
      <Card v-if="!isLoading && currentUser">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Lock class="h-6 w-6" />
            </div>
            <div>
              <CardTitle>修改密码</CardTitle>
              <CardDescription>更改您的登录密码</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- 错误提示 -->
          <Alert v-if="passwordError" variant="destructive">
            <XCircle class="h-4 w-4" />
            <AlertDescription>{{ passwordError }}</AlertDescription>
          </Alert>

          <!-- 成功提示 -->
          <Alert v-if="passwordSuccess" variant="default" class="border-green-500 bg-green-50 text-green-900">
            <CheckCircle2 class="h-4 w-4 text-green-600" />
            <AlertDescription class="text-green-800">{{ passwordSuccess }}</AlertDescription>
          </Alert>

          <form @submit.prevent="handleChangePassword" class="space-y-4">
            <div class="space-y-2">
              <Label for="old-password">旧密码</Label>
              <Input
                id="old-password"
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入旧密码"
                :disabled="isChangingPassword"
              />
            </div>

            <div class="space-y-2">
              <Label for="new-password">新密码</Label>
              <Input
                id="new-password"
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码（至少6位）"
                :disabled="isChangingPassword"
              />
            </div>

            <div class="space-y-2">
              <Label for="confirm-password">确认新密码</Label>
              <Input
                id="confirm-password"
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                :disabled="isChangingPassword"
              />
            </div>

            <Button type="submit" :disabled="isChangingPassword" class="w-full sm:w-auto">
              <Lock class="mr-2 h-4 w-4" />
              {{ isChangingPassword ? '修改中...' : '修改密码' }}
            </Button>
          </form>
        </CardContent>
      </Card>

      <!-- 危险区域 -->
      <Card v-if="!isLoading && currentUser" class="border-destructive">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle class="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle class="text-destructive">危险区域</CardTitle>
              <CardDescription>这些操作不可逆，请谨慎操作</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- 冷静期提示（账户已申请删除） -->
          <div v-if="pendingDeletion" class="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 space-y-3">
            <div class="flex items-start gap-3">
              <Clock class="h-5 w-5 text-orange-600 mt-0.5" />
              <div class="flex-1">
                <h3 class="font-semibold text-orange-900 mb-1">账户删除冷静期</h3>
                <p class="text-sm text-orange-800 mb-3">
                  您的账户已申请删除，目前处于 <strong>30 天冷静期</strong>。
                  在此期间，您可以随时取消删除申请。
                </p>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="text-orange-700">申请时间：</span>
                    <span class="font-medium text-orange-900">{{ formatDate(pendingDeletion.requested_at) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-orange-700">计划删除时间：</span>
                    <span class="font-medium text-orange-900">{{ formatDate(pendingDeletion.scheduled_deletion_at) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-orange-700">剩余时间：</span>
                    <span class="font-bold text-lg text-orange-600">
                      {{ getRemainingDays(pendingDeletion.scheduled_deletion_at) }} 天
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex gap-2 pt-2">
              <Button
                variant="outline"
                @click="handleCancelDeletion"
                :disabled="isCancelingDeletion"
                class="flex-1 border-orange-500 text-orange-700 hover:bg-orange-100"
              >
                <XCircle class="mr-2 h-4 w-4" />
                {{ isCancelingDeletion ? '取消中...' : '取消删除申请' }}
              </Button>
            </div>
          </div>

          <!-- 删除账户按钮（未申请删除时显示） -->
          <div v-else class="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <h3 class="font-semibold text-destructive mb-2">删除账户</h3>
            <p class="text-sm text-muted-foreground mb-4">
              删除账户将进入 30 天冷静期，期间您可以随时取消删除。30 天后账户和所有数据将被永久删除，不可恢复。
            </p>
            <Button
              variant="destructive"
              @click="showDeleteDialog = true"
              class="gap-2"
            >
              <Trash2 class="h-4 w-4" />
              删除我的账户
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 删除账户确认对话框（第一步） -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-destructive">
            <AlertTriangle class="h-5 w-5" />
            确认删除账户
          </DialogTitle>
          <DialogDescription>
            申请删除后，账户将进入 30 天冷静期，期间可随时取消。
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle class="h-4 w-4" />
            <AlertDescription>
              <strong>重要提示：</strong>
              <ul class="mt-2 list-inside list-disc space-y-1">
                <li>申请后进入 <strong>30 天冷静期</strong></li>
                <li>冷静期内可随时取消删除</li>
                <li>30 天后账户和数据将被永久删除</li>
                <li>包括：生成历史、账户设置、登录凭证</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div class="space-y-2">
            <Label for="delete-confirm">
              请输入 <span class="font-mono font-bold">删除我的账户</span> 以确认
            </Label>
            <Input
              id="delete-confirm"
              v-model="deleteConfirmText"
              placeholder="删除我的账户"
              :disabled="isDeletingAccount"
            />
          </div>
        </div>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button
            variant="outline"
            @click="showDeleteDialog = false"
            :disabled="isDeletingAccount"
          >
            取消
          </Button>
          <Button
            variant="destructive"
            @click="handleDeleteAccountFirstStep"
            :disabled="isDeletingAccount || deleteConfirmText !== '删除我的账户'"
          >
            <Trash2 class="mr-2 h-4 w-4" />
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 二次确认对话框（最后一步） -->
    <Dialog v-model:open="showFinalConfirmDialog">
      <DialogContent class="sm:max-w-md border-2 border-destructive">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-destructive text-xl">
            <AlertTriangle class="h-6 w-6 animate-pulse" />
            最后确认
          </DialogTitle>
          <DialogDescription class="text-base">
            您真的确定要申请删除账户吗？这是最后的确认步骤。
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <Alert variant="destructive" class="border-2">
            <AlertTriangle class="h-5 w-5" />
            <AlertDescription class="text-base">
              <strong class="text-lg">⚠️ 最后确认</strong>
              <p class="mt-2">
                点击"确认删除"后，您的账户将<strong class="underline">进入 30 天冷静期</strong>。
              </p>
              <p class="mt-2 text-sm">
                • 冷静期内：您可以随时登录并取消删除<br>
                • 30 天后：账户和所有数据将被永久删除，无法恢复
              </p>
              <p class="mt-2 text-sm font-medium">
                如果您只是想暂时停用账户，建议直接退出登录而不是删除账户。
              </p>
            </AlertDescription>
          </Alert>

          <div class="rounded-lg bg-muted p-4 space-y-2">
            <p class="font-medium text-sm">请确认您已理解：</p>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>✓ 账户将进入 30 天冷静期</li>
              <li>✓ 冷静期内可以取消删除</li>
              <li>✓ 30 天后数据将永久删除</li>
            </ul>
          </div>
        </div>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button
            variant="outline"
            @click="showFinalConfirmDialog = false"
            :disabled="isDeletingAccount"
            class="flex-1"
          >
            我再想想
          </Button>
          <Button
            variant="destructive"
            @click="handleDeleteAccountFinalConfirm"
            :disabled="isDeletingAccount"
            class="flex-1"
          >
            <Trash2 class="mr-2 h-4 w-4" />
            {{ isDeletingAccount ? '申请中...' : '确认申请删除' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
