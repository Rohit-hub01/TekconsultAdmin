import { API_BASE_URL, ENDPOINTS } from './endpoints';
import type {
    BackendApiResponse,
    BackendConsultantData,
    BackendActiveSession,
    BackendTransaction,
    Consultant,
    User,
    Session,
    Transaction,
    Withdrawal,
    BackendWithdrawal,
    Dispute,
    BackendDispute,
    Notification,
    BackendNotification,
    BackendConversation,
    BackendChatMessage,
    Conversation,
} from './types';

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `API error: ${response.status}`);
    }
    return response.json();
}

/**
 * Fetch consultants from backend API
 * @param skip - Number of records to skip (pagination)
 * @param take - Number of records to fetch
 * @returns Array of consultants
 */
export async function getConsultantsFromBackend(
    skip: number = 0,
    take: number = 100
): Promise<Consultant[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.GET_ALL_USERS}?skip=${skip}&take=${take}&isConsultant=true`,
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
            day: 'numeric',
        });

        return {
            id: item.userId,
            fullName,
            email: item.email,
            initials,
            isOnline: item.isOnline,
            profilePhotoUrl: item.profilePhotoUrl, // Added profilePhotoUrl
            category: item.consultantCategory || 'General',
            averageRating: item.averageRating,
            totalSessionsCompleted: item.totalSessionsCompleted,
            status,
            rates: {
                chatPerMinute: item.chatRatePerMinute,
                callPerMinute: item.callRatePerMinute,
            },
            appliedDate,
            phone: `+${item.countryCode}${item.phoneNumber}`,
            bio: item.bio,
            kyc: {
                pan: '',
                address: item.address
                    ? `${item.address.addressLine}, ${item.address.city}, ${item.address.state} ${item.address.zipcode}, ${item.address.country}`
                    : 'N/A',
                documentUrl: '',
                bankName: '',
                accountNo: '',
                ifsc: '',
            },
        };
    });
}

/**
 * Update consultant verification status in backend
 * @param userId - Use ID of the consultant
 * @param isVerified - Whether the consultant is verified
 * @returns Updated consultant data
 */
export async function updateConsultantVerificationInBackend(
    userId: string | number,
    isVerified: boolean
): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.UPDATE_CONSULTANT_VERIFICATION}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            },
            body: JSON.stringify({
                userId,
                isConsultantVerified: isVerified
            })
        }
    );

    return handleResponse<any>(response);
}

/**
 * Fetch users from backend API
 * @param skip - Number of records to skip (pagination)
 * @param take - Number of records to fetch
 * @returns Array of users
 */
export async function getUsersFromBackend(
    skip: number = 0,
    take: number = 100
): Promise<User[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.GET_ALL_USERS}?skip=${skip}&take=${take}&isConsultant=false`,
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
            day: 'numeric',
        });

        return {
            id: item.userId,
            fullName,
            email: item.email || 'N/A',
            phone: `+${item.countryCode}${item.phoneNumber}`,
            initials,
            location: {
                city: item.address?.city || 'N/A',
                state: item.address?.state || 'N/A',
            },
            walletBalance: item.walletBalance || 0,
            totalSessions: item.totalSessionsCompleted || 0,
            totalSpend: item.totalMoneySpent || 0,
            status,
            joinedDate,
        };
    });
}

/**
 * Fetch active sessions from backend API
 * @returns Array of active sessions mapped to frontend interface
 */
export async function getActiveSessionsFromBackend(): Promise<Session[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.GET_ACTIVE_SESSIONS}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*'
        }
    });
    const result = await handleResponse<BackendApiResponse<BackendActiveSession[]>>(response);

    return result.data.map((item): Session => {
        // Mode 0 is chat, others are call
        const mode: 'chat' | 'call' = item.mode === 0 ? 'chat' : 'call';

        // Calculate status based on wallet balance vs rate
        // If balance is less than 5 minutes worth of rate, mark as low balance
        const isLowBalance = item.userBalance < (item.ratePerMinute * 5);

        return {
            id: item.sessionId,
            user: {
                name: item.userName,
                phone: item.userPhone,
            },
            consultant: {
                name: item.consultantName,
                category: item.consultantCategory || 'General',
            },
            mode,
            startTime: item.startTime || new Date().toISOString(),
            duration: formatDuration(item.durationSeconds),
            rate: item.ratePerMinute,
            billed: item.totalBilled,
            walletBalance: item.userBalance,
            status: isLowBalance ? 'low_balance' : 'active'
        };
    });
}

/**
 * Format duration in seconds to human readable string (e.g. 1h 2m 3s)
 */
function formatDuration(seconds: number): string {
    if (seconds <= 0) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);

    return parts.join(' ');
}

/**
 * Fetch all transactions from backend API
 * @param skip - Number of records to skip
 * @param take - Number of records to fetch
 * @param userId - Optional User ID to filter
 * @returns Array of transactions mapped to frontend interface
 */
export async function getTransactionsFromBackend(
    skip: number = 0,
    take: number = 100,
    userId?: string | number
): Promise<Transaction[]> {
    const token = localStorage.getItem('token');
    let url = `${API_BASE_URL}${ENDPOINTS.ADMIN.GET_ALL_TRANSACTIONS}?skip=${skip}&take=${take}`;

    if (userId) {
        url += `&userId=${userId}`;
    }

    const response = await fetch(url,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            }
        }
    );

    const result = await handleResponse<BackendApiResponse<BackendTransaction[]>>(response);

    return result.data.map((item): Transaction => {
        // Map backend status and type to frontend equivalents
        // Based on provided data: transactionType 1 = credit, status 1 = success
        const status: Transaction['status'] = item.status === 1 ? 'success' : 'failed';
        const type: Transaction['type'] = item.transactionType === 1 ? 'credit' : 'debit';

        // Format date to be human readable
        const dateObj = new Date(item.timestamp);
        const formattedDate = dateObj.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        return {
            id: item.transactionId,
            user: item.userName,
            amount: item.amount,
            type,
            status,
            method: item.paymentMethod || 'Wallet',
            date: formattedDate,
            // Additional fields for frontend compatibility
            gross: item.amount,
            net: item.amount,
            commission: 0
        };
    });
}

/**
 * Fetch all withdrawal requests from backend API
 * @param skip - Number of records to skip
 * @param take - Number of records to fetch
 * @returns Array of withdrawals mapped to frontend interface
 */
export async function getWithdrawalsFromBackend(
    skip: number = 0,
    take: number = 100
): Promise<Withdrawal[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.GET_ALL_WITHDRAWALS}?skip=${skip}&take=${take}`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
            }
        }
    );

    const result = await handleResponse<BackendApiResponse<BackendWithdrawal[]>>(response);

    return result.data.map((item): Withdrawal => {
        // Map backend status to frontend equivalents
        // 0: Pending, 1: Approved, 2: Rejected, 3: Paid
        const statusMap: Record<number, Withdrawal['status']> = {
            0: 'requested',
            1: 'approved',
            2: 'failed',
            3: 'paid'
        };

        const status = statusMap[item.status] || 'requested';

        // Format date
        const dateObj = new Date(item.requestedAt);
        const formattedDate = dateObj.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        return {
            id: item.requestId,
            consultant: item.consultantName,
            requestedAmount: item.amount,
            availableBalance: item.availableBalance,
            bankDetails: item.bankDetails, // Already formatted from backend
            status,
            requestedDate: formattedDate
        };
    });
}

/**
 * Fetch all disputes from backend API
 * @returns Array of disputes mapped to frontend interface
 */
export async function getDisputesFromBackend(): Promise<Dispute[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.GET_ALL_DISPUTES}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*'
        }
    });

    const result = await handleResponse<BackendApiResponse<BackendDispute[]>>(response);

    return result.data.map((item): Dispute => {
        // Map status (0: Pending, 1: Resolved, 2: Rejected)
        const statusMap: Record<number, Dispute['status']> = {
            0: 'open',
            1: 'resolved',
            2: 'rejected'
        };

        const dateObj = new Date(item.createdAt);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = String(dateObj.getFullYear()).slice(-2);

        const hours = dateObj.getHours();
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;

        const formattedDate = `${day}/${month}/${year} ${displayHours}:${minutes} ${ampm}`;

        return {
            id: item.disputeId,
            session: item.sessionId,
            user: item.userName,
            consultant: item.consultantName,
            category: item.category || 'General',
            amount: item.amount,
            status: statusMap[item.status] || 'open',
            createdAt: formattedDate,
            createdDate: formattedDate, // Match user's requirement for the UI
            description: item.description,
        };
    });
}

/**
 * Resolve a dispute via backend API
 */
export async function resolveDisputeFromBackend(
    disputeId: string,
    approve: boolean,
    partialAmount: number = 0
): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.RESOLVE_DISPUTE}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'accept': '*/*'
        },
        body: JSON.stringify({
            disputeId,
            approve,
            partialAmount
        })
    });

    return handleResponse<any>(response);
}
/**
 * Get dashboard statistics from backend API
 */
export async function getDashboardStats(): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DASHBOARD.GET_STATS}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
        }
    });

    return handleResponse<any>(response);
}

/**
 * Get dashboard overview from backend API
 */
export async function getDashboardOverview(): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DASHBOARD.GET_OVERVIEW}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
        }
    });

    return handleResponse<any>(response);
}

/**
 * Get consultant statistics from backend API
 */
export async function getDashboardConsultantStats(): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DASHBOARD.GET_CONSULTANT_STATS}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
        }
    });

    return handleResponse<any>(response);
}

/**
 * Get session metrics from backend API
 */
export async function getDashboardSessionMetrics(): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DASHBOARD.GET_SESSION_METRICS}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
        }
    });

    return handleResponse<any>(response);
}

/**
 * Get revenue chart data from backend API
 */
export async function getDashboardRevenueChart(days: number = 30): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.DASHBOARD.GET_REVENUE_CHART}?days=${days}`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': 'application/json'
            }
        }
    );

    return handleResponse<any>(response);
}

/**
 * Get analytics data from backend API
 */
export async function getAnalyticsFromBackend(period: string = 'last30'): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.DASHBOARD.GET_ANALYTICS}?period=${period}`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': 'application/json'
            }
        }
    );

    return handleResponse<any>(response);
}

/**
 * Submit a review for a completed session
 */
export async function submitReviewToBackend(
    sessionId: string,
    rating: number,
    comment?: string
): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.SESSION.SUBMIT_REVIEW}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify({
            sessionId,
            rating,
            comment: comment || null
        })
    });

    return handleResponse<any>(response);
}

/**
 * End an active session (Admin operation)
 * @param sessionId - Session ID to end
 * @returns Success status
 */
export async function endSessionFromBackend(sessionId: string): Promise<boolean> {
    const token = localStorage.getItem('token');
    console.log('🔴 Ending session:', sessionId, 'with endpoint:', `${API_BASE_URL}${ENDPOINTS.SESSION.END_SESSION}`);

    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.SESSION.END_SESSION}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'accept': '*/*'
        },
        body: JSON.stringify({
            sessionId: sessionId
        })
    });

    console.log('🔴 End session response status:', response.status);

    const result = await handleResponse<any>(response);
    console.log('🔴 End session result:', result);
    return result.success;
}

/**
 * End an active call session (Admin operation)
 * @param sessionId - Session ID to end
 * @returns Success status
 */
export async function endCallSessionFromBackend(sessionId: string): Promise<boolean> {
    const token = localStorage.getItem('token');
    console.log('🔴 Ending call session:', sessionId, 'with endpoint:', `${API_BASE_URL}${ENDPOINTS.SESSION.END_CALL_SESSION}`);

    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.SESSION.END_CALL_SESSION}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'accept': '*/*'
        },
        body: JSON.stringify({
            sessionId: sessionId
        })
    });

    console.log('🔴 End call session response status:', response.status);

    const result = await handleResponse<any>(response);
    console.log('🔴 End call session result:', result);
    return result.success;
}

/**
 * Send a message in a session (Admin can send without being participant)
 * @param sessionId - Session ID
 * @param message - Message text
 * @returns Message ID
 */
export async function sendMessageToSession(sessionId: string, message: string): Promise<string> {
    const token = localStorage.getItem('token');
    console.log('🟡 Sending message to session:', sessionId, 'message:', message);

    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.SESSION.SEND_MESSAGE}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'accept': '*/*'
        },
        body: JSON.stringify({
            sessionId: sessionId,
            message: message
        })
    });

    console.log('🟡 Send message response status:', response.status);
    const result = await handleResponse<any>(response);
    console.log('🟡 Send message result:', result);
    return result.data;
}

export async function getMyNotifications(skip: number = 0, take: number = 20): Promise<Notification[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.NOTIFICATIONS.GET_MY}?skip=${skip}&take=${take}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
        }
    });
    const result = await handleResponse<BackendApiResponse<BackendNotification[]>>(response);
    return result.data.map(item => ({
        id: item.notificationId,
        userId: item.userId,
        title: item.title,
        body: item.body,
        type: item.type,
        isRead: item.isRead,
        createdAt: item.createdAt
    }));
}

export async function getAllNotificationsFromBackend(skip: number = 0, take: number = 50): Promise<Notification[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.NOTIFICATIONS.GET_ALL_ADMIN}?skip=${skip}&take=${take}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
        }
    });
    const result = await handleResponse<BackendApiResponse<BackendNotification[]>>(response);
    return result.data.map(item => ({
        id: item.notificationId,
        userId: item.userId,
        title: item.title,
        body: item.body,
        type: item.type,
        isRead: item.isRead,
        createdAt: item.createdAt,
        userName: (item as any).userName // Include userName from backend
    }));
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.NOTIFICATIONS.MARK_READ}/${notificationId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*'
        }
    });
    const result = await handleResponse<BackendApiResponse<any>>(response);
    return result.success;
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*'
        }
    });
    const result = await handleResponse<BackendApiResponse<any>>(response);
    return result.success;
}

export async function getUnreadNotificationCount(): Promise<number> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
        }
    });
    const result = await handleResponse<BackendApiResponse<number>>(response);
    return result.data;
}

/**
 * Get user wallet balance from backend API (Admin)
 * @param userId - User ID
 * @returns Balance as number
 */
export async function getUserWalletBalanceFromBackend(userId: string | number): Promise<number> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.GET_USER_WALLET_BALANCE}/${userId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
        }
    });
    const result = await handleResponse<BackendApiResponse<number>>(response);
    return result.data;
}

/**
 * Fetch consultant KYC documents from backend
 * @param consultantProfileId - Consultant Profile ID
 * @returns Array of KYC documents
 */
export async function getConsultantKYCDocuments(consultantProfileId: string): Promise<any[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.KYC.GET_CONSULTANT_DOCUMENTS}/${consultantProfileId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
        }
    });
    const result = await handleResponse<BackendApiResponse<any[]>>(response);
    return result.data;
}

/**
 * Fetch consultant bank details from backend
 * @param consultantId - Consultant User ID
 * @returns Bank details object
 */
export async function getConsultantBankDetails(consultantId: string): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.BANK.GET_CONSULTANT_DETAILS}/${consultantId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
        }
    });
    const result = await handleResponse<BackendApiResponse<any>>(response);
    return result.data;
}

/**
 * Get or create a conversation between a user and a consultant
 */
export async function getOrCreateConversation(userId: string, consultantId: string): Promise<Conversation> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.SESSION.GET_OR_CREATE_CONVERSATION}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify({ userId, consultantId })
    });
    const result = await handleResponse<BackendApiResponse<BackendConversation>>(response);
    return result.data;
}

/**
 * Get chat history for a conversation
 */
export async function getConversationMessages(conversationId: string): Promise<BackendChatMessage[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.SESSION.GET_CONVERSATION_MESSAGES}/${conversationId}/messages`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
        }
    });
    const result = await handleResponse<BackendApiResponse<BackendChatMessage[]>>(response);
    return result.data;
}
