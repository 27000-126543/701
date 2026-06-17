import type { User, MeditationSession, Badge, CommunityPost, MeditationPlan, BuiltInAudio, Notification } from '../types';
import { generateId } from './calculations';

const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const formatTime = (date: Date) => date.toTimeString().split(' ')[0];

export const mockUser: User = {
  id: 'user_001',
  name: '冥想者',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
  totalMeditationMinutes: 450,
  currentStreak: 5,
  longestStreak: 12,
  membershipLevel: '初学',
  createdAt: formatDate(new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)),
  lastMeditationDate: formatDate(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000))
};

export const mockBuiltInAudios: BuiltInAudio[] = [
  {
    id: 'audio_001',
    name: '雨声',
    description: '轻柔的雨声帮助放松',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    icon: '🌧️'
  },
  {
    id: 'audio_002',
    name: '森林',
    description: '大自然的森林声音',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    icon: '🌲'
  },
  {
    id: 'audio_003',
    name: '海浪',
    description: '海浪拍打岸边的声音',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    icon: '🌊'
  },
  {
    id: 'audio_004',
    name: '鸟鸣',
    description: '清晨的鸟鸣声',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    icon: '🐦'
  },
  {
    id: 'audio_005',
    name: '冥想音乐',
    description: '舒缓的冥想背景音乐',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    icon: '🎵'
  },
  {
    id: 'audio_006',
    name: '风铃',
    description: '清脆的风铃声',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    icon: '🔔'
  }
];

export const generateMockSessions = (): MeditationSession[] => {
  const sessions: MeditationSession[] = [];
  
  for (let i = 0; i < 30; i++) {
    if (Math.random() > 0.3) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const duration = [10, 15, 20, 25, 30][Math.floor(Math.random() * 5)];
      const mood = Math.floor(Math.random() * 6) + 5;
      
      const audioOptions = mockBuiltInAudios;
      const audio = audioOptions[Math.floor(Math.random() * audioOptions.length)];
      
      const startTime = new Date(date);
      startTime.setHours(7 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      
      sessions.push({
        id: generateId(),
        userId: 'user_001',
        planId: 'plan_001',
        durationMinutes: duration,
        audioType: 'built-in',
        audioName: audio.name,
        audioUrl: audio.url,
        sessionDate: formatDate(date),
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        completed: true,
        moodLevel: mood
      });
    }
  }
  
  return sessions.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
};

export const mockPlan: MeditationPlan = {
  id: 'plan_001',
  userId: 'user_001',
  dailyGoalMinutes: 20,
  startDate: formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)),
  isActive: true,
  completionRate: 0.75,
  recommendedMinutes: 20,
  createdAt: formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000))
};

export const mockBadges: Badge[] = [
  {
    id: 'badge_001',
    userId: 'user_001',
    badgeType: 'first_meditation',
    badgeName: '初心者',
    description: '完成第一次冥想',
    icon: '🌱',
    earnedDate: formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)),
    unlocked: true
  },
  {
    id: 'badge_002',
    userId: 'user_001',
    badgeType: 'streak_7',
    badgeName: '坚持不懈',
    description: '连续打卡7天',
    icon: '🔥',
    earnedDate: formatDate(new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000)),
    unlocked: true
  },
  {
    id: 'badge_003',
    userId: 'user_001',
    badgeType: 'total_100',
    badgeName: '冥想入门',
    description: '累计冥想100分钟',
    icon: '✨',
    earnedDate: formatDate(new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000)),
    unlocked: true
  },
  {
    id: 'badge_004',
    userId: 'user_001',
    badgeType: 'streak_30',
    badgeName: '月度达人',
    description: '连续打卡30天',
    icon: '🏆',
    unlocked: false
  },
  {
    id: 'badge_005',
    userId: 'user_001',
    badgeType: 'total_500',
    badgeName: '冥想达人',
    description: '累计冥想500分钟',
    icon: '⭐',
    unlocked: false
  },
  {
    id: 'badge_006',
    userId: 'user_001',
    badgeType: 'total_1000',
    badgeName: '冥想大师',
    description: '累计冥想1000分钟',
    icon: '👑',
    unlocked: false
  }
];

export const mockPosts: CommunityPost[] = [
  {
    id: generateId(),
    userId: 'user_002',
    userName: '静心者',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    content: '今天冥想了30分钟，感觉内心特别平静。最近工作压力大，每天的冥想时间成了我最期待的时刻。坚持真的很重要！',
    likesCount: 42,
    commentsCount: 8,
    hotScore: 95.5,
    liked: false,
    createdAt: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    comments: [],
    isHot: true
  },
  {
    id: generateId(),
    userId: 'user_003',
    userName: '云水禅心',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    content: '分享一个小技巧：冥想前先做几分钟深呼吸，能更快进入状态。我一般会做3组4-7-8呼吸法，效果很好。',
    likesCount: 36,
    commentsCount: 5,
    hotScore: 78.2,
    liked: true,
    createdAt: new Date(today.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    comments: []
  },
  {
    id: generateId(),
    userId: 'user_004',
    userName: '自在',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    content: '连续打卡第21天，明显感觉到睡眠质量提升了。以前经常失眠，现在躺床上10分钟就能睡着。感谢冥想！',
    likesCount: 28,
    commentsCount: 12,
    hotScore: 65.8,
    liked: false,
    createdAt: new Date(today.getTime() - 8 * 60 * 60 * 1000).toISOString(),
    comments: []
  },
  {
    id: generateId(),
    userId: 'user_005',
    userName: '清风明月',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    content: '初学者请教大家，冥想的时候总是走神怎么办？每次都是数呼吸，数着数着就想别的事情去了。',
    likesCount: 15,
    commentsCount: 18,
    hotScore: 52.3,
    liked: false,
    createdAt: new Date(today.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    comments: []
  },
  {
    id: generateId(),
    userId: 'user_006',
    userName: '安然',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    content: '终于达到了初学会员！累计300分钟达成。接下来向进阶会员努力，目标1000分钟！给自己加油💪',
    likesCount: 56,
    commentsCount: 9,
    hotScore: 88.1,
    liked: true,
    createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    comments: [],
    isHot: true
  },
  {
    id: generateId(),
    userId: 'user_007',
    userName: '随缘',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    content: '推荐大家试试「海浪」这个音频，配合冥想真的很放松。我每次用这个音频，都能很快进入状态。',
    likesCount: 23,
    commentsCount: 4,
    hotScore: 41.6,
    liked: false,
    createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    comments: []
  }
];

export const mockNotifications: Notification[] = [
  {
    id: generateId(),
    userId: 'user_001',
    type: 'badge',
    title: '🎉 获得新勋章',
    message: '恭喜你获得「冥想入门」勋章，累计冥想100分钟！',
    read: false,
    createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: generateId(),
    userId: 'user_001',
    type: 'membership',
    title: '🌟 会员升级',
    message: '恭喜你升级为「初学会员」，解锁更多权益！',
    read: false,
    createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: generateId(),
    userId: 'user_001',
    type: 'reminder',
    title: '🧘 冥想提醒',
    message: '今天还没有冥想哦，花10分钟给自己一些宁静时光吧。',
    read: true,
    createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];
