import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useListEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  getListEmployeesQueryKey,
  useListDepartments,
  useDeleteEmployee,
  useCreateNotification,
} from "@workspace/api-client-react";
import { EmployeeRole } from "@workspace/api-client-react";
import type { Employee } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Trash2, Pencil, RefreshCw, Eye, EyeOff, Bell, KeyRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { roleTranslations } from "@/lib/translations";
import { Badge } from "@/components/ui/badge";

const createSchema = z.object({
  fullName: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  role: z.nativeEnum(EmployeeRole),
  departmentId: z.string().optional(),
  employeeCode: z.string().optional(),
  phoneNumber: z.string().min(1, "رقم الهاتف مطلوب"),
  temporaryPassword: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

const editSchema = z.object({
  fullName: z.string().min(2, "الاسم مطلوب"),
  role: z.nativeEnum(EmployeeRole),
  departmentId: z.string().optional(),
  employeeCode: z.string().optional(),
  phoneNumber: z.string().min(1, "رقم الهاتف مطلوب"),
});

const notifSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  message: z.string().min(1, "الرسالة مطلوبة"),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;
type NotifValues = z.infer<typeof notifSchema>;

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function generateUniqueCode(existingCodes: Set<string>): string {
  let code: string;
  do {
    code = Array.from({ length: 6 }, () =>
      ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
    ).join("");
  } while (existingCodes.has(code));
  return code;
}

export default function Employees() {
  const { hasRole, user, session } = useAuth();
  const isAdmin = hasRole("admin");
  const isSupervisorOrAdmin = hasRole("admin", "supervisor");
  const isSuperAdmin = user?.email === "master@delta.edu.eg";
  const { data: employees, isLoading } = useListEmployees();
  const { data: departments } = useListDepartments();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const createNotification = useCreateNotification();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [notifTarget, setNotifTarget] = useState<Employee | null>(null);
  const [resetTarget, setResetTarget] = useState<Employee | null>(null);
  const [resetting, setResetting] = useState(false);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { fullName: "", email: "", role: EmployeeRole.employee, employeeCode: "", phoneNumber: "", temporaryPassword: "" },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  const notifForm = useForm<NotifValues>({
    resolver: zodResolver(notifSchema),
    defaultValues: { title: "", message: "" },
  });

  function onCreateSubmit(values: CreateValues) {
    createEmployee.mutate(
      {
        data: {
          fullName: values.fullName,
          email: values.email,
          role: values.role,
          departmentId: values.departmentId && values.departmentId !== "none" ? values.departmentId : undefined,
          employeeCode: values.employeeCode || undefined,
          phoneNumber: values.phoneNumber || undefined,
          temporaryPassword: values.temporaryPassword,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "تم إضافة الموظف بنجاح" });
          queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
          setCreateOpen(false);
          createForm.reset();
        },
        onError: (err: unknown) => {
          const msg = (err as { message?: string })?.message ?? "حدث خطأ أثناء الإضافة";
          toast({ title: msg, variant: "destructive" });
        },
      }
    );
  }

  function openEdit(emp: Employee) {
    setEditTarget(emp);
    editForm.reset({
      fullName: emp.fullName,
      role: emp.role as EmployeeRole,
      departmentId: emp.departmentId ?? undefined,
      employeeCode: emp.employeeCode ?? "",
      phoneNumber: emp.phoneNumber ?? "",
    });
  }

  function onEditSubmit(values: EditValues) {
    if (!editTarget) return;
    updateEmployee.mutate(
      {
        id: editTarget.id,
        data: {
          fullName: values.fullName,
          role: values.role,
          departmentId: values.departmentId && values.departmentId !== "none" ? values.departmentId : null,
          employeeCode: values.employeeCode || null,
          phoneNumber: values.phoneNumber || null,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "تم تحديث بيانات الموظف" });
          queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
          setEditTarget(null);
        },
        onError: () => {
          toast({ title: "حدث خطأ أثناء التحديث", variant: "destructive" });
        },
      }
    );
  }

  function handleDelete(id: string) {
    if (confirm("هل أنت متأكد من حذف هذا الموظف؟")) {
      deleteEmployee.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "تم الحذف بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
          },
        }
      );
    }
  }

  async function handleResetPassword() {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/employees/${resetTarget.id}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل إعادة التعيين");
      toast({
        title: `تم إعادة تعيين كلمة مرور ${resetTarget.fullName}`,
        description: `كلمة المرور الجديدة: ${data.password}`,
        duration: 15000,
      });
    } catch (err: unknown) {
      toast({ title: (err as Error).message, variant: "destructive" });
    } finally {
      setResetting(false);
      setResetTarget(null);
    }
  }

  function onNotifSubmit(values: NotifValues) {
    if (!notifTarget) return;
    createNotification.mutate(
      { data: { userId: notifTarget.id, title: values.title, message: values.message } },
      {
        onSuccess: () => {
          toast({ title: "تم إرسال الإشعار بنجاح" });
          setNotifTarget(null);
          notifForm.reset();
        },
        onError: () => {
          toast({ title: "حدث خطأ أثناء إرسال الإشعار", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-gray-500" />
          <h1 className="text-2xl font-bold">إدارة الموظفين</h1>
        </div>

        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setShowCreatePassword(false); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 ml-2" /> إضافة موظف</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة موظف جديد</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم</FormLabel>
                        <FormControl><Input placeholder="أدخل الاسم" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="employeeCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الموظف <span className="text-muted-foreground text-xs">(اختياري)</span></FormLabel>
                        <div className="flex gap-2">
                          <FormControl><Input placeholder="مثال: EMP-001" {...field} /></FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            title="توليد رقم تلقائي"
                            onClick={() => {
                              const existing = new Set(
                                employees?.map((e) => e.employeeCode).filter(Boolean) as string[]
                              );
                              field.onChange(generateUniqueCode(existing));
                            }}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl><Input placeholder="أدخل البريد الإلكتروني" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهاتف</FormLabel>
                        <FormControl><Input placeholder="مثال: 0501234567" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="temporaryPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور المؤقتة</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showCreatePassword ? "text" : "password"}
                              placeholder="6 أحرف على الأقل"
                              className="pl-10"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowCreatePassword((v) => !v)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                            tabIndex={-1}
                            aria-label={showCreatePassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                          >
                            {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الدور</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(EmployeeRole).map(([key, value]) => (
                              <SelectItem key={key} value={value}>{roleTranslations[value]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>القسم</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">بدون قسم</SelectItem>
                            {departments?.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={createEmployee.isPending}>حفظ</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات الموظف</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="employeeCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الموظف <span className="text-muted-foreground text-xs">(اختياري)</span></FormLabel>
                    <div className="flex gap-2">
                      <FormControl><Input placeholder="مثال: EMP-001" {...field} /></FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="توليد رقم تلقائي"
                        onClick={() => {
                          const existing = new Set(
                            employees
                              ?.filter((e) => e.id !== editTarget?.id)
                              .map((e) => e.employeeCode)
                              .filter(Boolean) as string[]
                          );
                          field.onChange(generateUniqueCode(existing));
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl><Input placeholder="مثال: 0501234567" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدور</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(EmployeeRole).map(([key, value]) => (
                          <SelectItem key={key} value={value}>{roleTranslations[value]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>القسم</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">بدون قسم</SelectItem>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={updateEmployee.isPending}>حفظ التعديلات</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(open) => { if (!open) setResetTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            هل أنت متأكد من إعادة تعيين كلمة مرور <strong>{resetTarget?.fullName}</strong>؟
            سيتم توليد كلمة مرور جديدة عشوائية وعرضها لك مرة واحدة.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setResetTarget(null)}>إلغاء</Button>
            <Button variant="destructive" disabled={resetting} onClick={handleResetPassword}>
              {resetting ? "جارٍ التعيين..." : "تأكيد إعادة التعيين"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Notification Modal */}
      <Dialog open={!!notifTarget} onOpenChange={(open) => { if (!open) { setNotifTarget(null); notifForm.reset(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إرسال إشعار إلى {notifTarget?.fullName}</DialogTitle>
          </DialogHeader>
          <Form {...notifForm}>
            <form onSubmit={notifForm.handleSubmit(onNotifSubmit)} className="space-y-4">
              <FormField
                control={notifForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان</FormLabel>
                    <FormControl><Input placeholder="عنوان الإشعار" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={notifForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرسالة</FormLabel>
                    <FormControl><Textarea placeholder="نص الإشعار" rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={createNotification.isPending}>إرسال</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="w-full overflow-x-auto rounded-md border bg-white">
        <Card>
          <CardContent className="p-0">
            <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>رقم الموظف</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : employees?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">لا يوجد موظفين</TableCell>
                </TableRow>
              ) : (
                employees?.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="text-muted-foreground text-sm">{emp.employeeCode || "—"}</TableCell>
                    <TableCell className="font-medium">{emp.fullName}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{emp.phoneNumber || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleTranslations[emp.role]}</Badge>
                    </TableCell>
                    <TableCell>{emp.departmentName || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isSupervisorOrAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="إرسال إشعار"
                            onClick={() => { setNotifTarget(emp); notifForm.reset(); }}
                          >
                            <Bell className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}>
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        {isSuperAdmin && (
                          <Button variant="ghost" size="icon" title="إعادة تعيين كلمة المرور" onClick={() => setResetTarget(emp)}>
                            <KeyRound className="h-4 w-4 text-amber-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
