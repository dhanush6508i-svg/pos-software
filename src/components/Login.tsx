/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Store, ShieldAlert, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { LocalDB } from '../services/db';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = LocalDB.getAuthPassword();
    if (password === correctPassword) {
      setError('');
      onLoginSuccess();
    } else {
      setError('Incorrect Admin Password! Try default: admin123');
    }
  };

  return (
    <div id="login-screen-container" className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Delicate background blur elements */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-650 text-indigo-600 mb-4 shadow-xs">
            <Store size={28} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-display">
            Point of Sale (POS)
          </h1>
          <p className="text-slate-400 text-xs mt-1 text-center font-medium uppercase tracking-wider">
            Admin Authentication Gate
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Lock size={16} />
              </span>
              <input
                id="admin-password-input"
                type="password"
                placeholder="Enter system secret key..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-550 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-650 text-red-600 p-3 rounded-xl text-xs leading-relaxed"
            >
              <ShieldAlert className="shrink-0 mt-0.5 text-red-500" size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            id="login-submit-button"
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm text-sm"
          >
            <KeyRound size={16} />
            Unlock POS Terminal
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Default Administrator Access Key is <code className="bg-slate-50 px-1.5 py-0.5 rounded text-indigo-600 border border-slate-200/50 font-mono">admin123</code>. You can update this inside Settings once authenticated.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
