import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, BookOpen, Brain, Tag } from 'lucide-react';
import type { StressSource, PracticeTag } from '../../types';

interface ReflectionCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { note?: string; stressSource?: StressSource; tags?: PracticeTag[] }) => void;
  durationMinutes: number;
  moodLevel: number;
}

const STRESS_SOURCES: { value: Exclude<StressSource, null>; emoji: string }[] = [
  { value: '工作', emoji: '💼' },
  { value: '学习', emoji: '📚' },
  { value: '人际', emoji: '👥' },
  { value: '家庭', emoji: '🏠' },
  { value: '健康', emoji: '💪' },
  { value: '其他', emoji: '💭' }
];

const PRACTICE_TAGS: { value: PracticeTag; emoji: string }[] = [
  { value: '放松', emoji: '😌' },
  { value: '专注', emoji: '🎯' },
  { value: '助眠', emoji: '🌙' },
  { value: '减压', emoji: '🧘' },
  { value: '晨间', emoji: '🌅' },
  { value: '睡前', emoji: '🛏️' },
  { value: '午休', emoji: '☕' },
  { value: '通勤', emoji: '🚇' }
];

const MOOD_EMOJIS = ['😢', '😞', '😔', '😐', '🙂', '😊', '😄', '😁', '🤗', '✨'];

export default function ReflectionCard({ isOpen, onClose, onSave, durationMinutes, moodLevel }: ReflectionCardProps) {
  const [note, setNote] = useState('');
  const [stressSource, setStressSource] = useState<StressSource>(null);
  const [selectedTags, setSelectedTags] = useState<PracticeTag[]>([]);

  const toggleTag = (tag: PracticeTag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSave = () => {
    const data: { note?: string; stressSource?: StressSource; tags?: PracticeTag[] } = {};
    if (note.trim()) data.note = note.trim();
    if (stressSource) data.stressSource = stressSource;
    if (selectedTags.length > 0) data.tags = selectedTags;
    
    onSave(data);
    setNote('');
    setStressSource(null);
    setSelectedTags([]);
    onClose();
  };

  const handleSkip = () => {
    setNote('');
    setStressSource(null);
    setSelectedTags([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleSkip}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass-card w-full max-w-lg rounded-3xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                  <BookOpen size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold">冥想复盘</h3>
                  <p className="text-white/50 text-sm">记录一下这次练习的感受吧</p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-around p-4 rounded-2xl bg-white/5">
                <div className="text-center">
                  <p className="text-4xl mb-1">{MOOD_EMOJIS[Math.max(0, Math.min(9, moodLevel - 1))]}</p>
                  <p className="text-white/50 text-sm">情绪 {moodLevel}/10</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-400 mb-1">{durationMinutes}<span className="text-base font-normal text-white/50 ml-1">分钟</span></p>
                  <p className="text-white/50 text-sm">练习时长</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={18} className="text-accent-400" />
                  <h4 className="font-medium">压力来源</h4>
                  <span className="text-white/40 text-xs ml-auto">(可选)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {STRESS_SOURCES.map(source => (
                    <button
                      key={source.value}
                      onClick={() => setStressSource(stressSource === source.value ? null : source.value)}
                      className={`px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 ${
                        stressSource === source.value
                          ? 'bg-accent-500/30 border border-accent-500/50 text-accent-300'
                          : 'bg-white/5 hover:bg-white/10 text-white/70 border border-transparent'
                      }`}
                    >
                      <span>{source.emoji}</span>
                      <span>{source.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={18} className="text-primary-400" />
                  <h4 className="font-medium">练习标签</h4>
                  <span className="text-white/40 text-xs ml-auto">(多选，可选)</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {PRACTICE_TAGS.map(tag => (
                    <button
                      key={tag.value}
                      onClick={() => toggleTag(tag.value)}
                      className={`px-2 py-2 rounded-xl text-xs transition-all flex flex-col items-center gap-1 ${
                        selectedTags.includes(tag.value)
                          ? 'bg-primary-500/30 border border-primary-500/50 text-primary-300'
                          : 'bg-white/5 hover:bg-white/10 text-white/70 border border-transparent'
                      }`}
                    >
                      <span className="text-lg">{tag.emoji}</span>
                      <span>{tag.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={18} className="text-purple-400" />
                  <h4 className="font-medium">练习备注</h4>
                  <span className="text-white/40 text-xs ml-auto">(可选，最多200字)</span>
                </div>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value.slice(0, 200))}
                  placeholder="记录这次冥想的感受、发现或任何想留下的话..."
                  className="w-full h-28 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-primary-500/50 focus:bg-white/10 resize-none transition-all"
                />
                <p className="text-right text-white/40 text-xs mt-1">{note.length}/200</p>
              </div>
            </div>

            <div className="p-6 pt-4 border-t border-white/10 flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-all"
              >
                跳过
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600 text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                保存复盘
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
