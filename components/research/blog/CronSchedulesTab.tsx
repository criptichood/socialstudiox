import React from 'react';
import { Clock, Plus, Calendar, CheckCircle2, Trash2, Zap } from 'lucide-react';
import { CronScheduleItem, SavedBlogDraft, SavedCampaign, PublishEndpointConfig } from '../../../types';
import { BlogPostResult } from '../../../services/geminiService';

interface CronSchedulesTabProps {
  cronSchedules: CronScheduleItem[];
  savedBlogDrafts: SavedBlogDraft[];
  savedCampaigns: SavedCampaign[];
  publishEndpoints: PublishEndpointConfig[];
  selectedDraftForScheduleId: string;
  setSelectedDraftForScheduleId: (id: string) => void;
  newCronTitle: string;
  setNewCronTitle: (title: string) => void;
  scheduleDateTime: string;
  setScheduleDateTime: (dt: string) => void;
  newCronExpression: string;
  setNewCronExpression: (expr: string) => void;
  selectedEndpointId: string;
  setSelectedEndpointId: (id: string) => void;
  selectedCampaignId: string;
  blogResult: BlogPostResult | null;
  scheduleSuccessFeedback: string | null;
  setScheduleSuccessFeedback: (msg: string | null) => void;
  handleSaveCronSchedule: (item: CronScheduleItem) => Promise<any>;
  handleDeleteCronSchedule: (id: string) => void;
  handleSaveBlogDraft: (data: any, status: 'draft' | 'scheduled' | 'published', scheduledAt?: string) => Promise<any>;
  formatCronExpression: (expr: string) => string;
}

export const CronSchedulesTab: React.FC<CronSchedulesTabProps> = ({
  cronSchedules,
  savedBlogDrafts,
  savedCampaigns,
  publishEndpoints,
  selectedDraftForScheduleId,
  setSelectedDraftForScheduleId,
  newCronTitle,
  setNewCronTitle,
  scheduleDateTime,
  setScheduleDateTime,
  newCronExpression,
  setNewCronExpression,
  selectedEndpointId,
  setSelectedEndpointId,
  selectedCampaignId,
  blogResult,
  scheduleSuccessFeedback,
  setScheduleSuccessFeedback,
  handleSaveCronSchedule,
  handleDeleteCronSchedule,
  handleSaveBlogDraft,
  formatCronExpression,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <span>Schedule Blog Draft & Automated Cron Jobs</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select a saved blog post draft from the list below, pick your calendar date/time or cron rule, and schedule automatic publishing.
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            const targetDraft = savedBlogDrafts.find(d => d.id === selectedDraftForScheduleId);
            const postTitleToUse = newCronTitle.trim() || targetDraft?.title || (blogResult?.title ? `Scheduled: ${blogResult.title}` : 'Weekly Blog Publication');
            
            // Parse target date time
            const schedISO = scheduleDateTime ? new Date(scheduleDateTime).toISOString() : new Date(Date.now() + 86400000).toISOString();
            
            const newSched: CronScheduleItem = {
              id: `cron_${Date.now()}`,
              campaignId: targetDraft?.campaignId || selectedCampaignId || undefined,
              campaignTitle: targetDraft?.campaignTitle || savedCampaigns.find(c => c.id === selectedCampaignId)?.name || 'General Campaign',
              postTitle: postTitleToUse,
              cronExpression: newCronExpression.trim() || '0 9 * * 1',
              cronHumanReadable: formatCronExpression(newCronExpression.trim() || '0 9 * * 1'),
              endpointId: selectedEndpointId || 'growency_main',
              status: 'active',
              nextRunAt: schedISO,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };

            await handleSaveCronSchedule(newSched);

            if (targetDraft) {
              await handleSaveBlogDraft({
                id: targetDraft.id,
                title: targetDraft.title,
                markdownContent: targetDraft.markdownContent,
                sectionImagePrompts: targetDraft.sectionImagePrompts
              }, 'scheduled', schedISO);
            }

            setScheduleSuccessFeedback(`✓ Post "${postTitleToUse}" scheduled for ${new Date(schedISO).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}!`);
            setTimeout(() => setScheduleSuccessFeedback(null), 4000);
            setNewCronTitle('');
          }}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Schedule Selected Post / Create Cron</span>
        </button>
      </div>

      {scheduleSuccessFeedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{scheduleSuccessFeedback}</span>
        </div>
      )}

      {/* Enhanced Schedule & Draft Selector Form */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500" />
          <span>Configure Post Schedule & Target Webhook</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Dropdown to select a saved draft */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              1. Select Saved Draft to Schedule
            </label>
            <select
              value={selectedDraftForScheduleId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedDraftForScheduleId(id);
                const found = savedBlogDrafts.find(d => d.id === id);
                if (found) {
                  setNewCronTitle(found.title);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/40"
            >
              <option value="">-- Pick from Saved Drafts ({savedBlogDrafts.length}) --</option>
              {savedBlogDrafts.map(d => (
                <option key={d.id} value={d.id}>
                  [{d.status.toUpperCase()}] {d.title.slice(0, 40)}
                </option>
              ))}
            </select>
          </div>

          {/* Post / Schedule Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              2. Post / Schedule Title
            </label>
            <input
              type="text"
              value={newCronTitle}
              onChange={(e) => setNewCronTitle(e.target.value)}
              placeholder="e.g. Weekly AI Strategy Deep-Dive"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>

          {/* Calendar & Time Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              3. Select Calendar Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduleDateTime}
              onChange={(e) => setScheduleDateTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>

          {/* Target Endpoint Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              4. Target Webhook Endpoint
            </label>
            <select
              value={selectedEndpointId}
              onChange={(e) => setSelectedEndpointId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/40"
            >
              {publishEndpoints.map(e => (
                <option key={e.id} value={e.id}>
                  Endpoint: {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Date Shortcuts */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Quick Date Shortcuts:</span>
            <button
              type="button"
              onClick={() => {
                const tom = new Date();
                tom.setDate(tom.getDate() + 1);
                tom.setHours(9, 0, 0, 0);
                setScheduleDateTime(tom.toISOString().slice(0, 16));
              }}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/20 rounded-lg text-[10px] font-semibold cursor-pointer"
            >
              ⚡ Tomorrow 9:00 AM
            </button>

            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 3);
                d.setHours(12, 0, 0, 0);
                setScheduleDateTime(d.toISOString().slice(0, 16));
              }}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/20 rounded-lg text-[10px] font-semibold cursor-pointer"
            >
              ⚡ In 3 Days (12 PM)
            </button>

            <button
              type="button"
              onClick={() => {
                const d = new Date();
                const day = d.getDay();
                const diff = d.getDate() + (day === 0 ? 1 : (8 - day));
                d.setDate(diff);
                d.setHours(9, 0, 0, 0);
                setScheduleDateTime(d.toISOString().slice(0, 16));
              }}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/20 rounded-lg text-[10px] font-semibold cursor-pointer"
            >
              ⚡ Next Monday 9:00 AM
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Recurring Presets:</span>
            {[
              { label: 'Mondays 9 AM', expr: '0 9 * * 1' },
              { label: 'Daily 12 PM', expr: '0 12 * * *' },
              { label: 'Every 3 Days', expr: '0 10 */3 * *' },
              { label: '1st of Month', expr: '0 9 1 * *' }
            ].map(preset => (
              <button
                key={preset.expr}
                type="button"
                onClick={() => setNewCronExpression(preset.expr)}
                className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 rounded-lg text-[10px] font-mono cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Cron Schedules List */}
      {cronSchedules.length === 0 ? (
        <div className="p-8 text-center space-y-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Active Cron Schedules</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Select a saved draft above and pick a calendar date/time to schedule automatic webhook publishing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {cronSchedules.map(sched => {
            const ep = publishEndpoints.find(e => e.id === sched.endpointId);
            return (
              <div
                key={sched.id}
                className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-md text-[10px] font-mono font-bold">
                      {sched.cronHumanReadable} ({sched.cronExpression})
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md text-[10px] font-mono font-bold uppercase">
                      {sched.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                    {sched.postTitle}
                  </h4>

                  <p className="text-[11px] text-slate-500 font-mono">
                    Target Endpoint: <strong className="text-slate-700 dark:text-slate-300">{ep?.name || sched.endpointId}</strong> • Campaign: {sched.campaignTitle || 'General'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right text-[11px] text-slate-400 font-mono hidden sm:block">
                    <span>Next Run:</span>
                    <div className="font-bold text-purple-600 dark:text-purple-400">
                      {sched.nextRunAt ? new Date(sched.nextRunAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCronSchedule(sched.id)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
