import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CommunityPost, Comment } from '../types';
import { generateId, calculateHotScore } from '../utils/calculations';
import { validatePostContent, validateCommentContent } from '../utils/validators';
import { mockPosts } from '../utils/mockData';

interface CommunityStore {
  posts: CommunityPost[];
  initPosts: () => void;
  addPost: (content: string, userId: string, userName: string, userAvatar: string, sessionId?: string) => { success: boolean; message?: string };
  likePost: (postId: string) => void;
  addComment: (postId: string, content: string, userId: string, userName: string, userAvatar: string) => { success: boolean; message?: string };
  getHotPosts: () => CommunityPost[];
  getLatestPosts: () => CommunityPost[];
  recalculateHotScores: () => void;
}

export const useCommunityStore = create<CommunityStore>()(
  persist(
    (set, get) => ({
      posts: [],

      initPosts: () => {
        const { posts } = get();
        if (posts.length === 0) {
          set({ posts: mockPosts.map(p => ({ ...p, id: generateId() })) });
        }
      },

      addPost: (content, userId, userName, userAvatar, sessionId) => {
        const validation = validatePostContent(content);
        if (!validation.valid) {
          return { success: false, message: validation.message };
        }

        const newPost: CommunityPost = {
          id: generateId(),
          userId,
          userName,
          userAvatar,
          sessionId,
          content: content.trim(),
          likesCount: 0,
          commentsCount: 0,
          hotScore: 0,
          liked: false,
          createdAt: new Date().toISOString(),
          comments: [],
          isHot: false
        };

        set((state) => ({
          posts: [newPost, ...state.posts]
        }));

        get().recalculateHotScores();
        return { success: true };
      },

      likePost: (postId) => {
        set((state) => ({
          posts: state.posts.map(post => {
            if (post.id === postId) {
              const newLiked = !post.liked;
              return {
                ...post,
                liked: newLiked,
                likesCount: newLiked ? post.likesCount + 1 : post.likesCount - 1
              };
            }
            return post;
          })
        }));
        get().recalculateHotScores();
      },

      addComment: (postId, content, userId, userName, userAvatar) => {
        const validation = validateCommentContent(content);
        if (!validation.valid) {
          return { success: false, message: validation.message };
        }

        const newComment: Comment = {
          id: generateId(),
          postId,
          userId,
          userName,
          userAvatar,
          content: content.trim(),
          createdAt: new Date().toISOString()
        };

        set((state) => ({
          posts: state.posts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                comments: [...post.comments, newComment],
                commentsCount: post.commentsCount + 1
              };
            }
            return post;
          })
        }));

        get().recalculateHotScores();
        return { success: true };
      },

      getHotPosts: () => {
        return [...get().posts]
          .sort((a, b) => b.hotScore - a.hotScore)
          .slice(0, 10);
      },

      getLatestPosts: () => {
        return [...get().posts]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      recalculateHotScores: () => {
        set((state) => ({
          posts: state.posts.map(post => {
            const hotScore = calculateHotScore(
              post.likesCount,
              post.commentsCount,
              new Date(post.createdAt)
            );
            return {
              ...post,
              hotScore,
              isHot: hotScore > 50
            };
          })
        }));
      }
    }),
    {
      name: 'community-storage'
    }
  )
);
