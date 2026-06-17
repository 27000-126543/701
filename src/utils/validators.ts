export function validateDuration(minutes: number): { valid: boolean; message?: string } {
  if (minutes === undefined || minutes === null) {
    return { valid: false, message: '时长为必填项' };
  }
  if (!Number.isInteger(minutes)) {
    return { valid: false, message: '时长必须为整数' };
  }
  if (minutes <= 0) {
    return { valid: false, message: '时长必须为正整数' };
  }
  return { valid: true };
}

export function validateMoodLevel(level: number): { valid: boolean; message?: string } {
  if (level === undefined || level === null) {
    return { valid: false, message: '请选择情绪等级' };
  }
  if (!Number.isInteger(level) || level < 1 || level > 10) {
    return { valid: false, message: '情绪等级必须为1-10之间的整数' };
  }
  return { valid: true };
}

export function validateAudioFile(file: File): { valid: boolean; message?: string } {
  const maxSize = 20 * 1024 * 1024;
  if (file.type !== 'audio/mpeg' && file.type !== 'audio/mp3') {
    return { valid: false, message: '仅支持MP3格式音频' };
  }
  if (file.size > maxSize) {
    return { valid: false, message: '音频文件大小不能超过20MB' };
  }
  return { valid: true };
}

export function validatePostContent(content: string): { valid: boolean; message?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, message: '内容不能为空' };
  }
  if (content.trim().length > 500) {
    return { valid: false, message: '内容不能超过500字' };
  }
  return { valid: true };
}

export function validateCommentContent(content: string): { valid: boolean; message?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, message: '评论内容不能为空' };
  }
  if (content.trim().length > 200) {
    return { valid: false, message: '评论不能超过200字' };
  }
  return { valid: true };
}
