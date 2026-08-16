import { axiosForBackend } from './index';
import type {
  Work,
  WorkListResponse,
  WorkCreateRequest,
  WorkUpdateRequest,
  IdResponse,
  SuccessResponse,
} from '@shared/api.interface';

export const getWorkList = (params: {
  page: number;
  pageSize: number;
  keyword?: string;
  category?: string;
}): Promise<WorkListResponse> => {
  return axiosForBackend
    .get('/api/works', { params })
    .then((res) => res.data);
};

export const getWorkById = (id: string): Promise<Work> => {
  return axiosForBackend.get(`/api/works/${id}`).then((res) => res.data);
};

export const createWork = (data: WorkCreateRequest): Promise<IdResponse> => {
  return axiosForBackend.post('/api/works', data).then((res) => res.data);
};

export const updateWork = (
  id: string,
  data: WorkUpdateRequest,
): Promise<SuccessResponse> => {
  return axiosForBackend
    .put(`/api/works/${id}`, data)
    .then((res) => res.data);
};

export const deleteWork = (id: string): Promise<SuccessResponse> => {
  return axiosForBackend
    .delete(`/api/works/${id}`)
    .then((res) => res.data);
};
