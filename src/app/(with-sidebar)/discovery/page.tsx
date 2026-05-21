import { getGlobalFeedAction } from "@/app/posts.action";
import { getUserWithRolesFromSession } from "@/app/auth.action";
import TimelineView from "../timeline/timeline-view";

export default async function DiscoveryPage() {
    const user = await getUserWithRolesFromSession();
    const response = await getGlobalFeedAction(user?.id);
    const initialPosts = response.status === "success" && response.data ? response.data : [];

    return (
        <TimelineView
            initialPosts={initialPosts}
            title="Discovery"
            currentUser={user ? {
                id: user.id,
                name: user.username,
                avatar: user.avatar,
            } : null}
        />
    );
}
