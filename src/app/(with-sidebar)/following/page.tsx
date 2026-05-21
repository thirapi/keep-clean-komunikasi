import { getFollowingFeedAction } from "@/app/posts.action";
import { getUserWithRolesFromSession } from "@/app/auth.action";
import TimelineView from "../timeline/timeline-view";
import { redirect } from "next/navigation";

export default async function FollowingPage() {
    const user = await getUserWithRolesFromSession();
    if (!user) redirect("/");

    const response = await getFollowingFeedAction(user.id);
    const initialPosts = response.status === "success" && response.data ? response.data : [];

    return (
        <TimelineView
            initialPosts={initialPosts}
            title="Mengikuti"
            currentUser={{
                id: user.id,
                name: user.username,
                avatar: user.avatar,
            }}
        />
    );
}
