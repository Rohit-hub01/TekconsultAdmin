/**
 * API Endpoints Configuration
 * 
 * This file contains all API endpoint paths used in the application.
 * All endpoints are organized by feature/resource for easy maintenance and scalability.
 */

const API_VERSION = 'v1';

/**
 * Category Endpoints
 */
export const CATEGORY_ENDPOINTS = {
  GET_ALL: '/Category/get-all-categories',
  GET_BY_ID: (id: string) => `/Category/get-category/${id}`,
  CREATE: '/Category/create',
  UPDATE: (id: string) => `/Category/update/${id}`,
  DELETE: (id: string) => `/Category/delete/${id}`,
} as const;

/**
 * Consultant Endpoints
 */
export const CONSULTANT_ENDPOINTS = {
  GET_ALL: '/Category/get-all-consultants',
  GET_BY_CATEGORY: '/Account/consultants-by-category',
  GET_BY_ID: (id: string) => `/Consultant/get-consultant/${id}`,
  GET_USER_BY_ID: '/Account/get-user/consultant-byid',
  GET_PROFILE: '/Consultant/profile',
  CREATE: '/Consultant/create',
  UPDATE: (id: string) => `/Consultant/update/${id}`,
  DELETE: (id: string) => `/Consultant/delete/${id}`,
  GET_EARNINGS: '/Consultant/earnings',
  UPDATE_RATES: '/Account/update-rates',
  GET_REVIEWS: (id: string) => `/Consultant/reviews/${id}`,
} as const;

/**
 * User Endpoints
 */
export const USER_ENDPOINTS = {
  GET_PROFILE: '/User/profile',
  GET_CURRENT_USER: '/Account/get-user/consultant-byid',
  UPDATE_PROFILE: '/Account/update-profile',
  UPLOAD_PROFILE_PHOTO: '/Account/upload-profile-photo',
  GET_SESSIONS: '/User/sessions',
  GET_WALLET: '/User/wallet',
  UPDATE_WALLET: '/User/update-wallet',
  GET_ACTIVITIES: '/Account/recent-activities',
} as const;

/**
 * Account/Authentication Endpoints
 */
export const AUTH_ENDPOINTS = {
  GENERATE_OTP: '/Account/generate-otp',
  GENERATE_EMAIL_OTP: '/Account/generate-email-otp',
  LOGIN_WITH_PHONE: '/Account/login-with-phone',
  LOGIN_WITH_EMAIL: '/Account/login-with-email',
  SIGNUP_WITH_EMAIL: '/Account/signup-with-email',
  LOGIN: '/Auth/login',
  REGISTER: '/Account/signup-with-phone',
  LOGOUT: '/Auth/logout',
  VERIFY_OTP: '/Account/verify-otp',
  VERIFY_EMAIL_OTP: '/Account/verify-email-otp',
  RESEND_OTP: '/Auth/resend-otp',
  REFRESH_TOKEN: '/Auth/refresh-token',
  FORGOT_PASSWORD: '/Auth/forgot-password',
  RESET_PASSWORD: '/Auth/reset-password',
} as const;

/**
 * Session Endpoints
 */
export const SESSION_ENDPOINTS = {
  GET_ALL: '/Session/get-all-sessions',
  USER_HISTORY: '/Session/user-history',
  GET_BY_ID: (id: string) => `/Session/get-session/${id}`,
  CREATE: '/chat/test/create-session',
  UPDATE: (id: string) => `/Session/update/${id}`,
  CANCEL: (id: string) => `/Session/cancel/${id}`,
  ACCEPT: (id: string) => `/Session/accept/${id}`,
  DECLINE: (id: string) => `/Session/decline/${id}`,
  COMPLETE: (id: string) => `/Session/complete/${id}`,
  REQUESTS: '/Session/requests',
  HANDLE_REQUEST: '/Session/handle-request',
  END_CHAT_SESSION: '/Session/end-chat-session',
  END_CALL_SESSION: '/Session/end-call-session',
  END_SESSION: '/Session/end-session',
  SUBMIT_REVIEW: '/Session/submit-review',
  GET_CONSULTANT_REVIEWS: (id: string) => `/Session/get-consultant-reviews/${id}`,
} as const;

/**
 * Review Endpoints
 */
export const REVIEW_ENDPOINTS = {
  GET_ALL: '/Review/get-all-reviews',
  GET_BY_CONSULTANT: (id: string) => `/Review/consultant/${id}`,
  CREATE: '/Review/create',
  UPDATE: (id: string) => `/Review/update/${id}`,
  DELETE: (id: string) => `/Review/delete/${id}`,
} as const;

/**
 * Payment Endpoints
 */
export const PAYMENT_ENDPOINTS = {
  CREATE_PAYMENT: '/Payment/create',
  GET_PAYMENT_HISTORY: '/Payment/history',
  GET_WALLET_TRANSACTIONS: '/Payment/wallet/my-transactions',
  GET_WALLET_BALANCE: '/Payment/wallet/balance',
  ADD_MONEY: '/Payment/wallet/add-money',
  REQUEST_WITHDRAWAL: '/Payment/wallet/request-withdrawal',
  INITIATE_WITHDRAWAL: '/Payment/initiate-withdrawal',
  GET_WITHDRAWAL_HISTORY: '/Payment/my/Withdrawls',
  GET_BANK_DETAILS: '/Payment/bank-details',
  GET_CONSULTANT_BANK_DETAILS: (id: string) => `/Payment/admin/bank-details/${id}`,
  UPDATE_BANK_DETAILS: '/Payment/bank-details',
} as const;

/**
 * Notification Endpoints
 */
export const NOTIFICATIONS_ENDPOINTS = {
  GET_MY: '/Notification/my-notifications',
  MARK_READ: (id: string) => `/Notification/mark-as-read/${id}`,
  MARK_ALL_READ: '/Notification/mark-all-as-read',
  UNREAD_COUNT: '/Notification/unread-count',
} as const;

/**
 * KYC Endpoints
 */
export const KYC_ENDPOINTS = {
  UPLOAD: '/KYC/upload',
  GET_MY: '/KYC/my-documents',
  GET_CONSULTANT: (id: string) => `/KYC/consultant/${id}`,
  UPDATE_STATUS: '/KYC/update-status',
} as const;

/**
 * Dashboard Endpoints
 */
export const DASHBOARD_ENDPOINTS = {
  ADVISOR_STATS: '/Dashboard/advisor-stats',
  USER_STATS: '/Dashboard/user-stats',
  UPDATE_STATUS: '/Dashboard/update-online-status',
} as const;

/**
 * Chat Endpoints
 */
export const CHAT_ENDPOINTS = {
  CREATE_SESSION: '/chat/test/create-session',
  SEND_MESSAGE: '/chat/test/send',
  GET_MESSAGES: (sessionId: string) => `/chat/test/history?sessionId=${sessionId}`,
  GET_OR_CREATE_CONVERSATION: '/Chat/conversation',
  GET_CONVERSATION_MESSAGES: (conversationId: string) => `/Chat/conversation/${conversationId}/messages`,
} as const;

/**
 * Dispute Endpoints
 */
export const DISPUTE_ENDPOINTS = {
  RAISE: '/Dispute/raise-dispute',
  RESOLVE: '/Dispute/admin/resolve-dispute',
  GET_ALL: '/Dispute/admin/all-disputes',
} as const;

/**
 * All Endpoints grouped for easy access
 */
export const API_ENDPOINTS = {
  CATEGORY: CATEGORY_ENDPOINTS,
  CONSULTANT: CONSULTANT_ENDPOINTS,
  USER: USER_ENDPOINTS,
  AUTH: AUTH_ENDPOINTS,
  SESSION: SESSION_ENDPOINTS,
  REVIEW: REVIEW_ENDPOINTS,
  PAYMENT: PAYMENT_ENDPOINTS,
  CHAT: CHAT_ENDPOINTS,
  NOTIFICATIONS: NOTIFICATIONS_ENDPOINTS,
  DASHBOARD: DASHBOARD_ENDPOINTS,
  DISPUTE: DISPUTE_ENDPOINTS,
} as const;
