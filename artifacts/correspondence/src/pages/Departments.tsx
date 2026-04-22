import { useState } from "react";
import {
  useListDepartments, useCreateDepartment, useUpdateDepartment,
  getListDepartmentsQueryKey, useDeleteDepartment,
  getGetCorrespondencesByDepartmentQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus, Trash2, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const PRESET_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#84cc16",
  "#ec4899", "#1a2744", "#008080", "#a16207",
  "#6b7280", "#94a3b8",
];

const formSchema = z.object({
  name: z.string().min(2, "اسم القسم مطلوب"),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditTarget {
  id: string;
  name: string;
  color?: string | null;
}

export default function Departments() {
  const { data: departments, isLoading } = useListDepartments();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const addForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", color: PRESET_COLORS[0] },
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetCorrespondencesByDepartmentQueryKey() });
  }

  function onAdd(values: FormValues) {
    createDepartment.mutate({ data: { name: values.name, color: values.color ?? null } }, {
      onSuccess: () => {
        toast({ title: "تم إضافة القسم بنجاح" });
        invalidateAll();
        setAddOpen(false);
        addForm.reset({ name: "", color: PRESET_COLORS[0] });
      },
    });
  }

  function openEdit(dept: EditTarget) {
    setEditTarget(dept);
    editForm.reset({ name: dept.name, color: dept.color ?? PRESET_COLORS[0] });
  }

  function onEdit(values: FormValues) {
    if (!editTarget) return;
    updateDepartment.mutate(
      { id: editTarget.id, data: { name: values.name, color: values.color ?? null } },
      {
        onSuccess: () => {
          toast({ title: "تم تحديث القسم بنجاح" });
          invalidateAll();
          setEditTarget(null);
        },
      }
    );
  }

  function handleDelete(id: string) {
    if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
      deleteDepartment.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "تم الحذف بنجاح" });
          invalidateAll();
        },
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-gray-500" />
          <h1 className="text-2xl font-bold">إدارة الأقسام</h1>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 ml-2" /> إضافة قسم</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة قسم جديد</DialogTitle>
            </DialogHeader>
            <DeptForm form={addForm} onSubmit={onAdd} isPending={createDepartment.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل القسم</DialogTitle>
          </DialogHeader>
          <DeptForm form={editForm} onSubmit={onEdit} isPending={updateDepartment.isPending} />
        </DialogContent>
      </Dialog>

      <div className="w-full overflow-x-auto rounded-md border bg-white">
        <Card>
          <CardContent className="p-0">
            <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>اللون</TableHead>
                <TableHead>اسم القسم</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}><Skeleton className="h-6 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : departments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">لا توجد أقسام</TableCell>
                </TableRow>
              ) : (
                departments?.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                      <span
                        className="inline-block h-5 w-5 rounded-full border border-border"
                        style={{ backgroundColor: dept.color ?? "#94a3b8" }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>{dept.createdAt ? format(new Date(dept.createdAt), "yyyy/MM/dd") : "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit({ id: dept.id, name: dept.name, color: dept.color })}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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

function DeptForm({
  form,
  onSubmit,
  isPending,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  onSubmit: (v: FormValues) => void;
  isPending: boolean;
}) {
  const selectedColor = form.watch("color");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم القسم</FormLabel>
              <FormControl>
                <Input placeholder="أدخل اسم القسم" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>لون القسم في الرسم البياني</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => field.onChange(c)}
                        className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c,
                          borderColor: selectedColor === c ? "#000" : "transparent",
                          outline: selectedColor === c ? "2px solid #fff" : "none",
                          outlineOffset: "-3px",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={field.value ?? "#3b82f6"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-8 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
                    />
                    <span className="text-xs text-muted-foreground">أو اختر لوناً مخصصاً</span>
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>حفظ</Button>
        </div>
      </form>
    </Form>
  );
}
