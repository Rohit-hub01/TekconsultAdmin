// Backend API Response Wrapper
export interface BackendApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
}

// Backend User/Consultant Data Structure
export interface BackendConsultantData {
    userId: string;
    firstName: string;
    middleName: string;
    lastName: string;
    consultantCategory?: string;
    countryCode: string;
    phoneNumber: string;
    email: string;
    status: boolean;
    isPhoneVerified: boolean;
    roleName: string;
    createdOn: string;
    consultantProfileId: string;
    profilePhotoUrl?: string;
    bio: string;
    experienceYears: number;
    chatRatePerMinute: number;
    callRatePerMinute: number;
    isOnline: boolean;
    freeMinutesOffer: number;
    averageRating: number;
    totalSessionsCompleted: number;
    isConsultantVerified: boolean;
    address: {
        addressId: string;
        addressLine: string;
        city: string;
        state: string;
        zipcode: string;
        country: string;
    };
    walletBalance: number;
    totalMoneySpent: number;
}

// Backend Active Session Data Structure
export interface BackendActiveSession {
    sessionId: string;
    userName: string;
    userPhone: string;
    consultantName: string;
    consultantCategory: string;
    mode: number; // 0 for chat, others for call
    durationSeconds: number;
    startTime?: string;
    ratePerMinute: number;
    totalBilled: number;
    userBalance: number;
    state: number;
}

// Backend Session History Data Structure
export interface BackendSessionHistory {
    sessionId: string;
    userId: string;
    userName: string;
    mode: number; // 0: Chat, 1: Call
    startTime: string;
    endTime: string | null;
    durationSeconds: number;
    totalChargedAmount: number;
    consultantEarnings: number;
    state: number; // 1: Active, 2: Completed
    rating: number | null;
    reviewComment: string | null;
}

// Backend Transaction Data Structure
export interface BackendTransaction {
    transactionId: string;
    userId: string;
    userName: string;
    amount: number;
    transactionType: number;
    status: number;
    paymentMethod: string | null;
    timestamp: string;
    referenceId: string;
}

// Backend Withdrawal Data Structure
export interface BackendWithdrawal {
    requestId: string;
    consultantName: string;
    amount: number;
    availableBalance: number;
    bankDetails: string; // Already formatted like "VISA **** 4242"
    status: number; // 0: Requested, 1: Approved, 2: Paid, 3: Failed/Rejected
    requestedAt: string;
}

export interface BackendWithdrawalDetail extends BackendWithdrawal {
    consultantUserId: string;
    consultantEmail: string;
    consultantPhone: string;
    paymentMethods: Array<{
        methodType: string;
        maskedDisplay: string;
        isDefault: boolean;
    }>;
    recentHistory: any[];
}

// Backend Dispute Data Structure
export interface BackendDispute {
    disputeId: string;
    sessionId: string;
    userName: string;
    consultantName: string;
    category: string;
    amount: number;
    status: number; // 0: Pending, 1: Resolved, 2: Rejected
    createdAt: string;
    description: string;
}

// Backend Notification Data Structure
export interface BackendNotification {
    notificationId: string;
    userId: string;
    title: string;
    body: string;
    type: number;
    isRead: boolean;
    createdAt: string;
}

export interface SystemSettings {
    platformCommissionPercent: number;
    minimumWithdrawalAmount: number;
}

export interface UpdateSystemSettingsPayload {
    platformCommissionPercent?: number;
    minimumWithdrawalAmount?: number;
}

export interface NotificationSettings {
    newConsultantApplications: boolean;
    disputeAlerts: boolean;
    withdrawalRequests: boolean;
    failedTransactions: boolean;
}

export interface UpdateNotificationSettingsPayload {
    newConsultantApplications?: boolean;
    disputeAlerts?: boolean;
    withdrawalRequests?: boolean;
    failedTransactions?: boolean;
}

// Frontend Consultant Interface
export interface Consultant {
    id: string | number;
    consultantProfileId?: string;
    fullName: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email: string;
    description?: string;
    profilePhotoUrl?: string;
    initials: string;
    isOnline: boolean;
    category: string;
    averageRating: number;
    totalSessionsCompleted: number;
    status: 'Approved' | 'Pending' | 'Suspended' | 'Rejected' | 'request_changes';
    rates: {
        chatPerMinute: number;
        callPerMinute: number;
    };
    appliedDate: string;
    phone?: string;
    bio?: string;
    expertise?: string[];
    languages?: string[];
    dob?: string;
    gender?: 'Male' | 'Female' | 'Other';
    experienceYears?: number;
    freeMinutesOffer?: number;
    isConsultantVerified?: boolean;
    isPhoneVerified?: boolean;
    address?: {
        addressLine?: string;
        city?: string;
        state?: string;
        zipcode?: string;
        country?: string;
    };
    kyc?: {
        pan: string;
        aadhaar?: string;
        address: string;
        documentUrl: string;
        bankName: string;
        branch?: string;
        accountNo: string;
        ifsc: string;
    };
    suspensionReason?: string;
    suspensionDuration?: string;
    rejectionReason?: string;
    reactivationReason?: string;
}

// Frontend User Interface
export interface User {
    id: string | number;
    fullName: string;
    email: string;
    phone: string;
    initials: string;
    location: {
        city: string;
        state: string;
    };
    walletBalance: number;
    totalSessions: number;
    totalSpend: number;
    status: 'Active' | 'Blocked';
    joinedDate: string;
}

export interface SubCategory {
    id?: string;
    name: string;
    description: string;
    consultantCount: number;
    categoryId?: string;
}

export interface Category {
    id: string | number;
    name: string;
    description: string;
    status: 'Active' | 'Inactive';
    icon: string;
    consultantCount: number;
    subcategories: SubCategory[];
}

export interface Transaction {
    id: string;
    user?: string;
    consultant?: string;
    session?: string;
    type: 'credit' | 'debit' | 'refund';
    amount: number;
    gross?: number;
    commission?: number;
    net?: number;
    method?: string;
    status: 'success' | 'failed' | 'credited' | 'pending';
    date: string;
}

export interface Withdrawal {
    id: string;
    consultant: string;
    requestedAmount: number;
    availableBalance: number;
    bankDetails: string;
    status: 'requested' | 'approved' | 'paid' | 'failed';
    requestedDate: string;
    payoutRef?: string;
    failureReason?: string;
    processedBy?: string;
}

export interface TimelineItem {
    title: string;
    desc?: string;
    time?: string;
    active?: boolean;
}

export interface Dispute {
    id: string;
    session: string;
    user: string;
    consultant: string;
    category: string;
    amount: number;
    status: 'open' | 'resolved' | 'rejected';
    createdAt: string;
    createdDate?: string; // Added for backward compatibility with user's manual fix
    description: string;
}

// Frontend Notification Interface
export interface Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: number;
    isRead: boolean;
    createdAt: string;
    userName?: string;
}

export interface NotificationBroadcast {
    id: string;
    title: string;
    message: string;
    audience: 'all_users' | 'consultants' | 'targeted' | 'all' | 'active' | 'premium';
    type: 'promotional' | 'transactional' | 'system';
    status: 'sent' | 'scheduled' | 'draft';
    sentDate?: string;
    scheduledDate?: string;
    delivered: number;
    opened: number;
}

export interface NotificationTemplate {
    id: string | number;
    name: string;
    type: 'marketing' | 'system' | 'promotional' | 'transactional';
    subject?: string;
    content?: string;
    lastUsed: string;
    totalSends?: number;
}

export interface Session {
    id: string;
    user: {
        name: string;
        phone: string;
    };
    consultant: {
        name: string;
        category: string;
    };
    consultantId?: string | number;
    mode: 'chat' | 'call';
    startTime: string;
    duration: string;
    rate: number;
    billed: number;
    walletBalance: number;
    status: 'active' | 'low_balance' | 'completed';
    rating?: number;
    reviewComment?: string;
}

export interface ChatMessage {
    sender: 'user' | 'consultant';
    text: string;
    time: string;
    color?: string;
}

export interface ChatLog {
    id: string;
    sessionTime: string;
    duration: string;
    userName: string;
    consultantName: string;
    messages: ChatMessage[];
    startTimeFormatted: string;
    endTimeFormatted: string;
    timezone: string;
}

export interface AnalyticsData {
    summary: {
        totalGmv: number;
        platformRevenue: number;
        totalSessions: number;
        newUsersMonth: number;
    };
    revenueTrend: { month: string; gmv: number; revenue: number }[];
    categoryDistribution: { name: string; value: number; color: string }[];
    userGrowth: { month: string; users: number; consultants: number }[];
}

export interface Review {
    id: string;
    consultantId: string;
    user: string;
    rating: number;
    comment: string;
    date: string;
    sessionId?: string;
}

// API Request Params
export interface GetUsersParams {
    status?: string;
    _sort?: string;
    _order?: 'asc' | 'desc';
    _page?: number;
    _limit?: number;
    q?: string;
}

export interface GetConsultantsParams {
    status?: string;
    _sort?: string;
    _order?: 'asc' | 'desc';
    _page?: number;
    _limit?: number;
    q?: string;
}

// Review types
export interface ReviewDetailsDto {
    reviewId: string;
    sessionId: string;
    userId: string;
    userName?: string;
    consultantId: string;
    consultantName?: string;
    rating: number;
    comment?: string;
    isModerated: boolean;
    createdAt: string;
}

export interface ReviewListResponseDto {
    reviews: ReviewDetailsDto[];
    totalCount: number;
    averageRating: number;
}

export interface ConsultantDashboardStats {
    totalEarnings: number;
    averageRating: number;
    numberOfSessions: number;
    availableBalance: number;
    isOnline: boolean;
}

export interface UserDashboardStats {
    totalSpent: number;
    numberOfSessions: number;
    walletBalance: number;
}

export interface BackendKYCDocument {
    docId: string;
    documentType: string;
    documentUrl: string;
    verificationStatus: number; // 0: Pending, 1: Approved, 2: Rejected
    adminFeedback?: string;
    uploadedAt: string;
    verifiedAt?: string;
}

export interface BackendBankDetails {
    id: string;
    consultantId: string;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branchName?: string;
    isDefault: boolean;
    isVerified: boolean;
}

export interface PaginatedSessionHistory {
    sessions: Session[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
}
export interface CategoryStats {
    categoryId: string;
    categoryName: string;
    totalConsultants: number;
    activeSessionsCount: number;
    totalRevenue: number;
}

export interface Conversation {
    id: string;
    userId: string;
    consultantId: string;
    createdAt: string;
    userName?: string;
    consultantName?: string;
    consultantPhotoUrl?: string;
    userPhotoUrl?: string;
}

export interface BackendConversation {
    id: string;
    userId: string;
    consultantId: string;
    createdAt: string;
    userName?: string;
    consultantName?: string;
    consultantPhotoUrl?: string;
    userPhotoUrl?: string;
}

export interface BackendChatMessage {
    messageId: string;
    conversationId: string;
    sessionId?: string;
    senderId: string;
    content: string;
    senderName: string;
    senderRole: string;
    messageType: number;
    isRead: boolean;
    timestamp: string;
    profilePhotoUrl?: string;
}
