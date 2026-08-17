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
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_COUNT = 30;
const STORAGE_KEY = 'chat_message_id';
const STORAGE_REPLIED_KEY = 'chat_message_replied';
const STORAGE_HISTORY_KEY = 'chat_history';
const STORAGE_UNMATCHED_KEY = 'chat_unmatched_count';

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
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [polling, setPolling] = useState(false);
  const [showNewMsgHint, setShowNewMsgHint] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const pendingMessageIdRef = useRef<string | null>(null);
  const shownReplyMsgIdRef = useRef<string | null>(null);
  const isAtBottomRef = useRef(true);

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
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowNewMsgHint(false);
    } else {
      setShowNewMsgHint(true);
    }
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distanceFromBottom < 20;
    if (isAtBottomRef.current) {
      setShowNewMsgHint(false);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewMsgHint(false);
    isAtBottomRef.current = true;
  }, []);

  const userMessageCount = messages.filter((m) => m.type === 'user').length;

  const matchReply = (text: string): { reply: string; matched: boolean } => {
    const lowerText = text.toLowerCase();
    for (const rule of rules) {
      for (const keyword of rule.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          logger.info(`[ChatWidget] keyword HIT: "${keyword}" -> reply="${rule.replyContent.slice(0, 30)}..."`);
          return { reply: rule.replyContent, matched: true };
        }
      }
    }
    logger.info('[ChatWidget] keyword MISS: no rule matched user input');
    return { reply: '抱歉，我暂时无法回答您的问题。您可以尝试输入其他关键词，或点击下方「转人工客服」按钮，我们的工作人员会为您解答。', matched: false };
  };

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  const showHumanReply = useCallback((replyContent: string, replyId?: string) => {
    const dedupKey = replyId || replyContent;
    if (shownReplyMsgIdRef.current === dedupKey) {
      logger.info('[ChatWidget] human reply DUPLICATE skipped:', dedupKey.slice(0, 30));
      return;
    }
    shownReplyMsgIdRef.current = dedupKey;
    const replyMsg = makeBotMsg(`【人工客服】${replyContent}`, 'human');
    setMessages((prev) => [...prev, replyMsg]);
    logger.info('[ChatWidget] human reply shown:', replyContent.slice(0, 50));
  }, []);

  const pollReply = useCallback(async (messageId: string) => {
    logger.info(`[ChatWidget] poll result: pollCount=${pollCountRef.current}`);
    try {
      const detail: PublicMessageDetail = await getPublicMessageDetail(messageId);
      logger.info(`[ChatWidget] API response: ${JSON.stringify(detail)}`);
      const hasReply = Boolean(detail.replyContent);
      logger.info(`[ChatWidget] poll result: hasReply=${hasReply}`);
       if (detail.replyContent) {
         logger.info('[ChatWidget] pollReply: reply found, stopping poll');
         clearPollTimer();
         pendingMessageIdRef.current = null;
         setPolling(false);
         showHumanReply(detail.replyContent, messageId);
         try {
           localStorage.setItem(
             STORAGE_REPLIED_KEY,
             JSON.stringify({ id: messageId, replyContent: detail.replyContent, repliedAt: detail.repliedAt, time: Date.now() }),
           );
           localStorage.removeItem(STORAGE_KEY);
           logger.info('[ChatWidget] saved reply to localStorage, cleared message id');

           setMessages((prev) => {
             const replyMsg = makeBotMsg(`【人工客服】${detail.replyContent}`, 'human');
             const hasHumanReply = prev.some((m: ChatMessage) => m.source === 'human');
             if (hasHumanReply) {
               logger.info('[ChatWidget] chat_history already has human reply, skip append');
               return prev;
             }
             const updatedHistory = [...prev, replyMsg];
             localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
             logger.info(`[ChatWidget] chat_history updated with reply, total=${updatedHistory.length}`);
             return updatedHistory;
           });
         } catch (storageErr) {
           logger.error('[ChatWidget] save reply to localStorage FAILED:', String(storageErr));
         }
         return;
       }
    } catch (err: unknown) {
      logger.error('[ChatWidget] pollReply FAILED:', String(err));
    }

    pollCountRef.current += 1;
    if (pollCountRef.current >= POLL_MAX_COUNT) {
      logger.info('[ChatWidget] poll max count reached, stopping');
      clearPollTimer();
      setPolling(false);
    }
  }, [clearPollTimer, showHumanReply]);

  const startPolling = useCallback((messageId: string) => {
    if (pollTimerRef.current) {
      logger.warn('[ChatWidget] startPolling: existing timer found, clearing first');
    }
    if (pendingMessageIdRef.current === messageId) {
      logger.info(`[ChatWidget] startPolling: already polling ${messageId}, skip`);
      return;
    }
    logger.info(`[ChatWidget] polling started for id: ${messageId}`);
    clearPollTimer();
    pendingMessageIdRef.current = messageId;
    pollCountRef.current = 0;
    setPolling(true);
    pollReply(messageId);
    pollTimerRef.current = setInterval(() => {
      pollReply(messageId);
    }, POLL_INTERVAL_MS);
  }, [clearPollTimer, pollReply]);

  const restoreHistoryFromStorage = useCallback((): ChatMessage[] => {
    try {
      const historyRaw = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (historyRaw) {
        const parsed = JSON.parse(historyRaw) as ChatMessage[];
        logger.info(`[ChatWidget] restored ${parsed.length} messages from chat_history`);
        return parsed;
      }
      logger.info('[ChatWidget] no chat_history in localStorage');
    } catch (err) {
      logger.error('[ChatWidget] restore chat_history failed:', String(err));
    }
    return [];
  }, []);

  const restoreFromStorage = useCallback(() => {
    try {
      const pendingId = localStorage.getItem(STORAGE_KEY);
      const repliedRaw = localStorage.getItem(STORAGE_REPLIED_KEY);

      logger.info(`[ChatWidget] found message id in localStorage: ${pendingId || 'none'}`);
      if (!pendingId) {
        logger.info('[ChatWidget] no message id in localStorage');
      }

      const history = restoreHistoryFromStorage();
      const hasHumanReplyInHistory = history.some((m) => m.source === 'human');

      let repliedInfo: { id: string; replyContent: string; repliedAt?: string } | null = null;
      if (repliedRaw) {
        try {
          repliedInfo = JSON.parse(repliedRaw) as { id: string; replyContent: string; repliedAt?: string };
          logger.info(`[ChatWidget] restore replied info: id=${repliedInfo.id}`);
        } catch {
          repliedInfo = null;
        }
      }

      let finalHistory = history;

      if (repliedInfo && !hasHumanReplyInHistory) {
        const replyMsg: ChatMessage = {
          id: `b-restored-${repliedInfo.id}`,
          type: 'bot',
          content: `【人工客服】${repliedInfo.replyContent}`,
          time: repliedInfo.repliedAt ? new Date(repliedInfo.repliedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '',
          source: 'human',
        };
        finalHistory = [...finalHistory, replyMsg];
        logger.info('[ChatWidget] appended restored human reply to history');
      }

      if (finalHistory.length > 0) {
        setMessages(finalHistory);
      }

      if (repliedInfo) {
        shownReplyMsgIdRef.current = repliedInfo.id;
        logger.info(`[ChatWidget] set shownReplyMsgIdRef=${repliedInfo.id}`);
      }

      if (pendingId && !repliedInfo) {
        logger.info(`[ChatWidget] restore pending message: ${pendingId}`);
        startPolling(pendingId);
      } else if (pendingId && repliedInfo) {
        logger.info('[ChatWidget] already replied, skip polling on restore');
        localStorage.removeItem(STORAGE_KEY);
      }

      try {
        const unmatchedRaw = localStorage.getItem(STORAGE_UNMATCHED_KEY);
        if (unmatchedRaw) {
          const saved = parseInt(unmatchedRaw, 10);
          if (!Number.isNaN(saved)) {
            setUnmatchedCount(saved);
            logger.info(`[ChatWidget] restored unmatchedCount=${saved}`);
          }
        }
      } catch {
        // ignore
      }
    } catch (err) {
      logger.error('[ChatWidget] restoreFromStorage failed:', String(err));
    }
  }, [restoreHistoryFromStorage, startPolling]);

  useEffect(() => {
    if (open) {
      shownReplyMsgIdRef.current = null;
      isAtBottomRef.current = true;
      setShowNewMsgHint(false);
      restoreFromStorage();
    }
    return () => {
      clearPollTimer();
      pendingMessageIdRef.current = null;
      shownReplyMsgIdRef.current = null;
    };
  }, [open, clearPollTimer, restoreFromStorage]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    logger.info(`[ChatWidget] handleSend: user input="${text}" rulesCount=${rules.length}`);

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
    logger.info(`[ChatWidget] newUserCount=${newUserCount} hitHumanKeyword=${hitHumanKeyword} threshold=${TRANSFER_TRIGGER_COUNT}`);

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    setTimeout(() => {
     const botMessages: ChatMessage[] = [];
     let matched = false;

     if (hitHumanKeyword) {
       matched = false;
       botMessages.push(
         makeBotMsg('好的，正在为您转接人工客服，请点击下方按钮提交您的问题。'),
       );
     } else {
       const { reply, matched: isMatched } = matchReply(text);
       matched = isMatched;
       logger.info(`[ChatWidget] keyword match result: matched=${matched} replyPreview=${reply.slice(0, 30)}`);
       botMessages.push(makeBotMsg(reply, matched ? 'keyword' : undefined));

       if (!matched && unmatchedCount + 1 >= TRANSFER_TRIGGER_COUNT) {
         botMessages.push(
           makeBotMsg('您的问题可能需要人工解答，是否需要转人工客服？点击下方按钮即可提交您的问题。'),
         );
       }
     }

      setMessages((prev) => [...prev, ...botMessages]);
      setSending(false);

       const newUnmatched = hitHumanKeyword
         ? unmatchedCount
         : matched
         ? 0
         : unmatchedCount + 1;
       logger.info(`[ChatWidget] unmatchedCount was=${unmatchedCount} now=${newUnmatched} threshold=${TRANSFER_TRIGGER_COUNT}`);
       setUnmatchedCount(newUnmatched);
       try {
         localStorage.setItem(STORAGE_UNMATCHED_KEY, String(newUnmatched));
       } catch {
         // ignore
       }

       const shouldShowTransfer =
         hitHumanKeyword || (newUnmatched >= TRANSFER_TRIGGER_COUNT);
       logger.info(`[ChatWidget] shouldShowTransferButton=${shouldShowTransfer} (hitHuman=${hitHumanKeyword}, unmatched=${newUnmatched}/${TRANSFER_TRIGGER_COUNT})`);
       if (shouldShowTransfer) {
         setShowTransferButton(true);
       }
    }, 600);
  };

  const handleTransferToHuman = async () => {
    const userMessages = messages.filter((m) => m.type === 'user');
    logger.info(`[ChatWidget] [TRANSFER] button CLICKED, userMessages=${userMessages.length}, transferring=${transferring}`);

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
    logger.info(`[ChatWidget] [TRANSFER] before API call: POST /api/public/messages`);

    try {
      const result = await submitPublicMessage(payload);
      logger.info(`[ChatWidget] [TRANSFER] API SUCCESS, id=${result.id}`);
      setMessages((prev) => [...prev, makeBotMsg('感谢您的留言，我们的工作人员会尽快回复您。')]);
      setShowTransferButton(false);

      try {
        localStorage.setItem(STORAGE_KEY, result.id);
        logger.info(`[ChatWidget] saved message id: ${result.id}`);
      } catch (storageErr) {
        logger.error('[ChatWidget] save message id FAILED:', String(storageErr));
      }

      try {
        const userMsgs = messages.filter((m: ChatMessage) => m.type === 'user');
        const allMsgs = [...messages, makeBotMsg('感谢您的留言，我们的工作人员会尽快回复您。')];
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(allMsgs));
        logger.info(`[ChatWidget] saved chat_history: ${allMsgs.length} messages (${userMsgs.length} user)`);
      } catch (storageErr) {
        logger.error('[ChatWidget] save chat_history FAILED:', String(storageErr));
      }

      startPolling(result.id);
     } catch (err: unknown) {
       const msg = err instanceof Error ? err.message : String(err);
       logger.error('[ChatWidget] [TRANSFER] API FAILED:', msg);
       if (err instanceof Error && err.stack) {
         logger.error('[ChatWidget] [TRANSFER] error stack:', err.stack);
       }
       setMessages((prev) => [...prev, makeBotMsg('留言提交失败，请稍后重试。')]);
     } finally {
       setTransferring(false);
       logger.info('[ChatWidget] [TRANSFER] done, transferring=false');
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

           <div ref={scrollContainerRef} onScroll={handleScroll} className="relative flex-1 h-80 overflow-y-auto p-4 bg-gray-50 space-y-3">
             {showNewMsgHint && (
               <button
                 onClick={scrollToBottom}
                 className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 text-xs bg-black/80 text-white rounded-full shadow-md hover:bg-black"
               >
                 有新消息 ↓
               </button>
             )}
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
                  } ${msg.source === 'human' ? 'animate-fade-in' : ''}`}
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
            {polling && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[80%] px-3 py-2 text-xs text-black/50 bg-white/60 border border-dashed border-black/10">
                  正在等待人工客服回复...
                </div>
              </div>
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
