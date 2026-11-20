export type UserRole = 'EMPLOYEE' | 'ADMINISTRATOR' | 'FINANCE' | 'AUDITOR';

export type AuthPortalRole = 'EMPLOYEE' | 'ADMINISTRATOR' | 'FINANCE';

export type AccountStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';

export type RequestStatus = 
  | 'DRAFT'
  | 'SUBMITTED_FOR_APPROVAL'
  | 'APPROVED_BY_ADMIN'
  | 'REJECTED_BY_ADMIN'
  | 'PAYMENT_PROCESSED'
  | 'COMPLETED';

export type StaffTier = 'SENIOR_ACADEMIC' | 'LECTURER_RESEARCHER' | 'ADMIN_SUPPORT';
export type DestinationTier = 'CAPITAL' | 'REGIONAL_CITY' | 'REMOTE_WOREDA';
export type TransportMode = 'UNIVERSITY_VEHICLE' | 'PUBLIC_TRANSPORT' | 'FLIGHT' | 'PERSONAL_CAR';

export interface User {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: UserRole;
  staffTier: StaffTier;
  department: string;
  employeeId: string;
  avatar: string;
  accountStatus?: AccountStatus;
  phone?: string;
  jobPosition?: string;
  createdAt?: string;
  authorizedBy?: string;
}

export interface StoredUserRecord extends User {
  passwordHash: string;
}

export interface AccountInvitation {
  email: string;
  name: string;
  employeeId: string;
  phone: string;
  department: string;
  jobPosition: string;
  role: 'ADMINISTRATOR' | 'FINANCE';
  passwordHash?: string;
  status: 'ACTIVE' | 'CLAIMED' | 'REVOKED';
  authorizedBy: string;
  createdAt?: string;
}

export interface PerDiemBreakdown {
  days: number;
  dailyAllowanceRate: number; // Daily meal/subsistence
  lodgingAllowanceRate: number; // Lodging allowance
  transportAllowance: number;
  incidentals: number;
  totalDaily: number;
  subtotalAllowance: number;
  destinationMultiplier: number;
  totalPerDiem: number;
  currency: string;
}

export interface ApprovalAction {
  reviewedBy: string;
  reviewedAt: string;
  decision: 'APPROVED' | 'REJECTED';
  remarks: string;
}

export interface PaymentDetails {
  voucherNumber: string;
  processedBy: string;
  processedAt: string;
  paymentMethod: 'CBE_BANK_TRANSFER' | 'TELEBIRR' | 'CHEQUE' | 'CASH';
  referenceNumber: string;
  disbursedAmount: number;
  currency: string;
  paymentStatus: 'PAID' | 'PENDING';
}

export interface TravelRequest {
  id: string;
  trackingCode: string;
  employeeUid?: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  department: string;
  destination: string;
  destinationTier: DestinationTier;
  purpose: string;
  departureDate: string;
  returnDate: string;
  daysCount: number;
  transportMode: TransportMode;
  breakdown: PerDiemBreakdown;
  status: RequestStatus;
  createdAt: string;
  submittedAt?: string;
  approval?: ApprovalAction;
  payment?: PaymentDetails;
  notes?: string;
}

export interface WorkflowStageInfo {
  id: string;
  title: string;
  actor: 'Employee' | 'Administrator' | 'Finance';
  description: string;
  servletName: string;
  jspPage: string;
}
