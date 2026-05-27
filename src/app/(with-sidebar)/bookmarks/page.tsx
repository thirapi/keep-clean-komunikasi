import { getBookmarkedPostsAction } from "../../posts.action";
import { getUserWithRolesFromSession } from "../../auth.action";
import BookmarksView from "./bookmarks-view";
import { redirect } from "next/navigation";

export default async function BookmarksPage() {
    const user = await getUserWithRolesFromSession();
    
    if (!user) {
        redirect("/signin");
    }

    const currentUser = {
        id: user.id,
        username: user.username,
        initial: user.username.charAt(0).toUpperCase(),
        avatar: user.avatar || "/avatars/avatar1.png",
    };

    const response = await getBookmarkedPostsAction(user.id);
    const initialPosts = response.status === "success" ? (response.data || []) : [];

    return (
        <BookmarksView
            initialPosts={initialPosts}
            currentUser={currentUser}
        />
    );
}
