"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { followUserAction, unfollowUserAction, followRemoteUserAction, unfollowRemoteUserAction } from "@/app/(with-sidebar)/user.action";

interface FollowButtonProps {
    targetUserId: string;
    currentUserId: string;
    initialIsFollowing: boolean;
    isRemote?: boolean;
    handle?: string;
}

export function FollowButton({ targetUserId, currentUserId, initialIsFollowing, isRemote, handle }: FollowButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

    const handleFollow = () => {
        startTransition(async () => {
            if (isFollowing) {
                let response;
                if (isRemote) {
                    response = await unfollowRemoteUserAction(currentUserId, targetUserId);
                } else {
                    response = await unfollowUserAction(currentUserId, targetUserId);
                }
                
                if (response.status === "success") {
                    setIsFollowing(false);
                    toast.success("Berhenti mengikuti");
                } else {
                    toast.error(response.error?.message || "Gagal berhenti mengikuti");
                }
            } else {
                let response;
                if (isRemote && handle) {
                    response = await followRemoteUserAction(currentUserId, handle);
                } else {
                    response = await followUserAction(currentUserId, targetUserId);
                }

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
                <CircleNotch weight="duotone" className="h-4 w-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    <UserMinus weight="duotone" className="h-4 w-4" />
                    <span>Unfollow</span>
                </>
            ) : (
                <>
                    <UserPlus weight="duotone" className="h-4 w-4" />
                    <span>Follow</span>
                </>
            )}
        </Button>
    );
}
