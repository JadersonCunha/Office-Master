export type Program = 'Excel' | 'Word' | 'PowerPoint' | 'Workspace';

export interface Shortcut {
  id: string;
  keys: string;
  action: string;
  category: string;
  program: Program;
}

export interface Tip {
  id: string;
  title: string;
  description: string;
  fullTutorial: string;
  program: Program;
  xp: number;
}

export interface Exercise {
  id: string;
  title: string;
  task: string;
  instructions: string[];
  program: Program;
  xp: number;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
}

export interface UserStats {
  xp: number;
  level: number;
  completedExercises: string[];
  readTips: string[];
  unlockedBadges: string[];
  survivalManualUnlocked: boolean;
}

export interface SurvivalTopic {
  id: string;
  program: Program;
  title: string;
  content: string;
}

export interface FAQ {
  id: string;
  program: Program;
  question: string;
  answer: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
}
