"use client";

import React, { useState } from "react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import {
    MessageSquare,
    Settings,
    MapPin,
    Calendar,
    Mail,
    Sparkles,
    ArrowLeft,
    Share2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createRoom } from "../../channels/[roomId]/room.action";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UserSettingsDialog } from "../../user-settings-dialog";

interface ProfileViewProps {
    user: {
        id: string;
        username: string;
        avatar: string;
        bio?: string | null;
        banner?: string | null;
        customStatus?: string | null;
        roles: { id: string; name: string }[];
    };
    currentUser: {
        id: string;
        name: string;
        initial: string;
        role: string;
        email: string;
        avatar: string;
        bio?: string | null;
        banner?: string | null;
        customStatus?: string | null;
    } | null;
}

export default function ProfileView({ user, currentUser }: ProfileViewProps) {
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const isOwnProfile = currentUser?.id === user.id;

    const handleStartDM = async () => {
        if (!currentUser) {
            toast.error("Anda harus login untuk mengirim pesan");
            return;
        }

        setIsRedirecting(true);
        try {
            const response = await createRoom(currentUser.id, user.id);
            if (response.status === "success" && response.data) {
                router.push(`/channels/${response.data.id}`);
            } else {
                toast.error(response.error?.message || "Gagal membuat percakapan");
            }
        } finally {
            setIsRedirecting(false);
        }
    };

    const isBannerUrl = user.banner && (user.banner.startsWith("http") || user.banner.startsWith("/"));

    return (
        <div className="flex flex-col min-h-screen bg-background animate-in fade-in duration-700">
            {/* Header / Navigation bar overlay */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/50 backdrop-blur-xl border-b border-white/5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full hover:bg-white/10"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Share2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto w-full px-0 sm:px-6 lg:px-8 pb-20">
                <div className="bg-card sm:rounded-3xl overflow-hidden border border-white/5 shadow-2xl mt-4">
                    {/* Banner */}
                    <div
                        className="h-48 sm:h-64 lg:h-80 w-full relative sm:rounded-t-3xl"
                        style={{
                            background: isBannerUrl ? `url(${user.banner}) center/cover no-repeat` : (user.banner || "linear-gradient(to right, #4f46e5, #7c3aed)"),
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                    </div>

                    {/* Profile Header Content */}
                    <div className="px-6 sm:px-10 pb-8 relative">
                        {/* Avatar - overlapping */}
                        <div className="absolute -top-16 sm:-top-24 left-6 sm:left-10">
                            <div className="p-1 sm:p-2 bg-card rounded-[2rem] shadow-2xl ring-1 ring-white/10">
                                <UserAvatar
                                    src={user.avatar}
                                    className="h-32 w-32 sm:h-44 sm:w-44 lg:h-48 lg:w-48 rounded-[1.75rem]"
                                />
                                <div className="absolute bottom-4 right-4 h-6 w-6 sm:h-8 sm:w-8 bg-emerald-500 rounded-full border-4 sm:border-[6px] border-card shadow-lg" />
                            </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex justify-end pt-6 min-h-[4rem]">
                            {isOwnProfile ? (
                                <div className="flex gap-3">
                                    {/* We pass a custom button to trigger the dialog if needed, 
                       but UserSettingsDialog has its own trigger.
                       Let's just use the dialog as the main way to edit.
                   */}
                                    <UserSettingsDialog user={currentUser as any} />
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleStartDM}
                                        disabled={isRedirecting}
                                        className="h-11 px-6 rounded-full font-bold gap-2 shadow-lg shadow-primary/20"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        Kirim Pesan
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="mt-8 sm:mt-12 space-y-6">
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">{user.username}</h1>
                                    {user.roles.map(role => (
                                        <span
                                            key={role.id}
                                            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold"
                                        >
                                            {role.name}
                                        </span>
                                    ))}
                                </div>
                                {user.customStatus && (
                                    <div className="flex items-center gap-2 mt-3 text-muted-foreground bg-muted/30 w-fit px-3 py-1.5 rounded-full border border-white/5">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="text-sm font-medium">{user.customStatus}</span>
                                    </div>
                                )}
                            </div>

                            <div className="max-w-2xl">
                                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {user.bio || "Tidak ada bio untuk pengguna ini."}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-sm font-medium">Bergabung Januari 2025</span>
                                </div>
                                {isOwnProfile && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span className="text-sm font-medium">{currentUser.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mutual Contacts or Recent Activity could go here */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-card rounded-3xl p-8 border border-white/5 shadow-xl">
                            <h2 className="text-xl font-bold mb-4">Pengenalan</h2>
                            <p className="text-muted-foreground">Sedang membangun masa depan komunikasi yang lebih bersih dan efisien.</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-card rounded-3xl p-6 border border-white/5 shadow-xl">
                            <h2 className="text-lg font-bold mb-4">Statistik</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground text-sm font-medium">Pesan Terkirim</span>
                                    <span className="font-bold">1,234</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground text-sm font-medium">Reaksi Diberikan</span>
                                    <span className="font-bold">856</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
