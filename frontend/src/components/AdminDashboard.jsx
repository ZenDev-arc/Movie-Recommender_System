import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Database, RefreshCw, CheckCircle2, AlertCircle, BarChart3, Clock, Globe, Zap } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/stats`);
            setStats(res.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching admin stats:", err);
            setError("Could not connect to the backend system.");
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const triggerSync = async () => {
        setSyncing(true);
        setSuccessMsg("");
        try {
            await axios.post(`${API_BASE_URL}/admin/sync`);
            setSuccessMsg("System synchronization initiated successfully!");
            fetchStats();
        } catch (err) {
            setError("Sync failed. Check backend logs.");
        } finally {
            setSyncing(false);
        }
    };

    if (!stats) return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
            <RefreshCw className="w-10 h-10 text-accent animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans p-6 md:p-12">
            <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 text-accent mb-2">
                        <Database className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">CineMatch AI Pro</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black title-font">System Portal</h1>
                </div>
                <button 
                    onClick={triggerSync}
                    disabled={syncing}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${syncing ? 'bg-white/10 text-white/40' : 'bg-white text-black hover:scale-105 active:scale-95 shadow-2xl shadow-white/10'}`}
                >
                    {syncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    {syncing ? "Synchronizing..." : "Force System Sync"}
                </button>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Stats Grid */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <StatCard 
                        title="Total Database Size" 
                        value={stats.total_movies.toLocaleString()} 
                        subtitle="Movies Indexed"
                        icon={<Database className="w-6 h-6 text-blue-400" />}
                    />
                    <StatCard 
                        title="Global Coverage" 
                        value={`${((stats.region_stats.Hollywood / stats.total_movies) * 100).toFixed(0)}%`} 
                        subtitle="Hollywood Dominance"
                        icon={<Globe className="w-6 h-6 text-green-400" />}
                    />
                    <StatCard 
                        title="Bollywood Index" 
                        value={stats.region_stats.Bollywood.toLocaleString()} 
                        subtitle="Regional Records"
                        icon={<BarChart3 className="w-6 h-6 text-purple-400" />}
                    />
                    <StatCard 
                        title="Last Update" 
                        value={stats.last_sync.movies_added > 0 ? `+${stats.last_sync.movies_added}` : "Pending"} 
                        subtitle={stats.last_sync.timestamp ? new Date(stats.last_sync.timestamp).toLocaleDateString() : "No history"}
                        icon={<Clock className="w-6 h-6 text-yellow-400" />}
                    />
                </div>

                {/* System Health / Logs */}
                <div className="glass rounded-[2.5rem] p-8 border border-white/10 flex flex-col h-full bg-gradient-to-b from-white/5 to-transparent">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        System Health
                    </h3>
                    
                    <div className="space-y-6 flex-1">
                        <HealthItem label="Discovery Engine" status="Online" color="text-green-500" />
                        <HealthItem label="Enrichment Service" status="Ready" color="text-cyan-500" />
                        <HealthItem label="Similarity Engine" status="Optimized" color="text-blue-500" />
                        <HealthItem label="Next Scheduled Sync" status="Friday 03:00" color="text-white/40" />
                    </div>

                    {successMsg && (
                         <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-xs font-bold text-center"
                         >
                            {successMsg}
                         </motion.div>
                    )}

                    {error && (
                         <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center flex items-center gap-2 justify-center">
                            <AlertCircle className="w-4 h-4" /> {error}
                         </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const StatCard = ({ title, value, subtitle, icon }) => (
    <div className="glass rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{title}</p>
        <h4 className="text-5xl font-black title-font mb-1">{value}</h4>
        <p className="text-white/20 text-xs font-bold uppercase tracking-widest">{subtitle}</p>
    </div>
);

const HealthItem = ({ label, status, color }) => (
    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
        <span className="text-xs font-bold text-white/50">{label}</span>
        <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{status}</span>
    </div>
);

export default AdminDashboard;
