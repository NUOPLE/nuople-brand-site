import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
import { Textarea } from '@client/src/components/ui/textarea';
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
import {
  deleteMessage,
  getMessageById,
  getMessageList,
  replyMessage,
  updateMessageReadStatus,
} from '@client/src/api/messages';
import type {
  Message,
  MessageListItem,
  MessageStatusFilter,
} from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const PAGE_SIZE = 10;

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  const pad = (n: number): string => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const truncate = (text: string, len: number): string => {
  if (text.length <= len) return text;
  return text.slice(0, len) + '...';
};

const MessagesPage = () => {
  const [page, setPage] = useState<number>(1);
  const [status, setStatus] = useState<MessageStatusFilter>('all');
  const [items, setItems] = useState<MessageListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalUnread, setTotalUnread] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [replySubmitting, setReplySubmitting] = useState<boolean>(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>('');
  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMessageList({
        page,
        pageSize: PAGE_SIZE,
        status,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalUnread(res.totalUnread);
    } catch (err) {
      logger.error('获取留言列表失败', String(err));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openDetail = useCallback(async (id: string) => {
    setDrawerOpen(true);
    setSelectedMessage(null);
    setReplyText('');
    setDetailLoading(true);
    try {
      const msg = await getMessageById(id);
      setSelectedMessage(msg);
      if (!msg.isRead) {
        try {
          await updateMessageReadStatus(id, true);
          msg.isRead = true;
          setTotalUnread((prev) => Math.max(0, prev - 1));
          setItems((prevItems) =>
            prevItems.map((item) =>
              item.id === id ? { ...item, isRead: true } : item,
            ),
          );
        } catch (readErr) {
          logger.error('标记已读失败', String(readErr));
        }
      }
    } catch (err) {
      logger.error('获取留言详情失败', String(err));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const toggleReadStatus = useCallback(
    async (item: MessageListItem) => {
      const newIsRead = !item.isRead;
      try {
        await updateMessageReadStatus(item.id, newIsRead);
        setItems((prevItems) =>
          prevItems.map((i) =>
            i.id === item.id ? { ...i, isRead: newIsRead } : i,
          ),
        );
        setTotalUnread((prev) =>
          newIsRead ? Math.max(0, prev - 1) : prev + 1,
        );
        if (selectedMessage?.id === item.id) {
          setSelectedMessage((prev) => (prev ? { ...prev, isRead: newIsRead } : prev));
        }
        toast.success(newIsRead ? '已标记为已读' : '已标记为未读');
      } catch (err) {
        logger.error('更新阅读状态失败', String(err));
      }
    },
    [selectedMessage],
  );

  const handleReply = useCallback(async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setReplySubmitting(true);
    try {
      const res = await replyMessage(selectedMessage.id, replyText.trim());
      setSelectedMessage((prev) =>
        prev
          ? {
              ...prev,
              replyContent: replyText.trim(),
              repliedAt: res.repliedAt,
              isRead: true,
            }
          : prev,
      );
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === selectedMessage.id
            ? { ...item, isRead: true, hasReply: true }
            : item,
        ),
      );
      if (!selectedMessage.isRead) {
        setTotalUnread((prev) => Math.max(0, prev - 1));
      }
      setReplyText('');
      toast.success('回复成功');
    } catch (err) {
      logger.error('回复失败', String(err));
    } finally {
      setReplySubmitting(false);
    }
  }, [selectedMessage, replyText]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    setDeleteSubmitting(true);
    try {
      await deleteMessage(deleteTargetId);
      setDeleteDialogOpen(false);
      setDeleteTargetId('');
      if (selectedMessage?.id === deleteTargetId) {
        setDrawerOpen(false);
        setSelectedMessage(null);
      }
      toast.success('删除成功');
      await fetchList();
    } catch (err) {
      logger.error('删除失败', String(err));
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTargetId, selectedMessage, fetchList]);

  const openDeleteDialog = useCallback((id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  }, []);

  const statusTabs: { key: MessageStatusFilter; label: string }[] = useMemo(
    () => [
      { key: 'all', label: '全部' },
      { key: 'unread', label: '未读' },
      { key: 'read', label: '已读' },
    ],
    [],
  );

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      {/* 顶部统计与筛选区 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-2xl font-bold text-foreground">
            {total}
          </span>
          <span className="text-muted-foreground text-sm">共 {total} 条留言</span>
          <span className="text-sm">
            未读{' '}
            <span className="text-destructive font-mono font-bold">
              {totalUnread}
            </span>{' '}
            条
          </span>
        </div>
        <div className="flex items-center gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
              }}
              className={
                'px-4 py-1.5 text-sm rounded-sm transition-colors ' +
                (status === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent text-muted-foreground hover:bg-accent/80')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 留言列表卡片 */}
      <div className="bg-card border border-border rounded-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="w-[120px]">姓名</TableHead>
              <TableHead className="w-[200px]">邮箱</TableHead>
              <TableHead>留言摘要</TableHead>
              <TableHead className="w-[160px]">提交时间</TableHead>
              <TableHead className="w-[100px]">状态</TableHead>
              <TableHead className="w-[240px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  暂无留言
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  className={item.isRead ? '' : 'bg-destructive/5'}
                >
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground break-words max-w-[200px] whitespace-normal">
                    {item.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {truncate(item.content, 60)}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  <TableCell>
                    {item.isRead ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        已读
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-destructive font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        未读
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(item.id)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        查看
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleReadStatus(item)}
                      >
                        {item.isRead ? '标记未读' : '标记已读'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => openDeleteDialog(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页器 */}
      {total > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
            上一页
          </Button>
          <span className="font-mono text-sm text-muted-foreground px-3">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            下一页
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 详情抽屉 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="fixed right-0 top-0 h-full w-[480px] bg-card border-l border-border shadow-none flex flex-col transition-transform duration-200"
            style={{
              transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
            }}
          >
            {/* 抽屉头部 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                留言详情
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* 抽屉内容 */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {detailLoading ? (
                <div className="text-muted-foreground text-sm">加载中...</div>
              ) : !selectedMessage ? (
                <div className="text-muted-foreground text-sm">加载失败</div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">
                          姓名
                        </div>
                        <div className="text-sm font-medium">
                          {selectedMessage.name}
                        </div>
                      </div>
                      {selectedMessage.isRead ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                          已读
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-destructive font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                          未读
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">
                        邮箱
                      </div>
                      <div className="text-sm break-words">
                        {selectedMessage.email}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">
                        提交时间
                      </div>
                      <div className="text-sm font-mono">
                        {formatDate(selectedMessage.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-2">
                      留言内容
                    </div>
                    <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-accent/30 rounded-sm p-3 border border-border">
                      {selectedMessage.content}
                    </div>
                  </div>

                  {/* 回复区域 */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">
                      回复
                    </div>
                    {selectedMessage.replyContent ? (
                      <div className="space-y-2">
                        <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-accent/30 rounded-sm p-3 border border-border">
                          {selectedMessage.replyContent}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono text-right">
                          回复于 {formatDate(selectedMessage.repliedAt!)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground mb-3">
                        暂无回复
                      </div>
                    )}
                    <div className="space-y-2 mt-3">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="输入回复内容..."
                        rows={5}
                      />
                      <div className="flex justify-end">
                        <Button
                          variant="default"
                          size="sm"
                          disabled={
                            !replyText.trim() || replySubmitting
                          }
                          onClick={handleReply}
                        >
                          <Send className="w-3.5 h-3.5" />
                          {replySubmitting
                            ? '提交中...'
                            : selectedMessage.replyContent
                            ? '更新回复'
                            : '提交回复'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除该留言吗？删除后无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm">取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground rounded-sm hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteSubmitting}
            >
              {deleteSubmitting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MessagesPage;
