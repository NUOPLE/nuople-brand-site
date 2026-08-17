import { axiosForBackend } from './index';
import type {
  PublicWorkListItem,
  PublicWorkListResponse,
  PublicWorkDetail,
  PublicSiteSettings,
  PublicKeywordRulesResponse,
  PublicMessageSubmitRequest,
  PublicMessageSubmitResponse,
  PublicMessageDetail,
  PublicFeaturedWorksResponse,
} from '@shared/api.interface';

export const getFeaturedWorks = (
  limit = 5,
): Promise<PublicFeaturedWorksResponse> => {
  return axiosForBackend
    .get('/api/public/works/featured', { params: { limit } })
    .then((res) => res.data);
};

export const getPublicWorkList = (params: {
  page: number;
  pageSize: number;
  category?: string;
}): Promise<PublicWorkListResponse> => {
  return axiosForBackend
    .get('/api/public/works', { params })
    .then((res) => res.data);
};

export const getPublicWorkDetail = (id: string): Promise<PublicWorkDetail> => {
  return axiosForBackend
    .get(`/api/public/works/${id}`)
    .then((res) => res.data);
};

export const getNextWork = (id: string): Promise<PublicWorkListItem> => {
  return axiosForBackend
    .get(`/api/public/works/${id}/next`)
    .then((res) => res.data);
};

export const getPublicSiteSettings = (): Promise<PublicSiteSettings> => {
  return axiosForBackend
    .get('/api/public/site-settings')
    .then((res) => res.data);
};

export const getPublicKeywordRules = (): Promise<PublicKeywordRulesResponse> => {
  return axiosForBackend
    .get('/api/public/keyword-rules')
    .then((res) => res.data);
};

export const submitPublicMessage = (
  data: PublicMessageSubmitRequest,
): Promise<PublicMessageSubmitResponse> => {
  return axiosForBackend
    .post('/api/public/messages', data)
    .then((res) => res.data);
};

export const getPublicMessageDetail = (
  id: string,
): Promise<PublicMessageDetail> => {
  return axiosForBackend
    .get(`/api/public/messages/${id}`)
    .then((res) => res.data);
};
