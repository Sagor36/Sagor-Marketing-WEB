import { apiFetch, supabase } from '../lib_supabase';
import { useState } from 'react';
import { Save, RotateCw } from 'lucide-react';
import {
  MarketingSubmission,
  MemberProfile,
  TeamSettings,
} from '../types/marketing';
import { MemberAvatar } from './MemberAvatar';

interface SettingsViewProps {
  members: MemberProfile[];
  settings: TeamSettings;
  onMembersAndSubmissionsUpdated: (
    members: MemberProfile[],
    submissions: MarketingSubmission[]
  ) => void;
  onSettingsUpdated: (settings: TeamSettings) => void;
  onReplayIntro: () => void;
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string
  ) => void;
}

export function SettingsView({
  members,
  settings,
  onMembersAndSubmissionsUpdated,
  onSettingsUpdated,
  onReplayIntro,
  onNotify,
}: SettingsViewProps) {
  const [memberDrafts, setMemberDrafts] = useState(() =>
    members.map((m) => ({ id: m.id, name: m.name, role: m.role }))
  );
  const [dailyTarget, setDailyTarget] = useState(
    String(settings.dailyActivityTarget)
  );
  const [weeklyTarget, setWeeklyTarget] = useState(
    String(settings.weeklyActivityTarget)
  );
  const [compactTables, setCompactTables] = useState(settings.compactTables);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSaveMember = async (memberId: MemberProfile['id']) => {
    const draft = memberDrafts.find((m) => m.id === memberId);
    if (!draft || !draft.name.trim()) {
      onNotify('error', 'Invalid Name', 'Member name cannot be empty.');
      return;
    }

    setSavingMemberId(memberId);
    try {
      const response = await apiFetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name.trim(),
          role: draft.role.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save member profile.');
      }
      onMembersAndSubmissionsUpdated(data.members, data.submissions);
      onNotify(
        'success',
        'Profile Updated',
        `Saved changes for ${draft.name.trim()}.`
      );
    } catch (err) {
      onNotify(
        'error',
        'Update Failed',
        err instanceof Error ? err.message : 'Unable to save member profile.'
      );
    } finally {
      setSavingMemberId(null);
    }
  };

  const handleSaveSettings = async () => {
    const daily = Number(dailyTarget);
    const weekly = Number(weeklyTarget);
    if (!Number.isFinite(daily) || daily <= 0 || !Number.isFinite(weekly) || weekly <= 0) {
      onNotify(
        'error',
        'Invalid Targets',
        'Daily and weekly targets must be positive numbers.'
      );
      return;
    }

    setSavingSettings(true);
    try {
      const response = await apiFetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyActivityTarget: Math.round(daily),
          weeklyActivityTarget: Math.round(weekly),
          compactTables,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings.');
      }
      onSettingsUpdated(data.settings);
      onNotify(
        'success',
        'Settings Saved',
        'Team targets and display preferences have been updated.'
      );
    } catch (err) {
      onNotify(
        'error',
        'Save Failed',
        err instanceof Error ? err.message : 'Unable to save settings.'
      );
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Team Member Profiles */}
      <section className="rounded-2xl bg-[#0B1528] border border-white/10 p-6">
        <h2 className="font-display text-lg font-semibold text-white">
          Team Member Profiles
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 mb-6">
          Customize display names and roles for the three SAGOR MARKETING TEAM
          members
        </p>

        <div className="space-y-4">
          {members.map((member) => {
            const draft = memberDrafts.find((d) => d.id === member.id);
            if (!draft) return null;

            return (
              <div
                key={member.id}
                className="rounded-xl bg-[#070E1A]/70 border border-white/10 p-4 flex flex-col lg:flex-row lg:items-center gap-4"
              >
                <div className="flex items-center gap-3 min-w-[160px]">
                  <MemberAvatar member={member} size="md" />
                  <div>
                    <span className="text-xs font-mono text-[#FACC15]">
                      {member.code}
                    </span>
                    <p className="text-xs text-slate-400">{member.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={draft.name}
                      maxLength={60}
                      onChange={(e) =>
                        setMemberDrafts((prev) =>
                          prev.map((p) =>
                            p.id === member.id
                              ? { ...p, name: e.target.value }
                              : p
                          )
                        )
                      }
                      className="w-full rounded-xl bg-[#0B1528] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Role Title
                    </label>
                    <input
                      type="text"
                      value={draft.role}
                      maxLength={80}
                      onChange={(e) =>
                        setMemberDrafts((prev) =>
                          prev.map((p) =>
                            p.id === member.id
                              ? { ...p, role: e.target.value }
                              : p
                          )
                        )
                      }
                      className="w-full rounded-xl bg-[#0B1528] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveMember(member.id)}
                  disabled={savingMemberId === member.id}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#EAB308] hover:bg-[#FACC15] disabled:opacity-50 text-[#070E1A] font-semibold text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingMemberId === member.id ? 'Saving...' : 'Save'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Targets & Workspace Preferences */}
      <section className="rounded-2xl bg-[#0B1528] border border-white/10 p-6">
        <h2 className="font-display text-lg font-semibold text-white">
          Performance Targets &amp; Display
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 mb-6">
          Configure daily/weekly goals and table density
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="daily-target"
              className="block text-sm font-medium text-slate-200 mb-2"
            >
              Daily Team Activity Target
            </label>
            <input
              id="daily-target"
              type="number"
              min={1}
              value={dailyTarget}
              onChange={(e) => setDailyTarget(e.target.value)}
              className="w-full rounded-xl bg-[#070E1A] border border-white/15 px-4 py-2.5 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-[#EAB308]"
            />
          </div>
          <div>
            <label
              htmlFor="weekly-target"
              className="block text-sm font-medium text-slate-200 mb-2"
            >
              Weekly Team Activity Target
            </label>
            <input
              id="weekly-target"
              type="number"
              min={1}
              value={weeklyTarget}
              onChange={(e) => setWeeklyTarget(e.target.value)}
              className="w-full rounded-xl bg-[#070E1A] border border-white/15 px-4 py-2.5 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-[#EAB308]"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-[#070E1A]/70 border border-white/10 p-4">
          <div>
            <p className="text-sm font-medium text-white">
              Compact Table Density
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Reduce row padding in Submission History and Admin Panel
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={compactTables}
            onClick={() => setCompactTables((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              compactTables ? 'bg-[#EAB308]' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-[#070E1A] transition-transform ${
                compactTables ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-white/10">
          <button
            type="button"
            onClick={onReplayIntro}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#070E1A] hover:bg-white/5 border border-white/15 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#FACC15]" />
            Replay Animated Loading Screen
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EAB308] hover:bg-[#FACC15] disabled:opacity-50 text-[#070E1A] font-semibold text-sm transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {savingSettings ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </section>
    </div>
  );
}
