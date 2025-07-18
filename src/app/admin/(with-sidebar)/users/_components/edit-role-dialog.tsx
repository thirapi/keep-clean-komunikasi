//src/app/(with-sidebar)/admin/users/_components/edit-role-dialog.tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@/components/ui/multi-select";
import { z } from "zod";
import { updateUserRolesAction } from "../role.action";
import { useState } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  roles: z.array(z.string()).nonempty("Please at least one item"),
});

export function EditRoleDialog({
  actorUserId,
  targetUserId,
  initialRoles,
  allRoles,
}: {
  actorUserId: string;
  targetUserId: string;
  initialRoles: string[];
  allRoles: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roles: initialRoles,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const res = await updateUserRolesAction(actorUserId, targetUserId, values.roles);
      if (res.status === "success") {
        toast.success("Roles updated successfully!");
        setOpen(false); 
        router.refresh(); 
      } else {
        toast.error(res.error?.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to update roles. Please try again.");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Role</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3 grid gap-3 w-full"
          >
            <FormField
              control={form.control}
              name="roles"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Invite people</FormLabel>
                  <MultiSelector
                    onValuesChange={field.onChange}
                    values={field.value}
                  >
                    <MultiSelectorTrigger>
                      <MultiSelectorInput placeholder="Select people to invite" />
                    </MultiSelectorTrigger>
                    <MultiSelectorContent>
                      <MultiSelectorList>
                        {allRoles.map((role) => (
                          <MultiSelectorItem key={role.id} value={role.name}>
                            <span>{role.name}</span>
                          </MultiSelectorItem>
                        ))}
                      </MultiSelectorList>
                    </MultiSelectorContent>
                  </MultiSelector>
                  <FormDescription>
                    Select people to invite to this event
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
