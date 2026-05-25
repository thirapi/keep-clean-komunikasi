import { useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { createPostAction } from "@/app/posts.action";
import { optimisticPostRepository } from "@/lib/infrastructure/optimistic-post.repository";
import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { createId } from "@paralleldrive/cuid2";

/**
 * Mutation hook untuk membuat post dengan optimistic UI yang tangguh.
 * Mendukung ID swapping/standardization di seluruh query cache yang relevan.
 */
export function useCreatePost(queryKey: QueryKey) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: {
      userId: string;
      content: string;
      attachments?: any[];
      replyToId?: string;
      repostOfId?: string;
      id?: string;
    }) => createPostAction(args.userId, args.content, args.attachments, args.replyToId, args.repostOfId, args.id),

    onMutate: async ({ userId, content, attachments, id: predefinedId }) => {
      // Pastikan data konsisten sebelum optimis update
      await queryClient.cancelQueries({ queryKey });

      const tempId = predefinedId || createId();
      const optimisticPost: PostWithUserDTO = {
        id: tempId,
        content,
        userId: userId,
        visibility: "public",
        attachments: attachments || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        user: {
          username: "You",
          avatar: null,
        },
        reactions: [],
        repostCount: 0,
        replyCount: 0,
        optimisticId: tempId
      } as PostWithUserDTO;

      await optimisticPostRepository.savePendingPost(optimisticPost);

      const previousData = queryClient.getQueryData<PostWithUserDTO[]>(queryKey);

      // Optimistic update pada queryKey saat ini
      queryClient.setQueryData<PostWithUserDTO[]>(queryKey, (old = []) => [
        optimisticPost,
        ...old,
      ]);

      return { optimisticPost, previousData, tempId };
    },

    onSuccess: async (result, _, context) => {
      if (result.status === 'success' && result.data) {
        // IDs are already identical, so we just cleanup IndexedDB
        await optimisticPostRepository.removePendingPost(context.tempId);

        // Update in relevant caches
        const allQueries = queryClient.getQueryCache().findAll({ queryKey: ['feed'] });
        allQueries.forEach((query) => {
          queryClient.setQueryData<PostWithUserDTO[]>(query.queryKey, (old = []) =>
            old.map((p) => (p.id === context.tempId ? result.data! : p))
          );
        });
      }
    },

    onError: async (_, __, context) => {
      if (context) {
        await optimisticPostRepository.removePendingPost(context.tempId);
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });
}
