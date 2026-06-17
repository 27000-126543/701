import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Send, Flame, Clock, X, ChevronDown, User } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useCommunityStore } from '../../store/useCommunityStore';
import type { CommunityPost, ToastMessage } from '../../types';

interface CommunityProps {
  addToast: (message: Omit<ToastMessage, 'id'>) => void;
}

type SortType = 'hot' | 'latest';

export default function Community({ addToast }: CommunityProps) {
  const user = useUserStore(state => state.user);
  const posts = useCommunityStore(state => state.posts);
  const initUser = useUserStore(state => state.initUser);
  const initPosts = useCommunityStore(state => state.initPosts);
  const addPost = useCommunityStore(state => state.addPost);
  const likePost = useCommunityStore(state => state.likePost);
  const addComment = useCommunityStore(state => state.addComment);
  const getHotPosts = useCommunityStore(state => state.getHotPosts);
  const getLatestPosts = useCommunityStore(state => state.getLatestPosts);

  const [sortType, setSortType] = useState<SortType>('hot');
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    initUser();
    initPosts();
  }, [initUser, initPosts]);

  const displayedPosts = useMemo(() => {
    if (sortType === 'hot') {
      return getHotPosts();
    }
    return getLatestPosts();
  }, [posts, sortType, getHotPosts, getLatestPosts]);

  const handlePublishPost = () => {
    if (!user) return;
    
    const result = addPost(
      newPostContent,
      user.id,
      user.name,
      user.avatar
    );
    
    if (result.success) {
      addToast({ type: 'success', message: '发布成功！' });
      setNewPostContent('');
      setShowPostModal(false);
    } else {
      addToast({ type: 'error', message: result.message || '发布失败' });
    }
  };

  const handleLike = (postId: string) => {
    likePost(postId);
  };

  const handleAddComment = (postId: string) => {
    if (!user) return;
    
    const content = commentInputs[postId] || '';
    const result = addComment(
      postId,
      content,
      user.id,
      user.name,
      user.avatar
    );
    
    if (result.success) {
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      addToast({ type: 'success', message: '评论成功！' });
    } else {
      addToast({ type: 'error', message: result.message || '评论失败' });
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString('zh-CN');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">社区广场</h1>
          <p className="text-white/60 mt-1">与同路人分享你的冥想心得</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setSortType('hot')}
              className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                sortType === 'hot'
                  ? 'bg-primary-500 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Flame size={16} />
              热门
            </button>
            <button
              onClick={() => setSortType('latest')}
              className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                sortType === 'latest'
                  ? 'bg-primary-500 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Clock size={16} />
              最新
            </button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPostModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Send size={18} />
            发布心得
          </motion.button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        {displayedPosts.map((post, index) => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={user}
            index={index}
            expanded={expandedPostId === post.id}
            onToggleExpand={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
            onLike={() => handleLike(post.id)}
            onAddComment={() => handleAddComment(post.id)}
            commentInput={commentInputs[post.id] || ''}
            onCommentChange={(value) => setCommentInputs(prev => ({ ...prev, [post.id]: value }))}
            formatTime={formatTime}
          />
        ))}
        
        {displayedPosts.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-white/60">还没有帖子，来发布第一条心得吧！</p>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showPostModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPostModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-display font-semibold">发布心得</h3>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex items-start gap-3 mb-4">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-primary-400/50"
                />
                <div className="flex-1">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-white/50 text-sm">{user.membershipLevel}</p>
                </div>
              </div>
              
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="分享你的冥想心得、技巧或感悟..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                maxLength={500}
              />
              
              <div className="flex items-center justify-between mt-4">
                <p className="text-white/40 text-sm">
                  {newPostContent.length}/500
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPostModal(false)}
                    className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    取消
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePublishPost}
                    disabled={!newPostContent.trim()}
                    className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    发布
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PostCard({
  post,
  currentUser,
  index,
  expanded,
  onToggleExpand,
  onLike,
  onAddComment,
  commentInput,
  onCommentChange,
  formatTime
}: {
  post: CommunityPost;
  currentUser: any;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onLike: () => void;
  onAddComment: () => void;
  commentInput: string;
  onCommentChange: (value: string) => void;
  formatTime: (date: string) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-5"
    >
      <div className="flex items-start gap-3">
        <img
          src={post.userAvatar}
          alt={post.userName}
          className="w-12 h-12 rounded-full border-2 border-primary-400/30"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{post.userName}</span>
            {post.isHot && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-500/20 text-accent-400 rounded-full text-xs font-medium">
                <Flame size={12} />
                热门
              </span>
            )}
            <span className="text-white/40 text-sm">{formatTime(post.createdAt)}</span>
          </div>
          
          <p className="mt-3 text-white/90 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
          
          <div className="flex items-center gap-6 mt-4">
            <button
              onClick={onLike}
              className={`flex items-center gap-1.5 transition-colors ${
                post.liked
                  ? 'text-accent-400'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Heart
                size={18}
                fill={post.liked ? 'currentColor' : 'none'}
                className={post.liked ? 'animate-pulse' : ''}
              />
              <span className="text-sm">{post.likesCount}</span>
            </button>
            
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors"
            >
              <MessageCircle size={18} />
              <span className="text-sm">{post.commentsCount}</span>
              {post.commentsCount > 0 && (
                <ChevronDown
                  size={16}
                  className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
              )}
            </button>
            
            <button className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors ml-auto">
              <Share2 size={18} />
              <span className="text-sm">分享</span>
            </button>
          </div>
          
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-white/10">
                  {post.comments.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2">
                          <img
                            src={comment.userAvatar}
                            alt={comment.userName}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1 bg-white/5 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{comment.userName}</span>
                              <span className="text-white/40 text-xs">
                                {formatTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-white/80">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => onCommentChange(e.target.value)}
                        placeholder="写下你的评论..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        maxLength={200}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            onAddComment();
                          }
                        }}
                      />
                      <button
                        onClick={onAddComment}
                        disabled={!commentInput.trim()}
                        className="p-2 bg-primary-500 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
