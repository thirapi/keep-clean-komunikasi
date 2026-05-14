import { Metadata } from "next";
import { getPublicProfileAction } from "../../user.action";
import { sidaBarUserInfo } from "../../../auth.action";
import ProfileView from "./profile-view";
import { notFound } from "next/navigation";

interface ProfilePageProps {
    params: Promise<{
        username: string;
    }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    const { username } = await params;
    return {
        title: `@${username} | Keep Clean Komunikasi`,
        description: `Lihat profil ${username} di Keep Clean Komunikasi.`,
    };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username } = await params;

    // Fetch the target user profile
    const response = await getPublicProfileAction(username);

    if (response.status === "error" || !response.data) {
        notFound();
    }

    const user = response.data;

    // Fetch the current user session (to check if it's their own profile)
    const currentUser = await sidaBarUserInfo();

    // Normalized currentUser format to match ProfileViewProps
    const normalizedCurrentUser = currentUser && currentUser.name !== "error" ? {
        id: (await import("../../../auth.action")).getUserWithRolesFromSession().then(u => u?.id) as any, // This is a bit hacky, let's just use what we have or fetch it properly
        name: currentUser.name,
        initial: "", // Placeholder
        role: currentUser.role,
        email: currentUser.email,
        avatar: currentUser.avatar,
        bio: currentUser.bio,
        banner: currentUser.banner,
        customStatus: currentUser.customStatus,
    } : null;

    // Let's refine the current user fetching to get the full object including ID
    const fullCurrentUser = await (await import("../../../auth.action")).getUserWithRolesFromSession();

    const finalCurrentUser = fullCurrentUser ? {
        id: fullCurrentUser.id,
        name: fullCurrentUser.username,
        initial: fullCurrentUser.username.charAt(0).toUpperCase(),
        role: fullCurrentUser.roles.map(r => r.name).join(", "),
        email: "komunikasi.qzz.io", // Consistency with sidaBarUserInfo
        avatar: fullCurrentUser.avatar || "/avatars/avatar1.png",
        bio: fullCurrentUser.bio,
        banner: fullCurrentUser.banner,
        customStatus: fullCurrentUser.customStatus,
    } : null;

    return (
        <ProfileView
            user={user}
            currentUser={finalCurrentUser}
        />
    );
}
