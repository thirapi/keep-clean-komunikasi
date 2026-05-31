import { getGlobalFeedAction } from "../../posts.action";
import { getUserWithRolesFromSession } from "../../auth.action";
import TimelineView from "./timeline-view";

export default async function TimelinePage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const { tab } = await searchParams;
    const filter = (tab === "local" ? "local" : "all") as "all" | "local";

    const user = await getUserWithRolesFromSession();
    const currentUser = user ? {
        id: user.id,
        username: user.username,
        initial: user.username.charAt(0).toUpperCase(),
        avatar: user.avatar || "/avatars/avatar1.png",
    } : null;

    const response = await getGlobalFeedAction(user?.id, 20, 0, filter);
    const initialPosts = response.status === "success" ? (response.data || []) : [];

    return (
        <TimelineView
            initialPosts={initialPosts}
            currentUser={currentUser}
            initialTab={filter}
        />
    );
}
