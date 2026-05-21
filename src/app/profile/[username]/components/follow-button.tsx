"use client";

import { useTransition, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { followUserAction, unfollowUserAction, checkFollowingStatusAction } from "@/app/(with-sidebar)/user.action";

interface FollowButtonProps {
    targetUserId: string;
    currentUserId: string;
    initialIsFollowing: boolean;
}

export function FollowButton({ targetUserId, currentUserId, initialIsFollowing }: FollowButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

    const handleFollow = () => {
        startTransition(async () => {
            if (isFollowing) {
                const response = await unfollowUserAction(currentUserId, targetUserId);
                if (response.status === "success") {
                    setIsFollowing(false);
                    toast.success("Berhenti mengikuti");
                } else {
                    toast.error(response.error?.message || "Gagal berhenti mengikuti");
                }
            } else {
                const response = await followUserAction(currentUserId, targetUserId);
                if (response.status === "success") {
                    setIsFollowing(true);
                    toast.success("Berhasil mengikuti");
                } else {
                    toast.error(response.error?.message || "Gagal mengikuti");
                }
            }
        });
    };

    return (
        <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            onClick={handleFollow}
            disabled={isPending}
            className="rounded-full gap-2 min-w-[100px]"
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    <UserMinus className="h-4 w-4" />
                    <span>Unfollow</span>
                </>
            ) : (
                <>
                    <UserPlus className="h-4 w-4" />
                    <span>Follow</span>
                </>
            )}
        </Button>
    );
}
