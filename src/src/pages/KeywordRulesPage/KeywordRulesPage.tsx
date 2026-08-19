import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@client/src/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@client/src/components/ui/alert-dialog';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@client/src/components/ui/form';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@client/src/components/ui/table';
import { keywordRuleApi } from '@client/src/api/keyword-rule';
import type { KeywordRule } from '@shared/api.interface';

const formSchema = z.object({
  keywords: z
    .string()
    .min(1, '请输入至少一个关键词')
    .refine(
      (val) => val.split(',').map((s) => s.trim()).filter(Boolean).length > 0,
      '请输入至少一个关键词',
    ),
  replyContent: z.string().min(1, '请输入回复内容'),
});

type FormValues = z.infer<typeof formSchema>;

const KeywordRulesPage = () => {
  const [rules, setRules] = useState<KeywordRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<KeywordRule | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keywords: '',
      replyContent: '',
    },
  });

  const fetchRules = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await keywordRuleApi.list();
      setRules(data.items);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRules();
  }, []);

  const handleAdd = (): void => {
    setEditingRule(null);
    form.reset({ keywords: '', replyContent: '' });
    setDialogOpen(true);
  };

  const handleEdit = (rule: KeywordRule): void => {
    setEditingRule(rule);
    form.reset({
      keywords: rule.keywords.join(', '),
      replyContent: rule.replyContent,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues): Promise<void> => {
    const keywords = values.keywords
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (keywords.length === 0) {
      form.setError('keywords', { message: '请输入至少一个关键词' });
      return;
    }
    try {
      setSubmitting(true);
      if (editingRule) {
        await keywordRuleApi.update(editingRule.id, {
          keywords,
          replyContent: values.replyContent,
        });
        toast.success('编辑成功');
      } else {
        await keywordRuleApi.create({
          keywords,
          replyContent: values.replyContent,
        });
        toast.success('创建成功');
      }
      setDialogOpen(false);
      void fetchRules();
    } catch {
      // error handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const handleMove = async (
    id: string,
    direction: 'up' | 'down',
  ): Promise<void> => {
    try {
      await keywordRuleApi.move(id, direction);
      void fetchRules();
    } catch {
      // error handled by interceptor
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deletingId) return;
    try {
      await keywordRuleApi.remove(deletingId);
      toast.success('删除成功');
      setDeletingId(null);
      void fetchRules();
    } catch {
      // error handled by interceptor
    }
  };

  const truncate = (text: string, maxLen: number): string => {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '...';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">关键词规则</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            用户消息包含任一关键词即触发对应回复，从上到下匹配，命中第一条即返回
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-primary text-primary-foreground rounded-sm"
          data-ai-section-type="button"
        >
          <Plus className="size-4" />
          新增规则
        </Button>
      </div>

      <div className="bg-card border border-border rounded-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">序号</TableHead>
              <TableHead className="w-72">关键词</TableHead>
              <TableHead>回复内容</TableHead>
              <TableHead className="w-56 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  暂无规则，点击右上角添加
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule, index) => (
                <TableRow key={rule.id} className="hover:bg-accent">
                  <TableCell>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground text-xs font-mono">
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {rule.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="bg-muted text-muted-foreground rounded-sm px-2 py-0.5 text-xs"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {truncate(rule.replyContent, 60)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMove(rule.id, 'up')}
                        disabled={index === 0}
                        className="h-7 px-2 rounded-sm border border-border hover:bg-accent"
                        aria-label="上移"
                      >
                        <ChevronUp className="size-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMove(rule.id, 'down')}
                        disabled={index === rules.length - 1}
                        className="h-7 px-2 rounded-sm border border-border hover:bg-accent"
                        aria-label="下移"
                      >
                        <ChevronDown className="size-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                        className="h-7 px-2 rounded-sm border border-border hover:bg-accent"
                        aria-label="编辑"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingId(rule.id)}
                        className="h-7 px-2 rounded-sm border border-border hover:bg-destructive/10 hover:text-destructive"
                        aria-label="删除"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-sm max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? '编辑规则' : '新增规则'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      关键词 <span className="text-destructive ml-0.5">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="多个关键词用英文逗号分隔"
                        className="rounded-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="replyContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      回复内容 <span className="text-destructive ml-0.5">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请输入自动回复内容"
                        rows={4}
                        className="rounded-sm resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-sm border border-border hover:bg-accent"
                  >
                    取消
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-primary-foreground rounded-sm"
                >
                  {submitting ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent className="rounded-sm max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除该关键词规则吗？删除后无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm border border-border hover:bg-accent">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground rounded-sm"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KeywordRulesPage;
