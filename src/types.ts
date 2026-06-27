export interface UserProfile {
  userId: string;
  role: "student" | "counsellor" | "admin";
  name: string;
  department: string;
  year: string;
  streak: number;
  badges: string[];
  avatarSeed: string; // plant type seed: 'succulent' | 'fern' | 'cactus' | 'rose'
}

export interface MoodLog {
  logId: string;
  userId: string;
  score: number; // 1 to 5
  notes: string;
  sentiment: "positive" | "neutral" | "negative" | "crisis";
  sleepHours: number;
  studyHours: number;
  screenTime: number;
  attendance: number;
  burnoutIndex: number; // calculated 0-100
  timestamp: string;
  tags: string[];
}

export interface CommunityPost {
  postId: string;
  authorId: string;
  authorAlias: string;
  content: string;
  category: "Exam Stress" | "Placement Anxiety" | "Homesickness" | "General Vent" | "Celebrating Wins";
  likes: number;
  timestamp: string;
  repliesCount: number;
  likedBy?: string[];
}

export interface CommunityReply {
  replyId: string;
  postId: string;
  authorId: string;
  authorAlias: string;
  content: string;
  timestamp: string;
}

export interface HighRiskAlert {
  alertId: string;
  userId: string;
  studentName: string;
  department: string;
  timestamp: string;
  severity: "medium" | "high" | "critical";
  status: "pending" | "resolved";
  reason: string;
  contextNotes: string;
}
