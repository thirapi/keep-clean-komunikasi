import { PostWithUserDTO } from "@/lib/entities/models/post.model";

/**
 * Logika: Maximum Consecutive Context Blocks
 * Memastikan aktor yang dibatasi tidak mendominasi timeline, 
 * tapi tetap menjaga keutuhan diskusi/utas (Thread Integrity).
 */
export function filterTimelineIntensity(
    posts: PostWithUserDTO[], 
    reducedIntensityAccountIds: Set<string>,
    maxConsecutiveSlots = 2
): PostWithUserDTO[] {
    let filteredTimeline: PostWithUserDTO[] = [];
    
    // State Tracker
    let consecutiveSlotsCount = 0;
    let lastActorId: string | null = null;
    let lastActivityUri: string | null | undefined = null; 
    let currentBlockUris = new Set<string>(); // Menyimpan semua URI dalam 1 blok untuk cek self-boost

    for (const post of posts) {
        // actorId is the one who performed the action (either original author or reposter)
        const actorId = post.userId || post.remoteActorId || "unknown";
        const isRestricted = reducedIntensityAccountIds.has(actorId);

        // 1. JIKA AKUN TIDAK DIBATASI -> Lolos otomatis
        if (!isRestricted) {
            filteredTimeline.push(post);
            // Reset state tracker
            lastActorId = actorId;
            lastActivityUri = post.uri; 
            consecutiveSlotsCount = 0; 
            currentBlockUris.clear();
            continue;
        }

        // 2. ANALISIS HUBUNGAN (Thread & Self-Boost)
        // Self-Reply detection
        const isSelfReply = (actorId === lastActorId) && 
                            (!!post.replyToId && post.replyTo?.uri === lastActivityUri);
                            
        // Self-Boost detection: check if this post is a repost of something already in current block
        const isSelfBoost = (actorId === lastActorId) && 
                            (!!post.repostOfId && (currentBlockUris.has(post.repostOf?.uri || "")));

        const isContinuation = isSelfReply || isSelfBoost;

        // 3. LOGIKA FILTERING
        if (actorId === lastActorId) {
            if (isContinuation) {
                // Ini masih bagian dari "cerita" yang sama (Thread/Self-boost)
                filteredTimeline.push(post);
                lastActivityUri = post.uri;
                if (post.uri) currentBlockUris.add(post.uri);
                // consecutiveSlotsCount TIDAK bertambah
            } else {
                // Aktivitas baru dari aktor yang sama tapi konteks berbeda (Note baru / Boost orang lain)
                if (consecutiveSlotsCount < maxConsecutiveSlots) {
                    filteredTimeline.push(post);
                    lastActivityUri = post.uri;
                    if (post.uri) currentBlockUris.add(post.uri);
                    consecutiveSlotsCount++;
                } else {
                    // Terlalu berisik, SKIP slot ke-3 dst.
                    continue;
                }
            }
        } else {
            // Berganti aktor (A -> B)
            filteredTimeline.push(post);
            lastActorId = actorId;
            lastActivityUri = post.uri;
            currentBlockUris.clear();
            if (post.uri) currentBlockUris.add(post.uri);
            consecutiveSlotsCount = 1; // Slot pertama untuk aktor baru
        }
    }

    return filteredTimeline;
}
