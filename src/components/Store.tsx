import React, { useState, useRef } from 'react';
import { Pokeball } from './Pokeball';
import { StoreItem } from '../types';
import { Gift, Image as ImageIcon, Plus } from 'lucide-react';

interface StoreProps {
  items: StoreItem[];
  totalStamps: number;
  isAdmin: boolean;
  onRedeem: (item: StoreItem) => void;
  onAddItem: (name: string, imageUrl: string, cost: number) => Promise<void>;
}

export function Store({ items, totalStamps, isAdmin, onRedeem, onAddItem }: StoreProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState(10);
  const [newItemImage, setNewItemImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItemImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemImage) return;
    
    setIsSubmitting(true);
    await onAddItem(newItemName, newItemImage, newItemCost);
    setNewItemName('');
    setNewItemCost(10);
    setNewItemImage('');
    setShowAdd(false);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Gift className="text-red-500" />
          獎勵兌換所
        </h2>
        
        {isAdmin && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-medium hover:bg-red-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增商品
          </button>
        )}
      </div>

      {isAdmin && showAdd && (
        <form onSubmit={handleAddItem} className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 space-y-4">
          <h3 className="font-bold text-gray-900 mb-4">新增商品</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品名稱</label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">需要好棒章數量</label>
            <input
              type="number"
              min="1"
              value={newItemCost}
              onChange={(e) => setNewItemCost(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品圖片</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-red-300 cursor-pointer transition-colors overflow-hidden relative"
            >
              {newItemImage ? (
                <img src={newItemImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                  <span className="text-sm">點擊上傳圖片</span>
                </>
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newItemImage || !newItemName}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium disabled:opacity-50"
            >
              確認新增
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
            目前還沒有商品喔！
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col">
              <div className="aspect-square relative overflow-hidden bg-gray-50">
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                <div className="flex items-center gap-1 text-red-500 font-bold mb-4">
                  <Pokeball className="w-4 h-4 text-red-500 opacity-100" />
                  {item.cost}
                </div>
                
                <div className="mt-auto pt-2">
                  <button
                    onClick={() => onRedeem(item)}
                    disabled={totalStamps < item.cost || isSubmitting}
                    className="w-full py-2.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2
                      disabled:opacity-50 disabled:cursor-not-allowed
                      bg-red-500 hover:bg-red-600 text-white"
                  >
                    {totalStamps < item.cost ? '好棒章不足' : '立即兌換'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
