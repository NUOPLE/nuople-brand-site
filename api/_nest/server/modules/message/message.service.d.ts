import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Message, MessageListResponse, MessageStatusFilter } from '@shared/api.interface';
export declare class MessageService {
    private readonly db;
    constructor(db: PostgresJsDatabase);
    getList(page: number, pageSize: number, status: MessageStatusFilter): Promise<MessageListResponse>;
    getById(id: string): Promise<Message>;
    updateReadStatus(id: string, isRead: boolean): Promise<void>;
    reply(id: string, replyContent: string): Promise<{
        repliedAt: string;
    }>;
    delete(id: string): Promise<void>;
}
