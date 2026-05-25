import { useQuery, QueryKey, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { optimisticPostRepository } from "@/lib/infrastructure/optimistic-post.repository";
import { PostWithUserDTO } from "@/lib/entities/models/post.model";

/**
 * Hook untuk menggabungkan server feed dengan pending posts secara reaktif.
 * Menggunakan useMemo untuk efisiensi render dan re-sinkronisasi otomatis saat IndexedDB berubah.
 */
export function useFeedWithOptimistic<T extends PostWithUserDTO[]>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  enabled: boolean = true
) {
  const [pendingPosts, setPendingPosts] = useState<PostWithUserDTO[]>([]);

  useEffect(() => {
    const sync = async () => {
      await optimisticPostRepository.cleanupExpired();
      setPendingPosts(await optimisticPostRepository.getAllPendingPosts());
    };

    sync();
    const unsubscribe = optimisticPostRepository.subscribe(sync);
    return () => { unsubscribe(); };
  }, []);

  const { data: serverData, ...rest } = useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime: 5000,
  });

  // Auto-cleanup: Jika ID optimistik sudah muncul di serverData, hapus dari IndexedDB
  useEffect(() => {
    if (!serverData || serverData.length === 0 || pendingPosts.length === 0) return;

    const confirmedIds = pendingPosts
      .filter(pp => serverData.some(sp => sp.id === pp.id))
      .map(pp => pp.id);

    if (confirmedIds.length > 0) {
      confirmedIds.forEach(id => optimisticPostRepository.removePendingPost(id));
    }
  }, [serverData, pendingPosts]);

  const mergedData = useMemo(() => {
    const serverPosts = serverData || [];
    // Rekonsiliasi: Gabungkan pending yang belum ada di server (berdasarkan ID)
    const activePending = pendingPosts.filter(
      (pp) => !serverPosts.some((sp) => sp.id === pp.id)
    );
    return [...activePending, ...serverPosts] as T;
  }, [pendingPosts, serverData]);

  return {
    data: mergedData,
    ...rest,
  };
}
