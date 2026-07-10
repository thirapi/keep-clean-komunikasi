import { cookies } from "next/headers";

const COOKIE_NAME = "impersonate_user_id";

export async function getImpersonatedUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value || null;
}

export async function getEffectiveUserId(sessionUserId: string): Promise<string> {
    const impersonated = await getImpersonatedUserId();
    return impersonated || sessionUserId;
}

export async function requireNoImpersonation(): Promise<void> {
    const userId = await getImpersonatedUserId();
    if (userId) {
        throw new Error("Tidak dapat melakukan aksi ini saat mode impersonasi");
    }
}

export async function setImpersonation(userId: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
        path: "/",
    });
}

export async function clearImpersonation(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}
