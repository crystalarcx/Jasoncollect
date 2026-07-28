import React from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { StampLog } from '../types';
import { PlusCircle, MinusCircle, Gift, Trash2 } from 'lucide-react';

interface LogHistoryProps {
  logs: StampLog[];
  isAdmin?: boolean;
  onDeleteLog?: (log: StampLog) => void;
  onResetLogs?: () => void;
}

export function LogHistory({ logs, isAdmin, onDeleteLog, onResetLogs }: LogHistoryProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">歷程紀錄</h2>
        {isAdmin && onResetLogs && (
          <button
            onClick={onResetLogs}
            className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            重置好棒章
          </button>
        )}
      </div>
      
      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            目前還沒有紀錄喔！
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  log.type === 'reward' ? 'bg-red-100 text-red-500' : 
                  log.type === 'punish' ? 'bg-gray-100 text-gray-500' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {log.type === 'reward' && <PlusCircle className="w-5 h-5" />}
                  {log.type === 'punish' && <MinusCircle className="w-5 h-5" />}
                  {log.type === 'redeem' && <Gift className="w-5 h-5" />}
                </div>
                
                <div>
                  <p className="font-medium text-gray-900">{log.reason}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(log.timestamp, 'yyyy年MM月dd日 HH:mm', { locale: zhTW })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`font-bold text-lg ${
                  log.type === 'reward' ? 'text-red-500' : 
                  log.type === 'punish' ? 'text-gray-500' :
                  'text-yellow-600'
                }`}>
                  {log.type === 'reward' ? '+' : '-'}{log.amount}
                </div>
                
                {isAdmin && onDeleteLog && (
                  <button
                    onClick={() => onDeleteLog(log)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="刪除紀錄"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
