"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeedbackFormData } from "@/lib/supabase";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Download, Users, PieChart as PieChartIcon, User, Star } from "lucide-react";
import TiltWrapper from "@/components/TiltWrapper";
import { initAudio, playHoverSound, playClickSound, playSuccessSound } from "@/lib/audio";
import "../globals.css";

// COLORS
const COLORS = ['#a855f7', '#06b6d4', '#22c55e', '#ec4899', '#f59e0b', '#8b5cf6'];

// ── Utils ──────────────────────────────────────────────
const playHaptic = () => {
  if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(40);
  }
};

const playHapticHeavy = () => {
  if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate([30, 50, 30]);
  }
};

const scrambleChars = "!<>-_\\/[]{}—=+*^?#_";
function ScrambleText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState(text);
  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text.split("").map((letter, index) => {
          if (index < iteration) return text[index];
          return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
        }).join("")
      );
      if (iteration >= text.length) {
        clearInterval(interval);
      }
      iteration += 1 / 2;
    }, 28);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayText}</span>;
}

// ── Components ─────────────────────────────────────────
function GlowProgressBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  const percentage = (value / max) * 100;
  return (
    <div className="glow-progress-track">
      <div 
        className="glow-progress-fill" 
        style={{ width: `${percentage}%`, background: color, boxShadow: `0 0 10px ${color}` }}
      />
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [members, setMembers] = useState<FeedbackFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "individual">("summary");
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>(["[ SYS.AUTH ] Enter passphrase..."]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    initAudio();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      playSuccessSound();
      setIsAuthenticated(true);
      fetchData();
    } else {
      setLogs((prev) => [...prev, "ACCESS DENIED. Incorrect passphrase."]);
      setPassword("");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setLogs((prev) => [...prev, "[ SYS.SYNC ] Establishing secure link..."]);
    
    try {
      const response = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      
      const { success, data, error } = await response.json();
      
      if (success && data) {
        setMembers(data);
        setLogs((prev) => [...prev, `[ SYS.OK ] Retrieved ${data.length} records.`]);
      } else {
        setError(error || "Failed to fetch data.");
        setLogs((prev) => [...prev, `[ SYS.ERR ] ${error}`]);
      }
    } catch (err) {
      setError("Network error fetching database records.");
      setLogs((prev) => [...prev, `[ SYS.ERR ] Network error.`]);
    }
    
    setLoading(false);
  };

  const downloadCSV = () => {
    if (members.length === 0) return;
    
    const headers = Object.keys(members[0]);
    const csvContent = [
      headers.join(","),
      ...members.map(row => 
        headers.map(header => {
          let cell = (row as any)[header] ?? "";
          if (Array.isArray(cell)) cell = cell.join("; ");
          const cellString = String(cell).replace(/"/g, '""');
          return `"${cellString}"`;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `synapse_feedback_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- DATA PROCESSING FOR CHARTS ---

  // Calculate Average Ratings
  const avgSessionRating = members.length > 0 ? (members.reduce((acc, curr) => acc + (curr.session_rating || 0), 0) / members.length).toFixed(1) : "0.0";
  const avgEngagingRating = members.length > 0 ? (members.reduce((acc, curr) => acc + (curr.engaging_rating || 0), 0) / members.length).toFixed(1) : "0.0";

  // 1. Favorite Part (Pie)
  const favoriteData = members.reduce((acc, curr) => {
    const part = curr.favorite_part || "Unknown";
    const existing = acc.find(item => item.name === part);
    if (existing) existing.value += 1;
    else acc.push({ name: part, value: 1 });
    return acc;
  }, [] as { name: string, value: number }[]);

  // 2. Event Preferences (Bar)
  const eventDataMap: Record<string, number> = {};
  members.forEach(m => {
    (m.event_preferences || []).forEach(pref => {
      eventDataMap[pref] = (eventDataMap[pref] || 0) + 1;
    });
  });
  const eventData = Object.keys(eventDataMap).map(key => ({
    name: key,
    count: eventDataMap[key]
  })).sort((a, b) => b.count - a.count);

  // 3. Motivation Level (Pie/Donut)
  const motivationData = members.reduce((acc, curr) => {
    const level = curr.motivation_level || "Unknown";
    const existing = acc.find(item => item.name === level);
    if (existing) existing.value += 1;
    else acc.push({ name: level, value: 1 });
    return acc;
  }, [] as { name: string, value: number }[]);

  // --- RENDERERS ---

  if (!isAuthenticated) {
    return (
      <main className="main-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="terminal-container" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <span className="terminal-title">admin_auth.exe</span>
          </div>
          <div className="terminal-content">
            <div style={{ marginBottom: '20px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {logs.map((log, i) => (
                <div key={i} style={{ color: log.includes('DENIED') ? '#ef4444' : 'inherit' }}>{log}</div>
              ))}
            </div>
            <form onSubmit={handleLogin} style={{ display: 'flex', gap: '10px' }}>
              <span style={{ color: 'var(--accent-primary)' }}>$</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="cli-input"
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
              />
            </form>
          </div>
        </div>
      </main>
    );
  }

  const activeMember = members[currentIndex];

  return (
    <main className="admin-dashboard-container">
      {/* CRT Overlays */}
      <div className="vignette-overlay pointer-events-none"></div>
      <div className="scanlines-overlay pointer-events-none"></div>

      {/* HEADER */}
      <div className="terminal-container" style={{ margin: '0 auto 20px auto', width: '100%', maxWidth: '1400px', position: 'relative', zIndex: 10 }}>
        <div className="terminal-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="terminal-dots">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <span className="terminal-title">synapse_feedback_analytics.exe</span>
          </div>
          <button 
            onMouseEnter={playHoverSound}
            onClick={() => { initAudio(); playClickSound(); playHapticHeavy(); downloadCSV(); }}
            className="export-btn-glow"
          >
            <Download size={16} /> EXPORT .CSV
          </button>
        </div>
        
        {/* TABS */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', position: 'relative' }}>
          <button 
            onMouseEnter={playHoverSound}
            className={`admin-tab-glow ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => { initAudio(); playClickSound(); playHaptic(); setActiveTab('summary'); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChartIcon size={18} /> SUMMARY
            </div>
            {activeTab === 'summary' && (
              <motion.div layoutId="activeTabUnderline" className="tab-underline" />
            )}
          </button>
          
          <button 
            onMouseEnter={playHoverSound}
            className={`admin-tab-glow ${activeTab === 'individual' ? 'active' : ''}`}
            onClick={() => { initAudio(); playClickSound(); playHaptic(); setActiveTab('individual'); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} /> INDIVIDUAL
            </div>
            {activeTab === 'individual' && (
              <motion.div layoutId="activeTabUnderline" className="tab-underline" />
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glitch-text" style={{ textAlign: 'center', padding: '40px', flex: 1 }}>FETCHING DATABASE_RECORDS...</div>
      ) : error ? (
        <div style={{ color: '#ef4444', textAlign: 'center', padding: '40px', flex: 1 }}>{error}</div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', flex: 1 }}>No records found in database.</div>
      ) : (
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', flex: 1 }}>
          
          {/* ======================================= */}
          {/* SUMMARY TAB                             */}
          {/* ======================================= */}
          {activeTab === "summary" && (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="admin-grid" style={{ position: 'relative', zIndex: 10 }}>
              
              {/* Top Stats */}
              <motion.div variants={itemVariants} className="admin-card-glow stats-card" style={{ gridColumn: 'span 1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>TOTAL_RESPONSES</h3>
                  <div style={{ fontSize: '3rem', color: 'var(--accent-primary)', textShadow: '0 0 20px var(--accent-glow)' }}>
                    {members.length}
                  </div>
                </div>
                <Users size={48} color="var(--accent-primary)" style={{ opacity: 0.5 }} />
              </motion.div>

              <motion.div variants={itemVariants} className="admin-card-glow stats-card" style={{ gridColumn: 'span 1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>AVG_SESSION_RATING</h3>
                  <div style={{ fontSize: '3rem', color: '#22c55e', textShadow: '0 0 20px rgba(34, 197, 94, 0.3)' }}>
                    {avgSessionRating}
                  </div>
                </div>
                <Star size={48} color="#22c55e" style={{ opacity: 0.5 }} />
              </motion.div>

              <motion.div variants={itemVariants} className="admin-card-glow stats-card" style={{ gridColumn: 'span 1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>AVG_ENGAGEMENT</h3>
                  <div style={{ fontSize: '3rem', color: '#06b6d4', textShadow: '0 0 20px rgba(6, 182, 212, 0.3)' }}>
                    {avgEngagingRating}
                  </div>
                </div>
                <Star size={48} color="#06b6d4" style={{ opacity: 0.5 }} />
              </motion.div>

              <TiltWrapper>
                <motion.div variants={itemVariants} className="admin-card-glow" style={{ gridColumn: 'span 2' }}>
                  <h3 className="admin-card-title">Favorite Parts of Session</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={favoriteData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {favoriteData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                  {favoriteData.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}>
                      <div style={{ width: '12px', height: '12px', background: COLORS[index % COLORS.length], borderRadius: '2px' }}></div>
                      {entry.name}: {entry.value}
                    </div>
                  ))}
                </div>
              </motion.div>
            </TiltWrapper>

            <TiltWrapper>
                <motion.div variants={itemVariants} className="admin-card-glow" style={{ gridColumn: 'span 1' }}>
                  <h3 className="admin-card-title">Motivated to Participate?</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={motivationData} cx="50%" cy="50%" innerRadius={80} outerRadius={100} paddingAngle={5} dataKey="value">
                        {motivationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : index === 1 ? '#f59e0b' : '#ef4444'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                  {motivationData.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}>
                      <div style={{ width: '12px', height: '12px', background: index === 0 ? '#22c55e' : index === 1 ? '#f59e0b' : '#ef4444', borderRadius: '2px' }}></div>
                      {entry.name}: {entry.value}
                    </div>
                  ))}
                </div>
              </motion.div>
            </TiltWrapper>

            <TiltWrapper>
              <motion.div variants={itemVariants} className="admin-card-glow" style={{ gridColumn: '1 / -1' }}>
                <h3 className="admin-card-title">Desired Future Events</h3>
                <div style={{ height: '400px', width: '100%', marginTop: '20px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventData} layout="vertical" margin={{ top: 5, right: 30, left: 200, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--text-secondary)' }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-primary)', fontSize: 12 }} width={190} />
                      <Tooltip 
                        cursor={{ fill: 'var(--surface-glass-hover)' }}
                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                      />
                      <Bar dataKey="count" fill="var(--accent-secondary)" radius={[0, 4, 4, 0]} barSize={20}>
                        {eventData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--accent-secondary)' : 'var(--accent-primary)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </TiltWrapper>

            {/* Suggestions */}
            <TiltWrapper>
              <motion.div variants={itemVariants} className="admin-card-glow" style={{ gridColumn: '1 / -1' }}>
                <h3 className="admin-card-title" style={{ marginBottom: '20px' }}>Raw Suggestions & Feedback</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {members.filter(m => m.suggestions).slice(0, 15).map((m, i) => (
                    <div key={i} style={{ padding: '15px', background: 'var(--surface-glass)', borderRadius: '8px', borderLeft: '3px solid var(--accent-primary)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px', display: 'block' }}>{m.full_name} [{m.uid}]</span>
                      "{m.suggestions}"
                    </div>
                  ))}
                  {members.filter(m => m.suggestions).length === 0 && (
                    <div style={{ color: 'var(--text-muted)' }}>No written suggestions provided yet.</div>
                  )}
                  {members.filter(m => m.suggestions).length > 15 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>... and {members.filter(m => m.suggestions).length - 15} more. Export CSV to view all.</div>
                  )}
                </div>
              </motion.div>
            </TiltWrapper>
          </motion.div>
          )}

          {/* ======================================= */}
          {/* INDIVIDUAL TAB                          */}
          {/* ======================================= */}
          {activeTab === "individual" && activeMember && (
            <TiltWrapper>
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="admin-card-glow" style={{ maxWidth: '800px', margin: '0 auto', padding: '0', overflow: 'hidden' }}>
                
                {/* Pagination Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 30px', borderBottom: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.4)' }}>
                <button 
                  onMouseEnter={playHoverSound}
                  onClick={() => { playClickSound(); playHaptic(); setCurrentIndex(prev => Math.max(0, prev - 1)); }}
                  disabled={currentIndex === 0}
                  className="nav-button"
                  style={{ opacity: currentIndex === 0 ? 0.3 : 1, padding: '8px' }}
                >
                  &lt;
                </button>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  Record <span style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', margin: '0 5px' }}>{currentIndex + 1}</span> of {members.length}
                </div>
                <button 
                  onMouseEnter={playHoverSound}
                  onClick={() => { playClickSound(); playHaptic(); setCurrentIndex(prev => Math.min(members.length - 1, prev + 1)); }}
                  disabled={currentIndex === members.length - 1}
                  className="nav-button"
                  style={{ opacity: currentIndex === members.length - 1 ? 0.3 : 1, padding: '8px' }}
                >
                  &gt;
                </button>
              </div>

              {/* Profile Data */}
              <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                <div style={{ borderBottom: '1px solid var(--border-glass-hover)', paddingBottom: '20px' }}>
                  <h2 style={{ fontSize: '2rem', color: 'var(--accent-primary)', marginBottom: '5px' }}>
                    <ScrambleText text={activeMember.full_name || "UNKNOWN_USER"} />
                  </h2>
                  <div style={{ color: 'var(--text-secondary)', display: 'flex', gap: '15px', fontSize: '0.9rem' }}>
                    <span>UID: <strong style={{ color: 'var(--text-primary)' }}><ScrambleText text={activeMember.uid || "N/A"} /></strong></span>
                    <span>Branch: <strong style={{ color: 'var(--text-primary)' }}>{activeMember.branch}</strong></span>
                    <span>Section: <strong style={{ color: 'var(--text-primary)' }}>{activeMember.section}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: 'var(--bg-primary)', padding: '20px', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px' }}>SESSION_RATING</div>
                    <div style={{ color: '#22c55e', fontSize: '1.5rem', marginBottom: '10px', textAlign: 'right' }}>{activeMember.session_rating} / 5</div>
                    <GlowProgressBar value={activeMember.session_rating} color="#22c55e" />
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '20px', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px' }}>ENGAGEMENT_RATING</div>
                    <div style={{ color: '#06b6d4', fontSize: '1.5rem', marginBottom: '10px', textAlign: 'right' }}>{activeMember.engaging_rating} / 5</div>
                    <GlowProgressBar value={activeMember.engaging_rating} color="#06b6d4" />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>FAVORITE_PART</div>
                  <div style={{ color: 'var(--text-primary)' }}>{activeMember.favorite_part}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>INFORMATIVE?</div>
                  <div style={{ color: 'var(--text-primary)' }}>{activeMember.informative_rating}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>MOTIVATED_TO_JOIN?</div>
                  <div style={{ color: 'var(--text-primary)' }}>{activeMember.motivation_level}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>WANTS_TO_BECOME_MEMBER?</div>
                  <div style={{ color: 'var(--text-primary)' }}>{activeMember.become_member}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>REQUESTED_EVENTS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(activeMember.event_preferences || []).map((pref, i) => (
                      <span key={i} style={{ padding: '6px 12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid var(--accent-primary)', borderRadius: '4px', fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>

                {activeMember.suggestions && (
                  <div style={{ padding: '20px', background: 'var(--bg-primary)', borderRadius: '8px', borderLeft: '2px solid var(--accent-secondary)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>SUGGESTIONS_LOG</div>
                    <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>{activeMember.suggestions}</p>
                  </div>
                )}

              </div>
            </motion.div>
          </TiltWrapper>
          )}

        </div>
      )}
    </main>
  );
}
