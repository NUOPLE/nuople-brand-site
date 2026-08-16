import { axiosForBackend } from '@client/src/api';
import type {
  KeywordRuleListResponse,
  KeywordRuleCreateRequest,
  KeywordRuleUpdateRequest,
  KeywordRuleMoveRequest,
  IdResponse,
  SuccessResponse,
} from '@shared/api.interface';

export const keywordRuleApi = {
  list: (): Promise<KeywordRuleListResponse> =>
    axiosForBackend.get('/api/keyword-rules').then((res) => res.data),

  create: (data: KeywordRuleCreateRequest): Promise<IdResponse> =>
    axiosForBackend.post('/api/keyword-rules', data).then((res) => res.data),

  update: (
    id: string,
    data: KeywordRuleUpdateRequest,
  ): Promise<SuccessResponse> =>
    axiosForBackend
      .put(`/api/keyword-rules/${id}`, data)
      .then((res) => res.data),

  remove: (id: string): Promise<SuccessResponse> =>
    axiosForBackend
      .delete(`/api/keyword-rules/${id}`)
      .then((res) => res.data),

  move: (
    id: string,
    direction: KeywordRuleMoveRequest['direction'],
  ): Promise<SuccessResponse> =>
    axiosForBackend
      .post(`/api/keyword-rules/${id}/move`, { direction })
      .then((res) => res.data),
};
