import { api } from '../lib/axios';

export type PostStatus  = 'draft' | 'published';
export type PostType    = 'article' | 'video' | 'audio';
export type EmbedType   = 'youtube' | 'spotify' | 'direct';
export type SpotifyType = 'track' | 'album' | 'playlist';

export interface ICategory {
    _id:          string;
    name:         string;
    slug:         string;
    description?: string;
    color?:       string;
    createdAt?:   string;
    updatedAt?:   string;
}

export interface IPostSection {
    id:        string;
    type:      'text' | 'image' | 'video' | 'audio';
    content?:  string;
    mediaUrl?: string;
    caption?:  string;
    order:     number;
}

export interface IMediaMeta {
    videoId?:       string;
    spotifyId?:     string;
    spotifyType?:   SpotifyType;
    episodeNumber?: number;
    trackList?:     { title: string; timestamp: number }[];
}

export interface IPost {
    _id:            string;
    title:          string;
    slug:           string;
    excerpt?:       string;
    type:           PostType;
    category:       ICategory;
    thumbnail?:     string;
    sections:       IPostSection[];
    mediaUrl?:      string;
    embedType?:     EmbedType;
    duration?:      number;
    mediaMeta?:     IMediaMeta;
    status:         PostStatus;
    featured:       boolean;
    pinnedTrending: boolean;
    trendingScore:  number;
    viewsCount:     number;
    readTime:       number;
    tags:           string[];
    author: {
        _id:      string;
        fullName: string;
        avatar?:  string;
        username: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface IPaginatedPosts {
    posts:       IPost[];
    total:       number;
    totalPages:  number;
    currentPage: number;
}

export interface IGetPostsParams {
    page?:     number;
    limit?:    number;
    category?: string;
    status?:   PostStatus;
    type?:     PostType;
    tags?:     string;
}

export interface ISearchPostsParams {
    q:         string;
    type?:     PostType;
    category?: string;
    page?:     number;
    limit?:    number;
}

export const postApi = {

    getCategories: async (): Promise<ICategory[]> => {
        const { data } = await api.get('/categories');
        return data.data;
    },

    createCategory: async (payload: {
        name:         string;
        description?: string;
        color?:       string;
    }): Promise<ICategory> => {
        const { data } = await api.post('/categories', payload);
        return data.data;
    },

    updateCategory: async (id: string, payload: Partial<ICategory>): Promise<ICategory> => {
        const { data } = await api.patch(`/categories/${id}`, payload);
        return data.data;
    },

    deleteCategory: async (id: string): Promise<{ status: string; message: string }> => {
        const { data } = await api.delete(`/categories/${id}`);
        return data;
    },

    getAllPosts: async (params?: IGetPostsParams): Promise<IPaginatedPosts> => {
        const { data } = await api.get('/posts', { params });
        return data.data;
    },

    searchPosts: async (params: ISearchPostsParams): Promise<IPaginatedPosts> => {
        const { data } = await api.get('/posts/search', { params });
        return data.data;
    },

    getPostBySlug: async (slug: string): Promise<IPost> => {
        const { data } = await api.get(`/posts/${slug}`);
        return data.data;
    },

    getFeaturedPosts: async (limit?: number): Promise<IPost[]> => {
        const { data } = await api.get('/posts/featured', { params: { limit } });
        return data.data;
    },

    getTrendingPosts: async (params?: { limit?: number; type?: PostType }): Promise<IPost[]> => {
        const { data } = await api.get('/posts/trending', { params });
        return data.data;
    },

    createPost: async (formData: FormData): Promise<IPost> => {
        const { data } = await api.post('/posts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data.data;
    },

    updatePost: async (id: string, formData: FormData): Promise<IPost> => {
        const { data } = await api.patch(`/posts/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data.data;
    },

    deletePost: async (id: string): Promise<{ status: string; message: string }> => {
        const { data } = await api.delete(`/posts/${id}`);
        return data;
    },

    toggleFeatured: async (id: string): Promise<IPost> => {
        const { data } = await api.patch(`/posts/${id}/feature`);
        return data.data;
    },

    toggleTrending: async (id: string): Promise<IPost> => {
        const { data } = await api.patch(`/posts/${id}/pin-trending`);
        return data.data;
    },
};