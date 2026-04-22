/**
 * API Zod schemas — aligned with actual Supabase DB schema
 */
import * as zod from "zod";

// ─── Health ────────────────────────────────────────────────────────────────

export const HealthCheckResponse = zod.object({
  status: zod.string(),
});

// ─── Departments ───────────────────────────────────────────────────────────

export const ListDepartmentsResponseItem = zod.object({
  id: zod.string().uuid(),
  name: zod.string(),
  code: zod.string().nullish(),
  color: zod.string().nullish(),
  createdAt: zod.coerce.date().nullish(),
});
export const ListDepartmentsResponse = zod.array(ListDepartmentsResponseItem);

export const CreateDepartmentBody = zod.object({
  name: zod.string(),
  code: zod.string().nullish(),
  color: zod.string().nullish(),
});

export const GetDepartmentParams = zod.object({
  id: zod.string().uuid(),
});

export const GetDepartmentResponse = ListDepartmentsResponseItem;

export const UpdateDepartmentParams = zod.object({
  id: zod.string().uuid(),
});

export const UpdateDepartmentBody = zod.object({
  name: zod.string().optional(),
  code: zod.string().nullish(),
  color: zod.string().nullish(),
});

export const UpdateDepartmentResponse = ListDepartmentsResponseItem;

export const DeleteDepartmentParams = zod.object({
  id: zod.string().uuid(),
});

export const DeleteDepartmentResponse = zod.object({
  success: zod.boolean(),
  id: zod.string().uuid(),
});

// ─── Employees ─────────────────────────────────────────────────────────────

export const ListEmployeesQueryParams = zod.object({
  departmentId: zod.string().uuid().optional(),
});

export const ListEmployeesResponseItem = zod.object({
  id: zod.string().uuid(),
  fullName: zod.string(),
  email: zod.string(),
  role: zod.enum(["admin", "supervisor", "employee"]),
  departmentId: zod.string().uuid().nullish(),
  departmentName: zod.string().nullish(),
  avatarUrl: zod.string().nullish(),
  employeeCode: zod.string().nullish(),
  phoneNumber: zod.string().nullish(),
  createdAt: zod.coerce.date().nullish(),
});
export const ListEmployeesResponse = zod.array(ListEmployeesResponseItem);

export const CreateEmployeeBody = zod.object({
  fullName: zod.string(),
  email: zod.string(),
  role: zod.enum(["admin", "supervisor", "employee"]),
  departmentId: zod.string().uuid().nullish(),
  employeeCode: zod.string().nullish(),
  phoneNumber: zod.string().min(1),
  temporaryPassword: zod.string().min(6),
});

export const GetEmployeeParams = zod.object({
  id: zod.string().uuid(),
});

export const GetEmployeeResponse = ListEmployeesResponseItem;

export const UpdateEmployeeParams = zod.object({
  id: zod.string().uuid(),
});

export const UpdateEmployeeBody = zod.object({
  fullName: zod.string().optional(),
  email: zod.string().optional(),
  role: zod.enum(["admin", "supervisor", "employee"]).optional(),
  departmentId: zod.string().uuid().nullish(),
  employeeCode: zod.string().nullish(),
  phoneNumber: zod.string().min(1).optional(),
});

export const UpdateEmployeeResponse = ListEmployeesResponseItem;

export const DeleteEmployeeParams = zod.object({
  id: zod.string().uuid(),
});

export const DeleteEmployeeResponse = zod.object({
  success: zod.boolean(),
  id: zod.string().uuid(),
});

// ─── Correspondences ───────────────────────────────────────────────────────

const CorrespondenceStatus = zod.enum(["pending", "in_progress", "approved", "rejected", "archived"]);
const CorrespondencePriority = zod.enum(["low", "normal", "high", "urgent"]);
const CorrespondenceType = zod.enum(["incoming", "outgoing", "internal"]);

export const ListCorrespondencesQueryParams = zod.object({
  status: CorrespondenceStatus.optional(),
  type: CorrespondenceType.optional(),
  departmentId: zod.string().uuid().optional(),
  senderId: zod.string().uuid().optional(),
  viewerId: zod.string().uuid().optional(),
  viewerRole: zod.enum(["admin", "supervisor", "employee"]).optional(),
});

export const CorrespondenceItem = zod.object({
  id: zod.string().uuid(),
  referenceNumber: zod.string(),
  subject: zod.string(),
  body: zod.string().nullish(),
  status: CorrespondenceStatus,
  priority: CorrespondencePriority,
  type: CorrespondenceType,
  senderId: zod.string().uuid().nullish(),
  senderName: zod.string().nullish(),
  senderCode: zod.string().nullish(),
  receiverId: zod.string().uuid().nullish(),
  receiverName: zod.string().nullish(),
  receiverCode: zod.string().nullish(),
  departmentId: zod.string().uuid().nullish(),
  departmentName: zod.string().nullish(),
  attachmentUrl: zod.string().nullish(),
  createdAt: zod.coerce.date().nullish(),
  updatedAt: zod.coerce.date().nullish(),
});

export const ListCorrespondencesResponseItem = CorrespondenceItem;
export const ListCorrespondencesResponse = zod.array(ListCorrespondencesResponseItem);

export const CreateCorrespondenceBody = zod.object({
  subject: zod.string(),
  body: zod.string().nullish(),
  type: CorrespondenceType,
  priority: CorrespondencePriority,
  senderId: zod.string().uuid().nullish(),
  receiverId: zod.string().uuid().nullish(),
  departmentId: zod.string().uuid().nullish(),
  attachmentUrl: zod.string().nullish(),
});

export const GetCorrespondenceParams = zod.object({
  id: zod.string().uuid(),
});

export const CorrespondenceHistoryItem = zod.object({
  id: zod.string().uuid(),
  correspondenceId: zod.string().uuid(),
  action: zod.string(),
  notes: zod.string().nullish(),
  actorId: zod.string().uuid().nullish(),
  actorName: zod.string().nullish(),
  createdAt: zod.coerce.date().nullish(),
});

export const GetCorrespondenceResponse = CorrespondenceItem.and(
  zod.object({
    history: zod.array(CorrespondenceHistoryItem).optional(),
  }),
);

export const UpdateCorrespondenceParams = zod.object({
  id: zod.string().uuid(),
});

export const UpdateCorrespondenceBody = zod.object({
  subject: zod.string().optional(),
  body: zod.string().nullish(),
  status: CorrespondenceStatus.optional(),
  priority: CorrespondencePriority.optional(),
  receiverId: zod.string().uuid().nullish(),
  departmentId: zod.string().uuid().nullish(),
  attachmentUrl: zod.string().nullish(),
});

export const UpdateCorrespondenceResponse = CorrespondenceItem;

export const DeleteCorrespondenceParams = zod.object({
  id: zod.string().uuid(),
});

export const DeleteCorrespondenceResponse = zod.object({
  success: zod.boolean(),
  id: zod.string().uuid(),
});

export const ArchiveCorrespondenceParams = zod.object({
  id: zod.string().uuid(),
});

export const ArchiveCorrespondenceBody = zod.object({
  archiveReason: zod.string().nullish(),
  archivedBy: zod.string().uuid().nullish(),
});

export const AddCorrespondenceHistoryParams = zod.object({
  id: zod.string().uuid(),
});

export const AddCorrespondenceHistoryBody = zod.object({
  action: zod.string(),
  notes: zod.string().nullish(),
  actorId: zod.string().uuid().nullish(),
});

export const CorrespondenceActionBody = zod.object({
  action: zod.enum(["approved", "rejected", "archived"]),
  notes: zod.string().nullish(),
  actorId: zod.string().uuid().nullish(),
  actorRole: zod.enum(["admin", "supervisor", "employee"]).nullish(),
});

// ─── Archive ───────────────────────────────────────────────────────────────

export const ListArchiveQueryParams = zod.object({
  departmentId: zod.string().uuid().optional(),
  year: zod.coerce.number().optional(),
  search: zod.string().optional(),
  fromDate: zod.string().optional(),
  toDate: zod.string().optional(),
  viewerRole: zod.enum(["admin", "supervisor", "employee"]).optional(),
});

export const ArchiveItem = zod.object({
  id: zod.string().uuid(),
  correspondenceId: zod.string().uuid(),
  archivedBy: zod.string().uuid().nullish(),
  archivedByName: zod.string().nullish(),
  archiveReason: zod.string().nullish(),
  createdAt: zod.coerce.date().nullish(),
  correspondence: CorrespondenceItem.nullish(),
});

export const ListArchiveResponseItem = ArchiveItem;
export const ListArchiveResponse = zod.array(ListArchiveResponseItem);

// ─── Dashboard ─────────────────────────────────────────────────────────────

export const GetDashboardSummaryResponse = zod.object({
  totalCorrespondences: zod.number(),
  pendingCount: zod.number(),
  inProgressCount: zod.number(),
  approvedCount: zod.number(),
  archivedCount: zod.number(),
  urgentCount: zod.number(),
  totalDepartments: zod.number(),
  totalEmployees: zod.number(),
});

export const getRecentCorrespondencesQueryLimitDefault = 10;

export const GetRecentCorrespondencesQueryParams = zod.object({
  limit: zod.coerce.number().default(getRecentCorrespondencesQueryLimitDefault),
});

export const GetRecentCorrespondencesResponseItem = CorrespondenceItem;
export const GetRecentCorrespondencesResponse = zod.array(GetRecentCorrespondencesResponseItem);

export const GetCorrespondencesByDepartmentResponseItem = zod.object({
  departmentId: zod.string().uuid(),
  departmentName: zod.string(),
  departmentColor: zod.string().nullish(),
  count: zod.number(),
});
export const GetCorrespondencesByDepartmentResponse = zod.array(GetCorrespondencesByDepartmentResponseItem);

export const GetCorrespondencesByStatusResponseItem = zod.object({
  status: zod.string(),
  count: zod.number(),
});
export const GetCorrespondencesByStatusResponse = zod.array(GetCorrespondencesByStatusResponseItem);

// ─── Notifications ─────────────────────────────────────────────────────────

export const NotificationItem = zod.object({
  id: zod.string().uuid(),
  userId: zod.string().uuid(),
  title: zod.string(),
  message: zod.string(),
  isRead: zod.boolean(),
  createdAt: zod.coerce.date().nullish(),
});
export const ListNotificationsResponse = zod.array(NotificationItem);

export const ListNotificationsQueryParams = zod.object({
  userId: zod.string().uuid(),
});

export const CreateNotificationBody = zod.object({
  userId: zod.string().uuid(),
  title: zod.string(),
  message: zod.string(),
});

export const MarkNotificationReadParams = zod.object({
  id: zod.string().uuid(),
});
