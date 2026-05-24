import { api } from '../lib/axios';

export interface ISubscriber {
    _id: string;
    email: string;
    createdAt: string;
}

export interface IContactMessage {
    _id: string;
    name: string;
    email: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export interface ISubscribersResponse {
    status: string;
    data: {
        total: number;
        subscribers: ISubscriber[];
    };
}

export interface IContactMessagesResponse {
    status: string;
    data: {
        total: number;
        messages: IContactMessage[];
    };
}

export const outreachApi = {
    // GET /api/v1/outreach/admin/subscribers
    getSubscribers: async (): Promise<ISubscribersResponse> => {
        const response = await api.get<ISubscribersResponse>('/outreach/admin/subscribers');
        return response.data;
    },

    // GET /api/v1/outreach/admin/contact-messages?read=true|false
    getContactMessages: async (readFilter?: 'true' | 'false'): Promise<IContactMessagesResponse> => {
        const url = readFilter 
            ? `/outreach/admin/contact-messages?read=${readFilter}`
            : '/outreach/admin/contact-messages';
        const response = await api.get<IContactMessagesResponse>(url);
        return response.data;
    },

    // PATCH /api/v1/outreach/admin/contact-messages/:id/read
    markAsRead: async (id: string): Promise<void> => {
        await api.patch(`/outreach/admin/contact-messages/${id}/read`);
    }
};