import { CorrespondenceStatus, CorrespondencePriority, CorrespondenceType, EmployeeRole } from "@workspace/api-client-react";

export const statusTranslations: Record<string, string> = {
  [CorrespondenceStatus.pending]: "قيد الانتظار",
  [CorrespondenceStatus.in_progress]: "جاري التنفيذ",
  [CorrespondenceStatus.completed]: "مكتمل",
  [CorrespondenceStatus.rejected]: "مرفوض",
  [CorrespondenceStatus.archived]: "مؤرشف",
};

export const priorityTranslations: Record<string, string> = {
  [CorrespondencePriority.low]: "منخفض",
  [CorrespondencePriority.medium]: "متوسط",
  [CorrespondencePriority.high]: "عالي",
  [CorrespondencePriority.urgent]: "عاجل",
};

export const typeTranslations: Record<string, string> = {
  [CorrespondenceType.incoming]: "وارد",
  [CorrespondenceType.outgoing]: "صادر",
  [CorrespondenceType.internal]: "داخلي",
};

export const roleTranslations: Record<string, string> = {
  [EmployeeRole.admin]: "مدير",
  [EmployeeRole.supervisor]: "مشرف",
  [EmployeeRole.employee]: "موظف",
};

export function getStatusColor(status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  switch (status) {
    case CorrespondenceStatus.pending: return "default";
    case CorrespondenceStatus.in_progress: return "warning";
    case CorrespondenceStatus.completed: return "success";
    case CorrespondenceStatus.rejected: return "destructive";
    case CorrespondenceStatus.archived: return "secondary";
    default: return "default";
  }
}

export function getPriorityColor(priority: string): "default" | "secondary" | "destructive" | "outline" | "warning" {
  switch (priority) {
    case CorrespondencePriority.low: return "secondary";
    case CorrespondencePriority.medium: return "warning";
    case CorrespondencePriority.high: return "outline";
    case CorrespondencePriority.urgent: return "destructive";
    default: return "default";
  }
}
