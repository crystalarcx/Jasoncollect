export type LogType = 'reward' | 'punish' | 'redeem';

export interface StampLog {
  id: string;
  timestamp: number;
  reason: string;
  amount: number;
  type: LogType;
}

export interface QuickAction {
  id: string;
  reason: string;
  amount: number;
  type: 'reward' | 'punish';
}

export interface StoreItem {
  id: string;
  name: string;
  imageUrl: string;
  cost: number;
}
