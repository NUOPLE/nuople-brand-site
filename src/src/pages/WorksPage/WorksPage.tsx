import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import { toast } from 'sonner';
import Image from '@client/src/components/ui/image';

import {
  getWorkList,
  deleteWork,
} from '@client/src/api/works';
import type { WorkListItem } from '@shared/api.interface';
import { logger } from '@/utils/logger';

const CATEGORY_MAP: Record<string, string> = {
  logo: 'LOGO设计',
  vis: '品牌形象',
  packaging: '包装设计',
};

const PAGE_SIZE = 10;

const WorksPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<WorkListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWorkList({
        page,
        pageSize: PAGE_SIZE,
        keyword: keyword || undefined,
        category: category === 'all' ? undefined : category,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      logger.error('fetch work list failed', String(err));
    } finally {
      setLoading(false);
    }
  }, [page, keyword, category]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSearch = () => {
    setPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setPage(1);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteWork(deleteId);
      toast.success('删除成功');
      setDeleteId(null);
      fetchList();
    } catch (err) {
      logger.error('delete work failed', String(err));
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">作品管理</h1>
        <Button
          onClick={() => navigate('/admin/works/new')}
          className="bg-primary text-primary-foreground rounded-sm"
        >
          <Plus className="size-4" />
          新增作品
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="按标题搜索"
            className="pl-9 rounded-sm"
          />
        </div>
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-40 rounded-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="logo">LOGO设计</SelectItem>
            <SelectItem value="vis">品牌形象</SelectItem>
            <SelectItem value="packaging">包装设计</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-24">
                封面
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                标题
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-28">
                分类
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-32">
                客户
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-20">
                年份
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 w-32">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  加载中...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  暂无作品
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-b-0 hover:bg-accent transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="w-16 h-16 rounded-sm overflow-hidden border border-border">
                      {item.coverImage ? (
                        <Image
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium">
                    {item.title}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-muted text-muted-foreground rounded-sm px-2 py-0.5 text-xs">
                      {CATEGORY_MAP[item.category] || item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {item.client}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                    {item.year}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => navigate(`/admin/works/${item.id}/edit`)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="icon"
              className="size-8 rounded-sm"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-sm max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除该作品吗？删除后无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm">取消</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorksPage;
