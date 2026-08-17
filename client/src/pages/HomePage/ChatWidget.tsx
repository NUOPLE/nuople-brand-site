import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, UserCheck } from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import {
  getPublicKeywordRules,
  submitPublicMessage,
  getPublicMessageDetail,
} from '@client/src/api/public';
import type { PublicKeywordRule, PublicMessageDetail } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  time: string;
  source?: 'keyword' | 'human';
}

const TRANSFER_TRIGGER_COUNT = 5;
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_COUNT = 12;
const STORAGE_KEY = 'chat_message_id';
const STORAGE_REPLIED_KEY = 'chat_message_replied';

const containsHumanKeyword = (text: string): boolean => {
  const lower = text.toLowerCase();
  return lower.includes('人工客服') || lower.includes('转人工') || lower.includes('人工');
};

const makeBotMsg = (content: string, source?: ChatMessage['source']): ChatMessage => ({
  id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  type: 'bot',
  content,
  time: new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }),
  source,
});

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState<PublicKeywordRule[]>([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [showTransferButton, setShowTransferButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const pendingMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const data = await getPublicKeywordRules();
        setRules(data.items);
      } catch (err) {
        logger.error('fetch keyword rules failed', String(err));
      }
    };
    fetchRules();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const userMessageCount = messages.filter((m) => m.type === 'user').length;

  const matchReply = (text: string): string => {
    const lowerText = text.toLowerCase();
    for (const rule of rules) {
      for (const keyword of rule.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return rule.replyContent;
        }
      }
    }
    return '感谢您的留言，我们的工作人员会尽快回复您。';
  };

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  const showHumanReply = useCallback((replyContent: string) => {
    const replyMsg = makeBotMsg(`【人工客服】${replyContent}`, 'human');
    setMessages((prev) => [...prev, replyMsg]);
  }, []);

  const pollReply = useCallback(async (messageId: string) => {
    try {
      const detail: PublicMessageDetail = await getPublicMessageDetail(messageId);
      logger.info('[ChatWidget] pollReply result:', JSON.stringify(detail));
      if (detail.replyContent) {
        clearPollTimer();
        pendingMessageIdRef.current = null;
        showHumanReply(detail.replyContent);
        try {
          localStorage.setItem(
            STORAGE_REPLIED_KEY,
            JSON.stringify({ id: messageId, replyContent: detail.replyContent, repliedAt: detail.repliedAt }),
          );
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore storage errors
        }
      }
    } catch (err: unknown) {
      logger.error('[ChatWidget] pollReply FAILED:', String(err));
    }

    pollCountRef.current += 1;
    if (pollCountRef.current >= POLL_MAX_COUNT) {
      clearPollTimer();
    }
  }, [clearPollTimer, showHumanReply]);

  const startPolling = useCallback((messageId: string) => {
    clearPollTimer();
    pendingMessageIdRef.current = messageId;
    pollCountRef.current = 0;
    pollReply(messageId);
    pollTimerRef.current = setInterval(() => {
      pollReply(messageId);
    }, POLL_INTERVAL_MS);
  }, [clearPollTimer, pollReply]);

  const restoreFromStorage = useCallback(() => {
    try {
      const pendingId = localStorage.getItem(STORAGE_KEY);
      const repliedRaw = localStorage.getItem(STORAGE_REPLIED_KEY);

      if (pendingId) {
        logger.info(`[ChatWidget] restore pending message: ${pendingId}`);
        startPolling(pendingId);
        return;
      }

      if (repliedRaw) {
        const parsed = JSON.parse(repliedRaw) as { id: string; replyContent: string; repliedAt?: string };
        logger.info(`[ChatWidget] restore replied message: ${parsed.id}`);
        showHumanReply(parsed.replyContent);
      }
    } catch (err) {
      logger.error('[ChatWidget] restoreFromStorage failed:', String(err));
    }
  }, [showHumanReply, startPolling]);

  useEffect(() => {
    if (open) {
      restoreFromStorage();
    }
    return () => {
      clearPollTimer();
    };
  }, [open, clearPollTimer, restoreFromStorage]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'user',
      content: text,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const newUserCount = userMessageCount + 1;
    const hitHumanKeyword = containsHumanKeyword(text);

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    setTimeout(() => {
      const botMessages: ChatMessage[] = [];

      if (hitHumanKeyword) {
        botMessages.push(
          makeBotMsg('好的，正在为您转接人工客服，请点击下方按钮提交您的问题。'),
        );
      } else {
        const reply = matchReply(text);
        botMessages.push(makeBotMsg(reply, 'keyword'));

        if (newUserCount === TRANSFER_TRIGGER_COUNT) {
          botMessages.push(
            makeBotMsg('您的问题可能需要人工解答，是否需要转人工客服？'),
          );
        }
      }

      setMessages((prev) => [...prev, ...botMessages]);
      setSending(false);

      if (hitHumanKeyword || newUserCount >= TRANSFER_TRIGGER_COUNT) {
        setShowTransferButton(true);
      }
    }, 600);
  };

  const handleTransferToHuman = async () => {
    const userMessages = messages.filter((m) => m.type === 'user');
    logger.info('[ChatWidget] handleTransferToHuman called, userMessages count:', String(userMessages.length));

    if (userMessages.length === 0) {
      setMessages((prev) => [...prev, makeBotMsg('请先输入您的问题，再点击「转人工」，我们的工作人员会尽快回复您。')]);
      return;
    }

    if (transferring) {
      logger.info('[ChatWidget] already transferring, skip');
      return;
    }
    setTransferring(true);

    const content = userMessages.map((m: ChatMessage) => `【用户】${m.content}`).join('\n');
    const payload = {
      name: '访客',
      email: 'chat@nuople.cn',
      content,
    };
    logger.info('[ChatWidget] submit message payload:', JSON.stringify(payload));

    try {
      const result = await submitPublicMessage(payload);
      logger.info('[ChatWidget] submit success:', JSON.stringify(result));
      setMessages((prev) => [...prev, makeBotMsg('感谢您的留言，我们的工作人员会尽快回复您。')]);
      setShowTransferButton(false);

      try {
        localStorage.setItem(STORAGE_KEY, result.id);
      } catch {
        // ignore storage errors
      }

      startPolling(result.id);
    } catch (err: unknown) {
      logger.error('[ChatWidget] submit FAILED:', String(err));
      logger.error('[ChatWidget] error message:', String(err instanceof Error ? err.message : String(err)));
      logger.error('[ChatWidget] error stack:', String(err instanceof Error ? err.stack : 'no stack'));
      logger.error('transfer to human failed', String(err));
      setMessages((prev) => [...prev, makeBotMsg('留言提交失败，请稍后重试。')]);
    } finally {
      setTransferring(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 size-14 bg-black text-white rounded-full shadow-lg hover:bg-black/80 transition-all flex items-center justify-center"
        aria-label="在线客服"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white border border-black/10 shadow-xl flex flex-col overflow-hidden">
          <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">智能客服</p>
              <p className="text-xs text-white/60">在线</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 h-80 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-black/50">
                  您好，请问有什么可以帮助您的？
                </p>
                <p className="text-xs text-black/30 mt-2">
                  试试输入关键词：logo、服务、价格...
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 text-sm ${
                      msg.type === 'user'
                        ? 'bg-black text-white'
                        : 'bg-white border border-black/10 text-black'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {showTransferButton && (
            <div className="px-3 py-2 border-t border-black/10 flex justify-center bg-gray-50">
              <button
                onClick={handleTransferToHuman}
                disabled={transferring}
                className="flex items-center gap-1.5 text-xs text-black/60 hover:text-black transition-colors disabled:opacity-50"
              >
                <UserCheck className="size-3.5" />
                {transferring ? '提交中...' : '转人工客服'}
              </button>
            </div>
          )}

          <div className="p-3 border-t border-black/10 flex items-center gap-2">
            <input
              type="text"
              value={input}
              placeholder="输入消息..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              className="flex-1 h-9 px-3 text-sm border border-black/10 focus:outline-none focus:border-black/30"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="h-9 w-9 p-0 flex items-center justify-center bg-black text-white hover:bg-black/80"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
