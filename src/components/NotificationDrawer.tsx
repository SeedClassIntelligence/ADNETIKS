/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Push Notification Center & Live Alerts Tray
 */

import { useState } from 'react';
import { NotificationItem } from '../types';
import {
  Bell,
  X,
  CheckCircle2,
  Trophy,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  Trash2,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  setNotifications: (items: NotificationItem[]) => void;
  showNotificationToast: (title: string, message: string) => void;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  setNotifications,
  showNotificationToast,
}: NotificationDrawerProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [pushEnabled, setPushEnabled] = useState(true);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.read : true));

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleTestPush = () => {
    const testNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Real-Time Engagement Spike',
      message: 'Autonomous Social Pipeline Q4 exceeded 1,200 impressions in the first 20 minutes (4.2x benchmark).',
      type: 'published',
      timestamp: 'Just now',
      read: false,
      priority: 'high',
    };
    setNotifications([testNotif, ...notifications]);
    showNotificationToast(testNotif.title, testNotif.message);

    // If browser supports web notifications and enabled
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(testNotif.title, { body: testNotif.message });
      } catch (e) {
        // Safe fallback in restricted sandboxes
      }
    }
  };

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'split_winner':
        return <Trophy className="w-4 h-4 text-emerald-400" />;
      case 'approval':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'published':
        return <Send className="w-4 h-4 text-blue-400" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            <div>
              <h2 className="text-sm font-bold text-white">Critical Alert Center</h2>
              <div className="text-[11px] text-slate-400">
                {unreadCount} unread status updates
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Push Notification Toggle Banner */}
        <div className="bg-slate-950 p-3.5 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-200 block">Browser Push Notifications</span>
            <span className="text-[11px] text-slate-400">Receive desktop alerts for approvals & spikes</span>
          </div>

          <button
            onClick={() => setPushEnabled(!pushEnabled)}
            className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
              pushEnabled ? 'bg-red-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                pushEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sub-Actions Strip */}
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                filter === 'unread' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestPush}
              className="text-[11px] text-red-400 hover:text-red-300 font-semibold"
            >
              Test Push Alert
            </button>
            <span className="text-slate-600">·</span>
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              Mark Read
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No notifications to display.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border text-xs transition-all space-y-1 relative ${
                  item.read
                    ? 'bg-slate-950/60 border-slate-800/70 text-slate-400'
                    : 'bg-slate-900 border-slate-700 text-slate-200 shadow-sm'
                }`}
              >
                {!item.read && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500" />
                )}

                <div className="flex items-center gap-2 font-semibold text-white">
                  {getNotifIcon(item.type)}
                  <span className="truncate pr-4">{item.title}</span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed pt-0.5">
                  {item.message}
                </p>

                <div className="text-[10px] text-slate-500 font-mono pt-1">
                  {item.timestamp}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Critical alerts are persistent</span>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
