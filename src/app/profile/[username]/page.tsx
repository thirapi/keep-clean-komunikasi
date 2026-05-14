import { Metadata } from "next";
import { getPublicProfileAction } from "../../(with-sidebar)/user.action";
import { sidaBarUserInfo } from "../../auth.action";
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
        title: `@${username} - Komunikasi`,
        description: `Lihat profil ${username} di Komunikasi.`,
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

    // Let's refine the current user fetching to get the full object including ID
    const fullCurrentUser = await (await import("../../auth.action")).getUserWithRolesFromSession();

    const finalCurrentUser = fullCurrentUser ? {
        id: fullCurrentUser.id,
        name: fullCurrentUser.username,
        initial: fullCurrentUser.username.charAt(0).toUpperCase(),
        role: fullCurrentUser.roles.map(r => r.name).join(", "),
        email: "komunikasi.qzz.io",
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
