import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@client/src/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@client/src/components/ui/form';
import { Input } from '@client/src/components/ui/input';
import { useAuth } from '@client/src/hooks/use-auth';
import type { AxiosError } from 'axios';
import { logger } from '@lark-apaas/client-toolkit/logger';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, admin } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (admin) {
      const from = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname;
      navigate(from || '/admin/dashboard', { replace: true });
    }
  }, [admin, navigate, location.state]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMsg('');
    try {
      await login(data.username, data.password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg =
        axiosError.response?.data?.message || axiosError.message || '登录失败';
      setErrorMsg(msg);
      logger.error('login failed', String(msg));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-sm p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="flex aspect-square size-12 items-center justify-center rounded-sm bg-primary text-primary-foreground font-bold text-lg mb-3">
              B
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              品牌CMS管理后台
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              请登录以继续
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-sm bg-destructive/10 text-destructive text-sm">
              {errorMsg}
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      用户名 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="请输入用户名" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      密码 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="请输入密码"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? '登录中...' : '登录'}
              </Button>
            </form>
          </Form>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          默认账号 admin / admin123
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
