const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = rawApiBaseUrl && rawApiBaseUrl !== 'undefined'
  ? rawApiBaseUrl
  : 'http://localhost:5041/api';

import { CATEGORY_ENDPOINTS, CONSULTANT_ENDPOINTS, AUTH_ENDPOINTS, SESSION_ENDPOINTS, API_ENDPOINTS, NOTIFICATIONS_ENDPOINTS, DASHBOARD_ENDPOINTS, USER_ENDPOINTS, KYC_ENDPOINTS, DISPUTE_ENDPOINTS, CHAT_ENDPOINTS } from '@/constants/endpoints';
import { SessionState } from '@/types/enums';

/**
 * Dispute API endpoints
 */
export const disputeAPI = {
  raiseDispute: async (sessionId: string, description: string, refundAmount: number = 0): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${DISPUTE_ENDPOINTS.RAISE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          description,
          refundAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to raise dispute: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error raising dispute:', error);
      throw error;
    }
  },
};


// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  statusCode: number;
}

// Category types
export interface Category {
  categoryId: string;
  name: string;
  description?: string;
  isActive: boolean;
  subCategories: Category[];
}

/**
 * Category API endpoints
 */
export const categoryAPI = {
  getAllCategories: async (): Promise<Category[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}${CATEGORY_ENDPOINTS.GET_ALL}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      const result: ApiResponse<Category[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  getCategoriesWithSubcategories: async (): Promise<Category[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories-with-subcategories`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories with subcategories: ${response.statusText}`);
      }

      const result: ApiResponse<Category[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching nested categories:', error);
      throw error;
    }
  },
};

/**
 * Consultant API endpoints
 */
export const consultantAPI = {
  /**
   * Fetch all consultants
   */
  getAllConsultants: async (): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${CONSULTANT_ENDPOINTS.GET_ALL}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch consultants: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching consultants:', error);
      throw error;
    }
  },

  getConsultantsByCategory: async (category: string, skip: number = 0, take: number = 50): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({ category, skip: skip.toString(), take: take.toString() }).toString();
      const response = await fetch(`${API_BASE_URL}${CONSULTANT_ENDPOINTS.GET_BY_CATEGORY}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch consultants by category: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching consultants by category:', error);
      throw error;
    }
  },

  getConsultantProfileById: async (id: string): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      // Using query parameter userId as expected by AccountController
      const response = await fetch(`${API_BASE_URL}${CONSULTANT_ENDPOINTS.GET_USER_BY_ID}?userId=${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch consultant profile: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching consultant by ID:', error);
      throw error;
    }
  },

  // Alias for backward compatibility
  getConsultantById: async (id: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${CONSULTANT_ENDPOINTS.GET_USER_BY_ID}?userId=${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error(`Failed to fetch consultant profile: ${response.statusText}`);
    const result = await response.json();
    return result.data;
  },

  updateConsultantProfile: async (profileData: any): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${USER_ENDPOINTS.UPDATE_PROFILE}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update consultant profile: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating consultant profile:', error);
      throw error;
    }
  },

  updateRates: async (ratesData: {
    chatRatePerMinute: number,
    callRatePerMinute: number,
    discountedChatRate?: number,
    isChatDiscountActive?: boolean,
    discountedCallRate?: number,
    isCallDiscountActive?: boolean,
    discountStart?: string,
    discountEnd?: string
  }): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${CONSULTANT_ENDPOINTS.UPDATE_RATES}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(ratesData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update rates: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating rates:', error);
      throw error;
    }
  },

  updateExpertise: async (id: string, expertise: { categoryIds: string[], subCategoryIds: string[] }): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/consultants/${id}/expertise`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(expertise),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update expertise: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating expertise:', error);
      throw error;
    }
  },

  getExpertise: async (id: string): Promise<string[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/consultants/${id}/expertise`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch expertise: ${response.statusText}`);
      }

      const result: ApiResponse<{ subCategoryNames: string[] }> = await response.json();
      return result.data.subCategoryNames;
    } catch (error) {
      console.error('Error fetching expertise:', error);
      throw error;
    }
  },

  getExpertiseSelection: async (id: string): Promise<{ categoryIds: string[], subCategoryIds: string[] }> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/consultants/${id}/expertise-selection`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch expertise selection: ${response.statusText}`);
      }

      const result: ApiResponse<{ categoryIds: string[], subCategoryIds: string[] }> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching expertise selection:', error);
      throw error;
    }
  },
};

/**
 * Authentication API endpoints
 */
export const authAPI = {
  /**
   * Generate OTP for email-based login/signup
   */
  generateEmailOTP: async (email: string): Promise<any> => {
    try {
      const queryParams = new URLSearchParams({ email }).toString();
      const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.GENERATE_EMAIL_OTP}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        let errorMsg = response.statusText;
        try {
          const errorText = await response.text();
          if (errorText) errorMsg = `${errorMsg} - ${errorText}`;
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(`Failed to generate email OTP: ${errorMsg}`);
      }

      // Handle cases where response might be plain text or JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error('Error generating email OTP:', error);
      throw error;
    }
  },

  // Backward-compatible alias
  generateOTP: async (email: string): Promise<any> => {
    return authAPI.generateEmailOTP(email);
  },

  /**
   * Login user with phone number and OTP
   */
  loginWithPhone: async (
    countryCode: string,
    phoneNumber: string,
    otp: string
  ): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.LOGIN_WITH_PHONE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
        body: JSON.stringify({
          countryCode,
          phoneNumber,
          otp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error logging in with phone:', error);
      throw error;
    }
  },

  loginWithEmailOtp: async (email: string, otp: string): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.LOGIN_WITH_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error logging in with email OTP:', error);
      throw error;
    }
  },

  // Backward-compatible alias
  loginWithEmail: async (email: string, otp: string): Promise<any> => {
    return authAPI.loginWithEmailOtp(email, otp);
  },

  login: async (email: string, otp: string): Promise<any> => {
    return authAPI.loginWithEmailOtp(email, otp);
  },

  /**
   * Verify OTP (standalone verification)
   */
  verifyOTP: async (
    countryCode: string,
    phoneNumber: string,
    otp: string
  ): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.VERIFY_OTP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
        body: JSON.stringify({
          countryCode,
          phoneNumber,
          otp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Verification failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  },

  verifyEmailOTP: async (email: string, otp: string): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.VERIFY_EMAIL_OTP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || `Verification failed: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      throw error;
    }
  },

  /**
   * Register user
   */
  register: async (userData: any): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  },

  signupWithEmail: async (payload: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    otp: string;
    isConsultant: boolean;
  }): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.SIGNUP_WITH_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || `Signup failed: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  },
};

export interface UserSession {
  consultantId: string;
  sessionId: string;
  userId: string;
  userName: string;
  mode: number;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  totalChargedAmount: number;
  consultantEarnings: number;
  state: SessionState;
  rating: number;
  reviewComment: string;
  bidAmount?: number;
  maxAllowedEndTime?: string;
  profilePhotoUrl?: string;
  isDisputed?: boolean;
  agoraToken?: string;
  appliedRate?: number;
}

export interface PaginatedSessionHistory {
  sessions: UserSession[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface UserHistoryResponse extends PaginatedSessionHistory { }

/**
 * Session API endpoints
 */
export const sessionAPI = {
  getRequests: async (): Promise<UserSession[]> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${SESSION_ENDPOINTS.REQUESTS}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch session requests: ${response.statusText}`);
      }

      const result: ApiResponse<any[]> = await response.json();

      // Map API response to UserSession interface
      return (result.data || []).map((req: any) => ({
        sessionId: req.sessionId,
        userId: req.userId,
        consultantId: req.consultantId,
        userName: req.userName,
        mode: req.mode,
        startTime: req.requestedAt, // Map requestedAt to startTime for UI compatibility
        endTime: '',
        durationSeconds: 0,
        totalChargedAmount: req.totalChargedAmount || 0,
        consultantEarnings: req.consultantEarnings || 0,
        state: req.state,
        rating: 0,
        reviewComment: '',
        bidAmount: req.bidAmount || 0
      }));
    } catch (error) {
      console.error('Error fetching session requests:', error);
      throw error;
    }
  },

  getUserHistory: async (skip: number = 0, take: number = 5, status?: SessionState, startDate?: string, endDate?: string): Promise<PaginatedSessionHistory> => {
    try {
      const token = localStorage.getItem('token');
      const params: any = { skip: skip.toString(), take: take.toString() };
      if (status !== undefined) params.status = status.toString();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const queryParams = new URLSearchParams(params).toString();

      const response = await fetch(`${API_BASE_URL}${SESSION_ENDPOINTS.USER_HISTORY}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch session history: ${response.statusText}`);
      }

      const result: ApiResponse<UserHistoryResponse> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching session history:', error);
      throw error;
    }
  },

  getSessionById: async (sessionId: string): Promise<UserSession> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${SESSION_ENDPOINTS.GET_BY_ID(sessionId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch session: ${response.statusText}`);
      }

      const result: ApiResponse<UserSession> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  },

  accept: async (sessionId: string): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${SESSION_ENDPOINTS.HANDLE_REQUEST}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          accept: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.Message || response.statusText;
        console.error('Accept session failed:', errorData);
        throw new Error(`Failed to accept session: ${errorMessage}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error accepting session:', error);
      throw error;
    }
  },

  decline: async (sessionId: string): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${SESSION_ENDPOINTS.HANDLE_REQUEST}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          accept: false
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to decline session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error declining session:', error);
      throw error;
    }
  },

  submitReview: async (sessionId: string, rating: number, reviewComment: string): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${SESSION_ENDPOINTS.SUBMIT_REVIEW}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          rating,
          comment: reviewComment,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit review: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  },

  getConsultantReviews: async (consultantId: string, skip: number = 0, take: number = 5): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${SESSION_ENDPOINTS.GET_CONSULTANT_REVIEWS(consultantId)}?skip=${skip}&take=${take}`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch consultant reviews: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching consultant reviews:', error);
      throw error;
    }
  },

  endSession: async (sessionId: string): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${SESSION_ENDPOINTS.END_CHAT_SESSION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  },

  endCallSession: async (sessionId: string): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${SESSION_ENDPOINTS.END_CALL_SESSION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  },
};

export interface WalletTransaction {
  transactionId: string;
  userId: string;
  userName: string;
  amount: number;
  transactionType: number; // 0 for credit ? 1 for debit? Or 1 for credit, 0/2 for debit? Based on user input: 1 is Refund.
  status: number;
  paymentMethod: string;
  timestamp: string;
  referenceId: string;
}

export interface WalletTransactionsResponse {
  totalEarnings: number;
  transactions: WalletTransaction[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface Withdrawal {
  requestId: string;
  consultantUserId: string;
  consultantName: string;
  consultantEmail: string;
  consultantPhone: string;
  amount: number;
  availableBalance: number;
  bankDetails: string;
  status: number;
  requestedAt: string;
}

export interface PaginatedWithdrawalResponse {
  withdrawals: Withdrawal[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Payment API endpoints
 */
export const paymentAPI = {
  getWalletTransactions: async (skip: number = 0, take: number = 50, startDate?: string, endDate?: string): Promise<WalletTransactionsResponse> => {
    try {
      const token = localStorage.getItem('token');
      const params: any = { skip: skip.toString(), take: take.toString() };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const queryParams = new URLSearchParams(params).toString();

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PAYMENT.GET_WALLET_TRANSACTIONS}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wallet transactions: ${response.statusText}`);
      }

      const result: ApiResponse<WalletTransactionsResponse> = await response.json();
      return {
        totalEarnings: result.data?.totalEarnings || 0,
        transactions: result.data?.transactions || [],
        totalCount: result.data?.totalCount || 0,
        totalPages: result.data?.totalPages || 1,
        currentPage: result.data?.currentPage || 1
      };
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      throw error;
    }
  },

  getWalletBalance: async (): Promise<number> => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PAYMENT.GET_WALLET_BALANCE}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wallet balance: ${response.statusText}`);
      }

      const result: ApiResponse<number> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw error;
    }
  },

  addMoney: async (amount: number): Promise<string> => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PAYMENT.ADD_MONEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create payment session: ${response.statusText}`);
      }

      const result: ApiResponse<string> = await response.json();
      return result.data; // Returns the Stripe checkout URL
    } catch (error) {
      console.error('Error creating payment session:', error);
      throw error;
    }
  },

  requestWithdrawal: async (amount: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PAYMENT.REQUEST_WITHDRAWAL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to request withdrawal: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      throw error;
    }
  },

  getWithdrawalHistory: async (skip: number = 0, take: number = 50): Promise<PaginatedWithdrawalResponse> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PAYMENT.GET_WITHDRAWAL_HISTORY}?skip=${skip}&take=${take}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch withdrawal history: ${response.statusText}`);
      }

      const result: ApiResponse<PaginatedWithdrawalResponse> = await response.json();
      return {
        withdrawals: result.data?.withdrawals || [],
        totalCount: result.data?.totalCount || 0,
        totalPages: result.data?.totalPages || 1,
        currentPage: result.data?.currentPage || 1
      };
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
      throw error;
    }
  },

  getBankDetails: async (): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PAYMENT.GET_BANK_DETAILS}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bank details: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching bank details:', error);
      throw error;
    }
  },

  getConsultantBankDetails: async (consultantId: string): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PAYMENT.GET_CONSULTANT_BANK_DETAILS(consultantId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch consultant bank details: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching consultant bank details:', error);
      throw error;
    }
  },

  updateBankDetails: async (bankData: any): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PAYMENT.UPDATE_BANK_DETAILS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bankData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update bank details: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating bank details:', error);
      throw error;
    }
  },
};

/**
 * User API endpoints
 */
export const userAPI = {
  getUserById: async (userId: string): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({ userId }).toString();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.GET_CURRENT_USER}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  uploadProfilePhoto: async (file: File): Promise<string> => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}${USER_ENDPOINTS.UPLOAD_PROFILE_PHOTO}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload profile photo: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data; // Returns the photo URL
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  },

  updateProfile: async (userId: string, profileData: any): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        userId,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        bio: profileData.bio,
        phoneNumber: profileData.phoneNumber,
        email: profileData.email,
        profilePhotoUrl: profileData.profilePhotoUrl,
        // Flatten address fields for the backend
        addressLine: profileData.address?.addressLine || profileData.addressLine,
        city: profileData.address?.city || profileData.city,
        state: profileData.address?.state || profileData.state,
        zipcode: profileData.address?.zipcode || profileData.zipcode,
        country: profileData.address?.country || profileData.country,
      };

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.UPDATE_PROFILE}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  getRecentActivities: async (): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${USER_ENDPOINTS.GET_ACTIVITIES}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },
};

/**
 * Chat API endpoints
 */
export const chatAPI = {
  /**
   * Create a chat session with one or more users
   */
  createSession: async (userIds: string[], mode: number = 0): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAT.CREATE_SESSION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userIds,
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create chat session: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  },

  /**
   * Send a message in a chat session
   */
  sendMessage: async (sessionId: string, message: string): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAT.SEND_MESSAGE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Get message history for a session
   */
  getMessages: async (sessionId: string): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAT.GET_MESSAGES(sessionId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  /**
   * End a chat session
   */
  endSession: async (sessionId: string): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SESSION.END_CHAT_SESSION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to end chat session: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error ending chat session:', error);
      throw error;
    }
  },

  getOrCreateConversation: async (peerId: string): Promise<any> => {
    try {
      // Try multiple token keys - legacy sessions stored under 'token', new ones under 'authToken'
      const token = localStorage.getItem('authToken')
        || localStorage.getItem('token')
        || (() => { try { return JSON.parse(localStorage.getItem('authState') || '{}').token; } catch { return null; } })();
      const myUserId = localStorage.getItem('userId');

      // Get role - check dedicated key first, then fall back to authState
      let myRole = localStorage.getItem('userRole');
      if (!myRole) {
        try {
          const authState = JSON.parse(localStorage.getItem('authState') || '{}');
          myRole = authState.role || null;
        } catch { /* ignore */ }
      }

      if (!myUserId) throw new Error("User ID not found in localStorage");
      if (!token) throw new Error("Auth token not found in localStorage");

      // Role-aware: Conversations table has (UserId = user, ConsultantId = consultant)
      // Send IDs in the correct fields based on who is calling
      const isConsultant = myRole === 'consultant';
      const requestBody = isConsultant
        ? { userId: peerId, consultantId: myUserId }   // I am the consultant, peer is the user
        : { userId: myUserId, consultantId: peerId };  // I am the user, peer is the consultant

      console.log(`[API] getOrCreateConversation: role=${myRole}, myId=${myUserId}, peerId=${peerId}`, requestBody);

      const response = await fetch(`${API_BASE_URL}${CHAT_ENDPOINTS.GET_OR_CREATE_CONVERSATION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[API] getOrCreateConversation failed:', response.status, errText);
        throw new Error(`Failed to get/create conversation: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  },

  getConversationMessages: async (conversationId: string): Promise<any[]> => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token')
        || (() => { try { return JSON.parse(localStorage.getItem('authState') || '{}').token; } catch { return null; } })();
      const response = await fetch(`${API_BASE_URL}${CHAT_ENDPOINTS.GET_CONVERSATION_MESSAGES(conversationId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversation messages: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      throw error;
    }
  },
};

/**
 * Notification API Service
 */
export const notificationAPI = {
  /**
   * Get all notifications for the current user
   */
  getMyNotifications: async (skip: number = 0, take: number = 20): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${NOTIFICATIONS_ENDPOINTS.GET_MY}?skip=${skip}&take=${take}`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${NOTIFICATIONS_ENDPOINTS.UNREAD_COUNT}`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unread count: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${NOTIFICATIONS_ENDPOINTS.MARK_ALL_READ}`, {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark all as read: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  /**
   * Mark a specific notification as read
   */
  markAsRead: async (notificationId: string): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${NOTIFICATIONS_ENDPOINTS.MARK_READ(notificationId)}`, {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
};

/**
 * Dashboard API Service
 */
export const dashboardAPI = {
  /**
   * Get consultant dashboard stats
   */
  getAdvisorStats: async (): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${DASHBOARD_ENDPOINTS.ADVISOR_STATS}`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch advisor stats: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching advisor stats:', error);
      throw error;
    }
  },

  /**
   * Update consultant online status
   */
  updateOnlineStatus: async (isOnline: boolean): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${DASHBOARD_ENDPOINTS.UPDATE_STATUS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: isOnline ? 1 : 0 // Fixed: 1 for online, 0 for offline based on behavior observation
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  },

  /**
   * Get user dashboard stats
   */
  getUserStats: async (): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${DASHBOARD_ENDPOINTS.USER_STATS}`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },
};

/**
 * KYC API Service
 */
export const kycAPI = {
  uploadDocument: async (documentType: string, file: File): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('DocumentType', documentType);
      formData.append('File', file);

      const response = await fetch(`${API_BASE_URL}${KYC_ENDPOINTS.UPLOAD}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to upload document: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  getMyDocuments: async (): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${KYC_ENDPOINTS.GET_MY}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  getConsultantDocuments: async (consultantProfileId: string): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${KYC_ENDPOINTS.GET_CONSULTANT(consultantProfileId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch consultant documents: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching consultant documents:', error);
      throw error;
    }
  },

  updateStatus: async (docId: string, status: number, feedback?: string): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${KYC_ENDPOINTS.UPDATE_STATUS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          DocId: docId,
          Status: status,
          AdminFeedback: feedback,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  },
};
