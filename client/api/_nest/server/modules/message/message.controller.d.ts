import { MessageService } from './message.service';
import type { Message, MessageListResponse, MessageReadStatusRequest, MessageReplyRequest, MessageStatusFilter, SuccessResponse } from '@shared/api.interface';
export declare class MessageController {
    private readonly messageService;
    constructor(messageService: MessageService);
    getList(page?: string, pageSize?: string, status?: MessageStatusFilter): Promise<MessageListResponse>;
    getById(id: string): Promise<Message>;
    updateReadStatus(id: string, body: MessageReadStatusRequest): Promise<SuccessResponse>;
    reply(id: string, body: MessageReplyRequest): Promise<SuccessResponse & {
        repliedAt: string;
    }>;
    delete(id: string): Promise<SuccessResponse>;
}
