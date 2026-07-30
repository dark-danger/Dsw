import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { CheckSquare, Medal, Clock, CheckCircle2, Megaphone, HelpCircle, FileText, ArrowRight, FileCheck, Award } from 'lucide-react';

interface FacultyStats {
  faculty_id: number;
  faculty_name: string;
  total_assigned: number;
  completed_approved: number;
  pending_count: number;
  declined_count: number;
  completion_rate_percentage: number;
  performance_score: number;
}

export const FacultyDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<FacultyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!user) return;
      try {
        const data = await apiRequest<FacultyStats>(`/users/faculty/${user.id}/stats`);
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  if (loading || !stats) {
    return <div className="p-8 text-center text-slate-400">Loading faculty dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-l-4 border-l-indigo-500">
        <h2 className="text-2xl font-bold text-slate-100">Welcome back, {user?.name}!</h2>
        <p className="text-xs text-slate-400 mt-1">Department: {user?.department || 'DSW'} • Designation: {user?.designation || 'Faculty'}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Duties Assigned</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{stats.total_assigned}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Approved Duties</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.completed_approved}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Pending Duties</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{stats.pending_count}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">My Performance Score</p>
              <h3 className="text-2xl font-bold text-purple-400 mt-1">{stats.performance_score} pts</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
              <Medal className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Completion Progress Bar */}
      <div className="glass-panel p-6 space-y-2">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Overall Duty Completion Percentage</span>
          <span className="font-semibold text-slate-200">{stats.completion_rate_percentage}%</span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full" style={{ width: `${stats.completion_rate_percentage}%` }} />
        </div>
      </div>

      {/* Faculty Action Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="/faculty/tasks" className="glass-card p-5 space-y-2 group hover:border-indigo-500/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" /> Manage Assigned Tasks
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>
          <p className="text-xs text-slate-400">Submit completion reports and upload proof documents for DSW review.</p>
        </a>

        <a href="/faculty/duty-charts" className="glass-card p-5 space-y-2 group hover:border-cyan-500/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" /> Event Duty Charts
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </div>
          <p className="text-xs text-slate-400">View official campus event duty rosters and download printable PDF charts.</p>
        </a>

        <a href="/faculty/committees" className="glass-card p-5 space-y-2 group hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" /> Student Core Committees
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>
          <p className="text-xs text-slate-400">Form event student committees, appoint student convenors & export appointment letters.</p>
        </a>
      </div>
    </div>
  );
};
