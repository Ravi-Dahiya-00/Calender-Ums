import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import LoginGate from './components/LoginGate';
import EventForm from './components/EventForm';
import EventList from './components/EventList';
import dayjs from 'dayjs';
import './index.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!sessionStorage.getItem('ums_admin_password')
  );
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('add');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dashboardMetrics, setDashboardMetrics] = useState({ total: 0, next7Days: 0 });

  const fetchMetrics = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/events`);
      const allEvents = data.data || [];
      const now = dayjs();
      const next7 = now.add(7, 'day');
      const upcoming = allEvents.filter(e => {
        const start = dayjs(e.start);
        return (start.isAfter(now) || start.isSame(now, 'day')) && start.isBefore(next7);
      });
      setDashboardMetrics({ total: allEvents.length, next7Days: upcoming.length });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchMetrics();
  }, [isAuthenticated, fetchMetrics, refreshKey]);

  // Configure axios to always send the password as API Key
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token = sessionStorage.getItem('ums_admin_password');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  const handleSuccess = () => {
    setRefreshKey(k => k + 1);
    setActiveTab('list');
    setEditingEvent(null);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setActiveTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ums_admin_password');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) return <LoginGate onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div style={{ minHeight: '100vh', background: '#F4F5F7', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#fff', color: '#1F2937', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '14px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
          success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
          error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
        }}
      />

      {/* Header — Premium Glassmorphism */}
      <header style={{
        background: 'rgba(139, 0, 0, 0.95)',
        backdropFilter: 'blur(12px)',
        padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.1)',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px', 
            background: 'linear-gradient(135deg, #E8C96D 0%, #C9A84C 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '18px', color: '#8B0000',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>L</div>
          <div>
            <p style={{ fontSize: '16px', fontWeight: '800', color: '#fff', lineHeight: 1.1, letterSpacing: '-0.01em' }}>Calendar Admin</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>LPU Event Management</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href={import.meta.env.VITE_CALENDAR_URL || 'http://localhost:5173'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '13px', color: 'rgba(255,255,255,0.9)', padding: '8px 16px',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px',
              background: 'rgba(255,255,255,0.08)', textDecoration: 'none', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            <span>Preview</span>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
          <button
            onClick={handleLogout}
            style={{
              fontSize: '13px', color: 'rgba(255,255,255,0.7)', padding: '8px 16px',
              border: 'none', borderRadius: '10px',
              background: 'transparent', cursor: 'pointer', fontWeight: '600',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px 60px' }}>
        
        {/* iOS-Style Segmented Tabs */}
        <div style={{
          display: 'flex', background: '#E5E7EB', borderRadius: '12px', padding: '4px',
          marginBottom: '24px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
          maxWidth: '400px', margin: '0 auto 24px'
        }}>
          {[
            { key: 'add', label: editingEvent ? '✏️ Edit Event' : '➕ Add Event' },
            { key: 'list', label: '📋 All Events' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); if (tab.key !== 'add') setEditingEvent(null); }}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none',
                background: activeTab === tab.key ? '#fff' : 'transparent',
                color: activeTab === tab.key ? '#1F2937' : '#6B7280',
                fontSize: '14px', fontWeight: activeTab === tab.key ? '700' : '600', 
                cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === tab.key ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Metrics */}
        {activeTab === 'list' && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px',
            marginBottom: '24px', animation: 'fadeInUp 0.3s ease-out'
          }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                📋
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Active</p>
                <p style={{ fontSize: '24px', fontWeight: '800', color: '#111827', lineHeight: 1 }}>{dashboardMetrics.total}</p>
              </div>
            </div>
            
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                🔥
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next 7 Days</p>
                <p style={{ fontSize: '24px', fontWeight: '800', color: '#DC2626', lineHeight: 1 }}>{dashboardMetrics.next7Days}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Card */}
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '32px',
          border: '1px solid #E5E7EB', boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          animation: 'fadeInUp 0.4s ease-out'
        }}>
          {activeTab === 'add' ? (
            <>
              <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F3F4F6' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', letterSpacing: '-0.02em' }}>
                  {editingEvent ? `Editing Event: ${editingEvent.title}` : 'Create New Event'}
                </h2>
                <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                  {editingEvent ? 'Make changes to this event and save to update the calendar.' : 'Fill out the details below to add a new event to the academic calendar.'}
                </p>
              </div>
              <EventForm
                onSuccess={handleSuccess}
                editingEvent={editingEvent}
                onCancelEdit={() => { setEditingEvent(null); setActiveTab('list'); }}
              />
            </>
          ) : (
            <>
              <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F3F4F6' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', letterSpacing: '-0.02em' }}>
                  Event Management
                </h2>
                <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                  View, filter, edit, or delete upcoming and past calendar events.
                </p>
              </div>
              <EventList onEdit={handleEdit} refreshKey={refreshKey} />
            </>
          )}
        </div>
      </main>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
