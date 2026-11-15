import React, { useState } from 'react';
import { GameMode, HeroKey, SkillDefinition } from '../types/game';
import { HERO_DATABASE } from '../game/constants';
import { sounds } from '../audio/soundManager';
import { Check, Play, Clock, Zap } from 'lucide-react';

interface SkillSelectModalProps {
  heroKey: HeroKey;
  gameMode: GameMode;
  onConfirmSkills: (skills: SkillDefinition[]) => void;
  onBack: () => void;
}

export const SkillSelectModal: React.FC<SkillSelectModalProps> = ({
  heroKey,
  gameMode,
  onConfirmSkills,
  onBack
}) => {
  const hero = HERO_DATABASE[heroKey];
  const allSkills = hero.skills;
  // By default, select all skills of the chosen hero (e.g. 3 or 4)
  const [selectedIndices, setSelectedIndices] = useState<number[]>(() => allSkills.map((_, i) => i));

  const toggleSkill = (idx: number) => {
    sounds.playSelect();
    if (selectedIndices.includes(idx)) {
      if (selectedIndices.length > 1) {
        setSelectedIndices(selectedIndices.filter(i => i !== idx));
      }
    } else {
      setSelectedIndices([...selectedIndices, idx]);
    }
  };

  const handleStart = () => {
    sounds.playSelect();
    const chosen = selectedIndices.map(i => allSkills[i]);
    onConfirmSkills(chosen);
  };

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col justify-between p-4 md:p-8 overflow-y-auto">
      {/* Header */}
      <div className="text-center pt-2 pb-4">
        <span className={`text-xs font-mono font-bold uppercase tracking-wider ${gameMode === 'practice' ? 'text-emerald-400' : 'text-cyan-400'}`}>
          {gameMode === 'practice' ? 'Mode Practice · Persiapan Latihan & Uji Relic' : 'Loadout Persiapan Pertarungan'}
        </span>
        <h2 className="font-title text-2xl sm:text-4xl font-black text-white mt-1">
          PILIH SKILL AKTIF {hero.name}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-lg mx-auto">
          Pilih skill aktif ({selectedIndices.length}/{allSkills.length} terpilih) untuk {gameMode === 'practice' ? 'berlatih di Arena Practice' : 'bertarung di arena'}. Skill dapat dipicu otomatis atau manual dengan tombol 1, 2, 3, 4 / Spasi.
        </p>
      </div>

      {/* Skills Grid */}
      <div className={`grid grid-cols-1 ${allSkills.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4 max-w-6xl' : 'md:grid-cols-3 max-w-4xl'} gap-4 sm:gap-6 w-full mx-auto my-auto`}>
        {allSkills.map((sk, idx) => {
          const isSelected = selectedIndices.includes(idx);
          return (
            <div
              key={sk.id}
              onClick={() => toggleSkill(idx)}
              className={`p-6 rounded-2xl cursor-pointer transition-all border-2 relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] transform -translate-y-1'
                  : 'bg-slate-900/60 border-slate-800 opacity-60 hover:opacity-90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl border"
                    style={{
                      backgroundColor: `${hero.color}20`,
                      borderColor: `${hero.color}50`,
                      color: hero.color
                    }}
                  >
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-400">
                    <Clock className="w-3 h-3" />
                    <span>{sk.cd}s CD</span>
                  </div>
                </div>

                <h3 className="font-title text-lg font-bold text-white mb-2">{sk.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{sk.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Tipe: <span className="text-white capitalize">{sk.type}</span>
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-center gap-4 py-4 max-w-md mx-auto w-full">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-title text-sm transition-colors cursor-pointer"
        >
          KEMBALI
        </button>
        <button
          onClick={handleStart}
          disabled={selectedIndices.length === 0}
          className={`flex-1 px-8 py-3 rounded-xl font-title font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
            selectedIndices.length >= 1
              ? gameMode === 'practice'
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:brightness-110'
                : 'bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:brightness-110'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
          }`}
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{gameMode === 'practice' ? `MASUK PRACTICE (${selectedIndices.length} SKILL)` : `MULAI PERTARUNGAN (${selectedIndices.length} SKILL)`}</span>
        </button>
      </div>
    </div>
  );
};
