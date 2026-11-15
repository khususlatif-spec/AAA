import React from 'react';
import { PlayerStats, CombatStats, SkillDefinition, BossCategory } from '../types/game';
import { Volume2, VolumeX, Pause, Play, Compass, Flame, ShieldAlert, Sparkles, Zap } from 'lucide-react';

interface GameHudProps {
  player: PlayerStats;
  combatStats: CombatStats;
  activeSkills: SkillDefinition[];
  heroName: string;
  heroColor: string;
  boss: { name: string; hp: number; maxHp: number; category?: BossCategory; shield?: number } | null;
  autoPilot: boolean;
  autoCastSkills: boolean;
  isMuted: boolean;
  onToggleAutoPilot: () => void;
  onToggleAutoCast: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onTriggerSkill: (index: number) => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  player,
  combatStats,
  activeSkills,
  heroName,
  heroColor,
  boss,
  autoPilot,
  autoCastSkills,
  isMuted,
  onToggleAutoPilot,
  onToggleAutoCast,
  onToggleMute,
  onPause,
  onTriggerSkill
}) => {
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const expPercent = Math.max(0, Math.min(100, (player.exp / player.maxExp) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-5 z-20">
      {/* Top HUD Cluster */}
      <div className="flex flex-col gap-2 w-full max-w-6xl mx-auto">
        {/* Boss Health Bar (if active) */}
        {boss && (() => {
          const catStyles: Record<BossCategory, { badge: string; label: string }> = {
            Tank: { badge: 'bg-emerald-700 text-emerald-100 border-emerald-400/50', label: '🛡️ TANK' },
            Warrior: { badge: 'bg-orange-700 text-orange-100 border-orange-400/50', label: '⚔️ WARRIOR' },
            Assassin: { badge: 'bg-cyan-700 text-cyan-100 border-cyan-400/50', label: '🗡️ ASSASSIN' },
            Manipulation: { badge: 'bg-purple-700 text-purple-100 border-purple-400/50', label: '🌀 MANIPULATION' }
          };
          const catInfo = boss.category ? catStyles[boss.category] : null;
          return (
            <div className={`pointer-events-auto bg-slate-950/95 border-2 ${boss.name.includes('CORRUPTED') ? 'border-purple-500 shadow-[0_0_28px_rgba(168,85,247,0.5)]' : 'border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.4)]'} p-2.5 rounded-xl max-w-xl mx-auto w-full`}>
              <div className="flex justify-between items-center text-xs font-title font-bold text-red-400 mb-1 gap-2">
                <span className={`flex items-center gap-1.5 flex-wrap ${boss.name.includes('CORRUPTED') ? 'text-purple-300 font-black' : 'text-red-400'}`}>
                  {boss.name.includes('CORRUPTED') && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-600 text-white font-extrabold uppercase tracking-wider">
                      Rival Boss
                    </span>
                  )}
                  {catInfo && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] border font-extrabold uppercase tracking-wider ${catInfo.badge}`}>
                      {catInfo.label}
                    </span>
                  )}
                  <span>{boss.name}</span>
                </span>
                <span className="tabular-nums font-mono text-slate-200 shrink-0">
                  {Math.round(boss.hp)} / {Math.round(boss.maxHp)} HP
                  {(boss.shield ?? 0) > 0 && (
                    <span className="text-purple-300 ml-1.5">(+{Math.round(boss.shield!)} 🛡️)</span>
                  )}
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-red-950">
                <div
                  className={`h-full transition-all duration-150 ${boss.name.includes('CORRUPTED') ? 'bg-gradient-to-r from-purple-600 via-rose-500 to-red-600' : 'bg-gradient-to-r from-red-600 via-amber-500 to-red-500'}`}
                  style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }}
                />
              </div>
            </div>
          );
        })()}

        <div className="pointer-events-auto flex flex-col md:flex-row justify-between items-center gap-3 bg-slate-950/85 p-3 rounded-xl border border-slate-800 shadow-xl">
          {/* Player Identity & Vitals */}
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-title font-black text-xl border-2 shadow-md shrink-0"
              style={{
                backgroundColor: `${heroColor}20`,
                borderColor: heroColor,
                color: heroColor
              }}
            >
              {heroName[0]}
            </div>

            <div className="flex-1 min-w-[190px]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-title font-bold text-sm tracking-wide text-white">{heroName}</span>
                <span className="font-title text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  LV. {player.level}
                </span>
              </div>

              {/* Health bar */}
              <div className="w-full bg-slate-900 rounded-full h-3 mb-1 border border-slate-800 relative overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-150 bg-gradient-to-r from-red-600 to-emerald-500"
                  style={{ width: `${hpPercent}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white drop-shadow tabular-nums">
                  {Math.round(player.hp)} / {Math.round(player.maxHp)} HP
                </span>
              </div>

              {/* EXP bar */}
              <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all duration-150"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Center / Right Metrics */}
          <div className="flex items-center gap-5 justify-between w-full md:w-auto text-center border-t md:border-t-0 md:border-l border-slate-800/80 pt-2 md:pt-0 md:pl-5">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Musuh K.O</div>
              <div className="font-title text-xl font-black text-amber-400 tabular-nums">
                {combatStats.kills}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Gelombang</div>
              <div className="font-title text-xl font-black text-cyan-400 tabular-nums leading-tight">
                {combatStats.wave}
              </div>
              <div className="text-[9px] font-mono text-slate-400 tabular-nums">
                {(combatStats.enemiesRemaining ?? 0) > 0 ? `${combatStats.enemiesRemaining} Musuh` : 'Clear!'}
              </div>
            </div>

            {/* Hero Unique Passive Indicator */}
            <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 min-w-[120px]">
              {heroName.includes('DEMONIS') ? (
                <>
                  <div className="text-[9px] text-purple-300 font-bold uppercase flex items-center justify-between gap-2">
                    <span>FCD: {player.demonisFCD ?? 0}/30 ({1 + (player.demonisFCD ?? 0)} Peluru)</span>
                    {(player.demonisFCD ?? 0) >= 30 ? (
                      <span className="text-[8px] text-amber-300 font-black animate-pulse">ASCENDED</span>
                    ) : player.swiftTimer > 0 ? (
                      <span className="text-[8px] text-fuchsia-300 font-black animate-pulse">VEIL {player.swiftTimer.toFixed(1)}s</span>
                    ) : null}
                  </div>
                  <div className="font-title text-xs font-bold text-purple-400 tabular-nums">
                    Stack: {player.demonisStacks}/4 · +{Math.round((player.demonisFCD ?? 0) * 1.5)}% CDMG/ASPD
                  </div>
                </>
              ) : heroName.includes('TRAVELER') ? (
                <>
                  <div className="text-[9px] text-cyan-300 font-bold uppercase flex items-center justify-between gap-2">
                    <span>
                      {player.timeStopTimer > 0
                        ? '⏳ BERSERK REWIND'
                        : player.travelerStance === 'sword'
                        ? '⚔️ SWORD MODE'
                        : player.travelerStance === 'bow'
                        ? '🏹 BOW MODE'
                        : '🔮 STAFF MODE'}
                    </span>
                    {player.travelerRewindReady ? (
                      <span className="text-[8px] text-emerald-400 font-black">REWIND READY</span>
                    ) : (
                      <span className="text-[8px] text-amber-400 font-bold">{player.travelerKillsRecharge ?? 0}/30</span>
                    )}
                  </div>
                  <div className={`font-title text-xs font-bold uppercase tabular-nums ${player.timeStopTimer > 0 ? 'text-amber-300 animate-pulse' : (player.travelerOverdriveTimer ?? 0) > 0 || player.travelerFieldTimer > 0 ? 'text-cyan-200 animate-pulse' : 'text-cyan-400'}`}>
                    {player.timeStopTimer > 0
                      ? `⏳ TIME STOP ${player.timeStopTimer.toFixed(1)}s`
                      : (player.travelerOverdriveTimer ?? 0) > 0
                      ? `⚡ OVERDRIVE ${(player.travelerOverdriveTimer ?? 0).toFixed(1)}s`
                      : player.travelerFieldTimer > 0
                      ? '🌀 CHRONO FIELD AKTIF'
                      : `+${Math.min(60, (player.travelerTimeStacks ?? 0) * 2)}% ATK (${combatStats.kills} Kills)`}
                  </div>
                </>
              ) : heroName.includes('MONKEY') ? (
                <>
                  <div className="text-[9px] text-amber-300 font-bold uppercase flex items-center justify-between gap-2">
                    <span>{player.rageTimer > 0 ? 'Mode Overdrive' : `Jingu ${player.monkeyComboHits ?? 0}/4 · ${Math.round(player.critChance * 100)}% CC`}</span>
                    {(player.monkeyDuelStacks ?? 0) > 0 ? (
                      <span className="text-[8px] text-rose-400 font-black animate-pulse">
                        DUEL x{player.monkeyDuelStacks} (+{(player.monkeyDuelStacks ?? 0) * 6}%)
                      </span>
                    ) : (player.monkeySubCd ?? 0) <= 0 ? (
                      <span className="text-[8px] text-emerald-400 font-black">72-FORM READY</span>
                    ) : (
                      <span className="text-[8px] text-amber-400/80 font-bold tabular-nums">72-FORM {Math.ceil(player.monkeySubCd!)}s</span>
                    )}
                  </div>
                  <div className="font-title text-xs font-bold text-amber-400 tabular-nums">
                    {player.rageTimer > 0
                      ? `${player.rageTimer.toFixed(1)}s (+55% ATK · +${Math.min(100, Math.round(player.critChance * 100) * 5)} TD)`
                      : `+${Math.round(player.critDmg * 100) * 2} ATK · +${Math.min(100, Math.round(player.critChance * 100) * 5)} TD`}
                  </div>
                </>
              ) : heroName.includes('JUDG') ? (
                <>
                  <div className="text-[9px] text-indigo-300 font-bold uppercase">
                    {player.judgeDomainTimer > 0 ? 'Domain Ruang' : 'Distorsi Spasial'}
                  </div>
                  <div className={`font-title text-xs font-bold ${player.judgeDomainTimer > 0 ? 'text-indigo-300 animate-pulse' : 'text-indigo-400'}`}>
                    {player.judgeDomainTimer > 0 ? `${player.judgeDomainTimer.toFixed(1)}s (+100% ATK)` : 'AURA 180px'}
                  </div>
                </>
              ) : heroName.includes('RIFT') ? (
                <>
                  <div className="text-[9px] text-cyan-300 font-bold uppercase flex items-center justify-between gap-2">
                    <span>Quantum Blink</span>
                    <span className="text-[8px] text-cyan-400 font-bold tabular-nums">{player.riftBlinkCombo ?? 0} Hit</span>
                  </div>
                  <div className={`font-title text-xs font-bold tabular-nums ${(player.riftStormTimer ?? 0) > 0 ? 'text-amber-300 animate-pulse' : (player.riftWarpBuffTimer ?? 0) > 0 ? 'text-cyan-200 animate-pulse' : 'text-cyan-400'}`}>
                    {(player.riftStormTimer ?? 0) > 0
                      ? '🌀 VOID STORM AKTIF'
                      : (player.riftWarpBuffTimer ?? 0) > 0
                      ? `⚡ WARP ${(player.riftWarpBuffTimer ?? 0).toFixed(1)}s (-15% DMG)`
                      : `Phase Evasion ${Math.round(player.evasion * 100)}%`}
                  </div>
                </>
              ) : heroName.includes('VALKYRIE') ? (
                <>
                  <div className="text-[9px] text-sky-300 font-bold uppercase flex items-center justify-between">
                    <span>Frostbite Chill</span>
                    <span className="text-[8px] text-sky-400 font-bold">{player.frostChillHits ?? 0}/3 Hit</span>
                  </div>
                  <div className={`font-title text-xs font-bold ${(player.frostArmorShield ?? 0) > 0 ? 'text-sky-300 animate-pulse' : 'text-sky-400'}`}>
                    {(player.frostArmorShield ?? 0) > 0 ? `❄️ PERMAFROST ${Math.round(player.frostArmorShield!)}` : 'CRYO VANGUARD'}
                  </div>
                </>
              ) : heroName.includes('PUPPET') ? (
                <>
                  <div className="text-[9px] text-fuchsia-300 font-bold uppercase flex items-center justify-between gap-2">
                    <span>Souls: {player.souls ?? 0}/30</span>
                    <span className="text-[8px] text-purple-300 font-bold">
                      🪆{player.puppetCount ?? 0} · 💀{player.undeadCount ?? 0}
                    </span>
                  </div>
                  <div className={`font-title text-xs font-bold tabular-nums ${(player.lichTransformTimer ?? 0) > 0 ? 'text-amber-300 animate-pulse' : (player.puppetPossessTimer ?? 0) > 0 ? 'text-cyan-300 animate-pulse' : 'text-fuchsia-400'}`}>
                    {(player.lichTransformTimer ?? 0) > 0
                      ? `👑 LICH FORM ${(player.lichTransformTimer ?? 0).toFixed(1)}s`
                      : (player.puppetPossessTimer ?? 0) > 0
                      ? `👻 POSSESSED ${(player.puppetPossessTimer ?? 0).toFixed(1)}s`
                      : `Soul Forge (+${Math.round((player.souls ?? 0) * 0.8)}% ATK)`}
                  </div>
                </>
              ) : heroName.includes('SOLARIS') ? (
                <>
                  <div className="text-[9px] text-orange-300 font-bold uppercase flex items-center justify-between gap-2">
                    <span>Solar Heat</span>
                    <span className="text-[8px] text-amber-300 font-bold tabular-nums">
                      🔥 {player.solarHeat ?? 0} Stack
                    </span>
                  </div>
                  <div className={`font-title text-xs font-bold tabular-nums ${(player.solarAvatarTimer ?? 0) > 0 ? 'text-amber-300 animate-pulse' : 'text-orange-400'}`}>
                    {(player.solarAvatarTimer ?? 0) > 0
                      ? `☀️ AVATAR ${(player.solarAvatarTimer ?? 0).toFixed(1)}s`
                      : `Ignition (+${Math.round((player.solarHeat ?? 0) * 2)}% ATK)`}
                  </div>
                </>
              ) : heroName.includes('FALLEN') ? (
                <>
                  <div className="text-[9px] text-purple-300 font-bold uppercase flex items-center justify-between gap-2">
                    <span>Feathers: {player.angelFeathers ?? 0}</span>
                    <span className="text-[8px] text-rose-300 font-bold">
                      Eva {Math.round(player.evasion * 100)}%
                    </span>
                  </div>
                  <div className={`font-title text-xs font-bold tabular-nums ${(player.angelEclipseTimer ?? 0) > 0 ? 'text-rose-300 animate-pulse' : 'text-purple-400'}`}>
                    {(player.angelEclipseTimer ?? 0) > 0
                      ? `🪽 ECLIPSE ${(player.angelEclipseTimer ?? 0).toFixed(1)}s`
                      : `Seraph (+${Math.round((player.angelFeathers ?? 0) * 1.5)}% ATK)`}
                  </div>
                </>
              ) : heroName.includes('DEMON RAISED') ? (
                <>
                  <div className="text-[9px] text-rose-300 font-bold uppercase flex items-center justify-between gap-2">
                    <span>Essence: {player.demonEssence ?? 0}</span>
                    {(player.demonRebirthCd ?? 0) <= 0 ? (
                      <span className="text-[8px] text-emerald-400 font-black">REBIRTH READY</span>
                    ) : (
                      <span className="text-[8px] text-amber-400 font-bold tabular-nums">REBIRTH {Math.ceil(player.demonRebirthCd!)}s</span>
                    )}
                  </div>
                  <div className={`font-title text-xs font-bold tabular-nums ${(player.demonAwakenTimer ?? 0) > 0 ? 'text-amber-300 animate-pulse' : 'text-rose-400'}`}>
                    {(player.demonAwakenTimer ?? 0) > 0
                      ? `👹 ARCHFIEND ${(player.demonAwakenTimer ?? 0).toFixed(1)}s`
                      : `Hellfire (+${Math.round((player.demonEssence ?? 0) * 2)}% ATK)`}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[9px] text-slate-400 font-bold uppercase">Status Pasif</div>
                  <div className="font-title text-xs font-bold text-emerald-400">Normal</div>
                </>
              )}
            </div>

            {player.warArmorActive && (
              <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-center min-w-[100px]">
                <div className="text-[9px] text-blue-300 font-bold uppercase">War Armor Def</div>
                <div className="font-title text-xs font-bold text-blue-400 tabular-nums">
                  +{player.warArmorBonusDef || 0} / 100
                </div>
              </div>
            )}

            {(player.aegisShield ?? 0) > 0 && (
              <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-cyan-500/40 text-center min-w-[100px] shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <div className="text-[9px] text-cyan-300 font-bold uppercase">Titan Aegis</div>
                <div className="font-title text-xs font-bold text-cyan-400 tabular-nums">
                  🛡️ {Math.round(player.aegisShield!)} HP
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom HUD Cluster: Skills & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-6xl mx-auto">
        {/* Skills Dock */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-950/85 p-2 rounded-xl border border-slate-800 shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block px-1">
            SKILL:
          </span>

          {activeSkills.map((sk, idx) => {
            const cd = player.skillCDs[idx] || 0;
            const maxCd = player.skillMaxCDs[idx] || sk.cd;
            const isReady = cd <= 0;
            const cdRatio = maxCd > 0 ? cd / maxCd : 0;

            return (
              <button
                key={sk.id}
                onClick={() => isReady && onTriggerSkill(idx)}
                disabled={!isReady}
                title={`${sk.name} (Key [${idx + 1}]): ${sk.desc}`}
                className={`relative group w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center overflow-hidden transition-transform cursor-pointer ${
                  isReady
                    ? 'border-cyan-400 bg-slate-900 hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'border-slate-800 bg-slate-950 opacity-70'
                }`}
              >
                <Zap className={`w-5 h-5 ${isReady ? 'text-cyan-400' : 'text-slate-600'}`} />

                {/* Cooldown sweep overlay */}
                {!isReady && (
                  <div
                    className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center font-mono text-[11px] font-bold text-cyan-300 tabular-nums"
                  >
                    <span>{cd.toFixed(1)}s</span>
                  </div>
                )}

                {/* Hotkey badge */}
                <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-slate-400 font-bold">
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tactical Controls & Mode Toggles */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 p-2 rounded-xl border border-slate-800 shadow-xl">
          {/* Auto-Pilot Toggle */}
          <button
            onClick={onToggleAutoPilot}
            className={`px-3 py-1.5 rounded-lg text-xs font-title font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              autoPilot
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle antara auto-pilot pergerakan otomatis dan kendali manual WASD / sentuh"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{autoPilot ? 'AUTO PILOT' : 'MANUAL WASD'}</span>
          </button>

          {/* Auto-Skills Toggle */}
          <button
            onClick={onToggleAutoCast}
            className={`px-3 py-1.5 rounded-lg text-xs font-title font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              autoCastSkills
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle otomatis melancarkan skill saat cooldown selesai"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{autoCastSkills ? 'AUTO SKILL' : 'MANUAL SKILL'}</span>
          </button>

          {/* Sound Mute */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle Suara [M]"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause */}
          <button
            onClick={onPause}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Jeda Game [Esc]"
          >
            <Pause className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
