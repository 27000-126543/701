import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Upload,
  X,
  Music,
  Settings,
  Check
} from 'lucide-react';
import { useTimer } from '../../hooks/useTimer';
import { useAudio } from '../../hooks/useAudio';
import { useMeditationStore } from '../../store/useMeditationStore';
import { useUserStore } from '../../store/useUserStore';
import { useBadgeStore } from '../../store/useBadgeStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { mockBuiltInAudios } from '../../utils/mockData';
import MoodSelector from '../../components/ui/MoodSelector';
import type { ToastMessage, AudioConfig } from '../../types';

interface MeditationProps {
  addToast: (message: Omit<ToastMessage, 'id'>) => void;
}

export default function Meditation({ addToast }: MeditationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialDuration = (location.state as any)?.duration || 15;
  const [duration, setDuration] = useState(initialDuration);
  const [selectedAudio, setSelectedAudio] = useState<AudioConfig | null>(null);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAudioSelector, setShowAudioSelector] = useState(false);
  
  const startSession = useMeditationStore(state => state.startSession);
  const endSession = useMeditationStore(state => state.endSession);
  const addMeditationMinutes = useUserStore(state => state.addMeditationMinutes);
  const checkStreakContinuity = useUserStore(state => state.checkStreakContinuity);
  const sessions = useMeditationStore(state => state.sessions);
  const checkBadgeUnlock = useBadgeStore(state => state.checkBadgeUnlock);
  const unlockBadge = useBadgeStore(state => state.unlockBadge);
  const user = useUserStore(state => state.user);
  const addNotification = useNotificationStore(state => state.addNotification);
  const initNotifications = useNotificationStore(state => state.initNotifications);

  useEffect(() => {
    initNotifications();
  }, [initNotifications]);

  const handleTimerComplete = () => {
    audio.stop();
    setShowMoodSelector(true);
    addToast({ type: 'info', message: '冥想完成！请记录您的情绪状态' });
  };

  const timer = useTimer({
    initialMinutes: duration,
    onComplete: handleTimerComplete
  });

  const audio = useAudio();

  const handleStart = () => {
    if (!selectedAudio) {
      addToast({ type: 'error', message: '请先选择一个音频' });
      return;
    }
    
    const result = startSession(duration, selectedAudio);
    if (!result.success) {
      addToast({ type: 'error', message: result.message || '开始失败' });
      return;
    }
    
    timer.start(duration);
    audio.play(selectedAudio.name, selectedAudio.url);
    addToast({ type: 'success', message: '开始冥想，享受这段宁静时光' });
  };

  const handlePause = () => {
    if (timer.isPaused) {
      timer.resume();
      if (selectedAudio) audio.play(selectedAudio.name, selectedAudio.url);
    } else {
      timer.pause();
      audio.pause();
    }
  };

  const handleStop = () => {
    timer.stop();
    audio.stop();
    setShowMoodSelector(true);
  };

  const handleMoodSelect = (mood: number) => {
    setSelectedMood(mood);
  };

  const handleCompleteSession = () => {
    if (!selectedMood) {
      addToast({ type: 'error', message: '请选择情绪等级' });
      return;
    }

    const actualDuration = timer.isRunning || timer.isPaused 
      ? Math.ceil((timer.totalSeconds - timer.remainingSeconds) / 60)
      : duration;

    const result = endSession(selectedMood);
    
    if (!result.success) {
      addToast({ type: 'error', message: result.message || '保存失败' });
      return;
    }

    addMeditationMinutes(actualDuration);
    checkStreakContinuity([...sessions, result.session!]);

    if (user) {
      const newTotal = user.totalMeditationMinutes + actualDuration;
      const newSessionsCount = sessions.length + 1;
      
      const updatedUser = useUserStore.getState().user;
      const currentStreak = updatedUser?.currentStreak || 0;
      
      const newBadges = checkBadgeUnlock(newTotal, currentStreak, newSessionsCount);
      newBadges.forEach(badge => {
        unlockBadge(badge.badgeType, (n) => addNotification(n.type, n.title, n.message));
        addToast({ type: 'success', message: `🎉 获得新勋章：${badge.badgeName}` });
      });

      if (user.currentStreak > 0 && currentStreak === 0 && sessions.length > 0) {
        addNotification(
          'encouragement',
          '💪 不要放弃',
          '打卡中断了，不过没关系，今天重新开始，你可以的！'
        );
        addToast({ type: 'info', message: '打卡中断了，今天重新开始吧！' });
      }
    }

    addToast({ type: 'success', message: `冥想完成！${actualDuration}分钟，情绪 ${selectedMood}/10` });
    
    setShowMoodSelector(false);
    setSelectedMood(null);
    timer.reset();
  };

  const handleAudioSelect = (audioConfig: AudioConfig) => {
    setSelectedAudio(audioConfig);
    setShowAudioSelector(false);
    addToast({ type: 'success', message: `已选择：${audioConfig.name}` });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await audio.uploadCustomAudio(file);
    if (result.success) {
      addToast({ type: 'success', message: '音频上传成功' });
    } else {
      addToast({ type: 'error', message: result.message || '上传失败' });
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const circumference = 2 * Math.PI * 120;
  const progress = timer.progress;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const durationOptions = [5, 10, 15, 20, 30, 45, 60];

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <h1 className="text-3xl font-display font-bold text-center mb-2 gradient-text">
          冥想时光
        </h1>
        <p className="text-white/60 text-center mb-8">
          放下杂念，专注当下
        </p>

        <div className="relative mb-8">
          <div className="relative w-72 h-72 md:w-80 md:h-80 mx-auto">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r={120}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <motion.circle
                cx="50%"
                cy="50%"
                r={120}
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {timer.isRunning || timer.isPaused ? (
                <>
                  <div className={`text-6xl font-display font-bold gradient-text ${timer.isRunning ? 'animate-breathing' : ''}`}>
                    {timer.formatTime(timer.remainingSeconds)}
                  </div>
                  <p className="text-white/50 mt-2">
                    {timer.isPaused ? '已暂停' : '冥想中...'}
                  </p>
                  {selectedAudio && (
                    <p className="text-white/40 text-sm mt-1 flex items-center gap-1">
                      <Music size={14} />
                      {selectedAudio.name}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="text-6xl font-display font-bold gradient-text">
                    {duration}<span className="text-2xl">分钟</span>
                  </div>
                  <p className="text-white/50 mt-2">准备开始</p>
                  {selectedAudio && (
                    <p className="text-white/40 text-sm mt-1 flex items-center gap-1">
                      <Music size={14} />
                      {selectedAudio.name}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          {!timer.isRunning && !timer.isPaused ? (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(true)}
                className="w-14 h-14 rounded-full glass-card flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Settings size={24} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAudioSelector(true)}
                className="w-14 h-14 rounded-full glass-card flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                {audio.isPlaying ? <Volume2 size={24} /> : <Music size={24} />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center glow-border animate-pulse-glow"
              >
                <Play size={32} fill="white" className="ml-1" />
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePause}
                className="w-16 h-16 rounded-full glass-card flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                {timer.isPaused ? <Play size={28} /> : <Pause size={28} />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStop}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-danger-400 to-danger-500 flex items-center justify-center"
              >
                <Square size={24} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => audio.isPlaying ? audio.pause() : (selectedAudio && audio.play(selectedAudio.name, selectedAudio.url))}
                className="w-16 h-16 rounded-full glass-card flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                {audio.isPlaying ? <Volume2 size={28} /> : <VolumeX size={28} />}
              </motion.button>
            </>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => setShowAudioSelector(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Music size={18} />
            选择音频
          </button>
          {!timer.isRunning && !timer.isPaused && (
            <button
              onClick={() => setShowSettings(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Settings size={18} />
              设置时长
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-semibold">设置冥想时长</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-white/60 mb-4">选择或输入冥想时长（分钟）</p>
              
              <div className="grid grid-cols-4 gap-3 mb-6">
                {durationOptions.map(d => (
                  <motion.button
                    key={d}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDuration(d)}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      duration === d
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {d}
                  </motion.button>
                ))}
              </div>
              
              <div className="mb-6">
                <label className="block text-white/60 text-sm mb-2">自定义时长（5-120分钟）</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={duration}
                  onChange={e => setDuration(Math.max(5, Math.min(120, parseInt(e.target.value) || 5)))}
                  className="input-field text-center text-2xl font-bold"
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSettings(false)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Check size={20} />
                确认
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAudioSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAudioSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-semibold">选择音频</h3>
                <button
                  onClick={() => setShowAudioSelector(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,audio/mpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  上传自定义音频（MP3，≤20MB）
                </motion.button>
              </div>

              <h4 className="text-white/70 font-medium mb-3">内置音效</h4>
              <div className="space-y-3 mb-6">
                {mockBuiltInAudios.map(audioItem => (
                  <motion.button
                    key={audioItem.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAudioSelect({ type: 'built-in', name: audioItem.name, url: audioItem.url })}
                    className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                      selectedAudio?.name === audioItem.name
                        ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/20 border-2 border-primary-400/50'
                        : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                    }`}
                  >
                    <span className="text-3xl">{audioItem.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{audioItem.name}</p>
                      <p className="text-white/50 text-sm">{audioItem.description}</p>
                    </div>
                    {selectedAudio?.name === audioItem.name && (
                      <Check size={20} className="text-primary-400" />
                    )}
                  </motion.button>
                ))}
              </div>

              {audio.customAudios.length > 0 && (
                <>
                  <h4 className="text-white/70 font-medium mb-3">我的音频</h4>
                  <div className="space-y-3">
                    {audio.customAudios.map((audioItem, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAudioSelect({ type: 'custom', name: audioItem.name, url: audioItem.url })}
                        className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                          selectedAudio?.name === audioItem.name
                            ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/20 border-2 border-primary-400/50'
                            : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                        }`}
                      >
                        <span className="text-3xl">🎵</span>
                        <div className="flex-1 text-left">
                          <p className="font-medium">{audioItem.name}</p>
                          <p className="text-white/50 text-sm">自定义音频</p>
                        </div>
                        {selectedAudio?.name === audioItem.name && (
                          <Check size={20} className="text-primary-400" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMoodSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card p-8 w-full max-w-lg text-center"
            >
              <div className="text-6xl mb-4 animate-bounce">✨</div>
              <h3 className="text-2xl font-display font-bold mb-2">
                太棒了！
              </h3>
              <p className="text-white/60 mb-6">
                你完成了 {timer.isRunning || timer.isPaused 
                  ? Math.ceil((timer.totalSeconds - timer.remainingSeconds) / 60)
                  : duration} 分钟的冥想
              </p>
              
              <MoodSelector
                selectedMood={selectedMood}
                onSelect={handleMoodSelect}
              />
              
              <div className="flex gap-4 mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowMoodSelector(false);
                    setSelectedMood(null);
                    timer.reset();
                  }}
                  className="btn-secondary flex-1"
                >
                  跳过
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCompleteSession}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={!selectedMood}
                >
                  <Check size={20} />
                  完成
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
