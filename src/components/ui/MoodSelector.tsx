import { motion } from 'framer-motion';
import { getMoodEmoji, getMoodColor } from '../../utils/calculations';

interface MoodSelectorProps {
  selectedMood: number | null;
  onSelect: (mood: number) => void;
  showLabels?: boolean;
}

const moodLabels = [
  '很糟糕', '糟糕', '不好', '一般', '还好',
  '不错', '很好', '非常好', '极好', '完美'
];

export default function MoodSelector({ selectedMood, onSelect, showLabels = true }: MoodSelectorProps) {
  return (
    <div className="w-full">
      {showLabels && (
        <p className="text-center text-white/70 mb-4">
          请选择您现在的情绪状态
        </p>
      )}
      
      <div className="flex flex-wrap justify-center gap-3 md:gap-4">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => {
          const isSelected = selectedMood === level;
          const color = getMoodColor(level);
          
          return (
            <motion.button
              key={level}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(level)}
              className={`mood-btn ${isSelected ? 'selected' : ''}`}
              style={{
                background: isSelected 
                  ? `linear-gradient(135deg, ${color}, ${color}dd)` 
                  : 'rgba(255,255,255,0.1)',
                border: `2px solid ${isSelected ? color : 'rgba(255,255,255,0.2)'}`
              }}
            >
              <span className="text-2xl">{getMoodEmoji(level)}</span>
            </motion.button>
          );
        })}
      </div>
      
      {showLabels && selectedMood && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-4"
        >
          <p className="text-lg font-medium" style={{ color: getMoodColor(selectedMood) }}>
            {moodLabels[selectedMood - 1]} · {selectedMood}/10
          </p>
        </motion.div>
      )}
    </div>
  );
}
