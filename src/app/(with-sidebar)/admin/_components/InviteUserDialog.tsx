// "use client";

// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { toast } from "sonner";

// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//     Form,
//     FormControl,
//     FormField,
//     FormItem,
//     FormLabel,
//     FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import { UserPlus } from "lucide-react";
// // import { UserRole } from "@/lib/entities/models/user.model";
// // import { inviteUserAction } from "../user-management.action";

// const inviteUserAction = async (email: string, role: string): Promise<{ status: string; error?: { message: string } }> => {
//     // Replace this mock implementation with the actual API call or logic
//     return { status: "success" };
// };

// const formSchema = z.object({
//     email: z.string().email({ message: "Invalid email address" }),
//     role: z.string(),
// });

// export function InviteUserDialog() {
//     const [open, setOpen] = useState(false);

//     const form = useForm<z.infer<typeof formSchema>>({
//         resolver: zodResolver(formSchema),
//         defaultValues: {
//             email: "",
//             role: "",
//         },
//     });

//     async function onSubmit(values: z.infer<typeof formSchema>) {
//         const toastId = toast.loading(
//             `Please wait, we are sending email to ${values.email}`
//         );

//         const response = await inviteUserAction(values.email, values.role);
//         if (response.status === "failed") {
//             toast.error(response.error?.message || "An unknown error occurred", { id: toastId });
//         } else {
//             toast.success("Invitation sent!", { id: toastId });
//             setOpen(false);
//         }
//     }

//     return (
//         <Dialog open={open} onOpenChange={setOpen}>
//             <DialogTrigger asChild>
//                 <Button
//                     variant="outline"
//                     size="sm"
//                     className="ml-2 hidden h-8 lg:flex"
//                 >
//                     <UserPlus />
//                     Invite User
//                 </Button>
//             </DialogTrigger>
//             <DialogContent>
//                 <DialogHeader>
//                     <DialogTitle>Invite User</DialogTitle>
//                     <DialogDescription>
//                         Enter the user's email and select a role.
//                     </DialogDescription>
//                 </DialogHeader>

//                 <Form {...form}>
//                     <form
//                         onSubmit={form.handleSubmit(onSubmit)}
//                         className="space-y-4"
//                     >
//                         <FormField
//                             control={form.control}
//                             name="email"
//                             render={({ field }) => (
//                                 <FormItem>
//                                     <FormLabel>Email</FormLabel>
//                                     <FormControl>
//                                         <Input
//                                             type="email"
//                                             placeholder="user@example.com"
//                                             {...field}
//                                         />
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                         />

//                         <FormField
//                             control={form.control}
//                             name="role"
//                             render={({ field }) => (
//                                 <FormItem>
//                                     <FormLabel>Role</FormLabel>
//                                     <Select
//                                         onValueChange={field.onChange}
//                                         defaultValue={field.value}
//                                     >
//                                         <FormControl>
//                                             <SelectTrigger>
//                                                 <SelectValue placeholder="Select a role" />
//                                             </SelectTrigger>
//                                         </FormControl>
//                                         <SelectContent>
//                                             <SelectItem value="ADMIN">
//                                                 Admin
//                                             </SelectItem>
//                                             <SelectItem value="STAFF">
//                                                 Staff
//                                             </SelectItem>
//                                         </SelectContent>
//                                     </Select>
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                         />

//                         <DialogFooter>
//                             <Button type="submit">Send Invitation</Button>
//                         </DialogFooter>
//                     </form>
//                 </Form>
//             </DialogContent>
//         </Dialog>
//     );
// }
