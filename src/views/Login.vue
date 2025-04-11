// src/views/Login.vue
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'vue-sonner';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { User, School, ArrowRight, Lock } from 'lucide-vue-next';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const loginError = ref('');

const authStore = useAuthStore();
const router = useRouter();

// VeeValidate Setup
const formSchema = yup.object({
  username: yup.string().required('Username cannot be empty'),
  password: yup.string().required('Password cannot be empty'),
});

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: formSchema,
  initialValues: {
    username: '',
    password: '',
  },
});

const handleLogin = handleSubmit(async (values) => {
  loginError.value = '';

  await authStore.login(values.username, values.password);

  if (authStore.error) {
    loginError.value = authStore.error;
    toast.error('Login failed', {
      description: loginError.value
    });
  } else {
    toast.success('Login successful', {
      description: `Welcome back, ${values.username}!`
    });

    if (authStore.role === 'admin') {
      router.push('/admin/dashboard');
    } else if (authStore.role === 'teacher') {
      router.push('/teacher/dashboard');
    }
  }
});
</script>

<template>
  <div class="flex min-h-screen bg-gradient-to-br from-background to-muted">
    <!-- Left Panel -->
    <div class="hidden lg:flex lg:w-1/2 bg-muted flex-col justify-center items-center p-12 relative bg-cover bg-center" style="background-image: url('/login-bg.jpg');">
      <div class="absolute inset-0 bg-black/50"></div>
      <div class="max-w-md relative z-10 backdrop-blur-sm bg-black/20 p-8 rounded-xl">
        <div class="flex items-center gap-3 mb-8">
          <School class="h-14 w-14 text-white drop-shadow-lg" />
          <h1 class="text-5xl font-extrabold text-white drop-shadow-lg tracking-tight">HKU</h1>
        </div>
        <h2 class="text-3xl font-bold mb-6 text-white drop-shadow-md tracking-wide">Thesis Management System</h2>
        <p class="text-xl font-medium text-white mb-6 leading-relaxed drop-shadow-md">
          An integrated platform for efficient management of academic papers, streamlined teaching processes, and improved teaching quality.
        </p>
        <div class="mt-12 flex items-center gap-3 text-white/80">
          <Lock class="h-5 w-5" />
          <p class="text-sm">Secure login required for all users</p>
        </div>
      </div>
    </div>

    <!-- Right Panel - Login Form -->
    <div class="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-gradient-to-b from-background to-background/95">
      <div class="w-full max-w-md">
        <div class="lg:hidden flex justify-center mb-10">
          <div class="flex items-center gap-2">
            <School class="h-10 w-10 text-primary" />
            <h1 class="text-2xl font-bold text-primary">HKU Thesis Management System</h1>
          </div>
        </div>

        <Card class="w-full shadow-lg border border-border bg-background/95 backdrop-filter backdrop-blur-sm">
          <CardHeader class="pb-2">
            <CardTitle class="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
            <CardDescription class="text-muted-foreground">
              Enter your account and password to access the system
            </CardDescription>
          </CardHeader>
          
          <CardContent class="space-y-5 pt-4">
            <form @submit="handleLogin" class="space-y-2">
              <Alert v-if="loginError" class="mb-5 border-red-200 bg-red-50 text-red-900 animate-fadeIn">
                <AlertTitle class="text-sm font-medium">Verification Failed</AlertTitle>
                <AlertDescription class="text-xs mt-1">{{ loginError }}</AlertDescription>
              </Alert>
              
              <FormField v-slot="{ componentField}" name="username">
                <FormItem class="space-y-2">
                  <div class="flex items-center justify-between">
                    <FormLabel class="text-foreground font-medium">Username</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <div class="relative group">
                      <User class="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="text"
                        placeholder="Enter your username"
                        class="pl-10 h-11 transition-all border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary"
                        :disabled="isSubmitting"
                        autocomplete="username"
                        v-bind="componentField"
                      />
                    </div>
                  </FormControl>
                </FormItem>
              </FormField>
              
              <FormField v-slot="{ componentField}" name="password">
                <FormItem class="mt-5 space-y-2">
                  <div class="flex items-center justify-between">
                    <FormLabel class="text-foreground font-medium">Password</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <div class="relative group">
                      <Lock class="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        class="pl-10 h-11 transition-all border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary"
                        :disabled="isSubmitting"
                        autocomplete="current-password"
                        v-bind="componentField"
                        @keyup.enter="!isSubmitting ? handleLogin : null"
                      />
                    </div>
                  </FormControl>
                </FormItem>
              </FormField>
              
              <Button
                type="submit"
                class="w-full mt-8 h-11 text-base font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90"
                :disabled="isSubmitting"
                :class="{'opacity-70': isSubmitting}"
              >
                <template v-if="isSubmitting">
                  <div class="animate-spin mr-2 h-5 w-5 border-2 border-t-transparent border-primary-foreground rounded-full"></div>
                  Logging in...
                </template>
                <template v-else>
                  <span>Login</span>
                  <ArrowRight class="h-5 w-5 ml-2" />
                </template>
              </Button>
            </form>
          </CardContent>
          
          <CardFooter class="flex flex-col space-y-2 pt-0">
            <div class="text-sm text-muted-foreground text-center">
              <Tooltip>
                <TooltipTrigger>
                  <a href="#" class="text-primary hover:underline">Forgot password?</a>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p class="text-xs">Contact your administrator to reset your password.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardFooter>
        </Card>
        
        <div class="text-center mt-8 space-y-2">
          <p class="text-xs text-muted-foreground">
            © {{ new Date().getFullYear() }} Qi Yijiazhen. All rights reserved.
          </p>
          <div class="flex justify-center gap-4 text-xs text-muted-foreground">
            <a href="#" class="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" class="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" class="hover:text-primary transition-colors">Support</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>