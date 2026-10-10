import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Ticket, 
  ShieldCheck, 
  QrCode, 
  Clock, 
  Zap, 
  Lock, 
  UserCheck, 
  Briefcase, 
  User, 
  Scan,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  // Mode: 'login' or 'signup'
  const [isSignUp, setIsSignUp] = useState(false);

  // Selected role for quick login card
  const [selectedRole, setSelectedRole] = useState('organizer');

  // Login form state (pre-filled with organizer by default)
  const [email, setEmail] = useState('organizer@eventsphere.com');
  const [password, setPassword] = useState('Password123!');
  
  // Sign up state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Demo accounts map
  const demoRoleConfig = {
    organizer: {
      title: 'Organizer',
      desc: 'Host & manage events',
      email: 'organizer@eventsphere.com',
      password: 'Password123!',
      icon: Briefcase,
      route: '/organizer/dashboard'
    },
    user: {
      title: 'User',
      desc: 'Discover & book tickets',
      email: 'user@eventsphere.com',
      password: 'Password123!',
      icon: User,
      route: '/user/home'
    },
    gate: {
      title: 'Gate Scanner',
      desc: 'Fast venue check-in',
      email: 'gate@eventsphere.com',
      password: 'Password123!',
      icon: Scan,
      route: '/gate/scanner'
    }
  };

  const handleSelectRole = (roleKey) => {
    setSelectedRole(roleKey);
    setEmail(demoRoleConfig[roleKey].email);
    setPassword(demoRoleConfig[roleKey].password);
    setErrorMessage('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      const role = res.user.role;
      if (role === 'organizer') {
        navigate('/organizer/dashboard');
      } else if (role === 'gate') {
        navigate('/gate/scanner');
      } else {
        navigate('/user/home');
      }
    } else {
      setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const res = await register(signupName, signupEmail, signupPassword, 'user');
    setLoading(false);

    if (res.success) {
      navigate('/user/home');
    } else {
      setErrorMessage(res.error || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-stretch">
      {/* LEFT COLUMN: Concert ambiance + sunset gradient + branding & value props */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-neutral-900 text-white flex-col justify-between p-12 overflow-hidden">
        {/* Background photo & sunset overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1600&q=80')"
          }}
        />
        {/* Rich Sunset to Plum gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-sunset-peach/80 via-sunset-pink/85 to-plum-900/95 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-plum-900 via-transparent to-black/30" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-xl">
            <Ticket className="w-6 h-6 rotate-45 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              EventSphere
            </h1>
            <p className="text-xs font-medium text-white/75 tracking-wider uppercase">
              Ticketing & Event Management
            </p>
          </div>
        </div>

        {/* Center Hero Messaging */}
        <div className="relative z-10 max-w-lg my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase text-white/90 mb-5 border border-white/20">
            <span>High-Concurrency Platform</span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight text-white mb-4">
            Great Events Start Here
          </h2>
          <p className="text-base text-white/85 leading-relaxed mb-8 font-normal">
            A production-ready event ticketing platform built for peak drops, instant gate check-ins, and zero double-bookings.
          </p>

          {/* Three Feature Points from Spec */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 transition-all hover:bg-white/15">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-white">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Fake-proof QR Tickets</h3>
                <p className="text-xs text-white/75">Cryptographically signed digital passes verified instantly at the venue entrance.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 transition-all hover:bg-white/15">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-white">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Real-time Seat Holds</h3>
                <p className="text-xs text-white/75">5-minute high-concurrency Redis holds with automated expiration safeguards.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 transition-all hover:bg-white/15">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-white">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Fast Check-in</h3>
                <p className="text-xs text-white/75">Sub-second gate staff scanner with instant duplicate attempt rejection.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info badge */}
        <div className="relative z-10 flex items-center justify-between text-xs text-white/70 pt-6 border-t border-white/15">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-white/90" />
            <span>EventSphere · Secure · Scalable · Built for Real Events</span>
          </div>
          <span>Phase 1 Architecture</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Login Card & Role Selector */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 md:p-14 bg-cream">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-cream-300">
          
          {/* Mobile branding header */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-plum flex items-center justify-center text-white">
              <Ticket className="w-5 h-5 rotate-45" />
            </div>
            <span className="font-black text-xl text-plum">EventSphere</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-black text-plum-900 tracking-tight">
              {isSignUp ? 'Create your Account' : 'Welcome to EventSphere'}
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              {isSignUp 
                ? 'Register as an attendee to discover and book live events.' 
                : 'Select your role or enter credentials to access your portal.'}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isSignUp ? (
            <>
              {/* Three Role Cards */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2.5">
                  Select Role (1-Click Demo Access)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {Object.entries(demoRoleConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = selectedRole === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectRole(key)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'bg-plum-100 border-plum text-plum shadow-sm ring-2 ring-plum/20'
                            : 'bg-white border-cream-300 text-neutral-600 hover:border-plum-300 hover:bg-plum-50/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${
                          isSelected ? 'bg-plum text-white shadow-sm' : 'bg-cream-200 text-neutral-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold leading-tight">{config.title}</span>
                        <span className="text-[10px] text-neutral-400 leading-tight mt-0.5 line-clamp-1">
                          {key === 'gate' ? 'Scanner' : key === 'organizer' ? 'Host' : 'Attendee'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Login Box */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-neutral-700">
                      Password
                    </label>
                    <span className="text-[11px] text-neutral-400 cursor-not-allowed">
                      Forgot password?
                    </span>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                  />
                </div>

                {/* Demo mode prompt requirement */}
                <p className="text-[11px] text-neutral-500 font-medium bg-cream-100 p-2 rounded-lg border border-cream-200 text-center">
                  💡 Demo mode: credentials are pre-filled for each role.
                </p>

                {/* Plum Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-plum hover:bg-plum-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-plum/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Login to EventSphere</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Secure & Encrypted note */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Secure & Encrypted 256-bit JWT Session</span>
              </div>

              {/* "or / Login with different account" divider and link (strictly for looks only) */}
              <div className="my-5 relative flex items-center justify-center">
                <div className="border-t border-cream-300 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-medium text-neutral-400 absolute uppercase tracking-wider">
                  or
                </span>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  className="text-xs font-semibold text-neutral-400 hover:text-neutral-500 cursor-default select-none transition"
                  title="Kept for looks only (non-functional)"
                >
                  Login with different account
                </button>
              </div>

              {/* Sign up link for users */}
              <div className="mt-5 pt-4 border-t border-cream-200 text-center text-xs text-neutral-600">
                <span>New to EventSphere? </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMessage('');
                  }}
                  className="font-bold text-plum hover:underline"
                >
                  Sign up
                </button>
              </div>
            </>
          ) : (
            /* Sign Up View for Users */
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                />
              </div>

              <div className="p-3 rounded-xl bg-plum-50 border border-plum-200 text-xs text-plum-900">
                Attendee accounts have full access to explore events, reserve tickets, and view passes.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-plum hover:bg-plum-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-plum/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Attendee Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-4 pt-4 border-t border-cream-200 text-center text-xs text-neutral-600">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMessage('');
                  }}
                  className="font-bold text-plum hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
