'use client';

import React, { useState, useEffect } from 'react';
import { Coins, Plus, Trash2, Edit2, Save, X, IndianRupee, Loader2, Sparkles, Tag } from 'lucide-react';

interface GoldPlan {
  id?: string;
  coins: number;
  originalPrice: number;
  actualPrice: number;
  talktime: string;
  tag?: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<GoldPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<GoldPlan>({ coins: 0, originalPrice: 0, actualPrice: 0, talktime: '', tag: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      setPlans(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...formData, id: editingId } : formData),
      });
      if (res.ok) {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ coins: 0, originalPrice: 0, actualPrice: 0, talktime: '', tag: '' });
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    try {
      await fetch(`/api/plans?id=${id}`, { method: 'DELETE' });
      fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Monetization</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Gold Plans</h1>
          <p className="text-gray-500 mt-1">Manage coin packages and promotional pricing for the user shop.</p>
        </div>
        
        <button 
          onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ coins: 0, originalPrice: 0, actualPrice: 0, talktime: '', tag: '' }); }}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create New Plan
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(isAdding || editingId) && (
          <div className="col-span-1 lg:col-span-3">
             <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
                <div className="flex flex-wrap gap-8 items-end">
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Coin Amount</label>
                    <div className="relative group">
                      <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                      <input 
                        type="number"
                        value={formData.coins}
                        onChange={(e) => setFormData({...formData, coins: Number(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all"
                        placeholder="e.g. 500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Original Price (Show Scratched)</label>
                    <div className="relative group">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="number"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({...formData, originalPrice: Number(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white/50 line-through focus:outline-none focus:border-orange-500/50 transition-all"
                        placeholder="e.g. 999"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Actual Selling Price</label>
                    <div className="relative group">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      <input 
                        type="number"
                        value={formData.actualPrice}
                        onChange={(e) => setFormData({...formData, actualPrice: Number(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white font-black text-lg focus:outline-none focus:border-orange-500/50 transition-all"
                        placeholder="e.g. 499"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Est. Talktime</label>
                    <div className="relative group">
                      <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                      <input 
                        type="text"
                        value={formData.talktime}
                        onChange={(e) => setFormData({...formData, talktime: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all"
                        placeholder="e.g. 15 mins"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Badge Tag</label>
                    <div className="relative group">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                      <input 
                        type="text"
                        value={formData.tag || ''}
                        onChange={(e) => setFormData({...formData, tag: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all uppercase placeholder:normal-case font-mono"
                        placeholder="e.g. Bestseller"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 min-w-[250px]">
                    <button 
                      type="button"
                      onClick={() => { setIsAdding(false); setEditingId(null); }}
                      className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingId ? 'Update Plan' : 'Save Plan'}
                    </button>
                  </div>
                </div>
             </form>
          </div>
        )}

        {plans.map((plan) => (
          <div key={plan.id} className="group relative bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:border-orange-500/30 transition-all hover:bg-white/[0.08] flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-500/10 rounded-2xl border border-orange-500/20 flex items-center justify-center mb-6 relative">
              <Coins className="w-8 h-8 text-orange-500" />
              {plan.tag && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-pink-600 to-orange-500 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg uppercase tracking-tighter animate-bounce duration-[2000ms]">
                  {plan.tag}
                </div>
              )}
            </div>
            
            <h3 className="text-3xl font-black text-white mb-2">{plan.coins.toLocaleString()}</h3>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Gold Coins Package</p>
            {plan.talktime && (
              <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[10px] uppercase tracking-wider mb-6 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                <Sparkles className="w-3 h-3" />
                {plan.talktime} Talktime
              </div>
            )}
            
            <div className="space-y-1 mb-8">
              <p className="text-gray-500 line-through text-sm font-medium">₹{plan.originalPrice}</p>
              <p className="text-4xl font-black text-white">₹{plan.actualPrice}</p>
              {plan.originalPrice > plan.actualPrice && (
                <div className="inline-block px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-tighter mt-2">
                  SAVE {Math.round(((plan.originalPrice - plan.actualPrice) / plan.originalPrice) * 100)}%
                </div>
              )}
            </div>

            <div className="flex w-full gap-3 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={() => {
                  setEditingId(plan.id!);
                  setFormData(plan);
                  setIsAdding(false);
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold border border-white/5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button 
                onClick={() => deletePlan(plan.id!)}
                className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {loading && (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            <p className="text-gray-500 font-medium">Fetching active plans...</p>
          </div>
        )}

        {!loading && plans.length === 0 && !isAdding && (
          <div className="col-span-full py-20 bg-white/5 border border-white/10 border-dashed rounded-[2.5rem] flex flex-col items-center group">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Tag className="w-10 h-10 text-gray-700" />
            </div>
            <p className="text-gray-400 font-bold text-xl">No gold plans found</p>
            <p className="text-gray-600 text-sm mt-1">Start by adding your first pricing package</p>
          </div>
        )}
      </div>
    </div>
  );
}
