import React, { useState, useEffect } from 'react';

export default function LoginGate({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Clear error on type
  useEffect(() => {
    if (password) setError('');
  }, [password]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
      if (password === adminPassword) {
        sessionStorage.setItem('ums_admin_password', password);
        onLogin();
      } else {
        setError('Incorrect password. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500); // Reset shake animation
        setPassword('');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #8B0000 0%, #C41E3A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorations */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)' }} />

      <div style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 10 }}>
        {/* Logo card */}
        <div style={{ textAlign: 'center', marginBottom: '32px', animation: 'fadeInDown 0.5s ease-out' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '20px',
            background: 'linear-gradient(135deg, #E8C96D 0%, #C9A84C 100%)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '32px', fontWeight: '800', color: '#8B0000',
            boxShadow: '0 12px 32px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.4)',
          }}>L</div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            Admin Portal
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>
            LPU Academic Calendar Management
          </p>
        </div>

        {/* Form card */}
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.98)', 
            backdropFilter: 'blur(20px)',
            borderRadius: '24px', padding: '32px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            animation: 'fadeInUp 0.5s ease-out',
            transform: shake ? 'translateX(0)' : 'none',
          }}
          className={shake ? 'animate-shake' : ''}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4B5563', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Admin Password
              </label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoFocus
                  style={{
                    width: '100%', background: '#F3F4F6', border: '2px solid transparent',
                    borderRadius: '12px', padding: '12px 14px 12px 40px', fontSize: '15px', color: '#1F2937',
                    outline: 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', fontFamily: 'Inter, sans-serif',
                    fontWeight: '500',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#8B0000'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(139,0,0,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#F3F4F6'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px',
                padding: '12px 14px', marginBottom: '20px', fontSize: '13px', color: '#DC2626',
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ marginTop: '2px', flexShrink: 0 }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span style={{ fontWeight: '500', lineHeight: 1.4 }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%', background: loading || !password ? '#E5E7EB' : 'linear-gradient(135deg, #8B0000 0%, #A31515 100%)',
                border: 'none', borderRadius: '12px', padding: '14px',
                color: loading || !password ? '#9CA3AF' : '#fff', fontSize: '15px', fontWeight: '700', 
                cursor: loading || !password ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em',
                boxShadow: loading || !password ? 'none' : '0 4px 14px rgba(139,0,0,0.3)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
              }}
              onMouseEnter={e => { if (!loading && password) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(139,0,0,0.4)'; } }}
              onMouseLeave={e => { if (!loading && password) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(139,0,0,0.3)'; } }}
              onMouseDown={e => { if (!loading && password) { e.currentTarget.style.transform = 'translateY(1px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,0,0,0.2)'; } }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '24px', fontWeight: '500' }}>
          Lovely Professional University · Academic Portal
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}
