import React, { useState, useEffect } from 'react';
import { db, auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, runTransaction, deleteDoc } from 'firebase/firestore';
import { StampLog, QuickAction, StoreItem } from './types';
import { StampManager } from './components/StampManager';
import { LogHistory } from './components/LogHistory';
import { Store } from './components/Store';
import { LoginScreen } from './components/LoginScreen';
import { Pokeball } from './components/Pokeball';
import { Award, History, Store as StoreIcon, LogOut } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'manager' | 'history' | 'store'>('manager');
  const isAdmin = true;
  
  const [totalStamps, setTotalStamps] = useState(0);
  const [logs, setLogs] = useState<StampLog[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!user) return; // Only fetch data if logged in

    // Listen to total stamps
    const statsRef = doc(db, 'stats', 'main');
    const unsubscribeStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setTotalStamps(docSnap.data().totalStamps || 0);
      } else {
        setDoc(statsRef, { totalStamps: 0 }).catch(console.error);
      }
    }, (err) => {
      console.error(err);
      setIsLoading(false);
    });

    // Listen to logs
    const qLogs = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
    const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StampLog[]);
    }, console.error);

    // Listen to quick actions
    const unsubscribeQuick = onSnapshot(collection(db, 'quick_actions'), (snapshot) => {
      setQuickActions(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuickAction[]);
    }, console.error);

    // Listen to store items
    const unsubscribeStore = onSnapshot(collection(db, 'store_items'), (snapshot) => {
      setStoreItems(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StoreItem[]);
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setIsLoading(false);
    });

    return () => {
      unsubscribeStats();
      unsubscribeLogs();
      unsubscribeQuick();
      unsubscribeStore();
    };
  }, [user]);

  const handleAddLog = async (reason: string, amount: number, type: 'reward' | 'punish') => {
    if (!window.confirm(`確定要${type === 'reward' ? '給予' : '扣除'} ${amount} 個好棒章嗎？\n事由：${reason}`)) {
      return;
    }
    try {
      const statsRef = doc(db, 'stats', 'main');
      
      await runTransaction(db, async (transaction) => {
        const statsDoc = await transaction.get(statsRef);
        const currentTotal = statsDoc.exists() ? statsDoc.data().totalStamps : 0;
        
        let newTotal = currentTotal;
        if (type === 'reward') newTotal += amount;
        else if (type === 'punish') newTotal -= amount;

        transaction.set(statsRef, { totalStamps: newTotal });
        
        const newLogRef = doc(collection(db, 'logs'));
        transaction.set(newLogRef, {
          reason,
          amount,
          type,
          timestamp: Date.now()
        });
      });
    } catch (error) {
      console.error("Error adding log:", error);
      showToast("儲存失敗，請重試", "error");
    }
  };

  const handleResetStamps = async () => {
    try {
      if (!window.confirm("確定要重置所有好棒章嗎？這將會把章數歸零。")) {
        return;
      }
      const statsRef = doc(db, 'stats', 'main');
      await runTransaction(db, async (transaction) => {
        transaction.set(statsRef, { totalStamps: 0 });
        const newLogRef = doc(collection(db, 'logs'));
        transaction.set(newLogRef, {
          reason: '重置所有好棒章',
          amount: 0,
          type: 'punish',
          timestamp: Date.now()
        });
      });
      showToast("好棒章已重置", "success");
    } catch (error) {
      console.error("Error resetting stamps:", error);
      showToast("重置失敗，請重試", "error");
    }
  };

  const handleDeleteLog = async (log: StampLog) => {
    try {
      if (!window.confirm(`確定要刪除紀錄「${log.reason}」嗎？這會回復好棒章的數量。`)) {
        return;
      }

      const statsRef = doc(db, 'stats', 'main');
      const logRef = doc(db, 'logs', log.id);

      await runTransaction(db, async (transaction) => {
        const statsDoc = await transaction.get(statsRef);
        const currentTotal = statsDoc.exists() ? statsDoc.data().totalStamps : 0;
        
        let newTotal = currentTotal;
        if (log.type === 'reward') newTotal -= log.amount;
        else if (log.type === 'punish') newTotal += log.amount;
        else if (log.type === 'redeem') newTotal += log.amount;

        transaction.set(statsRef, { totalStamps: newTotal });
        transaction.delete(logRef);
      });
      showToast("紀錄已刪除", "success");
    } catch (error) {
      console.error("Error deleting log:", error);
      showToast("刪除失敗，請重試", "error");
    }
  };

  const handleRedeem = async (item: StoreItem) => {
    if (!window.confirm(`確定要花費 ${item.cost} 個好棒章來兌換「${item.name}」嗎？`)) {
      return;
    }
    try {
      const statsRef = doc(db, 'stats', 'main');
      
      await runTransaction(db, async (transaction) => {
        const statsDoc = await transaction.get(statsRef);
        const currentTotal = statsDoc.exists() ? statsDoc.data().totalStamps : 0;
        
        if (currentTotal < item.cost) {
          throw new Error("INSUFFICIENT_STAMPS");
        }

        const newTotal = currentTotal - item.cost;
        transaction.set(statsRef, { totalStamps: newTotal });
        
        const newLogRef = doc(collection(db, 'logs'));
        transaction.set(newLogRef, {
          reason: `兌換商品：${item.name}`,
          amount: item.cost,
          type: 'redeem',
          timestamp: Date.now()
        });
      });
      showToast(`成功兌換 ${item.name}！`, "success");
    } catch (error: any) {
      if (error.message === "INSUFFICIENT_STAMPS") {
        showToast("好棒章數量不足！", "error");
      } else {
        console.error("Error redeeming:", error);
        showToast("兌換失敗，請重試", "error");
      }
    }
  };

  const handleAddQuickAction = async (reason: string, amount: number, type: 'reward' | 'punish') => {
    try {
      await addDoc(collection(db, 'quick_actions'), {
        reason,
        amount,
        type
      });
      showToast("已新增常用動作", "success");
    } catch (error) {
      console.error("Error adding quick action:", error);
      showToast("儲存失敗，請重試", "error");
    }
  };

  const handleDeleteQuickAction = async (qa: QuickAction) => {
    try {
      await deleteDoc(doc(db, 'quick_actions', qa.id));
      showToast("常用紀錄已刪除", "success");
    } catch (error) {
      console.error("Error deleting quick action:", error);
      showToast("刪除失敗，請重試", "error");
    }
  };

  const handleAddStoreItem = async (name: string, imageUrl: string, cost: number) => {
    try {
      await addDoc(collection(db, 'store_items'), {
        name,
        imageUrl,
        cost
      });
      showToast("商品已上架", "success");
    } catch (error) {
      console.error("Error adding store item:", error);
      showToast("新增失敗，請重試", "error");
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Pokeball className="w-16 h-16 text-red-500 opacity-100 animate-bounce" />
          <p className="mt-4 text-gray-500 font-medium">驗證中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Pokeball className="w-16 h-16 text-red-500 opacity-100 animate-bounce" />
          <p className="mt-4 text-gray-500 font-medium">載入資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <Pokeball className="w-6 h-6 text-red-500 opacity-100" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Jason 的好棒章</h1>
              <p className="text-xs text-gray-500">紀錄與兌換系統</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => auth.signOut()}
              className="flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="登出系統"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Total Stamps Display */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-8 text-white shadow-lg shadow-red-500/20 text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 opacity-10">
            <Pokeball className="w-48 h-48" active={true} />
          </div>
          <p className="text-red-100 font-medium mb-2 relative z-10">目前累積好棒章</p>
          <div className="flex items-center justify-center gap-4 relative z-10">
            <Pokeball className="w-10 h-10 text-white opacity-100" active={true} />
            <span className="text-6xl font-black tracking-tight">{totalStamps}</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mt-8">
          {activeTab === 'manager' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <StampManager 
                onAddLog={(reason, amount, type) => handleAddLog(reason, amount, type)} 
                quickActions={quickActions}
                onAddQuickAction={handleAddQuickAction}
                onDeleteQuickAction={handleDeleteQuickAction}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <LogHistory 
                logs={logs} 
                isAdmin={isAdmin}
                onDeleteLog={(log) => handleDeleteLog(log)}
                onResetLogs={() => handleResetStamps()}
              />
            </div>
          )}

          {activeTab === 'store' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Store 
                items={storeItems} 
                totalStamps={totalStamps} 
                isAdmin={isAdmin}
                onRedeem={(item) => handleRedeem(item)}
                onAddItem={handleAddStoreItem}
              />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 pb-safe z-40">
        <div className="max-w-3xl mx-auto flex">
          <button
            onClick={() => setActiveTab('manager')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'manager' ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Award className="w-6 h-6" />
            <span className="text-[10px] font-bold">給予章</span>
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'store' ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <StoreIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold">兌換所</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'history' ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <History className="w-6 h-6" />
            <span className="text-[10px] font-bold">紀錄</span>
          </button>
        </div>
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-2 rounded-full shadow-lg font-medium text-sm flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
