import { axiosForBackend } from './index';
import type {
  Message,
  MessageListResponse,
  MessageReadStatusRequest,
  MessageReplyRequest,
  MessageStatusFilter,
  SuccessResponse,
} from '@shared/api.interface';

export const getMessageList = async (params: {
  page: number;
  pageSize: number;
  status: MessageStatusFilter;
}): Promise<MessageListResponse> => {
  const res = await axiosForBackend.get<MessageListResponse>('/api/messages', {
    params,
  });
  return res.data;
};

export const getMessageById = async (id: string): Promise<Message> => {
  const res = await axiosForBackend.get<Message>(`/api/messages/${id}`);
  return res.data;
};

export const updateMessageReadStatus = async (
  id: string,
  isRead: boolean,
): Promise<SuccessResponse> => {
  const res = await axiosForBackend.patch<SuccessResponse>(
    `/api/messages/${id}/read-status`,
    { isRead } as MessageReadStatusRequest,
  );
  return res.data;
};

export const replyMessage = async (
  id: string,
  replyContent: string,
): Promise<SuccessResponse & { repliedAt: string }> => {
  const res = await axiosForBackend.post<
    SuccessResponse & { repliedAt: string }
  >(`/api/messages/${id}/reply`, { replyContent } as MessageReplyRequest);
  return res.data;
};

export const deleteMessage = async (id: string): Promise<SuccessResponse> => {
  const res = await axiosForBackend.delete<SuccessResponse>(
    `/api/messages/${id}`,
  );
  return res.data;
};
