// API Base URLs
export const MOCK_API_URL = 'http://localhost:4000';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || MOCK_API_URL;

// Backend API Endpoints
export const ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: '/api/Account/login-with-email',
        UPDATE_PROFILE: '/api/Account/update-profile',
    },

    // Admin Endpoints
    ADMIN: {
        GET_ALL_USERS: '/api/Account/admin/get-all-users',
        GET_CONSULTANT_BY_ID: '/api/Account/get-user/consultant-byid',
        GET_USER_BY_ID: '/api/Account/get-user/user-byid',
        GET_ALL_CATEGORIES: '/api/Category/get-all-categories',
        TOGGLE_CATEGORY_STATUS: '/api/Category/toggle-status-category',
        UPDATE_CATEGORY: '/api/Category/update-category-with-subcategories',
        CREATE_CATEGORY: '/api/Category/create-category-with-subcategories',
        GET_ACTIVE_SESSIONS: '/api/chat/test/admin/active-sessions',
        GET_ALL_TRANSACTIONS: '/api/Payment/admin/all-transactions',
        GET_ALL_WITHDRAWALS: '/api/Payment/admin/all-withdrawals',
        GET_WITHDRAWAL_DETAILS: '/api/Payment/admin/withdrawals/',
        PROCESS_WITHDRAWAL: '/api/Payment/admin/process-withdrawal',
        GET_USER_WALLET_BALANCE: '/api/Payment/admin/wallet/balance',
        GET_ALL_DISPUTES: '/api/Dispute/admin/all-disputes',
        RESOLVE_DISPUTE: '/api/Dispute/admin/resolve-dispute',
        UPDATE_CONSULTANT_VERIFICATION: '/api/Account/admin/update-consultant-verification',
        GET_SYSTEM_SETTINGS: '/api/Settings/system-settings',
        UPDATE_SYSTEM_SETTINGS: '/api/Settings/system-settings',
        GET_NOTIFICATION_SETTINGS: '/api/Settings/notification-settings',
        UPDATE_NOTIFICATION_SETTINGS: '/api/Settings/notification-settings',
    },

    // Dashboard Endpoints
    DASHBOARD: {
        GET_STATS: '/api/dashboard/stats',
        GET_OVERVIEW: '/api/dashboard/overview',
        GET_CONSULTANT_STATS: '/api/dashboard/consultant-stats',
        GET_SESSION_METRICS: '/api/dashboard/session-metrics',
        GET_REVENUE_CHART: '/api/dashboard/revenue-chart',
        GET_ANALYTICS: '/api/dashboard/analytics',
        GET_ADVISOR_STATS: '/api/Dashboard/advisor-stats',
        GET_USER_STATS: '/api/Dashboard/user-stats',
    },

    // Session Endpoints
    SESSION: {
        END_SESSION: '/api/Session/end-chat-session',
        END_CALL_SESSION: '/api/Session/end-call-session',
        RECALCULATE_TIME: '/api/Session/recalculate-time',
        SUBMIT_REVIEW: '/api/Session/submit-review',
        GET_CONSULTANT_REVIEWS: '/api/Session/get-consultant-reviews',
        GET_USER_REVIEWS: '/api/Session/get-user-reviews',
        GET_ALL_REVIEWS: '/api/Session/get-all-reviews',
        GET_SESSION_HISTORY: '/api/Session/history',
        SEND_MESSAGE: '/api/chat/test/send',
        GET_CHAT_HISTORY: '/api/chat/test/history',
        GET_OR_CREATE_CONVERSATION: '/api/Chat/conversation',
        GET_CONVERSATION_MESSAGES: '/api/Chat/conversation',
    },

    // Mock API Endpoints (for backward compatibility)
    CONSULTANTS: '/consultants',
    USERS: '/users',
    CATEGORIES: '/categories',
    SESSIONS: '/sessions',
    TRANSACTIONS: '/transactions',
    WITHDRAWALS: '/withdrawals',
    DISPUTES: '/disputes',
    TEMPLATES: '/templates',
    ANALYTICS: '/analytics',
    REVIEWS: '/reviews',
    CHAT_LOGS: '/chatLogs',

    // Notifications
    NOTIFICATIONS: {
        GET_MY: '/api/Notification/my-notifications',
        GET_ALL_ADMIN: '/api/Notification/admin/all-notifications',
        MARK_READ: '/api/Notification/mark-as-read',
        MARK_ALL_READ: '/api/Notification/mark-all-as-read',
        UNREAD_COUNT: '/api/Notification/unread-count',
    },

    // KYC
    KYC: {
        GET_CONSULTANT_DOCUMENTS: '/api/KYC/consultant',
        UPDATE_STATUS: '/api/KYC/update-status',
    },

    // Bank
    BANK: {
        GET_CONSULTANT_DETAILS: '/api/Payment/admin/bank-details',
    },
} as const;
