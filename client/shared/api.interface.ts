// 认证相关类型

export interface Admin {
  id: string;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  username: string;
}

export interface CurrentAdminResponse {
  id: string;
  username: string;
}

// 作品相关类型

export type WorkCategory = 'logo' | 'vis' | 'packaging';

export interface GalleryImage {
  url: string;
  layout: 'full' | 'side-by-side';
}

export interface Work {
  id: string;
  title: string;
  category: WorkCategory;
  client: string;
  industry: string;
  designType: string;
  year: string;
  description: string;
  tags: string[];
  content: string;
  coverImage: string;
  heroImage: string;
  gallery: GalleryImage[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkListItem {
  id: string;
  title: string;
  category: WorkCategory;
  client: string;
  year: string;
  coverImage: string;
}

export interface WorkListResponse {
  items: WorkListItem[];
  total: number;
}

export interface WorkCreateRequest {
  title: string;
  category: WorkCategory;
  client: string;
  industry: string;
  designType: string;
  year: string;
  description: string;
  tags: string[];
  content: string;
  coverImage: string;
  heroImage: string;
  gallery: GalleryImage[];
}

export type WorkUpdateRequest = WorkCreateRequest;

// 留言相关类型

export interface Message {
  id: string;
  name: string;
  email: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  replyContent: string | null;
  repliedAt: string | null;
}

export interface MessageListItem {
  id: string;
  name: string;
  email: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  hasReply: boolean;
}

export interface MessageListResponse {
  items: MessageListItem[];
  total: number;
  totalUnread: number;
}

export type MessageStatusFilter = 'all' | 'unread' | 'read';

export interface MessageReplyRequest {
  replyContent: string;
}

export interface MessageReadStatusRequest {
  isRead: boolean;
}

// 关键词规则相关类型

export interface KeywordRule {
  id: string;
  keywords: string[];
  replyContent: string;
  sortOrder: number;
}

export interface KeywordRuleListResponse {
  items: KeywordRule[];
}

export interface KeywordRuleCreateRequest {
  keywords: string[];
  replyContent: string;
}

export type KeywordRuleUpdateRequest = KeywordRuleCreateRequest;

export interface KeywordRuleMoveRequest {
  direction: 'up' | 'down';
}

// 网站设置相关类型

export interface SiteSettings {
  siteTitle: string;
  companyName: string;
  logoImage: string;
  heroSlogan: string;
  heroSubtitle: string;
  aboutUs: string;
  services: ServiceItem[];
  designProcess: ProcessStep[];
  contact: ContactInfo;
  footer: FooterInfo;
}

export interface ServiceItem {
  title: string;
  description: string;
}

export interface ProcessStep {
  title: string;
  description: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
}

export interface FooterInfo {
  copyright: string;
  socialLinks: string;
}

// 仪表盘相关类型

export interface DashboardStats {
  totalWorks: number;
  totalMessages: number;
  unreadMessages: number;
  totalKeywordRules: number;
  recentMessages: RecentMessage[];
  categoryStats: CategoryStat[];
}

export interface RecentMessage {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface CategoryStat {
  category: string;
  count: number;
}

// 通用响应

export interface SuccessResponse {
  success: boolean;
}

export interface IdResponse {
  id: string;
}

// 前台公开API相关类型

export interface PublicWorkListItem {
  id: string;
  title: string;
  category: WorkCategory;
  client: string;
  year: string;
  description: string;
  coverImage: string;
  tags: string[];
}

export interface PublicWorkListResponse {
  items: PublicWorkListItem[];
  total: number;
}

export interface PublicWorkDetail {
  id: string;
  title: string;
  category: WorkCategory;
  client: string;
  industry: string;
  designType: string;
  year: string;
  description: string;
  tags: string[];
  content: string;
  coverImage: string;
  heroImage: string;
  gallery: GalleryImage[];
  createdAt: string;
}

export interface PublicSiteSettings {
  siteTitle: string;
  companyName: string;
  logoImage: string;
  heroSlogan: string;
  heroSubtitle: string;
  aboutUs: string;
  services: ServiceItem[];
  designProcess: ProcessStep[];
  contact: ContactInfo;
  footer: FooterInfo;
}

export interface PublicKeywordRule {
  id: string;
  keywords: string[];
  replyContent: string;
}

export interface PublicKeywordRulesResponse {
  items: PublicKeywordRule[];
}

export interface PublicMessageSubmitRequest {
  name: string;
  email: string;
  content: string;
}

export interface PublicMessageSubmitResponse {
  success: boolean;
  id: string;
}

export interface PublicFeaturedWorksResponse {
  items: PublicWorkListItem[];
}
