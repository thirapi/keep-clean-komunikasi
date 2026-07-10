"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CaretLeft, Camera, CircleNotch, Sparkle, Key, WarningCircle, User, Shield, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { updateUserAction, changePasswordAction } from "../user.action";
import { uploadFileAction } from "../channels/[roomId]/messages.action";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: PaintbrushIcon },
];

function PaintbrushIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m14.622 17.897-3.458-3.458 3.458-3.458 3.458 3.458Z" />
            <path d="M18.396 15.642 20 17.246a1 1 0 0 1 0 1.414l-1.417 1.417a1 1 0 0 1-1.414 0l-1.604-1.604" />
            <path d="M8 11.414 3.414 6.828a2 2 0 0 1 0-2.828l1.414-1.414a2 2 0 0 1 2.828 0L12.242 7.172" />
            <path d="m2 21 5-5" />
            <path d="M5 11h2" />
            <path d="M11 5v2" />
            <path d="M13 13h2" />
            <path d="M11 11v2" />
        </svg>
    );
}

interface SettingsViewProps {
    user: {
        id: string;
        name: string;
        username: string;
        initial: string;
        role: string;
        email: string;
        avatar: string;
        bio?: string | null;
        banner?: string | null;
        customStatus?: string | null;
    } | null;
}

function ProfileForm({ user }: { user: NonNullable<SettingsViewProps["user"]> }) {
    const [username, setUsername] = React.useState(user.username);
    const [displayName, setDisplayName] = React.useState(user.name);
    const [avatar, setAvatar] = React.useState(user.avatar);
    const [bio, setBio] = React.useState(user.bio || "");
    const [customStatus, setCustomStatus] = React.useState(user.customStatus || "");
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUpdate = async () => {
        if (!username.trim()) return toast.error("Username cannot be empty");
        setIsUpdating(true);
        try {
            const response = await updateUserAction(user.id, {
                username: username.trim(),
                name: displayName.trim() || null,
                avatar,
                bio: bio.trim() || null,
                customStatus: customStatus.trim() || null,
            });
            if (response.status === "success") toast.success("Profile updated!");
            else toast.error(response.error?.message || "Failed to update profile");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return toast.error("File size max 2MB");
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await uploadFileAction(formData, "avatars");
            if (response.status === "success" && response.data) {
                setAvatar(response.data.fileurl);
                toast.success("Avatar uploaded!");
            } else toast.error(response.error?.message || "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const isDirty = username !== user.username || displayName !== user.name || avatar !== user.avatar ||
        bio !== (user.bio || "") || customStatus !== (user.customStatus || "");

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <UserAvatar src={avatar} className="h-16 w-16 rounded-full ring-2 ring-border" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity">
                        {isUploading ? <CircleNotch className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                </div>
                <div>
                    <p className="font-bold">{displayName || user.name}</p>
                    <p className="text-sm text-muted-foreground">@{username}</p>
                </div>
            </div>

            <div className="grid gap-4">
                <div className="grid gap-1.5">
                    <Label className="text-sm font-medium">Display Name</Label>
                    <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="h-10" />
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-sm font-medium">Username</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                        <Input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} className="h-10 pl-7" />
                    </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <WarningCircle weight="duotone" className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">Changing your username changes your profile link.</p>
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                        Custom Status <Sparkle weight="duotone" className="h-3.5 w-3.5 text-primary" />
                    </Label>
                    <Input value={customStatus} onChange={e => setCustomStatus(e.target.value)} className="h-10" placeholder="What&apos;s happening?" maxLength={100} />
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-sm font-medium">Bio</Label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)}
                        className="flex min-h-[72px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus:ring-1 focus:ring-primary resize-none"
                        placeholder="Tell about yourself..." maxLength={250} />
                    <p className="text-xs text-muted-foreground text-right">{bio.length}/250</p>
                </div>
            </div>

            {isDirty && (
                <Button onClick={handleUpdate} disabled={isUpdating} className="w-full font-bold h-11">
                    {isUpdating && <CircleNotch className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            )}
        </div>
    );
}

function SecurityForm({ user }: { user: NonNullable<SettingsViewProps["user"]> }) {
    const [oldPassword, setOldPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [isUpdating, setIsUpdating] = React.useState(false);

    const handleChange = async () => {
        if (!newPassword) return toast.error("New password cannot be empty");
        if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
        setIsUpdating(true);
        try {
            const response = await changePasswordAction(user.id, { oldPassword, newPassword });
            if (response.status === "success") {
                toast.success("Password changed!");
                setOldPassword(""); setNewPassword(""); setConfirmPassword("");
            } else toast.error(response.error?.message || "Failed to change password");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="grid gap-3">
                <div className="grid gap-1.5">
                    <Label className="text-sm font-medium">Current Password</Label>
                    <Input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="h-10" placeholder="••••••••" />
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-sm font-medium">New Password</Label>
                    <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-10" placeholder="Min 8 characters" />
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-sm font-medium">Confirm New Password</Label>
                    <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-10" placeholder="Repeat new password" />
                </div>
            </div>
            <Button onClick={handleChange} disabled={isUpdating || !newPassword} className="w-full font-bold h-11">
                {isUpdating ? <CircleNotch className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                Change Password
            </Button>
        </div>
    );
}

export default function SettingsView({ user }: SettingsViewProps) {
    const [selectedSection, setSelectedSection] = React.useState<string | null>(null);

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-muted-foreground">Please login to access settings.</p>
                <Button asChild><Link href="/">Login</Link></Button>
            </div>
        );
    }

    if (selectedSection) {
        return (
            <div className="flex flex-col h-full bg-background">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedSection(null)} className="rounded-full h-8 w-8">
                        <CaretLeft weight="duotone" className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-bold">{sections.find(s => s.id === selectedSection)?.label}</h1>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-4 pb-24 max-w-lg mx-auto">
                        {selectedSection === "profile" && <ProfileForm user={user} />}
                        {selectedSection === "security" && <SecurityForm user={user} />}
                        {selectedSection === "appearance" && (
                            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center">
                                    <PaintbrushIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold">Theme Customization</h3>
                                    <p className="text-sm text-muted-foreground">Custom themes are coming soon.</p>
                                </div>
                                <Button variant="secondary" disabled>Coming Soon</Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="px-4 pt-6 pb-2 shrink-0">
                <h1 className="text-2xl font-bold">Settings</h1>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-24">
                <div className="max-w-lg mx-auto rounded-2xl overflow-hidden border border-border bg-card divide-y divide-border">
                    {sections.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setSelectedSection(id)}
                            className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors active:bg-muted/80 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                                    <Icon className="h-4 w-4 text-accent-foreground" />
                                </div>
                                <span className="font-medium">{label}</span>
                            </div>
                            <CaretRight weight="duotone" className="h-4 w-4 text-muted-foreground" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
