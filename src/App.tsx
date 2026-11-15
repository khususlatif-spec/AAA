/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameState, GameMode, HeroKey, PlayerStats, CombatStats, SkillDefinition, BossCategory } from './types/game';
import { HERO_DATABASE } from './game/constants';
import { sounds } from './audio/soundManager';
import { TitleScreen } from './components/TitleScreen';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { SkillSelectModal } from './components/SkillSelectModal';
import { GameHud } from './components/GameHud';
import { LevelUpModal } from './components/LevelUpModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { PracticeLabPanel } from './components/PracticeLabPanel';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('arena');
  const [heroKey, setHeroKey] = useState<HeroKey>('monkey');
  const [activeSkills, setActiveSkills] = useState<SkillDefinition[]>(HERO_DATABASE.monkey.skills);
  const [practiceWave, setPracticeWave] = useState<number>(1);
  const [practiceGodMode, setPracticeGodMode] = useState<boolean>(true);
  const [practiceAutoHealDummy, setPracticeAutoHealDummy] = useState<boolean>(true);
  const [practiceSimPaused, setPracticeSimPaused] = useState<boolean>(false);
  const [, setLabVersion] = useState<number>(0);

  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [combatStats, setCombatStats] = useState<CombatStats>({
    kills: 0,
    wave: 1,
    enemiesRemaining: 0,
    timeSurvived: 0,
    damageDealt: 0,
    highestCrit: 0,
    damageTaken: 0,
    level: 1
  });
  const [activeBoss, setActiveBoss] = useState<{ name: string; hp: number; maxHp: number; category?: BossCategory; shield?: number } | null>(null);

  const [autoPilot, setAutoPilot] = useState<boolean>(true);
  const [autoCastSkills, setAutoCastSkills] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());
  const [currentLevelUpLevel, setCurrentLevelUpLevel] = useState<number>(1);

  // Initialize engine once canvas mounts
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new GameEngine(canvasRef.current, heroKey);
    engineRef.current = engine;

    // Attach callbacks
    engine.onStatsUpdate = (stats, player, boss) => {
      setCombatStats(stats);
      setPlayerStats({ ...player });
      setActiveBoss(boss);
    };

    engine.onLevelUpTrigger = (level) => {
      setCurrentLevelUpLevel(level);
      setGameState('LEVEL_UP');
    };

    engine.onGameOverTrigger = (stats) => {
      setCombatStats(stats);
      setGameState('GAME_OVER');
    };

    engine.onVictoryTrigger = (stats) => {
      setCombatStats(stats);
      setGameState('VICTORY');
    };

    const handleResize = () => {
      engine.handleResize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, []);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        if (e.key === 'Escape' && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        return;
      }
      if (e.key === 'Escape') {
        if (gameState === 'PLAYING') {
          if (engineRef.current) engineRef.current.isPaused = true;
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          if (engineRef.current) engineRef.current.isPaused = false;
          setGameState('PLAYING');
        }
      } else if (e.key.toLowerCase() === 'm') {
        const nextMute = sounds.toggleMute();
        setIsMuted(nextMute);
      } else if (e.key.toLowerCase() === 'p' && gameState === 'PLAYING') {
        if (engineRef.current) {
          engineRef.current.autoPilot = !engineRef.current.autoPilot;
          setAutoPilot(engineRef.current.autoPilot);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState]);

  // Start flow from Title -> Character Select
  const handleStartTitle = useCallback(() => {
    setGameMode('arena');
    setGameState('CHARACTER_SELECT');
  }, []);

  const handleStartPractice = useCallback(() => {
    setGameMode('practice');
    setGameState('CHARACTER_SELECT');
  }, []);

  // Direct hero select shortcut from title cards
  const handleSelectHeroDirect = useCallback((key: HeroKey) => {
    setGameMode('arena');
    setHeroKey(key);
    setActiveSkills(HERO_DATABASE[key].skills);
    setGameState('SKILL_SELECT');
  }, []);

  // Character selection confirm -> Skill select
  const handleConfirmCharacter = useCallback((key: HeroKey) => {
    setHeroKey(key);
    setActiveSkills(HERO_DATABASE[key].skills);
    setGameState('SKILL_SELECT');
  }, []);

  // Skills loadout confirm -> Start Arena Battle or Practice Mode!
  const handleConfirmSkills = useCallback((skills: SkillDefinition[]) => {
    setActiveSkills(skills);
    setPracticeSimPaused(false);
    if (engineRef.current) {
      engineRef.current.setPracticeMode(gameMode === 'practice');
      engineRef.current.setPracticeWaveLevel(practiceWave);
      engineRef.current.practiceGodMode = practiceGodMode;
      engineRef.current.practiceAutoHealDummy = practiceAutoHealDummy;
      engineRef.current.setHero(heroKey, skills);
      engineRef.current.autoPilot = autoPilot;
      engineRef.current.autoCastSkills = autoCastSkills;
      engineRef.current.start();
      setLabVersion(v => v + 1);
    }
    setGameState('PLAYING');
  }, [heroKey, autoPilot, autoCastSkills, gameMode, practiceWave, practiceGodMode, practiceAutoHealDummy]);

  // Level Up resolution
  const handleConfirmUpgrade = useCallback((selectedTraitId: string | null, selectedAttrId: string) => {
    if (engineRef.current) {
      if (selectedTraitId) {
        engineRef.current.applySkillUpgrade(selectedTraitId);
      }
      engineRef.current.applyAttribute(selectedAttrId);
    }
    setGameState('PLAYING');
  }, []);

  // Pause / Resume
  const handleResume = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.isPaused = false;
      setPracticeSimPaused(false);
    }
    setGameState('PLAYING');
  }, []);

  // Restart
  const handleRestart = useCallback(() => {
    setActiveBoss(null);
    setPracticeSimPaused(false);
    if (engineRef.current) {
      engineRef.current.setPracticeMode(gameMode === 'practice');
      engineRef.current.setPracticeWaveLevel(practiceWave);
      engineRef.current.practiceGodMode = practiceGodMode;
      engineRef.current.practiceAutoHealDummy = practiceAutoHealDummy;
      engineRef.current.setHero(heroKey, activeSkills);
      engineRef.current.restart();
      setLabVersion(v => v + 1);
    }
    setGameState('PLAYING');
  }, [heroKey, activeSkills, gameMode, practiceWave, practiceGodMode, practiceAutoHealDummy]);

  // Quit to Title
  const handleQuitToTitle = useCallback(() => {
    setActiveBoss(null);
    setPracticeSimPaused(false);
    if (engineRef.current) {
      engineRef.current.setPracticeMode(false);
      engineRef.current.stop();
    }
    setGameState('TITLE');
  }, []);

  // Toggles
  const handleToggleAutoPilot = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.autoPilot = !engineRef.current.autoPilot;
      setAutoPilot(engineRef.current.autoPilot);
    }
  }, []);

  const handleToggleAutoCast = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.autoCastSkills = !engineRef.current.autoCastSkills;
      setAutoCastSkills(engineRef.current.autoCastSkills);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const next = sounds.toggleMute();
    setIsMuted(next);
  }, []);

  const handleTriggerSkill = useCallback((index: number) => {
    if (engineRef.current && playerStats) {
      if (playerStats.skillCDs[index] <= 0) {
        const target = engineRef.current.getClosestEnemy(engineRef.current.playerPos.x, engineRef.current.playerPos.y);
        engineRef.current.useSkill(index, target);
      }
    }
  }, [playerStats]);

  const currentHero = HERO_DATABASE[heroKey];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-game select-none flex flex-col justify-center items-center">
      {/* 60fps Game Simulation Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 touch-none block"
      />

      {/* Title Screen View */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onStart={handleStartTitle}
          onStartPractice={handleStartPractice}
          onSelectHeroDirect={handleSelectHeroDirect}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Character Selection Modal */}
      {gameState === 'CHARACTER_SELECT' && (
        <CharacterSelectModal
          gameMode={gameMode}
          onChangeGameMode={setGameMode}
          onConfirmCharacter={handleConfirmCharacter}
          onBack={() => setGameState('TITLE')}
        />
      )}

      {/* Skill Loadout Selection Modal */}
      {gameState === 'SKILL_SELECT' && (
        <SkillSelectModal
          heroKey={heroKey}
          gameMode={gameMode}
          onConfirmSkills={handleConfirmSkills}
          onBack={() => setGameState('CHARACTER_SELECT')}
        />
      )}

      {/* In-Game HUD (Low-occlusion overlay) */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'LEVEL_UP') && playerStats && (
        <GameHud
          player={playerStats}
          combatStats={combatStats}
          activeSkills={activeSkills}
          heroName={currentHero.name}
          heroColor={currentHero.color}
          boss={activeBoss}
          autoPilot={autoPilot}
          autoCastSkills={autoCastSkills}
          isMuted={isMuted}
          onToggleAutoPilot={handleToggleAutoPilot}
          onToggleAutoCast={handleToggleAutoCast}
          onToggleMute={handleToggleMute}
          onPause={() => {
            if (engineRef.current) engineRef.current.isPaused = true;
            setGameState('PAUSED');
          }}
          onTriggerSkill={handleTriggerSkill}
        />
      )}

      {/* Practice Mode Lab Panel & Quick Bar */}
      {gameMode === 'practice' && gameState === 'PLAYING' && playerStats && engineRef.current && (
        <PracticeLabPanel
          heroKey={heroKey}
          player={playerStats}
          combatStats={combatStats}
          activeSkills={activeSkills}
          attributeCounts={new Map(engineRef.current.attributeCounts)}
          unlockedTraits={new Set(engineRef.current.unlockedTraits)}
          practiceWave={practiceWave}
          godMode={practiceGodMode}
          autoHealDummy={practiceAutoHealDummy}
          isSimPaused={practiceSimPaused}
          onToggleSimPause={() => {
            if (!engineRef.current) return;
            const next = !engineRef.current.isPaused;
            engineRef.current.isPaused = next;
            setPracticeSimPaused(next);
          }}
          onToggleRelic={(attrId) => {
            engineRef.current?.togglePracticeRelic(attrId);
            setLabVersion(v => v + 1);
          }}
          onSetRelicCount={(attrId, count) => {
            engineRef.current?.setPracticeRelicCount(attrId, count);
            setLabVersion(v => v + 1);
          }}
          onClearRelics={() => {
            engineRef.current?.clearPracticeRelics();
            setLabVersion(v => v + 1);
          }}
          onToggleTrait={(traitId) => {
            engineRef.current?.togglePracticeTrait(traitId);
            setLabVersion(v => v + 1);
          }}
          onSwitchHero={(nextHeroKey) => {
            setHeroKey(nextHeroKey);
            setActiveSkills(HERO_DATABASE[nextHeroKey].skills);
            engineRef.current?.switchHeroInPractice(nextHeroKey);
            setLabVersion(v => v + 1);
          }}
          onSetWave={(nextWave) => {
            const clamped = Math.max(1, Math.min(50, nextWave));
            setPracticeWave(clamped);
            engineRef.current?.setPracticeWaveLevel(clamped);
          }}
          onSpawnDummy={(kind) => engineRef.current?.spawnPracticeDummy(kind)}
          onSpawnSwarm={() => engineRef.current?.spawnPracticeSwarm(5)}
          onSpawnBoss={(type, rivalHero) => engineRef.current?.spawnPracticeBoss(type, rivalHero)}
          onClearEnemies={() => engineRef.current?.clearPracticeEnemies()}
          onResetMetrics={() => engineRef.current?.resetPracticeMetrics()}
          onResetCooldowns={() => engineRef.current?.resetPracticeCooldowns()}
          onFullHeal={() => engineRef.current?.fullHealPractice()}
          onGrantLevel={(levels) => engineRef.current?.grantPracticeLevel(levels)}
          onToggleGodMode={() => {
            const next = !practiceGodMode;
            setPracticeGodMode(next);
            if (engineRef.current) engineRef.current.practiceGodMode = next;
          }}
          onToggleAutoHealDummy={() => {
            const next = !practiceAutoHealDummy;
            setPracticeAutoHealDummy(next);
            if (engineRef.current) engineRef.current.practiceAutoHealDummy = next;
          }}
        />
      )}

      {/* Level Up Modal */}
      {gameState === 'LEVEL_UP' && (
        <LevelUpModal
          level={currentLevelUpLevel}
          heroKey={heroKey}
          activeSkillIds={activeSkills.map(s => s.id)}
          unlockedTraits={engineRef.current ? engineRef.current.unlockedTraits : new Set()}
          acquiredAttributes={engineRef.current ? engineRef.current.acquiredAttributes : new Set()}
          onConfirmUpgrade={handleConfirmUpgrade}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onQuitToTitle={handleQuitToTitle}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isPracticeMode={gameMode === 'practice'}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          stats={combatStats}
          heroName={currentHero.name}
          onRestart={handleRestart}
          onSelectHero={() => setGameState('CHARACTER_SELECT')}
        />
      )}

      {/* Victory Modal */}
      {gameState === 'VICTORY' && (
        <VictoryModal
          stats={combatStats}
          heroName={currentHero.name}
          onContinueEndless={() => {
            if (engineRef.current) engineRef.current.isPaused = false;
            setGameState('PLAYING');
          }}
          onRestart={handleRestart}
          onSelectHero={() => setGameState('CHARACTER_SELECT')}
        />
      )}
    </div>
  );
}
