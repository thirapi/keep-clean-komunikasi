import { get, set, del } from 'idb-keyval';
import { PostWithUserDTO } from '@/lib/entities/models/post.model';

const STORE_KEY = 'optimistic_posts';

type Listener = () => void;
const listeners = new Set<Listener>();

// Sinkronisasi lintas-tab melalui window storage event
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORE_KEY) listeners.forEach((l) => l());
  });
}

const notify = () => listeners.forEach((l) => l());

/**
 * Repository untuk menangani persistensi post optimistik di IndexedDB.
 * Menggunakan pola Singleton dengan mekanisme Pub/Sub untuk reaktivitas.
 */
export const optimisticPostRepository = {
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  async savePendingPost(post: PostWithUserDTO): Promise<void> {
    const posts = await this.getAllPendingPosts();
    // Gunakan map untuk memastikan unik berdasarkan ID
    const updated = [post, ...posts.filter((p) => p.id !== post.id)];
    await set(STORE_KEY, updated);
    notify();
  },

  async removePendingPost(id: string): Promise<void> {
    const posts = await this.getAllPendingPosts();
    const filtered = posts.filter((p) => p.id !== id);
    await set(STORE_KEY, filtered);
    notify();
  },

  async getAllPendingPosts(): Promise<PostWithUserDTO[]> {
    const posts = await get<PostWithUserDTO[]>(STORE_KEY);
    return posts || [];
  },

  async cleanupExpired(): Promise<void> {
    const posts = await this.getAllPendingPosts();
    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;
    const valid = posts.filter((p) => (now - new Date(p.createdAt || Date.now()).getTime()) < TEN_MINUTES);
    
    if (valid.length !== posts.length) {
      await set(STORE_KEY, valid);
      notify();
    }
  }
};
