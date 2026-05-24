import { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { authApi } from '../services/auth';
import { useAuth } from '../context/AuthContext';

const MJ_IMAGE = 'https://i.pinimg.com/736x/ee/62/ba/ee62baf7956ba0bed44fdbfd54644abe.jpg';

const ACCENT        = '#FF8C00';
const ACCENT_DIM    = 'rgba(255,140,0,0.7)';
const ACCENT_BORDER = 'rgba(255,140,0,0.2)';
const ACCENT_MUTED  = 'rgba(255,140,0,0.08)';

export default function Login() {
    const { login } = useAuth();

    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await authApi.login({ email, password });

            if (response.data?.user?.role !== 'admin' && response.data?.user?.role !== 'super-admin') {
                await authApi.logout();
                setError('Access denied. Authorized administrators only.');
                setLoading(false);
                return;
            }

            login(response.data?.user);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
                .font-cinzel     { font-family: 'Cinzel', serif; }
                .font-cormorant  { font-family: 'Cormorant Garamond', Georgia, serif; }
                .input-field::placeholder { color: #555555; }
                .input-field:focus {
                    border-color: rgba(255,140,0,0.5);
                    background-color: #111111;
                }
                .field-group:focus-within .input-icon { color: ${ACCENT}; }
                .submit-btn:hover:not(:disabled) {
                    background-color: ${ACCENT};
                    color: #050505;
                    box-shadow: 0 0 24px rgba(255,140,0,0.25);
                }
            `}</style>

            <div className="font-cormorant min-h-screen flex flex-col md:flex-row bg-[#050505]">

                {/* Mobile Hero */}
                <div className="relative md:hidden h-[44vh] min-h-[280px] overflow-hidden">
                    <img
                        src={MJ_IMAGE}
                        alt="Michael Jackson"
                        className="w-full h-full object-cover object-top"
                        style={{ filter: 'grayscale(15%) contrast(1.1)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#05050520] via-[#05050550] to-[#050505f0]" />
                    <div className="absolute bottom-7 left-7">
                        <div className="w-10 h-px mb-3" style={{ backgroundColor: ACCENT }} />
                        <p className="font-cinzel text-xl font-bold tracking-[3px] uppercase mb-1" style={{ color: ACCENT }}>
                            Mary's Moonwalker
                        </p>
                        <p className="font-cormorant text-sm italic tracking-wide" style={{ color: ACCENT_DIM }}>
                            The King of Pop Lives Forever
                        </p>
                    </div>
                </div>

                {/* Desktop Left Image Panel */}
                <div className="relative hidden md:block md:w-[55%] min-h-screen overflow-hidden flex-shrink-0">
                    <img
                        src={MJ_IMAGE}
                        alt="Michael Jackson"
                        className="absolute inset-0 w-full h-full object-cover object-top"
                        style={{ filter: 'grayscale(15%) contrast(1.1)' }}
                    />
                    <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(110deg, rgba(5,5,5,0.1) 0%, rgba(5,5,5,0.25) 45%, rgba(5,5,5,0.88) 100%)' }}
                    />
                    <div
                        className="absolute bottom-0 left-0 right-0 px-12 pb-28"
                        style={{ background: 'linear-gradient(to top, rgba(5,5,5,0.97) 0%, transparent 100%)' }}
                    >
                        <div className="w-12 h-px mb-5" style={{ backgroundColor: ACCENT }} />
                        <p className="font-cinzel text-[26px] font-bold tracking-[3px] uppercase mb-2" style={{ color: ACCENT }}>
                            Mary's Moonwalker
                        </p>
                        <p className="font-cormorant text-[16px] italic tracking-wider" style={{ color: ACCENT_DIM }}>
                            The King of Pop Lives Forever
                        </p>
                    </div>
                </div>

                {/* Form Panel */}
                <div className="flex-1 flex items-center justify-center px-8 py-14 md:px-12 bg-[#080808] relative">
                    <div
                        className="hidden md:block absolute top-0 left-0 w-px h-full"
                        style={{ background: `linear-gradient(to bottom, transparent, ${ACCENT_BORDER}, transparent)` }}
                    />

                    <div className="w-full max-w-[390px]">
                        <p className="font-cinzel text-[11px] tracking-[4px] uppercase mb-3" style={{ color: ACCENT }}>
                            Admin Workspace
                        </p>
                        <h1 className="font-cinzel text-white text-[30px] font-bold tracking-wide leading-tight mb-2">
                            Welcome Back
                        </h1>
                        <p className="font-cormorant text-[#999990] text-[18px] italic mb-10">
                            Sign in to continue to your dashboard
                        </p>

                        {error && (
                            <div className="bg-red-500/[0.07] border border-red-500/20 border-l-2 border-l-red-700 px-4 py-3 mb-7 rounded-sm">
                                <p className="text-red-400 text-[15px]">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="font-cinzel block text-[11px] tracking-[3px] uppercase mb-2" style={{ color: ACCENT_DIM }}>
                                    Email Address
                                </label>
                                <div className="field-group relative">
                                    <Mail
                                        size={15}
                                        className="input-icon absolute left-4 top-1/2 -translate-y-1/2 text-[#555555] transition-colors duration-300 pointer-events-none"
                                    />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-field w-full bg-[#0e0e0e] border border-[#222222] rounded-sm py-[14px] pl-11 pr-4 text-[#f0ece0] text-[16px] font-normal outline-none transition-all duration-300"
                                        placeholder="admin@marys-moonwalker.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-cinzel block text-[11px] tracking-[3px] uppercase mb-2" style={{ color: ACCENT_DIM }}>
                                    Password
                                </label>
                                <div className="field-group relative">
                                    <Lock
                                        size={15}
                                        className="input-icon absolute left-4 top-1/2 -translate-y-1/2 text-[#555555] transition-colors duration-300 pointer-events-none"
                                    />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input-field w-full bg-[#0e0e0e] border border-[#222222] rounded-sm py-[14px] pl-11 pr-4 text-[#f0ece0] text-[16px] font-normal outline-none transition-all duration-300"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="submit-btn w-full py-[15px] bg-transparent font-cinzel text-[11px] tracking-[4px] uppercase transition-all duration-300 flex items-center justify-center gap-3 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ border: `1px solid ${ACCENT}`, color: ACCENT }}
                                >
                                    {loading ? (
                                        <Loader2 size={15} className="animate-spin" />
                                    ) : (
                                        <>
                                            Access Dashboard
                                            <ArrowRight size={14} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-10 pt-6 flex items-center gap-3" style={{ borderTop: `1px solid #161616` }}>
                            <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: ACCENT_BORDER }} />
                            <span className="font-cinzel text-[#555555] text-[11px] tracking-[3px] uppercase">
                                Secure System · Version 2.1
                            </span>
                            <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: ACCENT_BORDER }} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}