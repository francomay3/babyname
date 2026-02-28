export type Gender = 'male' | 'female';

export interface BabyName {
  id: string;
  text: string;
  gender: Gender;
  addedBy: string;
  addedAt: Date;
}

export interface UserScore {
  id: string; // "${userId}_${nameId}"
  userId: string;
  nameId: string;
  gender: Gender;
  eloScore: number;
  wins: number;
  losses: number;
  matches: number;
}

export interface RankedName extends BabyName {
  eloScore: number;
  wins: number;
  losses: number;
  matches: number;
  allScores?: { userId: string; displayName: string; eloScore: number }[];
}

export interface Match {
  id: string;
  userId: string;
  winnerId: string;
  loserId: string;
  createdAt: Date;
}

export interface AdminConfig {
  uids: string[];
}
