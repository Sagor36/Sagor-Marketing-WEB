import { FormEvent, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib_supabase';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (!isSupabaseConfigured) throw new Error('Supabase configuration is missing. Check your .env file.');
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } });
        if (error) throw error;
        if (!data.session) setMessage('Account created. Check your email to confirm your address, then log in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Authentication failed.'); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#050A14] text-white flex items-center justify-center p-4 relative overflow-hidden">
    <div className="absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(circle at 15% 20%, #9a740e 0, transparent 30%), radial-gradient(circle at 85% 80%, #163b68 0, transparent 32%)'}} />
    <div className="relative w-full max-w-[1000px] grid lg:grid-cols-[1.05fr_.95fr] rounded-[30px] overflow-hidden border border-white/10 bg-[#0B1528]/90 shadow-2xl">
      <section className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#111E36] via-[#0B1528] to-[#070E1A] border-r border-white/10">
        <div><div className="w-14 h-14 rounded-2xl bg-[#EAB308] text-[#070E1A] grid place-items-center font-black text-xl shadow-lg shadow-yellow-500/20">S</div><p className="mt-7 text-xs tracking-[.28em] text-[#FACC15] font-bold">SAGOR MARKETING TEAM</p><h1 className="mt-4 text-4xl font-bold leading-tight">One workspace.<br/><span className="text-[#FACC15]">Every campaign.</span></h1><p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">A focused command center for marketing operations, team performance and campaign delivery.</p></div>
        <div className="flex items-center gap-3 text-xs text-slate-500"><ShieldCheck className="w-4 h-4 text-[#EAB308]"/> Secure access powered by Supabase</div>
      </section>
      <section className="p-7 sm:p-10 lg:p-12">
        <div className="lg:hidden mb-8"><p className="text-xs tracking-[.2em] text-[#FACC15] font-bold">SAGOR MARKETING TEAM</p><h1 className="mt-2 text-2xl font-bold">Workspace access</h1></div>
        <div className="mb-8"><p className="text-xs uppercase tracking-[.2em] text-[#FACC15] font-semibold">{mode === 'login' ? 'Welcome back' : 'Get started'}</p><h2 className="mt-2 text-3xl font-bold">{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2><p className="mt-2 text-sm text-slate-400">{mode === 'login' ? 'Enter your details to access the team dashboard.' : 'Create an account to join the workspace.'}</p></div>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && <label className="block"><span className="text-xs text-slate-300">Full name</span><div className="mt-1.5 relative"><UserRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-500"/><input required value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-xl bg-[#070E1A] border border-white/10 py-3 pl-10 pr-3 text-sm outline-none focus:border-[#EAB308]" placeholder="Your name"/></div></label>}
          <label className="block"><span className="text-xs text-slate-300">Email address</span><div className="mt-1.5 relative"><Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500"/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl bg-[#070E1A] border border-white/10 py-3 pl-10 pr-3 text-sm outline-none focus:border-[#EAB308]" placeholder="you@example.com"/></div></label>
          <label className="block"><span className="text-xs text-slate-300">Password</span><div className="mt-1.5 relative"><LockKeyhole className="absolute left-3 top-3.5 w-4 h-4 text-slate-500"/><input required minLength={8} type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl bg-[#070E1A] border border-white/10 py-3 pl-10 pr-11 text-sm outline-none focus:border-[#EAB308]" placeholder="At least 8 characters"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-3 text-slate-500">{showPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></label>
          {error && <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">{error}</p>}{message && <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">{message}</p>}
          <button disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#EAB308] hover:bg-[#FACC15] disabled:opacity-60 text-[#070E1A] font-bold py-3 text-sm transition-colors">{busy?'Please wait…':mode==='login'?'Sign In':'Create Account'} <ArrowRight className="w-4 h-4"/></button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">{mode==='login'?"Don't have an account?":"Already registered?"} <button onClick={()=>{setMode(mode==='login'?'signup':'login');setError('');setMessage('')}} className="text-[#FACC15] font-semibold hover:underline">{mode==='login'?'Sign up':'Sign in'}</button></p>
        <p className="mt-8 text-center text-[11px] text-slate-600">Protected team workspace · Supabase Authentication</p>
      </section>
    </div>
  </main>;
}
