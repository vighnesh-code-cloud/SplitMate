import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Receipt,
  ShieldCheck,
  Users2,
  Filter,
  Calendar,
  Clock,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { useSplitMate } from '../../context/SplitMateContext';
import { Activity, ActivityType } from '../../types';
import { formatPaise } from '../../utils/calculations';
import { ConfirmModal } from '../common/ConfirmModal';

export const ActivityPage: React.FC = () => {
  const { activities, groups, navigateTo, deleteActivity, showToast } = useSplitMate();

  const [activeFilter, setActiveFilter] = useState<'all' | 'expenses' | 'settlements' | 'groups'>('all');
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);

  const handleConfirmDelete = () => {
    if (!activityToDelete) return;
    try {
      deleteActivity(activityToDelete.id);
      setActivityToDelete(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete activity. Please try again.', 'error');
    }
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'expenses') {
        return (
          act.type === 'expense_added' ||
          act.type === 'expense_updated' ||
          act.type === 'expense_deleted'
        );
      }
      if (activeFilter === 'settlements') {
        return act.type === 'settlement_recorded';
      }
      if (activeFilter === 'groups') {
        return (
          act.type === 'group_created' ||
          act.type === 'group_updated' ||
          act.type === 'group_deleted' ||
          act.type === 'member_added' ||
          act.type === 'member_removed' ||
          act.type === 'friend_added' ||
          act.type === 'friend_removed'
        );
      }
      return true;
    });
  }, [activities, activeFilter]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'expense_added':
      case 'expense_updated':
        return <Receipt className="w-4 h-4 text-[#8FAF9A]" />;
      case 'expense_deleted':
        return <Receipt className="w-4 h-4 text-[#D99090]" />;
      case 'settlement_recorded':
        return <ShieldCheck className="w-4 h-4 text-[#82B99A]" />;
      case 'group_created':
      case 'group_updated':
      case 'group_deleted':
      case 'member_added':
      case 'member_removed':
      case 'friend_added':
      case 'friend_removed':
        return <Users2 className="w-4 h-4 text-[#93B5E1]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#8FAF9A]" />;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F5] tracking-tight">
          Activity Feed
        </h1>
        <p className="text-xs sm:text-sm text-[#A0A5AE] mt-0.5">
          Real-time audited log of expenses, settlements, group creations, and member changes.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#181B20] border border-[#2B2F36] rounded-xl w-fit">
        {[
          { id: 'all', label: 'All Activity' },
          { id: 'expenses', label: 'Expenses' },
          { id: 'settlements', label: 'Settlements' },
          { id: 'groups', label: 'Group Changes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-[#202329] text-[#8FAF9A] shadow-xs'
                : 'text-[#737984] hover:text-[#F5F5F5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed List */}
      {filteredActivities.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#181B20] border border-[#2B2F36] text-center max-w-md mx-auto">
          <Sparkles className="w-8 h-8 text-[#737984] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#F5F5F5]">No activity in this view</h3>
          <p className="text-xs text-[#737984] mt-1">
            As you add expenses and settle balances, they will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredActivities.map((act) => {
            const group = groups.find((g) => g.id === act.groupId);

            return (
              <div
                key={act.id}
                className="p-3.5 sm:p-4 rounded-xl bg-[#181B20] border border-[#2B2F36] flex items-start justify-between gap-3 shadow-xs hover:border-[#3B4049] transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#202329] border border-[#2B2F36] flex items-center justify-center shrink-0 mt-0.5">
                    {getActivityIcon(act.type)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[#F5F5F5] leading-snug">
                      {act.description}
                    </p>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] text-[#737984] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#737984]" />
                        {formatRelativeTime(act.timestamp)}
                      </span>

                      {group && (
                        <button
                          onClick={() => navigateTo('group-details', group.id)}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-[#111316] border border-[#2B2F36] text-[#A0A5AE] hover:text-[#8FAF9A] hover:border-[#8FAF9A]/50 transition-colors inline-flex items-center gap-1"
                        >
                          <span>{group.icon || '🏷️'}</span>
                          <span>{group.name}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {act.amountInPaise !== undefined && (
                    <div className="text-right">
                      <span
                        className={`text-xs sm:text-sm font-mono font-bold ${
                          act.type === 'settlement_recorded'
                            ? 'text-[#82B99A]'
                            : act.type === 'expense_deleted'
                            ? 'text-[#D99090] line-through'
                            : 'text-[#F5F5F5]'
                        }`}
                      >
                        {formatPaise(act.amountInPaise)}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setActivityToDelete(act)}
                    className="p-1.5 text-[#737984] hover:text-[#D99090] hover:bg-[#3A1D1D]/50 rounded-lg transition-colors cursor-pointer"
                    aria-label="Delete activity"
                    title="Delete activity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for deleting individual activity record */}
      <ConfirmModal
        isOpen={Boolean(activityToDelete)}
        title="Delete Activity"
        message="Are you sure you want to delete this activity record? Only this activity log entry will be removed; the underlying expense, group, or settlement data will remain completely unchanged."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onCancel={() => setActivityToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
