import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Image,
  MessageSquare,
  Bot,
  LayoutDashboard,
  Plus,
  Eye,
  Settings,
  RefreshCw,
} from 'lucide-react';

import { axiosForBackend } from '@/api';
import type { DashboardStats } from '@shared/api.interface';
import { getPageCache, setPageCache, clearPageCache } from '@client/src/utils/page-cache';
import { logger } from '@lark-apaas/client-toolkit/logger';

const CACHE_KEY = 'admin:dashboard:stats';

const categoryLabelMap: Record<string, string> = {
  logo: 'LOGO设计',
  vis: '品牌形象',
  packaging: '包装设计',
};

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async (force = false) => {
    if (!force) {
      const cached = getPageCache<DashboardStats>(CACHE_KEY);
      if (cached) {
        setStats(cached);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    try {
      const res = await axiosForBackend.get<DashboardStats>('/api/dashboard/stats');
      setStats(res.data);
      setPageCache(CACHE_KEY, res.data);
    } catch (err) {
      logger.error('Dashboard fetch failed:', String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    clearPageCache(CACHE_KEY);
    loadStats(true);
  }, [loadStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const truncate = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '...';
  };

  const statCards = [
    {
      label: '作品总数',
      value: stats?.totalWorks ?? 0,
      icon: Image,
      destructive: false,
    },
    {
      label: '留言总数',
      value: stats?.totalMessages ?? 0,
      icon: MessageSquare,
      destructive: false,
    },
    {
      label: '未读留言',
      value: stats?.unreadMessages ?? 0,
      icon: Eye,
      destructive: true,
    },
    {
      label: '关键词规则',
      value: stats?.totalKeywordRules ?? 0,
      icon: Bot,
      destructive: false,
    },
  ];

  const quickActions = [
    { label: '新增作品', to: '/admin/works/new', icon: Plus },
    { label: '查看留言', to: '/admin/messages', icon: MessageSquare },
    { label: '设置关键词', to: '/admin/keyword-rules', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-sm p-5 animate-pulse"
            >
              <div className="h-4 w-20 bg-border rounded-sm mb-4" />
              <div className="h-8 w-16 bg-border rounded-sm" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card border border-border rounded-sm p-5 animate-pulse">
            <div className="h-5 w-24 bg-border rounded-sm mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-border/60 rounded-sm" />
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-sm p-5 animate-pulse">
            <div className="h-5 w-28 bg-border rounded-sm mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-border/60 rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">数据概览</h1>
          <p className="text-sm text-muted-foreground mt-1">欢迎回来，以下是网站运营数据</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-sm hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* 数据概览卡片行 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-card border border-border rounded-sm p-5"
          >
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
              <card.icon className="size-4" />
              <span>{card.label}</span>
            </div>
            <div
              className={`font-mono text-3xl font-bold ${
                card.destructive ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* 两列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 最近留言 */}
        <div className="lg:col-span-2 bg-card border border-border rounded-sm p-5">
          <h2 className="text-base font-semibold mb-3">最近留言</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">姓名</th>
                  <th className="pb-2 font-medium">留言摘要</th>
                  <th className="pb-2 font-medium">提交时间</th>
                  <th className="pb-2 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {stats && stats.recentMessages.length > 0 ? (
                  stats.recentMessages.map((msg) => (
                    <tr
                      key={msg.id}
                      className="border-b border-border last:border-b-0 hover:bg-accent transition-colors"
                    >
                      <td className="py-3 pr-4 font-medium">{msg.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground max-w-[240px] truncate">
                        {truncate(msg.content, 50)}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground font-mono text-xs whitespace-nowrap">
                        {formatDate(msg.createdAt)}
                      </td>
                      <td className="py-3">
                        {msg.isRead ? (
                          <span className="text-muted-foreground text-xs">
                            已读
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-destructive text-xs">
                            <span className="size-1.5 rounded-full bg-destructive" />
                            未读
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      暂无留言
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 作品分类统计 */}
        <div className="bg-card border border-border rounded-sm p-5">
          <h2 className="text-base font-semibold mb-3">作品分类统计</h2>
          <div className="space-y-0">
            {(['logo', 'vis', 'packaging'] as const).map((cat) => {
              const stat = stats?.categoryStats.find(
                (s) => s.category === cat,
              );
              return (
                <div
                  key={cat}
                  className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
                >
                  <span className="text-sm">{categoryLabelMap[cat]}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {stat?.count ?? 0}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 快捷操作区 */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-sm px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <action.icon className="size-4" />
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
