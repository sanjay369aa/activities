import { TaskCategory } from '../types';

export interface StickerInfo {
  emoji: string;
  label: string;
  gradient: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
}

// Return contextual sticker based on task title and category
export function getTaskSticker(title: string, category: TaskCategory): StickerInfo {
  const lower = title.toLowerCase();

  // Keyword-based matches first
  if (lower.includes('wake') || lower.includes('rise') || lower.includes('morning')) {
    return {
      emoji: '🌅',
      label: 'Rise & Shine',
      gradient: 'from-amber-400 to-orange-400',
      bgLight: 'bg-amber-50/90',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-200/80',
    };
  }
  if (lower.includes('water') || lower.includes('hydrat')) {
    return {
      emoji: '💧',
      label: 'Hydrate',
      gradient: 'from-cyan-400 to-blue-500',
      bgLight: 'bg-cyan-50/90',
      textColor: 'text-cyan-800',
      borderColor: 'border-cyan-200/80',
    };
  }
  if (
    lower.includes('jog') ||
    lower.includes('run') ||
    lower.includes('gym') ||
    lower.includes('workout') ||
    lower.includes('exercise') ||
    lower.includes('walk') ||
    lower.includes('yoga')
  ) {
    return {
      emoji: '⚡',
      label: 'Energy',
      gradient: 'from-emerald-400 to-teal-500',
      bgLight: 'bg-emerald-50/90',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-200/80',
    };
  }
  if (lower.includes('breakfast') || lower.includes('coffee') || lower.includes('tea')) {
    return {
      emoji: '🍳',
      label: 'Fuel',
      gradient: 'from-amber-300 to-yellow-500',
      bgLight: 'bg-yellow-50/90',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200/80',
    };
  }
  if (lower.includes('lunch')) {
    return {
      emoji: '🥗',
      label: 'Nourish',
      gradient: 'from-lime-400 to-emerald-500',
      bgLight: 'bg-lime-50/90',
      textColor: 'text-lime-800',
      borderColor: 'border-lime-200/80',
    };
  }
  if (lower.includes('dinner')) {
    return {
      emoji: '🍲',
      label: 'Dine',
      gradient: 'from-orange-400 to-rose-400',
      bgLight: 'bg-orange-50/90',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-200/80',
    };
  }
  if (
    lower.includes('study') ||
    lower.includes('python') ||
    lower.includes('code') ||
    lower.includes('read') ||
    lower.includes('book') ||
    lower.includes('homework')
  ) {
    return {
      emoji: '✨',
      label: 'Deep Focus',
      gradient: 'from-blue-400 to-indigo-500',
      bgLight: 'bg-indigo-50/90',
      textColor: 'text-indigo-800',
      borderColor: 'border-indigo-200/80',
    };
  }
  if (lower.includes('college') || lower.includes('class') || lower.includes('lecture')) {
    return {
      emoji: '🎓',
      label: 'Campus',
      gradient: 'from-violet-400 to-purple-500',
      bgLight: 'bg-purple-50/90',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200/80',
    };
  }
  if (lower.includes('sleep') || lower.includes('bed') || lower.includes('rest') || lower.includes('relax')) {
    return {
      emoji: '🌙',
      label: 'Sweet Rest',
      gradient: 'from-indigo-400 to-purple-600',
      bgLight: 'bg-purple-50/90',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200/80',
    };
  }
  if (lower.includes('meditat') || lower.includes('mindful') || lower.includes('breathe')) {
    return {
      emoji: '🌿',
      label: 'Peace',
      gradient: 'from-teal-300 to-emerald-400',
      bgLight: 'bg-teal-50/90',
      textColor: 'text-teal-800',
      borderColor: 'border-teal-200/80',
    };
  }

  // Category fallbacks
  switch (category) {
    case 'Personal':
      return {
        emoji: '🌸',
        label: 'Self Care',
        gradient: 'from-rose-300 to-pink-400',
        bgLight: 'bg-rose-50/90',
        textColor: 'text-rose-800',
        borderColor: 'border-rose-200/80',
      };
    case 'Study':
      return {
        emoji: '📘',
        label: 'Study',
        gradient: 'from-sky-400 to-blue-500',
        bgLight: 'bg-sky-50/90',
        textColor: 'text-sky-800',
        borderColor: 'border-sky-200/80',
      };
    case 'College':
      return {
        emoji: '🎒',
        label: 'College',
        gradient: 'from-indigo-400 to-indigo-600',
        bgLight: 'bg-indigo-50/90',
        textColor: 'text-indigo-800',
        borderColor: 'border-indigo-200/80',
      };
    case 'Exercise':
      return {
        emoji: '🏃',
        label: 'Move',
        gradient: 'from-emerald-400 to-teal-500',
        bgLight: 'bg-emerald-50/90',
        textColor: 'text-emerald-800',
        borderColor: 'border-emerald-200/80',
      };
    case 'Food':
      return {
        emoji: '🍎',
        label: 'Healthy',
        gradient: 'from-amber-400 to-orange-400',
        bgLight: 'bg-amber-50/90',
        textColor: 'text-amber-800',
        borderColor: 'border-amber-200/80',
      };
    case 'Sleep':
      return {
        emoji: '🌌',
        label: 'Dream',
        gradient: 'from-purple-400 to-indigo-600',
        bgLight: 'bg-purple-50/90',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-200/80',
      };
    default:
      return {
        emoji: '⭐',
        label: 'Daily Goal',
        gradient: 'from-slate-400 to-slate-600',
        bgLight: 'bg-slate-50/90',
        textColor: 'text-slate-800',
        borderColor: 'border-slate-200/80',
      };
  }
}
