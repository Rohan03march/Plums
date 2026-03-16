'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ShieldCheck, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Access denied. Only authorized admins can enter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050810] relative overflow-hidden font-sans">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-blob delay-2000" />
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] animate-blob delay-4000" />
      </div>

      {/* Floating Sparkles Decor */}
      <div className="absolute top-20 left-[20%] text-pink-500/20 animate-float">
        <Sparkles className="w-12 h-12" />
      </div>
      <div className="absolute bottom-20 right-[20%] text-purple-500/20 animate-float delay-2000">
        <Sparkles className="w-8 h-8" />
      </div>

      <div className="z-10 w-full max-w-[480px] p-6">
        <div className="glass-card relative p-10 rounded-[2.5rem] shadow-2xl overflow-hidden group">
          {/* Animated Edge Shimmer */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-pink-500/50 to-transparent animate-shimmer" />
          
          <div className="flex flex-col items-center mb-10">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-pink-500/30 mb-6 transform group-hover:rotate-6 transition-transform duration-500">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-4 border-[#050810] rounded-full" />
            </div>
            
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Welcome Back</h1>
            <p className="text-gray-400 text-center font-medium">Access your premium CRM dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold text-center animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Email Address</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within/input:text-pink-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-12 py-4 text-white font-medium focus:outline-none focus:border-pink-500/50 focus:bg-white/[0.06] transition-all placeholder:text-gray-600"
                  placeholder="admin@callapp.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Secure Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within/input:text-pink-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-12 py-4 text-white font-medium focus:outline-none focus:border-pink-500/50 focus:bg-white/[0.06] transition-all placeholder:text-gray-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black py-4.5 rounded-2xl shadow-2xl shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 group/btn"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 pointer-events-none" />
              <div className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying Identity...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Dashboard</span>
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5 text-center relative">
             <div className="absolute top-[-1px] left-1/2 -translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
             <p className="text-gray-500 text-[9px] uppercase tracking-[0.3em] font-black">Authorized Personnel Only</p>
          </div>
        </div>

        <p className="mt-8 text-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">
          Build v1.0.4 • © 2026 CallApp System
        </p>
      </div>
    </div>
  );
}
