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
    const { username: rawUsername } = await params;
    const username = decodeURIComponent(rawUsername);
    const displayHandle = username.startsWith("@") ? username : `@${username}`;
    
    return {
        title: `${displayHandle} - Komunikasi`,
        description: `Lihat profil ${displayHandle} di Komunikasi.`,
    };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username: rawUsername } = await params;
    const username = decodeURIComponent(rawUsername);

    // Fetch the current user session
    const fullCurrentUser = await (await import("../../../auth.action")).getUserWithRolesFromSession();

    // Fetch the target user profile
    const response = await getPublicProfileAction(username, fullCurrentUser?.id);

    if (response.status === "error" || !response.data) {
        notFound();
    }

    const user = response.data;

    // Map the current user session (to check if it's their own profile)

    const finalCurrentUser = fullCurrentUser ? {
        id: fullCurrentUser.id,
        name: fullCurrentUser.name || fullCurrentUser.username,
        username: fullCurrentUser.username,
        initial: (fullCurrentUser.name || fullCurrentUser.username).charAt(0).toUpperCase(),
        role: fullCurrentUser.roles.map(r => r.name).join(", "),
        email: "komunikasi.qzz.io",
        avatar: fullCurrentUser.avatar || "/avatars/avatar1.png",
        bio: fullCurrentUser.bio,
        banner: fullCurrentUser.banner,
        customStatus: fullCurrentUser.customStatus,
        alsoKnownAs: fullCurrentUser.alsoKnownAs,
        movedTo: fullCurrentUser.movedTo,
    } : null;

    return (
        <ProfileView
            user={user}
            currentUser={finalCurrentUser}
        />
    );
}
