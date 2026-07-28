import React, { useState } from 'react';
import { Pokeball } from './Pokeball';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { QuickAction } from '../types';

interface StampManagerProps {
  onAddLog: (reason: string, amount: number, type: 'reward' | 'punish') => Promise<void>;
  quickActions: QuickAction[];
  onAddQuickAction: (reason: string, amount: number, type: 'reward' | 'punish') => Promise<void>;
  onDeleteQuickAction?: (qa: QuickAction) => void;
}

export function StampManager({ onAddLog, quickActions, onAddQuickAction, onDeleteQuickAction }: StampManagerProps) {
  const [amount, setAmount] = useState<string>('1');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddQuick, setShowAddQuick] = useState(false);
  
  const [quickReason, setQuickReason] = useState('');
  const [quickAmount, setQuickAmount] = useState<string>('1');
  const [quickType, setQuickType] = useState<'reward' | 'punish'>('reward');
  const [qaToDelete, setQaToDelete] = useState<QuickAction | null>(null);

  const pressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = React.useRef<boolean>(false);

  const handlePointerDown = (qa: QuickAction) => {
    clearTimer();
    longPressTriggered.current = false;
    pressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      if (onDeleteQuickAction) {
        setQaToDelete(qa);
      }
    }, 600);
  };

  const clearTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleSubmit = async (type: 'reward' | 'punish') => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    const parsedAmount = parseInt(amount, 10);
    const amountToSave = isNaN(parsedAmount) ? 1 : Math.max(1, parsedAmount);
    await onAddLog(reason, amountToSave, type);
    setReason('');
    setAmount('1');
    setIsSubmitting(false);
  };

  const handleQuickAction = async (qa: QuickAction) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    setIsSubmitting(true);
    await onAddLog(qa.reason, qa.amount, qa.type);
    setIsSubmitting(false);
  };

  const handleAddQuickAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReason.trim()) return;
    setIsSubmitting(true);
    const parsedAmount = parseInt(quickAmount, 10);
    const amountToSave = isNaN(parsedAmount) ? 1 : Math.max(1, parsedAmount);
    await onAddQuickAction(quickReason, amountToSave, quickType);
    setQuickReason('');
    setQuickAmount('1');
    setShowAddQuick(false);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">快速紀錄</h2>
          <button
            onClick={() => setShowAddQuick(!showAddQuick)}
            className="text-sm text-red-500 font-medium hover:text-red-600"
          >
            {showAddQuick ? '取消新增' : '+ 新增常用'}
          </button>
        </div>

        {showAddQuick && (
          <form onSubmit={handleAddQuickAction} className="mb-6 p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-200">
            <input
              type="text"
              value={quickReason}
              onChange={(e) => setQuickReason(e.target.value)}
              placeholder="事由 (例如：9:30前睡覺)"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              required
            />
            <div className="flex items-center gap-4">
              <select
                value={quickType}
                onChange={(e) => setQuickType(e.target.value as 'reward' | 'punish')}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                <option value="reward">獎勵 (加)</option>
                <option value="punish">處罰 (扣)</option>
              </select>
              <input
                type="number"
                min="1"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                className="w-24 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-center"
                placeholder="數量"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="ml-auto px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 font-medium"
              >
                儲存
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          {quickActions.map(qa => (
            <button
              key={qa.id}
              onClick={() => handleQuickAction(qa)}
              onPointerDown={() => handlePointerDown(qa)}
              onPointerUp={clearTimer}
              onPointerLeave={clearTimer}
              onPointerCancel={clearTimer}
              onContextMenu={(e) => {
                e.preventDefault();
                return false;
              }}
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors disabled:opacity-50 select-none touch-none ${
                qa.type === 'reward' 
                  ? 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100 hover:border-red-200' 
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 hover:border-gray-300'
              }`}
            >
              {qa.type === 'reward' ? <PlusCircle className="w-4 h-4" /> : <MinusCircle className="w-4 h-4" />}
              {qa.reason}
              <span className="font-bold">{qa.type === 'reward' ? '+' : '-'}{qa.amount}</span>
            </button>
          ))}
          {quickActions.length === 0 && !showAddQuick && (
            <p className="text-gray-500 text-sm">目前沒有常用事由，點擊右上角新增。</p>
          )}
        </div>
      </div>

      {/* Manual Entry */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6">自訂紀錄</h2>
        
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-4 text-center">選擇數量</label>
          <div className="flex flex-col items-center gap-6">
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setAmount(num.toString())}
                  className="group relative focus:outline-none focus:ring-4 focus:ring-red-500/20 rounded-full"
                >
                  <Pokeball 
                    className={`w-14 h-14 transition-transform duration-200 ${parseInt(amount, 10) >= num ? 'scale-110' : 'scale-100 group-hover:scale-105'}`} 
                    active={parseInt(amount, 10) >= num} 
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
              <span className="text-sm font-medium text-gray-600">自訂數量：</span>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-20 px-3 py-1.5 text-center font-bold rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">事由</label>
            <input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="請輸入原因..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleSubmit('reward')}
              disabled={isSubmitting || !reason.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              給予獎勵 (+{amount})
            </button>
            <button
              onClick={() => handleSubmit('punish')}
              disabled={isSubmitting || !reason.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MinusCircle className="w-5 h-5" />
              處罰扣章 (-{amount})
            </button>
          </div>
        </div>
      </div>

      {/* Delete Quick Action Confirm Modal */}
      {qaToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-gray-900">刪除常用紀錄</h3>
            <p className="text-gray-600 mb-6">確定要刪除常用紀錄「{qaToDelete.reason}」嗎？</p>
            <div className="flex gap-4">
              <button
                onClick={() => setQaToDelete(null)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (onDeleteQuickAction) {
                    onDeleteQuickAction(qaToDelete);
                  }
                  setQaToDelete(null);
                }}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
