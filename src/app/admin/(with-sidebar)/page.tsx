import { adminGuard } from "@/lib/middlewares/role-guard.middleware";
import { redirect } from "next/navigation";
import { getAdminDashboardDataAction } from "./dashboard.action";
import { AdminDashboardContent } from "./dashboard-content";

export default async function Page() {
    const isAdmin = await adminGuard();
    if (!isAdmin) redirect("/unauthorized");

    const data = await getAdminDashboardDataAction();

    return (
        <AdminDashboardContent data={data} />
    );
}
