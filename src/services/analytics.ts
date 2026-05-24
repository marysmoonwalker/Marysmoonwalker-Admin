import { api } from '../lib/axios';

export type Period   = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type UserRole = 'user' | 'admin';

export interface IOverview {
    totalPosts:         number;
    totalPublished:     number;
    totalDrafts:        number;
    totalViews:         number;
    totalUsers:         number;
    totalVerifiedUsers: number;
    totalForumThreads:  number;
    totalForumReplies:  number;
}

export interface IViewsChartBucket {
    date:     string;
    total:    number;
    loggedIn: number;
    guests:   number;
}

export interface IViewsChart {
    period: Period;
    data:   IViewsChartBucket[];
}

export interface IUserGrowthBucket {
    date:       string;
    total:      number;
    verified:   number;
    unverified: number;
}

export interface IUserGrowth {
    period: Period;
    data:   IUserGrowthBucket[];
}

export interface IContentByType {
    type:  'article' | 'video' | 'audio';
    count: number;
}

export interface IContentByStatus {
    status: 'published' | 'draft';
    count:  number;
}

export interface IContentBreakdown {
    byType:   IContentByType[];
    byStatus: IContentByStatus[];
}

export interface ITopPost {
    _id:           string;
    title:         string;
    slug:          string;
    thumbnail?:    string;
    type:          'article' | 'video' | 'audio';
    trendingScore: number;
    views:         number;
}

export interface IForumActivityBucket {
    date:    string;
    threads: number;
    replies: number;
}

export interface IForumCategoryBucket {
    category: string;
    count:    number;
}

export interface IForumStats {
    period:     Period;
    activity:   IForumActivityBucket[];
    byCategory: IForumCategoryBucket[];
}

export interface IAdminUser {
    _id:             string;
    fullName:        string;
    username:        string;
    email:           string;
    avatar:          string;
    avatarPublicId?: string | null;
    role:            UserRole;
    bio?:            string;
    isVerified:      boolean;
    createdAt:       string;
    updatedAt:       string;

    country?:  string;
    city?:     string;
}

export interface IPaginatedUsers {
    users:      IAdminUser[];
    pagination: {
        total:      number;
        page:       number;
        limit:      number;
        totalPages: number;
        hasMore:    boolean;
    };
}

export interface IGetUsersParams {
    page?:       number;
    limit?:      number;
    search?:     string;
    role?:       UserRole;
    isVerified?: boolean;
}

export interface IVisitorStatBucket {
    date:   string;
    hits:   number;
    unique: number;
}

export interface IVisitorStats {
    period:       Period;
    totalAllTime: number;
    data:         IVisitorStatBucket[];
}

export interface IVisitorCountryBucket {
    country: string;
    hits:    number;
    unique:  number;
}

export interface IVisitorsByCountry {
    period: Period;
    data:   IVisitorCountryBucket[];
}

export interface IUserCountryBucket {
    country: string;
    count:   number;
}

export interface IUsersByCountry {
    data: IUserCountryBucket[];
}

export const analyticsApi = {

    /** Returns platform-wide KPI totals for the analytics overview cards. */
    getOverview: async (): Promise<IOverview> => {
        const { data } = await api.get('/analytics/overview');
        return data.data;
    },

    /** Returns view counts bucketed by the requested period with guest vs logged-in split. */
    getViewsChart: async (period: Period = 'daily'): Promise<IViewsChart> => {
        const { data } = await api.get('/analytics/views', { params: { period } });
        return data.data;
    },

    /** Returns new user registrations bucketed by the requested period split into verified and unverified. */
    getUserGrowth: async (period: Period = 'daily'): Promise<IUserGrowth> => {
        const { data } = await api.get('/analytics/user-growth', { params: { period } });
        return data.data;
    },

    /** Returns the number of posts grouped by content type and publication status. */
    getContentBreakdown: async (): Promise<IContentBreakdown> => {
        const { data } = await api.get('/analytics/content');
        return data.data;
    },

    /** Returns the top 10 published posts ranked by total view count. */
    getTopPosts: async (): Promise<ITopPost[]> => {
        const { data } = await api.get('/analytics/top-posts');
        return data.data;
    },

    /** Returns forum activity bucketed by the requested period plus a breakdown by forum category. */
    getForumStats: async (period: Period = 'daily'): Promise<IForumStats> => {
        const { data } = await api.get('/analytics/forum', { params: { period } });
        return data.data;
    },

    /** Returns a paginated list of all registered users. Supports search, role, and verified status filters. */
    getAllUsers: async (params?: IGetUsersParams): Promise<IPaginatedUsers> => {
        const { data } = await api.get('/users', { params });
        return data.data;
    },

    /** Permanently deletes a user account by ID. Admin only. */
    deleteUser: async (userId: string): Promise<{ status: string; message: string }> => {
        const { data } = await api.delete(`/users/${userId}`);
        return data;
    },

    /** Updates the role of a user account between user and admin. Admin only. */
    updateUserRole: async (userId: string, role: UserRole): Promise<IAdminUser> => {
        const { data } = await api.patch(`/users/${userId}/role`, { role });
        return data.data;
    },

    /** Returns total hits and unique visitor counts bucketed by the requested period. */
    getVisitorStats: async (period: Period = 'daily'): Promise<IVisitorStats> => {
        const { data } = await api.get('/analytics/visitors/stats', { params: { period } });
        return data.data;
    },

    /** Returns visitor counts grouped by country for the requested period. */
    getVisitorsByCountry: async (period: Period = 'monthly'): Promise<IVisitorsByCountry> => {
        const { data } = await api.get('/analytics/visitors/countries', { params: { period } });
        return data.data;
    },

    /** Returns registered user counts grouped by country. */
    getUsersByCountry: async (): Promise<IUsersByCountry> => {
        const { data } = await api.get('/analytics/users/countries');
        return data.data;
    },

};