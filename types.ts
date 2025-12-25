export interface FoundItem {
  id: string;
  collegeId: string; // The college/org ID this item belongs to
  finderId: string;  // The user who found it
  claimerId?: string; // The user who claimed it
  image: string;     // Base64 string
  name: string;
  description: string;
  dateFound: string; // ISO Date string
  location?: string;
  status: 'Unclaimed' | 'Claimed' | 'Pending';
  tags: string[];
}

export interface User {
  studentId: string;
  collegeId: string;
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'UPLOAD' | 'ITEM_DETAIL' | 'PROFILE';

export interface AIAnalysisResult {
  name: string;
  description: string;
  category: string;
  tags: string[];
  suggestedLocation?: string;
}