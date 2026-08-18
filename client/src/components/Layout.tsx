import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Image,
  MessageSquare,
  Bot,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';


const navItems = [
  { path: '/admin/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { path: '/admin/works', label: '作品管理', icon: Image },
  { path: '/admin/messages', label: '留言管理', icon: MessageSquare },
  { path: '/admin/keyword-rules', label: '客服设置', icon: Bot },
  { path: '/admin/site-settings', label: '网站设置', icon: Settings },
];

const titleMap: Record<string, string> = {
  '/admin/dashboard': '仪表盘',
  '/admin/works': '作品管理',
  '/admin/works/new': '新增作品',
  '/admin/messages': '留言管理',
  '/admin/keyword-rules': '智能客服设置',
  '/admin/site-settings': '网站内容设置',
};

const getTitle = (pathname: string): string => {
  if (titleMap[pathname]) return titleMap[pathname];
  if (pathname.startsWith('/admin/works/') && pathname.endsWith('/edit'))
    return '编辑作品';
  return '后台管理';
};

const LayoutContent = () => {
  const { pathname } = useLocation();
  const { admin, logout } = useAuth();
  const activeTitle = getTitle(pathname);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLogoutOpen(false);
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
              >
                <Link to="/admin/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-primary text-primary-foreground font-bold">
                    B
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                    <span className="font-semibold text-sm">品牌CMS</span>
                    <span className="text-xs text-muted-foreground">
                      管理后台
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.path)}
                    >
                      <Link to={item.path}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="px-3 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                当前账号：{admin?.username || '-'}
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setLogoutOpen(true)}
                className="cursor-pointer"
              >
                <LogOut className="size-4" />
                <span>退出登录</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 flex flex-col overflow-hidden p-6">
        <header className="flex items-center gap-2 mb-6">
          <SidebarTrigger />
          <Breadcrumb className="self-center">
            <BreadcrumbList>
              <BreadcrumbItem className="text-foreground font-medium">
                <BreadcrumbPage>{activeTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <UniversalLink
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3.5" />
              查看前台网站
            </UniversalLink>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="max-w-sm rounded-sm">
          <DialogHeader>
            <DialogTitle>确认退出</DialogTitle>
            <DialogDescription>
              确定要退出登录吗？退出后需要重新登录才能进入管理后台。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogoutOpen(false)}
              className="rounded-sm"
            >
              取消
            </Button>
            <Button onClick={handleLogout} className="rounded-sm">
              确认退出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Layout = () => (
  <SidebarProvider>
    <LayoutContent />
  </SidebarProvider>
);

export default Layout;
