// Re-export everything from the new modular API structure
export * from './api/types';
import { BackendWithdrawalDetail, Consultant, ReviewListResponseDto, BackendSessionHistory, Notification, BackendKYCDocument, BackendBankDetails, PaginatedSessionHistory, CategoryStats, SystemSettings, UpdateSystemSettingsPayload, NotificationSettings, UpdateNotificationSettingsPayload } from './api/types';
import { ENDPOINTS, API_BASE_URL } from './api/endpoints';
export * from './api/endpoints';
export * from './api/backendService';

// Backend API Response Wrapper
export interface BackendApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
}

export interface BackendPaginatedResponse<T> {
    sessions: T[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
}

// Backend Consultant Data Structure
export interface BackendConsultantData {
    consultantCategory: string;
    userId: string;
    firstName: string;
    middleName: string;
    lastName: string;
    countryCode: string;
    phoneNumber: string;
    email: string;
    status: boolean;
    isPhoneVerified: boolean;
    roleName: string;
    createdOn: string;
    consultantProfileId: string;
    profilePhotoUrl?: string; // Added to match types.ts
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
    walletBalance?: number;
    totalMoneySpent?: number;
}

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
    profilePhotoUrl?: string;
}

export interface SubCategory {
    id?: string;
    name: string;
    description: string;
    consultantCount: number;
    categoryId?: string; // Optional parent ID if needed for frontend logic
}

export interface Category {
    id: number | string; // Updated to allow string IDs as seen in curl
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
    userId?: string;
    userEmail?: string;
    consultant: string;
    consultantId?: string;
    consultantEmail?: string;
    category: string;
    amount: number;
    status: 'open' | 'in_review' | 'resolved' | 'rejected';
    priority: 'high' | 'medium' | 'low';
    createdDate: string;
    description: string;
    resolution?: string;
    sessionDate?: string;
    sessionDuration?: string;
    evidence?: string[];
    timeline?: TimelineItem[];
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

export interface BackendWithdrawal {
    withdrawalId: string;
    userId: string;
    userName: string;
    amount: number;
    availableBalance: number;
    status: number; // 0: Requested, 1: Approved, 2: Paid, 3: Failed/Rejected
    timestamp: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
        // Only redirect if NOT on the login page and NOT attempting to login
        const isLoginEndpoint = response.url.includes('/Account/login-with-email') ||
            response.url.includes('/Account/login-with-phone');

        if (isLoginEndpoint) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Invalid email or password');
        }

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `API error: ${response.status}`);
    }
    return response.json();
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

export const api = {
    login: async (email: string, password: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/api/Account/admin-login-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        return handleResponse<any>(response);
    },

    getConsultants: async (params: GetConsultantsParams = {}): Promise<Consultant[]> => {
        // Use the backend version
        return api.getConsultantsFromBackend(0, 100);
    },

    getConsultantsFromBackend: async (skip: number = 0, take: number = 100): Promise<Consultant[]> => {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `${API_BASE_URL}/api/Account/admin/get-all-users?skip=${skip}&take=${take}&isConsultant=true`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'accept': '*/*'
                }
            }
        );

        const result = await handleResponse<BackendApiResponse<BackendConsultantData[]>>(response);

        // Transform backend data to frontend Consultant interface
        return result.data.map((item): Consultant => {
            // Generate initials from first and last name
            const firstInitial = item.firstName?.charAt(0)?.toUpperCase() || '';
            const lastInitial = item.lastName?.charAt(0)?.toUpperCase() || '';
            const initials = firstInitial + lastInitial || 'NA';

            // Construct full name
            const nameParts = [item.firstName, item.middleName, item.lastName].filter(Boolean);
            const fullName = nameParts.join(' ') || 'Unknown';

            // Determine status based on isConsultantVerified and status fields
            let status: Consultant['status'] = 'Pending';
            if (item.isConsultantVerified && item.status) {
                status = 'Approved';
            } else if (!item.status) {
                status = 'Suspended';
            } else if (!item.isConsultantVerified) {
                status = 'Pending';
            }

            // Format applied date
            const appliedDate = new Date(item.createdOn).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            return {
                id: item.userId,
                consultantProfileId: item.consultantProfileId,
                fullName,
                firstName: item.firstName,
                middleName: item.middleName,
                lastName: item.lastName,
                email: item.email,
                initials,
                isOnline: item.isOnline,
                profilePhotoUrl: item.profilePhotoUrl,
                category: item.consultantCategory || 'General',
                averageRating: item.averageRating,
                totalSessionsCompleted: item.totalSessionsCompleted,
                status,
                rates: {
                    chatPerMinute: item.chatRatePerMinute,
                    callPerMinute: item.callRatePerMinute
                },
                appliedDate,
                phone: `+${item.countryCode}${item.phoneNumber}`,
                bio: item.bio,
                experienceYears: item.experienceYears,
                freeMinutesOffer: item.freeMinutesOffer,
                address: item.address ? {
                    addressLine: item.address.addressLine,
                    city: item.address.city,
                    state: item.address.state,
                    zipcode: item.address.zipcode,
                    country: item.address.country,
                } : undefined,
                kyc: {
                    pan: '',
                    address: item.address
                        ? `${item.address.addressLine}, ${item.address.city}, ${item.address.state} ${item.address.zipcode}, ${item.address.country}`
                        : 'N/A',
                    documentUrl: '',
                    bankName: '',
                    accountNo: '',
                    ifsc: ''
                }
            };
        });
    },

    getConsultantById: async (id: string | number): Promise<Consultant> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.GET_CONSULTANT_BY_ID}?userId=${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            }
        });
        // Backend returns wrapped response: { success: boolean, statusCode: number, message: string, data: BackendConsultantData }
        const result = await handleResponse<BackendApiResponse<BackendConsultantData>>(response);
        const item = result.data;

        // Same mapping logic as in getConsultantsFromBackend in backendService.ts
        // Generate initials
        const firstInitial = item.firstName?.charAt(0)?.toUpperCase() || '';
        const lastInitial = item.lastName?.charAt(0)?.toUpperCase() || '';
        const initials = firstInitial + lastInitial || 'NA';

        // Construct full name
        const nameParts = [item.firstName, item.middleName, item.lastName].filter(Boolean);
        const fullName = nameParts.join(' ') || 'Unknown';

        // Determine status
        let status: Consultant['status'] = 'Pending';
        if (item.isConsultantVerified && item.status) {
            status = 'Approved';
        } else if (!item.status) {
            status = 'Suspended';
        } else if (!item.isConsultantVerified) {
            status = 'Pending';
        }

        // Format applied date
        const appliedDate = new Date(item.createdOn).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return {
            id: item.userId,
            consultantProfileId: item.consultantProfileId,
            fullName,
            firstName: item.firstName,
            middleName: item.middleName,
            lastName: item.lastName,
            email: item.email,
            initials,
            isOnline: item.isOnline,
            profilePhotoUrl: item.profilePhotoUrl,
            category: item.consultantCategory || 'General',
            averageRating: item.averageRating,
            totalSessionsCompleted: item.totalSessionsCompleted,
            status,
            rates: {
                chatPerMinute: item.chatRatePerMinute,
                callPerMinute: item.callRatePerMinute
            },
            appliedDate,
            phone: `+${item.countryCode}${item.phoneNumber}`,
            bio: item.bio,
            experienceYears: item.experienceYears,
            freeMinutesOffer: item.freeMinutesOffer,
            isConsultantVerified: item.isConsultantVerified,
            isPhoneVerified: item.isPhoneVerified,
            address: item.address ? {
                addressLine: item.address.addressLine,
                city: item.address.city,
                state: item.address.state,
                zipcode: item.address.zipcode,
                country: item.address.country,
            } : undefined,
            kyc: {
                pan: '',
                address: item.address
                    ? `${item.address.addressLine}, ${item.address.city}, ${item.address.state} ${item.address.zipcode}, ${item.address.country}`
                    : 'N/A',
                documentUrl: '',
                bankName: '',
                accountNo: '',
                ifsc: ''
            }
        };
    },

    updateConsultant: async (id: string | number, data: Partial<Consultant>): Promise<Consultant> => {
        // Map consultant fields to profile update if needed
        // For now, this is mostly called via updateConsultantStatus which uses real API.
        // If called directly, we'll use UpdateProfile
        await api.updateConsultantProfile({ userId: id, ...data });
        return api.getConsultantById(id);
    },

    updateConsultantProfile: async (data: any): Promise<any> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.UPDATE_PROFILE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            },
            body: JSON.stringify(data),
        });
        return handleResponse<any>(response);
    },

    updateConsultantStatus: async (id: string | number, status: Consultant['status'], reason?: string, duration?: string): Promise<Consultant> => {
        const { updateConsultantVerificationInBackend } = await import('./api/backendService');

        if (status === 'Approved') {
            await updateConsultantVerificationInBackend(id, true);
            // Also ensure account status is Active
            await api.updateConsultantProfile({ userId: id, status: true });
        } else if (status === 'Suspended') {
            await api.updateConsultantProfile({ userId: id, status: false });
        } else if (status === 'Rejected') {
            // Rejection unverifies the consultant
            await updateConsultantVerificationInBackend(id, false);
        }

        return api.getConsultantById(id);
    },

    getConsultantSessions: async (consultantId: string | number): Promise<Session[]> => {
        const result = await api.getConsultantSessionsPaginated(consultantId, 0, 1000);
        return result.sessions;
    },

    getConsultantSessionsPaginated: async (consultantId: string | number, skip: number = 0, take: number = 10): Promise<PaginatedSessionHistory> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.SESSION.GET_SESSION_HISTORY}/${consultantId}?skip=${skip}&take=${take}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            }
        });
        const result = await handleResponse<BackendApiResponse<BackendPaginatedResponse<BackendSessionHistory>>>(response);

        const mappedSessions = result.data.sessions.map((item): Session => {
            const date = new Date(item.startTime);
            const formattedDate = date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }) + ', ' + date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            const minutes = Math.floor(item.durationSeconds / 60);
            const seconds = item.durationSeconds % 60;
            const durationFormatted = `${minutes}m ${seconds}s`;

            return {
                id: item.sessionId,
                user: {
                    name: item.userName,
                    phone: '', // Not provided in history
                },
                consultant: {
                    name: '', // Not provided as it's the consultant's own history
                    category: '',
                },
                consultantId: consultantId,
                mode: item.mode === 0 ? 'chat' : 'call',
                startTime: formattedDate,
                duration: durationFormatted,
                rate: 0, // Not explicitly in history, but derived if needed
                billed: item.totalChargedAmount,
                walletBalance: 0,
                status: item.state === 2 ? 'completed' : 'active',
                rating: item.rating ?? undefined,
                reviewComment: item.reviewComment ?? undefined,
            };
        });

        return {
            sessions: mappedSessions,
            totalCount: result.data.totalCount,
            currentPage: result.data.currentPage,
            pageSize: result.data.pageSize,
            totalPages: result.data.totalPages
        };
    },

    getConsultantReviews: async (consultantId: string | number): Promise<ReviewListResponseDto> => {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `${API_BASE_URL}${ENDPOINTS.SESSION.GET_CONSULTANT_REVIEWS}/${consultantId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'accept': '*/*'
                }
            }
        );
        const result = await handleResponse<BackendApiResponse<ReviewListResponseDto>>(response);
        return result.data;
    },

    getUserReviews: async (): Promise<ReviewListResponseDto> => {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `${API_BASE_URL}${ENDPOINTS.SESSION.GET_USER_REVIEWS}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'accept': '*/*'
                }
            }
        );
        const result = await handleResponse<BackendApiResponse<ReviewListResponseDto>>(response);
        return result.data;
    },

    getAllReviews: async (): Promise<ReviewListResponseDto> => {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `${API_BASE_URL}${ENDPOINTS.SESSION.GET_ALL_REVIEWS}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'accept': '*/*'
                }
            }
        );
        const result = await handleResponse<BackendApiResponse<ReviewListResponseDto>>(response);
        return result.data;
    },

    getUsers: async (params: GetUsersParams = {}): Promise<User[]> => {
        return api.getUsersFromBackend(0, 100);
    },

    getUsersFromBackend: async (skip: number = 0, take: number = 100): Promise<User[]> => {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `${API_BASE_URL}/api/Account/admin/get-all-users?skip=${skip}&take=${take}&isConsultant=false`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'accept': '*/*'
                }
            }
        );

        const result = await handleResponse<BackendApiResponse<BackendConsultantData[]>>(response);

        // Transform backend data to frontend User interface
        return result.data.map((item): User => {
            // Generate initials from first and last name
            const firstInitial = item.firstName?.charAt(0)?.toUpperCase() || '';
            const lastInitial = item.lastName?.charAt(0)?.toUpperCase() || '';
            const initials = firstInitial + lastInitial || 'NA';

            // Construct full name
            const nameParts = [item.firstName, item.middleName, item.lastName].filter(Boolean);
            const fullName = nameParts.join(' ') || 'Unknown';

            // Determine status based on backend status field
            const status: User['status'] = item.status ? 'Active' : 'Blocked';

            // Format joined date
            const joinedDate = new Date(item.createdOn).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            return {
                id: item.userId,
                fullName,
                email: item.email || 'N/A',
                phone: `+${item.countryCode}${item.phoneNumber}`,
                initials,
                location: {
                    city: item.address?.city || 'N/A',
                    state: item.address?.state || 'N/A'
                },
                walletBalance: item.walletBalance || 0,
                totalSessions: item.totalSessionsCompleted || 0,
                totalSpend: item.totalMoneySpent || 0,
                status,
                joinedDate,
                profilePhotoUrl: item.profilePhotoUrl
            };
        });
    },

    getUserById: async (id: string | number): Promise<User> => {
        // User confirmed that user details endpoint is same as consultant details
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.GET_CONSULTANT_BY_ID}?userId=${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            }
        });
        const result = await handleResponse<BackendApiResponse<BackendConsultantData>>(response);
        const item = result.data;

        // Generate initials
        const firstInitial = item.firstName?.charAt(0)?.toUpperCase() || '';
        const lastInitial = item.lastName?.charAt(0)?.toUpperCase() || '';
        const initials = firstInitial + lastInitial || 'NA';

        // Construct full name
        const nameParts = [item.firstName, item.middleName, item.lastName].filter(Boolean);
        const fullName = nameParts.join(' ') || 'Unknown';

        // Determine status
        const status: User['status'] = item.status ? 'Active' : 'Blocked';

        // Format joined date
        const joinedDate = new Date(item.createdOn).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return {
            id: item.userId,
            fullName,
            email: item.email || 'N/A',
            phone: `+${item.countryCode}${item.phoneNumber}`,
            initials,
            location: {
                city: item.address?.city || 'N/A',
                state: item.address?.state || 'N/A'
            },
            walletBalance: item.walletBalance || 0,
            totalSessions: item.totalSessionsCompleted || 0,
            totalSpend: item.totalMoneySpent || 0,
            status,
            joinedDate,
            profilePhotoUrl: item.profilePhotoUrl
        };
    },

    updateUserStatus: async (id: string | number, status: User['status']): Promise<User> => {
        await api.updateConsultantProfile({ userId: id, status: status === 'Active' });
        return api.getUserById(id);
    },

    suspendUser: async (id: string | number): Promise<User> => {
        await api.updateConsultantProfile({ userId: id, status: false });
        return api.getUserById(id);
    },

    reactivateUser: async (id: string | number): Promise<User> => {
        await api.updateConsultantProfile({ userId: id, status: true });
        return api.getUserById(id);
    },

    getCategories: async (): Promise<Category[]> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.GET_ALL_CATEGORIES}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            }
        });
        const result = await handleResponse<BackendApiResponse<any[]>>(response);

        return result.data.map((item: any): Category => ({
            id: item.categoryId,
            name: item.name,
            description: item.description || "",
            status: item.isActive ? 'Active' : 'Inactive',
            icon: "", // Not provided by backend, UI handles fallback
            consultantCount: item.consultantCount || 0,
            subcategories: (item.subCategories || []).map((sub: any): SubCategory => ({
                id: sub.categoryId,
                name: sub.name,
                description: sub.description || "",
                consultantCount: sub.consultantCount || 0,
                categoryId: item.categoryId
            }))
        }));
    },

    getCategoryById: async (id: string | number): Promise<Category> => {
        const categories = await api.getCategories();
        const category = categories.find(c => c.id.toString() === id.toString());
        if (!category) throw new Error("Category not found");
        return category;
    },

    createCategory: async (payload: Partial<Category>): Promise<Category> => {
        const token = localStorage.getItem("token");

        // Transform payload to match backend schema
        const backendPayload = {
            name: payload.name,
            description: payload.description,
            subCategories: payload.subcategories?.map(sub => ({
                name: sub.name,
                description: sub.description || ""
                // No categoryId for new subcategories in create context
            })) || []
        };

        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.CREATE_CATEGORY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(backendPayload),
        });

        const result = await handleResponse<any>(response);

        // Construct the frontend Category object
        return {
            id: result?.data?.categoryId || result?.categoryId || `temp-${Date.now()}`,
            name: payload.name!,
            description: payload.description || "",
            status: 'Active',
            icon: payload.icon || "FolderTree",
            consultantCount: 0,
            subcategories: payload.subcategories || []
        };
    },

    updateCategory: async (id: string | number, payload: Partial<Category>): Promise<Category> => {
        const token = localStorage.getItem("token");

        const backendPayload = {
            categoryId: id,
            name: payload.name,
            description: payload.description,
            subCategories: payload.subcategories?.map(sub => ({
                ...(sub.id ? { categoryId: sub.id } : {}),
                name: sub.name,
                description: sub.description || ""
            })) || []
        };

        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.UPDATE_CATEGORY}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(backendPayload),
        });

        // Backend doesn't return the full updated category object in the format we use, 
        // but we can return the input payload merged with id for local state update
        await handleResponse<any>(response);
        return { id, ...payload } as Category;
    },

    toggleCategoryStatus: async (id: string | number, isActive: boolean): Promise<void> => {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.TOGGLE_CATEGORY_STATUS}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                categoryId: id,
                isActive: isActive
            }),
        });
        return handleResponse<void>(response);
    },

    getSystemSettings: async (): Promise<SystemSettings> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.GET_SYSTEM_SETTINGS}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            }
        });
        const result = await handleResponse<BackendApiResponse<SystemSettings>>(response);
        return result.data;
    },

    updateSystemSettings: async (payload: UpdateSystemSettingsPayload): Promise<SystemSettings> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.UPDATE_SYSTEM_SETTINGS}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            },
            body: JSON.stringify(payload)
        });
        const result = await handleResponse<BackendApiResponse<SystemSettings>>(response);
        return result.data;
    },

    getNotificationSettings: async (): Promise<NotificationSettings> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.GET_NOTIFICATION_SETTINGS}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            }
        });
        const result = await handleResponse<BackendApiResponse<NotificationSettings>>(response);
        return result.data;
    },

    updateNotificationSettings: async (payload: UpdateNotificationSettingsPayload): Promise<NotificationSettings> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.UPDATE_NOTIFICATION_SETTINGS}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            },
            body: JSON.stringify(payload)
        });
        const result = await handleResponse<BackendApiResponse<NotificationSettings>>(response);
        return result.data;
    },



    getActiveSessions: async (): Promise<Session[]> => {
        const { getActiveSessionsFromBackend } = await import('./api/backendService');
        return getActiveSessionsFromBackend();
    },

    getSessions: async (params: { q?: string; status?: string; mode?: string } = {}): Promise<Session[]> => {
        const { getActiveSessionsFromBackend } = await import('./api/backendService');
        // For now we map everything to active sessions as we don't have a generic session search backend yet
        return getActiveSessionsFromBackend();
    },

    // Wallet & Transactions
    getTransactions: async (params: any = {}): Promise<Transaction[]> => {
        const { getTransactionsFromBackend } = await import('./api/backendService');
        const skip = params.skip || 0;
        const take = params.take || 100;
        const userId = params.user; // UserDetailsModal passes 'user' key
        return getTransactionsFromBackend(skip, take, userId);
    },

    getUserWalletBalance: async (userId: string | number): Promise<number> => {
        const { getUserWalletBalanceFromBackend } = await import('./api/backendService');
        return getUserWalletBalanceFromBackend(userId);
    },

    // Withdrawals
    getWithdrawals: async (params: any = {}): Promise<Withdrawal[]> => {
        const { getWithdrawalsFromBackend } = await import('./api/backendService');
        const skip = params.skip || 0;
        const take = params.take || 100;
        return getWithdrawalsFromBackend(skip, take);
    },

    processWithdrawal: async (requestId: string, approve: boolean): Promise<any> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.PROCESS_WITHDRAWAL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'accept': '*/*'
            },
            body: JSON.stringify({
                requestId,
                approve
            })
        });
        return handleResponse<any>(response);
    },

    getWithdrawalDetails: async (id: string): Promise<any> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.GET_WITHDRAWAL_DETAILS}${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            }
        });
        const result = await handleResponse<BackendApiResponse<BackendWithdrawalDetail>>(response);
        const item = result.data;

        // Map status
        const statusMap: Record<number, any> = {
            0: 'Requested',
            1: 'Approved',
            2: 'Rejected',
            3: 'Completed'
        };

        // Format date
        const dateObj = new Date(item.requestedAt);
        const formattedDate = dateObj.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        // Map initials
        const nameParts = item.consultantName.split(' ');
        const initials = nameParts.map(n => n[0]).join('').toUpperCase().slice(0, 2);

        // Calculate some dummy fees if not provided by backend to keep UI consistent
        const withdrawalAmount = item.amount;
        const platformFeePercent = 10;
        const platformFee = (withdrawalAmount * platformFeePercent) / 100;
        const tdsPercent = 5;
        const tds = (withdrawalAmount * tdsPercent) / 100;
        const netPayable = withdrawalAmount - platformFee - tds;

        return {
            requestId: item.requestId,
            status: statusMap[item.status] || 'Requested',
            requestedDate: formattedDate,
            consultant: {
                name: item.consultantName,
                initials: initials || 'CN',
                consultantId: item.consultantUserId,
                email: item.consultantEmail,
                phone: item.consultantPhone,
            },
            amounts: {
                withdrawalAmount,
                availableBalance: item.availableBalance,
                platformFee,
                platformFeePercent,
                tds,
                tdsPercent,
                netPayable,
            },
            bankAccount: {
                accountHolder: item.consultantName,
                accountNumber: item.bankDetails, // Backend gives preformatted string
                bankName: item.paymentMethods[0]?.methodType || 'Bank Account',
                ifscCode: 'N/A', // Not in new API response
            },
            recentHistory: item.recentHistory.map((h: any) => ({
                amount: h.amount,
                date: new Date(h.requestedAt).toLocaleDateString(),
                status: statusMap[h.status] || 'Pending'
            }))
        };
    },

    // Disputes
    getDisputes: async (params: any = {}): Promise<any[]> => {
        const { getDisputesFromBackend } = await import('./api/backendService');
        return getDisputesFromBackend();
    },

    updateDispute: async (id: string, data: Partial<Dispute>): Promise<Dispute> => {
        // Backend resolveDispute should be used instead
        console.warn("updateDispute is deprecated. Use resolveDispute instead.");
        return { id, ...data } as Dispute;
    },

    resolveDispute: async (disputeId: string, approve: boolean, partialAmount: number = 0): Promise<any> => {
        const { resolveDisputeFromBackend } = await import('./api/backendService');
        return resolveDisputeFromBackend(disputeId, approve, partialAmount);
    },

    // Notifications
    getNotifications: async (params: any = {}): Promise<Notification[]> => {
        const { getAllNotificationsFromBackend } = await import('./api/backendService');
        const skip = params.skip || 0;
        const take = params.take || 50;
        return getAllNotificationsFromBackend(skip, take);
    },

    getUnreadCount: async (): Promise<number> => {
        const { getUnreadNotificationCount } = await import('./api/backendService');
        return getUnreadNotificationCount();
    },

    markNotificationAsRead: async (id: string): Promise<boolean> => {
        const { markNotificationAsRead } = await import('./api/backendService');
        return markNotificationAsRead(id);
    },

    markAllNotificationsAsRead: async (): Promise<boolean> => {
        const { markAllNotificationsAsRead } = await import('./api/backendService');
        return markAllNotificationsAsRead();
    },

    createNotification: async (data: Partial<NotificationBroadcast>): Promise<NotificationBroadcast> => {
        // Broadcast functionality remains mock for now as backend doesn't support it yet
        // Returning local object instead of calling mock API
        return {
            ...data,
            id: `notif-${Date.now()}`,
            status: 'sent',
            sentDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
            delivered: Math.floor(Math.random() * 1000) + 500,
            opened: 0
        } as NotificationBroadcast;
    },

    getTemplates: async (): Promise<NotificationTemplate[]> => {
        // Return static templates as requested to keep UI functional without mock server
        return [
            { id: 1, name: "Welcome Message", content: "Welcome to TekConsult!", type: "Email", lastUsed: "2 hours ago", totalSends: 1250 },
            { id: 2, name: "Session Reminder", content: "Your session starts in 10 minutes.", type: "SMS", lastUsed: "1 day ago", totalSends: 850 },
            { id: 3, name: "Payment Success", content: "Your payment of {amount} was successful.", type: "Push", lastUsed: "30 mins ago", totalSends: 3200 }
        ] as any[];
    },

    createTemplate: async (data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
        return {
            ...data,
            id: Date.now(),
            lastUsed: 'Never',
            totalSends: 0
        } as any;
    },

    updateTemplate: async (id: string | number, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
        return { id, ...data } as any;
    },

    deleteTemplate: async (id: string | number): Promise<void> => {
        return Promise.resolve();
    },

    getAnalytics: async (period: string = 'last30'): Promise<AnalyticsData> => {
        try {
            const { getAnalyticsFromBackend } = await import('./api/backendService');
            const response = await getAnalyticsFromBackend(period);
            if (response.success && response.data) {
                // Transform backend response to frontend format
                const data = response.data;
                return {
                    summary: {
                        totalGmv: data.summary.totalGmv,
                        platformRevenue: data.summary.platformRevenue,
                        totalSessions: data.summary.totalSessions,
                        newUsersMonth: data.summary.newUsersMonth
                    },
                    revenueTrend: data.revenueTrend,
                    categoryDistribution: data.categoryDistribution,
                    userGrowth: data.userGrowth
                };
            }
            // Fallback if backend returns error
            return {
                summary: {
                    totalGmv: 0,
                    platformRevenue: 0,
                    totalSessions: 0,
                    newUsersMonth: 0
                },
                revenueTrend: [],
                categoryDistribution: [],
                userGrowth: []
            };
        } catch (error) {
            console.error("Error fetching analytics:", error);
            // Return empty data on error
            return {
                summary: {
                    totalGmv: 0,
                    platformRevenue: 0,
                    totalSessions: 0,
                    newUsersMonth: 0
                },
                revenueTrend: [],
                categoryDistribution: [],
                userGrowth: []
            };
        }
    },
    getChatLog: async (sessionId: string): Promise<ChatLog> => {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `${API_BASE_URL}${ENDPOINTS.SESSION.GET_CHAT_HISTORY}?sessionId=${sessionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'accept': '*/*'
                }
            }
        );

        if (!response.ok) {
            // Fallback for demo if id not found
            return {
                id: sessionId,
                sessionTime: "Unknown",
                duration: "0 min",
                userName: "Unknown User",
                consultantName: "Unknown Consultant",
                messages: [],
                startTimeFormatted: "Unknown",
                endTimeFormatted: "Unknown",
                timezone: "UTC"
            };
        }

        const result = await handleResponse<BackendApiResponse<any[]>>(response);

        // Transform backend response to match ChatLog interface
        return {
            id: sessionId,
            sessionTime: new Date().toISOString(),
            duration: "0 min",
            userName: "Unknown User",
            consultantName: "Unknown Consultant",
            messages: (result.data || []).map((msg: any) => ({
                sender: msg.senderRole?.toLowerCase() === 'user' ? 'user' : 'consultant',
                text: msg.content || "",
                time: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
                color: msg.senderRole?.toLowerCase() === 'user' ? '#8B5CF6' : '#3B82F6'
            })),
            startTimeFormatted: new Date().toLocaleDateString(),
            endTimeFormatted: new Date().toLocaleDateString(),
            timezone: "UTC"
        };
    },

    submitReview: async (sessionId: string, rating: number, comment?: string): Promise<any> => {
        try {
            const { submitReviewToBackend } = await import('./api/backendService');
            return submitReviewToBackend(sessionId, rating, comment);
        } catch (error) {
            console.error("Error submitting review:", error);
            return {
                success: false,
                statusCode: 500,
                message: "Failed to submit review",
                data: null
            };
        }
    },

    // Admin Session Management
    endSession: async (sessionId: string): Promise<boolean> => {
        console.log('🟢 api.endSession called with sessionId:', sessionId);
        const { endSessionFromBackend } = await import('./api/backendService');
        return endSessionFromBackend(sessionId);
    },

    sendMessageInSession: async (sessionId: string, message: string): Promise<string> => {
        console.log('🟢 api.sendMessageInSession called with sessionId:', sessionId, 'message:', message);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.SESSION.SEND_MESSAGE}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'accept': '*/*'
            },
            body: JSON.stringify({
                sessionId,
                message
            })
        });
        const result = await handleResponse<BackendApiResponse<{ messageId: string }>>(response);
        return result.data.messageId;
    },

    async getAdvisorStats(userId?: string | number): Promise<ConsultantDashboardStats> {
        const token = localStorage.getItem('token');
        const url = new URL(`${API_BASE_URL}${ENDPOINTS.DASHBOARD.GET_ADVISOR_STATS}`);
        if (userId) url.searchParams.append('userId', userId.toString());

        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            }
        });
        const result = await handleResponse<BackendApiResponse<ConsultantDashboardStats>>(response);
        return result.data;
    },

    async getSessionsByCategory(days: number = 14): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/dashboard/sessions-by-category?days=${days}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': 'application/json'
            }
        });
        const result = await handleResponse<BackendApiResponse<any[]>>(response);
        return result.data;
    },

    getUserStats: async (userId?: string | number): Promise<UserDashboardStats> => {
        const token = localStorage.getItem('token');
        const url = new URL(`${API_BASE_URL}${ENDPOINTS.DASHBOARD.GET_USER_STATS}`);
        if (userId) url.searchParams.append('userId', userId.toString());

        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            }
        });
        const result = await handleResponse<BackendApiResponse<UserDashboardStats>>(response);
        return result.data;
    },

    getKYCDocuments: async (consultantProfileId: string): Promise<BackendKYCDocument[]> => {
        const { getConsultantKYCDocuments } = await import('./api/backendService');
        return getConsultantKYCDocuments(consultantProfileId);
    },

    getBankDetails: async (consultantId: string): Promise<BackendBankDetails> => {
        const { getConsultantBankDetails } = await import('./api/backendService');
        return getConsultantBankDetails(consultantId);
    },

    updateKYCStatus: async (docId: string, status: number, feedback?: string): Promise<any> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.KYC.UPDATE_STATUS}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({ docId, status, adminFeedback: feedback })
        });
        return handleResponse<any>(response);
    },

    getCategoryStats: async (categoryId: string | number): Promise<CategoryStats> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/Category/stats/${categoryId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            }
        });
        const result = await handleResponse<BackendApiResponse<CategoryStats>>(response);
        return result.data;
    },
};
