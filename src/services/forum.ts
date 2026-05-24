import { api } from '../lib/axios';

export interface IForumAuthor {
  _id: string;
  fullName: string;
  username: string;
  avatar: string;
}

export interface IForumThread {
  _id: string;
  title: string;
  body: string;
  excerpt: string;
  category: string;
  author: IForumAuthor;
  replyCount: number;
  viewCount: number;
  pinned: boolean;
  hot: boolean;
  isDeleted: boolean;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IForumReply {
  _id: string;
  thread: string;
  author: IForumAuthor;
  body: string;
  imageUrl?: string;
  likes: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetThreadsParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedThreads {
  threads: IForumThread[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasMore: boolean;
  };
}

export const forumService = {
  getThreads: async (params?: GetThreadsParams): Promise<PaginatedThreads> => {
    const response = await api.get('/forum', { params });
    return response.data.data;
  },

  getThreadDetails: async (id: string): Promise<{ thread: IForumThread; replies: IForumReply[] }> => {
    const response = await api.get(`/forum/${id}`);
    return response.data.data;
  },

  createThread: async (data: { title: string; body: string; category: string }): Promise<IForumThread> => {
    const response = await api.post('/forum', data);
    return response.data.data;
  },

  addReply: async (threadId: string, body: string, file?: File): Promise<IForumReply> => {
    const formData = new FormData();
    formData.append('body', body);
    if (file) formData.append('image', file);
    const response = await api.post(`/forum/${threadId}/replies`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  },

  toggleReplyLike: async (replyId: string): Promise<{ likes: number; liked: boolean }> => {
    const response = await api.patch(`/forum/replies/${replyId}/like`);
    return response.data.data;
  },

  togglePinThread: async (id: string): Promise<IForumThread> => {
    const response = await api.patch(`/forum/${id}/pin`);
    return response.data.data;
  },

  toggleHotThread: async (id: string): Promise<IForumThread> => {
    const response = await api.patch(`/forum/${id}/hot`);
    return response.data.data;
  },

  deleteThread: async (id: string): Promise<void> => {
    await api.delete(`/forum/${id}`);
  },

  deleteReply: async (id: string): Promise<void> => {
    await api.delete(`/forum/replies/${id}`);
  }
};