/**
 * API TypeScript schemas — aligned with actual Supabase DB schema
 */

export interface HealthStatus {
  status: string;
}

export interface DeleteResult {
  success: boolean;
  id: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string | null;
  color?: string | null;
  createdAt?: string | null;
}

export interface CreateDepartmentBody {
  name: string;
  code?: string | null;
  color?: string | null;
}

export type EmployeeRole = "admin" | "supervisor" | "employee";

export const EmployeeRole = {
  admin: "admin",
  supervisor: "supervisor",
  employee: "employee",
} as const;

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: EmployeeRole;
  departmentId?: string | null;
  departmentName?: string | null;
  avatarUrl?: string | null;
  employeeCode?: string | null;
  phoneNumber?: string | null;
  createdAt?: string | null;
}

export interface CreateEmployeeBody {
  fullName: string;
  email: string;
  role: EmployeeRole;
  departmentId?: string | null;
  employeeCode?: string | null;
  phoneNumber: string;
  temporaryPassword?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: string | null;
}

export interface CreateNotificationBody {
  userId: string;
  title: string;
  message: string;
}

export type ListNotificationsParams = {
  userId: string;
};

export type CorrespondenceType = "incoming" | "outgoing" | "internal";

export const CorrespondenceType = {
  incoming: "incoming",
  outgoing: "outgoing",
  internal: "internal",
} as const;

export type CorrespondenceStatus = "pending" | "in_progress" | "approved" | "rejected" | "archived";

export const CorrespondenceStatus = {
  pending: "pending",
  in_progress: "in_progress",
  approved: "approved",
  rejected: "rejected",
  archived: "archived",
} as const;

export type CorrespondencePriority = "low" | "normal" | "high" | "urgent";

export const CorrespondencePriority = {
  low: "low",
  normal: "normal",
  high: "high",
  urgent: "urgent",
} as const;

export interface Correspondence {
  id: string;
  referenceNumber: string;
  subject: string;
  body?: string | null;
  type: CorrespondenceType;
  status: CorrespondenceStatus;
  priority: CorrespondencePriority;
  senderId?: string | null;
  senderName?: string | null;
  senderCode?: string | null;
  receiverId?: string | null;
  receiverName?: string | null;
  receiverCode?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  attachmentUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CorrespondenceHistory {
  id: string;
  correspondenceId: string;
  action: string;
  notes?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  createdAt?: string | null;
}

export type CorrespondenceDetail = Correspondence & {
  history?: CorrespondenceHistory[];
};

export interface CreateCorrespondenceBody {
  subject: string;
  body?: string | null;
  type: CorrespondenceType;
  priority: CorrespondencePriority;
  senderId?: string | null;
  receiverId?: string | null;
  departmentId?: string | null;
  attachmentUrl?: string | null;
}

export interface UpdateCorrespondenceBody {
  subject?: string;
  body?: string | null;
  status?: CorrespondenceStatus;
  priority?: CorrespondencePriority;
  receiverId?: string | null;
  departmentId?: string | null;
  attachmentUrl?: string | null;
}

export interface CreateHistoryBody {
  action: string;
  notes?: string | null;
  actorId?: string | null;
}

export interface CorrespondenceActionBody {
  action: "approved" | "rejected" | "archived";
  notes?: string | null;
  actorId?: string | null;
  actorRole?: "admin" | "supervisor" | "employee" | null;
}

export interface Archive {
  id: string;
  correspondenceId: string;
  archivedBy?: string | null;
  archivedByName?: string | null;
  archiveReason?: string | null;
  createdAt?: string | null;
  correspondence?: Correspondence | null;
}

export interface ArchiveCorrespondenceBody {
  archiveReason?: string | null;
  archivedBy?: string | null;
}

export interface DashboardSummary {
  totalCorrespondences: number;
  pendingCount: number;
  inProgressCount: number;
  approvedCount: number;
  archivedCount: number;
  urgentCount: number;
  totalDepartments: number;
  totalEmployees: number;
}

export interface DepartmentCount {
  departmentId: string;
  departmentName: string;
  departmentColor?: string | null;
  count: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export type ListEmployeesParams = {
  departmentId?: string;
};

export type ListCorrespondencesParams = {
  status?: CorrespondenceStatus;
  type?: CorrespondenceType;
  departmentId?: string;
  senderId?: string;
  viewerId?: string;
  viewerRole?: "admin" | "supervisor" | "employee";
};

export type ListArchiveParams = {
  departmentId?: string;
  year?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  viewerRole?: "admin" | "supervisor" | "employee";
};

export type GetRecentCorrespondencesParams = {
  limit?: number;
};
