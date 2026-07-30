import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Bell, CheckCircle2, AlertCircle, Award, MessageSquare, Info, X } from 'lucide-react';

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export const NotificationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const list = await apiRequest<NotificationItem[]>('/notifications');
      setNotifications(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', 'POST');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl overflow-hidden mt-12 animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-slate-100">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Mark all read
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-800/60">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No notifications found</div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-4 transition-colors ${n.is_read ? 'bg-slate-900/40 opacity-75' : 'bg-blue-950/20 border-l-2 border-blue-500'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-blue-400 shrink-0 mt-0.5">
                    {n.type === 'task_approved' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                     n.type === 'task_declined' ? <AlertCircle className="w-4 h-4 text-rose-400" /> :
                     n.type === 'points_awarded' ? <Award className="w-4 h-4 text-amber-400" /> :
                     n.type === 'announcement' ? <Info className="w-4 h-4 text-sky-400" /> :
                     <MessageSquare className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-100">{n.title}</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.body}</p>
                    <span className="text-[10px] text-slate-500 mt-2 block">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
