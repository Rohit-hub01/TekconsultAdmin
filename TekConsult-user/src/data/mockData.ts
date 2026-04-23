// Mock data for the consultation platform

export interface User {
  id: string;
  phone: string;
  email: string;
  name: string;
  location: string;
  walletBalance: number;
  role: 'user' | 'consultant';
  joiningDate?: string;
}

export interface Consultant {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  category: string;
  subcategory: string;
  rating: number;
  totalReviews: number;
  chatRate: number;
  callRate: number;
  originalChatRate?: number;
  originalCallRate?: number;
  discountedChatRate?: number;
  isChatDiscountActive?: boolean;
  discountedCallRate?: number;
  isCallDiscountActive?: boolean;
  discountStart?: string;
  discountEnd?: string;
  freeMinutes: number;
  isOnline: boolean;
  isVerified: boolean;
  experience: number;
  languages: string[];
  bio: string;
  totalConsultations: number;
  earnings: number;
  pendingWithdrawal: number;
  gender?: string;
  reviews?: Review[];
  joiningDate?: string;
  expertise?: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
  consultantCount: number;
}

export interface Session {
  id: string;
  consultantId: string;
  consultantName: string;
  consultantAvatar: string;
  userId: string;
  type: 'chat' | 'call';
  status: 'active' | 'completed' | 'paused';
  startTime: Date;
  endTime?: Date;
  duration: number;
  amount: number;
  rating?: number;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: Date;
  status: 'success' | 'pending' | 'failed';
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    phone: '9876543210',
    email: 'amit@example.com',
    name: 'Amit Kumar',
    location: 'Mumbai, India',
    walletBalance: 1250,
    role: 'user',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    phone: '9876543211',
    email: 'priya@example.com',
    name: 'Priya Sharma',
    location: 'Delhi, India',
    walletBalance: 500,
    role: 'user',
  },
];

// Mock Consultants
export const mockConsultants: Consultant[] = [
  {
    id: 'cf111111-1111-1111-1111-111111111111',
    name: 'Dr. Rajesh Khanna',
    phone: '9123456789',
    email: 'rajesh@example.com',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
    category: 'Health & Wellness',
    subcategory: 'General Physician',
    rating: 4.8,
    totalReviews: 342,
    chatRate: 15,
    callRate: 25,
    freeMinutes: 3,
    isOnline: true,
    isVerified: true,
    experience: 12,
    languages: ['English', 'Hindi'],
    bio: 'Experienced general physician with expertise in preventive care and lifestyle management.',
    totalConsultations: 1250,
    earnings: 45000,
    pendingWithdrawal: 5000,
  },
  {
    id: 'cf222222-2222-2222-2222-222222222222',
    name: 'Adv. Meera Patel',
    phone: '9123456790',
    email: 'meera@example.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    category: 'Legal',
    subcategory: 'Family Law',
    rating: 4.9,
    totalReviews: 218,
    chatRate: 20,
    callRate: 35,
    freeMinutes: 2,
    isOnline: true,
    isVerified: true,
    experience: 8,
    languages: ['English', 'Hindi', 'Gujarati'],
    bio: 'Specialized in family law, divorce proceedings, and child custody cases.',
    totalConsultations: 890,
    earnings: 62000,
    pendingWithdrawal: 12000,
  },
  {
    id: 'cf333333-3333-3333-3333-333333333333',
    name: 'CA Vikram Singh',
    phone: '9123456791',
    email: 'vikram@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    category: 'Finance',
    subcategory: 'Tax Consultant',
    rating: 4.7,
    totalReviews: 156,
    chatRate: 18,
    callRate: 30,
    freeMinutes: 5,
    isOnline: false,
    isVerified: true,
    experience: 15,
    languages: ['English', 'Hindi'],
    bio: 'Chartered Accountant with expertise in tax planning, GST, and financial advisory.',
    totalConsultations: 650,
    earnings: 38000,
    pendingWithdrawal: 8000,
  },
  {
    id: 'cf444444-4444-4444-4444-444444444444',
    name: 'Astro Sunita Devi',
    phone: '9123456792',
    email: 'sunita@example.com',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    category: 'Astrology',
    subcategory: 'Vedic Astrology',
    rating: 4.6,
    totalReviews: 523,
    chatRate: 12,
    callRate: 20,
    freeMinutes: 3,
    isOnline: true,
    isVerified: true,
    experience: 20,
    languages: ['Hindi', 'Sanskrit'],
    bio: 'Expert in Vedic astrology, horoscope reading, and life guidance.',
    totalConsultations: 2100,
    earnings: 78000,
    pendingWithdrawal: 15000,
  },
  {
    id: 'cf555555-5555-5555-5555-555555555555',
    name: 'Dr. Ananya Rao',
    phone: '9123456793',
    email: 'ananya@example.com',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
    category: 'Health & Wellness',
    subcategory: 'Psychologist',
    rating: 4.9,
    totalReviews: 189,
    chatRate: 25,
    callRate: 40,
    freeMinutes: 0,
    isOnline: true,
    isVerified: true,
    experience: 10,
    languages: ['English', 'Hindi', 'Kannada'],
    bio: 'Clinical psychologist specializing in anxiety, depression, and relationship counseling.',
    totalConsultations: 720,
    earnings: 55000,
    pendingWithdrawal: 0,
  },
  {
    id: 'cf6666666-6666-6666-6666-666666666666',
    name: 'Tech Guru Rahul',
    phone: '9123456794',
    email: 'rahul@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    category: 'Technology',
    subcategory: 'Career Counseling',
    rating: 4.5,
    totalReviews: 98,
    chatRate: 15,
    callRate: 25,
    freeMinutes: 5,
    isOnline: false,
    isVerified: true,
    experience: 6,
    languages: ['English', 'Hindi'],
    bio: 'Tech career mentor helping professionals navigate career transitions and growth.',
    totalConsultations: 340,
    earnings: 22000,
    pendingWithdrawal: 2000,
  },
];

// Mock Categories
export const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Lawyers',
    icon: '👨‍💼',
    subcategories: ['Family Law', 'Criminal Law', 'Property Law', 'Corporate Law'],
    consultantCount: 156,
  },
  {
    id: 'cat-2',
    name: 'Digital Marketers',
    icon: '📢',
    subcategories: ['SEO', 'Social Media', 'Content Strategy', 'PPC'],
    consultantCount: 89,
  },
  {
    id: 'cat-3',
    name: 'Health Consultants',
    icon: '🩺',
    subcategories: ['General Health', 'Mental Wellness', 'Nutrition', 'Yoga'],
    consultantCount: 312,
  },
  {
    id: 'cat-4',
    name: 'Startup Mentors',
    icon: '💼',
    subcategories: ['Product Strategy', 'Fundraising', 'Early Stage', 'Scaling'],
    consultantCount: 124,
  },
  {
    id: 'cat-5',
    name: 'Counsellors',
    icon: '👥',
    subcategories: ['Relationship', 'Career', 'Life Coach', 'Stress Management'],
    consultantCount: 204,
  },
  {
    id: 'cat-6',
    name: 'Fitness Coaches',
    icon: '🏋️‍♂️',
    subcategories: ['Weight Loss', 'Bodybuilding', 'Flexibility', 'Endurance'],
    consultantCount: 178,
  },
  {
    id: 'cat-7',
    name: 'Interior Consultants',
    icon: '🛋️',
    subcategories: ['Modern Design', 'Office Spaces', 'Residential', 'Lighting'],
    consultantCount: 92,
  },
];

// Mock Sessions
export const mockSessions: Session[] = [
  {
    id: 'af111111-1111-1111-1111-111111111111',
    consultantId: 'cf111111-1111-1111-1111-111111111111',
    consultantName: 'Dr. Rajesh Khanna',
    consultantAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
    userId: '11111111-1111-1111-1111-111111111111',
    type: 'chat',
    status: 'completed',
    startTime: new Date('2026-02-01T10:30:00'),
    endTime: new Date('2026-02-01T10:45:00'),
    duration: 15,
    amount: 225,
    rating: 5,
  },
  {
    id: 'af222222-2222-2222-2222-222222222222',
    consultantId: 'cf222222-2222-2222-2222-222222222222',
    consultantName: 'Adv. Meera Patel',
    consultantAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    userId: '11111111-1111-1111-1111-111111111111',
    type: 'call',
    status: 'completed',
    startTime: new Date('2026-01-28T14:00:00'),
    endTime: new Date('2026-01-28T14:20:00'),
    duration: 20,
    amount: 700,
    rating: 4,
  },
];

// Mock Transactions
export const mockTransactions: Transaction[] = [
  {
    id: 'txn-1',
    type: 'credit',
    amount: 1000,
    description: 'Wallet Recharge via UPI',
    date: new Date('2026-02-01T09:00:00'),
    status: 'success',
  },
  {
    id: 'txn-2',
    type: 'debit',
    amount: 225,
    description: 'Chat with Dr. Rajesh Khanna',
    date: new Date('2026-02-01T10:45:00'),
    status: 'success',
  },
  {
    id: 'txn-3',
    type: 'credit',
    amount: 500,
    description: 'Wallet Recharge via Card',
    date: new Date('2026-01-28T13:30:00'),
    status: 'success',
  },
  {
    id: 'txn-4',
    type: 'debit',
    amount: 700,
    description: 'Call with Adv. Meera Patel',
    date: new Date('2026-01-28T14:20:00'),
    status: 'success',
  },
];

// Mock Reviews
export const mockReviews: Review[] = [
  {
    id: 'rev-1',
    userId: '11111111-1111-1111-1111-111111111111',
    userName: 'Amit K.',
    rating: 5,
    comment: 'Excellent consultation! Very helpful and knowledgeable.',
    date: new Date('2026-02-01'),
  },
  {
    id: 'rev-2',
    userId: '22222222-2222-2222-2222-222222222222',
    userName: 'Priya S.',
    rating: 4,
    comment: 'Good advice, but the session felt a bit rushed.',
    date: new Date('2026-01-30'),
  },
  {
    id: 'rev-3',
    userId: '11111111-1111-1111-1111-111111111111',
    userName: 'Rahul M.',
    rating: 5,
    comment: 'Amazing experience! Will definitely consult again.',
    date: new Date('2026-01-28'),
  },
];

// Dummy login credentials
export const dummyCredentials = {
  user: {
    phone: '9876543210',
    otp: '123456',
  },
  consultant: {
    phone: '9123456789',
    otp: '654321',
  },
};
