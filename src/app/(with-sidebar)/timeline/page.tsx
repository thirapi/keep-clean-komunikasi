import { getGlobalFeedAction } from "../../posts.action";
import { getUserWithRolesFromSession } from "../../auth.action";
import TimelineView from "./timeline-view";

export default async function TimelinePage() {
    const user = await getUserWithRolesFromSession();
    const currentUser = user ? {
        id: user.id,
        name: user.username,
        initial: user.username.charAt(0).toUpperCase(),
        avatar: user.avatar || "/avatars/avatar1.png",
    } : null;

    const response = await getGlobalFeedAction(user?.id);
    const initialPosts = response.status === "success" ? (response.data || []) : [];

    return (
        <TimelineView
            initialPosts={initialPosts}
            currentUser={currentUser}
        />
    );
}
