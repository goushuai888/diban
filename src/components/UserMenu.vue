<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, LogIn, Settings } from 'lucide-vue-next';
import { getCurrentUser, signOut } from '@/services/auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'vue-sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AuthChangeEvent } from '@supabase/supabase-js';

const router = useRouter();
const currentUser = ref<SupabaseUser | null>(null);
const isLoading = ref(true);

// 获取当前用户
const fetchCurrentUser = async () => {
  isLoading.value = true;
  try {
    currentUser.value = await getCurrentUser();
  } catch (error) {
    console.error('获取用户信息失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 组件挂载时获取用户信息并监听认证状态变化
let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

onMounted(() => {
  fetchCurrentUser();

  // 监听认证状态变化
  authSubscription = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
    console.log('Auth state changed:', event);

    if (event === 'SIGNED_IN' && session?.user) {
      // 用户登录成功
      currentUser.value = session.user;
      isLoading.value = false;
    } else if (event === 'SIGNED_OUT') {
      // 用户登出
      currentUser.value = null;
      isLoading.value = false;
    } else if (event === 'USER_UPDATED' && session?.user) {
      // 用户信息更新
      currentUser.value = session.user;
    }
  });
});

// 组件卸载时清理订阅
onUnmounted(() => {
  if (authSubscription) {
    authSubscription.data.subscription.unsubscribe();
  }
});

// 处理登出
const handleSignOut = async () => {
  try {
    const result = await signOut();
    if (result.success) {
      currentUser.value = null;
      toast.success(result.message);
      router.push('/');
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    console.error('登出失败:', error);
    toast.error('登出失败，请重试');
  }
};

// 获取用户首字母（用于头像）
const getUserInitial = (email: string): string => {
  return email.charAt(0).toUpperCase();
};
</script>

<template>
  <!-- 未登录状态 -->
  <Button
    v-if="!isLoading && !currentUser"
    as-child
    variant="default"
    size="sm"
    class="gap-2"
  >
    <RouterLink to="/login">
      <LogIn class="h-4 w-4" />
      <span class="hidden sm:inline">登录</span>
    </RouterLink>
  </Button>

  <!-- 已登录状态 -->
  <DropdownMenu v-else-if="!isLoading && currentUser">
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="rounded-full">
        <Avatar class="h-8 w-8">
          <AvatarFallback class="bg-primary text-primary-foreground">
            {{ getUserInitial(currentUser.email || 'U') }}
          </AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel class="font-normal">
        <div class="flex flex-col space-y-1">
          <p class="text-sm font-medium leading-none">我的账户</p>
          <p class="text-xs leading-none text-muted-foreground">
            {{ currentUser.email }}
          </p>
        </div>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      <DropdownMenuItem @click="() => router.push('/settings')">
        <Settings class="mr-2 h-4 w-4" />
        <span>个人设置</span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem @click="handleSignOut" class="text-destructive focus:text-destructive">
        <LogOut class="mr-2 h-4 w-4" />
        <span>登出</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <!-- 加载状态 -->
  <div v-else class="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
</template>
