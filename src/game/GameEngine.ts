import { HeroConfig, HeroKey, PlayerStats, SkillDefinition, CombatStats, TravelerStance, BossCategory } from '../types/game';
import { HERO_DATABASE, ATTRIBUTE_POOL, SKILL_UPGRADE_TRAITS } from './constants';
import { sounds } from '../audio/soundManager';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  glow?: boolean;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  life: number;
  maxLife: number;
  vy: number;
  vx?: number;
  isDamage?: boolean;
  isCrit?: boolean;
  isRelic?: boolean;
}

interface ExpGem {
  x: number;
  y: number;
  value: number;
  color: string;
  radius: number;
  vx: number;
  vy: number;
}

interface TelegraphZone {
  x: number;
  y: number;
  radius: number;
  timer: number;
  maxTimer: number;
  color: string;
  onTrigger: () => void;
}

export interface SpatialZone {
  x: number;
  y: number;
  radius: number;
  duration: number;
  maxDuration: number;
  type: 'traveler_chrono' | 'judge_collapse' | 'judge_barrier' | 'judge_domain';
  color: string;
  pulseAngle: number;
  owner?: 'player' | 'corrupted_hero';
  tickTimer?: number;
  damage?: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public width: number = 0;
  public height: number = 0;
  private animationId: number | null = null;
  private lastTime: number = 0;

  // Game control state
  public isPaused: boolean = false;
  public isGameOver: boolean = false;
  public autoPilot: boolean = true;
  public autoCastSkills: boolean = true;

  // Practice / Sandbox Mode state
  public practiceMode: boolean = false;
  public practiceGodMode: boolean = true;
  public practiceAutoHealDummy: boolean = true;
  public practiceWaveLevel: number = 1;
  private damageSamples: { t: number; dmg: number }[] = [];
  private prevTotalDamageDealt: number = 0;

  // Active hero & skills
  public heroKey: HeroKey = 'monkey';
  public heroConfig: HeroConfig;
  public activeSkills: SkillDefinition[] = [];

  // Entities
  public player: PlayerStats;
  public playerPos = { x: 0, y: 0, vx: 0, vy: 0, facing: 0 };
  public enemies: EnemyEntity[] = [];
  public clones: CloneEntity[] = [];
  public minions: PuppetMinionEntity[] = [];
  public projectiles: ProjectileEntity[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public expGems: ExpGem[] = [];
  public telegraphs: TelegraphZone[] = [];
  public spatialZones: SpatialZone[] = [];

  // Input
  private keysHeld: Record<string, boolean> = {};
  private targetPointer: { x: number; y: number; active: boolean } = { x: 0, y: 0, active: false };
  private boundKeyDown?: (e: KeyboardEvent) => void;
  private boundKeyUp?: (e: KeyboardEvent) => void;
  private boundBlur?: () => void;
  private boundPointerUp?: () => void;

  // Game feel
  public cameraShake: number = 0;
  private hitstopTimer: number = 0;
  private attackTimer: number = 0;

  // Progression & Waves
  public wave: number = 1;
  public kills: number = 0;
  public timeSurvived: number = 0;
  public totalDamageDealt: number = 0;
  public highestCrit: number = 0;
  public totalDamageTaken: number = 0;
  private enemySpawnTimer: number = 0;
  private enemySpawnInterval: number = 1.5;
  private waveClearNotified: boolean = false;
  private currentBoss: EnemyEntity | null = null;
  private overchargeTimer: number = 0;
  private monkeyHitCount: number = 0;
  private hasUsedRampage: boolean = false;
  private killsSinceLastRampage: number = 0;
  private warArmorBonusDef: number = 0;
  public aegisShield: number = 0;
  private aegisShieldTimer: number = 0;
  private singularityTimer: number = 0;

  // Persistent Relic Stat Bonuses & Timers
  private bonusAtk: number = 0;
  private bonusAtkSpeed: number = 0;
  private bonusSpeed: number = 0;
  private bonusRange: number = 0;
  private bonusDefense: number = 0;
  private bonusCritChance: number = 0;
  private bonusCritDmg: number = 0;
  private bonusEvasion: number = 0;
  private bonusLifesteal: number = 0;
  private bonusCdr: number = 0;
  private phoenixReviveUsed: boolean = false;
  private phoenixInvulnTimer: number = 0;
  private phoenixTimer: number = 0;
  private sunfireTimer: number = 0;
  private meteorTimer: number = 0;
  private sanctuaryTimer: number = 0;
  private soulHarvesterKills: number = 0;
  private mirrorWardReady: boolean = false;
  private mirrorWardTimer: number = 0;
  private chronoAnchorTimer: number = 0;
  private chronoAnchorBuffTimer: number = 0;
  private frostbiteTimer: number = 0;
  private orbitAngle: number = 0;
  private bloodPactHits: number = 0;
  private ricochetHits: number = 0;
  private blightHits: number = 0;
  private bloodlustStacks: number = 0;
  private bloodlustTimer: number = 0;
  private berserkTotemStacks: number = 0;
  private titanHeartStacks: number = 0;
  private monkeyDuelTarget: EnemyEntity | null = null;
  private monkeyDuelTimer: number = 0;
  private monkeyDuelStacks: number = 0;
  private monkeyComboHits: number = 0;
  private monkeySubCd: number = 0;
  private lichGenesisTimer: number = 0;
  private chronoPendulumHits: number = 0;
  private chronoPendulumCd: number = 0;
  private temporalCompassTimer: number = 0;
  private cryoBastionCd: number = 0;
  private realityEdictTimer: number = 0;
  private singularitySkillCount: number = 0;
  private quantumEchoHits: number = 0;
  private phantomPhaseTimer: number = 0;
  private phantomHealCd: number = 0;
  private venomFangStacks: number = 0;
  private ironWillStacks: number = 0;
  private berserkClawStacks: number = 0;
  private solarCoreHits: number = 0;
  private crimsonVortexHits: number = 0;
  private omegaAnnihilatorHits: number = 0;
  private radiantAegisTimer: number = 0;
  private thunderCrownTimer: number = 0;
  private gravityAnchorTimer: number = 0;
  private emberTrailTimer: number = 0;
  private solarAvatarAuraTimer: number = 0;
  private solarAvatarMeteorTimer: number = 0;
  private arcaneCatalystTimer: number = 0;
  private berserkClawTimer: number = 0;
  private berserkClawKills: number = 0;
  private frostPrismCd: number = 0;
  private lastIronWillLowHp: boolean = false;
  private demonisDrainTimer: number = 0;
  private demonisBarrageTimer: number = 0;
  private travelerBladeTimer: number = 0;
  private travelerSpeedBoostTimer: number = 0;
  private travelerInvulnTimer: number = 0;
  private riftCounterSlashCd: number = 0;
  private riftStormSlashesLeft: number = 0;
  private riftStormSlashTimer: number = 0;
  private riftInvulnTimer: number = 0;
  private valkyrieRushTimer: number = 0;
  private valkyrieBlizzardTimer: number = 0;
  private valkyrieBlizzardTick: number = 0;
  private valkyrieBlizzardX: number = 0;
  private valkyrieBlizzardY: number = 0;
  private invulnPopupCd: number = 0;
  private angelWingTimer: number = 0;
  private angelFeatherCombo: number = 0;
  private abyssalPinionCd: number = 0;
  private demonAuraTimer: number = 0;
  private demonMeteorTimer: number = 0;
  private demonRebirthCd: number = 0;
  private hellfireCoreHits: number = 0;

  // Stored upgrade traits & relics
  public unlockedTraits: Set<string> = new Set();
  public acquiredAttributes: Set<string> = new Set();
  public attributeCounts: Map<string, number> = new Map();

  // Callbacks
  public onStatsUpdate?: (stats: CombatStats, player: PlayerStats, boss: { name: string; hp: number; maxHp: number; category?: BossCategory; shield?: number } | null) => void;
  public onLevelUpTrigger?: (level: number) => void;
  public onGameOverTrigger?: (stats: CombatStats) => void;
  public onVictoryTrigger?: (stats: CombatStats) => void;

  constructor(canvas: HTMLCanvasElement, heroKey: HeroKey = 'monkey') {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    this.ctx = context;

    this.heroKey = heroKey;
    this.heroConfig = HERO_DATABASE[heroKey];
    this.activeSkills = [...this.heroConfig.skills];

    this.player = this.createInitialPlayerStats();
    this.handleResize();

    this.playerPos.x = this.width / 2;
    this.playerPos.y = this.height / 2;

    this.initEventListeners();
  }

  private createInitialPlayerStats(): PlayerStats {
    const cfg = this.heroConfig;
    return {
      hp: cfg.hp,
      maxHp: cfg.hp,
      atk: cfg.atk,
      atkSpeed: cfg.atkSpeed,
      critChance: cfg.critChance,
      critDmg: cfg.critDmg,
      speed: cfg.speed,
      range: cfg.range,
      defense: cfg.defense,
      cdr: 0,
      evasion: 0,
      lifesteal: 0,
      level: 1,
      exp: 0,
      maxExp: 100,
      demonisStacks: 0,
      demonisFCD: 0,
      travelerStance: 'sword',
      travelerTimeStacks: 0,
      travelerRewindReady: true,
      travelerKillsRecharge: 30,
      isTimeStopActive: false,
      timeStopTimer: 0,
      rageTimer: 0,
      swiftTimer: 0,
      monkeyWeaponActive: false,
      varpScytheStacks: 0,
      burstCritActive: false,
      fallenWingsActive: false,
      magicDestroActive: false,
      warArmorActive: false,
      warArmorBonusDef: 0,
      judgeDomainTimer: 0,
      travelerFieldTimer: 0,
      soulMagnetRange: 140,
      riftBlinkCombo: 0,
      riftWarpBuffTimer: 0,
      isInvulnerable: false,
      frostArmorShield: 0,
      frostChillHits: 0,
      monkeyHavocTimer: 0,
      monkeyDuelStacks: 0,
      monkeyComboHits: 0,
      monkeySubCd: 0,
      souls: 0,
      puppetCount: 0,
      undeadCount: 0,
      puppetPossessTimer: 0,
      lichTransformTimer: 0,
      solarHeat: 0,
      solarAvatarTimer: 0,
      travelerOverdriveTimer: 0,
      riftStormTimer: 0,
      angelFeathers: 0,
      angelEclipseTimer: 0,
      demonEssence: 0,
      demonAwakenTimer: 0,
      demonRebirthCd: 0,
      skillCDs: this.activeSkills.map(() => 0),
      skillMaxCDs: this.activeSkills.map(s => s.cd)
    };
  }

  public handleResize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = parent.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  private initEventListeners() {
    this.boundKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
      this.keysHeld[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'Spacebar') {
        this.triggerManualSkill(0);
      } else if (e.key === '1') {
        this.triggerManualSkill(0);
      } else if (e.key === '2') {
        this.triggerManualSkill(1);
      } else if (e.key === '3') {
        this.triggerManualSkill(2);
      } else if (e.key === '4') {
        this.triggerManualSkill(3);
      }
    };

    this.boundKeyUp = (e: KeyboardEvent) => {
      this.keysHeld[e.key.toLowerCase()] = false;
    };

    this.boundBlur = () => {
      this.keysHeld = {};
    };

    this.boundPointerUp = () => {
      this.targetPointer.active = false;
    };

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('blur', this.boundBlur);
    window.addEventListener('pointerup', this.boundPointerUp);

    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.targetPointer.x = e.clientX - rect.left;
      this.targetPointer.y = e.clientY - rect.top;
      this.targetPointer.active = true;
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (this.targetPointer.active) {
        const rect = this.canvas.getBoundingClientRect();
        this.targetPointer.x = e.clientX - rect.left;
        this.targetPointer.y = e.clientY - rect.top;
      }
    });
  }

  public destroy() {
    this.stop();
    if (this.boundKeyDown) window.removeEventListener('keydown', this.boundKeyDown);
    if (this.boundKeyUp) window.removeEventListener('keyup', this.boundKeyUp);
    if (this.boundBlur) window.removeEventListener('blur', this.boundBlur);
    if (this.boundPointerUp) window.removeEventListener('pointerup', this.boundPointerUp);
  }

  public setHero(heroKey: HeroKey, skills?: SkillDefinition[]) {
    this.heroKey = heroKey;
    this.heroConfig = HERO_DATABASE[heroKey];
    this.activeSkills = skills ? [...skills] : [...this.heroConfig.skills];
    this.resetRunState();
  }

  public setPracticeMode(enabled: boolean) {
    this.practiceMode = enabled;
  }

  public start() {
    this.isPaused = false;
    this.isGameOver = false;
    this.lastTime = performance.now();
    if (this.practiceMode) {
      this.wave = this.practiceWaveLevel;
      this.spawnPracticeDummy('static', Math.min(this.width - 70, this.width * 0.65), this.height * 0.48);
      this.spawnPracticeDummy('static', Math.min(this.width - 70, this.width * 0.65), this.height * 0.30);
    } else {
      this.spawnWave();
    }
    if (!this.animationId) {
      this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private resetRunState() {
    this.stop();
    this.enemies = [];
    this.clones = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.expGems = [];
    this.telegraphs = [];
    this.spatialZones = [];
    this.wave = 1;
    this.kills = 0;
    this.timeSurvived = 0;
    this.totalDamageDealt = 0;
    this.highestCrit = 0;
    this.totalDamageTaken = 0;
    this.enemySpawnTimer = 0;
    this.waveClearNotified = false;
    this.currentBoss = null;
    this.overchargeTimer = 0;
    this.monkeyHitCount = 0;
    this.hasUsedRampage = false;
    this.killsSinceLastRampage = 0;
    this.warArmorBonusDef = 0;
    this.aegisShield = 0;
    this.aegisShieldTimer = 0;
    this.singularityTimer = 0;
    this.bonusAtk = 0;
    this.bonusAtkSpeed = 0;
    this.bonusSpeed = 0;
    this.bonusRange = 0;
    this.bonusDefense = 0;
    this.bonusCritChance = 0;
    this.bonusCritDmg = 0;
    this.bonusEvasion = 0;
    this.bonusLifesteal = 0;
    this.bonusCdr = 0;
    this.phoenixReviveUsed = false;
    this.phoenixInvulnTimer = 0;
    this.phoenixTimer = 0;
    this.sunfireTimer = 0;
    this.meteorTimer = 0;
    this.sanctuaryTimer = 0;
    this.soulHarvesterKills = 0;
    this.mirrorWardReady = false;
    this.mirrorWardTimer = 0;
    this.chronoAnchorTimer = 0;
    this.chronoAnchorBuffTimer = 0;
    this.frostbiteTimer = 0;
    this.orbitAngle = 0;
    this.bloodPactHits = 0;
    this.ricochetHits = 0;
    this.bloodlustStacks = 0;
    this.bloodlustTimer = 0;
    this.berserkTotemStacks = 0;
    this.titanHeartStacks = 0;
    this.monkeyDuelTarget = null;
    this.monkeyDuelTimer = 0;
    this.monkeyDuelStacks = 0;
    this.monkeyComboHits = 0;
    this.monkeySubCd = 0;
    this.blightHits = 0;
    this.lichGenesisTimer = 0;
    this.chronoPendulumHits = 0;
    this.chronoPendulumCd = 0;
    this.temporalCompassTimer = 0;
    this.cryoBastionCd = 0;
    this.realityEdictTimer = 0;
    this.singularitySkillCount = 0;
    this.quantumEchoHits = 0;
    this.phantomPhaseTimer = 0;
    this.phantomHealCd = 0;
    this.venomFangStacks = 0;
    this.ironWillStacks = 0;
    this.berserkClawStacks = 0;
    this.solarCoreHits = 0;
    this.crimsonVortexHits = 0;
    this.omegaAnnihilatorHits = 0;
    this.radiantAegisTimer = 0;
    this.thunderCrownTimer = 0;
    this.gravityAnchorTimer = 0;
    this.emberTrailTimer = 0;
    this.solarAvatarAuraTimer = 0;
    this.solarAvatarMeteorTimer = 0;
    this.arcaneCatalystTimer = 0;
    this.berserkClawTimer = 0;
    this.berserkClawKills = 0;
    this.frostPrismCd = 0;
    this.lastIronWillLowHp = false;
    this.demonisDrainTimer = 0;
    this.demonisBarrageTimer = 0;
    this.travelerBladeTimer = 0;
    this.travelerSpeedBoostTimer = 0;
    this.travelerInvulnTimer = 0;
    this.riftCounterSlashCd = 0;
    this.riftStormSlashesLeft = 0;
    this.riftStormSlashTimer = 0;
    this.riftInvulnTimer = 0;
    this.valkyrieRushTimer = 0;
    this.valkyrieBlizzardTimer = 0;
    this.valkyrieBlizzardTick = 0;
    this.invulnPopupCd = 0;
    this.angelWingTimer = 0;
    this.angelFeatherCombo = 0;
    this.abyssalPinionCd = 0;
    this.demonAuraTimer = 0;
    this.demonMeteorTimer = 0;
    this.demonRebirthCd = 0;
    this.hellfireCoreHits = 0;
    this.minions = [];
    this.unlockedTraits.clear();
    this.acquiredAttributes.clear();
    this.attributeCounts.clear();
    this.damageSamples = [];
    this.prevTotalDamageDealt = 0;
    this.keysHeld = {};
    this.targetPointer.active = false;

    this.player = this.createInitialPlayerStats();
    this.playerPos.x = this.width / 2;
    this.playerPos.y = this.height / 2;
  }

  public restart() {
    this.resetRunState();
    this.start();
  }

  private triggerManualSkill(index: number) {
    if (!this.animationId || this.isPaused || this.isGameOver) return;
    if (index >= 0 && index < this.activeSkills.length) {
      if (this.player.skillCDs[index] <= 0) {
        const target = this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
        this.useSkill(index, target);
      }
    }
  }

  private gameLoop(now: number) {
    if (!this.lastTime) this.lastTime = now;
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05); // 60fps clamped delta time

    if (!this.isPaused && !this.isGameOver) {
      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else {
        this.update(dt);
      }
    }

    this.render();

    if (!this.isGameOver) {
      this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }
  }

  private update(dt: number) {
    this.timeSurvived += dt;

    // Camera shake decay
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 25);
    }

    // Time stop countdown
    if (this.player.isTimeStopActive) {
      this.player.timeStopTimer -= dt;
      if (this.player.timeStopTimer <= 0) {
        this.player.isTimeStopActive = false;
        this.recalculateStats();
      }
    }

    // Rage buff countdown
    if (this.player.rageTimer > 0) {
      this.player.rageTimer -= dt;
      if (this.player.rageTimer <= 0) {
        this.recalculateStats();
      }
    }

    // Monkey Havoc buff countdown
    if ((this.player.monkeyHavocTimer ?? 0) > 0) {
      this.player.monkeyHavocTimer! -= dt;
      if (this.player.monkeyHavocTimer! <= 0) {
        this.recalculateStats();
      }
    }

    // Swift buff countdown
    if (this.player.swiftTimer > 0) {
      this.player.swiftTimer -= dt;
      if (this.player.swiftTimer <= 0) {
        this.recalculateStats();
      }
    }

    // Phoenix revive invulnerability countdown
    if (this.phoenixInvulnTimer > 0) {
      this.phoenixInvulnTimer = Math.max(0, this.phoenixInvulnTimer - dt);
    }

    // Monkey King 72-Form Substitution passive cooldown countdown
    if (this.heroKey === 'monkey' && this.monkeySubCd > 0) {
      this.monkeySubCd = Math.max(0, this.monkeySubCd - dt);
      this.player.monkeySubCd = this.monkeySubCd;
    }

    // Emerald Jade Heart passive HP regeneration (3.5% Max HP/s)
    if (this.acquiredAttributes.has('attr_jade_vitality') && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.035 * dt);
    }

    // Demonis passive regen (2.5% Max HP/s) & Shadow Veil Dark Soul Drain / Phantom Barrage
    if (this.heroKey === 'demonis') {
      if (this.player.hp < this.player.maxHp) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.025 * dt);
      }
      if (this.player.swiftTimer > 0) {
        this.demonisDrainTimer -= dt;
        if (this.demonisDrainTimer <= 0) {
          this.demonisDrainTimer = 0.5;
          const drainRadius = 205;
          this.createShockwave(this.playerPos.x, this.playerPos.y, '#9333ea', drainRadius);
          let hitCount = 0;
          const drainDmg = this.player.atk * 0.90;
          for (const e of this.enemies) {
            if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= drainRadius) {
              e.takeDamage(drainDmg, false, 'true_damage', this);
              hitCount++;
            }
          }
          if (hitCount > 0) {
            this.healPlayer(this.player.maxHp * Math.min(0.18, hitCount * 0.03));
            this.addDemonisStacks(1);
          }
        }

        if (this.unlockedTraits.has('d_s2_u2')) {
          this.demonisBarrageTimer -= dt;
          if (this.demonisBarrageTimer <= 0) {
            this.demonisBarrageTimer = 0.6;
            const targets = [...this.enemies]
              .sort((a, b) => Math.hypot(a.x - this.playerPos.x, a.y - this.playerPos.y) - Math.hypot(b.x - this.playerPos.x, b.y - this.playerPos.y));
            if (targets.length > 0) {
              for (let d = 0; d < 6; d++) {
                const t = targets[d % targets.length];
                const dartCrit = Math.random() < this.player.critChance;
                const dartDmg = this.player.atk * 0.45 * (dartCrit ? this.player.critDmg : 1.0);
                this.projectiles.push(new ProjectileEntity(
                  this.playerPos.x,
                  this.playerPos.y,
                  t.x + (Math.random() - 0.5) * 18,
                  t.y + (Math.random() - 0.5) * 18,
                  660,
                  dartDmg,
                  dartCrit,
                  '#e879f9',
                  'player'
                ));
              }
            }
          }
        }
      }
    }

    // Overcharge passive conduit (every 3.0s)
    if (this.acquiredAttributes.has('attr_overcharge')) {
      this.overchargeTimer += dt;
      if (this.overchargeTimer >= 3.0) {
        this.overchargeTimer = 0;
        this.triggerOvercharge();
      }
    }

    // Phoenix Ash Ember periodic fire nova (every 5s)
    if (this.acquiredAttributes.has('attr_phoenix_ember')) {
      this.phoenixTimer += dt;
      if (this.phoenixTimer >= 5.0) {
        this.phoenixTimer = 0;
        const radius = 170;
        const fireDmg = this.player.atk * 1.8;
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#f97316', radius);
        sounds.playExplosion();
        for (const e of this.enemies) {
          if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= radius) {
            e.takeDamage(fireDmg, false, 'player', this);
          }
        }
      }
    }

    // Solar Flare Mantle (Sunfire) periodic burn (every 1s)
    if (this.acquiredAttributes.has('attr_sunfire_cape')) {
      this.sunfireTimer += dt;
      if (this.sunfireTimer >= 1.0) {
        this.sunfireTimer = 0;
        const radius = 150;
        const burnDmg = 45 + this.player.maxHp * 0.03;
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#fb923c', radius);
        for (const e of this.enemies) {
          if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= radius) {
            e.takeDamage(burnDmg, false, 'true_damage', this);
          }
        }
      }
    }

    // Crimson Meteorite periodic meteor strike (every 7s)
    if (this.acquiredAttributes.has('attr_crimson_meteor')) {
      this.meteorTimer += dt;
      if (this.meteorTimer >= 7.0) {
        this.meteorTimer = 0;
        const target = this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
        if (target) {
          const mx = target.x;
          const my = target.y;
          const mRadius = 140;
          this.createShockwave(mx, my, '#ef4444', mRadius);
          sounds.playExplosion();
          this.cameraShake = 8;
          for (const e of this.enemies) {
            if (Math.hypot(e.x - mx, e.y - my) <= mRadius) {
              e.takeDamage(this.player.atk * 3.2, true, 'player', this);
              e.stunTimer = Math.max(e.stunTimer, 1.5);
            }
          }
        }
      }
    }

    // Divine Sanctuary Halo periodic heal & knockback (every 14s)
    if (this.acquiredAttributes.has('attr_divine_sanctuary')) {
      this.sanctuaryTimer += dt;
      if (this.sanctuaryTimer >= 14.0) {
        this.sanctuaryTimer = 0;
        this.healPlayer(this.player.maxHp * 0.18);
        for (const c of this.clones) {
          if (c.hp > 0) c.hp = Math.min(c.maxHp, c.hp + c.maxHp * 0.18);
        }
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#facc15', 200);
        sounds.playSkill('warp');
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y);
          if (d <= 200) {
            const ang = Math.atan2(e.y - this.playerPos.y, e.x - this.playerPos.x);
            e.x += Math.cos(ang) * 90;
            e.y += Math.sin(ang) * 90;
          }
        }
      }
    }

    // Titan Aegis Shield Recharge (every 10s, 380 HP)
    if (this.acquiredAttributes.has('attr_shield_aegis')) {
      this.aegisShieldTimer += dt;
      if (this.aegisShieldTimer >= 10.0) {
        this.aegisShieldTimer = 0;
        this.aegisShield = 380;
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#38bdf8', 60);
        for (const c of this.clones) {
          if (c.hp > 0) {
            c.aegisShield = 380;
            this.createShockwave(c.x, c.y, '#38bdf8', 35);
          }
        }
      }
    }

    // Cosmic Singularity Core Pulse
    if (this.acquiredAttributes.has('attr_singularity_core')) {
      this.singularityTimer += dt;
      if (this.singularityTimer >= 6.0) {
        this.singularityTimer = 0;
        this.addPlayerSpatialZone({
          x: this.playerPos.x,
          y: this.playerPos.y,
          radius: 160,
          duration: 2.2,
          maxDuration: 2.2,
          type: 'judge_collapse',
          color: '#c084fc',
          pulseAngle: 0,
          owner: 'player'
        });
        sounds.playSkill('warp');
      }
    }

    // Hero-Synergy Relic Timers & Periodic Triggers
    if (this.chronoPendulumCd > 0) this.chronoPendulumCd = Math.max(0, this.chronoPendulumCd - dt);
    if (this.cryoBastionCd > 0) this.cryoBastionCd = Math.max(0, this.cryoBastionCd - dt);
    if (this.phantomHealCd > 0) this.phantomHealCd = Math.max(0, this.phantomHealCd - dt);

    if (this.temporalCompassTimer > 0) {
      this.temporalCompassTimer = Math.max(0, this.temporalCompassTimer - dt);
      if (this.temporalCompassTimer === 0) {
        this.recalculateStats();
      }
    }
    if (this.phantomPhaseTimer > 0) {
      this.phantomPhaseTimer = Math.max(0, this.phantomPhaseTimer - dt);
      if (this.phantomPhaseTimer === 0) {
        this.recalculateStats();
      }
    }
    if (this.frostPrismCd > 0) {
      this.frostPrismCd = Math.max(0, this.frostPrismCd - dt);
    }
    if (this.arcaneCatalystTimer > 0) {
      this.arcaneCatalystTimer = Math.max(0, this.arcaneCatalystTimer - dt);
      if (this.arcaneCatalystTimer === 0) {
        this.recalculateStats();
      }
    }
    if (this.berserkClawTimer > 0) {
      this.berserkClawTimer = Math.max(0, this.berserkClawTimer - dt);
      if (this.berserkClawTimer === 0) {
        this.recalculateStats();
      }
    }
    if (this.ironWillStacks > 0) {
      const isLowHp = this.player.hp / this.player.maxHp < 0.5;
      if (isLowHp !== this.lastIronWillLowHp) {
        this.lastIronWillLowHp = isLowHp;
        this.recalculateStats();
      }
    }

    // Solaris Ignis: Supernova Incarnation (Avatar Matahari)
    if ((this.player.solarAvatarTimer ?? 0) > 0) {
      this.player.solarAvatarTimer = Math.max(0, (this.player.solarAvatarTimer ?? 0) - dt);
      const solarBonusMult = this.acquiredAttributes.has('attr_solar_core') ? 1.40 : 1.0;

      this.solarAvatarAuraTimer += dt;
      if (this.solarAvatarAuraTimer >= 0.8) {
        this.solarAvatarAuraTimer -= 0.8;
        const auraRadius = 185;
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#fb923c', auraRadius);
        for (const e of this.enemies) {
          if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= auraRadius) {
            const auraCrit = Math.random() < this.player.critChance;
            const auraDmg = this.player.atk * 0.72 * solarBonusMult * (auraCrit ? this.player.critDmg : 1.0);
            e.takeDamage(auraDmg, auraCrit, 'true_damage', this);
          }
        }
      }

      if (this.unlockedTraits.has('sol_s4_u2')) {
        this.solarAvatarMeteorTimer += dt;
        if (this.solarAvatarMeteorTimer >= 2.0) {
          this.solarAvatarMeteorTimer -= 2.0;
          const mTarget = this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
          if (mTarget) {
            const mx = mTarget.x;
            const my = mTarget.y;
            this.createShockwave(mx, my, '#f97316', 125);
            sounds.playExplosion();
            for (const e of this.enemies) {
              if (Math.hypot(e.x - mx, e.y - my) <= 125) {
                const mCrit = Math.random() < this.player.critChance;
                const mDmg = this.player.atk * 1.70 * solarBonusMult * (mCrit ? this.player.critDmg : 1.0);
                e.takeDamage(mDmg, mCrit, 'player', this);
              }
            }
          }
        }
      }

      if (this.player.solarAvatarTimer <= 0) {
        this.solarAvatarAuraTimer = 0;
        this.solarAvatarMeteorTimer = 0;
        this.recalculateStats();
      }
    }

    // Cooldown ticks for Fallen Angel / Demon Raised passives
    if (this.abyssalPinionCd > 0) {
      this.abyssalPinionCd = Math.max(0, this.abyssalPinionCd - dt);
    }
    if (this.demonRebirthCd > 0) {
      this.demonRebirthCd = Math.max(0, this.demonRebirthCd - dt);
      this.player.demonRebirthCd = this.demonRebirthCd;
    }

    // Fallen Angel: Eclipse of the Fallen Seraph (Six-Winged Feather Rain)
    if ((this.player.angelEclipseTimer ?? 0) > 0) {
      this.player.angelEclipseTimer = Math.max(0, (this.player.angelEclipseTimer ?? 0) - dt);
      this.angelWingTimer += dt;
      if (this.angelWingTimer >= 0.65) {
        this.angelWingTimer -= 0.65;
        const volleyCount = this.unlockedTraits.has('fa_s4_u2') ? 6 : 4;
        const targets = [...this.enemies]
          .filter(e => e.hp > 0)
          .sort((a, b) => Math.hypot(a.x - this.playerPos.x, a.y - this.playerPos.y) - Math.hypot(b.x - this.playerPos.x, b.y - this.playerPos.y));
        if (targets.length > 0) {
          sounds.playSkill('slash');
          for (let i = 0; i < volleyCount; i++) {
            const t = targets[i % targets.length];
            const fCrit = Math.random() < this.player.critChance;
            const fDmg = this.player.atk * 0.95 * (fCrit ? this.player.critDmg : 1.0);
            this.projectiles.push(new ProjectileEntity(
              this.playerPos.x,
              this.playerPos.y,
              t.x + (Math.random() - 0.5) * 16,
              t.y + (Math.random() - 0.5) * 16,
              680,
              fDmg,
              fCrit,
              '#e879f9',
              'player'
            ));
          }
          if (this.unlockedTraits.has('fa_s4_u2')) {
            this.healPlayer(this.player.maxHp * 0.02);
          }
        }
      }
      if ((this.player.angelEclipseTimer ?? 0) <= 0) {
        this.angelWingTimer = 0;
        this.recalculateStats();
      }
    }

    // Demon Raised: Risen Archfiend Ascension (Hellfire Aura & Doomsday Hellstorm)
    if ((this.player.demonAwakenTimer ?? 0) > 0) {
      this.player.demonAwakenTimer = Math.max(0, (this.player.demonAwakenTimer ?? 0) - dt);
      const hellfireMult = this.acquiredAttributes.has('attr_hellfire_crown') ? 1.35 : 1.0;

      this.demonAuraTimer += dt;
      if (this.demonAuraTimer >= 0.75) {
        this.demonAuraTimer -= 0.75;
        const auraRadius = 195;
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#e11d48', auraRadius);
        for (const e of this.enemies) {
          if (e.hp > 0 && Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= auraRadius) {
            const auraCrit = Math.random() < this.player.critChance;
            const auraDmg = this.player.atk * 0.85 * hellfireMult * (auraCrit ? this.player.critDmg : 1.0);
            e.takeDamage(auraDmg, auraCrit, 'true_damage', this);
          }
        }
      }

      if (this.unlockedTraits.has('dr_s4_u2')) {
        this.demonMeteorTimer += dt;
        if (this.demonMeteorTimer >= 1.8) {
          this.demonMeteorTimer -= 1.8;
          const mTarget = this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
          if (mTarget) {
            const mx = mTarget.x;
            const my = mTarget.y;
            this.createShockwave(mx, my, '#e11d48', 135);
            this.createShockwave(mx, my, '#fb7185', 85);
            sounds.playExplosion();
            for (const e of this.enemies) {
              if (e.hp > 0 && Math.hypot(e.x - mx, e.y - my) <= 135) {
                const mCrit = Math.random() < this.player.critChance;
                const mDmg = this.player.atk * 1.85 * hellfireMult * (mCrit ? this.player.critDmg : 1.0);
                e.takeDamage(mDmg, mCrit, 'true_damage', this);
                e.stunTimer = Math.max(e.stunTimer, 0.9);
              }
            }
          }
        }
      }

      if ((this.player.demonAwakenTimer ?? 0) <= 0) {
        this.demonAuraTimer = 0;
        this.demonMeteorTimer = 0;
        this.recalculateStats();
      }
    }

    // Blazing Ember Greaves: leave fire trail while moving (65% ATK)
    if (this.acquiredAttributes.has('attr_ember_greaves')) {
      const moveMag = Math.hypot(this.playerPos.vx, this.playerPos.vy);
      if (moveMag > 25) {
        this.emberTrailTimer += dt;
        if (this.emberTrailTimer >= 0.45) {
          this.emberTrailTimer = 0;
          const tx = this.playerPos.x;
          const ty = this.playerPos.y;
          this.createShockwave(tx, ty, '#f97316', 75);
          const trailDmg = this.player.atk * 0.65;
          for (const e of this.enemies) {
            if (Math.hypot(e.x - tx, e.y - ty) <= 85) {
              e.takeDamage(trailDmg, false, 'player', this);
            }
          }
        }
      }
    }

    // Radiant Sun Aegis: every 12s grants 260 Shield & stuns nearby enemies 0.8s
    if (this.acquiredAttributes.has('attr_radiant_aegis')) {
      this.radiantAegisTimer += dt;
      if (this.radiantAegisTimer >= 12.0) {
        this.radiantAegisTimer = 0;
        this.aegisShield = Math.min(800, this.aegisShield + 260);
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#facc15', 180);
        sounds.playSkill('buff');
        for (const e of this.enemies) {
          if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 180) {
            e.stunTimer = Math.max(e.stunTimer, 0.8);
          }
        }
        this.addRelicFloatingText({
          x: this.playerPos.x,
          y: this.playerPos.y,
          text: '☀️ RADIANT AEGIS (+260)',
          color: '#facc15',
          fontSize: 12,
          life: 0.85,
          maxLife: 0.85,
          vy: 16
        });
      }
    }

    // Stormcaller Crown: every 4s calls 3 sky lightning bolts (220% ATK True Damage + 0.8s stun)
    if (this.acquiredAttributes.has('attr_thunder_crown')) {
      this.thunderCrownTimer += dt;
      if (this.thunderCrownTimer >= 4.0) {
        this.thunderCrownTimer = 0;
        const targets = [...this.enemies]
          .sort((a, b) => Math.hypot(a.x - this.playerPos.x, a.y - this.playerPos.y) - Math.hypot(b.x - this.playerPos.x, b.y - this.playerPos.y))
          .slice(0, 3);
        if (targets.length > 0) {
          sounds.playSkill('thunder');
          const boltDmg = this.player.atk * 2.20;
          for (const t of targets) {
            this.createLightningChain(t.x, Math.max(0, t.y - 140), t.x, t.y, '#fde047');
            this.createShockwave(t.x, t.y, '#fde047', 65);
            t.takeDamage(boltDmg, true, 'true_damage', this);
            t.stunTimer = Math.max(t.stunTimer, 0.8);
          }
        }
      }
    }

    // Singularity Mass Anchor: every 5s pulls enemies within 240px & slows 1.5s
    if (this.acquiredAttributes.has('attr_gravity_anchor')) {
      this.gravityAnchorTimer += dt;
      if (this.gravityAnchorTimer >= 5.0) {
        this.gravityAnchorTimer = 0;
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#a855f7', 240);
        sounds.playSkill('warp');
        for (const e of this.enemies) {
          const dist = Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y);
          if (dist <= 240 && dist > 32) {
            const ang = Math.atan2(this.playerPos.y - e.y, this.playerPos.x - e.x);
            const pull = Math.min(85, dist - 28);
            e.x += Math.cos(ang) * pull;
            e.y += Math.sin(ang) * pull;
            e.chronoSlowTimer = Math.max(e.chronoSlowTimer, 1.5);
          }
        }
      }
    }

    // Valkyrie Frost Permafrost Shield passive regeneration (+12/s up to 650, or +30/s up to 1000 with Glacial Sovereign Crown)
    if (this.heroKey === 'valkyrie' || this.acquiredAttributes.has('attr_permafrost_crown')) {
      const hasCrown = this.acquiredAttributes.has('attr_permafrost_crown');
      const regenCap = hasCrown ? 1000 : 650;
      const regenRate = this.heroKey === 'valkyrie' ? (hasCrown ? 30 : 12) : 18;
      const prevShield = this.player.frostArmorShield || 0;
      if (prevShield < regenCap) {
        this.player.frostArmorShield = Math.min(regenCap, prevShield + regenRate * dt);
        if (prevShield <= 0 && (this.player.frostArmorShield || 0) > 0) {
          this.recalculateStats();
        }
      }
    }

    // Arbiter Reality Edict: Gravity True Damage Pulse every 0.8s
    if (this.acquiredAttributes.has('attr_reality_edict')) {
      this.realityEdictTimer += dt;
      if (this.realityEdictTimer >= 0.8) {
        this.realityEdictTimer = 0;
        const pulseRadius = this.heroKey === 'dimension_judge' ? 243 : 195;
        const pulseBase = this.player.atk * 1.10;
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#818cf8', pulseRadius);
        for (const e of this.enemies) {
          const dist = Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y);
          if (dist <= pulseRadius) {
            const pulseCrit = Math.random() < this.player.critChance;
            const pulseDmg = pulseBase * (pulseCrit ? this.player.critDmg : 1.0);
            e.takeDamage(pulseDmg, pulseCrit, 'true_damage', this);
            if (dist > 28) {
              const ang = Math.atan2(this.playerPos.y - e.y, this.playerPos.x - e.x);
              e.x += Math.cos(ang) * 18;
              e.y += Math.sin(ang) * 18;
            }
          }
        }
      }
    }

    // Astral Mirror Barrier recharge (every 10s)
    if (this.acquiredAttributes.has('attr_mirror_ward') && !this.mirrorWardReady) {
      this.mirrorWardTimer += dt;
      if (this.mirrorWardTimer >= 10.0) {
        this.mirrorWardTimer = 0;
        this.mirrorWardReady = true;
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#e2e8f0', 55);
      }
    }

    // Temporal Chrono Engine pulse (every 8s: -1.5s active CDs + 3s Haste)
    if (this.chronoAnchorBuffTimer > 0) {
      this.chronoAnchorBuffTimer = Math.max(0, this.chronoAnchorBuffTimer - dt);
      if (this.chronoAnchorBuffTimer === 0) {
        this.recalculateStats();
      }
    }
    if (this.acquiredAttributes.has('attr_chrono_anchor')) {
      this.chronoAnchorTimer += dt;
      if (this.chronoAnchorTimer >= 8.0) {
        this.chronoAnchorTimer = 0;
        this.chronoAnchorBuffTimer = 3.0;
        for (let i = 0; i < this.player.skillCDs.length; i++) {
          if (this.player.skillCDs[i] > 0) {
            this.player.skillCDs[i] = Math.max(0, this.player.skillCDs[i] - 1.5);
          }
        }
        this.recalculateStats();
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#22d3ee', 110);
        sounds.playSkill('warp');
        this.addRelicFloatingText({
          x: this.playerPos.x,
          y: this.playerPos.y,
          text: '⏱️ CHRONO ENGINE (-1.5s CD)',
          color: '#22d3ee',
          fontSize: 12,
          life: 0.9,
          maxLife: 0.9,
          vy: 16
        });
      }
    }

    // Warlord Frenzy Banner (Bloodlust decay)
    if (this.bloodlustStacks > 0) {
      this.bloodlustTimer -= dt;
      if (this.bloodlustTimer <= 0) {
        this.bloodlustStacks = 0;
        this.recalculateStats();
      }
    }

    // Permafrost Blizzard Heart aura (slows nearby enemies + triggers Cryo Burst every 2.5s)
    if (this.acquiredAttributes.has('attr_frostbite_aura')) {
      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 190) {
          e.frostSlowTimer = Math.max(e.frostSlowTimer, 0.25);
        }
      }
      this.frostbiteTimer += dt;
      if (this.frostbiteTimer >= 2.5) {
        this.frostbiteTimer = 0;
        const cryoDmg = this.player.atk * 1.2;
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#7dd3fc', 190);
        for (const e of this.enemies) {
          if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 190) {
            e.takeDamage(cryoDmg, false, 'player', this);
          }
        }
      }
    }

    // Celestial Star Orbs (3 rotating armor-piercing orbs around player)
    if (this.acquiredAttributes.has('attr_celestial_orbit')) {
      this.orbitAngle += dt * 3.2;
      const orbitRadius = 78;
      for (let o = 0; o < 3; o++) {
        const a = this.orbitAngle + (o * Math.PI * 2) / 3;
        const ox = this.playerPos.x + Math.cos(a) * orbitRadius;
        const oy = this.playerPos.y + Math.sin(a) * orbitRadius;
        for (const e of this.enemies) {
          if (e.orbitHitCd <= 0 && Math.hypot(e.x - ox, e.y - oy) <= e.radius + 16) {
            e.orbitHitCd = 0.45;
            e.takeDamage(this.player.atk * 1.10, false, 'true_damage', this);
            this.createSlashEffect(ox, oy, e.x, e.y, '#fde047');
          }
        }
      }
    }

    // Update skill cooldowns
    for (let i = 0; i < this.activeSkills.length; i++) {
      if (this.player.skillCDs[i] > 0) {
        this.player.skillCDs[i] -= dt;
      }
    }

    // Dimension Judg constant spatial gravity passive
    if (this.heroKey === 'dimension_judge') {
      const hasEdict = this.acquiredAttributes.has('attr_reality_edict');
      const gravityRadius = hasEdict ? 243 : 180;
      const pullStrength = hasEdict ? 52 : 35;
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y);
        if (d <= gravityRadius) {
          // Slow down and gently pull towards Dimension Judge
          const angle = Math.atan2(this.playerPos.y - e.y, this.playerPos.x - e.x);
          e.x += Math.cos(angle) * pullStrength * dt;
          e.y += Math.sin(angle) * pullStrength * dt;
        }
      }
    }

    // Rift Walker warp buff, invulnerability & Omnipresent Void Storm countdown
    if (this.riftCounterSlashCd > 0) {
      this.riftCounterSlashCd = Math.max(0, this.riftCounterSlashCd - dt);
    }
    if (this.riftInvulnTimer > 0) {
      this.riftInvulnTimer = Math.max(0, this.riftInvulnTimer - dt);
    }
    if ((this.player.riftWarpBuffTimer ?? 0) > 0) {
      this.player.riftWarpBuffTimer! -= dt;
      if (this.player.riftWarpBuffTimer! <= 0) {
        this.player.riftWarpBuffTimer = 0;
        this.recalculateStats();
      }
    }
    if (this.riftStormSlashesLeft > 0) {
      this.player.riftStormTimer = Math.max(0, (this.player.riftStormTimer ?? 0) - dt);
      this.riftStormSlashTimer -= dt;
      if (this.riftStormSlashTimer <= 0) {
        this.riftStormSlashTimer = 0.11;
        const living = this.enemies.filter(e => e.hp > 0);
        const t = living.length > 0
          ? living[Math.floor(Math.random() * living.length)]
          : this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
        if (t && t.hp > 0) {
          const bx = Math.max(30, Math.min(this.width - 30, t.x + (Math.random() - 0.5) * 44));
          const by = Math.max(30, Math.min(this.height - 30, t.y + (Math.random() - 0.5) * 44));
          this.createSlashEffect(this.playerPos.x, this.playerPos.y, bx, by, '#22d3ee');
          this.createLaserBeam(this.playerPos.x, this.playerPos.y, bx, by, '#06b6d4', 6);
          this.playerPos.x = bx;
          this.playerPos.y = by;
          this.playerPos.facing = Math.atan2(t.y - by, t.x - bx);
          const stormDmg = this.player.atk * this.player.critDmg * 0.95;
          const pctTrue = Math.min(t.isBoss ? 140 : 220, Math.round(t.maxHp * 0.012));
          t.takeDamage(stormDmg, true, 'player', this);
          t.takeDamage(pctTrue, false, 'true_damage', this);
          this.applyRiftMark(t);
          sounds.playHit(true);
        }
        this.riftStormSlashesLeft--;
        if (this.riftStormSlashesLeft <= 0) {
          this.player.isInvulnerable = false;
          this.player.riftStormTimer = 0;
          const hasAnnihilation = this.unlockedTraits.has('rw_s4_u2');
          const novaRadius = hasAnnihilation ? 290 : 220;
          this.createShockwave(this.playerPos.x, this.playerPos.y, '#22d3ee', novaRadius);
          this.createShockwave(this.playerPos.x, this.playerPos.y, '#06b6d4', Math.round(novaRadius * 0.72));
          sounds.playExplosion();
          this.cameraShake = 18;
          this.player.riftWarpBuffTimer = 2.0;
          if (this.acquiredAttributes.has('attr_quantum_echo')) {
            this.triggerRiftBlinkSlash(this.playerPos.x, this.playerPos.y);
          }
          this.activatePhantomPhase();
          this.recalculateStats();

          for (const e of this.enemies) {
            if (e.hp > 0 && Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= novaRadius) {
              if (hasAnnihilation && !e.isBoss && (e.hp / e.maxHp < 0.22)) {
                e.takeDamage(e.hp + 9999, true, 'true_damage', this);
              } else {
                const novaCrit = Math.random() < this.player.critChance;
                const novaDmg = this.player.atk * 2.10 * (novaCrit ? this.player.critDmg : 1.0);
                e.takeDamage(novaDmg, novaCrit, 'true_damage', this);
                if (hasAnnihilation && e.isBoss) {
                  e.takeDamage(Math.min(750, Math.round(e.maxHp * 0.07)), false, 'true_damage', this);
                }
                this.applyRiftMark(e);
              }
              e.stunTimer = Math.max(e.stunTimer, 1.3);
            }
          }
        }
      }
    }

    if (this.invulnPopupCd > 0) {
      this.invulnPopupCd = Math.max(0, this.invulnPopupCd - dt);
    }

    // Valkyrie Rush speed & Perpetual Blizzard Frost Pulse timers
    if (this.valkyrieRushTimer > 0) {
      this.valkyrieRushTimer = Math.max(0, this.valkyrieRushTimer - dt);
      if (this.valkyrieRushTimer <= 0) {
        this.recalculateStats();
      }
    }
    if (this.valkyrieBlizzardTimer > 0) {
      this.valkyrieBlizzardTimer = Math.max(0, this.valkyrieBlizzardTimer - dt);
      this.valkyrieBlizzardTick += dt;
      if (this.valkyrieBlizzardTick >= 0.85) {
        this.valkyrieBlizzardTick = 0;
        const zoneRadius = this.unlockedTraits.has('v_s4_u2') ? 340 : 260;
        const pulseDmg = this.player.atk * (this.unlockedTraits.has('v_s4_u2') ? 0.95 : 0.65);
        this.createShockwave(this.valkyrieBlizzardX, this.valkyrieBlizzardY, '#7dd3fc', zoneRadius);
        for (const e of this.enemies) {
          if (e.hp > 0 && Math.hypot(e.x - this.valkyrieBlizzardX, e.y - this.valkyrieBlizzardY) <= zoneRadius) {
            e.frostSlowTimer = Math.max(e.frostSlowTimer, 2.0);
            e.takeDamage(pulseDmg, false, 'frost_shatter', this);
          }
        }
      }
    }

    // Soul Puppeteer Possess & Lich Transform timers
    if ((this.player.puppetPossessTimer ?? 0) > 0) {
      this.player.puppetPossessTimer = Math.max(0, (this.player.puppetPossessTimer ?? 0) - dt);
      if (this.player.puppetPossessTimer <= 0) {
        this.recalculateStats();
      }
    }
    if ((this.player.lichTransformTimer ?? 0) > 0) {
      this.player.lichTransformTimer = Math.max(0, (this.player.lichTransformTimer ?? 0) - dt);
      if (this.unlockedTraits.has('sp_s4_u2')) {
        this.lichGenesisTimer += dt;
        if (this.lichGenesisTimer >= 2.0) {
          this.lichGenesisTimer -= 2.0;
          this.addSouls(5);
          this.spawnPuppetMinion('puppet', this.playerPos.x + (Math.random() - 0.5) * 60, this.playerPos.y + (Math.random() - 0.5) * 60, 1);
          this.spawnPuppetMinion('undead', this.playerPos.x + (Math.random() - 0.5) * 70, this.playerPos.y + (Math.random() - 0.5) * 70, 0);
          this.spawnPuppetMinion('undead', this.playerPos.x + (Math.random() - 0.5) * 70, this.playerPos.y + (Math.random() - 0.5) * 70, 0);
        }
      }
      if (this.player.lichTransformTimer <= 0) {
        this.lichGenesisTimer = 0;
        this.recalculateStats();
      }
    }

    // Traveler Stance Switch & Chronos Overdrive Aura
    let insideTravelerField = false;
    if (this.heroKey === 'traveler') {
      let nearbyCount = 0;
      let closestDist = Infinity;
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y);
        if (d < 175) nearbyCount++;
        if (d < closestDist) closestDist = d;
      }

      const prevStance = this.player.travelerStance;
      if (nearbyCount >= 3) {
        this.player.travelerStance = 'staff';
      } else if (closestDist < 125) {
        this.player.travelerStance = 'sword';
      } else {
        this.player.travelerStance = 'bow';
      }

      if (prevStance !== this.player.travelerStance) {
        this.recalculateStats();
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#06b6d4', 44);
        if (this.acquiredAttributes.has('attr_chrono_pendulum') && this.chronoPendulumCd <= 0) {
          this.chronoPendulumCd = 0.8;
          this.triggerChronoParadoxPulse();
        }
      }

      if (this.travelerInvulnTimer > 0) {
        this.travelerInvulnTimer = Math.max(0, this.travelerInvulnTimer - dt);
      }

      if (this.travelerSpeedBoostTimer > 0) {
        this.travelerSpeedBoostTimer = Math.max(0, this.travelerSpeedBoostTimer - dt);
        if (this.travelerSpeedBoostTimer <= 0) {
          this.recalculateStats();
        }
      }

      if ((this.player.travelerOverdriveTimer ?? 0) > 0) {
        this.player.travelerOverdriveTimer = Math.max(0, (this.player.travelerOverdriveTimer ?? 0) - dt);
        insideTravelerField = true;
        const isInfiniteDomain = this.unlockedTraits.has('t_s4_u1');
        const auraRadius = isInfiniteDomain ? 345 : 230;
        for (const e of this.enemies) {
          if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= auraRadius) {
            e.chronoSlowTimer = Math.max(e.chronoSlowTimer, 0.20);
          }
        }
        this.travelerBladeTimer -= dt;
        if (this.travelerBladeTimer <= 0) {
          this.travelerBladeTimer = isInfiniteDomain ? 0.55 : 0.70;
          const bladeCount = isInfiniteDomain ? 2 : 1;
          const targets = [...this.enemies]
            .filter(e => e.hp > 0 && Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= auraRadius + 140)
            .sort((a, b) => Math.hypot(a.x - this.playerPos.x, a.y - this.playerPos.y) - Math.hypot(b.x - this.playerPos.x, b.y - this.playerPos.y));
          for (let b = 0; b < bladeCount && b < targets.length; b++) {
            const bt = targets[b];
            const bCrit = Math.random() < this.player.critChance;
            const bDmg = this.player.atk * 1.10 * (bCrit ? this.player.critDmg : 1.0);
            this.createSlashEffect(this.playerPos.x, this.playerPos.y, bt.x, bt.y, '#22d3ee');
            this.createShockwave(bt.x, bt.y, '#06b6d4', 65);
            bt.takeDamage(bDmg, bCrit, 'true_damage', this);
          }
        }
        if ((this.player.travelerOverdriveTimer ?? 0) <= 0) {
          this.recalculateStats();
        }
      }
    }

    // Spatial Zones (Ruang Dimensi) Update
    for (let i = this.spatialZones.length - 1; i >= 0; i--) {
      const z = this.spatialZones[i];
      z.duration -= dt;
      z.pulseAngle += dt * 3;

      if (z.owner === 'corrupted_hero') {
        // Corrupted Hero space zones affecting Player and Clones
        if (z.type === 'traveler_chrono') {
          if (Math.hypot(this.playerPos.x - z.x, this.playerPos.y - z.y) <= z.radius) {
            this.playerPos.x -= (this.playerPos.x - z.x) * 0.08 * dt;
            this.playerPos.y -= (this.playerPos.y - z.y) * 0.08 * dt;
          }
          for (const c of this.clones) {
            if (c.hp > 0 && Math.hypot(c.x - z.x, c.y - z.y) <= z.radius) {
              c.x -= (c.x - z.x) * 0.08 * dt;
              c.y -= (c.y - z.y) * 0.08 * dt;
            }
          }
        } else if (z.type === 'judge_collapse') {
          // Pull player and clones into singularity
          const pd = Math.hypot(this.playerPos.x - z.x, this.playerPos.y - z.y);
          if (pd <= z.radius) {
            const pullAngle = Math.atan2(z.y - this.playerPos.y, z.x - this.playerPos.x);
            const pullForce = (z.radius - pd + 50) * 1.8;
            this.playerPos.x += Math.cos(pullAngle) * pullForce * dt;
            this.playerPos.y += Math.sin(pullAngle) * pullForce * dt;
          }
          for (const c of this.clones) {
            const cd = Math.hypot(c.x - z.x, c.y - z.y);
            if (cd <= z.radius) {
              const pullAngle = Math.atan2(z.y - c.y, z.x - c.x);
              c.x += Math.cos(pullAngle) * 80 * dt;
              c.y += Math.sin(pullAngle) * 80 * dt;
            }
          }
          if (z.duration <= 0) {
            this.createShockwave(z.x, z.y, '#dc2626', z.radius);
            sounds.playExplosion();
            this.cameraShake = 12;
            const collapseDmg = z.damage ?? 220;
            if (Math.hypot(this.playerPos.x - z.x, this.playerPos.y - z.y) <= z.radius) {
              this.damagePlayer(collapseDmg);
            }
            for (const c of this.clones) {
              if (Math.hypot(c.x - z.x, c.y - z.y) <= z.radius) {
                c.takeDamage(collapseDmg, this);
              }
            }
          }
        } else if (z.type === 'judge_domain') {
          if (Math.hypot(this.playerPos.x - z.x, this.playerPos.y - z.y) <= z.radius) {
            this.damagePlayer((z.damage ?? 75) * dt);
          }
        }
      } else {
        // Player's Space Zones
        if (z.type === 'traveler_chrono') {
          // Slow enemies smoothly without stunlocking so they can still attack Traveler
          for (const e of this.enemies) {
            if (Math.hypot(e.x - z.x, e.y - z.y) <= z.radius) {
              e.chronoSlowTimer = Math.max(e.chronoSlowTimer, 0.15);
            }
          }
          // Check if player is inside Traveler field
          if (Math.hypot(this.playerPos.x - z.x, this.playerPos.y - z.y) <= z.radius) {
            insideTravelerField = true;
          }
        } else if (z.type === 'judge_collapse') {
          // Singularity: suck enemies toward center
          for (const e of this.enemies) {
            const d = Math.hypot(e.x - z.x, e.y - z.y);
            if (d <= z.radius) {
              const pullAngle = Math.atan2(z.y - e.y, z.x - e.x);
              const pullForce = (z.radius - d + 60) * 2.4;
              e.x += Math.cos(pullAngle) * pullForce * dt;
              e.y += Math.sin(pullAngle) * pullForce * dt;
            }
          }
          // Explosion upon collapse
          if (z.duration <= 0) {
            this.createShockwave(z.x, z.y, '#818cf8', z.radius);
            sounds.playExplosion();
            this.cameraShake = 8;
            for (const e of this.enemies) {
              if (Math.hypot(e.x - z.x, e.y - z.y) <= z.radius) {
                const zoneCrit = Math.random() < this.player.critChance;
                const dmg = this.player.atk * 2.4 * (zoneCrit ? this.player.critDmg : 1.0);
                e.takeDamage(dmg, zoneCrit, 'player', this);
              }
            }
          }
        } else if (z.type === 'judge_barrier') {
          // Repel enemies touching the barrier, damage throttled to every 0.45s
          z.tickTimer = (z.tickTimer ?? 0) - dt;
          const canTick = z.tickTimer <= 0;
          if (canTick) z.tickTimer = 0.45;

          for (const e of this.enemies) {
            const d = Math.hypot(e.x - z.x, e.y - z.y);
            if (d <= z.radius + e.radius) {
              const pushAngle = Math.atan2(e.y - z.y, e.x - z.x);
              e.x = z.x + Math.cos(pushAngle) * (z.radius + e.radius + 6);
              e.y = z.y + Math.sin(pushAngle) * (z.radius + e.radius + 6);
              if (canTick) {
                const barrierCrit = Math.random() < this.player.critChance;
                const barrierDmg = this.player.atk * 0.55 * (barrierCrit ? this.player.critDmg : 1.0);
                e.takeDamage(barrierDmg, barrierCrit, 'player', this);
              }
            }
          }
        } else if (z.type === 'judge_domain') {
          // Reality Domain: tick damage to enemies inside every 0.5s
          z.tickTimer = (z.tickTimer ?? 0) - dt;
          if (z.tickTimer <= 0) {
            z.tickTimer = 0.5;
            for (const e of this.enemies) {
              if (Math.hypot(e.x - z.x, e.y - z.y) <= z.radius) {
                const domainCrit = Math.random() < this.player.critChance;
                const domainDmg = (25 + this.player.atk * 0.70) * (domainCrit ? this.player.critDmg : 1.0);
                e.takeDamage(domainDmg, domainCrit, 'true_damage', this);
              }
            }
          }
        }
      }

      if (z.duration <= 0) {
        this.spatialZones.splice(i, 1);
      }
    }

    // Traveler field status toggle
    const prevFieldTimer = this.player.travelerFieldTimer;
    if (insideTravelerField) {
      this.player.travelerFieldTimer = 0.5;
    } else if (this.player.travelerFieldTimer > 0) {
      this.player.travelerFieldTimer -= dt;
    }
    if ((prevFieldTimer > 0) !== (this.player.travelerFieldTimer > 0)) {
      this.recalculateStats();
    }

    // Judge Domain countdown
    if (this.player.judgeDomainTimer > 0) {
      this.player.judgeDomainTimer -= dt;
      if (this.player.judgeDomainTimer <= 0) {
        this.recalculateStats();
      }
    }

    // Player Movement
    this.updatePlayerMovement(dt);

    // Player Combat
    this.updatePlayerCombat(dt);

    // Clones
    for (let i = this.clones.length - 1; i >= 0; i--) {
      const c = this.clones[i];
      c.update(dt, this);
      if (c.lifeTimer <= 0 || c.hp <= 0) {
        if (c.isRiftDecoy && this.unlockedTraits.has('rw_s3_u2')) {
          this.triggerDecoySupernova(c.x, c.y);
        }
        this.createPuffParticles(c.x, c.y, c.isRiftDecoy ? '#22d3ee' : '#f59e0b');
        this.clones.splice(i, 1);
      }
    }

    // Soul Puppeteer Puppets & Necro Undead Minions
    let pCount = 0;
    let uCount = 0;
    for (let i = this.minions.length - 1; i >= 0; i--) {
      const m = this.minions[i];
      m.update(dt, this);
      if (m.lifeTimer <= 0 || m.hp <= 0) {
        this.createPuffParticles(m.x, m.y, m.kind === 'puppet' ? '#e879f9' : '#4ade80');
        this.minions.splice(i, 1);
      } else {
        if (m.kind === 'puppet') pCount++;
        else uCount++;
      }
    }
    this.player.puppetCount = pCount;
    this.player.undeadCount = uCount;

    // Telegraphs
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const t = this.telegraphs[i];
      t.timer += dt;
      if (t.timer >= t.maxTimer) {
        t.onTrigger();
        this.telegraphs.splice(i, 1);
      }
    }

    // Enemies
    this.currentBoss = null;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.isBoss) this.currentBoss = e;
      e.update(dt, this);
      if (e.hp <= 0) {
        if (this.practiceMode && this.practiceAutoHealDummy && e.type === 'dummy') {
          e.hp = e.maxHp;
          this.createShockwave(e.x, e.y, '#fbbf24', 42);
          this.floatingTexts.push({
            x: e.x,
            y: e.y - e.radius - 16,
            text: '♻️ DUMMY RESET',
            color: '#fde047',
            fontSize: 13,
            life: 0.7,
            maxLife: 0.7,
            vy: -24
          });
        } else {
          this.handleEnemyDefeated(e);
          this.enemies.splice(i, 1);
        }
      }
    }

    // Monkey King Pasif Baru: Duel Ascendance (Semakin lama bertarung semakin kuat saat melawan hanya 1 musuh yang terus hidup)
    if (this.heroKey === 'monkey') {
      if (this.enemies.length === 1 && this.enemies[0].hp > 0) {
        const soloEnemy = this.enemies[0];
        if (this.monkeyDuelTarget !== soloEnemy) {
          this.monkeyDuelTarget = soloEnemy;
          this.monkeyDuelTimer = 0;
          this.monkeyDuelStacks = 0;
          this.player.monkeyDuelStacks = 0;
          this.recalculateStats();
        }
        if ((this.player.monkeyDuelStacks ?? 0) !== this.monkeyDuelStacks) {
          this.player.monkeyDuelStacks = this.monkeyDuelStacks;
          this.recalculateStats();
        }
        if (this.monkeyDuelStacks < 25) {
          this.monkeyDuelTimer += dt;
          if (this.monkeyDuelTimer >= 2.0) {
            this.monkeyDuelTimer -= 2.0;
            this.monkeyDuelStacks++;
            this.player.monkeyDuelStacks = this.monkeyDuelStacks;
            this.recalculateStats();
            this.createShockwave(this.playerPos.x, this.playerPos.y, '#f59e0b', 75);
            this.floatingTexts.push({
              x: this.playerPos.x,
              y: this.playerPos.y - 45,
              text: `🐒 DUEL ASCENDANCE x${this.monkeyDuelStacks}! (+${this.monkeyDuelStacks * 6}% ATK)`,
              color: '#fbbf24',
              fontSize: 15,
              life: 1.0,
              maxLife: 1.0,
              vy: -26
            });
          }
        }
      } else if (this.enemies.length === 0 || (this.monkeyDuelTarget && this.monkeyDuelTarget.hp <= 0)) {
        if (this.monkeyDuelStacks > 0 || this.monkeyDuelTarget !== null) {
          this.monkeyDuelTarget = null;
          this.monkeyDuelTimer = 0;
          this.monkeyDuelStacks = 0;
          this.player.monkeyDuelStacks = 0;
          this.recalculateStats();
        }
      } else if ((this.player.monkeyDuelStacks ?? 0) > 0) {
        // Multiple enemies alive: 1v1 bonus stays dormant until back to 1 living enemy
        this.player.monkeyDuelStacks = 0;
        this.recalculateStats();
      }
    }

    // Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, this);
      if (!p.active) {
        this.projectiles.splice(i, 1);
      }
    }

    // Exp Gems
    const magnetRange = this.player.soulMagnetRange;
    for (let i = this.expGems.length - 1; i >= 0; i--) {
      const g = this.expGems[i];
      const dist = Math.hypot(this.playerPos.x - g.x, this.playerPos.y - g.y);
      if (dist < magnetRange) {
        const angle = Math.atan2(this.playerPos.y - g.y, this.playerPos.x - g.x);
        const flySpeed = Math.max(300, 600 - dist);
        g.vx = Math.cos(angle) * flySpeed;
        g.vy = Math.sin(angle) * flySpeed;
      }
      g.x += g.vx * dt;
      g.y += g.vy * dt;

      if (dist < 24) {
        this.addExp(g.value);
        this.expGems.splice(i, 1);
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Floating text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      if (ft.vx) {
        ft.x += ft.vx * dt;
        ft.vx *= Math.pow(0.22, dt);
      }
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Wave Progression: Sebelum semua musuh dikalahkan, tidak akan memasuki gelombang baru (dinonaktifkan di Mode Practice)
    if (!this.practiceMode) {
      if (this.enemies.length === 0) {
        if (!this.waveClearNotified) {
          this.waveClearNotified = true;
          this.floatingTexts.push({
            x: this.width / 2,
            y: this.height / 2 - 55,
            text: `✅ GELOMBANG ${this.wave} BERSIH!`,
            color: '#34d399',
            fontSize: 22,
            life: 1.4,
            maxLife: 1.4,
            vy: -20
          });
        }
        this.enemySpawnTimer += dt;
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
          this.enemySpawnTimer = 0;
          this.waveClearNotified = false;
          this.wave++;
          this.spawnWave();
          this.floatingTexts.push({
            x: this.width / 2,
            y: this.height / 2 - 85,
            text: `⚔️ GELOMBANG ${this.wave} DIMULAI!`,
            color: '#38bdf8',
            fontSize: 24,
            life: 1.6,
            maxLife: 1.6,
            vy: -20
          });
        }
      } else {
        this.enemySpawnTimer = 0;
        this.waveClearNotified = false;
      }
    } else {
      this.wave = this.practiceWaveLevel;
    }

    // Rolling 3-second DPS sample
    const dmgDelta = Math.max(0, this.totalDamageDealt - this.prevTotalDamageDealt);
    this.prevTotalDamageDealt = this.totalDamageDealt;
    if (dmgDelta > 0) {
      this.damageSamples.push({ t: this.timeSurvived, dmg: dmgDelta });
    }
    const windowStart = this.timeSurvived - 3.0;
    while (this.damageSamples.length > 0 && this.damageSamples[0].t < windowStart) {
      this.damageSamples.shift();
    }

    // Sync Aegis shield state
    this.player.aegisShield = this.aegisShield;

    // Notify React layer
    this.pushStatsUpdate();
  }

  public pushStatsUpdate() {
    if (!this.onStatsUpdate) return;
    let rollingDmg = 0;
    for (const s of this.damageSamples) rollingDmg += s.dmg;
    const windowDur = this.damageSamples.length > 0
      ? Math.max(0.5, Math.min(3.0, this.timeSurvived - this.damageSamples[0].t + 0.1))
      : 1.0;
    const dps = this.damageSamples.length > 0 ? Math.round(rollingDmg / windowDur) : 0;

    const combatStats: CombatStats = {
      kills: this.kills,
      wave: this.wave,
      enemiesRemaining: this.enemies.length,
      timeSurvived: Math.floor(this.timeSurvived),
      damageDealt: Math.round(this.totalDamageDealt),
      highestCrit: Math.round(this.highestCrit),
      damageTaken: Math.round(this.totalDamageTaken),
      level: this.player.level,
      dps
    };
    const bossData = this.currentBoss ? {
      name: this.currentBoss.name,
      hp: Math.max(0, this.currentBoss.hp),
      maxHp: this.currentBoss.maxHp,
      category: this.currentBoss.bossCategory,
      shield: Math.round(this.currentBoss.corruptedShield)
    } : null;
    this.onStatsUpdate(combatStats, this.player, bossData);
  }

  private updatePlayerMovement(dt: number) {
    let moveX = 0;
    let moveY = 0;

    if (this.autoPilot) {
      // Auto-pilot maneuvers: maintains optimal distance from enemies, kites away if surrounded, seeks EXP gems
      const closest = this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
      const idealRange = Math.max(80, this.player.range * 0.75);

      if (closest) {
        const d = Math.hypot(closest.x - this.playerPos.x, closest.y - this.playerPos.y);
        const angle = Math.atan2(closest.y - this.playerPos.y, closest.x - this.playerPos.x);

        if (d < idealRange * 0.6) {
          // Backpedal / kite
          moveX = -Math.cos(angle);
          moveY = -Math.sin(angle);
        } else if (d > idealRange * 1.1) {
          // Approach
          moveX = Math.cos(angle);
          moveY = Math.sin(angle);
        } else {
          // Circle around target
          moveX = -Math.sin(angle) * 0.6;
          moveY = Math.cos(angle) * 0.6;
        }
      } else {
        // Collect closest exp gem if no enemy nearby
        let closestGem: ExpGem | null = null;
        let minGemDist = Infinity;
        for (const g of this.expGems) {
          const gd = Math.hypot(g.x - this.playerPos.x, g.y - this.playerPos.y);
          if (gd < minGemDist) {
            minGemDist = gd;
            closestGem = g;
          }
        }
        if (closestGem) {
          const ga = Math.atan2(closestGem.y - this.playerPos.y, closestGem.x - this.playerPos.x);
          moveX = Math.cos(ga);
          moveY = Math.sin(ga);
        }
      }
    } else {
      // Manual control
      if (this.keysHeld['w'] || this.keysHeld['arrowup']) moveY -= 1;
      if (this.keysHeld['s'] || this.keysHeld['arrowdown']) moveY += 1;
      if (this.keysHeld['a'] || this.keysHeld['arrowleft']) moveX -= 1;
      if (this.keysHeld['d'] || this.keysHeld['arrowright']) moveX += 1;

      // Pointer / touch drag support
      if (this.targetPointer.active) {
        const dx = this.targetPointer.x - this.playerPos.x;
        const dy = this.targetPointer.y - this.playerPos.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 20) {
          moveX = dx / dist;
          moveY = dy / dist;
        }
      }
    }

    // Normalize
    const mag = Math.hypot(moveX, moveY);
    if (mag > 0) {
      moveX /= mag;
      moveY /= mag;
      this.playerPos.vx = moveX * this.player.speed;
      this.playerPos.vy = moveY * this.player.speed;
    } else {
      this.playerPos.vx *= 0.8;
      this.playerPos.vy *= 0.8;
    }

    this.playerPos.x += this.playerPos.vx * dt;
    this.playerPos.y += this.playerPos.vy * dt;

    // Boundaries
    const pad = 24;
    this.playerPos.x = Math.max(pad, Math.min(this.width - pad, this.playerPos.x));
    this.playerPos.y = Math.max(pad, Math.min(this.height - pad, this.playerPos.y));

    // Facing angle towards nearest enemy or velocity
    const target = this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
    if (target) {
      this.playerPos.facing = Math.atan2(target.y - this.playerPos.y, target.x - this.playerPos.x);
    } else if (mag > 0) {
      this.playerPos.facing = Math.atan2(moveY, moveX);
    }
  }

  private updatePlayerCombat(dt: number) {
    if (this.attackTimer > 0) this.attackTimer -= dt;

    const target = this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
    if (!target) return;

    const dist = Math.hypot(target.x - this.playerPos.x, target.y - this.playerPos.y);

    // Auto-basic attack
    if (dist <= this.player.range && this.attackTimer <= 0) {
      this.performBasicAttack(target);
      this.attackTimer = 1 / Math.max(0.2, this.player.atkSpeed);
    }

    // Auto-cast skills if enabled
    if (this.autoCastSkills) {
      for (let i = 0; i < this.activeSkills.length; i++) {
        if (this.player.skillCDs[i] <= 0) {
          const sk = this.activeSkills[i];
          // Use skill if enemy is in range or if it's an aoe/buff
          if (sk.type === 'buff' || sk.type === 'ultimate' || dist <= this.player.range * 1.5) {
            this.useSkill(i, target);
          }
        }
      }
    }
  }

  public performBasicAttack(target: EnemyEntity) {
    let isCrit = Math.random() < this.player.critChance;
    let damage = this.player.atk * (isCrit ? this.player.critDmg : 1.0);

    // Varp Scythe stacking
    if (this.player.varpScytheStacks < 20 && this.acquiredAttributes.has('attr_varp_scythe')) {
      this.player.varpScytheStacks++;
      this.recalculateStats();
    }

    // Monkey Weapon passive
    if (this.heroKey === 'monkey' && this.acquiredAttributes.has('attr_monkey_wpn')) {
      this.monkeyHitCount++;
      if (this.monkeyHitCount >= 2) {
        this.monkeyHitCount = 0;
        this.player.monkeyWeaponActive = true;
        this.recalculateStats();
        setTimeout(() => {
          this.player.monkeyWeaponActive = false;
          this.recalculateStats();
        }, 2500);
      }
    }

    // Soul Puppeteer Passive: Soul Maker (forges +1 Soul per attack, Empowered Soul Bolt & Lich Scythe Barrage)
    if (this.heroKey === 'soul_puppeteer') {
      this.addSouls(1);
    }

    // Demonis Full Charger Demonis (FCD) Passive: Every 4 stacks = +1 FCD (max 30).
    if (this.heroKey === 'demonis') {
      this.addDemonisStacks(1);
    }

    // Rift Walker Passive: Quantum Blink Resonance (Every 4 hits, or 3 with Quantum Rift Shadow Core)
    if (this.heroKey === 'rift_walker') {
      this.player.riftBlinkCombo = (this.player.riftBlinkCombo || 0) + 1;
      const blinkReq = this.acquiredAttributes.has('attr_quantum_echo') ? 3 : 4;
      if (this.player.riftBlinkCombo >= blinkReq) {
        this.player.riftBlinkCombo = 0;
        const prevX = this.playerPos.x;
        const prevY = this.playerPos.y;
        const bAngle = Math.atan2(target.y - this.playerPos.y, target.x - this.playerPos.x);
        this.playerPos.x = Math.max(30, Math.min(this.width - 30, target.x - Math.cos(bAngle) * 36));
        this.playerPos.y = Math.max(30, Math.min(this.height - 30, target.y - Math.sin(bAngle) * 36));
        this.playerPos.facing = bAngle;

        this.createShockwave(prevX, prevY, '#06b6d4', 65);
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#22d3ee', 85);
        this.createLaserBeam(prevX, prevY, this.playerPos.x, this.playerPos.y, '#06b6d4', 7);
        sounds.playSkill('warp');

        const baseNoCrit = isCrit ? damage / this.player.critDmg : damage;
        damage = baseNoCrit * this.player.critDmg * 1.25;
        isCrit = true;

        const hpPctTrueDmg = Math.min(target.isBoss ? 250 : 400, Math.round(target.maxHp * 0.03));
        target.takeDamage(hpPctTrueDmg, false, 'true_damage', this);
        this.applyRiftMark(target);
        this.healPlayer(this.player.maxHp * 0.025);
        this.aegisShield = Math.min(350, Math.max(this.aegisShield + 35, 110));

        this.player.riftWarpBuffTimer = 2.0;
        this.onRiftWalkerBlink(this.playerPos.x, this.playerPos.y);
        if (this.acquiredAttributes.has('attr_quantum_echo')) {
          this.triggerRiftBlinkSlash(this.playerPos.x, this.playerPos.y);
        }
        this.activatePhantomPhase();
        this.recalculateStats();

        this.floatingTexts.push({
          x: this.playerPos.x,
          y: this.playerPos.y - 35,
          text: '⚡ QUANTUM BLINK!',
          color: '#22d3ee',
          fontSize: 18,
          life: 0.8,
          maxLife: 0.8,
          vy: -25
        });
      }
    } else if (this.acquiredAttributes.has('attr_quantum_echo')) {
      this.quantumEchoHits++;
      if (this.quantumEchoHits >= 5) {
        this.quantumEchoHits = 0;
        this.triggerRiftBlinkSlash(target.x, target.y);
      }
    }

    // Chronos Stance Pendulum (Every 4th basic attack triggers Chrono Paradox Pulse)
    if (this.acquiredAttributes.has('attr_chrono_pendulum')) {
      this.chronoPendulumHits++;
      if (this.chronoPendulumHits >= 4) {
        this.chronoPendulumHits = 0;
        this.triggerChronoParadoxPulse();
      }
    }

    // Phantom Phase Seal on-hit sustain while Warp/Phantom Phase active
    if (this.acquiredAttributes.has('attr_void_assassin_seal') && (this.phantomPhaseTimer > 0 || (this.player.riftWarpBuffTimer ?? 0) > 0)) {
      if (this.phantomHealCd <= 0) {
        this.phantomHealCd = 0.8;
        this.healPlayer(this.player.maxHp * 0.03);
      }
    }

    // Valkyrie Frost Passive: Permafrost Dominion & Frostbite Shiver
    if (this.heroKey === 'valkyrie') {
      if (target.frostSlowTimer > 0 || target.stunTimer > 0) {
        damage *= 1.20;
      }
      this.player.frostChillHits = (this.player.frostChillHits || 0) + 1;
      target.frostSlowTimer = Math.max(target.frostSlowTimer, 2.5);

      // On 3rd hit: Deep Freeze & Cryo Shatter
      if (this.player.frostChillHits >= 3) {
        this.player.frostChillHits = 0;
        target.stunTimer = Math.max(target.stunTimer, 1.8);
        this.createShockwave(target.x, target.y, '#38bdf8', 110);
        sounds.playSkill('void');

        const shatterDmg = this.player.atk * 1.60;
        target.takeDamage(shatterDmg, true, 'frost_shatter', this);

        // Permafrost Ice Shield generation (+110 HP, or +150 up to 1000 HP with Glacial Sovereign Crown)
        const hasCrown = this.acquiredAttributes.has('attr_permafrost_crown');
        const shieldGain = hasCrown ? 150 : 110;
        const shieldCap = hasCrown ? 1000 : 650;
        this.player.frostArmorShield = Math.min(shieldCap, (this.player.frostArmorShield || 0) + shieldGain);
        this.recalculateStats();

        // Fire 6 ice shards around target
        for (let s = 0; s < 6; s++) {
          const ang = (s * Math.PI * 2) / 6;
          this.projectiles.push(new ProjectileEntity(
            target.x, target.y,
            target.x + Math.cos(ang) * 240,
            target.y + Math.sin(ang) * 240,
            540,
            this.player.atk * 0.80,
            false,
            '#7dd3fc',
            'player'
          ));
        }

        if (this.acquiredAttributes.has('attr_cryo_bastion')) {
          this.triggerCryoLanceBurst(target.x, target.y);
        }

        this.floatingTexts.push({
          x: target.x,
          y: target.y - 30,
          text: '❄️ DEEP FREEZE & SHATTER!',
          color: '#38bdf8',
          fontSize: 16,
          life: 0.8,
          maxLife: 0.8,
          vy: -25
        });
      }
    }

    // Magic destruction passive
    if (this.player.magicDestroActive) {
      damage += (80 + this.player.atk * 0.8);
    }

    // Titan Giant Slayer (+35% damage vs bosses or higher maxHP enemies)
    if (this.acquiredAttributes.has('attr_giant_slayer') && (target.isBoss || target.maxHp > this.player.maxHp)) {
      damage *= 1.35;
    }

    // Blood Moon Crescent crit heal (3% Max HP)
    if (isCrit && this.acquiredAttributes.has('attr_blood_crescent')) {
      this.healPlayer(this.player.maxHp * 0.03);
    }

    // Executioner Guillotine Passive
    if (this.acquiredAttributes.has('attr_executioner_blade')) {
      if (target.hp / target.maxHp < 0.5) {
        damage *= 1.40;
      }
      if (target.hp / target.maxHp < 0.15 && !target.isBoss) {
        damage = target.hp + 999;
        this.addRelicFloatingText({
          x: target.x,
          y: target.y,
          text: '💀 GUILLOTINE EXECUTE!',
          color: '#ef4444',
          fontSize: 12,
          life: 0.85,
          maxLife: 0.85,
          vy: 16
        });
      }
    }

    // Toxic Spores Debuff
    if (this.acquiredAttributes.has('attr_toxic_spores')) {
      target.poisonTimer = 4.0;
      target.defense = Math.max(0, target.defense - 10);
    }

    // Chain Lightning Proc (35% chance to zap up to 4 targets)
    if (this.acquiredAttributes.has('attr_chain_lightning') && Math.random() < 0.35) {
      sounds.playSkill('thunder');
      let prevX = target.x;
      let prevY = target.y;
      let zaps = 0;
      const zapDmg = this.player.atk * 1.5;
      for (const e of this.enemies) {
        if (e !== target && Math.hypot(e.x - prevX, e.y - prevY) <= 220 && zaps < 4) {
          this.createLightningChain(prevX, prevY, e.x, e.y, '#38bdf8');
          e.takeDamage(zapDmg, false, 'lightning', this);
          prevX = e.x;
          prevY = e.y;
          zaps++;
        }
      }
    }

    // Abyssal Shatter Mark (melee or projectile impact handled consistently; melee applies immediately below, projectile applies on hit)
    if (this.player.range <= 110) {
      if (this.acquiredAttributes.has('attr_abyssal_mark')) {
        this.applyAbyssalMark(target);
      }
      if (this.acquiredAttributes.has('attr_doom_scythe')) {
        this.triggerDoomScytheCrit(target, isCrit);
      }
    }

    // Crimson Blood Pact (Every 5th basic attack)
    if (this.acquiredAttributes.has('attr_blood_pact')) {
      this.bloodPactHits++;
      if (this.bloodPactHits >= 5) {
        this.bloodPactHits = 0;
        this.triggerBloodPact(target);
      }
    }

    // Storm Ricochet Glaive (Every 3rd basic attack)
    if (this.acquiredAttributes.has('attr_ricochet_glaive')) {
      this.ricochetHits++;
      if (this.ricochetHits >= 3) {
        this.ricochetHits = 0;
        this.triggerRicochetGlaive(this.playerPos.x, this.playerPos.y, target);
      }
    }

    // Cursed Blight Brand (Every 4th basic attack triggers max-HP True Damage burst)
    if (this.acquiredAttributes.has('attr_anti_regen')) {
      this.blightHits++;
      if (this.blightHits >= 4) {
        this.blightHits = 0;
        this.triggerBlightBurst(target);
      }
    }

    // Solaris Ignis Passive: Solar Flare Ignition (+1 Solar Heat, Solar Flare explosion at 10+ stacks)
    if (this.heroKey === 'solaris') {
      this.addSolarHeat(1);
      if ((this.player.solarHeat || 0) >= 10) {
        const solarMult = this.acquiredAttributes.has('attr_solar_core') ? 1.40 : 1.0;
        const flareDmg = this.player.atk * 0.45 * solarMult;
        this.createShockwave(target.x, target.y, '#fb923c', 110);
        for (const e of this.enemies) {
          if (Math.hypot(e.x - target.x, e.y - target.y) <= 110) {
            e.takeDamage(flareDmg, false, 'true_damage', this);
          }
        }
      }
    } else if (this.acquiredAttributes.has('attr_solar_core')) {
      this.solarCoreHits++;
      if (this.solarCoreHits >= 3) {
        this.solarCoreHits = 0;
        const burnDmg = this.player.atk * 0.35 * 1.40;
        this.createShockwave(target.x, target.y, '#f97316', 115);
        for (const e of this.enemies) {
          if (Math.hypot(e.x - target.x, e.y - target.y) <= 115) {
            e.takeDamage(burnDmg, false, 'player', this);
          }
        }
      }
    }

    // Fallen Angel Passive: Fallen Feathers & every 3rd hit / Full Feathers Eclipse Daggers
    if (this.heroKey === 'fallen_angel') {
      this.addAngelFeathers(1);
      this.angelFeatherCombo++;
      const featherCap = this.acquiredAttributes.has('attr_eclipse_halo') ? 20 : 12;
      if (this.angelFeatherCombo >= 3 || (this.player.angelFeathers ?? 0) >= featherCap) {
        this.angelFeatherCombo = 0;
        this.healPlayer(this.player.maxHp * 0.02);
        const baseAng = Math.atan2(target.y - this.playerPos.y, target.x - this.playerPos.x);
        for (let k = -1; k <= 1; k++) {
          const ang = baseAng + k * 0.22;
          const daggerCrit = Math.random() < this.player.critChance;
          const daggerDmg = this.player.atk * 0.55 * (daggerCrit ? this.player.critDmg : 1.0);
          this.projectiles.push(new ProjectileEntity(
            this.playerPos.x,
            this.playerPos.y,
            this.playerPos.x + Math.cos(ang) * 380,
            this.playerPos.y + Math.sin(ang) * 380,
            660,
            daggerDmg,
            daggerCrit,
            '#e11d48',
            'player'
          ));
        }
      }
    }

    // Ash-Stained Pinion Relic: Eclipse Lightning Pillar when HP < 60%
    if (this.acquiredAttributes.has('attr_abyssal_pinion') && (this.player.hp / this.player.maxHp < 0.60)) {
      this.triggerEclipsePinionBolt(target.x, target.y);
    }

    // Demon Raised Passive: Hellfire Essence & Hellfire Cleave
    if (this.heroKey === 'demon_raised') {
      this.addDemonEssence(1);
      const hellfireMult = this.acquiredAttributes.has('attr_hellfire_crown') ? 1.35 : 1.0;
      if ((this.player.demonEssence ?? 0) >= 10 || (this.player.hp / this.player.maxHp < 0.50)) {
        const cleaveDmg = this.player.atk * 0.50 * hellfireMult;
        this.createShockwave(target.x, target.y, '#e11d48', 115);
        for (const e of this.enemies) {
          if (e.hp > 0 && Math.hypot(e.x - target.x, e.y - target.y) <= 115) {
            e.takeDamage(cleaveDmg, false, 'true_damage', this);
          }
        }
      }
    } else if (this.acquiredAttributes.has('attr_hellfire_crown')) {
      this.hellfireCoreHits++;
      if (this.hellfireCoreHits >= 4) {
        this.hellfireCoreHits = 0;
        const eruptDmg = this.player.atk * 1.25 * 1.35;
        this.createShockwave(target.x, target.y, '#e11d48', 125);
        for (const e of this.enemies) {
          if (e.hp > 0 && Math.hypot(e.x - target.x, e.y - target.y) <= 125) {
            e.takeDamage(eruptDmg, false, 'true_damage', this);
          }
        }
      }
    }

    // Crimson Vortex Fang (Every 6 basic attacks: 180% ATK AoE slash)
    if (this.acquiredAttributes.has('attr_crimson_vortex')) {
      this.crimsonVortexHits++;
      if (this.crimsonVortexHits >= 6) {
        this.crimsonVortexHits = 0;
        const vortexDmg = this.player.atk * 1.80;
        this.createShockwave(target.x, target.y, '#ef4444', 140);
        sounds.playSkill('slash');
        for (const e of this.enemies) {
          if (Math.hypot(e.x - target.x, e.y - target.y) <= 140) {
            e.takeDamage(vortexDmg, true, 'player', this);
          }
        }
      }
    }

    // Omega Star Annihilator (Every 8 basic attacks: 280% AoE True Damage + 1.0s stun)
    if (this.acquiredAttributes.has('attr_omega_annihilator')) {
      this.omegaAnnihilatorHits++;
      if (this.omegaAnnihilatorHits >= 8) {
        this.omegaAnnihilatorHits = 0;
        const omegaDmg = this.player.atk * 2.80;
        this.createShockwave(target.x, target.y, '#f472b6', 165);
        this.createShockwave(target.x, target.y, '#facc15', 110);
        sounds.playExplosion();
        this.cameraShake = 9;
        for (const e of this.enemies) {
          if (Math.hypot(e.x - target.x, e.y - target.y) <= 165) {
            e.takeDamage(omegaDmg, true, 'true_damage', this);
            e.stunTimer = Math.max(e.stunTimer, 1.0);
          }
        }
        this.addRelicFloatingText({
          x: target.x,
          y: target.y,
          text: '💥 OMEGA STARBURST!',
          color: '#facc15',
          fontSize: 12,
          life: 0.85,
          maxLife: 0.85,
          vy: 16
        });
      }
    }

    // Tempest Volt Quiver: extra 55% ATK lightning arrow on every basic attack
    if (this.acquiredAttributes.has('attr_storm_quiver')) {
      const boltTarget = this.enemies.find(e => e !== target && Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= this.player.range + 140) || target;
      this.projectiles.push(new ProjectileEntity(
        this.playerPos.x,
        this.playerPos.y,
        boltTarget.x,
        boltTarget.y,
        640,
        this.player.atk * 0.55,
        false,
        '#38bdf8',
        'player'
      ));
    }

    // Hitstop & Camera shake on heavy hit
    if (isCrit) {
      this.hitstopTimer = 0.05;
      this.cameraShake = 6;
      if (damage > this.highestCrit) this.highestCrit = damage;
      if (this.acquiredAttributes.has('attr_void_lens')) {
        this.healPlayer(20);
      }
    }

    // Attack trajectory / projectile vs melee (Solaris Spear, Demon Raised Claws & Traveler Sword Stance are melee)
    const isTravelerSword = this.heroKey === 'traveler' && this.player.travelerStance === 'sword';
    if (this.player.range > 110 && this.heroKey !== 'solaris' && this.heroKey !== 'demon_raised' && !isTravelerSword) {
      // Ranged projectile
      const projColor = this.heroKey === 'soul_puppeteer' && (this.player.lichTransformTimer ?? 0) > 0
        ? '#fbbf24'
        : this.heroKey === 'traveler' && this.player.travelerStance === 'staff'
        ? '#67e8f9'
        : this.heroConfig.color;
      const numProjectiles = this.heroKey === 'demonis'
        ? Math.min(30, 1 + (this.player.demonisFCD || 0))
        : (this.heroKey === 'soul_puppeteer' && (this.player.lichTransformTimer ?? 0) > 0 ? 3 : 1);

      if (numProjectiles <= 1) {
        this.projectiles.push(new ProjectileEntity(
          this.playerPos.x,
          this.playerPos.y,
          target.x,
          target.y,
          550,
          damage,
          isCrit,
          projColor,
          'player'
        ));

        // Traveler Bow Stance: fires Twin Chrono Arrow (55% ATK, can Crit)
        if (this.heroKey === 'traveler' && this.player.travelerStance === 'bow') {
          const secondTarget = this.enemies.find(e => e !== target && e.hp > 0 && Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= this.player.range + 90) || target;
          const twinAngle = Math.atan2(secondTarget.y - this.playerPos.y, secondTarget.x - this.playerPos.x) + (secondTarget === target ? 0.14 : 0);
          const twinCrit = Math.random() < this.player.critChance;
          const twinDmg = this.player.atk * 0.55 * (twinCrit ? this.player.critDmg : 1.0);
          this.projectiles.push(new ProjectileEntity(
            this.playerPos.x,
            this.playerPos.y,
            this.playerPos.x + Math.cos(twinAngle) * 320,
            this.playerPos.y + Math.sin(twinAngle) * 320,
            640,
            twinDmg,
            twinCrit,
            '#38bdf8',
            'player'
          ));
        }
      } else if (this.heroKey === 'soul_puppeteer') {
        // Lich Form 3-way Soul Scythe Wave (side scythes deal 45% damage)
        const baseAngle = Math.atan2(target.y - this.playerPos.y, target.x - this.playerPos.x);
        for (let k = -1; k <= 1; k++) {
          const angle = baseAngle + k * 0.20;
          const targetX = this.playerPos.x + Math.cos(angle) * 380;
          const targetY = this.playerPos.y + Math.sin(angle) * 380;
          const boltDamage = k === 0 ? damage : damage * 0.45;
          this.projectiles.push(new ProjectileEntity(
            this.playerPos.x,
            this.playerPos.y,
            targetX,
            targetY,
            620,
            boltDamage,
            isCrit,
            projColor,
            'player'
          ));
        }
      } else {
        // Primary projectile aimed directly at target (full damage + crit)
        this.projectiles.push(new ProjectileEntity(
          this.playerPos.x,
          this.playerPos.y,
          target.x,
          target.y,
          550,
          damage,
          isCrit,
          projColor,
          'player'
        ));

        // Additional FCD curved single-target projectiles for Demonis (up to 30 total projectiles, 12% ATK, can Crit)
        const extraCount = numProjectiles - 1;
        const extraDmg = this.player.atk * 0.12;
        for (let p = 0; p < extraCount; p++) {
          const side = p % 2 === 0 ? 1 : -1;
          const tier = Math.floor(p / 2) + 1;
          const curveOffset = side * Math.min(165, 44 + tier * 14);
          const extraIsCrit = Math.random() < this.player.critChance;
          const finalExtraDmg = extraIsCrit ? extraDmg * this.player.critDmg : extraDmg;

          this.projectiles.push(new ProjectileEntity(
            this.playerPos.x,
            this.playerPos.y,
            target.x,
            target.y,
            620,
            finalExtraDmg,
            extraIsCrit,
            extraIsCrit ? '#e879f9' : '#c084fc',
            'player',
            { homingTarget: target, curveOffset }
          ));
        }
      }
    } else {
      // Melee / Spear / Traveler Sword swing
      target.takeDamage(damage, isCrit, 'player', this);
      if (isTravelerSword) {
        // Dimensional Arc Cleave: hits surrounding melee enemies for 65% ATK (can Crit)
        this.createShockwave(target.x, target.y, '#22d3ee', 85);
        for (const near of this.enemies) {
          if (near !== target && near.hp > 0 && Math.hypot(near.x - this.playerPos.x, near.y - this.playerPos.y) <= 135) {
            const arcCrit = Math.random() < this.player.critChance;
            const arcDmg = this.player.atk * 0.65 * (arcCrit ? this.player.critDmg : 1.0);
            near.takeDamage(arcDmg, arcCrit, 'player', this);
          }
        }
      }
      if (this.venomFangStacks > 0) {
        target.neurotoxinTimer = 3.0;
      }
      if (this.heroKey === 'monkey') {
        const critChanceTrueDmg = Math.min(100, Math.max(0, Math.round(this.player.critChance * 100)) * 5);
        if (critChanceTrueDmg > 0) {
          target.takeDamage(critChanceTrueDmg, false, 'true_damage', this);
        }
        this.monkeyComboHits++;
        if (this.monkeyComboHits >= 4) {
          this.monkeyComboHits = 0;
          this.player.monkeyComboHits = 0;
          this.triggerMonkeyJinguSweep(target);
        } else {
          this.player.monkeyComboHits = this.monkeyComboHits;
        }
      }
      this.createSlashEffect(this.playerPos.x, this.playerPos.y, target.x, target.y, this.heroConfig.color);
      if (this.heroKey === 'solaris') {
        this.createLaserBeam(this.playerPos.x, this.playerPos.y, target.x, target.y, '#fb923c', 5);
      }

      // Glacial Frost Orb on-hit freeze & ice burst
      if (this.acquiredAttributes.has('attr_frost_orb') && Math.random() < 0.30) {
        target.stunTimer = Math.max(target.stunTimer, 1.2);
        target.frostSlowTimer = Math.max(target.frostSlowTimer, 2.0);
        target.takeDamage(this.player.atk * 0.8, false, 'player', this);
        this.createShockwave(target.x, target.y, '#38bdf8', 55);
        if (this.acquiredAttributes.has('attr_cryo_bastion') && this.cryoBastionCd <= 0) {
          this.cryoBastionCd = 1.0;
          this.triggerCryoLanceBurst(target.x, target.y);
        }
      }

      // Aether Temporal Compass (+25% True Damage inside Chrono Field / Time Stop)
      if (this.acquiredAttributes.has('attr_temporal_compass') && (this.player.travelerFieldTimer > 0 || this.player.isTimeStopActive)) {
        target.takeDamage(damage * 0.25, false, 'true_damage', this);
      }

      // Void Armor Piercer (+30% True Damage)
      if (this.acquiredAttributes.has('attr_void_piercer')) {
        target.takeDamage(damage * 0.30, false, 'true_damage', this);
      }

      // Phantom Echo Blade (35% Double Strike at 75% dmg)
      if (this.acquiredAttributes.has('attr_echo_blade') && Math.random() < 0.35) {
        target.takeDamage(damage * 0.75, false, 'player', this);
        this.createSlashEffect(this.playerPos.x, this.playerPos.y, target.x, target.y, '#c084fc');
      }
    }

    // Lifesteal
    if (this.player.lifesteal > 0) {
      this.healPlayer(damage * this.player.lifesteal);
    }

    // Burst True Crit
    if (isCrit && this.player.burstCritActive) {
      const trueDmg = target.maxHp * 0.06;
      target.takeDamage(trueDmg, false, 'true_damage', this);
    }

    sounds.playHit(isCrit);
  }

  public useSkill(slotIndex: number, target: EnemyEntity | null) {
    const sk = this.activeSkills[slotIndex];
    if (!sk) return;

    // Set cooldown with CDR
    const actualCd = Math.max(1.0, sk.cd * (1 - this.player.cdr));
    this.player.skillCDs[slotIndex] = actualCd;
    this.player.skillMaxCDs[slotIndex] = actualCd;

    // Traveler Chrono Haste Passive: cuts all other skill CDs by 0.5s & Chrono Blade Echo inside Field/TimeStop
    if (this.heroKey === 'traveler') {
      for (let i = 0; i < this.activeSkills.length; i++) {
        if (i !== slotIndex && this.player.skillCDs[i] > 0) {
          this.player.skillCDs[i] = Math.max(0, this.player.skillCDs[i] - 0.5);
        }
      }
      if (this.player.travelerFieldTimer > 0 || this.player.isTimeStopActive) {
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#67e8f9', 155);
        for (const e of this.enemies) {
          if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 155) {
            e.takeDamage(this.player.atk * 0.85, false, 'true_damage', this);
          }
        }
      }
    }

    // Arcane Mana Dynamo: Heal 6% Max HP on every skill cast (Master & Clones)
    if (this.acquiredAttributes.has('attr_arcane_battery')) {
      this.healPlayer(this.player.maxHp * 0.06);
      for (const c of this.clones) {
        if (c.hp > 0) c.hp = Math.min(c.maxHp, c.hp + c.maxHp * 0.06);
      }
    }

    // Astral Shockwave Core: AoE pulse on every skill cast (Master & Clones)
    if (this.acquiredAttributes.has('attr_nova_pulse')) {
      const novaRadius = 180;
      const novaDmg = this.player.atk * 1.6;
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#a855f7', novaRadius);
      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= novaRadius) {
          e.takeDamage(novaDmg, false, 'player', this);
        }
      }
      for (const c of this.clones) {
        if (c.hp > 0) {
          this.createShockwave(c.x, c.y, '#a855f7', 150);
          for (const e of this.enemies) {
            if (Math.hypot(e.x - c.x, e.y - c.y) <= 150) {
              e.takeDamage(novaDmg, false, 'clone', this);
            }
          }
        }
      }
    }

    // Aether Temporal Compass: Time Echo (+35% ASPD for 3s) on every skill cast
    if (this.acquiredAttributes.has('attr_temporal_compass')) {
      this.temporalCompassTimer = 3.0;
      this.recalculateStats();
    }

    // Void Singularity Tether: Every 2 skills cast spawns a Mini Spatial Collapse
    if (this.acquiredAttributes.has('attr_singularity_prism')) {
      this.singularitySkillCount++;
      if (this.singularitySkillCount >= 2) {
        this.singularitySkillCount = 0;
        const focus = target || this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
        const sx = focus ? focus.x : this.playerPos.x + Math.cos(this.playerPos.facing) * 140;
        const sy = focus ? focus.y : this.playerPos.y + Math.sin(this.playerPos.facing) * 140;
        this.addPlayerSpatialZone({
          x: sx,
          y: sy,
          radius: 150,
          duration: 1.8,
          maxDuration: 1.8,
          type: 'judge_collapse',
          color: '#a78bfa',
          pulseAngle: 0,
          owner: 'player'
        });
      }
    }

    // Blazing Ember Greaves: Heal 5% Max HP + 120% ATK fire ring on every skill cast
    if (this.acquiredAttributes.has('attr_ember_greaves')) {
      this.healPlayer(this.player.maxHp * 0.05);
      const fireRadius = 155;
      const fireDmg = this.player.atk * 1.20;
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#f97316', fireRadius);
      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= fireRadius) {
          e.takeDamage(fireDmg, false, 'player', this);
        }
      }
    }

    // Obsidian Seraph Halo: emits 6 Judgement Feathers on every Skill cast
    if (this.acquiredAttributes.has('attr_eclipse_halo')) {
      const featherFocus = target || this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
      const baseAng = featherFocus
        ? Math.atan2(featherFocus.y - this.playerPos.y, featherFocus.x - this.playerPos.x)
        : this.playerPos.facing;
      for (let i = 0; i < 6; i++) {
        const ang = baseAng + (i - 2.5) * 0.24;
        const fCrit = Math.random() < this.player.critChance;
        const fDmg = this.player.atk * 0.95 * (fCrit ? this.player.critDmg : 1.0);
        this.projectiles.push(new ProjectileEntity(
          this.playerPos.x,
          this.playerPos.y,
          this.playerPos.x + Math.cos(ang) * 420,
          this.playerPos.y + Math.sin(ang) * 420,
          650,
          fDmg,
          fCrit,
          '#c084fc',
          'player'
        ));
      }
    }

    // Abyssal Pact Chains: Blood Chain explosion + 0.8s stun on every Skill cast
    if (this.acquiredAttributes.has('attr_infernal_shackles')) {
      const chainRadius = 175;
      const chainDmg = this.player.atk * 1.45;
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#e11d48', chainRadius);
      for (const e of this.enemies) {
        if (e.hp > 0 && Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= chainRadius) {
          e.takeDamage(chainDmg, false, 'player', this);
          e.stunTimer = Math.max(e.stunTimer, 0.8);
        }
      }
    }

    // Arcane Catalyst Rune: +20% ATK for 3.5s on every skill cast
    if (this.acquiredAttributes.has('attr_arcane_catalyst')) {
      this.arcaneCatalystTimer = 3.5;
      this.recalculateStats();
    }

    sounds.playSkill(sk.id);

    // --- Monkey Skills ---
    if (sk.id === 'm_s1') {
      // Clone
      const numClones = this.unlockedTraits.has('m_s1_u1') ? 2 : 1;
      for (let c = 0; c < numClones; c++) {
        const offset = (c + 1) * 35;
        this.clones.push(new CloneEntity(this.playerPos.x + offset, this.playerPos.y + offset, this));
      }
      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 30,
        text: 'SHADOW CLONE!',
        color: '#f59e0b',
        fontSize: 18,
        life: 0.8,
        maxLife: 0.8,
        vy: -25
      });
    } else if (sk.id === 'm_s2') {
      // RuYi: Heavenly Staff Slam (Nerfed to keep focus on Monkey King's passives)
      const isExpanded = this.unlockedTraits.has('m_s2_u1');
      const isArmorBreak = this.unlockedTraits.has('m_s2_u2');
      const slamDmg = this.player.atk * (isExpanded ? 2.2 : 1.65);
      const slamRange = isExpanded ? 280 : 200;
      const slamWidth = isExpanded ? 36 : 26;

      const angle = this.playerPos.facing;
      const endX = this.playerPos.x + Math.cos(angle) * slamRange;
      const endY = this.playerPos.y + Math.sin(angle) * slamRange;

      // Staff Slam Visual Beam & Ground Quake Line
      this.createLaserBeam(this.playerPos.x, this.playerPos.y, endX, endY, '#f59e0b', slamWidth);
      this.createShockwave(endX, endY, '#b45309', isExpanded ? 150 : 110);
      sounds.playExplosion();
      this.cameraShake = 8;
      this.hitstopTimer = 0.05;

      // Player Staff Hitbox
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - endX, e.y - endY);
        const lineDist = Math.abs((endY - this.playerPos.y) * e.x - (endX - this.playerPos.x) * e.y + endX * this.playerPos.y - endY * this.playerPos.x) / slamRange;
        if (d <= (isExpanded ? 150 : 110) || (lineDist <= slamWidth && Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= slamRange)) {
          let totalSlamDmg = slamDmg;
          if (e.corruptedShield > 0) {
            const barrierBonus = 50 + (e.corruptedShield * 0.05 + e.maxHp * 0.015);
            totalSlamDmg += barrierBonus;
            this.floatingTexts.push({
              x: e.x,
              y: e.y - 38,
              text: `💥 BARRIER SHATTER +${Math.round(barrierBonus)}!`,
              color: '#fbbf24',
              fontSize: 15,
              life: 0.85,
              maxLife: 0.85,
              vy: -28
            });
          }
          e.takeDamage(totalSlamDmg, true, 'player', this);
          e.stunTimer = Math.max(e.stunTimer, 0.8);
          if (isArmorBreak) {
            e.defense = Math.max(0, e.defense * 0.8);
          }
        }
      }

      // Synchronized Clone Staff Slam! (inherits 50% base, max 75% stats)
      const cloneStatRatio = this.unlockedTraits.has('m_s1_u1') ? 0.75 : 0.50;
      for (const c of this.clones) {
        if (c.hp > 0) {
          const cTarget = this.getClosestEnemy(c.x, c.y);
          const cAng = cTarget ? Math.atan2(cTarget.y - c.y, cTarget.x - c.x) : angle;
          const cEndX = c.x + Math.cos(cAng) * (slamRange * 0.65);
          const cEndY = c.y + Math.sin(cAng) * (slamRange * 0.65);
          this.createLaserBeam(c.x, c.y, cEndX, cEndY, '#f59e0b', 18);
          this.createShockwave(cEndX, cEndY, '#f59e0b', 65);
          if (cTarget && Math.hypot(cTarget.x - cEndX, cTarget.y - cEndY) <= 85) {
            let cloneSlamDmg = slamDmg * cloneStatRatio;
            if (cTarget.corruptedShield > 0) {
              cloneSlamDmg += (50 + (cTarget.corruptedShield * 0.05 + cTarget.maxHp * 0.015)) * cloneStatRatio;
            }
            cTarget.takeDamage(cloneSlamDmg, true, 'player', this);
            cTarget.stunTimer = Math.max(cTarget.stunTimer, 0.6);
          }
        }
      }

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 35,
        text: '🔱 RUYI STAFF SLAM!',
        color: '#f59e0b',
        fontSize: 18,
        life: 0.9,
        maxLife: 0.9,
        vy: -28
      });
    } else if (sk.id === 'm_s3') {
      // Somersault Cloud: Gale Cyclone (Nerfed utility mobility skill)
      const isCyclonePull = this.unlockedTraits.has('m_s3_u1');
      const isGoldenBody = this.unlockedTraits.has('m_s3_u2');
      const duration = isCyclonePull ? 1.2 : 0.8;

      this.player.isInvulnerable = true;
      setTimeout(() => { this.player.isInvulnerable = false; }, duration * 1000);

      if (isGoldenBody) {
        this.aegisShield = Math.max(this.aegisShield, 220);
      }

      sounds.playSkill('dash');
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#f59e0b', 115);

      // Dash forward with cloud
      const angle = this.playerPos.facing;
      const dashDist = 190;
      const oldX = this.playerPos.x;
      const oldY = this.playerPos.y;
      this.playerPos.x += Math.cos(angle) * dashDist;
      this.playerPos.y += Math.sin(angle) * dashDist;
      this.playerPos.x = Math.max(40, Math.min(this.width - 40, this.playerPos.x));
      this.playerPos.y = Math.max(40, Math.min(this.height - 40, this.playerPos.y));

      this.createLaserBeam(oldX, oldY, this.playerPos.x, this.playerPos.y, '#fef08a', 20);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#f59e0b', 150);

      const cycloneDmg = this.player.atk * 1.15;
      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 165) {
          e.takeDamage(cycloneDmg, true, 'player', this);
          e.speed *= 0.6;
          setTimeout(() => { if (e) e.speed = Math.min(e.speed / 0.6, 200); }, 1200);
          if (isCyclonePull) {
            e.x = (e.x + this.playerPos.x) / 2;
            e.y = (e.y + this.playerPos.y) / 2;
          }
        }
      }

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 35,
        text: '☁️ SOMERSAULT CYCLONE!',
        color: '#fef08a',
        fontSize: 18,
        life: 0.9,
        maxLife: 0.9,
        vy: -28
      });
    } else if (sk.id === 'm_s4') {
      // Havoc in Heaven: Colossus Pillar (Nerfed active burst, keeps brief Overdrive synergy)
      const isUnlimited = this.unlockedTraits.has('m_s4_u1');
      const isImmortality = this.unlockedTraits.has('m_s4_u2');
      const boltsCount = isUnlimited ? 8 : 5;
      const quakeRadius = isUnlimited ? Math.max(this.width, this.height) : 250;
      const divineDmg = this.player.atk * 1.5;

      this.cameraShake = 14;
      this.hitstopTimer = 0.08;
      sounds.playBossAlert();
      sounds.playExplosion();

      // Celestial Pillar Impact at player
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#f59e0b', quakeRadius);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#dc2626', quakeRadius * 0.7);

      // Overdrive Rage on Master and all clones
      this.player.rageTimer = 6.5;
      this.player.monkeyHavocTimer = 6.5;
      this.recalculateStats();

      if (isImmortality) {
        this.healPlayer(this.player.maxHp * 0.25);
        for (const c of this.clones) {
          c.lifeTimer = 16;
          c.hp = c.maxHp;
        }
      }

      // Golden Lightning strikes on enemies
      for (let b = 0; b < boltsCount && b < this.enemies.length; b++) {
        const e = this.enemies[b];
        this.createLightningChain(this.playerPos.x, this.playerPos.y - 120, e.x, e.y, '#fbbf24');
        e.takeDamage(divineDmg, true, 'true_damage', this);
        e.stunTimer = Math.max(e.stunTimer, 0.9);
      }

      // Quake Damage to entities in radius
      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= quakeRadius) {
          e.takeDamage(divineDmg * 0.45, true, 'player', this);
          e.stunTimer = Math.max(e.stunTimer, 0.8);
        }
      }

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 45,
        text: '👑 HAVOC IN HEAVEN: PILLAR!',
        color: '#fbbf24',
        fontSize: 21,
        life: 1.4,
        maxLife: 1.4,
        vy: -32
      });
    }

    // --- Demonis Skills (Revamped 3-Skill Kit) ---
    else if (sk.id === 'd_s1') {
      // Void Obliteration Beam (scales with FCD, +2 Stacks, Execute / Boss True Damage)
      if (this.unlockedTraits.has('d_s1_u2')) {
        const rapidCd = Math.max(1.0, 2.2 * (1 - this.player.cdr));
        this.player.skillCDs[slotIndex] = rapidCd;
        this.player.skillMaxCDs[slotIndex] = rapidCd;
      }
      this.addDemonisStacks(2);

      const aimTarget = target || { x: this.playerPos.x + Math.cos(this.playerPos.facing) * 300, y: this.playerPos.y + Math.sin(this.playerPos.facing) * 300 };
      const angle = Math.atan2(aimTarget.y - this.playerPos.y, aimTarget.x - this.playerPos.x);
      const beamLength = 820;
      const beamEnd = {
        x: this.playerPos.x + Math.cos(angle) * beamLength,
        y: this.playerPos.y + Math.sin(angle) * beamLength
      };
      const isHyperion = this.unlockedTraits.has('d_s1_u1');
      const guaranteedCrit = this.unlockedTraits.has('d_s1_u2');
      const laserWidth = isHyperion ? 68 : 40;
      const execThreshold = isHyperion ? 0.35 : 0.25;
      const fcd = this.player.demonisFCD || 0;
      const beamMult = 3.20 + fcd * 0.08;

      this.createLaserBeam(this.playerPos.x, this.playerPos.y, beamEnd.x, beamEnd.y, '#a855f7', laserWidth);
      this.createLaserBeam(this.playerPos.x, this.playerPos.y, beamEnd.x, beamEnd.y, '#f0abfc', Math.round(laserWidth * 0.45));
      this.cameraShake = 8;

      for (const e of this.enemies) {
        const d = this.distanceToSegment({ x: e.x, y: e.y }, this.playerPos, beamEnd);
        if (d < e.radius + laserWidth / 2) {
          if (!e.isBoss && e.hp / e.maxHp <= execThreshold) {
            e.takeDamage(e.hp + 9999, true, 'true_damage', this);
            this.floatingTexts.push({
              x: e.x,
              y: e.y - 25,
              text: '💀 VOID EXECUTED!',
              color: '#f43f5e',
              fontSize: 19,
              life: 0.85,
              maxLife: 0.85,
              vy: -30
            });
          } else {
            const beamCrit = guaranteedCrit || Math.random() < this.player.critChance;
            const beamDmg = this.player.atk * beamMult * (beamCrit ? this.player.critDmg : 1.0);
            e.takeDamage(beamDmg, beamCrit, 'player', this);
            if (e.isBoss && e.hp / e.maxHp <= 0.30) {
              e.takeDamage(this.player.atk * 1.20, false, 'true_damage', this);
            }
          }
        }
      }

      if (isHyperion) {
        for (let b = 1; b <= 3; b++) {
          const bx = this.playerPos.x + Math.cos(angle) * (b * 175);
          const by = this.playerPos.y + Math.sin(angle) * (b * 175);
          this.createShockwave(bx, by, '#d946ef', 110);
          for (const e of this.enemies) {
            if (Math.hypot(e.x - bx, e.y - by) <= 110) {
              e.takeDamage(this.player.atk * 1.0, false, 'true_damage', this);
            }
          }
        }
      }
    } else if (sk.id === 'd_s2') {
      // Abyssal Shadow Waltz: Dash + Void Singularity explosion + Shadow Veil + Soul Drain
      const originX = this.playerPos.x;
      const originY = this.playerPos.y;
      const nearest = target || this.getClosestEnemy(originX, originY);
      const dashAngle = nearest
        ? Math.atan2(originY - nearest.y, originX - nearest.x)
        : this.playerPos.facing;
      const dashDist = 135;
      this.playerPos.x = Math.max(32, Math.min(this.width - 32, originX + Math.cos(dashAngle) * dashDist));
      this.playerPos.y = Math.max(32, Math.min(this.height - 32, originY + Math.sin(dashAngle) * dashDist));

      this.createLaserBeam(originX, originY, this.playerPos.x, this.playerPos.y, '#c084fc', 12);
      this.createShockwave(originX, originY, '#a855f7', 160);
      sounds.playSkill('warp');

      for (const e of this.enemies) {
        const dist = Math.hypot(e.x - originX, e.y - originY);
        if (dist <= 160) {
          e.takeDamage(this.player.atk * 1.80, true, 'true_damage', this);
          if (dist > 24) {
            const pullAng = Math.atan2(originY - e.y, originX - e.x);
            e.x += Math.cos(pullAng) * Math.min(55, dist - 20);
            e.y += Math.sin(pullAng) * Math.min(55, dist - 20);
          }
        }
      }

      const dur = this.unlockedTraits.has('d_s2_u1') ? 3.5 : 2.5;
      this.player.swiftTimer = dur;
      this.demonisDrainTimer = 0.25;
      this.demonisBarrageTimer = 0.20;
      if (this.unlockedTraits.has('d_s2_u1')) {
        this.aegisShield = Math.min(800, this.aegisShield + 280);
      }
      this.recalculateStats();

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 32,
        text: this.unlockedTraits.has('d_s2_u1') ? '🌑 SHADOW WALTZ (+280 SHIELD)' : '🌑 ABYSSAL SHADOW VEIL!',
        color: '#e879f9',
        fontSize: 17,
        life: 1.0,
        maxLife: 1.0,
        vy: -26
      });
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#7e22ce', 110);
    } else if (sk.id === 'd_s3') {
      // Cataclysm Void Eclipse: Targeted 260px Void Eclipse, crowd pull, stun, FCD-scaling True Damage, +1 FCD
      this.addDemonisStacks(4); // +1 FCD immediately
      this.cameraShake = 11;
      this.hitstopTimer = 0.06;
      sounds.playExplosion();

      const fcd = this.player.demonisFCD || 0;
      const trueMult = 0.20 + fcd * 0.035;
      const hasRupture = this.unlockedTraits.has('d_s3_u1');
      const hasSoulHarvest = this.unlockedTraits.has('d_s3_u2');
      const eclipseCenter = target || this.getClosestEnemy(this.playerPos.x, this.playerPos.y) || { x: this.playerPos.x, y: this.playerPos.y };
      const eclipseRadius = 260;

      this.createShockwave(eclipseCenter.x, eclipseCenter.y, '#9333ea', eclipseRadius);
      this.createShockwave(eclipseCenter.x, eclipseCenter.y, '#e879f9', 140);

      let cataclysmKills = 0;
      for (const e of this.enemies) {
        if (Math.hypot(e.x - eclipseCenter.x, e.y - eclipseCenter.y) > eclipseRadius + e.radius) {
          continue;
        }
        this.createLightningChain(this.playerPos.x, this.playerPos.y, e.x, e.y, '#c084fc');
        this.createShockwave(e.x, e.y, '#9333ea', 60);
        e.x += (eclipseCenter.x - e.x) * 0.25;
        e.y += (eclipseCenter.y - e.y) * 0.25;

        if (hasRupture) {
          e.defense = Math.round(e.defense * 0.70);
        }

        const cCrit = Math.random() < this.player.critChance;
        const critMod = cCrit ? this.player.critDmg : 1.0;
        e.takeDamage(this.player.atk * 1.55 * critMod, cCrit, 'player', this);
        e.takeDamage(this.player.atk * trueMult, false, 'true_damage', this);
        if (hasRupture && e.isBoss) {
          e.takeDamage(this.player.atk * 1.20, false, 'true_damage', this);
        }
        e.stunTimer = Math.max(e.stunTimer, 1.0);

        if (e.hp <= 0) {
          cataclysmKills++;
        }
      }

      if (cataclysmKills > 0) {
        this.healPlayer(this.player.maxHp * Math.min(0.12, cataclysmKills * 0.02));
        if (hasSoulHarvest) {
          const cdCut = Math.min(3.0, cataclysmKills * 0.6);
          for (let i = 0; i < this.player.skillCDs.length; i++) {
            if (this.player.skillCDs[i] > 0) {
              this.player.skillCDs[i] = Math.max(0, this.player.skillCDs[i] - cdCut);
            }
          }
          this.addDemonisStacks(Math.min(3, cataclysmKills) * 4);
        }
      }

      this.floatingTexts.push({
        x: eclipseCenter.x,
        y: eclipseCenter.y - 45,
        text: '🌑 CATACLYSM VOID ECLIPSE!',
        color: '#c084fc',
        fontSize: 21,
        life: 1.2,
        maxLife: 1.2,
        vy: -32
      });
    }

    // --- Traveler Skills (Revamped Chronos Stance Sovereign) ---
    else if (sk.id === 't_s1_revamp') {
      // Chrono Dimension Nova (True Damage AoE that can Crit, pulls enemies, grants 160 Chrono Shield)
      const isVortex = this.unlockedTraits.has('t_s1_u1');
      const applyFracture = this.unlockedTraits.has('t_s1_u2');
      const radius = isVortex ? 250 : 185;
      const pullRatio = isVortex ? 0.34 : 0.18;

      this.aegisShield = Math.min(800, this.aegisShield + 160);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#06b6d4', radius);
      sounds.playSkill('void');

      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= radius) {
          const novaCrit = Math.random() < this.player.critChance;
          const novaDmg = this.player.atk * 2.80 * (novaCrit ? this.player.critDmg : 1.0);
          e.takeDamage(novaDmg, novaCrit, 'true_damage', this);
          e.x += (this.playerPos.x - e.x) * pullRatio;
          e.y += (this.playerPos.y - e.y) * pullRatio;
          if (applyFracture) {
            e.defense = Math.round(e.defense * 0.65);
            e.stunTimer = Math.max(e.stunTimer, 1.2);
          }
        }
      }

      if (isVortex) {
        setTimeout(() => {
          this.createShockwave(this.playerPos.x, this.playerPos.y, '#38bdf8', radius);
          for (const e of this.enemies) {
            if (e.hp > 0 && Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= radius) {
              const p2Crit = Math.random() < this.player.critChance;
              e.takeDamage(this.player.atk * 1.40 * (p2Crit ? this.player.critDmg : 1.0), p2Crit, 'true_damage', this);
            }
          }
        }, 180);
      }
    } else if (sk.id === 't_s2') {
      // Tri-Stance Phantom Slash (Stance-adaptive guaranteed Crit combo)
      const primary = target || this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
      const hasMirage = this.unlockedTraits.has('t_s2_u1');
      const hasVorpal = this.unlockedTraits.has('t_s2_u2');
      const stance = this.player.travelerStance;

      if (primary) {
        if (stance === 'sword') {
          const hits = (hasMirage ? 5 : 3);
          this.healPlayer(this.player.maxHp * 0.04);
          for (let h = 0; h < hits; h++) {
            setTimeout(() => {
              const hitTarget = primary.hp > 0 ? primary : this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
              if (!hitTarget || hitTarget.hp <= 0) return;
              this.createSlashEffect(this.playerPos.x, this.playerPos.y, hitTarget.x, hitTarget.y, '#22d3ee');
              this.createShockwave(hitTarget.x, hitTarget.y, '#06b6d4', 125);
              sounds.playHit(true);
              for (const e of this.enemies) {
                if (e.hp > 0 && Math.hypot(e.x - hitTarget.x, e.y - hitTarget.y) <= 125) {
                  if (hasVorpal && !e.isBoss && e.hp / e.maxHp < 0.20) {
                    e.takeDamage(e.hp + 9999, true, 'true_damage', this);
                  } else {
                    let dmg = this.player.atk * this.player.critDmg * 1.55;
                    if (hasVorpal && e.hp / e.maxHp < 0.55) dmg *= 1.6;
                    e.takeDamage(dmg, true, 'player', this);
                  }
                }
              }
            }, h * 95);
          }
        } else if (stance === 'bow') {
          const arrows = hasMirage ? 7 : 5;
          for (let a = 0; a < arrows; a++) {
            setTimeout(() => {
              const tEnemy = this.enemies.find(e => e.hp > 0 && e !== primary && a % 2 === 1 && Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 360)
                || (primary.hp > 0 ? primary : this.getClosestEnemy(this.playerPos.x, this.playerPos.y));
              if (!tEnemy || tEnemy.hp <= 0) return;
              let dmg = this.player.atk * this.player.critDmg * 1.05;
              if (hasVorpal && tEnemy.hp / tEnemy.maxHp < 0.55) dmg *= 1.6;
              this.projectiles.push(new ProjectileEntity(
                this.playerPos.x,
                this.playerPos.y,
                tEnemy.x,
                tEnemy.y,
                720,
                dmg,
                true,
                '#38bdf8',
                'player'
              ));
              sounds.playHit(true);
            }, a * 65);
          }
        } else {
          // Staff: Astral Pillars AoE
          const pillars = hasMirage ? 5 : 3;
          for (let p = 0; p < pillars; p++) {
            setTimeout(() => {
              const pillarEnemy = this.enemies[p % Math.max(1, this.enemies.length)] || primary;
              const px = pillarEnemy && pillarEnemy.hp > 0 ? pillarEnemy.x : primary.x;
              const py = pillarEnemy && pillarEnemy.hp > 0 ? pillarEnemy.y : primary.y;
              this.createShockwave(px, py, '#67e8f9', 120);
              this.createLaserBeam(px, py - 150, px, py, '#22d3ee', 20);
              sounds.playExplosion();
              for (const e of this.enemies) {
                if (e.hp > 0 && Math.hypot(e.x - px, e.y - py) <= 120) {
                  if (hasVorpal && !e.isBoss && e.hp / e.maxHp < 0.20) {
                    e.takeDamage(e.hp + 9999, true, 'true_damage', this);
                  } else {
                    let dmg = this.player.atk * this.player.critDmg * 1.65;
                    if (hasVorpal && e.hp / e.maxHp < 0.55) dmg *= 1.6;
                    e.takeDamage(dmg, true, 'player', this);
                  }
                }
              }
            }, p * 110);
          }
        }
      }
    } else if (sk.id === 't_s3') {
      // Temporal Stasis & Rewind: Freeze + True Damage Rewind + Invulnerability + Heal
      const isGrandSphere = this.unlockedTraits.has('t_s3_u1');
      const radius = isGrandSphere ? 420 : 250;
      const freezeDur = isGrandSphere ? 3.2 : 2.4;
      const healPct = isGrandSphere ? 0.40 : 0.28;

      this.healPlayer(this.player.maxHp * healPct);
      this.travelerInvulnTimer = Math.max(this.travelerInvulnTimer, 1.0);
      sounds.playTimeStop();
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#38bdf8', radius);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#f59e0b', Math.round(radius * 0.6));

      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= radius) {
          e.stunTimer = Math.max(e.stunTimer, freezeDur);
          const rwCrit = Math.random() < this.player.critChance;
          e.takeDamage(this.player.atk * 1.80 * (rwCrit ? this.player.critDmg : 1.0), rwCrit, 'true_damage', this);
        }
      }

      if (this.unlockedTraits.has('t_s3_u2')) {
        for (let i = 0; i < this.activeSkills.length; i++) {
          if (i !== slotIndex && this.player.skillCDs[i] > 0) {
            this.player.skillCDs[i] = Math.max(0, this.player.skillCDs[i] - 3.5);
          }
        }
        this.travelerSpeedBoostTimer = 3.0;
        this.recalculateStats();
      }

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 34,
        text: '⏳ TEMPORAL STASIS REWIND!',
        color: '#67e8f9',
        fontSize: 18,
        life: 1.0,
        maxLife: 1.0,
        vy: -28
      });
    } else if (sk.id === 't_s4') {
      // Chronos Overdrive Domain: Moving Chronos Aura + Stationary Zone + Auto Temporal Blades
      const isInfiniteDomain = this.unlockedTraits.has('t_s4_u1');
      const radius = isInfiniteDomain ? 345 : 230;
      const duration = isInfiniteDomain ? 10.0 : 7.0;

      this.player.travelerOverdriveTimer = duration;
      this.player.travelerFieldTimer = Math.max(this.player.travelerFieldTimer, 0.5);
      this.travelerBladeTimer = 0.2;
      this.addPlayerSpatialZone({
        x: this.playerPos.x,
        y: this.playerPos.y,
        radius,
        duration,
        maxDuration: duration,
        type: 'traveler_chrono',
        color: '#06b6d4',
        pulseAngle: 0,
        owner: 'player'
      });
      this.recalculateStats();
      sounds.playTimeStop();
      this.cameraShake = 10;
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#06b6d4', radius);
      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 38,
        text: '⚡ CHRONOS OVERDRIVE DOMAIN!',
        color: '#38bdf8',
        fontSize: 21,
        life: 1.2,
        maxLife: 1.2,
        vy: -32
      });
    }

    // --- Valkyrie Frost Skills ---
    else if (sk.id === 'v_s1') {
      // Glacial Piercing Rush
      const isPathExplode = this.unlockedTraits.has('v_s1_u1');
      const isDeepFreeze = this.unlockedTraits.has('v_s1_u2');
      const rushDmg = this.player.atk * (isPathExplode ? 3.2 : 2.5);

      const angle = this.playerPos.facing;
      const rushDist = 195;
      const oldX = this.playerPos.x;
      const oldY = this.playerPos.y;
      this.playerPos.x += Math.cos(angle) * rushDist;
      this.playerPos.y += Math.sin(angle) * rushDist;
      this.playerPos.x = Math.max(40, Math.min(this.width - 40, this.playerPos.x));
      this.playerPos.y = Math.max(40, Math.min(this.height - 40, this.playerPos.y));

      sounds.playSkill('slash');
      this.createLaserBeam(oldX, oldY, this.playerPos.x, this.playerPos.y, '#7dd3fc', 32);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#38bdf8', 155);

      // Persistent speed buff & Permafrost Shield boost
      const hasCrown = this.acquiredAttributes.has('attr_permafrost_crown');
      const shieldCap = hasCrown ? 1000 : 650;
      this.player.frostArmorShield = Math.min(shieldCap, (this.player.frostArmorShield || 0) + (hasCrown ? 120 : 80));
      this.valkyrieRushTimer = 3.0;
      this.recalculateStats();

      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 170) {
          e.takeDamage(rushDmg, true, 'player', this);
          e.frostSlowTimer = Math.max(e.frostSlowTimer, 3.5);
          if (isDeepFreeze) {
            e.stunTimer = Math.max(e.stunTimer, 2.2);
          }
        }
      }

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 30,
        text: '❄️ GLACIAL PIERCE!',
        color: '#38bdf8',
        fontSize: 18,
        life: 0.8,
        maxLife: 0.8,
        vy: -25
      });
    } else if (sk.id === 'v_s2') {
      // Cryo Vortex & Diamond Dust
      const lances = this.unlockedTraits.has('v_s2_u1') ? 14 : 9;
      const isShatterBurst = this.unlockedTraits.has('v_s2_u2');
      const vortexRadius = 240;

      sounds.playSkill('void');
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#38bdf8', vortexRadius);

      // Vortex pull & defense shred
      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= vortexRadius) {
          e.defense = Math.max(0, e.defense * 0.65);
          e.frostSlowTimer = Math.max(e.frostSlowTimer, 3.0);
          e.x = (e.x + this.playerPos.x) / 2;
          e.y = (e.y + this.playerPos.y) / 2;
          e.takeDamage(this.player.atk * 1.5, true, 'frost_shatter', this);
        }
      }

      // Multi-directional crystal frost lances
      for (let l = 0; l < lances; l++) {
        const spreadAngle = (l - (lances - 1) / 2) * 0.14;
        const finalAngle = this.playerPos.facing + spreadAngle;
        const tx = this.playerPos.x + Math.cos(finalAngle) * 520;
        const ty = this.playerPos.y + Math.sin(finalAngle) * 520;
        this.projectiles.push(new ProjectileEntity(
          this.playerPos.x,
          this.playerPos.y,
          tx,
          ty,
          720,
          this.player.atk * (isShatterBurst ? 1.8 : 1.35),
          true,
          '#7dd3fc',
          'player'
        ));
      }

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 35,
        text: '💎 CRYO VORTEX!',
        color: '#7dd3fc',
        fontSize: 18,
        life: 0.9,
        maxLife: 0.9,
        vy: -25
      });
    } else if (sk.id === 'v_s3') {
      // Glacial Fortress Aegis
      const isCryoThorns = this.unlockedTraits.has('v_s3_u1');
      const isRejuvenation = this.unlockedTraits.has('v_s3_u2');
      const shieldAmt = this.acquiredAttributes.has('attr_permafrost_crown') ? 1000 : 750;

      this.player.frostArmorShield = Math.max(this.player.frostArmorShield || 0, shieldAmt);
      if (isRejuvenation) {
        this.healPlayer(this.player.maxHp * 0.35);
      }
      this.recalculateStats();

      sounds.playSkill('buff');
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#38bdf8', 230);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#7dd3fc', 150);

      // Freeze all surrounding enemies
      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 230) {
          e.stunTimer = Math.max(e.stunTimer, 2.8);
          e.frostSlowTimer = Math.max(e.frostSlowTimer, 4.0);
          e.takeDamage(this.player.atk * 2.1, true, 'player', this);
          if (isCryoThorns) {
            e.takeDamage(90 + this.player.atk * 1.0, false, 'true_damage', this);
          }
        }
      }
      if (this.acquiredAttributes.has('attr_cryo_bastion')) {
        this.triggerCryoLanceBurst(this.playerPos.x, this.playerPos.y);
      }

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 40,
        text: `🛡️ GLACIAL FORTRESS (+${shieldAmt} SHIELD)!`,
        color: '#38bdf8',
        fontSize: 20,
        life: 1.2,
        maxLife: 1.2,
        vy: -30
      });
    } else if (sk.id === 'v_s4') {
      // Ragnarok Glacial Calamity
      const isNova = this.unlockedTraits.has('v_s4_u1');
      const isPerpetual = this.unlockedTraits.has('v_s4_u2');
      const calamityDmg = this.player.atk * (isNova ? 4.6 : 3.6);

      this.cameraShake = 20;
      this.hitstopTimer = 0.1;
      sounds.playBossAlert();
      sounds.playExplosion();

      // Freeze ALL enemies on screen
      for (const e of this.enemies) {
        e.stunTimer = Math.max(e.stunTimer, 4.0);
        e.frostSlowTimer = Math.max(e.frostSlowTimer, 6.0);
      }

      // 8 Glacial Comets Falling from sky
      for (let c = 0; c < 8; c++) {
        const ox = this.playerPos.x + (Math.random() - 0.5) * (this.width * 0.7);
        const oy = this.playerPos.y + (Math.random() - 0.5) * (this.height * 0.7);
        this.telegraphs.push({
          x: ox,
          y: oy,
          radius: 150,
          timer: 0,
          maxTimer: 0.18 + c * 0.13,
          color: '#38bdf8',
          onTrigger: () => {
            sounds.playExplosion();
            this.createShockwave(ox, oy, '#7dd3fc', 165);
            for (const e of this.enemies) {
              if (Math.hypot(e.x - ox, e.y - oy) <= 150) {
                e.frostSlowTimer = Math.max(e.frostSlowTimer, 3.0);
                e.takeDamage(calamityDmg, true, 'player', this);
              }
            }
          }
        });
      }

      // Create lingering Permafrost Blizzard zone (always active, amplified by v_s4_u2)
      const zoneRadius = isPerpetual ? 340 : 260;
      const zoneDur = isPerpetual ? 7.5 : 4.5;
      this.valkyrieBlizzardTimer = zoneDur;
      this.valkyrieBlizzardTick = 0;
      this.valkyrieBlizzardX = this.playerPos.x;
      this.valkyrieBlizzardY = this.playerPos.y;
      this.addPlayerSpatialZone({
        x: this.playerPos.x,
        y: this.playerPos.y,
        radius: zoneRadius,
        duration: zoneDur,
        maxDuration: zoneDur,
        type: 'traveler_chrono',
        color: '#38bdf8',
        pulseAngle: 0,
        owner: 'player'
      });

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 45,
        text: '❄️ RAGNAROK GLACIAL CALAMITY!',
        color: '#38bdf8',
        fontSize: 24,
        life: 2.0,
        maxLife: 2.0,
        vy: -35
      });
    }

    // --- Dimension Judg Skills ---
    else if (sk.id === 'dj_s1') {
      // Spatial Collapse (Singularitas Gravitasi)
      const aimTarget = target || { x: this.playerPos.x + Math.cos(this.playerPos.facing) * 160, y: this.playerPos.y + Math.sin(this.playerPos.facing) * 160 };
      const radius = this.unlockedTraits.has('dj_s1_u1') ? 260 : 180;
      const duration = 2.2;
      this.addPlayerSpatialZone({
        x: aimTarget.x,
        y: aimTarget.y,
        radius,
        duration,
        maxDuration: duration,
        type: 'judge_collapse',
        color: '#818cf8',
        pulseAngle: 0
      });
      sounds.playSkill('void');
      this.floatingTexts.push({
        x: aimTarget.x,
        y: aimTarget.y - 30,
        text: 'SPATIAL COLLAPSE!',
        color: '#818cf8',
        fontSize: 18,
        life: 0.9,
        maxLife: 0.9,
        vy: -25
      });
    } else if (sk.id === 'dj_s2') {
      // Dimensional Barrier (Dinding Ruang)
      const duration = this.unlockedTraits.has('dj_s2_u2') ? 8.0 : 5.0;
      const facing = this.playerPos.facing;
      for (let b = -1; b <= 1; b++) {
        const angle = facing + b * 0.45;
        const bx = this.playerPos.x + Math.cos(angle) * 90;
        const by = this.playerPos.y + Math.sin(angle) * 90;
        this.addPlayerSpatialZone({
          x: bx,
          y: by,
          radius: 55,
          duration,
          maxDuration: duration,
          type: 'judge_barrier',
          color: '#a78bfa',
          pulseAngle: 0
        });
      }
      if (this.unlockedTraits.has('dj_s2_u2')) {
        this.healPlayer(300);
      }
      sounds.playSkill('freeze');
      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 30,
        text: 'DIMENSIONAL BARRIERS!',
        color: '#a78bfa',
        fontSize: 18,
        life: 0.8,
        maxLife: 0.8,
        vy: -25
      });
    } else if (sk.id === 'dj_s3') {
      // Spatial Warp Blink
      let warpX = this.playerPos.x;
      let warpY = this.playerPos.y;
      if (target) {
        const awayAngle = Math.atan2(this.playerPos.y - target.y, this.playerPos.x - target.x);
        warpX += Math.cos(awayAngle) * 220;
        warpY += Math.sin(awayAngle) * 220;
      } else {
        warpX += Math.cos(this.playerPos.facing) * 220;
        warpY += Math.sin(this.playerPos.facing) * 220;
      }
      warpX = Math.max(30, Math.min(this.width - 30, warpX));
      warpY = Math.max(30, Math.min(this.height - 30, warpY));

      this.createShockwave(this.playerPos.x, this.playerPos.y, '#818cf8', 120);
      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 130) {
          const isWarpCrit = Math.random() < this.player.critChance;
          const warpDmg = this.player.atk * 1.75 * (isWarpCrit ? this.player.critDmg : 1.0);
          e.takeDamage(warpDmg, isWarpCrit, 'player', this);
          e.stunTimer = 1.8;
        }
      }

      this.playerPos.x = warpX;
      this.playerPos.y = warpY;
      this.createShockwave(warpX, warpY, '#c084fc', 120);
      sounds.playSkill('laser');
      if (this.acquiredAttributes.has('attr_quantum_echo')) {
        this.triggerRiftBlinkSlash(warpX, warpY);
      }
      this.activatePhantomPhase();

      if (this.unlockedTraits.has('dj_s3_u2')) {
        this.healPlayer(this.player.maxHp * 0.15);
      }
      this.floatingTexts.push({
        x: warpX,
        y: warpY - 30,
        text: 'SPATIAL WARP!',
        color: '#c084fc',
        fontSize: 18,
        life: 0.8,
        maxLife: 0.8,
        vy: -25
      });
    } else if (sk.id === 'dj_s4') {
      // Judgement Spatial Domain (Ruang Isolasi Mutlak)
      const baseDuration = this.unlockedTraits.has('dj_s4_u2') ? 9.0 : 6.0;
      const domainDuration = baseDuration + (this.acquiredAttributes.has('attr_reality_edict') ? 2.0 : 0);
      this.player.judgeDomainTimer = domainDuration;
      this.addPlayerSpatialZone({
        x: this.playerPos.x,
        y: this.playerPos.y,
        radius: 360,
        duration: baseDuration,
        maxDuration: baseDuration,
        type: 'judge_domain',
        color: '#6366f1',
        pulseAngle: 0
      });
      sounds.playTimeStop();
      this.cameraShake = 12;
      this.recalculateStats();
      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 45,
        text: 'JUDGEMENT SPATIAL DOMAIN!',
        color: '#818cf8',
        fontSize: 24,
        life: 1.5,
        maxLife: 1.5,
        vy: -35
      });
    }

    // --- Rift Walker Skills (Revamped Quantum Phantom & Dimensional Assassin) ---
    else if (sk.id === 'rw_s1') {
      // Quantum Blink Strike: Instant rear teleport + 130px AoE Crit + 5% Max HP True Damage + Rift Mark
      const aimTarget = target || this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
      if (aimTarget) {
        const prevX = this.playerPos.x;
        const prevY = this.playerPos.y;
        const bAngle = Math.atan2(aimTarget.y - prevY, aimTarget.x - prevX);

        this.playerPos.x = Math.max(30, Math.min(this.width - 30, aimTarget.x - Math.cos(bAngle) * 38));
        this.playerPos.y = Math.max(30, Math.min(this.height - 30, aimTarget.y - Math.sin(bAngle) * 38));
        this.playerPos.facing = bAngle;

        this.createShockwave(prevX, prevY, '#06b6d4', 85);
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#22d3ee', 130);
        this.createLaserBeam(prevX, prevY, this.playerPos.x, this.playerPos.y, '#06b6d4', 9);
        sounds.playSkill('warp');
        this.cameraShake = 9;

        const hasExec = this.unlockedTraits.has('rw_s1_u1');
        const hasReset = this.unlockedTraits.has('rw_s1_u2');
        let strikeKills = 0;

        for (const e of this.enemies) {
          if (e.hp > 0 && (e === aimTarget || Math.hypot(e.x - aimTarget.x, e.y - aimTarget.y) <= 130)) {
            const wasAlive = e.hp > 0;
            if (hasExec && !e.isBoss && (e.hp / e.maxHp < 0.16)) {
              e.takeDamage(e.hp + 9999, true, 'true_damage', this);
            } else {
              let strikeDmg = this.player.atk * this.player.critDmg * 1.75;
              if (hasExec && (e.hp / e.maxHp < 0.50)) {
                strikeDmg *= 1.40;
              }
              e.takeDamage(strikeDmg, true, 'player', this);
              e.takeDamage(Math.min(260, Math.round(e.maxHp * 0.03)), false, 'true_damage', this);
              this.applyRiftMark(e);
            }
            e.stunTimer = Math.max(e.stunTimer, 0.9);
            this.createSlashEffect(this.playerPos.x, this.playerPos.y, e.x, e.y, '#22d3ee');
            if (wasAlive && e.hp <= 0) strikeKills++;
          }
        }

        if (hasReset) {
          if (strikeKills > 0) {
            this.player.skillCDs[slotIndex] = this.player.skillCDs[slotIndex] * 0.35;
            this.floatingTexts.push({
              x: this.playerPos.x,
              y: this.playerPos.y - 45,
              text: '⚡ WARP CDR -65%!',
              color: '#38bdf8',
              fontSize: 18,
              life: 1.0,
              maxLife: 1.0,
              vy: -25
            });
          } else if (aimTarget.isBoss) {
            this.player.skillCDs[slotIndex] = this.player.skillCDs[slotIndex] * 0.70;
          }
        }

        this.healPlayer(this.player.maxHp * 0.04);
        this.aegisShield = Math.min(350, Math.max(this.aegisShield + 40, 120));
        this.player.riftWarpBuffTimer = 2.0;
        this.onRiftWalkerBlink(this.playerPos.x, this.playerPos.y);
        if (this.acquiredAttributes.has('attr_quantum_echo')) {
          this.triggerRiftBlinkSlash(this.playerPos.x, this.playerPos.y);
        }
        this.activatePhantomPhase();
        this.recalculateStats();

        this.floatingTexts.push({
          x: this.playerPos.x,
          y: this.playerPos.y - 30,
          text: '⚡ QUANTUM BLINK STRIKE!',
          color: '#22d3ee',
          fontSize: 18,
          life: 0.85,
          maxLife: 0.85,
          vy: -25
        });
      } else {
        const fx = this.playerPos.x + Math.cos(this.playerPos.facing) * 220;
        const fy = this.playerPos.y + Math.sin(this.playerPos.facing) * 220;
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#06b6d4', 75);
        this.playerPos.x = Math.max(30, Math.min(this.width - 30, fx));
        this.playerPos.y = Math.max(30, Math.min(this.height - 30, fy));
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#22d3ee', 85);
        sounds.playSkill('warp');
        this.healPlayer(this.player.maxHp * 0.04);
        this.aegisShield = Math.min(350, Math.max(this.aegisShield + 40, 120));
        this.player.riftWarpBuffTimer = 2.0;
        this.onRiftWalkerBlink(this.playerPos.x, this.playerPos.y);
        if (this.acquiredAttributes.has('attr_quantum_echo')) {
          this.triggerRiftBlinkSlash(this.playerPos.x, this.playerPos.y);
        }
        this.activatePhantomPhase();
        this.recalculateStats();
      }
    } else if (sk.id === 'rw_s2') {
      // Phase Crossfire Ambush: 3x (or 5x) warp slashes leaving Rift Laser Crossfire lines
      const count = this.unlockedTraits.has('rw_s2_u2') ? 5 : 3;
      const hasLaserCrossfire = this.unlockedTraits.has('rw_s2_u1');
      const sortedEnemies = [...this.enemies].sort((a, b) => {
        const da = Math.hypot(a.x - this.playerPos.x, a.y - this.playerPos.y);
        const db = Math.hypot(b.x - this.playerPos.x, b.y - this.playerPos.y);
        return da - db;
      });

      let startX = this.playerPos.x;
      let startY = this.playerPos.y;
      const laserSegments: { x1: number; y1: number; x2: number; y2: number }[] = [];
      this.createShockwave(startX, startY, '#06b6d4', 75);
      sounds.playSkill('warp');

      for (let s = 0; s < count; s++) {
        const e = sortedEnemies[s % sortedEnemies.length];
        if (e && e.hp > 0) {
          const nextX = Math.max(30, Math.min(this.width - 30, e.x + (Math.random() - 0.5) * 42));
          const nextY = Math.max(30, Math.min(this.height - 30, e.y + (Math.random() - 0.5) * 42));
          this.createLaserBeam(startX, startY, nextX, nextY, '#22d3ee', 8);
          this.createSlashEffect(startX, startY, nextX, nextY, '#06b6d4');
          laserSegments.push({ x1: startX, y1: startY, x2: nextX, y2: nextY });

          for (const near of this.enemies) {
            if (near.hp > 0) {
              if (Math.hypot(near.x - nextX, near.y - nextY) <= 110) {
                near.takeDamage(this.player.atk * this.player.critDmg * 1.15, true, 'player', this);
                near.stunTimer = Math.max(near.stunTimer, 0.4);
                this.applyRiftMark(near);
              } else if (this.distanceToSegment({ x: near.x, y: near.y }, { x: startX, y: startY }, { x: nextX, y: nextY }) <= near.radius + 20) {
                near.takeDamage(this.player.atk * 0.55, false, 'true_damage', this);
              }
            }
          }
          startX = nextX;
          startY = nextY;
        }
      }

      if (hasLaserCrossfire && laserSegments.length > 0) {
        setTimeout(() => {
          for (const seg of laserSegments) {
            this.createLaserBeam(seg.x1, seg.y1, seg.x2, seg.y2, '#38bdf8', 14);
            for (const e of this.enemies) {
              if (e.hp > 0 && this.distanceToSegment({ x: e.x, y: e.y }, { x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }) <= e.radius + 26) {
                const lCrit = Math.random() < this.player.critChance;
                e.takeDamage(this.player.atk * 0.90 * (lCrit ? this.player.critDmg : 1.0), lCrit, 'true_damage', this);
                e.defense = Math.round(e.defense * 0.85);
              }
            }
          }
          sounds.playSkill('thunder');
        }, 250);
      }

      this.playerPos.x = Math.max(30, Math.min(this.width - 30, startX));
      this.playerPos.y = Math.max(30, Math.min(this.height - 30, startY));
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#22d3ee', 100);
      this.cameraShake = 10;
      this.player.riftWarpBuffTimer = 2.0;
      this.onRiftWalkerBlink(this.playerPos.x, this.playerPos.y);
      if (this.acquiredAttributes.has('attr_quantum_echo')) {
        this.triggerRiftBlinkSlash(this.playerPos.x, this.playerPos.y);
      }
      this.activatePhantomPhase();
      this.recalculateStats();

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 30,
        text: `⚡ PHASE CROSSFIRE (${count}x BLINK)!`,
        color: '#22d3ee',
        fontSize: 19,
        life: 0.9,
        maxLife: 0.9,
        vy: -25
      });
    } else if (sk.id === 'rw_s3') {
      // Phantom Decoy Singularity: Evasive blink (0.45s invuln), implosion at origin, summon Rift Decoy(s)
      const prevX = this.playerPos.x;
      const prevY = this.playerPos.y;
      const awayAngle = this.playerPos.facing + Math.PI;
      this.playerPos.x = Math.max(30, Math.min(this.width - 30, this.playerPos.x + Math.cos(awayAngle) * 185));
      this.playerPos.y = Math.max(30, Math.min(this.height - 30, this.playerPos.y + Math.sin(awayAngle) * 185));

      this.riftInvulnTimer = Math.max(this.riftInvulnTimer, 0.45);
      this.createShockwave(prevX, prevY, '#06b6d4', 145);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#22d3ee', 95);
      sounds.playSkill('warp');

      // Origin Decoy Implosion (pulls & damages enemies at departure point)
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - prevX, e.y - prevY);
        if (d <= 150) {
          e.x += (prevX - e.x) * 0.35;
          e.y += (prevY - e.y) * 0.35;
          const impCrit = Math.random() < this.player.critChance;
          e.takeDamage(this.player.atk * 1.10 * (impCrit ? this.player.critDmg : 1.0), impCrit, 'true_damage', this);
          this.applyRiftMark(e);
        }
      }

      this.healPlayer(this.player.maxHp * 0.04);
      this.aegisShield = Math.min(350, Math.max(this.aegisShield + 45, 120));
      this.player.riftWarpBuffTimer = 2.0;
      this.onRiftWalkerBlink(this.playerPos.x, this.playerPos.y);
      if (this.acquiredAttributes.has('attr_quantum_echo')) {
        this.triggerRiftBlinkSlash(this.playerPos.x, this.playerPos.y);
      }
      this.activatePhantomPhase();
      this.recalculateStats();

      // Summon 1 or 2 Warp Phantoms
      const phantomsCount = this.unlockedTraits.has('rw_s3_u1') ? 2 : 1;
      const hasSupernova = this.unlockedTraits.has('rw_s3_u2');
      for (let p = 0; p < phantomsCount; p++) {
        const dx = prevX + (p === 0 ? -18 : 26);
        const dy = prevY + (p === 0 ? 0 : 18);
        const decoy = new CloneEntity(dx, dy, this);
        decoy.lifeTimer = 5.5;
        decoy.isRiftDecoy = true;
        this.clones.push(decoy);
        if (hasSupernova) {
          this.triggerDecoySupernova(dx, dy);
        }
      }

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 30,
        text: '🌀 PHANTOM DECOY SINGULARITY!',
        color: '#06b6d4',
        fontSize: 18,
        life: 0.9,
        maxLife: 0.9,
        vy: -25
      });
    } else if (sk.id === 'rw_s4') {
      // Omnipresent Void Storm (Frame-synchronized invincible teleport storm)
      const slashes = this.unlockedTraits.has('rw_s4_u1') ? 15 : 10;
      this.player.isInvulnerable = true;
      this.riftStormSlashesLeft = slashes;
      this.riftStormSlashTimer = 0.05;
      this.player.riftStormTimer = slashes * 0.11;
      this.cameraShake = 16;
      this.hitstopTimer = 0.08;
      sounds.playTimeStop();
      this.onRiftWalkerBlink(this.playerPos.x, this.playerPos.y);

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 45,
        text: '🌀 OMNIPRESENT VOID STORM!',
        color: '#22d3ee',
        fontSize: 24,
        life: 1.6,
        maxLife: 1.6,
        vy: -35
      });
    } else if (sk.id === 'sp_s1') {
      // SKILL 1: Marionette Control (Mengendalikan Boneka)
      const maxPuppets = this.unlockedTraits.has('sp_s1_u1') ? 4 : 3;
      const spawnCount = this.unlockedTraits.has('sp_s1_u1') ? 3 : 2;
      sounds.playSkill('buff');
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#e879f9', 120);

      for (let i = 0; i < spawnCount; i++) {
        const ang = this.playerPos.facing + (i - (spawnCount - 1) / 2) * 0.9;
        const px = Math.max(30, Math.min(this.width - 30, this.playerPos.x + Math.cos(ang) * 58));
        const py = Math.max(30, Math.min(this.height - 30, this.playerPos.y + Math.sin(ang) * 58));
        this.spawnPuppetMinion('puppet', px, py, 0, maxPuppets);
      }

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 34,
        text: `🪆 MARIONETTE CONTROL (${spawnCount} BONEKA)!`,
        color: '#e879f9',
        fontSize: 18,
        life: 1.0,
        maxLife: 1.0,
        vy: -28
      });
    } else if (sk.id === 'sp_s2') {
      // SKILL 2: Soul Possession (Merasuki Boneka)
      let vessel = this.minions
        .filter(m => m.kind === 'puppet' && m.hp > 0)
        .sort((a, b) => b.modLevel - a.modLevel || b.hp - a.hp)[0];

      if (!vessel) {
        // Conjure a temporary Soul Core Doll near target/player to possess immediately
        const tx = target ? target.x : this.playerPos.x + Math.cos(this.playerPos.facing) * 120;
        const ty = target ? target.y : this.playerPos.y + Math.sin(this.playerPos.facing) * 120;
        vessel = this.spawnPuppetMinion('puppet', Math.max(30, Math.min(this.width - 30, tx)), Math.max(30, Math.min(this.height - 30, ty)), 0);
      }

      const prevX = this.playerPos.x;
      const prevY = this.playerPos.y;
      this.playerPos.x = Math.max(30, Math.min(this.width - 30, vessel.x));
      this.playerPos.y = Math.max(30, Math.min(this.height - 30, vessel.y));

      this.createLaserBeam(prevX, prevY, this.playerPos.x, this.playerPos.y, '#22d3ee', 8);
      this.createShockwave(prevX, prevY, '#a855f7', 95);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#22d3ee', 190);
      sounds.playSkill('warp');
      sounds.playExplosion();
      this.cameraShake = 12;

      // Full Possession duration untargetability & immunity is handled via player.puppetPossessTimer > 0
      const possessDur = this.unlockedTraits.has('sp_s2_u1') ? 4.2 : 3.0;
      this.player.puppetPossessTimer = possessDur;
      vessel.possessTimer = possessDur;
      vessel.lifeTimer = Math.max(vessel.lifeTimer, possessDur + 10);
      vessel.hp = vessel.maxHp;

      // Heal 15% Max HP & grant +220 Soul Vessel Shield
      this.healPlayer(this.player.maxHp * 0.15);
      this.aegisShield = Math.max(this.aegisShield, 220);

      // AoE True Damage Soul Shockwave around possessed puppet
      const shockDmg = this.player.atk * 1.5;
      const canStun = this.unlockedTraits.has('sp_s2_u1');
      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 185) {
          e.takeDamage(shockDmg, true, 'true_damage', this);
          if (canStun) e.stunTimer = Math.max(e.stunTimer, 1.8);
        }
      }

      if (this.unlockedTraits.has('sp_s2_u2')) {
        for (let i = 0; i < this.activeSkills.length; i++) {
          if (i !== slotIndex && this.player.skillCDs[i] > 0) {
            this.player.skillCDs[i] = Math.max(0, this.player.skillCDs[i] - 1.5);
          }
        }
      }

      this.recalculateStats();
      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 38,
        text: '👻 SOUL POSSESSION! (UNTARGETABLE)',
        color: '#22d3ee',
        fontSize: 19,
        life: 1.2,
        maxLife: 1.2,
        vy: -30
      });
    } else if (sk.id === 'sp_s3') {
      // SKILL 3: Necro Forge & Puppet Modify (Necromancer + Modify + Enemy Doll Transform)
      const raiseCount = this.unlockedTraits.has('sp_s3_u2') ? 3 : 2;
      const maxUndead = this.unlockedTraits.has('sp_s3_u2') ? 8 : 5;
      const modBoost = this.unlockedTraits.has('sp_s3_u1') ? 2 : 1;

      sounds.playSkill('void');
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#4ade80', 200);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#e879f9', 150);

      // 1. Necromancy: Raise Bone Revenants
      for (let i = 0; i < raiseCount; i++) {
        const ang = (i / raiseCount) * Math.PI * 2 + Math.random() * 0.4;
        const ux = Math.max(30, Math.min(this.width - 30, this.playerPos.x + Math.cos(ang) * 70));
        const uy = Math.max(30, Math.min(this.height - 30, this.playerPos.y + Math.sin(ang) * 70));
        this.spawnPuppetMinion('undead', ux, uy, 0, maxUndead);
      }

      // 2. Modify: Upgrade ALL active Puppets & Undead (+1 or +2 Modify tier) & heal 100%
      for (const m of this.minions) {
        if (m.hp > 0) {
          m.applyModify(modBoost);
          this.createShockwave(m.x, m.y, '#fbbf24', 55);
        }
      }

      // 3. Necro Pulse + Cursed Doll Transform (<28% HP non-boss enemies transform into modified Dolls!)
      const pulseDmg = this.player.atk * 1.15;
      let transformedCount = 0;
      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 210) {
          if (!e.isBoss && (e.hp / e.maxHp < 0.28)) {
            const ex = e.x;
            const ey = e.y;
            e.takeDamage(e.hp + 9999, true, 'true_damage', this);
            this.spawnPuppetMinion('puppet', ex, ey, 1, this.unlockedTraits.has('sp_s1_u1') ? 4 : 3);
            transformedCount++;
          } else {
            e.takeDamage(pulseDmg, false, 'true_damage', this);
          }
        }
      }

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 38,
        text: transformedCount > 0
          ? `🔧 NECRO MODIFY! (+${raiseCount} UNDEAD, ${transformedCount} TRANSFORMED)`
          : `🔧 NECRO FORGE & MODIFY (+${modBoost} TIER)!`,
        color: '#4ade80',
        fontSize: 18,
        life: 1.3,
        maxLife: 1.3,
        vy: -30
      });
    } else if (sk.id === 'sp_s4') {
      // SKILL 4: Sovereign Transform: Ascendant Lich (Transform + Soul Maker Ultimate)
      const dur = this.unlockedTraits.has('sp_s4_u1') ? 11.0 : 8.0;
      this.player.lichTransformTimer = dur;
      this.lichGenesisTimer = 0;
      this.addSouls(10);

      sounds.playTimeStop();
      sounds.playExplosion();
      this.cameraShake = 18;
      this.hitstopTimer = 0.08;
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#fbbf24', 280);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#e879f9', 220);

      // Transform/Modify all active puppets +1 tier immediately
      for (const m of this.minions) {
        if (m.hp > 0) {
          m.applyModify(1);
          this.createLaserBeam(this.playerPos.x, this.playerPos.y, m.x, m.y, '#fbbf24', 5);
        }
      }

      // Soul Maker Execution across the battlefield
      const execDmg = this.player.atk * 1.6;
      for (const e of this.enemies) {
        e.takeDamage(execDmg, true, 'true_damage', this);
        this.createShockwave(e.x, e.y, '#e879f9', 70);
      }

      this.recalculateStats();
      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 46,
        text: '👑 TRANSFORM: ASCENDANT SOUL LICH!',
        color: '#fbbf24',
        fontSize: 23,
        life: 1.8,
        maxLife: 1.8,
        vy: -35
      });
    } else if (sk.id === 'sol_s1') {
      // SKILL 1: Solar Lance Thrust
      this.addSolarHeat(3);
      const thrustDist = this.unlockedTraits.has('sol_s1_u1') ? 300 : 220;
      const angle = target
        ? Math.atan2(target.y - this.playerPos.y, target.x - this.playerPos.x)
        : this.playerPos.facing;
      const startX = this.playerPos.x;
      const startY = this.playerPos.y;
      const endX = Math.max(24, Math.min(this.width - 24, startX + Math.cos(angle) * thrustDist));
      const endY = Math.max(24, Math.min(this.height - 24, startY + Math.sin(angle) * thrustDist));

      this.playerPos.x = endX;
      this.playerPos.y = endY;
      this.playerPos.facing = angle;

      this.createLaserBeam(startX, startY, endX, endY, '#f97316', 18);
      this.createShockwave(endX, endY, '#fb923c', 95);
      sounds.playSkill('slash');

      const guaranteedCrit = this.unlockedTraits.has('sol_s1_u2');
      for (const e of this.enemies) {
        if (this.distanceToSegment({ x: e.x, y: e.y }, { x: startX, y: startY }, { x: endX, y: endY }) <= 48 + e.radius) {
          const isCrit = guaranteedCrit || Math.random() < this.player.critChance;
          const lanceDmg = this.player.atk * 2.30 * (isCrit ? this.player.critDmg : 1.0);
          e.takeDamage(lanceDmg, isCrit, 'player', this);
          e.takeDamage(this.player.atk * 0.60, false, 'true_damage', this);
          if (this.unlockedTraits.has('sol_s1_u1')) {
            e.stunTimer = Math.max(e.stunTimer, 1.2);
          }
          if (guaranteedCrit) {
            e.defense = Math.round(e.defense * 0.75);
          }
        }
      }
      this.floatingTexts.push({
        x: endX,
        y: endY - 30,
        text: '🔥 SOLAR LANCE THRUST!',
        color: '#fb923c',
        fontSize: 16,
        life: 0.9,
        maxLife: 0.9,
        vy: -25
      });
    } else if (sk.id === 'sol_s2') {
      // SKILL 2: Corona Nova Ring
      this.addSolarHeat(1);
      const solarBonusMult = this.acquiredAttributes.has('attr_solar_core') ? 1.40 : 1.0;
      const radius = this.unlockedTraits.has('sol_s2_u1') ? 240 : 190;
      const baseMult = this.unlockedTraits.has('sol_s2_u1') ? 2.60 : 1.90;
      const shieldGain = this.unlockedTraits.has('sol_s2_u2') ? 380 : 220;

      this.aegisShield = Math.min(800, this.aegisShield + shieldGain);
      if (this.unlockedTraits.has('sol_s2_u2')) {
        this.healPlayer(this.player.maxHp * 0.12);
      }

      this.createShockwave(this.playerPos.x, this.playerPos.y, '#f97316', radius);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#facc15', radius * 0.65);
      sounds.playExplosion();
      this.cameraShake = 10;

      for (const e of this.enemies) {
        const d = Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y);
        if (d <= radius) {
          const isCrit = Math.random() < this.player.critChance;
          const dmg = this.player.atk * baseMult * solarBonusMult * (isCrit ? this.player.critDmg : 1.0);
          e.takeDamage(dmg, isCrit, 'player', this);
          const ang = Math.atan2(e.y - this.playerPos.y, e.x - this.playerPos.x);
          e.x = Math.max(-40, Math.min(this.width + 40, e.x + Math.cos(ang) * 85));
          e.y = Math.max(-40, Math.min(this.height + 40, e.y + Math.sin(ang) * 85));
        }
      }
      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 34,
        text: `☀️ CORONA NOVA (+${shieldGain} SHIELD)`,
        color: '#facc15',
        fontSize: 16,
        life: 1.0,
        maxLife: 1.0,
        vy: -26
      });
    } else if (sk.id === 'sol_s3') {
      // SKILL 3: Starfall Meteor Barrage
      this.addSolarHeat(1);
      const solarBonusMult = this.acquiredAttributes.has('attr_solar_core') ? 1.40 : 1.0;
      const meteorCount = this.unlockedTraits.has('sol_s3_u1') ? 7 : 4;
      const hasCrater = this.unlockedTraits.has('sol_s3_u2');
      const sortedTargets = [...this.enemies].sort((a, b) =>
        Math.hypot(a.x - this.playerPos.x, a.y - this.playerPos.y) - Math.hypot(b.x - this.playerPos.x, b.y - this.playerPos.y)
      );

      for (let m = 0; m < meteorCount; m++) {
        const focus = sortedTargets.length > 0 ? sortedTargets[m % sortedTargets.length] : null;
        const mx = focus
          ? Math.max(40, Math.min(this.width - 40, focus.x + (Math.random() - 0.5) * 45))
          : Math.max(40, Math.min(this.width - 40, this.playerPos.x + (Math.random() - 0.5) * 240));
        const my = focus
          ? Math.max(40, Math.min(this.height - 40, focus.y + (Math.random() - 0.5) * 45))
          : Math.max(40, Math.min(this.height - 40, this.playerPos.y + (Math.random() - 0.5) * 240));

        this.telegraphs.push({
          x: mx,
          y: my,
          radius: 115,
          timer: 0,
          maxTimer: 0.18 + m * 0.11,
          color: '#f97316',
          onTrigger: () => {
            sounds.playExplosion();
            this.cameraShake = 8;
            this.createShockwave(mx, my, '#f97316', 115);
            this.createShockwave(mx, my, '#fde047', 70);
            for (const e of this.enemies) {
              if (Math.hypot(e.x - mx, e.y - my) <= 115) {
                const isCrit = Math.random() < this.player.critChance;
                const dmg = this.player.atk * 1.85 * solarBonusMult * (isCrit ? this.player.critDmg : 1.0);
                e.takeDamage(dmg, isCrit, 'player', this);
                if (hasCrater) {
                  e.takeDamage(this.player.atk * 0.80 * solarBonusMult, false, 'true_damage', this);
                }
                e.stunTimer = Math.max(e.stunTimer, 0.9);
              }
            }
          }
        });
      }
      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 36,
        text: `☄️ STARFALL METEOR BARRAGE (x${meteorCount})!`,
        color: '#f97316',
        fontSize: 17,
        life: 1.1,
        maxLife: 1.1,
        vy: -28
      });
    } else if (sk.id === 'sol_s4') {
      // SKILL 4: Supernova Incarnation (Transform)
      const dur = this.unlockedTraits.has('sol_s4_u1') ? 11.0 : 8.0;
      const cap = this.acquiredAttributes.has('attr_solar_core') ? 30 : 20;
      const solarBonusMult = this.acquiredAttributes.has('attr_solar_core') ? 1.40 : 1.0;

      this.player.solarAvatarTimer = dur;
      this.player.solarHeat = cap;
      this.solarAvatarAuraTimer = 0;
      this.solarAvatarMeteorTimer = 0;

      sounds.playTimeStop();
      sounds.playExplosion();
      this.cameraShake = 18;
      this.hitstopTimer = 0.08;
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#f97316', 260);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#facc15', 190);

      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 250) {
          const isCrit = Math.random() < this.player.critChance;
          const novaDmg = this.player.atk * 3.20 * solarBonusMult * (isCrit ? this.player.critDmg : 1.0);
          e.takeDamage(novaDmg, isCrit, 'true_damage', this);
        }
      }

      this.recalculateStats();
      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 46,
        text: '☀️ SUPERNOVA INCARNATION!',
        color: '#facc15',
        fontSize: 22,
        life: 1.6,
        maxLife: 1.6,
        vy: -34
      });
    } else if (sk.id === 'fa_s1') {
      // FALLEN ANGEL SKILL 1: Crimson Feather Barrage
      this.addAngelFeathers(3);
      const count = this.unlockedTraits.has('fa_s1_u1') ? 11 : 7;
      const execBoost = this.unlockedTraits.has('fa_s1_u1');
      const cursed = this.unlockedTraits.has('fa_s1_u2');
      const focus = target || this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
      const baseAngle = focus
        ? Math.atan2(focus.y - this.playerPos.y, focus.x - this.playerPos.x)
        : this.playerPos.facing;
      this.playerPos.facing = baseAngle;
      sounds.playSkill('slash');
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#c084fc', 85);

      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * 0.14;
        const ang = baseAngle + spread;
        const isCrit = cursed || Math.random() < this.player.critChance;
        let dmg = this.player.atk * 1.15 * (isCrit ? this.player.critDmg : 1.0);
        if (execBoost && focus && focus.hp / focus.maxHp < 0.50) {
          dmg *= 1.30;
        }
        this.projectiles.push(new ProjectileEntity(
          this.playerPos.x,
          this.playerPos.y,
          this.playerPos.x + Math.cos(ang) * 440,
          this.playerPos.y + Math.sin(ang) * 440,
          680,
          dmg,
          isCrit,
          cursed ? '#fb7185' : '#c084fc',
          'player'
        ));
      }

      // Direct cone shred & cursed bonus true damage on close targets
      for (const e of this.enemies) {
        if (e.hp > 0 && Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 230) {
          e.defense = Math.round(e.defense * 0.80);
          if (cursed) {
            e.takeDamage(this.player.atk * 0.45, false, 'true_damage', this);
          }
        }
      }

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 34,
        text: `🪶 CRIMSON FEATHER BARRAGE (x${count})!`,
        color: '#e879f9',
        fontSize: 16,
        life: 0.9,
        maxLife: 0.9,
        vy: -26
      });
    } else if (sk.id === 'fa_s2') {
      // FALLEN ANGEL SKILL 2: Shattered Halo Dash
      this.addAngelFeathers(2);
      const originX = this.playerPos.x;
      const originY = this.playerPos.y;
      const invulnDur = this.unlockedTraits.has('fa_s2_u1') ? 1.1 : 0.6;
      this.riftInvulnTimer = Math.max(this.riftInvulnTimer, invulnDur);
      this.aegisShield = Math.min(800, this.aegisShield + 240);
      if (this.unlockedTraits.has('fa_s2_u1')) {
        this.healPlayer(this.player.maxHp * 0.18);
      }

      const focus = target || this.getClosestEnemy(originX, originY);
      const dashAng = focus ? Math.atan2(focus.y - originY, focus.x - originX) : this.playerPos.facing;
      const newX = Math.max(28, Math.min(this.width - 28, originX + Math.cos(dashAng) * 165));
      const newY = Math.max(28, Math.min(this.height - 28, originY + Math.sin(dashAng) * 165));
      this.playerPos.x = newX;
      this.playerPos.y = newY;
      this.playerPos.facing = dashAng;

      this.createLaserBeam(originX, originY, newX, newY, '#c084fc', 12);
      const haloRadius = this.unlockedTraits.has('fa_s2_u2') ? 260 : 185;
      this.createShockwave(originX, originY, '#e11d48', haloRadius);
      this.createShockwave(newX, newY, '#c084fc', 110);
      sounds.playSkill('warp');

      for (const e of this.enemies) {
        if (e.hp > 0 && Math.hypot(e.x - originX, e.y - originY) <= haloRadius) {
          if (this.unlockedTraits.has('fa_s2_u2')) {
            const pAng = Math.atan2(originY - e.y, originX - e.x);
            e.x += Math.cos(pAng) * 75;
            e.y += Math.sin(pAng) * 75;
            e.chronoSlowTimer = Math.max(e.chronoSlowTimer, 2.5);
          }
          const isCrit = Math.random() < this.player.critChance;
          const haloDmg = this.player.atk * 1.95 * (isCrit ? this.player.critDmg : 1.0);
          e.takeDamage(haloDmg, isCrit, 'true_damage', this);
          e.stunTimer = Math.max(e.stunTimer, 1.3);
        }
      }

      this.floatingTexts.push({
        x: newX,
        y: newY - 34,
        text: '🪽 SHATTERED HALO DASH!',
        color: '#c084fc',
        fontSize: 16,
        life: 0.95,
        maxLife: 0.95,
        vy: -26
      });
    } else if (sk.id === 'fa_s3') {
      // FALLEN ANGEL SKILL 3: Judgement of Sin
      this.addAngelFeathers(2);
      const focus = target || this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
      const jx = focus ? focus.x : this.playerPos.x + Math.cos(this.playerPos.facing) * 140;
      const jy = focus ? focus.y : this.playerPos.y + Math.sin(this.playerPos.facing) * 140;
      const radius = this.unlockedTraits.has('fa_s3_u1') ? 320 : 215;

      if (this.unlockedTraits.has('fa_s3_u2')) {
        const s1Idx = this.activeSkills.findIndex(s => s.id === 'fa_s1');
        if (s1Idx >= 0) this.player.skillCDs[s1Idx] = 0;
        this.temporalCompassTimer = Math.max(this.temporalCompassTimer, 4.0);
        this.recalculateStats();
      }

      sounds.playExplosion();
      this.cameraShake = 12;
      this.createShockwave(jx, jy, '#a855f7', radius);
      this.createShockwave(jx, jy, '#e11d48', radius * 0.65);

      for (const e of [...this.enemies]) {
        if (e.hp > 0 && Math.hypot(e.x - jx, e.y - jy) <= radius) {
          const isCrit = Math.random() < this.player.critChance;
          const baseJudgement = this.player.atk * 1.75 * (isCrit ? this.player.critDmg : 1.0);
          const pctDmg = Math.min(600, Math.round(e.maxHp * 0.04));
          e.takeDamage(baseJudgement + pctDmg, isCrit, 'true_damage', this);
          e.stunTimer = Math.max(e.stunTimer, 1.1);
          if (this.unlockedTraits.has('fa_s3_u1') && !e.isBoss && e.hp > 0 && e.hp / e.maxHp < 0.20) {
            e.takeDamage(e.hp + 50, true, 'true_damage', this);
          }
        }
      }

      this.floatingTexts.push({
        x: jx,
        y: jy - 38,
        text: '⚖️ JUDGEMENT OF SIN!',
        color: '#f472b6',
        fontSize: 18,
        life: 1.15,
        maxLife: 1.15,
        vy: -28
      });
    } else if (sk.id === 'fa_s4') {
      // FALLEN ANGEL SKILL 4: Eclipse of the Fallen Seraph
      const dur = this.unlockedTraits.has('fa_s4_u1') ? 11.0 : 8.0;
      const cap = this.acquiredAttributes.has('attr_eclipse_halo') ? 20 : 12;
      this.player.angelEclipseTimer = dur;
      this.player.angelFeathers = cap;
      this.angelWingTimer = 0;

      sounds.playTimeStop();
      sounds.playExplosion();
      this.cameraShake = 16;
      this.hitstopTimer = 0.08;
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#c084fc', 250);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#e11d48', 175);

      for (const e of this.enemies) {
        if (e.hp > 0 && Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 240) {
          const isCrit = Math.random() < this.player.critChance;
          const novaDmg = this.player.atk * 3.20 * (isCrit ? this.player.critDmg : 1.0);
          e.takeDamage(novaDmg, isCrit, 'true_damage', this);
          e.stunTimer = Math.max(e.stunTimer, 1.0);
        }
      }

      this.recalculateStats();
      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 46,
        text: `🪽 ECLIPSE OF THE FALLEN SERAPH (${dur}s)!`,
        color: '#e879f9',
        fontSize: 20,
        life: 1.6,
        maxLife: 1.6,
        vy: -32
      });
    } else if (sk.id === 'dr_s1') {
      // DEMON RAISED SKILL 1: Hellfire Claw Cleave
      this.addDemonEssence(3);
      const hellfireMult = this.acquiredAttributes.has('attr_hellfire_crown') ? 1.35 : 1.0;
      const focus = target || this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
      const baseAngle = focus
        ? Math.atan2(focus.y - this.playerPos.y, focus.x - this.playerPos.x)
        : this.playerPos.facing;
      this.playerPos.facing = baseAngle;

      const cleaveX = this.playerPos.x + Math.cos(baseAngle) * 55;
      const cleaveY = this.playerPos.y + Math.sin(baseAngle) * 55;
      this.createShockwave(cleaveX, cleaveY, '#e11d48', 165);
      sounds.playSkill('slash');
      this.cameraShake = 8;

      const guaranteedCrit = this.unlockedTraits.has('dr_s1_u1');
      let totalCleaveDealt = 0;

      for (const e of this.enemies) {
        if (e.hp > 0 && Math.hypot(e.x - cleaveX, e.y - cleaveY) <= 165 + e.radius) {
          const isCrit = guaranteedCrit || Math.random() < this.player.critChance;
          const physDmg = this.player.atk * 2.35 * (isCrit ? this.player.critDmg : 1.0);
          const fireTrue = this.player.atk * 0.85 * hellfireMult;
          e.takeDamage(physDmg, isCrit, 'player', this);
          e.takeDamage(fireTrue, false, 'true_damage', this);
          this.createSlashEffect(this.playerPos.x, this.playerPos.y, e.x, e.y, '#fb7185');
          totalCleaveDealt += physDmg + fireTrue;
        }
      }

      if (guaranteedCrit && totalCleaveDealt > 0) {
        this.healPlayer(Math.min(this.player.maxHp * 0.30, totalCleaveDealt * 0.25));
      }

      if (this.unlockedTraits.has('dr_s1_u2')) {
        for (let w = -1; w <= 1; w++) {
          const wAng = baseAngle + w * 0.16;
          const wCrit = Math.random() < this.player.critChance;
          const wDmg = this.player.atk * 1.75 * hellfireMult * (wCrit ? this.player.critDmg : 1.0);
          this.projectiles.push(new ProjectileEntity(
            this.playerPos.x,
            this.playerPos.y,
            this.playerPos.x + Math.cos(wAng) * 360,
            this.playerPos.y + Math.sin(wAng) * 360,
            640,
            wDmg,
            wCrit,
            '#e11d48',
            'player'
          ));
        }
      }

      this.floatingTexts.push({
        x: cleaveX,
        y: cleaveY - 34,
        text: '🔥 HELLFIRE CLAW CLEAVE!',
        color: '#fb7185',
        fontSize: 16,
        life: 0.95,
        maxLife: 0.95,
        vy: -26
      });
    } else if (sk.id === 'dr_s2') {
      // DEMON RAISED SKILL 2: Abyssal Chains & Blood Pact
      this.addDemonEssence(2);
      const radius = this.unlockedTraits.has('dr_s2_u2') ? 310 : 235;
      const shieldGain = this.unlockedTraits.has('dr_s2_u2') ? 440 : 260;
      const stunDur = this.unlockedTraits.has('dr_s2_u1') ? 1.6 : 0.7;
      const shredArmor = this.unlockedTraits.has('dr_s2_u1');

      this.aegisShield = Math.min(800, this.aegisShield + shieldGain);
      this.healPlayer(this.player.maxHp * 0.14);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#e11d48', radius);
      sounds.playSkill('warp');
      this.cameraShake = 9;

      for (const e of this.enemies) {
        const dist = Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y);
        if (e.hp > 0 && dist <= radius) {
          this.createLaserBeam(this.playerPos.x, this.playerPos.y, e.x, e.y, '#be123c', 5);
          if (dist > 45) {
            const pullAng = Math.atan2(this.playerPos.y - e.y, this.playerPos.x - e.x);
            const pullDist = Math.min(110, dist - 36);
            e.x += Math.cos(pullAng) * pullDist;
            e.y += Math.sin(pullAng) * pullDist;
          }
          const isCrit = Math.random() < this.player.critChance;
          const chainDmg = this.player.atk * 1.70 * (isCrit ? this.player.critDmg : 1.0);
          e.takeDamage(chainDmg, isCrit, 'player', this);
          e.stunTimer = Math.max(e.stunTimer, stunDur);
          if (shredArmor) {
            e.defense = Math.round(e.defense * 0.70);
          }
        }
      }

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 36,
        text: `⛓️ ABYSSAL CHAINS (+${shieldGain} SHIELD)`,
        color: '#fda4af',
        fontSize: 16,
        life: 1.0,
        maxLife: 1.0,
        vy: -26
      });
    } else if (sk.id === 'dr_s3') {
      // DEMON RAISED SKILL 3: Infernal Abyss Eruption
      this.addDemonEssence(4);
      const hellfireMult = this.acquiredAttributes.has('attr_hellfire_crown') ? 1.35 : 1.0;
      const pillarCount = this.unlockedTraits.has('dr_s3_u1') ? 8 : 5;
      const isTrue = this.unlockedTraits.has('dr_s3_u1');
      const hasTremor = this.unlockedTraits.has('dr_s3_u2');
      const sortedTargets = [...this.enemies].sort((a, b) =>
        Math.hypot(a.x - this.playerPos.x, a.y - this.playerPos.y) - Math.hypot(b.x - this.playerPos.x, b.y - this.playerPos.y)
      );

      for (let p = 0; p < pillarCount; p++) {
        const focus = sortedTargets.length > 0 ? sortedTargets[p % sortedTargets.length] : null;
        const px = focus
          ? Math.max(40, Math.min(this.width - 40, focus.x + (Math.random() - 0.5) * 48))
          : Math.max(40, Math.min(this.width - 40, this.playerPos.x + (Math.random() - 0.5) * 230));
        const py = focus
          ? Math.max(40, Math.min(this.height - 40, focus.y + (Math.random() - 0.5) * 48))
          : Math.max(40, Math.min(this.height - 40, this.playerPos.y + (Math.random() - 0.5) * 230));

        this.telegraphs.push({
          x: px,
          y: py,
          radius: 115,
          timer: 0,
          maxTimer: 0.16 + p * 0.10,
          color: '#e11d48',
          onTrigger: () => {
            sounds.playExplosion();
            this.cameraShake = 8;
            this.createShockwave(px, py, '#e11d48', 115);
            this.createShockwave(px, py, '#f97316', 75);
            for (const e of this.enemies) {
              if (e.hp > 0 && Math.hypot(e.x - px, e.y - py) <= 115) {
                const isCrit = Math.random() < this.player.critChance;
                const dmg = this.player.atk * 2.10 * hellfireMult * (isCrit ? this.player.critDmg : 1.0);
                e.takeDamage(dmg, isCrit, isTrue ? 'true_damage' : 'player', this);
                if (hasTremor) {
                  e.stunTimer = Math.max(e.stunTimer, 1.0);
                  e.frostSlowTimer = Math.max(e.frostSlowTimer, 2.0);
                }
              }
            }
          }
        });
      }

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 36,
        text: `🌋 INFERNAL ABYSS ERUPTION (x${pillarCount})!`,
        color: '#e11d48',
        fontSize: 17,
        life: 1.1,
        maxLife: 1.1,
        vy: -28
      });
    } else if (sk.id === 'dr_s4') {
      // DEMON RAISED SKILL 4: Risen Archfiend Ascension
      const dur = this.unlockedTraits.has('dr_s4_u1') ? 12.0 : 9.0;
      const cap = this.acquiredAttributes.has('attr_hellfire_crown') ? 40 : 25;
      const hellfireMult = this.acquiredAttributes.has('attr_hellfire_crown') ? 1.35 : 1.0;

      this.player.demonAwakenTimer = dur;
      this.player.demonEssence = cap;
      this.demonAuraTimer = 0;
      this.demonMeteorTimer = 0;

      sounds.playTimeStop();
      sounds.playExplosion();
      this.cameraShake = 18;
      this.hitstopTimer = 0.09;
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#e11d48', 260);
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#fb7185', 180);

      for (const e of this.enemies) {
        if (e.hp > 0 && Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 260) {
          const isCrit = Math.random() < this.player.critChance;
          const novaDmg = this.player.atk * 3.50 * hellfireMult * (isCrit ? this.player.critDmg : 1.0);
          e.takeDamage(novaDmg, isCrit, 'true_damage', this);
          e.stunTimer = Math.max(e.stunTimer, 1.1);
        }
      }

      this.recalculateStats();
      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 46,
        text: `👹 RISEN ARCHFIEND ASCENSION (${dur}s)!`,
        color: '#fb7185',
        fontSize: 21,
        life: 1.6,
        maxLife: 1.6,
        vy: -32
      });
    }
  }

  private addPlayerSpatialZone(zone: SpatialZone) {
    if (this.acquiredAttributes.has('attr_reality_edict')) {
      zone.radius = Math.round(zone.radius * 1.35);
      zone.duration += 2.0;
      zone.maxDuration += 2.0;
    }
    this.spatialZones.push(zone);
  }

  private triggerChronoParadoxPulse() {
    const radius = 175;
    const pulseDmg = this.player.atk * 1.70;
    this.createShockwave(this.playerPos.x, this.playerPos.y, '#22d3ee', radius);
    sounds.playSkill('warp');
    for (const e of this.enemies) {
      if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= radius) {
        e.takeDamage(pulseDmg, true, 'true_damage', this);
      }
    }
    for (let i = 0; i < this.activeSkills.length; i++) {
      if (this.player.skillCDs[i] > 0) {
        this.player.skillCDs[i] = Math.max(0, this.player.skillCDs[i] - 0.5);
      }
    }
  }

  public tryTriggerCryoLanceBurst(cx: number, cy: number) {
    if (this.acquiredAttributes.has('attr_cryo_bastion') && this.cryoBastionCd <= 0) {
      this.cryoBastionCd = 1.0;
      this.triggerCryoLanceBurst(cx, cy);
    }
  }

  private triggerCryoLanceBurst(cx: number, cy: number) {
    const lances = 6;
    const lanceDmg = this.player.atk * 1.15;
    this.createShockwave(cx, cy, '#7dd3fc', 100);
    for (let i = 0; i < lances; i++) {
      const ang = (i * Math.PI * 2) / lances;
      this.projectiles.push(new ProjectileEntity(
        cx,
        cy,
        cx + Math.cos(ang) * 320,
        cy + Math.sin(ang) * 320,
        540,
        lanceDmg,
        false,
        '#7dd3fc',
        'player'
      ));
    }
    for (const e of this.enemies) {
      if (Math.hypot(e.x - cx, e.y - cy) <= 130) {
        e.frostSlowTimer = Math.max(e.frostSlowTimer, 2.0);
      }
    }
  }

  private triggerRiftBlinkSlash(x: number, y: number) {
    const slashRadius = 135;
    const slashDmg = this.player.atk * 1.65;
    this.createShockwave(x, y, '#22d3ee', slashRadius);
    for (const e of this.enemies) {
      if (Math.hypot(e.x - x, e.y - y) <= slashRadius) {
        e.takeDamage(slashDmg, true, 'true_damage', this);
        if (this.heroKey === 'rift_walker') {
          this.applyRiftMark(e);
        }
      }
    }
    this.player.riftWarpBuffTimer = Math.min(5.0, Math.max(this.player.riftWarpBuffTimer || 0, 2.5) + 1.5);
    this.activatePhantomPhase();
    this.recalculateStats();
  }

  private applyRiftMark(target: EnemyEntity) {
    if (this.heroKey !== 'rift_walker' || target.hp <= 0) return;
    target.riftMarks = (target.riftMarks || 0) + 1;
    if (target.riftMarks >= 3) {
      target.riftMarks = 0;
      const ruptureRadius = 115;
      this.createShockwave(target.x, target.y, '#38bdf8', ruptureRadius);
      sounds.playExplosion();
      for (const e of this.enemies) {
        if (e.hp > 0 && Math.hypot(e.x - target.x, e.y - target.y) <= ruptureRadius) {
          e.takeDamage(this.player.atk * 1.20, false, 'true_damage', this);
        }
      }
      this.floatingTexts.push({
        x: target.x,
        y: target.y - 30,
        text: '💥 RIFT RUPTURE!',
        color: '#38bdf8',
        fontSize: 16,
        life: 0.75,
        maxLife: 0.75,
        vy: -26
      });
    }
  }

  private onRiftWalkerBlink(x: number, y: number) {
    if (this.heroKey !== 'rift_walker') return;
    for (let i = 0; i < this.activeSkills.length; i++) {
      if (this.player.skillCDs[i] > 0) {
        this.player.skillCDs[i] = Math.max(0, this.player.skillCDs[i] - 0.2);
      }
    }
    if (this.riftCounterSlashCd <= 0) {
      this.riftCounterSlashCd = 0.65;
      const counterRadius = 110;
      this.createShockwave(x, y, '#67e8f9', counterRadius);
      for (const e of this.enemies) {
        if (e.hp > 0 && Math.hypot(e.x - x, e.y - y) <= counterRadius) {
          e.takeDamage(this.player.atk * 0.65, false, 'true_damage', this);
        }
      }
    }
  }

  private triggerDecoySupernova(x: number, y: number) {
    const novaRadius = 140;
    this.createShockwave(x, y, '#22d3ee', novaRadius);
    this.createShockwave(x, y, '#0ea5e9', 90);
    sounds.playExplosion();
    for (const e of this.enemies) {
      if (e.hp > 0 && Math.hypot(e.x - x, e.y - y) <= novaRadius) {
        const sCrit = Math.random() < this.player.critChance;
        e.takeDamage(this.player.atk * 1.35 * (sCrit ? this.player.critDmg : 1.0), sCrit, 'true_damage', this);
        e.stunTimer = Math.max(e.stunTimer, 0.9);
        e.frostSlowTimer = Math.max(e.frostSlowTimer, 2.0);
      }
    }
  }

  private activatePhantomPhase() {
    if (this.acquiredAttributes.has('attr_void_assassin_seal')) {
      this.phantomPhaseTimer = 2.5;
      this.recalculateStats();
    }
  }

  private triggerOvercharge() {
    const targets = [...this.enemies].sort((a, b) => {
      const da = Math.hypot(a.x - this.playerPos.x, a.y - this.playerPos.y);
      const db = Math.hypot(b.x - this.playerPos.x, b.y - this.playerPos.y);
      return da - db;
    }).slice(0, 4);

    const boltDmg = 180 + this.player.atk * 1.2;
    for (const t of targets) {
      this.createLightningChain(this.playerPos.x, this.playerPos.y, t.x, t.y, '#38bdf8');
      t.takeDamage(boltDmg, true, 'player', this);
    }
    sounds.playSkill('thunder');
  }

  public addWarArmorStack(amount: number = 2) {
    if (this.warArmorBonusDef >= 100) return;
    const gain = Math.min(amount, 100 - this.warArmorBonusDef);
    this.warArmorBonusDef += gain;
    this.player.defense += gain;
    this.player.warArmorBonusDef = this.warArmorBonusDef;
    for (const c of this.clones) {
      c.defense = Math.round(this.player.defense * c.getInheritedStatRatio());
    }
  }

  public damagePlayer(amount: number) {
    if (this.player.isTimeStopActive) return;

    const isPossessing = (this.player.puppetPossessTimer ?? 0) > 0;
    if (this.player.isInvulnerable || isPossessing || this.phoenixInvulnTimer > 0 || this.travelerInvulnTimer > 0 || this.riftInvulnTimer > 0) {
      if (this.invulnPopupCd <= 0) {
        this.invulnPopupCd = 0.40;
        const label = isPossessing
          ? '👻 POSSESSED (IMMUNE)'
          : this.phoenixInvulnTimer > 0
          ? '🔥 PHOENIX SHIELD!'
          : this.travelerInvulnTimer > 0
          ? '⏳ CHRONO STASIS!'
          : 'PHASED!';
        this.addRelicFloatingText({
          x: this.playerPos.x,
          y: this.playerPos.y,
          text: label,
          color: this.phoenixInvulnTimer > 0 ? '#f97316' : '#22d3ee',
          fontSize: 12,
          life: 0.6,
          maxLife: 0.6,
          vy: 14
        });
      }
      return;
    }

    // Evasion check
    if (Math.random() < this.player.evasion) {
      this.activatePhantomPhase();
      if (this.heroKey === 'rift_walker') {
        this.onRiftWalkerBlink(this.playerPos.x, this.playerPos.y);
      }
      if (this.acquiredAttributes.has('attr_abyssal_pinion')) {
        const dodgeTarget = this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
        if (dodgeTarget) {
          this.triggerEclipsePinionBolt(dodgeTarget.x, dodgeTarget.y);
        }
      }
      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 20,
        text: 'DODGE!',
        color: '#67e8f9',
        fontSize: 16,
        life: 0.6,
        maxLife: 0.6,
        vy: -20
      });
      return;
    }

    // Astral Mirror Barrier: negates 100% of next hit and reflects 300% ATK back
    if (this.mirrorWardReady) {
      this.mirrorWardReady = false;
      this.mirrorWardTimer = 0;
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#e2e8f0', 130);
      sounds.playSkill('buff');
      const attacker = this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
      if (attacker && Math.hypot(attacker.x - this.playerPos.x, attacker.y - this.playerPos.y) <= 320) {
        this.createLaserBeam(this.playerPos.x, this.playerPos.y, attacker.x, attacker.y, '#e2e8f0', 8);
        attacker.takeDamage(this.player.atk * 3.0, true, 'true_damage', this);
      }
      this.addRelicFloatingText({
        x: this.playerPos.x,
        y: this.playerPos.y,
        text: '🪞 MIRROR REFLECT!',
        color: '#f8fafc',
        fontSize: 12,
        life: 0.85,
        maxLife: 0.85,
        vy: 16
      });
      return;
    }

    // War armor: +2 Defense per hit, strictly capped at a maximum of +100 bonus Defense
    if (this.player.warArmorActive && this.warArmorBonusDef < 100) {
      this.addWarArmorStack(2);
    }

    // Defense reduction
    let finalDmg = Math.max(1, amount - this.player.defense * 0.25);

    // Valkyrie Frost Cryo Plating (-18% incoming damage while Permafrost Ice Shield active) & Cryo Thorns reflect
    if (this.heroKey === 'valkyrie' && (this.player.frostArmorShield ?? 0) > 0) {
      finalDmg *= 0.82;
      if (this.unlockedTraits.has('v_s3_u1')) {
        const attacker = this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
        if (attacker && Math.hypot(attacker.x - this.playerPos.x, attacker.y - this.playerPos.y) <= 240) {
          attacker.frostSlowTimer = Math.max(attacker.frostSlowTimer, 2.0);
          attacker.takeDamage(this.player.atk * 0.65, false, 'true_damage', this);
        }
      }
    }

    // Monkey King Immortal Vajra Body built-in 25% incoming damage reduction
    if (this.heroKey === 'monkey') {
      finalDmg *= 0.75;
    }

    // Rift Walker Quantum Warp built-in 15% incoming damage reduction while Warp Buff active
    if (this.heroKey === 'rift_walker' && (this.player.riftWarpBuffTimer ?? 0) > 0) {
      finalDmg *= 0.85;
    }

    // Fallen Angel Eclipse Grace: -20% damage taken when HP < 45%
    if (this.heroKey === 'fallen_angel' && (this.player.hp / this.player.maxHp < 0.45)) {
      finalDmg *= 0.80;
    }

    // Demon Raised Demonic Resurgence & Ascension damage reduction
    if (this.heroKey === 'demon_raised') {
      if ((this.player.demonAwakenTimer ?? 0) > 0) {
        finalDmg *= 0.75;
      } else if ((this.player.demonEssence ?? 0) >= 10 || (this.player.hp / this.player.maxHp < 0.50)) {
        finalDmg *= 0.82;
      }
    }

    // Abyssal Pact Chains Relic: -18% damage taken when HP < 65%
    if (this.acquiredAttributes.has('attr_infernal_shackles') && (this.player.hp / this.player.maxHp < 0.65)) {
      finalDmg *= 0.82;
    }

    // Sacred Guardian Spirit (20% permanent damage reduction)
    if (this.acquiredAttributes.has('attr_guardian_spirit')) {
      finalDmg *= 0.80;
    }

    // Obsidian Bulwark Heart (-12% damage taken from Bosses)
    if (this.acquiredAttributes.has('attr_obsidian_heart') && this.currentBoss && Math.hypot(this.currentBoss.x - this.playerPos.x, this.currentBoss.y - this.playerPos.y) <= 450) {
      finalDmg *= 0.88;
    }

    // Spiked Obsidian Armor (Thornmail): Reflect 50% incoming damage as True Damage to closest enemy
    if (this.acquiredAttributes.has('attr_thornmail')) {
      const attacker = this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
      if (attacker && Math.hypot(attacker.x - this.playerPos.x, attacker.y - this.playerPos.y) <= 220) {
        attacker.takeDamage(Math.max(5, amount * 0.50), false, 'true_damage', this);
      }
    }

    // Glacial Mirror Prism: slows attacking enemy (-30% Speed 2.5s) & deals 85% ATK Ice Counter
    if (this.acquiredAttributes.has('attr_frost_prism') && this.frostPrismCd <= 0) {
      const attacker = this.getClosestEnemy(this.playerPos.x, this.playerPos.y);
      if (attacker && Math.hypot(attacker.x - this.playerPos.x, attacker.y - this.playerPos.y) <= 280) {
        this.frostPrismCd = 0.35;
        attacker.frostSlowTimer = Math.max(attacker.frostSlowTimer, 2.5);
        attacker.takeDamage(this.player.atk * 0.85, false, 'player', this);
        this.createShockwave(attacker.x, attacker.y, '#7dd3fc', 55);
      }
    }

    // Fallen Angel Wings (low HP damage reduction)
    if (this.player.fallenWingsActive && (this.player.hp / this.player.maxHp < 0.25)) {
      finalDmg *= 0.55;
    }

    // Frostbite Lance Core counter-burst when hit while any Shield is active
    if ((this.aegisShield > 0 || (this.player.frostArmorShield ?? 0) > 0) && this.acquiredAttributes.has('attr_cryo_bastion') && this.cryoBastionCd <= 0) {
      this.cryoBastionCd = 1.0;
      this.triggerCryoLanceBurst(this.playerPos.x, this.playerPos.y);
    }

    // Titan Aegis Shield absorption
    if (this.aegisShield > 0) {
      const absorbed = Math.min(this.aegisShield, finalDmg);
      this.aegisShield -= absorbed;
      finalDmg -= absorbed;
      this.addRelicFloatingText({
        x: this.playerPos.x,
        y: this.playerPos.y,
        text: `🛡️ -${Math.round(absorbed)}`,
        color: '#38bdf8',
        fontSize: 11,
        life: 0.55,
        maxLife: 0.55,
        vy: 14
      });
      if (finalDmg <= 0) return;
    }

    // Valkyrie Frost Permafrost Ice Shield absorption
    if ((this.player.frostArmorShield ?? 0) > 0) {
      const absorbed = Math.min(this.player.frostArmorShield!, finalDmg);
      this.player.frostArmorShield! -= absorbed;
      finalDmg -= absorbed;
      this.addRelicFloatingText({
        x: this.playerPos.x,
        y: this.playerPos.y,
        text: `❄️ -${Math.round(absorbed)}`,
        color: '#7dd3fc',
        fontSize: 11,
        life: 0.55,
        maxLife: 0.55,
        vy: 14
      });
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#38bdf8', 40);
      if ((this.player.frostArmorShield ?? 0) <= 0) {
        this.player.frostArmorShield = 0;
        this.recalculateStats();
      }
      if (finalDmg <= 0) return;
    }

    this.player.hp -= finalDmg;
    this.totalDamageTaken += finalDmg;

    this.addStaggeredFloatingText({
      x: this.playerPos.x,
      y: this.playerPos.y - 24,
      text: `-${Math.round(finalDmg)}`,
      color: '#f87171',
      fontSize: 16,
      life: 0.72,
      maxLife: 0.72,
      vy: -32,
      isDamage: true
    });

    this.cameraShake = 4;
    sounds.playHit(false);

    // Check lethal damage
    if (this.player.hp <= 0) {
      // Monkey King 72-Form Hair Substitution (Cheat-death save: 45% HP + 2.0s Invuln + Clone Swap/Summon, CD 40s)
      if (this.heroKey === 'monkey' && this.monkeySubCd <= 0) {
        this.monkeySubCd = 40;
        this.player.monkeySubCd = 40;
        this.phoenixInvulnTimer = Math.max(this.phoenixInvulnTimer, 2.0);
        this.player.hp = Math.round(this.player.maxHp * 0.45);
        this.aegisShield = Math.max(this.aegisShield, 150);

        const activeClone = this.clones.find(c => !c.isRiftDecoy && c.hp > 0);
        const blastX = this.playerPos.x;
        const blastY = this.playerPos.y;
        if (activeClone) {
          this.playerPos.x = Math.max(40, Math.min(this.width - 40, activeClone.x));
          this.playerPos.y = Math.max(40, Math.min(this.height - 40, activeClone.y));
          activeClone.x = blastX;
          activeClone.y = blastY;
        } else {
          this.clones.push(new CloneEntity(this.playerPos.x + 35, this.playerPos.y + 35, this));
        }

        this.createShockwave(blastX, blastY, '#fbbf24', 185);
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#f59e0b', 140);
        sounds.playSkill('buff');
        this.cameraShake = 12;

        for (const e of this.enemies) {
          if (Math.hypot(e.x - blastX, e.y - blastY) <= 185) {
            e.takeDamage(this.player.atk * 1.20, true, 'true_damage', this);
            e.stunTimer = Math.max(e.stunTimer, 1.2);
          }
        }

        this.floatingTexts.push({
          x: this.playerPos.x,
          y: this.playerPos.y - 42,
          text: '🐒 72-FORM SUBSTITUTION! (+45% HP)',
          color: '#fde047',
          fontSize: 20,
          life: 1.6,
          maxLife: 1.6,
          vy: -30
        });
      } else if (this.heroKey === 'traveler' && !this.hasUsedRampage) {
        this.hasUsedRampage = true;
        this.player.travelerRewindReady = false;
        this.player.travelerKillsRecharge = 0;
        this.player.isTimeStopActive = true;

        // Memutar balikkan waktu sebanyak musuh yang dikill Traveler:
        const killsCount = this.kills;
        const dur = Math.min(12.0, 5.0 + killsCount * 0.1);
        this.player.timeStopTimer = dur;
        this.recalculateStats();

        // 1. Memutar balik HP (Rewind Health): memulihkan HP berdasarkan jumlah musuh yang dikill!
        const hpPerKill = 18;
        const baseHeal = this.player.maxHp * 0.40;
        const totalRewindHp = Math.min(this.player.maxHp, baseHeal + (killsCount * hpPerKill));
        this.player.hp = Math.round(totalRewindHp);

        // 2. Putar balik waktu cooldown semua skill (reset instant)
        for (let i = 0; i < this.activeSkills.length; i++) {
          this.player.skillCDs[i] = 0;
        }

        // 3. Putar balik waktu bertahan (Clock Rollback)
        const secondsRewound = Math.min(60, killsCount * 1.5);
        this.timeSurvived = Math.max(0, this.timeSurvived - secondsRewound);

        // 4. Putar balik dan pukul mundur seluruh musuh ke tepi arena
        for (const e of this.enemies) {
          e.stunTimer = dur;
          const ang = Math.atan2(e.y - this.playerPos.y, e.x - this.playerPos.x);
          const pushDist = 150 + Math.min(220, killsCount * 4);
          e.x += Math.cos(ang) * pushDist;
          e.y += Math.sin(ang) * pushDist;
        }

        // 5. Efek audio visual pemutarbalikan waktu kosmik
        sounds.playTimeStop();
        this.cameraShake = 20;
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#06b6d4', 280);
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#f59e0b', 180);

        this.floatingTexts.push({
          x: this.playerPos.x,
          y: this.playerPos.y - 60,
          text: `⏳ TIME STOP BERSERK: TIME REVERSAL!`,
          color: '#38bdf8',
          fontSize: 24,
          life: 2.2,
          maxLife: 2.2,
          vy: -35
        });

        this.floatingTexts.push({
          x: this.playerPos.x,
          y: this.playerPos.y - 25,
          text: `⏪ REWOUND ${killsCount} KILLS: +${Math.round(totalRewindHp)} HP & -${Math.round(secondsRewound)}s!`,
          color: '#facc15',
          fontSize: 17,
          life: 2.2,
          maxLife: 2.2,
          vy: -25
        });
      } else if (this.heroKey === 'demon_raised' && this.demonRebirthCd <= 0) {
        // Demon Raised Passive: Abyssal Rebirth (Cheat-death save: 45% HP + 1.8s Invuln + Hellfire Nova, CD 45s)
        const hellfireMult = this.acquiredAttributes.has('attr_hellfire_crown') ? 1.35 : 1.0;
        this.demonRebirthCd = 45;
        this.player.demonRebirthCd = 45;
        this.phoenixInvulnTimer = Math.max(this.phoenixInvulnTimer, 1.8);
        this.player.hp = Math.round(this.player.maxHp * 0.45);
        this.addDemonEssence(10);

        this.createShockwave(this.playerPos.x, this.playerPos.y, '#e11d48', 240);
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#f97316', 165);
        sounds.playExplosion();
        this.cameraShake = 16;

        for (const e of this.enemies) {
          if (e.hp > 0 && Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 240) {
            e.takeDamage(this.player.atk * 2.60 * hellfireMult, true, 'true_damage', this);
            e.stunTimer = Math.max(e.stunTimer, 1.2);
          }
        }

        this.floatingTexts.push({
          x: this.playerPos.x,
          y: this.playerPos.y - 44,
          text: '👹 ABYSSAL REBIRTH! (+45% HP)',
          color: '#fb7185',
          fontSize: 21,
          life: 1.7,
          maxLife: 1.7,
          vy: -30
        });
      } else if (this.acquiredAttributes.has('attr_phoenix_ember') && !this.phoenixReviveUsed) {
        this.phoenixReviveUsed = true;
        this.phoenixInvulnTimer = 2.5;
        this.player.hp = Math.round(this.player.maxHp * 0.55);
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#f97316', 240);
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#facc15', 160);
        sounds.playExplosion();
        this.cameraShake = 16;
        for (const e of this.enemies) {
          if (Math.hypot(e.x - this.playerPos.x, e.y - this.playerPos.y) <= 240) {
            e.takeDamage(this.player.atk * 2.5, true, 'player', this);
            e.stunTimer = Math.max(e.stunTimer, 1.5);
          }
        }
        this.addRelicFloatingText({
          x: this.playerPos.x,
          y: this.playerPos.y,
          text: '🔥 PHOENIX REBIRTH! (+55% HP)',
          color: '#fb923c',
          fontSize: 12,
          life: 1.2,
          maxLife: 1.2,
          vy: 16
        });
      } else if (this.practiceMode && this.practiceGodMode) {
        this.player.hp = this.player.maxHp;
        this.phoenixInvulnTimer = Math.max(this.phoenixInvulnTimer, 0.75);
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#34d399', 110);
        this.floatingTexts.push({
          x: this.playerPos.x,
          y: this.playerPos.y - 36,
          text: '🛡️ PRACTICE GOD MODE (+100% HP)',
          color: '#34d399',
          fontSize: 16,
          life: 1.1,
          maxLife: 1.1,
          vy: -26
        });
      } else {
        this.triggerGameOver();
      }
    }
  }

  public healPlayer(amount: number) {
    const prevHp = this.player.hp;
    const rawNewHp = prevHp + amount;
    const overflow = Math.max(0, rawNewHp - this.player.maxHp);
    this.player.hp = Math.min(this.player.maxHp, rawNewHp);
    const healed = this.player.hp - prevHp;

    // Eternal Blood Chalice: convert overheal into shield up to 350 HP
    if (overflow > 0 && this.acquiredAttributes.has('attr_blood_chalice') && this.aegisShield < 350) {
      this.aegisShield = Math.min(350, this.aegisShield + overflow);
    }

    if (healed > 0) {
      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 20,
        text: `+${Math.round(healed)}`,
        color: '#4ade80',
        fontSize: 16,
        life: 0.6,
        maxLife: 0.6,
        vy: -20
      });
    }
  }

  public addExp(amount: number) {
    let expMult = 1.0;
    if (this.acquiredAttributes.has('attr_soul_magnet')) expMult += 0.35;
    if (this.acquiredAttributes.has('attr_golden_crown')) expMult += 0.45;
    if (this.acquiredAttributes.has('attr_mystic_orb')) expMult += 0.25;
    this.player.exp += Math.round(amount * expMult);
    if (this.player.exp >= this.player.maxExp) {
      this.player.level++;
      this.player.exp -= this.player.maxExp;
      this.player.maxExp = Math.round(this.player.maxExp * 1.45);

      if (this.acquiredAttributes.has('attr_mystic_orb')) {
        this.player.hp = this.player.maxHp;
        for (let i = 0; i < this.player.skillCDs.length; i++) {
          this.player.skillCDs[i] = 0;
        }
      }

      sounds.playLevelUp();
      this.createShockwave(this.playerPos.x, this.playerPos.y, '#facc15', 120);

      this.floatingTexts.push({
        x: this.playerPos.x,
        y: this.playerPos.y - 40,
        text: `LEVEL UP! LV. ${this.player.level}`,
        color: '#facc15',
        fontSize: 22,
        life: 1.2,
        maxLife: 1.2,
        vy: -30
      });

      if (this.practiceMode) {
        this.recalculateStats();
        return;
      }

      this.isPaused = true;
      if (this.onLevelUpTrigger) {
        this.onLevelUpTrigger(this.player.level);
      }
    }
  }

  public applySkillUpgrade(traitId: string) {
    if (traitId === 'default_mastery') {
      this.bonusAtk += Math.round(this.heroConfig.atk * 0.15);
      this.bonusAtkSpeed += 0.10;
    } else {
      this.unlockedTraits.add(traitId);
    }
    this.recalculateStats();
    this.isPaused = false;
  }

  public applyAttribute(attrId: string) {
    this.acquiredAttributes.add(attrId);
    this.attributeCounts.set(attrId, (this.attributeCounts.get(attrId) ?? 0) + 1);
    this.applyAttributeEffects(attrId, false);
    this.recalculateStats();
    this.isPaused = false;
  }

  private applyAttributeEffects(attrId: string, silent: boolean = false) {

    if (attrId === 's_hp') {
      this.player.maxHp += 240;
      this.healPlayer(180);
      for (const c of this.clones) {
        const r = c.getInheritedStatRatio();
        c.maxHp += Math.round(240 * r);
        c.hp = Math.min(c.maxHp, c.hp + Math.round(180 * r));
      }
    } else if (attrId === 's_atk') {
      this.bonusAtk += 34;
    } else if (attrId === 's_crit') {
      this.bonusCritChance += 0.18;
      this.bonusCritDmg += 0.55;
    } else if (attrId === 's_speed') {
      this.bonusSpeed += 45;
      this.bonusAtkSpeed += 0.25;
    } else if (attrId === 'attr_monkey_wpn') {
      this.bonusAtkSpeed += 0.12;
    } else if (attrId === 'attr_burst_crit') {
      this.player.burstCritActive = true;
    } else if (attrId === 'attr_fallen_wings') {
      this.player.fallenWingsActive = true;
    } else if (attrId === 'attr_magic_destro') {
      this.player.magicDestroActive = true;
    } else if (attrId === 'attr_war_armor') {
      this.player.warArmorActive = true;
      this.bonusCdr += 0.20;
    } else if (attrId === 'attr_soul_magnet') {
      this.player.soulMagnetRange += 200;
    } else if (attrId === 'attr_vampiric_embrace') {
      this.bonusLifesteal += 0.22;
    } else if (attrId === 'attr_shield_aegis') {
      this.aegisShield = 380;
      for (const c of this.clones) {
        c.aegisShield = 380;
      }
      if (!silent) {
        this.addRelicFloatingText({
          x: this.playerPos.x,
          y: this.playerPos.y,
          text: 'TITAN AEGIS (+380 SHIELD)',
          color: '#38bdf8',
          fontSize: 12,
          life: 0.9,
          maxLife: 0.9,
          vy: 16
        });
      }
    } else if (attrId === 'attr_chronos_hourglass') {
      this.bonusCdr += 0.25;
      this.bonusSpeed += 40;
    } else if (attrId === 'attr_iron_fortress') {
      this.bonusDefense += 24;
      this.player.maxHp += 180;
      this.healPlayer(180);
      for (const c of this.clones) {
        const r = c.getInheritedStatRatio();
        c.maxHp += Math.round(180 * r);
        c.hp = Math.min(c.maxHp, c.hp + Math.round(180 * r));
      }
    } else if (attrId === 'attr_sniper_scope') {
      this.bonusRange += 85;
      this.bonusCritChance += 0.16;
    } else if (attrId === 'attr_blood_crescent') {
      this.bonusAtk += 36;
      this.bonusCritDmg += 0.35;
    } else if (attrId === 'attr_wind_dancer') {
      this.bonusSpeed += 65;
      this.bonusAtkSpeed += 0.30;
      this.bonusEvasion += 0.12;
    } else if (attrId === 'attr_quantum_prism') {
      this.bonusAtk += 35;
      this.bonusAtkSpeed += 0.30;
      this.bonusCritChance += 0.16;
      this.bonusCritDmg += 0.45;
      this.bonusCdr += 0.15;
    } else if (attrId === 'attr_thornmail') {
      this.bonusDefense += 22;
    } else if (attrId === 'attr_phantom_cloak') {
      this.bonusEvasion += 0.20;
      this.bonusSpeed += 30;
    } else if (attrId === 'attr_jade_vitality') {
      this.player.maxHp += 380;
      this.healPlayer(380);
      for (const c of this.clones) {
        const r = c.getInheritedStatRatio();
        c.maxHp += Math.round(380 * r);
        c.hp = Math.min(c.maxHp, c.hp + Math.round(380 * r));
      }
    } else if (attrId === 'attr_arcane_battery') {
      this.bonusCdr += 0.22;
    } else if (attrId === 'attr_golden_crown') {
      this.player.soulMagnetRange += 100;
    } else if (attrId === 'attr_clone_overlord') {
      this.bonusAtkSpeed += 0.25;
      this.bonusLifesteal += 0.15;
    } else if (attrId === 'attr_mirror_ward') {
      this.mirrorWardReady = true;
      this.mirrorWardTimer = 0;
    } else if (attrId === 'attr_berserk_totem') {
      this.berserkTotemStacks++;
    } else if (attrId === 'attr_titan_heart') {
      this.titanHeartStacks++;
      this.bonusDefense += 30;
      this.player.maxHp += 500;
      this.healPlayer(500);
      for (const c of this.clones) {
        const r = c.getInheritedStatRatio();
        c.maxHp += Math.round(500 * r);
        c.hp = Math.min(c.maxHp, c.hp + Math.round(500 * r));
      }
    } else if (attrId === 'attr_doom_scythe') {
      this.bonusCritChance += 0.25;
      this.bonusCritDmg += 0.50;
    } else if (attrId === 'attr_chrono_pendulum') {
      this.bonusCdr += 0.18;
      this.bonusAtkSpeed += 0.22;
    } else if (attrId === 'attr_temporal_compass') {
      this.bonusAtk += 35;
      this.bonusLifesteal += 0.12;
    } else if (attrId === 'attr_permafrost_crown') {
      this.bonusDefense += 24;
      this.player.maxHp += 280;
      this.healPlayer(280);
      this.player.frostArmorShield = Math.min(1000, (this.player.frostArmorShield || 0) + 200);
      for (const c of this.clones) {
        const r = c.getInheritedStatRatio();
        c.maxHp += Math.round(280 * r);
        c.hp = Math.min(c.maxHp, c.hp + Math.round(280 * r));
      }
    } else if (attrId === 'attr_cryo_bastion') {
      this.bonusAtk += 30;
      this.bonusAtkSpeed += 0.20;
    } else if (attrId === 'attr_reality_edict') {
      this.bonusAtk += 32;
      this.bonusCdr += 0.18;
    } else if (attrId === 'attr_singularity_prism') {
      this.bonusAtk += 28;
      this.bonusCritDmg += 0.20;
      this.bonusSpeed += 25;
    } else if (attrId === 'attr_quantum_echo') {
      this.bonusCritChance += 0.18;
      this.bonusCritDmg += 0.40;
      this.bonusEvasion += 0.10;
    } else if (attrId === 'attr_void_assassin_seal') {
      this.bonusAtkSpeed += 0.25;
      this.bonusSpeed += 35;
      this.bonusEvasion += 0.15;
    } else if (attrId === 'attr_solar_core') {
      this.bonusAtk += 35;
      this.bonusCritChance += 0.15;
    } else if (attrId === 'attr_ember_greaves') {
      this.bonusSpeed += 45;
      this.bonusAtkSpeed += 0.22;
      this.bonusCdr += 0.15;
    } else if (attrId === 'attr_crimson_vortex') {
      this.bonusAtk += 28;
      this.bonusLifesteal += 0.10;
    } else if (attrId === 'attr_obsidian_heart') {
      this.bonusDefense += 28;
      this.player.maxHp += 320;
      this.healPlayer(320);
      for (const c of this.clones) {
        const r = c.getInheritedStatRatio();
        c.maxHp += Math.round(320 * r);
        c.hp = Math.min(c.maxHp, c.hp + Math.round(320 * r));
      }
    } else if (attrId === 'attr_storm_quiver') {
      this.bonusAtkSpeed += 0.25;
      this.bonusRange += 60;
    } else if (attrId === 'attr_astral_hourglass') {
      this.bonusCdr += 0.18;
      this.bonusSpeed += 20;
    } else if (attrId === 'attr_reaper_grasp') {
      this.bonusAtk += 32;
      this.bonusCritDmg += 0.35;
    } else if (attrId === 'attr_radiant_aegis') {
      this.bonusDefense += 20;
      this.player.maxHp += 200;
      this.healPlayer(200);
      for (const c of this.clones) {
        const r = c.getInheritedStatRatio();
        c.maxHp += Math.round(200 * r);
        c.hp = Math.min(c.maxHp, c.hp + Math.round(200 * r));
      }
    } else if (attrId === 'attr_venom_fang') {
      this.venomFangStacks++;
      this.bonusAtk += 22;
      this.bonusAtkSpeed += 0.12;
    } else if (attrId === 'attr_celestial_feather') {
      this.bonusSpeed += 35;
      this.bonusEvasion += 0.10;
      this.player.soulMagnetRange += 90;
    } else if (attrId === 'attr_iron_will') {
      this.ironWillStacks++;
      this.bonusDefense += 18;
      this.player.maxHp += 160;
      this.healPlayer(160);
      for (const c of this.clones) {
        const r = c.getInheritedStatRatio();
        c.maxHp += Math.round(160 * r);
        c.hp = Math.min(c.maxHp, c.hp + Math.round(160 * r));
      }
    } else if (attrId === 'attr_void_lens') {
      this.bonusCritChance += 0.14;
      this.bonusCritDmg += 0.40;
    } else if (attrId === 'attr_thunder_crown') {
      this.bonusAtk += 40;
      this.bonusCritChance += 0.25;
    } else if (attrId === 'attr_blood_chalice') {
      this.bonusLifesteal += 0.18;
      this.player.maxHp += 240;
      this.healPlayer(240);
      for (const c of this.clones) {
        const r = c.getInheritedStatRatio();
        c.maxHp += Math.round(240 * r);
        c.hp = Math.min(c.maxHp, c.hp + Math.round(240 * r));
      }
    } else if (attrId === 'attr_arcane_catalyst') {
      this.bonusCdr += 0.20;
      this.bonusAtk += 38;
    } else if (attrId === 'attr_frost_prism') {
      this.bonusDefense += 22;
      this.bonusEvasion += 0.12;
    } else if (attrId === 'attr_gravity_anchor') {
      this.bonusAtk += 25;
      this.player.maxHp += 180;
      this.healPlayer(180);
      for (const c of this.clones) {
        const r = c.getInheritedStatRatio();
        c.maxHp += Math.round(180 * r);
        c.hp = Math.min(c.maxHp, c.hp + Math.round(180 * r));
      }
    } else if (attrId === 'attr_berserk_claw') {
      this.berserkClawStacks++;
      this.bonusAtk += 26;
      this.bonusAtkSpeed += 0.18;
    } else if (attrId === 'attr_mystic_orb') {
      this.bonusCdr += 0.15;
      this.player.maxHp += 150;
      this.healPlayer(150);
      for (const c of this.clones) {
        const r = c.getInheritedStatRatio();
        c.maxHp += Math.round(150 * r);
        c.hp = Math.min(c.maxHp, c.hp + Math.round(150 * r));
      }
    } else if (attrId === 'attr_omega_annihilator') {
      this.bonusAtk += 50;
      this.bonusCritDmg += 0.30;
      this.bonusAtkSpeed += 0.20;
    } else if (attrId === 'attr_eclipse_halo') {
      this.bonusAtk += 34;
      this.bonusEvasion += 0.14;
      this.bonusLifesteal += 0.15;
    } else if (attrId === 'attr_abyssal_pinion') {
      this.bonusAtkSpeed += 0.24;
      this.bonusSpeed += 35;
      this.bonusCritChance += 0.15;
    } else if (attrId === 'attr_hellfire_crown') {
      this.bonusAtk += 38;
      this.bonusLifesteal += 0.12;
      this.player.maxHp += 280;
      this.healPlayer(280);
      for (const c of this.clones) {
        const r = c.getInheritedStatRatio();
        c.maxHp += Math.round(280 * r);
        c.hp = Math.min(c.maxHp, c.hp + Math.round(280 * r));
      }
    } else if (attrId === 'attr_infernal_shackles') {
      this.bonusDefense += 24;
      this.bonusAtkSpeed += 0.20;
      this.bonusCritDmg += 0.20;
    }
  }

  // --- PRACTICE MODE SANDBOX API ---
  public setPracticeRelicCount(attrId: string, targetCount: number) {
    const cleanCount = Math.max(0, Math.min(20, Math.floor(targetCount)));
    if (cleanCount === 0) {
      this.attributeCounts.delete(attrId);
      this.acquiredAttributes.delete(attrId);
    } else {
      this.attributeCounts.set(attrId, cleanCount);
      this.acquiredAttributes.add(attrId);
    }
    this.rebuildPracticeAttributes();
  }

  public togglePracticeRelic(attrId: string) {
    if (this.acquiredAttributes.has(attrId)) {
      this.setPracticeRelicCount(attrId, 0);
    } else {
      this.setPracticeRelicCount(attrId, 1);
    }
  }

  public clearPracticeRelics() {
    this.attributeCounts.clear();
    this.acquiredAttributes.clear();
    this.rebuildPracticeAttributes();
  }

  public rebuildPracticeAttributes() {
    const prevHpRatio = this.player.maxHp > 0 ? Math.min(1, Math.max(0.1, this.player.hp / this.player.maxHp)) : 1;
    this.player.maxHp = this.heroConfig.hp;
    this.player.soulMagnetRange = 140;
    this.player.burstCritActive = false;
    this.player.fallenWingsActive = false;
    this.player.magicDestroActive = false;
    this.player.warArmorActive = false;
    this.warArmorBonusDef = 0;
    this.player.warArmorBonusDef = 0;
    this.aegisShield = 0;
    this.player.aegisShield = 0;
    this.mirrorWardReady = false;
    this.mirrorWardTimer = 0;
    this.bonusAtk = 0;
    this.bonusAtkSpeed = 0;
    this.bonusSpeed = 0;
    this.bonusRange = 0;
    this.bonusDefense = 0;
    this.bonusCritChance = 0;
    this.bonusCritDmg = 0;
    this.bonusEvasion = 0;
    this.bonusLifesteal = 0;
    this.bonusCdr = 0;
    this.berserkTotemStacks = 0;
    this.titanHeartStacks = 0;
    this.venomFangStacks = 0;
    this.ironWillStacks = 0;
    this.berserkClawStacks = 0;

    for (const [id, count] of this.attributeCounts.entries()) {
      for (let i = 0; i < count; i++) {
        this.applyAttributeEffects(id, true);
      }
    }

    this.player.hp = Math.min(this.player.maxHp, Math.max(1, Math.round(this.player.maxHp * prevHpRatio)));
    this.recalculateStats();
    this.pushStatsUpdate();
  }

  public togglePracticeTrait(traitId: string) {
    if (this.unlockedTraits.has(traitId)) {
      this.unlockedTraits.delete(traitId);
    } else {
      this.unlockedTraits.add(traitId);
    }
    this.recalculateStats();
    this.pushStatsUpdate();
  }

  public setPracticeWaveLevel(waveNum: number) {
    this.practiceWaveLevel = Math.max(1, Math.min(50, Math.round(waveNum)));
    this.wave = this.practiceWaveLevel;
    this.pushStatsUpdate();
  }

  public spawnPracticeDummy(kind: 'static' | 'striker' = 'static', customX?: number, customY?: number) {
    const waveMult = 1 + (this.practiceWaveLevel - 1) * 0.35;
    const angle = Math.random() * Math.PI * 2;
    const x = customX ?? Math.max(60, Math.min(this.width - 60, this.playerPos.x + Math.cos(angle) * 165));
    const y = customY ?? Math.max(60, Math.min(this.height - 60, this.playerPos.y + Math.sin(angle) * 145));
    const dummyType = kind === 'static' ? 'dummy' : 'dummy_striker';
    const enemy = new EnemyEntity(x, y, dummyType, waveMult, false);
    this.enemies.push(enemy);
    this.createShockwave(x, y, kind === 'static' ? '#fbbf24' : '#fb7185', 55);
    this.pushStatsUpdate();
  }

  public spawnPracticeSwarm(count: number = 5) {
    const waveMult = 1 + (this.practiceWaveLevel - 1) * 0.35;
    const mobWaveMult = waveMult * (1 + Math.max(0, this.practiceWaveLevel - 1) * 0.12);
    for (let i = 0; i < count; i++) {
      const ang = (i / Math.max(1, count)) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 170 + Math.random() * 80;
      const ex = Math.max(40, Math.min(this.width - 40, this.playerPos.x + Math.cos(ang) * dist));
      const ey = Math.max(40, Math.min(this.height - 40, this.playerPos.y + Math.sin(ang) * dist));
      const types: ('crawler' | 'bandit' | 'wari')[] = ['crawler', 'bandit', 'wari'];
      const chosenType = types[i % types.length];
      this.enemies.push(new EnemyEntity(ex, ey, chosenType, mobWaveMult, false));
      this.createShockwave(ex, ey, '#ef4444', 40);
    }
    this.pushStatsUpdate();
  }

  public spawnPracticeBoss(
    bossType: 'wari' | 'dank' | 'shadow_assassin' | 'void_dragon' | 'corrupted_hero',
    corruptedHeroKey?: HeroKey
  ) {
    sounds.playBossAlert();
    const waveMult = 1 + (this.practiceWaveLevel - 1) * 0.35;
    const bossWaveMult = waveMult * 1.15;
    const bx = Math.max(80, Math.min(this.width - 80, this.width / 2 + (Math.random() - 0.5) * 120));
    const by = Math.max(90, Math.min(this.height - 90, 120));
    const boss = new EnemyEntity(bx, by, bossType, bossWaveMult, true, corruptedHeroKey);
    this.enemies.push(boss);
    this.currentBoss = boss;
    this.cameraShake = 10;
    this.createShockwave(bx, by, boss.color, 180);
    this.floatingTexts.push({
      x: bx,
      y: by - 45,
      text: `🧪 SPAWN: ${boss.name}`,
      color: boss.color,
      fontSize: 18,
      life: 1.8,
      maxLife: 1.8,
      vy: -20
    });
    this.pushStatsUpdate();
  }

  public clearPracticeEnemies() {
    this.enemies = [];
    this.currentBoss = null;
    this.telegraphs = [];
    this.spatialZones = [];
    this.projectiles = this.projectiles.filter(p => p.owner !== 'corrupted_hero');
    this.pushStatsUpdate();
  }

  public resetPracticeMetrics() {
    this.totalDamageDealt = 0;
    this.highestCrit = 0;
    this.totalDamageTaken = 0;
    this.kills = 0;
    this.damageSamples = [];
    this.prevTotalDamageDealt = 0;
    this.pushStatsUpdate();
  }

  public resetPracticeCooldowns() {
    for (let i = 0; i < this.player.skillCDs.length; i++) {
      this.player.skillCDs[i] = 0;
    }
    this.monkeySubCd = 0;
    this.player.monkeySubCd = 0;
    this.phoenixReviveUsed = false;
    this.hasUsedRampage = false;
    this.player.travelerRewindReady = true;
    this.player.travelerKillsRecharge = 30;
    this.createShockwave(this.playerPos.x, this.playerPos.y, '#22d3ee', 90);
    this.pushStatsUpdate();
  }

  public fullHealPractice() {
    this.player.hp = this.player.maxHp;
    if (this.acquiredAttributes.has('attr_shield_aegis')) {
      this.aegisShield = 380;
    }
    this.createShockwave(this.playerPos.x, this.playerPos.y, '#4ade80', 85);
    this.pushStatsUpdate();
  }

  public grantPracticeLevel(levels: number = 1) {
    const count = Math.max(1, Math.min(20, levels));
    this.player.level += count;
    if (this.acquiredAttributes.has('attr_mystic_orb')) {
      this.player.hp = this.player.maxHp;
      for (let i = 0; i < this.player.skillCDs.length; i++) {
        this.player.skillCDs[i] = 0;
      }
    }
    sounds.playLevelUp();
    this.createShockwave(this.playerPos.x, this.playerPos.y, '#facc15', 110);
    this.floatingTexts.push({
      x: this.playerPos.x,
      y: this.playerPos.y - 40,
      text: `⬆️ PRACTICE LV. ${this.player.level}`,
      color: '#facc15',
      fontSize: 18,
      life: 1.0,
      maxLife: 1.0,
      vy: -26
    });
    this.recalculateStats();
    this.pushStatsUpdate();
  }

  public switchHeroInPractice(newHeroKey: HeroKey) {
    const savedCounts = new Map(this.attributeCounts);
    const savedWave = this.practiceWaveLevel;
    const savedGodMode = this.practiceGodMode;
    const savedAutoHealDummy = this.practiceAutoHealDummy;
    const savedX = this.playerPos.x;
    const savedY = this.playerPos.y;
    const savedEnemies = this.enemies;
    const savedBoss = this.currentBoss;

    this.heroKey = newHeroKey;
    this.heroConfig = HERO_DATABASE[newHeroKey];
    this.activeSkills = [...this.heroConfig.skills];

    this.clones = [];
    this.minions = [];
    this.projectiles = [];
    this.telegraphs = [];
    this.spatialZones = [];
    this.unlockedTraits.clear();
    this.acquiredAttributes.clear();
    this.attributeCounts.clear();
    this.monkeyDuelTarget = null;
    this.monkeyDuelTimer = 0;
    this.monkeyDuelStacks = 0;
    this.monkeyComboHits = 0;
    this.monkeySubCd = 0;
    this.phoenixReviveUsed = false;
    this.hasUsedRampage = false;
    this.travelerBladeTimer = 0;
    this.demonisDrainTimer = 0;
    this.demonisBarrageTimer = 0;
    this.valkyrieRushTimer = 0;
    this.valkyrieBlizzardTimer = 0;
    this.valkyrieBlizzardTick = 0;
    this.invulnPopupCd = 0;
    this.angelWingTimer = 0;
    this.angelFeatherCombo = 0;
    this.abyssalPinionCd = 0;
    this.demonAuraTimer = 0;
    this.demonMeteorTimer = 0;
    this.demonRebirthCd = 0;
    this.hellfireCoreHits = 0;

    this.player = this.createInitialPlayerStats();
    this.playerPos.x = savedX;
    this.playerPos.y = savedY;
    this.enemies = savedEnemies;
    this.currentBoss = savedBoss;
    this.practiceMode = true;
    this.practiceWaveLevel = savedWave;
    this.wave = savedWave;
    this.practiceGodMode = savedGodMode;
    this.practiceAutoHealDummy = savedAutoHealDummy;

    for (const [id, count] of savedCounts.entries()) {
      this.attributeCounts.set(id, count);
      this.acquiredAttributes.add(id);
    }
    this.rebuildPracticeAttributes();
    this.player.hp = this.player.maxHp;
    this.createShockwave(this.playerPos.x, this.playerPos.y, this.heroConfig.color, 130);
    this.floatingTexts.push({
      x: this.playerPos.x,
      y: this.playerPos.y - 44,
      text: `🔄 HERO: ${this.heroConfig.name}`,
      color: this.heroConfig.color,
      fontSize: 18,
      life: 1.2,
      maxLife: 1.2,
      vy: -24
    });
    this.pushStatsUpdate();
  }

  public recalculateStats() {
    const cfg = this.heroConfig;
    let extraASPD = this.bonusAtkSpeed;
    let extraAtk = this.bonusAtk;

    if (this.titanHeartStacks > 0) {
      extraAtk += this.player.maxHp * 0.10 * this.titanHeartStacks;
    }
    if (this.bloodlustStacks > 0) {
      const totemMult = Math.max(1, this.berserkTotemStacks);
      extraAtk += this.bloodlustStacks * 4 * totemMult;
      extraASPD += this.bloodlustStacks * 0.03 * totemMult;
    }
    if (this.chronoAnchorBuffTimer > 0) {
      extraASPD += 0.25;
    }
    if (this.temporalCompassTimer > 0) {
      extraASPD += 0.35;
    }
    if (this.berserkClawTimer > 0 && this.berserkClawStacks > 0) {
      extraASPD += 0.10 * this.berserkClawStacks;
    }

    const lowHpIronWill = (this.ironWillStacks > 0 && (this.player.hp / this.player.maxHp < 0.5))
      ? 20 * this.ironWillStacks
      : 0;
    const savedWarArmorBonus = this.warArmorBonusDef;
    this.warArmorBonusDef = savedWarArmorBonus + lowHpIronWill;

    const warpBuffActive = (this.player.riftWarpBuffTimer ?? 0) > 0;
    const phantomSealActive = this.acquiredAttributes.has('attr_void_assassin_seal') && (this.phantomPhaseTimer > 0 || warpBuffActive);
    const riftWarpCrit = (this.heroKey === 'rift_walker' && warpBuffActive) ? 0.10 : 0;

    // Sync persistent Crit, CDR, Evasion, Defense
    this.player.critChance = Math.min(1.0, cfg.critChance + this.bonusCritChance + (phantomSealActive ? 0.20 : 0) + riftWarpCrit);
    this.player.critDmg = cfg.critDmg + this.bonusCritDmg + (phantomSealActive ? 0.35 : 0);
    this.player.cdr = Math.min(0.75, this.bonusCdr);
    const swiftEvasion = this.player.swiftTimer > 0 ? 0.55 : 0;
    const riftBaseEvasion = this.heroKey === 'rift_walker' ? 0.12 : 0;
    const monkeyBaseEvasion = this.heroKey === 'monkey' ? 0.12 : 0;
    const fallenBaseEvasion = this.heroKey === 'fallen_angel' ? 0.12 : 0;
    const fallenLowHpEvasion = (this.heroKey === 'fallen_angel' && (this.player.hp / this.player.maxHp < 0.45)) ? 0.12 : 0;
    const fallenEclipseEvasion = (this.heroKey === 'fallen_angel' && (this.player.angelEclipseTimer ?? 0) > 0) ? 0.18 : 0;
    const riftWarpEvasion = (this.heroKey === 'rift_walker' && warpBuffActive) ? 0.12 : 0;
    this.player.evasion = Math.min(0.75, this.bonusEvasion + swiftEvasion + riftBaseEvasion + monkeyBaseEvasion + fallenBaseEvasion + fallenLowHpEvasion + fallenEclipseEvasion + riftWarpEvasion);

    // Berserker Blood: +8% ATK and +6% ASPD per 10% missing HP
    if (this.acquiredAttributes.has('attr_berserker_blood')) {
      const missingHpRatio = Math.max(0, 1 - (this.player.hp / this.player.maxHp));
      const stacks = Math.floor(missingHpRatio * 10);
      extraAtk += stacks * (cfg.atk * 0.08);
      extraASPD += stacks * 0.06;
    }

    if (this.acquiredAttributes.has('attr_varp_scythe')) {
      extraASPD += this.player.varpScytheStacks * 0.05;
    }
    if (this.player.monkeyWeaponActive) {
      extraASPD += 0.80;
    }

    let totalLifesteal = this.bonusLifesteal;
    if (this.player.fallenWingsActive && (this.player.hp / this.player.maxHp < 0.25)) {
      totalLifesteal += 0.40;
    }

    if (this.player.travelerFieldTimer > 0 && !(this.heroKey === 'traveler' && (this.player.travelerOverdriveTimer ?? 0) > 0)) {
      extraAtk += cfg.atk * 0.25;
      extraASPD += 0.35;
    }

    const chronoSpeedBonus = this.chronoAnchorBuffTimer > 0 ? cfg.speed * 0.35 : 0;
    const warpASPD = warpBuffActive ? (this.heroKey === 'rift_walker' ? 0.30 : 0.40) : 0;
    const warpSpeed = warpBuffActive ? 45 : 0;

    if (this.heroKey === 'monkey') {
      // Pasif Spesial: Setiap 1% Crit Damage diubah menjadi +2 Attack Damage
      const critDmgPercent = Math.max(0, Math.round(this.player.critDmg * 100));
      const critToAtkBonus = critDmgPercent * 2;
      const activeDuelStacks = (this.enemies.length === 1 && this.enemies[0].hp > 0) ? this.monkeyDuelStacks : 0;
      const baseAtkWithPassive = cfg.atk + extraAtk + critToAtkBonus;
      const isOverdrive = this.player.rageTimer > 0 || (this.player.monkeyHavocTimer ?? 0) > 0;
      const atkWithOverdrive = isOverdrive ? (baseAtkWithPassive + 20) * 1.55 : baseAtkWithPassive;
      this.player.atk = atkWithOverdrive * (1 + activeDuelStacks * 0.06);
      this.player.atkSpeed = cfg.atkSpeed + extraASPD + warpASPD + (isOverdrive ? 0.6 : 0) + (activeDuelStacks * 0.04);
      this.player.critChance = Math.min(1.0, this.player.critChance + activeDuelStacks * 0.015);
      this.player.speed = cfg.speed + this.bonusSpeed + chronoSpeedBonus + warpSpeed + (isOverdrive ? 60 : 0);
      this.player.range = cfg.range + this.bonusRange;
      this.player.defense = cfg.defense + this.bonusDefense + this.warArmorBonusDef + (activeDuelStacks * 2);
      this.player.lifesteal = totalLifesteal + 0.12;
    } else if (this.heroKey === 'demonis') {
      const fcd = this.player.demonisFCD || 0;
      const isAscended = fcd >= 30;
      const isVeiled = this.player.swiftTimer > 0;
      this.player.atk = (cfg.atk + extraAtk) * (isAscended ? 1.20 : 1.0);
      this.player.critDmg += fcd * 0.015;
      this.player.atkSpeed = cfg.atkSpeed + extraASPD + warpASPD + fcd * 0.015;
      this.player.speed = cfg.speed + this.bonusSpeed + chronoSpeedBonus + warpSpeed + (isVeiled ? cfg.speed * 0.35 : 0);
      this.player.evasion = Math.min(0.75, this.player.evasion + (isVeiled ? 0.05 : 0));
      this.player.range = cfg.range + this.bonusRange;
      this.player.defense = cfg.defense + this.bonusDefense + this.warArmorBonusDef;
      this.player.lifesteal = totalLifesteal;
    } else if (this.heroKey === 'traveler') {
      let modAtk = 1.0;
      let modASPD = 1.0;
      let stanceRange = 115;
      if (this.player.travelerStance === 'sword') {
        modAtk = 1.50;
        modASPD = 1.20;
        stanceRange = 115;
        totalLifesteal += 0.15;
      } else if (this.player.travelerStance === 'bow') {
        modAtk = 1.35;
        modASPD = 1.45;
        stanceRange = 265;
        this.player.critChance = Math.min(1.0, this.player.critChance + 0.10);
      } else if (this.player.travelerStance === 'staff') {
        modAtk = 1.70;
        modASPD = 1.10;
        stanceRange = 295;
      }
      modAtk += Math.min(30, this.player.travelerTimeStacks) * 0.02;
      if (this.acquiredAttributes.has('attr_chrono_pendulum')) {
        modAtk += 0.20;
      }
      const overdriveActive = (this.player.travelerOverdriveTimer ?? 0) > 0;
      const hasHyperOverdrive = this.unlockedTraits.has('t_s4_u2');
      if (overdriveActive) {
        modAtk += hasHyperOverdrive ? 0.55 : 0.35;
        extraASPD += hasHyperOverdrive ? 0.75 : 0.50;
        this.player.critDmg += 0.25;
        if (hasHyperOverdrive) {
          this.player.evasion = Math.min(0.75, this.player.evasion + 0.15);
        }
      }
      if (this.player.isTimeStopActive) {
        modAtk += 0.40;
        extraASPD += 0.40;
      }
      const travelerSpeedBoost = this.travelerSpeedBoostTimer > 0 ? cfg.speed * 0.30 : 0;
      this.player.atk = (cfg.atk + extraAtk) * modAtk;
      this.player.atkSpeed = (cfg.atkSpeed * modASPD) + extraASPD + warpASPD;
      this.player.speed = cfg.speed + this.bonusSpeed + chronoSpeedBonus + warpSpeed + travelerSpeedBoost;
      this.player.range = stanceRange + this.bonusRange;
      this.player.defense = cfg.defense + this.bonusDefense + this.warArmorBonusDef;
      this.player.lifesteal = totalLifesteal;
    } else if (this.heroKey === 'dimension_judge') {
      const domainAtkMod = this.player.judgeDomainTimer > 0 ? 2.0 : 1.0;
      this.player.atk = (cfg.atk + extraAtk) * domainAtkMod;
      this.player.atkSpeed = cfg.atkSpeed + extraASPD + warpASPD + (this.player.judgeDomainTimer > 0 ? 0.4 : 0);
      this.player.speed = cfg.speed + this.bonusSpeed + chronoSpeedBonus + warpSpeed;
      this.player.range = cfg.range + this.bonusRange;
      this.player.defense = cfg.defense + this.bonusDefense + this.warArmorBonusDef;
      this.player.lifesteal = totalLifesteal;
    } else if (this.heroKey === 'valkyrie') {
      const hasFrostShield = (this.player.frostArmorShield ?? 0) > 0;
      const rushSpeedBonus = this.valkyrieRushTimer > 0 ? 55 : 0;
      const rejuvDefBonus = this.unlockedTraits.has('v_s3_u2') ? 45 : 0;
      this.player.atk = cfg.atk + extraAtk + (hasFrostShield ? 35 : 0);
      this.player.atkSpeed = cfg.atkSpeed + extraASPD + warpASPD + (hasFrostShield ? 0.35 : 0);
      this.player.defense = cfg.defense + this.bonusDefense + rejuvDefBonus + (hasFrostShield ? 35 : 0) + this.warArmorBonusDef;
      this.player.speed = cfg.speed + this.bonusSpeed + chronoSpeedBonus + warpSpeed + (hasFrostShield ? 20 : 0) + rushSpeedBonus;
      this.player.range = cfg.range + this.bonusRange;
      this.player.lifesteal = totalLifesteal;
    } else if (this.heroKey === 'rift_walker') {
      this.player.atk = cfg.atk + extraAtk;
      this.player.atkSpeed = cfg.atkSpeed + extraASPD + warpASPD;
      this.player.speed = cfg.speed + this.bonusSpeed + chronoSpeedBonus + warpSpeed;
      this.player.range = cfg.range + this.bonusRange;
      this.player.defense = cfg.defense + this.bonusDefense + this.warArmorBonusDef;
      this.player.lifesteal = totalLifesteal;
    } else if (this.heroKey === 'soul_puppeteer') {
      const soulCount = this.player.souls || 0;
      const isPossessing = (this.player.puppetPossessTimer ?? 0) > 0;
      const isLich = (this.player.lichTransformTimer ?? 0) > 0;
      const lichAtkMult = isLich ? (this.unlockedTraits.has('sp_s4_u1') ? 1.50 : 1.30) : 1.0;
      this.player.atk = (cfg.atk + extraAtk) * (1 + soulCount * 0.008) * lichAtkMult;
      this.player.atkSpeed = cfg.atkSpeed + extraASPD + warpASPD + (isPossessing ? 0.30 : 0) + (isLich ? 0.20 : 0);
      this.player.speed = cfg.speed + this.bonusSpeed + chronoSpeedBonus + warpSpeed + (isPossessing ? 65 : 0) + (isLich ? 50 : 0);
      this.player.range = cfg.range + this.bonusRange + (isLich ? 180 : 0);
      this.player.defense = cfg.defense + this.bonusDefense + this.warArmorBonusDef + (isLich ? 25 : 0);
      this.player.lifesteal = totalLifesteal;
      if (isPossessing && this.unlockedTraits.has('sp_s2_u1')) {
        this.player.critChance = Math.min(1.0, this.player.critChance + 0.45);
      }
    } else if (this.heroKey === 'solaris') {
      const heat = this.player.solarHeat || 0;
      const isAvatar = (this.player.solarAvatarTimer ?? 0) > 0;
      const avatarAtkBonus = isAvatar ? (this.unlockedTraits.has('sol_s4_u1') ? 0.70 : 0.45) : 0;
      const heatAtkMult = 1 + heat * 0.02 + avatarAtkBonus;
      this.player.atk = (cfg.atk + extraAtk) * heatAtkMult;
      this.player.atkSpeed = cfg.atkSpeed + extraASPD + warpASPD + heat * 0.015 + (isAvatar ? 0.40 : 0);
      this.player.speed = cfg.speed + this.bonusSpeed + chronoSpeedBonus + warpSpeed + (isAvatar ? 40 : 0);
      this.player.range = cfg.range + this.bonusRange;
      this.player.defense = cfg.defense + this.bonusDefense + this.warArmorBonusDef;
      this.player.lifesteal = totalLifesteal;
    } else if (this.heroKey === 'fallen_angel') {
      const feathers = this.player.angelFeathers || 0;
      const isEclipse = (this.player.angelEclipseTimer ?? 0) > 0;
      const eclipseAtkBonus = isEclipse ? (this.unlockedTraits.has('fa_s4_u1') ? 0.65 : 0.45) : 0;
      const featherAtkMult = 1 + feathers * 0.015 + eclipseAtkBonus;
      this.player.atk = (cfg.atk + extraAtk) * featherAtkMult;
      this.player.atkSpeed = cfg.atkSpeed + extraASPD + warpASPD + (isEclipse ? 0.35 : 0);
      this.player.speed = cfg.speed + this.bonusSpeed + chronoSpeedBonus + warpSpeed + feathers * 2.5 + (isEclipse ? 45 : 0);
      this.player.range = cfg.range + this.bonusRange;
      this.player.defense = cfg.defense + this.bonusDefense + this.warArmorBonusDef;
      this.player.lifesteal = totalLifesteal + 0.12;
    } else if (this.heroKey === 'demon_raised') {
      const essence = this.player.demonEssence || 0;
      const isAwakened = (this.player.demonAwakenTimer ?? 0) > 0;
      const awakenAtkBonus = isAwakened ? (this.unlockedTraits.has('dr_s4_u1') ? 0.75 : 0.55) : 0;
      const essenceAtkMult = 1 + essence * 0.02 + awakenAtkBonus;
      this.player.atk = (cfg.atk + extraAtk) * essenceAtkMult;
      this.player.atkSpeed = cfg.atkSpeed + extraASPD + warpASPD + (isAwakened ? 0.45 : 0);
      this.player.speed = cfg.speed + this.bonusSpeed + chronoSpeedBonus + warpSpeed + (isAwakened ? 40 : 0);
      this.player.range = cfg.range + this.bonusRange;
      this.player.defense = cfg.defense + this.bonusDefense + this.warArmorBonusDef + essence * 1.5;
      this.player.lifesteal = totalLifesteal + essence * 0.006;
    }

    if (this.acquiredAttributes.has('attr_eclipse_halo') && this.heroKey !== 'fallen_angel') {
      this.player.critDmg += 0.25;
    }

    // Restore base warArmorBonusDef without mutating saved value across recalculations
    if (lowHpIronWill > 0) {
      this.warArmorBonusDef -= lowHpIronWill;
    }

    // Illusion Sovereign Sigil (+30% total ATK multiplier)
    if (this.acquiredAttributes.has('attr_clone_overlord')) {
      this.player.atk *= 1.30;
    }

    // Arcane Catalyst Rune (+20% ATK multiplier for 3.5s after casting a Skill)
    if (this.arcaneCatalystTimer > 0) {
      this.player.atk *= 1.20;
    }
  }

  public addDemonisStacks(amount: number) {
    if (this.heroKey !== 'demonis') return;
    let total = (this.player.demonisStacks || 0) + amount;
    let gainedFcd = false;
    while (total >= 4) {
      total -= 4;
      if ((this.player.demonisFCD ?? 0) < 30) {
        this.player.demonisFCD = Math.min(30, (this.player.demonisFCD ?? 0) + 1);
        gainedFcd = true;
        this.healPlayer(this.player.maxHp * 0.08);
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#a855f7', 85);
        sounds.playSkill('void');
        this.floatingTexts.push({
          x: this.playerPos.x,
          y: this.playerPos.y - 40,
          text: this.player.demonisFCD >= 30
            ? '👑 ABYSSAL ASCENDANCE! (30/30 FCD)'
            : `FULL CHARGER DEMONIS! (FCD: ${this.player.demonisFCD}/30)`,
          color: this.player.demonisFCD >= 30 ? '#fbbf24' : '#c084fc',
          fontSize: this.player.demonisFCD >= 30 ? 21 : 18,
          life: 1.1,
          maxLife: 1.1,
          vy: -34
        });
      }
    }
    this.player.demonisStacks = (this.player.demonisFCD ?? 0) >= 30 ? 0 : total;
    if (gainedFcd) {
      this.recalculateStats();
    }
  }

  public addSolarHeat(amount: number) {
    if (this.heroKey !== 'solaris') return;
    const cap = this.acquiredAttributes.has('attr_solar_core') ? 30 : 20;
    const prev = this.player.solarHeat || 0;
    const next = Math.min(cap, prev + amount);
    if (next !== prev) {
      this.player.solarHeat = next;
      this.recalculateStats();
    }
  }

  public addAngelFeathers(amount: number) {
    if (this.heroKey !== 'fallen_angel') return;
    const cap = this.acquiredAttributes.has('attr_eclipse_halo') ? 20 : 12;
    const prev = this.player.angelFeathers || 0;
    const next = Math.min(cap, prev + amount);
    if (next !== prev) {
      this.player.angelFeathers = next;
      this.recalculateStats();
    }
  }

  public addDemonEssence(amount: number) {
    if (this.heroKey !== 'demon_raised') return;
    const cap = this.acquiredAttributes.has('attr_hellfire_crown') ? 40 : 25;
    const prev = this.player.demonEssence || 0;
    const next = Math.min(cap, prev + amount);
    if (next !== prev) {
      this.player.demonEssence = next;
      this.recalculateStats();
    }
  }

  private triggerEclipsePinionBolt(x: number, y: number) {
    if (this.abyssalPinionCd > 0) return;
    this.abyssalPinionCd = 1.0;
    this.createLightningChain(x, Math.max(0, y - 140), x, y, '#c084fc');
    this.createShockwave(x, y, '#e11d48', 120);
    sounds.playSkill('thunder');
    const boltDmg = this.player.atk * 1.45;
    for (const e of this.enemies) {
      if (e.hp > 0 && Math.hypot(e.x - x, e.y - y) <= 120) {
        e.takeDamage(boltDmg, false, 'true_damage', this);
      }
    }
  }

  public addSouls(amount: number) {
    if (this.heroKey !== 'soul_puppeteer') return;
    const prev = this.player.souls || 0;
    const next = Math.min(30, prev + amount);
    if (next !== prev) {
      this.player.souls = next;
      this.recalculateStats();
    }
  }

  public spawnPuppetMinion(
    kind: 'puppet' | 'undead',
    x: number,
    y: number,
    initialModLevel: number = 0,
    maxOfKind?: number
  ): PuppetMinionEntity {
    const cap = maxOfKind ?? (kind === 'puppet'
      ? (this.unlockedTraits.has('sp_s1_u1') ? 4 : 3)
      : (this.unlockedTraits.has('sp_s3_u2') ? 8 : 5));

    const existing = this.minions.filter(m => m.kind === kind && m.hp > 0);
    if (existing.length >= cap) {
      // Refresh & empower oldest minion of same kind instead of exceeding cap
      const oldest = existing.sort((a, b) => a.lifeTimer - b.lifeTimer)[0];
      oldest.lifeTimer = kind === 'puppet' ? 22 : 16;
      oldest.hp = oldest.maxHp;
      if (initialModLevel > oldest.modLevel) {
        oldest.applyModify(initialModLevel - oldest.modLevel);
      }
      return oldest;
    }

    const minion = new PuppetMinionEntity(x, y, kind, this);
    if (initialModLevel > 0) {
      minion.applyModify(initialModLevel);
    }
    this.minions.push(minion);
    return minion;
  }

  private triggerMonkeyJinguSweep(target: EnemyEntity) {
    const centerX = (this.playerPos.x + target.x) * 0.5;
    const centerY = (this.playerPos.y + target.y) * 0.5;
    const sweepRadius = 145;
    const isOverdrive = this.player.rageTimer > 0 || (this.player.monkeyHavocTimer ?? 0) > 0;
    const sweepCrit = Math.random() < this.player.critChance;
    const sweepDmg = this.player.atk * 1.60 * (sweepCrit ? this.player.critDmg : 1.0);

    this.createShockwave(centerX, centerY, '#f59e0b', sweepRadius);
    this.createShockwave(centerX, centerY, '#fde047', 95);
    this.createSlashEffect(this.playerPos.x, this.playerPos.y, target.x, target.y, '#fde047');
    sounds.playSkill('slash');
    this.cameraShake = Math.max(this.cameraShake, 6);

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const dist = Math.hypot(e.x - centerX, e.y - centerY);
      if (dist <= sweepRadius) {
        e.takeDamage(sweepDmg, sweepCrit, 'player', this);
        e.sunderTimer = 5.0;
        e.sunderStacks = Math.min(6, e.sunderStacks + 1);
        if (!e.isBoss) {
          const pushAngle = Math.atan2(e.y - this.playerPos.y, e.x - this.playerPos.x);
          e.x = Math.max(30, Math.min(this.width - 30, e.x + Math.cos(pushAngle) * 22));
          e.y = Math.max(30, Math.min(this.height - 30, e.y + Math.sin(pushAngle) * 22));
        }
      }
    }

    // Golden Gaze sustain, Vajra Shield, -1s 72-Form CD & 0.4s active skill CDR
    const healPct = isOverdrive ? 0.04 : 0.03;
    this.healPlayer(this.player.maxHp * healPct);
    const vajraShieldCap = Math.max(380, Math.round(this.player.maxHp * 0.35));
    if (this.aegisShield < vajraShieldCap) {
      this.aegisShield = Math.min(vajraShieldCap, this.aegisShield + 75);
    }
    if (this.monkeySubCd > 0) {
      this.monkeySubCd = Math.max(0, this.monkeySubCd - 1.0);
      this.player.monkeySubCd = this.monkeySubCd;
    }
    for (let i = 0; i < this.player.skillCDs.length; i++) {
      if (this.player.skillCDs[i] > 0) {
        this.player.skillCDs[i] = Math.max(0, this.player.skillCDs[i] - 0.4);
      }
    }

    // Active Monkey Clones resonate with Golden Mirage Echo Sweep
    for (const c of this.clones) {
      if (c.isRiftDecoy || c.hp <= 0) continue;
      const echoRadius = 95;
      const echoDmg = this.player.atk * 0.55 * c.getInheritedStatRatio();
      this.createShockwave(c.x, c.y, '#fbbf24', echoRadius);
      for (const e of this.enemies) {
        if (e.hp > 0 && Math.hypot(e.x - c.x, e.y - c.y) <= echoRadius) {
          e.takeDamage(echoDmg, false, 'clone', this);
        }
      }
    }

    this.floatingTexts.push({
      x: this.playerPos.x,
      y: this.playerPos.y - 36,
      text: '🥢 JINGU SWEEP!',
      color: '#fde047',
      fontSize: 16,
      life: 0.85,
      maxLife: 0.85,
      vy: -26
    });
  }

  public applyAbyssalMark(target: EnemyEntity) {
    target.abyssalMarks++;
    target.abyssalMarkTimer = 5.0;
    if (target.abyssalMarks >= 5) {
      target.abyssalMarks = 0;
      target.abyssalMarkTimer = 0;
      target.defense = Math.round(target.defense * 0.80);
      const shatterDmg = this.player.atk * 3.0;
      this.createShockwave(target.x, target.y, '#c084fc', 125);
      sounds.playExplosion();
      for (const e of this.enemies) {
        if (Math.hypot(e.x - target.x, e.y - target.y) <= 125) {
          e.takeDamage(shatterDmg, true, 'true_damage', this);
        }
      }
      this.addRelicFloatingText({
        x: target.x,
        y: target.y,
        text: '💥 ABYSSAL SHATTER!',
        color: '#e879f9',
        fontSize: 12,
        life: 0.85,
        maxLife: 0.85,
        vy: 16
      });
    }
  }

  public triggerRicochetGlaive(originX: number, originY: number, firstTarget: EnemyEntity) {
    const visited = new Set<EnemyEntity>();
    let currX = originX;
    let currY = originY;
    let currTarget: EnemyEntity | null = firstTarget;
    const glaiveDmg = this.player.atk * 1.35;
    sounds.playSkill('thunder');

    for (let bounce = 0; bounce < 4; bounce++) {
      if (!currTarget) break;
      visited.add(currTarget);
      this.createLaserBeam(currX, currY, currTarget.x, currTarget.y, '#fde047', 4);
      currTarget.takeDamage(glaiveDmg, false, 'player', this);
      currX = currTarget.x;
      currY = currTarget.y;

      let nextTarget: EnemyEntity | null = null;
      let bestDist = 260;
      for (const e of this.enemies) {
        if (!visited.has(e) && e.hp > 0) {
          const d = Math.hypot(e.x - currX, e.y - currY);
          if (d <= bestDist) {
            bestDist = d;
            nextTarget = e;
          }
        }
      }
      currTarget = nextTarget;
    }
  }

  public triggerBloodPact(target: EnemyEntity) {
    const sacrifice = Math.floor(this.player.hp * 0.03);
    this.player.hp = Math.max(1, this.player.hp - sacrifice);
    const hpPctDmg = target.isBoss ? target.maxHp * 0.03 : target.maxHp * 0.06;
    const pactDmg = this.player.atk * 2.2 + hpPctDmg;
    target.takeDamage(pactDmg, true, 'true_damage', this);
    this.healPlayer(this.player.maxHp * 0.06);
    this.createShockwave(target.x, target.y, '#ef4444', 95);
    this.addRelicFloatingText({
      x: target.x,
      y: target.y,
      text: '🩸 BLOOD REND!',
      color: '#f43f5e',
      fontSize: 12,
      life: 0.85,
      maxLife: 0.85,
      vy: 16
    });
  }

  public triggerDoomScytheCrit(target: EnemyEntity, isCrit: boolean) {
    if (isCrit && target.isBoss && target.doomScytheCd <= 0) {
      target.doomScytheCd = 1.5;
      const harvestDmg = Math.min(450, target.maxHp * 0.025);
      target.takeDamage(harvestDmg, true, 'true_damage', this);
      this.createSlashEffect(target.x - 25, target.y - 25, target.x + 25, target.y + 25, '#facc15');
      this.addRelicFloatingText({
        x: target.x,
        y: target.y,
        text: `🌙 HARVEST ${Math.round(harvestDmg)}!`,
        color: '#fde047',
        fontSize: 12,
        life: 0.8,
        maxLife: 0.8,
        vy: 16
      });
    }
  }

  public triggerBlightBurst(target: EnemyEntity) {
    const burstDmg = Math.min(500, Math.round(target.maxHp * 0.04));
    target.blightTimer = 5.0;
    target.takeDamage(burstDmg, true, 'true_damage', this);
    this.createShockwave(target.x, target.y, '#a855f7', 85);
    this.addRelicFloatingText({
      x: target.x,
      y: target.y,
      text: `☠️ BLIGHT -${burstDmg}!`,
      color: '#d946ef',
      fontSize: 12,
      life: 0.85,
      maxLife: 0.85,
      vy: 16
    });
  }

  private handleEnemyDefeated(enemy: EnemyEntity) {
    this.kills++;

    // Warlord Frenzy Banner: nearby kills grant Bloodlust stacks
    if (this.acquiredAttributes.has('attr_berserk_totem')) {
      const nearPlayer = Math.hypot(enemy.x - this.playerPos.x, enemy.y - this.playerPos.y) <= 280;
      const nearClone = this.clones.some(c => c.hp > 0 && Math.hypot(enemy.x - c.x, enemy.y - c.y) <= 280);
      if (nearPlayer || nearClone) {
        this.bloodlustStacks = Math.min(20, this.bloodlustStacks + 1);
        this.bloodlustTimer = 8.0;
        this.recalculateStats();
      }
    }

    // Grim Soul Harvester: Every 10 kills grants +5 Base ATK & +20 Max HP permanently
    if (this.acquiredAttributes.has('attr_soul_harvester')) {
      this.soulHarvesterKills++;
      if (this.soulHarvesterKills >= 10) {
        this.soulHarvesterKills = 0;
        this.bonusAtk += 5;
        this.player.maxHp += 20;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
        for (const c of this.clones) {
          if (c.hp > 0) {
            const r = c.getInheritedStatRatio();
            c.maxHp += Math.round(20 * r);
            c.hp = Math.min(c.maxHp, c.hp + Math.round(20 * r));
          }
        }
        this.recalculateStats();
        this.addRelicFloatingText({
          x: this.playerPos.x,
          y: this.playerPos.y,
          text: '💀 SOUL HARVEST (+5 ATK, +20 HP)',
          color: '#c084fc',
          fontSize: 12,
          life: 0.9,
          maxLife: 0.9,
          vy: 16
        });
      }
    }

    // Vampiric Embrace on-kill heal (+40 HP for master & clones)
    if (this.acquiredAttributes.has('attr_vampiric_embrace')) {
      this.healPlayer(40);
      for (const c of this.clones) {
        if (c.hp > 0) c.hp = Math.min(c.maxHp, c.hp + 40);
      }
    }
    if (this.heroKey === 'traveler') {
      this.player.travelerTimeStacks++;
      if (this.player.travelerTimeStacks <= 30) {
        this.recalculateStats();
      }
      if (this.hasUsedRampage) {
        this.killsSinceLastRampage++;
        this.player.travelerKillsRecharge = this.killsSinceLastRampage;
        if (this.killsSinceLastRampage >= 30) {
          this.hasUsedRampage = false;
          this.killsSinceLastRampage = 0;
          this.player.travelerRewindReady = true;
          this.floatingTexts.push({
            x: this.playerPos.x,
            y: this.playerPos.y - 45,
            text: '⏳ TIME REVERSAL BERSERK RECHARGED!',
            color: '#22d3ee',
            fontSize: 20,
            life: 1.6,
            maxLife: 1.6,
            vy: -30
          });
          sounds.playSkill('warp');
        }
      }
    }

    if (this.heroKey === 'soul_puppeteer') {
      // Soul Maker + Necromancer auto-raise on enemy defeat
      this.addSouls(enemy.isBoss ? 10 : 3);
      const maxUndead = this.unlockedTraits.has('sp_s3_u2') ? 8 : 5;
      const currUndead = this.minions.filter(m => m.kind === 'undead' && m.hp > 0).length;
      if (currUndead < maxUndead) {
        this.spawnPuppetMinion('undead', enemy.x, enemy.y, 0, maxUndead);
      }
    }

    // Solaris Ignis Passive: +3 Solar Heat & heal 2% Max HP per kill
    if (this.heroKey === 'solaris') {
      this.addSolarHeat(3);
      this.healPlayer(this.player.maxHp * 0.02);
    }

    // Demonis Abyssal Hunger: +2 Demonis Stacks per kill (+8 for Boss)
    if (this.heroKey === 'demonis') {
      this.addDemonisStacks(enemy.isBoss ? 8 : 2);
    }

    // Fallen Angel Passive: +2 Fallen Feathers per kill (+6 for Boss)
    if (this.heroKey === 'fallen_angel') {
      this.addAngelFeathers(enemy.isBoss ? 6 : 2);
    }

    // Demon Raised Passive: +3 Hellfire Essence per kill (+8 for Boss)
    if (this.heroKey === 'demon_raised') {
      this.addDemonEssence(enemy.isBoss ? 8 : 3);
    }

    // Astral Echo Hourglass: reduce all active skill cooldowns by 0.25s per kill
    if (this.acquiredAttributes.has('attr_astral_hourglass')) {
      for (let i = 0; i < this.player.skillCDs.length; i++) {
        if (this.player.skillCDs[i] > 0) {
          this.player.skillCDs[i] = Math.max(0, this.player.skillCDs[i] - 0.25);
        }
      }
    }

    // Soul Reaper Grasp: AoE explosion (110% ATK) at defeated enemy position
    if (this.acquiredAttributes.has('attr_reaper_grasp')) {
      const blastDmg = this.player.atk * 1.10;
      this.createShockwave(enemy.x, enemy.y, '#c084fc', 130);
      for (const e of this.enemies) {
        if (e !== enemy && e.hp > 0 && Math.hypot(e.x - enemy.x, e.y - enemy.y) <= 130) {
          e.takeDamage(blastDmg, false, 'player', this);
        }
      }
    }

    // Savage Frenzy Claw: Boss kill or every 15 kills activates Frenzy for 5s
    if (this.berserkClawStacks > 0) {
      this.berserkClawKills++;
      if (enemy.isBoss || this.berserkClawKills >= 15) {
        this.berserkClawKills = 0;
        this.berserkClawTimer = 5.0;
        this.recalculateStats();
        this.createShockwave(this.playerPos.x, this.playerPos.y, '#f87171', 85);
      }
    }

    // Drop EXP Gem
    this.expGems.push({
      x: enemy.x,
      y: enemy.y,
      value: enemy.expValue,
      color: enemy.isBoss ? '#f59e0b' : '#38bdf8',
      radius: enemy.isBoss ? 7 : 4,
      vx: (Math.random() - 0.5) * 60,
      vy: (Math.random() - 0.5) * 60
    });

    // Create blood/void splatter particles
    this.createDeathSplatter(enemy.x, enemy.y, enemy.color);

    // If victory wave 20 boss defeated (disabled in Practice Mode)
    if (enemy.isBoss && this.wave >= 20 && !this.practiceMode) {
      this.triggerVictory();
    }
  }

  public spawnWave() {
    const isBossWave = this.wave % 4 === 0;
    const waveMult = 1 + (this.wave - 1) * 0.35;

    if (isBossWave) {
      sounds.playBossAlert();
      let boss: EnemyEntity;
      const bx = this.width / 2;
      const by = 80;
      const bossWaveMult = waveMult * 1.15;

      if (this.wave === 20 || (this.wave > 20 && this.wave % 20 === 0)) {
        // Wave 20: Corrupted Rival Hero [LV. 10]
        const heroPool: HeroKey[] = (['monkey', 'demonis', 'traveler', 'valkyrie', 'dimension_judge', 'rift_walker', 'soul_puppeteer', 'solaris', 'fallen_angel', 'demon_raised'] as HeroKey[])
          .filter(k => k !== this.heroKey);
        const selectedRival = heroPool[Math.floor(Math.random() * heroPool.length)] || 'demonis';
        boss = new EnemyEntity(bx, by, 'corrupted_hero', bossWaveMult, true, selectedRival);

        this.floatingTexts.push({
          x: this.width / 2,
          y: this.height / 2 - 80,
          text: `⚠️ [${boss.bossCategory?.toUpperCase()}] ${boss.name} INVASION!`,
          color: '#ef4444',
          fontSize: 24,
          life: 2.8,
          maxLife: 2.8,
          vy: -15
        });
        this.cameraShake = 18;
        this.createShockwave(bx, by, '#9333ea', 220);
      } else {
        // Waves 4, 8, 12, 16 rotate through all 4 Boss Categories: Tank -> Warrior -> Assassin -> Manipulation
        const bossOrder: ('wari' | 'dank' | 'shadow_assassin' | 'void_dragon')[] = [
          'wari',
          'dank',
          'shadow_assassin',
          'void_dragon'
        ];
        const bossIndex = (Math.floor(this.wave / 4) - 1) % bossOrder.length;
        const bossType = bossOrder[bossIndex];
        boss = new EnemyEntity(bx, by, bossType, bossWaveMult, true);

        this.floatingTexts.push({
          x: this.width / 2,
          y: this.height / 2 - 80,
          text: `⚠️ [${boss.bossCategory?.toUpperCase()} BOSS] ${boss.name}!`,
          color: boss.color,
          fontSize: 22,
          life: 2.4,
          maxLife: 2.4,
          vy: -15
        });
        this.cameraShake = 12;
        this.createShockwave(bx, by, boss.color, 180);
      }

      this.enemies.push(boss);
      this.currentBoss = boss;
    }

    const enemyCount = Math.min(20, Math.floor(4 + this.wave * 1.25));
    const mobWaveMult = waveMult * (1 + Math.max(0, this.wave - 1) * 0.12);
    for (let i = 0; i < enemyCount; i++) {
      const side = Math.floor(Math.random() * 4);
      let ex = 0;
      let ey = 0;
      if (side === 0) { ex = Math.random() * this.width; ey = -20; }
      else if (side === 1) { ex = this.width + 20; ey = Math.random() * this.height; }
      else if (side === 2) { ex = Math.random() * this.width; ey = this.height + 20; }
      else { ex = -20; ey = Math.random() * this.height; }

      let type: 'crawler' | 'bandit' | 'wari' = 'crawler';
      const r = Math.random();
      if (r < 0.34) type = 'bandit';
      else if (r < 0.50 && this.wave >= 3) type = 'wari';

      this.enemies.push(new EnemyEntity(ex, ey, type, mobWaveMult, false));
    }
  }

  private triggerGameOver() {
    this.isGameOver = true;
    sounds.playGameOver();
    if (this.onGameOverTrigger) {
      this.onGameOverTrigger({
        kills: this.kills,
        wave: this.wave,
        timeSurvived: Math.floor(this.timeSurvived),
        damageDealt: Math.round(this.totalDamageDealt),
        highestCrit: Math.round(this.highestCrit),
        damageTaken: Math.round(this.totalDamageTaken),
        level: this.player.level
      });
    }
  }

  private triggerVictory() {
    this.isPaused = true;
    sounds.playLevelUp();
    if (this.onVictoryTrigger) {
      this.onVictoryTrigger({
        kills: this.kills,
        wave: this.wave,
        timeSurvived: Math.floor(this.timeSurvived),
        damageDealt: Math.round(this.totalDamageDealt),
        highestCrit: Math.round(this.highestCrit),
        damageTaken: Math.round(this.totalDamageTaken),
        level: this.player.level
      });
    }
  }

  // --- Rendering ---
  private render() {
    const ctx = this.ctx;
    ctx.save();

    // Camera shake offset
    if (this.cameraShake > 0) {
      const sx = (Math.random() - 0.5) * this.cameraShake * 2;
      const sy = (Math.random() - 0.5) * this.cameraShake * 2;
      ctx.translate(sx, sy);
    }

    // Background Arena Grid
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, this.width, this.height);

    this.renderArenaGrid(ctx);
    this.renderSpatialZones(ctx);

    // Render Telegraph Zones
    for (const t of this.telegraphs) {
      ctx.save();
      const progress = t.timer / t.maxTimer;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius * progress, 0, Math.PI * 2);
      ctx.fillStyle = `${t.color}33`;
      ctx.fill();
      ctx.restore();
    }

    // Render EXP Gems
    for (const g of this.expGems) {
      ctx.save();
      ctx.shadowColor = g.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Clones
    for (const c of this.clones) {
      c.draw(ctx);
    }

    // Render Soul Puppeteer Puppets & Undead Minions
    for (const m of this.minions) {
      m.draw(ctx, this);
    }

    // Render Enemies
    for (const e of this.enemies) {
      e.draw(ctx);
    }

    // Render Player
    this.renderPlayer(ctx);

    // Render Projectiles
    for (const p of this.projectiles) {
      p.draw(ctx);
    }

    // Render Particles
    for (const pt of this.particles) {
      ctx.save();
      const alpha = Math.max(0, pt.life / pt.maxLife);
      ctx.globalAlpha = alpha;
      if (pt.glow) {
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Floating Texts: Relic procs FIRST (underneath), then normal hits, then crits, then hero/boss banners on top
    const orderedTexts = [...this.floatingTexts].sort((a, b) => {
      const aPriority = a.isRelic ? 0 : a.isDamage ? (a.isCrit ? 2 : 1) : 3;
      const bPriority = b.isRelic ? 0 : b.isDamage ? (b.isCrit ? 2 : 1) : 3;
      return aPriority - bPriority;
    });
    for (const ft of orderedTexts) {
      ctx.save();
      const progress = 1 - Math.max(0, ft.life / ft.maxLife);
      const baseAlpha = progress > 0.65 ? Math.max(0, (1 - progress) / 0.35) : 1;
      const alpha = ft.isRelic ? baseAlpha * 0.85 : baseAlpha;
      const popScale = ft.isDamage && progress < 0.16
        ? (ft.isCrit ? 1.32 - (progress / 0.16) * 0.32 : 1.14 - (progress / 0.16) * 0.14)
        : 1;
      ctx.globalAlpha = alpha;
      ctx.translate(ft.x, ft.y);
      ctx.scale(popScale, popScale);
      ctx.font = `${ft.isRelic ? 800 : 900} ${ft.fontSize}px Orbitron, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = ft.isRelic ? Math.max(2, ft.fontSize * 0.2) : Math.max(3, ft.fontSize * 0.24);
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.94)';
      ctx.strokeText(ft.text, 0, 0);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  public addRelicFloatingText(ft: FloatingText) {
    if (this.floatingTexts.length >= 90) {
      const oldestRelicIdx = this.floatingTexts.findIndex(item => item.isRelic);
      if (oldestRelicIdx >= 0) {
        this.floatingTexts.splice(oldestRelicIdx, 1);
      }
    }

    // Place Relic popups in a dedicated downward lane BELOW the target so they never cover rising damage numbers
    const laneOffsets = [0, -56, 56, -108, 108];
    const startY = Math.min(this.height - 20, ft.y + 24);
    let bestX = ft.x;
    let bestY = startY;
    let chosenLane = 0;
    let placed = false;

    for (let row = 0; row < 4 && !placed; row++) {
      for (let l = 0; l < laneOffsets.length; l++) {
        const candX = Math.max(60, Math.min(this.width - 60, ft.x + laneOffsets[l]));
        const candY = Math.min(this.height - 16, startY + row * 16);
        const collides = this.floatingTexts.some(existing =>
          (existing.isRelic && Math.abs(existing.x - candX) < 88 && Math.abs(existing.y - candY) < 15) ||
          (existing.isDamage && Math.abs(existing.x - candX) < 54 && Math.abs(existing.y - candY) < 18)
        );
        if (!collides) {
          bestX = candX;
          bestY = candY;
          chosenLane = laneOffsets[l];
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      const side = this.floatingTexts.length % 2 === 0 ? 1 : -1;
      bestX = Math.max(60, Math.min(this.width - 60, ft.x + side * 62));
      bestY = Math.min(this.height - 16, startY + (this.floatingTexts.length % 3) * 15);
    }

    this.floatingTexts.push({
      ...ft,
      x: bestX,
      y: bestY,
      fontSize: Math.min(ft.fontSize, 12),
      life: Math.min(ft.life, 0.85),
      maxLife: Math.min(ft.maxLife, 0.85),
      vy: Math.max(12, ft.vy),
      vx: ft.vx ?? (chosenLane !== 0 ? Math.sign(chosenLane) * 14 : 0),
      isRelic: true,
      isDamage: false
    });
  }

  public addStaggeredFloatingText(ft: FloatingText) {
    if (this.floatingTexts.length >= 90) {
      const oldestDmgIdx = this.floatingTexts.findIndex(item => item.isDamage);
      if (oldestDmgIdx >= 0) {
        this.floatingTexts.splice(oldestDmgIdx, 1);
      } else {
        this.floatingTexts.shift();
      }
    }

    const laneOffsets = [0, -28, 28, -52, 52];
    let bestX = ft.x;
    let bestY = ft.y;
    let chosenLane = 0;
    let placed = false;

    for (let row = 0; row < 6 && !placed; row++) {
      for (let l = 0; l < laneOffsets.length; l++) {
        const candX = ft.x + laneOffsets[l];
        const candY = ft.y - row * 19;
        const collides = this.floatingTexts.some(
          existing => existing.isDamage && Math.abs(existing.x - candX) < 34 && Math.abs(existing.y - candY) < 17
        );
        if (!collides) {
          bestX = candX;
          bestY = candY;
          chosenLane = laneOffsets[l];
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      const jitterSide = (this.floatingTexts.length % 2 === 0 ? 1 : -1);
      bestX = ft.x + jitterSide * (18 + (this.floatingTexts.length % 3) * 14);
      bestY = ft.y - 24 - (this.floatingTexts.length % 4) * 18;
      chosenLane = jitterSide * 24;
    }

    const defaultVx = chosenLane !== 0
      ? Math.sign(chosenLane) * 22
      : ((this.floatingTexts.length % 2 === 0 ? 1 : -1) * 14);

    this.floatingTexts.push({
      ...ft,
      x: bestX,
      y: bestY,
      vx: ft.vx ?? defaultVx
    });
  }

  public addDamageFloatingText(x: number, y: number, amount: number, isCrit: boolean, source: string) {
    const color = source === 'true_damage' ? '#38bdf8' : isCrit ? '#fbbf24' : '#ffffff';
    const fontSize = isCrit ? 20 : source === 'true_damage' ? 16 : 15;
    this.addStaggeredFloatingText({
      x,
      y: y - 18,
      text: `${Math.round(amount)}${isCrit ? '!' : ''}`,
      color,
      fontSize,
      life: isCrit ? 0.9 : 0.78,
      maxLife: isCrit ? 0.9 : 0.78,
      vy: isCrit ? -44 : -36,
      isDamage: true,
      isCrit
    });
  }

  private renderArenaGrid(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Center runic battle ring
    const cx = this.width / 2;
    const cy = this.height / 2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 340, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private renderSpatialZones(ctx: CanvasRenderingContext2D) {
    for (const z of this.spatialZones) {
      ctx.save();
      const fadeIn = Math.min(1, (z.maxDuration - z.duration) / 0.3);
      const fadeOut = Math.min(1, z.duration / 0.5);
      const alpha = Math.max(0.15, Math.min(fadeIn, fadeOut) * 0.75);
      ctx.globalAlpha = alpha;

      // Outer glowing ring
      ctx.strokeStyle = z.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = z.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Interior spatial hue
      ctx.fillStyle = `${z.color}18`;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
      ctx.fill();

      // Rotating celestial vortex lines / runes
      ctx.save();
      ctx.translate(z.x, z.y);
      ctx.rotate(z.pulseAngle);
      ctx.strokeStyle = `${z.color}60`;
      ctx.lineWidth = 1.5;
      const spokes = z.type === 'judge_collapse' ? 8 : 6;
      for (let s = 0; s < spokes; s++) {
        const a = (s / spokes) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * z.radius * 0.9, Math.sin(a) * z.radius * 0.9);
        ctx.stroke();
      }

      // Center core pulse
      if (z.type === 'judge_collapse') {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = z.color;
        ctx.stroke();
      }
      ctx.restore();

      ctx.restore();
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const px = this.playerPos.x;
    const py = this.playerPos.y;

    // Time stop or Rage aura
    if (this.player.isTimeStopActive) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, 34, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.player.rageTimer > 0) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, 28, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(px, py + 18, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body Circle
    ctx.shadowColor = this.heroConfig.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = this.heroConfig.color;
    ctx.beginPath();
    ctx.arc(px, py, 19, 0, Math.PI * 2);
    ctx.fill();

    // Inner detail
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 11, 0, Math.PI * 2);
    ctx.fill();

    // Facing Weapon Pointer
    ctx.strokeStyle = this.heroConfig.color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(
      px + Math.cos(this.playerPos.facing) * 26,
      py + Math.sin(this.playerPos.facing) * 26
    );
    ctx.stroke();

    // Permafrost Blizzard Heart visual aura
    if (this.acquiredAttributes.has('attr_frostbite_aura')) {
      ctx.save();
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.32)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(px, py, 190, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Arbiter Reality Edict gravity pulse aura ring
    if (this.acquiredAttributes.has('attr_reality_edict')) {
      ctx.save();
      const edictRadius = this.heroKey === 'dimension_judge' ? 243 : 195;
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.34)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.arc(px, py, edictRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Astral Mirror Barrier visual ring
    if (this.mirrorWardReady) {
      ctx.save();
      ctx.strokeStyle = '#f8fafc';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Celestial Star Orbs (3 rotating orbs around player)
    if (this.acquiredAttributes.has('attr_celestial_orbit')) {
      ctx.save();
      const orbitRadius = 78;
      for (let o = 0; o < 3; o++) {
        const a = this.orbitAngle + (o * Math.PI * 2) / 3;
        const ox = px + Math.cos(a) * orbitRadius;
        const oy = py + Math.sin(a) * orbitRadius;
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(ox, oy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ox, oy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Titan Aegis Hexagonal Barrier
    if (this.aegisShield > 0) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Date.now() * 0.002);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      const sides = 6;
      const radius = 28;
      for (let s = 0; s < sides; s++) {
        const a = (s * Math.PI * 2) / sides;
        const hx = Math.cos(a) * radius;
        const hy = Math.sin(a) * radius;
        if (s === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.fill();
      ctx.restore();
    }

    // Health bar above player
    const barW = 44;
    const barH = 5;
    const hpRatio = Math.max(0, this.player.hp / this.player.maxHp);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(px - barW / 2, py - 32, barW, barH);
    ctx.fillStyle = hpRatio > 0.3 ? '#10b981' : '#ef4444';
    ctx.fillRect(px - barW / 2, py - 32, barW * hpRatio, barH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - barW / 2, py - 32, barW, barH);

    // Aegis shield indicator text above health bar
    if (this.aegisShield > 0) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(`🛡️ ${Math.round(this.aegisShield)}`, px, py - 38);
    }

    // Valkyrie Frost Permafrost Ice Shield Visuals
    if ((this.player.frostArmorShield ?? 0) > 0) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-Date.now() * 0.003);
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      const octSides = 8;
      const rad = 32;
      for (let s = 0; s < octSides; s++) {
        const a = (s * Math.PI * 2) / octSides;
        const ox = Math.cos(a) * rad;
        const oy = Math.sin(a) * rad;
        if (s === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(`❄️ ${Math.round(this.player.frostArmorShield!)}`, px, py - (this.aegisShield > 0 ? 48 : 38));
    }

    // Monkey King Havoc Overdrive Aura & Jingu Combo Orbs
    if (this.heroKey === 'monkey' && (this.player.monkeyComboHits ?? 0) > 0) {
      ctx.save();
      const orbs = Math.min(3, this.player.monkeyComboHits ?? 0);
      for (let i = 0; i < orbs; i++) {
        const ang = Date.now() * 0.006 + (i * Math.PI * 2) / Math.max(1, orbs);
        const ox = px + Math.cos(ang) * 29;
        const oy = py + Math.sin(ang) * 29;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(ox, oy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if ((this.player.monkeyHavocTimer ?? 0) > 0) {
      ctx.save();
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.12;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(px, py, 36 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Soul Puppeteer: Orbiting Forged Soul Orbs, Possessed Ring & Ascendant Lich Form
    if (this.heroKey === 'soul_puppeteer') {
      const soulOrbs = Math.min(6, Math.floor((this.player.souls || 0) / 5));
      if (soulOrbs > 0) {
        ctx.save();
        for (let i = 0; i < soulOrbs; i++) {
          const ang = Date.now() * 0.003 + (i * Math.PI * 2) / soulOrbs;
          const sx = px + Math.cos(ang) * 34;
          const sy = py + Math.sin(ang) * 34;
          ctx.shadowColor = '#e879f9';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#f0abfc';
          ctx.beginPath();
          ctx.arc(sx, sy, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if ((this.player.puppetPossessTimer ?? 0) > 0) {
        ctx.save();
        const phasePulse = 1 + Math.sin(Date.now() * 0.012) * 0.1;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(px, py, 32 * phasePulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(34, 211, 238, 0.14)';
        ctx.fill();
        ctx.fillStyle = '#67e8f9';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👻 UNTARGETABLE', px, py + 32);
        ctx.restore();
      }
      if ((this.player.lichTransformTimer ?? 0) > 0) {
        ctx.save();
        const t = Date.now() * 0.004;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#e879f9';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(px, py, 40 + Math.sin(t) * 4, 0, Math.PI * 2);
        ctx.stroke();

        // Lich Wings / Spikes
        for (let w = 0; w < 6; w++) {
          const wa = t * 0.5 + (w * Math.PI * 2) / 6;
          ctx.beginPath();
          ctx.moveTo(px + Math.cos(wa) * 24, py + Math.sin(wa) * 24);
          ctx.lineTo(px + Math.cos(wa) * 48, py + Math.sin(wa) * 48);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Solaris Ignis: Solar Heat flame orbs & Supernova Avatar aura
    if (this.heroKey === 'solaris') {
      const heatOrbs = Math.min(6, Math.floor((this.player.solarHeat || 0) / 4));
      if (heatOrbs > 0) {
        ctx.save();
        for (let i = 0; i < heatOrbs; i++) {
          const ang = Date.now() * 0.004 + (i * Math.PI * 2) / heatOrbs;
          const sx = px + Math.cos(ang) * 32;
          const sy = py + Math.sin(ang) * 32;
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#fb923c';
          ctx.beginPath();
          ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if ((this.player.solarAvatarTimer ?? 0) > 0) {
        ctx.save();
        const t = Date.now() * 0.006;
        const pulse = 1 + Math.sin(t) * 0.10;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(px, py, 38 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        for (let r = 0; r < 8; r++) {
          const ra = t * 0.4 + (r * Math.PI * 2) / 8;
          ctx.beginPath();
          ctx.moveTo(px + Math.cos(ra) * 24, py + Math.sin(ra) * 24);
          ctx.lineTo(px + Math.cos(ra) * 44, py + Math.sin(ra) * 44);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Fallen Angel: Six Eclipse Wings, Shattered Halo & Orbiting Black Feathers
    if (this.heroKey === 'fallen_angel') {
      const isEclipse = (this.player.angelEclipseTimer ?? 0) > 0;
      const wingScale = isEclipse ? 1.45 : 1.0;
      const t = Date.now() * 0.005;
      ctx.save();
      ctx.strokeStyle = isEclipse ? '#fb7185' : '#a855f7';
      ctx.shadowColor = isEclipse ? '#e11d48' : '#c084fc';
      ctx.shadowBlur = isEclipse ? 20 : 12;
      ctx.lineWidth = isEclipse ? 3.2 : 2.2;
      // 3 pairs of Fallen Seraph wings
      for (const side of [-1, 1]) {
        for (let w = 0; w < 3; w++) {
          const flap = Math.sin(t + w * 0.7) * 0.14;
          const baseA = (side === 1 ? -0.35 : Math.PI + 0.35) + side * (w * 0.42 + flap);
          const wingLen = (30 - w * 4) * wingScale;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + Math.cos(baseA) * wingLen, py + Math.sin(baseA) * wingLen);
          ctx.stroke();
        }
      }
      // Shattered Fallen Halo above head
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 4]);
      ctx.beginPath();
      ctx.ellipse(px, py - 24, 14, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Orbiting Fallen Feathers
      const featherOrbs = Math.min(6, Math.floor((this.player.angelFeathers || 0) / 2));
      for (let i = 0; i < featherOrbs; i++) {
        const ang = t * 0.85 + (i * Math.PI * 2) / featherOrbs;
        const fx = px + Math.cos(ang) * 32;
        const fy = py + Math.sin(ang) * 32;
        ctx.fillStyle = i % 2 === 0 ? '#e11d48' : '#c084fc';
        ctx.beginPath();
        ctx.arc(fx, fy, 3.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Demon Raised: Archfiend Horns, Hellfire Crown Aura & Essence Embers
    if (this.heroKey === 'demon_raised') {
      const isAwakened = (this.player.demonAwakenTimer ?? 0) > 0;
      const t = Date.now() * 0.006;
      ctx.save();
      // Demonic Horns
      ctx.strokeStyle = isAwakened ? '#fda4af' : '#fb7185';
      ctx.shadowColor = '#e11d48';
      ctx.shadowBlur = isAwakened ? 20 : 12;
      ctx.lineWidth = isAwakened ? 3.5 : 2.6;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(px + side * 8, py - 12);
        ctx.quadraticCurveTo(px + side * 20, py - 24, px + side * 14, py - 32);
        ctx.stroke();
      }

      // Hellfire Essence embers orbiting
      const emberCount = Math.min(6, Math.floor((this.player.demonEssence || 0) / 4));
      for (let i = 0; i < emberCount; i++) {
        const ang = t * 0.75 + (i * Math.PI * 2) / emberCount;
        const ex = px + Math.cos(ang) * 33;
        const ey = py + Math.sin(ang) * 33;
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(ex, ey, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isAwakened) {
        const pulse = 1 + Math.sin(t * 1.4) * 0.1;
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, 39 * pulse, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Demonis: Orbiting Void Shards, Shadow Veil Cloak & Abyssal Ascendance Aura
    if (this.heroKey === 'demonis') {
      const fcd = this.player.demonisFCD || 0;
      const shards = Math.min(6, Math.floor(fcd / 5));
      if (shards > 0) {
        ctx.save();
        for (let i = 0; i < shards; i++) {
          const ang = Date.now() * 0.0045 + (i * Math.PI * 2) / shards;
          const vx = px + Math.cos(ang) * 33;
          const vy = py + Math.sin(ang) * 33;
          ctx.shadowColor = fcd >= 30 ? '#f0abfc' : '#a855f7';
          ctx.shadowBlur = 12;
          ctx.fillStyle = fcd >= 30 ? '#f472b6' : '#c084fc';
          ctx.beginPath();
          ctx.arc(vx, vy, 4.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (this.player.swiftTimer > 0) {
        ctx.save();
        ctx.strokeStyle = '#d946ef';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 5]);
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(px, py, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (fcd >= 30) {
        ctx.save();
        const t = Date.now() * 0.005;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(px, py, 39 + Math.sin(t) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Traveler: Chronos Clockwork Ring, Stance Weapon Arc & Overdrive Halo
    if (this.heroKey === 'traveler') {
      const t = Date.now() * 0.003;
      const overdrive = (this.player.travelerOverdriveTimer ?? 0) > 0;
      const stance = this.player.travelerStance;
      const stanceColor = stance === 'sword' ? '#22d3ee' : stance === 'bow' ? '#38bdf8' : '#a5f3fc';

      // Rotating Chronos Dial around Traveler
      ctx.save();
      ctx.strokeStyle = overdrive ? '#fbbf24' : stanceColor;
      ctx.lineWidth = overdrive ? 2.2 : 1.5;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.arc(px, py, 29, t, t + Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Stance weapon indicator along facing direction
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(this.playerPos.facing);
      ctx.strokeStyle = stanceColor;
      ctx.shadowColor = stanceColor;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.8;
      if (stance === 'sword') {
        ctx.beginPath();
        ctx.arc(10, 0, 18, -0.85, 0.85);
        ctx.stroke();
      } else if (stance === 'bow') {
        ctx.beginPath();
        ctx.arc(4, 0, 22, -1.05, 1.05);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.arc(28, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      if (overdrive) {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 8]);
        const auraR = this.unlockedTraits.has('t_s4_u1') ? 345 : 230;
        ctx.beginPath();
        ctx.arc(px, py, auraR, -t * 0.7, -t * 0.7 + Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Rift Walker: Orbiting Quantum Blades, Warp Shroud Ring & Void Storm Aura
    if (this.heroKey === 'rift_walker') {
      const t = Date.now() * 0.006;
      const warping = (this.player.riftWarpBuffTimer ?? 0) > 0;
      const storming = (this.player.riftStormTimer ?? 0) > 0;
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const ang = t + (i * Math.PI * 2) / 3;
        const bx = px + Math.cos(ang) * 32;
        const by = py + Math.sin(ang) * 32;
        ctx.shadowColor = storming ? '#fbbf24' : '#22d3ee';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = storming ? '#fde047' : '#67e8f9';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx - Math.cos(ang + 1.2) * 7, by - Math.sin(ang + 1.2) * 7);
        ctx.lineTo(bx + Math.cos(ang + 1.2) * 7, by + Math.sin(ang + 1.2) * 7);
        ctx.stroke();
      }
      if (warping || storming) {
        ctx.strokeStyle = storming ? '#facc15' : '#22d3ee';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([8, 5]);
        ctx.beginPath();
        ctx.arc(px, py, storming ? 42 : 35, -t, -t + Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // --- Visual Helpers ---
  public createShockwave(x: number, y: number, color: string, maxRadius: number) {
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const speed = maxRadius * 2.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3,
        color,
        life: 0.35,
        maxLife: 0.35,
        glow: true
      });
    }
  }

  public createSlashEffect(x1: number, y1: number, x2: number, y2: number, color: string) {
    const angle = Math.atan2(y2 - y1, x1 - x2);
    for (let i = -3; i <= 3; i++) {
      this.particles.push({
        x: x2 + (Math.random() - 0.5) * 20,
        y: y2 + (Math.random() - 0.5) * 20,
        vx: Math.sin(angle + i * 0.2) * 120,
        vy: Math.cos(angle + i * 0.2) * 120,
        radius: 3.5,
        color,
        life: 0.25,
        maxLife: 0.25,
        glow: true
      });
    }
  }

  public createLaserBeam(x1: number, y1: number, x2: number, y2: number, color: string, width: number) {
    for (let step = 0; step < 20; step++) {
      const t = step / 20;
      const lx = x1 + (x2 - x1) * t;
      const ly = y1 + (y2 - y1) * t;
      this.particles.push({
        x: lx,
        y: ly,
        vx: (Math.random() - 0.5) * 50,
        vy: (Math.random() - 0.5) * 50,
        radius: width / 4,
        color,
        life: 0.4,
        maxLife: 0.4,
        glow: true
      });
    }
  }

  public createLaserEffect(x1: number, y1: number, x2: number, y2: number, color: string, width: number = 6) {
    this.createLaserBeam(x1, y1, x2, y2, color, width);
  }

  public createLightningChain(x1: number, y1: number, x2: number, y2: number, color: string) {
    const segments = 6;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const lx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 24;
      const ly = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 24;
      this.particles.push({
        x: lx,
        y: ly,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        radius: 3,
        color,
        life: 0.3,
        maxLife: 0.3,
        glow: true
      });
    }
  }

  private createDeathSplatter(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 120 + 30;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 2,
        color,
        life: 0.5,
        maxLife: 0.5
      });
    }
  }

  private createPuffParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        radius: 4,
        color,
        life: 0.4,
        maxLife: 0.4
      });
    }
  }

  public getClosestEnemy(x: number, y: number): EnemyEntity | null {
    let closest: EnemyEntity | null = null;
    let minDist = Infinity;
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
    }
    return closest;
  }

  private distanceToSegment(p: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    const t = Math.max(0, Math.min(1, ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }
}

// --- Supporting Entity Classes ---

export class EnemyEntity {
  public x: number;
  public y: number;
  public type: string;
  public isBoss: boolean;
  public bossCategory?: BossCategory;
  public name: string;
  public maxHp: number;
  public hp: number;
  public atk: number;
  public defense: number;
  public speed: number;
  public radius: number;
  public color: string;
  public expValue: number;
  public stunTimer: number = 0;
  public chronoSlowTimer: number = 0;
  public attackCooldown: number = 0;
  private attackTelegraphTimer: number = 0;
  private bossSkillRotation: number = 0;
  private bossChargeTimer: number = 0;
  private tankLastStandUsed: boolean = false;
  private bossEnraged: boolean = false;
  public warriorBerserkTimer: number = 0;
  private warriorHealPopupCd: number = 0;
  public isCorruptedHero: boolean = false;
  public corruptedHeroKey?: HeroKey;
  public level: number = 1;
  public corruptSkillTimer: number = 0;
  public poisonTimer: number = 0;
  public corruptedShield: number = 0;
  public corruptSkillRotation: number = 0;
  public corruptRageTimer: number = 0;
  public orbitHitCd: number = 0;
  public doomScytheCd: number = 0;
  public frostSlowTimer: number = 0;
  public abyssalMarks: number = 0;
  public abyssalMarkTimer: number = 0;
  public sunderStacks: number = 0;
  public sunderTimer: number = 0;
  public blightTimer: number = 0;
  public neurotoxinTimer: number = 0;
  public riftMarks: number = 0;

  constructor(x: number, y: number, type: string, waveMult: number, isBoss: boolean = false, corruptedHeroKey?: HeroKey) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.isBoss = isBoss;

    let baseHp = 260;
    let baseAtk = 28;
    this.radius = 18;
    this.color = '#ef4444';
    this.defense = 14;
    this.expValue = 50;
    this.speed = 124;
    this.name = 'Void Crawler';

    if (type === 'bandit') {
      baseHp = 200;
      baseAtk = 36;
      this.defense = 12;
      this.speed = 176;
      this.color = '#f97316';
      this.name = 'Shadow Bandit';
      this.expValue = 65;
    } else if (type === 'wari') {
      // Category: TANK (Fortress Boss - Massive HP, Armor & Barrier)
      baseHp = isBoss ? 10500 : 720;
      baseAtk = isBoss ? 62 : 36;
      this.radius = isBoss ? 38 : 24;
      this.color = '#10b981';
      this.defense = isBoss ? 115 : 26;
      this.speed = isBoss ? 85 : 88;
      this.name = isBoss ? 'WARI THE IRON BASTION' : 'Armored Brute (Lapisan Baja)';
      this.expValue = isBoss ? 950 : 165;
      if (isBoss) this.bossCategory = 'Tank';
    } else if (type === 'dank') {
      // Category: WARRIOR (Heavy Bruiser - High ATK & Aggressive Cleaves)
      this.isBoss = true;
      this.bossCategory = 'Warrior';
      baseHp = 8800;
      baseAtk = 82;
      this.radius = 40;
      this.color = '#f97316';
      this.defense = 48;
      this.speed = 112;
      this.name = 'DANK ABYSSAL WARLORD';
      this.expValue = 1350;
    } else if (type === 'shadow_assassin') {
      // Category: ASSASSIN (Burst Ambush, High Speed & Evasion)
      this.isBoss = true;
      this.bossCategory = 'Assassin';
      baseHp = 7400;
      baseAtk = 95;
      this.radius = 28;
      this.color = '#06b6d4';
      this.defense = 34;
      this.speed = 178;
      this.name = 'NYX PHANTOM REAPER';
      this.expValue = 1900;
    } else if (type === 'void_dragon') {
      // Category: MANIPULATION (Massive Void Control, Zones & Barrages)
      this.isBoss = true;
      this.bossCategory = 'Manipulation';
      baseHp = 12800;
      baseAtk = 80;
      this.radius = 46;
      this.color = '#a855f7';
      this.defense = 52;
      this.speed = 95;
      this.name = 'VOID DREAD ARCHITECT';
      this.expValue = 2800;
    } else if (type === 'dummy') {
      baseHp = 150000;
      baseAtk = 0;
      this.radius = 26;
      this.color = '#fbbf24';
      this.defense = 10;
      this.speed = 0;
      this.name = 'Training Dummy';
      this.expValue = 0;
    } else if (type === 'dummy_striker') {
      baseHp = 60000;
      baseAtk = 35;
      this.radius = 24;
      this.color = '#fb7185';
      this.defense = 15;
      this.speed = 115;
      this.name = 'Combat Dummy';
      this.expValue = 0;
    } else if (type === 'corrupted_hero') {
      this.isBoss = true;
      this.isCorruptedHero = true;
      this.level = 10;
      this.corruptedHeroKey = corruptedHeroKey || 'monkey';
      const cHero = HERO_DATABASE[this.corruptedHeroKey];
      const cName = cHero ? cHero.name : 'HERO';
      const categoryMap: Record<HeroKey, BossCategory> = {
        valkyrie: 'Tank',
        monkey: 'Warrior',
        traveler: 'Warrior',
        solaris: 'Warrior',
        demon_raised: 'Warrior',
        demonis: 'Assassin',
        rift_walker: 'Assassin',
        fallen_angel: 'Assassin',
        dimension_judge: 'Manipulation',
        soul_puppeteer: 'Manipulation'
      };
      this.bossCategory = categoryMap[this.corruptedHeroKey] || 'Warrior';
      baseHp = 14500;
      baseAtk = 115;
      this.radius = 34;
      this.color = '#dc2626';
      this.defense = 70;
      this.speed = 165;
      this.name = `[LV. 10] CORRUPTED ${cName}`;
      this.expValue = 6500;
    }

    this.maxHp = type === 'dummy'
      ? Math.round(baseHp * Math.max(1, waveMult * 0.5))
      : Math.round(baseHp * waveMult);
    this.hp = this.maxHp;
    this.atk = type === 'dummy' ? 0 : Math.round(baseAtk * waveMult);
    if (!this.isBoss && type !== 'dummy') {
      this.defense = Math.round(this.defense * (1 + Math.max(0, waveMult - 1) * 0.35));
    }
    if (this.isCorruptedHero) {
      this.corruptedShield = Math.round(this.maxHp * (this.bossCategory === 'Tank' ? 0.55 : 0.45));
    } else if (this.isBoss) {
      const shieldPct =
        this.bossCategory === 'Tank' ? 0.45 :
        this.bossCategory === 'Manipulation' ? 0.35 :
        this.bossCategory === 'Warrior' ? 0.25 : 0.20;
      this.corruptedShield = Math.round(this.maxHp * shieldPct);
    }
  }

  public update(dt: number, engine: GameEngine) {
    if (engine.player.isTimeStopActive) return;

    // Toxic Spores poison tick
    if (this.poisonTimer > 0) {
      this.poisonTimer -= dt;
      const poisonDmg = 75 * dt;
      this.hp -= poisonDmg;
      engine.totalDamageDealt += poisonDmg;
      if (Math.random() < 0.2) {
        engine.particles.push({
          x: this.x + (Math.random() - 0.5) * 16,
          y: this.y + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 20,
          vy: -25,
          radius: 2.5,
          color: '#10b981',
          life: 0.35,
          maxLife: 0.35
        });
      }
    }

    if (this.chronoSlowTimer > 0) {
      this.chronoSlowTimer -= dt;
    }
    if (this.frostSlowTimer > 0) {
      this.frostSlowTimer -= dt;
    }
    if (this.orbitHitCd > 0) {
      this.orbitHitCd -= dt;
    }
    if (this.doomScytheCd > 0) {
      this.doomScytheCd -= dt;
    }
    if (this.abyssalMarkTimer > 0) {
      this.abyssalMarkTimer -= dt;
      if (this.abyssalMarkTimer <= 0) {
        this.abyssalMarks = 0;
      }
    }
    if (this.sunderTimer > 0) {
      this.sunderTimer -= dt;
      if (this.sunderTimer <= 0) {
        this.sunderStacks = 0;
      }
    }
    if (this.blightTimer > 0) {
      this.blightTimer -= dt;
      const blightDps = Math.min(this.isBoss ? 350 : 180, this.maxHp * 0.025) * dt;
      this.hp -= blightDps;
      engine.totalDamageDealt += blightDps;
      if (Math.random() < 0.2) {
        engine.particles.push({
          x: this.x + (Math.random() - 0.5) * 18,
          y: this.y + (Math.random() - 0.5) * 18,
          vx: (Math.random() - 0.5) * 18,
          vy: -24,
          radius: 2.5,
          color: '#d946ef',
          life: 0.35,
          maxLife: 0.35
        });
      }
    }
    if (this.neurotoxinTimer > 0) {
      this.neurotoxinTimer = Math.max(0, this.neurotoxinTimer - dt);
      const stacks = Math.max(1, (engine as unknown as { venomFangStacks: number }).venomFangStacks || 1);
      const toxDmg = 35 * stacks * dt;
      this.hp -= toxDmg;
      engine.totalDamageDealt += toxDmg;
      if (Math.random() < 0.2) {
        engine.particles.push({
          x: this.x + (Math.random() - 0.5) * 16,
          y: this.y + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 18,
          vy: -22,
          radius: 2.5,
          color: '#22c55e',
          life: 0.35,
          maxLife: 0.35
        });
      }
    }
    if (this.bossChargeTimer > 0) {
      this.bossChargeTimer -= dt;
    }
    if (this.warriorBerserkTimer > 0) {
      this.warriorBerserkTimer = Math.max(0, this.warriorBerserkTimer - dt);
    }
    if (this.warriorHealPopupCd > 0) {
      this.warriorHealPopupCd = Math.max(0, this.warriorHealPopupCd - dt);
    }

    if (this.stunTimer > 0) {
      // All Bosses have Boss Tenacity: shake off stuns 2.5x faster (5x during Warrior Berserker)
      const stunDecay = this.isBoss ? (this.warriorBerserkTimer > 0 ? 5.0 : 2.5) : 1;
      this.stunTimer -= dt * stunDecay;
      return;
    }

    if (this.type === 'dummy') {
      // Stationary Training Dummy stays anchored and never attacks
      return;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Determine target: Player or closest living Clone / Puppet Minion
    let targetX = engine.playerPos.x;
    let targetY = engine.playerPos.y;
    let targetRadius = 18;
    let targetClone: CloneEntity | null = null;
    let targetMinion: PuppetMinionEntity | null = null;
    const playerUntargetable = (engine.player.puppetPossessTimer ?? 0) > 0;
    let minDist = playerUntargetable ? Infinity : Math.hypot(targetX - this.x, targetY - this.y);

    for (const c of engine.clones) {
      if (c.hp > 0 && c.lifeTimer > 0) {
        const d = Math.hypot(c.x - this.x, c.y - this.y);
        if (d < minDist) {
          minDist = d;
          targetX = c.x;
          targetY = c.y;
          targetRadius = c.radius;
          targetClone = c;
          targetMinion = null;
        }
      }
    }

    for (const m of engine.minions) {
      if (m.hp > 0 && m.lifeTimer > 0 && m.possessTimer <= 0) {
        const d = Math.hypot(m.x - this.x, m.y - this.y);
        if (d < minDist) {
          minDist = d;
          targetX = m.x;
          targetY = m.y;
          targetRadius = m.radius;
          targetMinion = m;
          targetClone = null;
        }
      }
    }

    if (!targetClone && !targetMinion) {
      minDist = Math.hypot(targetX - this.x, targetY - this.y);
    }

    // Movement towards chosen target
    if (minDist > this.radius + targetRadius) {
      const angle = Math.atan2(targetY - this.y, targetX - this.x);
      let moveSpeed = (this.isCorruptedHero && this.corruptRageTimer > 0) ? this.speed * 1.4 : this.speed;
      if (this.bossEnraged) {
        moveSpeed *= 1.22;
      }
      if (this.warriorBerserkTimer > 0) {
        moveSpeed *= 1.45;
      }
      if (this.bossChargeTimer > 0) {
        moveSpeed *= 1.75;
      }
      if (this.chronoSlowTimer > 0) {
        moveSpeed *= this.isBoss ? 0.82 : 0.6;
      }
      if (this.frostSlowTimer > 0) {
        moveSpeed *= this.isBoss ? 0.85 : 0.70;
      }
      this.x += Math.cos(angle) * moveSpeed * dt;
      this.y += Math.sin(angle) * moveSpeed * dt;
    } else if (this.attackCooldown <= 0) {
      let strikeAtk = (this.isCorruptedHero && this.corruptRageTimer > 0) ? this.atk * 1.65 : this.atk;
      if (this.bossEnraged) {
        strikeAtk *= 1.2;
      }
      if (this.warriorBerserkTimer > 0) {
        strikeAtk *= 1.35;
      }
      if (targetClone && targetClone.hp > 0) {
        targetClone.takeDamage(strikeAtk, engine);
        engine.createSlashEffect(this.x, this.y, targetClone.x, targetClone.y, '#ef4444');
      } else if (targetMinion && targetMinion.hp > 0) {
        targetMinion.takeDamage(strikeAtk, engine);
        engine.createSlashEffect(this.x, this.y, targetMinion.x, targetMinion.y, '#e879f9');
      } else {
        engine.damagePlayer(strikeAtk);
      }
      const baseAttackCd =
        (this.isCorruptedHero && this.corruptRageTimer > 0) ? 0.55 :
        this.isBoss ? (this.bossEnraged ? 0.65 : 0.9) :
        this.type === 'bandit' ? 0.78 : 0.95;
      this.attackCooldown = this.warriorBerserkTimer > 0 ? baseAttackCd * 0.68 : baseAttackCd;
    }

    // Keep enemy bounded near arena so knockbacks never strand enemies offscreen
    this.x = Math.max(-45, Math.min(engine.width + 45, this.x));
    this.y = Math.max(-45, Math.min(engine.height + 45, this.y));

    // Corrupted Hero Skill AI
    if (this.isCorruptedHero) {
      if (this.corruptRageTimer > 0) {
        this.corruptRageTimer -= dt;
      }
      this.corruptSkillTimer += dt;
      const skillInterval = this.corruptRageTimer > 0 ? 1.2 : 1.7;
      if (this.corruptSkillTimer >= skillInterval) {
        this.corruptSkillTimer = 0;
        this.castCorruptedSkill(engine);
      }
    }

    // Unique Boss Category Skill AI (Tank, Warrior, Assassin, Manipulation)
    if (this.isBoss && !this.isCorruptedHero) {
      // Tank Boss passive Iron Regeneration (2.2% Max HP/s, reduced 65% by Grievous Blight)
      if (this.bossCategory === 'Tank' && this.hp > 0 && this.hp < this.maxHp) {
        const regenMult = this.blightTimer > 0 ? 0.35 : 1.0;
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.022 * regenMult * dt);
      }

      this.attackTelegraphTimer += dt;
      const baseCd =
        this.bossCategory === 'Assassin' ? 2.6 :
        this.bossCategory === 'Tank' ? 3.0 :
        this.bossCategory === 'Warrior' ? 3.0 : 3.1;
      const skillCd = (this.bossEnraged ? baseCd * 0.75 : baseCd) * (this.warriorBerserkTimer > 0 ? 0.72 : 1.0);
      if (this.attackTelegraphTimer >= skillCd) {
        this.attackTelegraphTimer = 0;
        this.castBossUniqueSkill(engine);
      }
    }
  }

  public castBossUniqueSkill(engine: GameEngine) {
    const cat = this.bossCategory || 'Tank';
    const skillCount = cat === 'Warrior' ? 4 : 3;
    const skillIndex = this.bossSkillRotation % skillCount;
    this.bossSkillRotation = (this.bossSkillRotation + 1) % skillCount;

    if (cat === 'Tank') {
      // TANK BOSS: Wari the Iron Bastion
      if (skillIndex === 0) {
        // Skill 1: Fortress Aegis (Absorb Barrier + Self-Heal + Knockback Pulse)
        const shieldAdd = Math.round(this.maxHp * 0.30);
        const maxShieldCap = Math.round(this.maxHp * 0.65);
        this.corruptedShield = Math.min(maxShieldCap, this.corruptedShield + shieldAdd);
        const healMult = this.blightTimer > 0 ? 0.35 : 1.0;
        this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * 0.08 * healMult));
        sounds.playSkill('buff');
        engine.createShockwave(this.x, this.y, '#10b981', 185);
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🛡️ [TANK] FORTRESS AEGIS (+SHIELD & HEAL)!',
          color: '#34d399',
          fontSize: 17,
          life: 1.4,
          maxLife: 1.4,
          vy: -28
        });
        const pd = Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y);
        if (pd <= 185 && (engine.player.puppetPossessTimer ?? 0) <= 0) {
          const ang = Math.atan2(engine.playerPos.y - this.y, engine.playerPos.x - this.x);
          engine.playerPos.x = Math.max(30, Math.min(engine.width - 30, engine.playerPos.x + Math.cos(ang) * 95));
          engine.playerPos.y = Math.max(30, Math.min(engine.height - 30, engine.playerPos.y + Math.sin(ang) * 95));
          engine.damagePlayer(this.atk * 1.55);
        }
        for (const c of engine.clones) {
          if (c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) <= 185) {
            c.takeDamage(this.atk * 1.55, engine);
          }
        }
      } else if (skillIndex === 1) {
        // Skill 2: Seismic Earthshatter (Wide Stomp Telegraph)
        sounds.playBossAlert();
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🪨 [TANK] SEISMIC EARTHSHATTER!',
          color: '#10b981',
          fontSize: 17,
          life: 1.4,
          maxLife: 1.4,
          vy: -28
        });
        const slamX = this.x;
        const slamY = this.y;
        engine.telegraphs.push({
          x: slamX,
          y: slamY,
          radius: 215,
          timer: 0,
          maxTimer: 1.1,
          color: '#10b981',
          onTrigger: () => {
            sounds.playExplosion();
            engine.cameraShake = 14;
            engine.createShockwave(slamX, slamY, '#10b981', 225);
            if (Math.hypot(engine.playerPos.x - slamX, engine.playerPos.y - slamY) <= 215) {
              engine.damagePlayer(this.atk * 2.15);
            }
            for (const c of engine.clones) {
              if (c.hp > 0 && Math.hypot(c.x - slamX, c.y - slamY) <= 215) {
                c.takeDamage(this.atk * 2.15, engine);
              }
            }
          }
        });
      } else {
        // Skill 3: Iron Bastion Triple Slam toward player
        sounds.playSkill('slash');
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🛡️ [TANK] IRON BASTION SLAM!',
          color: '#6ee7b7',
          fontSize: 17,
          life: 1.4,
          maxLife: 1.4,
          vy: -28
        });
        const ang = Math.atan2(engine.playerPos.y - this.y, engine.playerPos.x - this.x);
        for (let step = 1; step <= 3; step++) {
          const sx = Math.max(40, Math.min(engine.width - 40, this.x + Math.cos(ang) * step * 90));
          const sy = Math.max(40, Math.min(engine.height - 40, this.y + Math.sin(ang) * step * 90));
          engine.telegraphs.push({
            x: sx,
            y: sy,
            radius: 125,
            timer: 0,
            maxTimer: 0.55 + step * 0.3,
            color: '#34d399',
            onTrigger: () => {
              sounds.playExplosion();
              engine.createShockwave(sx, sy, '#34d399', 130);
              if (Math.hypot(engine.playerPos.x - sx, engine.playerPos.y - sy) <= 125) {
                engine.damagePlayer(this.atk * 1.75);
              }
              for (const c of engine.clones) {
                if (c.hp > 0 && Math.hypot(c.x - sx, c.y - sy) <= 125) {
                  c.takeDamage(this.atk * 1.75, engine);
                }
              }
            }
          });
        }
      }
    } else if (cat === 'Warrior') {
      // WARRIOR BOSS: Dank Abyssal Warlord
      if (skillIndex === 0) {
        // Skill 1: Bloodcleave Whirlwind + Berserk Charge + Frenzy Heal
        this.bossChargeTimer = 2.8;
        sounds.playSkill('dash');
        engine.createShockwave(this.x, this.y, '#f97316', 200);
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '⚔️ [WARRIOR] BLOODCLEAVE WHIRLWIND!',
          color: '#fb923c',
          fontSize: 17,
          life: 1.4,
          maxLife: 1.4,
          vy: -28
        });
        let hitTarget = false;
        if (Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y) <= 200) {
          engine.damagePlayer(this.atk * 1.85);
          hitTarget = true;
        }
        for (const c of engine.clones) {
          if (c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) <= 200) {
            c.takeDamage(this.atk * 1.85, engine);
            hitTarget = true;
          }
        }
        if (hitTarget) {
          this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * 0.05));
        }
      } else if (skillIndex === 1) {
        // Skill 2: BERSERKER (Bloodlust Frenzy: +45% Move & Attack Speed, +35% ATK, CC Cleanse + Crimson Rage Nova)
        this.warriorBerserkTimer = 6.0;
        this.bossChargeTimer = Math.max(this.bossChargeTimer, 3.0);
        this.stunTimer = 0;
        this.chronoSlowTimer = 0;
        this.frostSlowTimer = 0;
        const healMult = this.blightTimer > 0 ? 0.35 : 1.0;
        this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * 0.05 * healMult));
        sounds.playBossAlert();
        sounds.playExplosion();
        engine.cameraShake = 12;
        engine.createShockwave(this.x, this.y, '#ef4444', 210);
        engine.createShockwave(this.x, this.y, '#f97316', 145);
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 40,
          text: '🩸 [WARRIOR] BERSERKER! (+45% SPD/ASPD, +35% ATK)',
          color: '#ef4444',
          fontSize: 18,
          life: 1.8,
          maxLife: 1.8,
          vy: -32
        });
        const berserkDmg = this.atk * 1.9;
        if (Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y) <= 195) {
          engine.damagePlayer(berserkDmg);
        }
        for (const c of engine.clones) {
          if (c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) <= 195) {
            c.takeDamage(berserkDmg, engine);
          }
        }
        for (const m of engine.minions) {
          if (m.hp > 0 && m.possessTimer <= 0 && Math.hypot(m.x - this.x, m.y - this.y) <= 195) {
            m.takeDamage(berserkDmg, engine);
          }
        }
      } else if (skillIndex === 2) {
        // Skill 3: Executioner's Guillotine (Targeted Heavy Cleave + 8 Waves)
        sounds.playBossAlert();
        const tx = engine.playerPos.x;
        const ty = engine.playerPos.y;
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🪓 [WARRIOR] EXECUTIONER GUILLOTINE!',
          color: '#f97316',
          fontSize: 17,
          life: 1.4,
          maxLife: 1.4,
          vy: -28
        });
        engine.telegraphs.push({
          x: tx,
          y: ty,
          radius: 155,
          timer: 0,
          maxTimer: 0.85,
          color: '#ea580c',
          onTrigger: () => {
            sounds.playExplosion();
            engine.cameraShake = 14;
            engine.createShockwave(tx, ty, '#f97316', 165);
            engine.createSlashEffect(this.x, this.y, tx, ty, '#fb923c');
            if (Math.hypot(engine.playerPos.x - tx, engine.playerPos.y - ty) <= 155) {
              engine.damagePlayer(this.atk * 2.4);
            }
            for (const c of engine.clones) {
              if (c.hp > 0 && Math.hypot(c.x - tx, c.y - ty) <= 155) {
                c.takeDamage(this.atk * 2.4, engine);
              }
            }
            for (let k = 0; k < 8; k++) {
              const ang = (k * Math.PI * 2) / 8;
              engine.projectiles.push(new ProjectileEntity(
                tx, ty, tx + Math.cos(ang) * 400, ty + Math.sin(ang) * 400,
                460, Math.round(this.atk * 1.05), false, '#fb923c', 'corrupted_hero'
              ));
            }
          }
        });
      } else {
        // Skill 4: Warlord Battle Roar (10 Radial Cleave Shockwaves + Armor Surge)
        this.bossChargeTimer = 2.2;
        this.corruptedShield = Math.min(Math.round(this.maxHp * 0.35), this.corruptedShield + Math.round(this.maxHp * 0.12));
        sounds.playSkill('slash');
        engine.createShockwave(this.x, this.y, '#ef4444', 160);
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🔥 [WARRIOR] WARLORD SHOCKWAVE!',
          color: '#f87171',
          fontSize: 17,
          life: 1.4,
          maxLife: 1.4,
          vy: -28
        });
        for (let i = 0; i < 10; i++) {
          const ang = (i * Math.PI * 2) / 10;
          engine.projectiles.push(new ProjectileEntity(
            this.x, this.y, this.x + Math.cos(ang) * 480, this.y + Math.sin(ang) * 480,
            470, Math.round(this.atk * 1.1), false, '#f97316', 'corrupted_hero'
          ));
        }
      }
    } else if (cat === 'Assassin') {
      // ASSASSIN BOSS: Nyx Phantom Reaper
      if (skillIndex === 0) {
        // Skill 1: Phantom Blink Ambush (Teleport Behind Player + Delayed Shadow Bomb)
        const prevX = this.x;
        const prevY = this.y;
        const ang = Math.atan2(engine.playerPos.y - prevY, engine.playerPos.x - prevX);
        this.x = Math.max(40, Math.min(engine.width - 40, engine.playerPos.x + Math.cos(ang) * 55));
        this.y = Math.max(40, Math.min(engine.height - 40, engine.playerPos.y + Math.sin(ang) * 55));
        sounds.playSkill('warp');
        engine.createLaserBeam(prevX, prevY, this.x, this.y, '#06b6d4', 12);
        engine.createSlashEffect(this.x, this.y, engine.playerPos.x, engine.playerPos.y, '#f43f5e');
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🗡️ [ASSASSIN] PHANTOM BLINK AMBUSH!',
          color: '#22d3ee',
          fontSize: 17,
          life: 1.4,
          maxLife: 1.4,
          vy: -28
        });
        if (Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y) <= 110) {
          engine.damagePlayer(this.atk * 1.75);
        }
        const bombX = this.x;
        const bombY = this.y;
        engine.telegraphs.push({
          x: bombX,
          y: bombY,
          radius: 130,
          timer: 0,
          maxTimer: 0.72,
          color: '#f43f5e',
          onTrigger: () => {
            sounds.playExplosion();
            engine.createShockwave(bombX, bombY, '#f43f5e', 135);
            if (Math.hypot(engine.playerPos.x - bombX, engine.playerPos.y - bombY) <= 130) {
              engine.damagePlayer(this.atk * 1.85);
            }
            for (const c of engine.clones) {
              if (c.hp > 0 && Math.hypot(c.x - bombX, c.y - bombY) <= 130) {
                c.takeDamage(this.atk * 1.85, engine);
              }
            }
          }
        });
      } else if (skillIndex === 1) {
        // Skill 2: Shuriken Shadow Barrage (9 Fast Fan Daggers + 2 Shadow Bandits)
        sounds.playSkill('laser');
        engine.createShockwave(this.x, this.y, '#06b6d4', 110);
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🌀 [ASSASSIN] SHURIKEN BARRAGE!',
          color: '#67e8f9',
          fontSize: 17,
          life: 1.4,
          maxLife: 1.4,
          vy: -28
        });
        const baseAng = Math.atan2(engine.playerPos.y - this.y, engine.playerPos.x - this.x);
        for (let i = -4; i <= 4; i++) {
          const a = baseAng + i * 0.14;
          engine.projectiles.push(new ProjectileEntity(
            this.x, this.y, this.x + Math.cos(a) * 550, this.y + Math.sin(a) * 550,
            580, Math.round(this.atk * 0.95), false, '#22d3ee', 'corrupted_hero'
          ));
        }
        if (engine.enemies.length < 16) {
          for (let d = 0; d < 2; d++) {
            const decoy = new EnemyEntity(this.x + (d === 0 ? -45 : 45), this.y + 30, 'bandit', 1.2, false);
            decoy.name = 'Phantom Decoy';
            decoy.color = '#06b6d4';
            decoy.hp = Math.round(this.maxHp * 0.12);
            decoy.maxHp = decoy.hp;
            decoy.atk = Math.round(this.atk * 0.75);
            engine.enemies.push(decoy);
          }
        }
      } else {
        // Skill 3: Phantom Cross-Slash (4 Rapid Sequential Ambush Telegraphs)
        sounds.playSkill('warp');
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '💨 [ASSASSIN] PHANTOM CROSS-SLASH!',
          color: '#f43f5e',
          fontSize: 17,
          life: 1.4,
          maxLife: 1.4,
          vy: -28
        });
        for (let s = 0; s < 4; s++) {
          const ang = (s * Math.PI * 2) / 4 + Math.random() * 0.35;
          const sx = Math.max(40, Math.min(engine.width - 40, engine.playerPos.x + Math.cos(ang) * 60));
          const sy = Math.max(40, Math.min(engine.height - 40, engine.playerPos.y + Math.sin(ang) * 60));
          engine.telegraphs.push({
            x: sx,
            y: sy,
            radius: 110,
            timer: 0,
            maxTimer: 0.45 + s * 0.25,
            color: '#06b6d4',
            onTrigger: () => {
              sounds.playSkill('slash');
              engine.createShockwave(sx, sy, '#06b6d4', 115);
              engine.createSlashEffect(sx - 45, sy - 45, sx + 45, sy + 45, '#22d3ee');
              if (Math.hypot(engine.playerPos.x - sx, engine.playerPos.y - sy) <= 110) {
                engine.damagePlayer(this.atk * 1.5);
              }
              for (const c of engine.clones) {
                if (c.hp > 0 && Math.hypot(c.x - sx, c.y - sy) <= 110) {
                  c.takeDamage(this.atk * 1.5, engine);
                }
              }
            }
          });
        }
      }
    } else {
      // MANIPULATION BOSS: Void Dread Architect
      if (skillIndex === 0) {
        // Skill 1: Gravity Singularity Rift (Pulls Player & Clones then Explodes)
        sounds.playSkill('void');
        const gx = engine.playerPos.x;
        const gy = engine.playerPos.y;
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🕳️ [MANIPULATION] GRAVITY SINGULARITY!',
          color: '#c084fc',
          fontSize: 17,
          life: 1.5,
          maxLife: 1.5,
          vy: -28
        });
        engine.spatialZones.push({
          x: gx,
          y: gy,
          radius: 230,
          duration: 2.3,
          maxDuration: 2.3,
          type: 'judge_collapse',
          color: '#a855f7',
          pulseAngle: 0,
          owner: 'corrupted_hero',
          damage: Math.round(this.atk * 2.1)
        });
      } else if (skillIndex === 1) {
        // Skill 2: Temporal Chrono Prison + 12 Void Orbs
        sounds.playTimeStop();
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '⏳ [MANIPULATION] TEMPORAL CHRONO PRISON!',
          color: '#a855f7',
          fontSize: 17,
          life: 1.5,
          maxLife: 1.5,
          vy: -28
        });
        engine.spatialZones.push({
          x: engine.playerPos.x,
          y: engine.playerPos.y,
          radius: 260,
          duration: 4.5,
          maxDuration: 4.5,
          type: 'traveler_chrono',
          color: '#818cf8',
          pulseAngle: 0,
          owner: 'corrupted_hero'
        });
        for (let i = 0; i < 12; i++) {
          const ang = (i * Math.PI * 2) / 12;
          engine.projectiles.push(new ProjectileEntity(
            this.x, this.y, this.x + Math.cos(ang) * 480, this.y + Math.sin(ang) * 480,
            390, Math.round(this.atk * 1.0), false, '#c084fc', 'corrupted_hero'
          ));
        }
      } else {
        // Skill 3: Void Rift Meteors (5 Staggered Rifts + 2 Void Spawns)
        sounds.playBossAlert();
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🔮 [MANIPULATION] VOID RIFT METEORS!',
          color: '#e879f9',
          fontSize: 17,
          life: 1.5,
          maxLife: 1.5,
          vy: -28
        });
        for (let r = 0; r < 5; r++) {
          const ang = (r * Math.PI * 2) / 5 + Math.random() * 0.4;
          const dist = r === 0 ? 0 : 130;
          const rx = Math.max(50, Math.min(engine.width - 50, engine.playerPos.x + Math.cos(ang) * dist));
          const ry = Math.max(50, Math.min(engine.height - 50, engine.playerPos.y + Math.sin(ang) * dist));
          engine.telegraphs.push({
            x: rx,
            y: ry,
            radius: 130,
            timer: 0,
            maxTimer: 0.65 + r * 0.2,
            color: '#a855f7',
            onTrigger: () => {
              sounds.playExplosion();
              engine.createShockwave(rx, ry, '#a855f7', 140);
              if (Math.hypot(engine.playerPos.x - rx, engine.playerPos.y - ry) <= 130) {
                engine.damagePlayer(this.atk * 1.6);
              }
              for (const c of engine.clones) {
                if (c.hp > 0 && Math.hypot(c.x - rx, c.y - ry) <= 130) {
                  c.takeDamage(this.atk * 1.6, engine);
                }
              }
            }
          });
        }
        if (engine.enemies.length < 16) {
          for (let m = 0; m < 2; m++) {
            const minion = new EnemyEntity(this.x + (m === 0 ? -55 : 55), this.y + 40, 'crawler', 1.8, false);
            minion.name = 'Void Spawn';
            minion.color = '#a855f7';
            minion.hp = Math.round(this.maxHp * 0.08);
            minion.maxHp = minion.hp;
            engine.enemies.push(minion);
          }
        }
      }
    }
  }

  public castCorruptedSkill(engine: GameEngine) {
    sounds.playBossAlert();
    const heroKey = this.corruptedHeroKey || 'monkey';
    const skillIndex = this.corruptSkillRotation;
    this.corruptSkillRotation = (this.corruptSkillRotation + 1) % 4;

    if (heroKey === 'monkey') {
      if (skillIndex === 0) {
        // Skill 1: Corrupted Simian Shadows (Double Clones)
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🐒 [SKILL 1] CORRUPTED SIMIAN SHADOWS!',
          color: '#f87171',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        engine.createShockwave(this.x, this.y, '#dc2626', 150);
        for (let i = 0; i < 2; i++) {
          const darkMinion = new EnemyEntity(this.x + (Math.random() - 0.5) * 60, this.y + (Math.random() - 0.5) * 60, 'bandit', 1.0, false);
          darkMinion.name = 'Corrupted Shadow Clone';
          darkMinion.color = '#b91c1c';
          darkMinion.hp = 750;
          darkMinion.maxHp = 750;
          darkMinion.atk = Math.round(this.atk * 0.7);
          darkMinion.speed = 150;
          engine.enemies.push(darkMinion);
        }
      } else if (skillIndex === 1) {
        // Skill 2: Golden Staff Heavy Slam
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '⚡ [SKILL 2] CORRUPTED GOLDEN STAFF SLAM!',
          color: '#fbbf24',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        const targetX = engine.playerPos.x;
        const targetY = engine.playerPos.y;
        engine.createLaserBeam(this.x, this.y, targetX, targetY, '#f59e0b', 24);
        engine.telegraphs.push({
          x: targetX,
          y: targetY,
          radius: 140,
          timer: 0,
          maxTimer: 1.0,
          color: '#dc2626',
          onTrigger: () => {
            sounds.playExplosion();
            engine.createShockwave(targetX, targetY, '#dc2626', 160);
            if (Math.hypot(engine.playerPos.x - targetX, engine.playerPos.y - targetY) <= 140) {
              engine.damagePlayer(this.atk * 1.8);
            }
            for (const c of engine.clones) {
              if (Math.hypot(c.x - targetX, c.y - targetY) <= 140) {
                c.takeDamage(this.atk * 1.8, engine);
              }
            }
          }
        });
      } else if (skillIndex === 2) {
        // Skill 3: Somersault Cloud Gale Cyclone
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '☁️ [SKILL 3] SOMERSAULT GALE CYCLONE!',
          color: '#fef08a',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('dash');
        const oldX = this.x;
        const oldY = this.y;
        this.x = engine.playerPos.x + (Math.random() - 0.5) * 80;
        this.y = engine.playerPos.y + (Math.random() - 0.5) * 80;
        engine.createLaserBeam(oldX, oldY, this.x, this.y, '#fef08a', 20);
        engine.createShockwave(this.x, this.y, '#f59e0b', 190);
        if (Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y) <= 190) {
          engine.damagePlayer(this.atk * 1.5);
        }
      } else {
        // Skill 4: Havoc in Heaven: Divine Colossus Pillar
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '👑 [ULTIMATE] HAVOC IN HEAVEN: DIVINE PILLAR!',
          color: '#fbbf24',
          fontSize: 18,
          life: 2.0,
          maxLife: 2.0,
          vy: -35
        });
        sounds.playBossAlert();
        sounds.playExplosion();
        this.corruptRageTimer = 8;
        engine.createShockwave(this.x, this.y, '#f59e0b', 240);
        engine.createShockwave(this.x, this.y, '#dc2626', 180);
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI * 2) / 8;
          const tx = this.x + Math.cos(ang) * 450;
          const ty = this.y + Math.sin(ang) * 450;
          engine.projectiles.push(new ProjectileEntity(
            this.x, this.y, tx, ty, 420, Math.round(this.atk * 0.9), false, '#dc2626', 'corrupted_hero'
          ));
        }
      }
    } else if (heroKey === 'demonis') {
      if (skillIndex === 0) {
        // Skill 1: Corrupted Void Barrage
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🌌 [SKILL 1] CORRUPTED VOID BARRAGE!',
          color: '#c084fc',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('void');
        const baseAngle = Math.atan2(engine.playerPos.y - this.y, engine.playerPos.x - this.x);
        const count = 12;
        const spread = 1.3;
        const start = baseAngle - spread / 2;
        const step = spread / (count - 1);
        for (let i = 0; i < count; i++) {
          const ang = start + step * i;
          engine.projectiles.push(new ProjectileEntity(
            this.x, this.y, this.x + Math.cos(ang) * 450, this.y + Math.sin(ang) * 450, 480, Math.round(this.atk * 0.75), false, '#9333ea', 'corrupted_hero'
          ));
        }
      } else if (skillIndex === 1) {
        // Skill 2: Demon Crescent Cleave
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '⚔️ [SKILL 2] DEMON CRESCENT CLEAVE!',
          color: '#ef4444',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('slash');
        const baseAngle = Math.atan2(engine.playerPos.y - this.y, engine.playerPos.x - this.x);
        for (let i = -1; i <= 1; i++) {
          const ang = baseAngle + i * 0.25;
          engine.projectiles.push(new ProjectileEntity(
            this.x, this.y, this.x + Math.cos(ang) * 500, this.y + Math.sin(ang) * 500, 520, Math.round(this.atk * 1.2), false, '#dc2626', 'corrupted_hero'
          ));
        }
      } else if (skillIndex === 2) {
        // Skill 3: Infernal Void Eruption
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🔥 [SKILL 3] INFERNAL VOID ERUPTION!',
          color: '#f97316',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('explosion');
        for (let i = 0; i < 4; i++) {
          const ox = engine.playerPos.x + (Math.random() - 0.5) * 160;
          const oy = engine.playerPos.y + (Math.random() - 0.5) * 160;
          engine.telegraphs.push({
            x: ox,
            y: oy,
            radius: 85,
            timer: 0,
            maxTimer: 1.0,
            color: '#7c3aed',
            onTrigger: () => {
              sounds.playExplosion();
              engine.createShockwave(ox, oy, '#7c3aed', 100);
              if (Math.hypot(engine.playerPos.x - ox, engine.playerPos.y - oy) <= 85) {
                engine.damagePlayer(this.atk * 1.3);
              }
            }
          });
        }
      } else {
        // Skill 4: Full Charged Void Cataclysm
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '💥 [ULTIMATE] FULL CHARGED DEMONIS CATACLYSM!',
          color: '#a855f7',
          fontSize: 18,
          life: 1.8,
          maxLife: 1.8,
          vy: -35
        });
        this.corruptRageTimer = 7;
        engine.createShockwave(this.x, this.y, '#9333ea', 200);
        for (let i = 0; i < 18; i++) {
          const ang = (i * Math.PI * 2) / 18;
          engine.projectiles.push(new ProjectileEntity(
            this.x, this.y, this.x + Math.cos(ang) * 500, this.y + Math.sin(ang) * 500, 440, Math.round(this.atk * 0.85), false, '#c084fc', 'corrupted_hero'
          ));
        }
      }
    } else if (heroKey === 'dimension_judge') {
      if (skillIndex === 0) {
        // Skill 1: Spatial Collapse
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🌀 [SKILL 1] CORRUPTED SPATIAL COLLAPSE!',
          color: '#a855f7',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('warp');
        engine.spatialZones.push({
          x: engine.playerPos.x,
          y: engine.playerPos.y,
          radius: 200,
          duration: 3.5,
          maxDuration: 3.5,
          type: 'judge_collapse',
          color: '#dc2626',
          pulseAngle: 0,
          owner: 'corrupted_hero',
          damage: Math.round(this.atk * 1.9)
        });
      } else if (skillIndex === 1) {
        // Skill 2: Dimensional Cross Slices
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '✂️ [SKILL 2] DIMENSIONAL CROSS SLICES!',
          color: '#c084fc',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('slash');
        const px = engine.playerPos.x;
        const py = engine.playerPos.y;
        engine.telegraphs.push({
          x: px,
          y: py,
          radius: 140,
          timer: 0,
          maxTimer: 1.0,
          color: '#9333ea',
          onTrigger: () => {
            sounds.playExplosion();
            engine.createLaserEffect(px - 300, py, px + 300, py, '#c084fc', 8);
            engine.createLaserEffect(px, py - 300, px, py + 300, '#c084fc', 8);
            if (Math.abs(engine.playerPos.x - px) < 40 || Math.abs(engine.playerPos.y - py) < 40) {
              engine.damagePlayer(this.atk * 1.5);
            }
          }
        });
      } else if (skillIndex === 2) {
        // Skill 3: Gravity Distortion Field
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🪐 [SKILL 3] GRAVITY DISTORTION MATRIX!',
          color: '#8b5cf6',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('warp');
        engine.spatialZones.push({
          x: this.x,
          y: this.y,
          radius: 220,
          duration: 4.5,
          maxDuration: 4.5,
          type: 'traveler_chrono',
          color: '#8b5cf6',
          pulseAngle: 0,
          owner: 'corrupted_hero'
        });
      } else {
        // Skill 4: Spatiotemporal Execution
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🌌 [ULTIMATE] SPATIOTEMPORAL EXECUTION!',
          color: '#ef4444',
          fontSize: 18,
          life: 1.8,
          maxLife: 1.8,
          vy: -35
        });
        sounds.playBossAlert();
        this.x = engine.playerPos.x + (Math.random() > 0.5 ? 90 : -90);
        this.y = engine.playerPos.y + (Math.random() > 0.5 ? 90 : -90);
        engine.createShockwave(this.x, this.y, '#dc2626', 220);
        if (Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y) <= 220) {
          engine.damagePlayer(this.atk * 2.0);
        }
      }
    } else if (heroKey === 'traveler') {
      if (skillIndex === 0) {
        // Skill 1: Chrono Shift Ambush
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '⏳ [SKILL 1] CHRONO SHIFT AMBUSH!',
          color: '#38bdf8',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('dash');
        const angle = Math.atan2(engine.playerPos.y - this.y, engine.playerPos.x - this.x);
        this.x = engine.playerPos.x - Math.cos(angle) * 70;
        this.y = engine.playerPos.y - Math.sin(angle) * 70;
        engine.createSlashEffect(this.x, this.y, engine.playerPos.x, engine.playerPos.y, '#38bdf8');
        engine.damagePlayer(this.atk * 1.5);
      } else if (skillIndex === 1) {
        // Skill 2: Temporal Rewind Barrier
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🛡️ [SKILL 2] TEMPORAL REWIND BARRIER!',
          color: '#06b6d4',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('buff');
        this.corruptedShield += Math.round(this.maxHp * 0.16);
        engine.createShockwave(this.x, this.y, '#06b6d4', 180);
      } else if (skillIndex === 2) {
        // Skill 3: Chrono Distortion Zone
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '⌛ [SKILL 3] TIME DISTORTION FIELD!',
          color: '#0ea5e9',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('warp');
        engine.spatialZones.push({
          x: this.x,
          y: this.y,
          radius: 200,
          duration: 5.0,
          maxDuration: 5.0,
          type: 'traveler_chrono',
          color: '#ef4444',
          pulseAngle: 0,
          owner: 'corrupted_hero'
        });
      } else {
        // Skill 4: Berserk Time Stasis
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🛑 [ULTIMATE] BERSERK CHRONO STASIS!',
          color: '#ef4444',
          fontSize: 18,
          life: 2.0,
          maxLife: 2.0,
          vy: -35
        });
        sounds.playBossAlert();
        this.corruptRageTimer = 8;
        engine.createShockwave(this.x, this.y, '#dc2626', 240);
        for (let s = 0; s < 6; s++) {
          const ox = engine.playerPos.x + (Math.random() - 0.5) * 120;
          const oy = engine.playerPos.y + (Math.random() - 0.5) * 120;
          engine.createSlashEffect(this.x, this.y, ox, oy, '#dc2626');
          if (Math.hypot(engine.playerPos.x - ox, engine.playerPos.y - oy) <= 60) {
            engine.damagePlayer(this.atk * 0.7);
          }
        }
      }
    } else if (heroKey === 'rift_walker') {
      if (skillIndex === 0) {
        // Skill 1: Blink Strike
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🌀 [SKILL 1] BLINK PIERCE STRIKE!',
          color: '#06b6d4',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('dash');
        const oldX = this.x;
        const oldY = this.y;
        this.x = engine.playerPos.x + (Math.random() > 0.5 ? 65 : -65);
        this.y = engine.playerPos.y + (Math.random() > 0.5 ? 65 : -65);
        engine.createLaserEffect(oldX, oldY, this.x, this.y, '#06b6d4', 6);
        engine.createShockwave(this.x, this.y, '#06b6d4', 120);
        if (Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y) <= 120) {
          engine.damagePlayer(this.atk * 1.5);
        }
      } else if (skillIndex === 1) {
        // Skill 2: Phase Decoy Ambush
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '👻 [SKILL 2] PHASE DECOY AMBUSH!',
          color: '#a855f7',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('warp');
        const decoyX = this.x;
        const decoyY = this.y;
        this.x = engine.playerPos.x + (Math.random() - 0.5) * 200;
        this.y = engine.playerPos.y + (Math.random() - 0.5) * 200;
        engine.telegraphs.push({
          x: decoyX,
          y: decoyY,
          radius: 130,
          timer: 0,
          maxTimer: 1.2,
          color: '#8b5cf6',
          onTrigger: () => {
            sounds.playExplosion();
            engine.createShockwave(decoyX, decoyY, '#8b5cf6', 150);
            if (Math.hypot(engine.playerPos.x - decoyX, engine.playerPos.y - decoyY) <= 130) {
              engine.damagePlayer(this.atk * 1.6);
            }
          }
        });
      } else if (skillIndex === 2) {
        // Skill 3: Dual Warp Portals
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🚪 [SKILL 3] DUAL WARP GATES!',
          color: '#38bdf8',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('void');
        const p1x = engine.playerPos.x - 180;
        const p1y = engine.playerPos.y;
        const p2x = engine.playerPos.x + 180;
        const p2y = engine.playerPos.y;
        engine.createShockwave(p1x, p1y, '#06b6d4', 80);
        engine.createShockwave(p2x, p2y, '#06b6d4', 80);
        for (let i = 0; i < 4; i++) {
          engine.projectiles.push(new ProjectileEntity(
            p1x, p1y, engine.playerPos.x + (i - 1.5) * 30, engine.playerPos.y, 450, Math.round(this.atk * 0.8), false, '#06b6d4', 'corrupted_hero'
          ));
          engine.projectiles.push(new ProjectileEntity(
            p2x, p2y, engine.playerPos.x + (i - 1.5) * 30, engine.playerPos.y, 450, Math.round(this.atk * 0.8), false, '#06b6d4', 'corrupted_hero'
          ));
        }
      } else {
        // Skill 4: Omnipresent Void Storm
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🌀 [ULTIMATE] OMNIPRESENT VOID STORM!',
          color: '#ec4899',
          fontSize: 18,
          life: 2.0,
          maxLife: 2.0,
          vy: -35
        });
        sounds.playBossAlert();
        this.corruptRageTimer = 8;
        for (let b = 0; b < 5; b++) {
          const bAng = (b * Math.PI * 2) / 5;
          const bx = engine.playerPos.x + Math.cos(bAng) * 130;
          const by = engine.playerPos.y + Math.sin(bAng) * 130;
          engine.telegraphs.push({
            x: bx,
            y: by,
            radius: 80,
            timer: 0,
            maxTimer: 0.3 + b * 0.25,
            color: '#ec4899',
            onTrigger: () => {
              sounds.playExplosion();
              engine.createShockwave(bx, by, '#ec4899', 90);
              if (Math.hypot(engine.playerPos.x - bx, engine.playerPos.y - by) <= 80) {
                engine.damagePlayer(this.atk * 0.9);
              }
            }
          });
        }
      }
    } else if (heroKey === 'soul_puppeteer') {
      if (skillIndex === 0) {
        // Skill 1: Corrupted Soul Thread Barrage
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🪆 [SKILL 1] CURSED THREAD VOLLEY!',
          color: '#e879f9',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('void');
        const baseAng = Math.atan2(engine.playerPos.y - this.y, engine.playerPos.x - this.x);
        for (let k = -2; k <= 2; k++) {
          const ang = baseAng + k * 0.22;
          engine.projectiles.push(new ProjectileEntity(
            this.x, this.y, this.x + Math.cos(ang) * 450, this.y + Math.sin(ang) * 450, 460, Math.round(this.atk * 0.85), false, '#e879f9', 'corrupted_hero'
          ));
        }
      } else if (skillIndex === 1) {
        // Skill 2: Necromancer Summon Wave
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '💀 [SKILL 2] NECROMANCER THRALLS!',
          color: '#4ade80',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playBossAlert();
        for (let i = 0; i < 2; i++) {
          const ang = (i * Math.PI) + Math.random();
          const sx = Math.max(30, Math.min(engine.width - 30, this.x + Math.cos(ang) * 70));
          const sy = Math.max(30, Math.min(engine.height - 30, this.y + Math.sin(ang) * 70));
          engine.enemies.push(new EnemyEntity(sx, sy, 'bandit', 1 + (engine.wave - 1) * 0.35));
        }
      } else {
        // Skill 3/4: Sovereign Soul Cataclysm
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '👑 [ULTIMATE] CORRUPTED LICH CATACLYSM!',
          color: '#fbbf24',
          fontSize: 18,
          life: 1.8,
          maxLife: 1.8,
          vy: -35
        });
        sounds.playExplosion();
        const tx = engine.playerPos.x;
        const ty = engine.playerPos.y;
        engine.telegraphs.push({
          x: tx,
          y: ty,
          radius: 170,
          timer: 0,
          maxTimer: 1.0,
          color: '#e879f9',
          onTrigger: () => {
            sounds.playExplosion();
            engine.createShockwave(tx, ty, '#e879f9', 180);
            if (Math.hypot(engine.playerPos.x - tx, engine.playerPos.y - ty) <= 170) {
              engine.damagePlayer(this.atk * 1.9);
            }
          }
        });
      }
    } else if (heroKey === 'solaris') {
      // Solaris Ignis Corrupted Hero: 4 Solar Flare Skills
      if (skillIndex === 0) {
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🔥 [SKILL 1] CORRUPTED SOLAR LANCE!',
          color: '#f97316',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('slash');
        const oldX = this.x;
        const oldY = this.y;
        this.x = engine.playerPos.x + (Math.random() > 0.5 ? 55 : -55);
        this.y = engine.playerPos.y + (Math.random() > 0.5 ? 55 : -55);
        engine.createLaserBeam(oldX, oldY, this.x, this.y, '#f97316', 16);
        engine.createShockwave(this.x, this.y, '#fb923c', 120);
        if (Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y) <= 125) {
          engine.damagePlayer(this.atk * 1.65);
        }
      } else if (skillIndex === 1) {
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '☀️ [SKILL 2] CORRUPTED CORONA NOVA!',
          color: '#facc15',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playExplosion();
        this.corruptedShield += Math.round(this.maxHp * 0.14);
        engine.createShockwave(this.x, this.y, '#f97316', 195);
        if (Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y) <= 195) {
          engine.damagePlayer(this.atk * 1.6);
        }
      } else if (skillIndex === 2) {
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '☄️ [SKILL 3] CORRUPTED STARFALL METEORS!',
          color: '#fb923c',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playBossAlert();
        for (let m = 0; m < 3; m++) {
          const mx = engine.playerPos.x + (m - 1) * 90;
          const my = engine.playerPos.y + (Math.random() - 0.5) * 70;
          engine.telegraphs.push({
            x: mx,
            y: my,
            radius: 95,
            timer: 0,
            maxTimer: 0.4 + m * 0.25,
            color: '#f97316',
            onTrigger: () => {
              sounds.playExplosion();
              engine.createShockwave(mx, my, '#f97316', 110);
              if (Math.hypot(engine.playerPos.x - mx, engine.playerPos.y - my) <= 95) {
                engine.damagePlayer(this.atk * 1.45);
              }
            }
          });
        }
      } else {
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '☀️ [ULTIMATE] ECLIPSE SUPERNOVA!',
          color: '#ef4444',
          fontSize: 18,
          life: 2.0,
          maxLife: 2.0,
          vy: -35
        });
        sounds.playBossAlert();
        this.corruptRageTimer = 8;
        engine.createShockwave(this.x, this.y, '#f97316', 235);
        if (Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y) <= 235) {
          engine.damagePlayer(this.atk * 2.0);
        }
      }
    } else if (this.corruptedHeroKey === 'valkyrie') {
      // Valkyrie Frost Corrupted Hero: 4 Glacial Skills
      if (skillIndex === 0) {
        // Skill 1: Corrupted Glacial Piercing Rush
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '❄️ [SKILL 1] CORRUPTED GLACIAL PIERCE!',
          color: '#38bdf8',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('slash');
        const oldX = this.x;
        const oldY = this.y;
        this.x = engine.playerPos.x + (Math.random() > 0.5 ? 55 : -55);
        this.y = engine.playerPos.y + (Math.random() > 0.5 ? 55 : -55);
        engine.createLaserBeam(oldX, oldY, this.x, this.y, '#38bdf8', 16);
        engine.createShockwave(this.x, this.y, '#38bdf8', 120);
        if (Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y) <= 120) {
          engine.damagePlayer(this.atk * 1.6);
        }
      } else if (skillIndex === 1) {
        // Skill 2: Corrupted Cryo Vortex & Shards
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '💎 [SKILL 2] CORRUPTED CRYO VORTEX!',
          color: '#7dd3fc',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('void');
        engine.createShockwave(this.x, this.y, '#38bdf8', 180);
        for (let i = 0; i < 9; i++) {
          const ang = (i * Math.PI * 2) / 9;
          engine.projectiles.push(new ProjectileEntity(
            this.x, this.y, this.x + Math.cos(ang) * 450, this.y + Math.sin(ang) * 450, 420, Math.round(this.atk * 0.9), false, '#7dd3fc', 'corrupted_hero'
          ));
        }
      } else if (skillIndex === 2) {
        // Skill 3: Corrupted Glacial Fortress
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🛡️ [SKILL 3] CORRUPTED GLACIAL FORTRESS!',
          color: '#38bdf8',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('buff');
        this.corruptedShield += Math.round(this.maxHp * 0.16);
        engine.createShockwave(this.x, this.y, '#38bdf8', 200);
        if (Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y) <= 200) {
          engine.damagePlayer(this.atk * 1.6);
        }
      } else {
        // Skill 4: Ragnarok Glacial Calamity
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '❄️ [ULTIMATE] RAGNAROK GLACIAL CALAMITY!',
          color: '#0284c7',
          fontSize: 18,
          life: 2.0,
          maxLife: 2.0,
          vy: -35
        });
        sounds.playBossAlert();
        this.corruptRageTimer = 8;
        for (let s = 0; s < 5; s++) {
          const ox = engine.playerPos.x + (s - 2) * 85;
          const oy = engine.playerPos.y + (Math.random() - 0.5) * 80;
          engine.telegraphs.push({
            x: ox,
            y: oy,
            radius: 100,
            timer: 0,
            maxTimer: 0.3 + s * 0.2,
            color: '#38bdf8',
            onTrigger: () => {
              sounds.playExplosion();
              engine.createShockwave(ox, oy, '#7dd3fc', 120);
              if (Math.hypot(engine.playerPos.x - ox, engine.playerPos.y - oy) <= 100) {
                engine.damagePlayer(this.atk * 1.4);
              }
            }
          });
        }
      }
    } else if (this.corruptedHeroKey === 'fallen_angel') {
      // Fallen Angel Corrupted Hero: 4 Eclipse Seraph Skills
      if (skillIndex === 0) {
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🪶 [SKILL 1] CORRUPTED FEATHER FAN!',
          color: '#c084fc',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('slash');
        const baseAng = Math.atan2(engine.playerPos.y - this.y, engine.playerPos.x - this.x);
        for (let i = -3; i <= 3; i++) {
          const ang = baseAng + i * 0.16;
          engine.projectiles.push(new ProjectileEntity(
            this.x, this.y, this.x + Math.cos(ang) * 520, this.y + Math.sin(ang) * 520, 480, Math.round(this.atk * 0.95), false, '#c084fc', 'corrupted_hero'
          ));
        }
      } else if (skillIndex === 1) {
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🪽 [SKILL 2] CORRUPTED HALO DASH!',
          color: '#e879f9',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('warp');
        const oldX = this.x;
        const oldY = this.y;
        this.x = Math.max(40, Math.min(engine.width - 40, engine.playerPos.x + (Math.random() > 0.5 ? 65 : -65)));
        this.y = Math.max(40, Math.min(engine.height - 40, engine.playerPos.y + (Math.random() > 0.5 ? 65 : -65)));
        engine.createLaserBeam(oldX, oldY, this.x, this.y, '#c084fc', 14);
        engine.createShockwave(oldX, oldY, '#e11d48', 155);
        if (Math.hypot(engine.playerPos.x - oldX, engine.playerPos.y - oldY) <= 155) {
          engine.damagePlayer(this.atk * 1.65);
        }
      } else if (skillIndex === 2) {
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '⚖️ [SKILL 3] ABYSSAL JUDGEMENT!',
          color: '#f472b6',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playBossAlert();
        const jx = engine.playerPos.x;
        const jy = engine.playerPos.y;
        engine.telegraphs.push({
          x: jx,
          y: jy,
          radius: 145,
          timer: 0,
          maxTimer: 0.55,
          color: '#c084fc',
          onTrigger: () => {
            sounds.playExplosion();
            engine.createShockwave(jx, jy, '#a855f7', 145);
            if (Math.hypot(engine.playerPos.x - jx, engine.playerPos.y - jy) <= 145) {
              engine.damagePlayer(this.atk * 1.9);
            }
          }
        });
      } else {
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🪽 [ULTIMATE] ECLIPSE OF THE FALLEN!',
          color: '#e11d48',
          fontSize: 18,
          life: 2.0,
          maxLife: 2.0,
          vy: -35
        });
        sounds.playBossAlert();
        this.corruptRageTimer = 8;
        engine.createShockwave(this.x, this.y, '#e11d48', 225);
        for (let i = 0; i < 12; i++) {
          const ang = (i * Math.PI * 2) / 12;
          engine.projectiles.push(new ProjectileEntity(
            this.x, this.y, this.x + Math.cos(ang) * 520, this.y + Math.sin(ang) * 520, 440, Math.round(this.atk * 1.05), false, '#e11d48', 'corrupted_hero'
          ));
        }
      }
    } else if (this.corruptedHeroKey === 'demon_raised') {
      // Demon Raised Corrupted Hero: 4 Risen Archfiend Skills
      if (skillIndex === 0) {
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🔥 [SKILL 1] CORRUPTED HELLFIRE CLAW!',
          color: '#fb7185',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('slash');
        const ang = Math.atan2(engine.playerPos.y - this.y, engine.playerPos.x - this.x);
        const cx = this.x + Math.cos(ang) * 50;
        const cy = this.y + Math.sin(ang) * 50;
        engine.createShockwave(cx, cy, '#e11d48', 155);
        if (Math.hypot(engine.playerPos.x - cx, engine.playerPos.y - cy) <= 155) {
          engine.damagePlayer(this.atk * 1.75);
        }
      } else if (skillIndex === 1) {
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '⛓️ [SKILL 2] CORRUPTED ABYSSAL CHAINS!',
          color: '#e11d48',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playSkill('warp');
        this.corruptedShield += Math.round(this.maxHp * 0.14);
        engine.createShockwave(this.x, this.y, '#be123c', 210);
        if (Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y) <= 210) {
          engine.createLaserBeam(this.x, this.y, engine.playerPos.x, engine.playerPos.y, '#be123c', 7);
          engine.damagePlayer(this.atk * 1.55);
        }
      } else if (skillIndex === 2) {
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '🌋 [SKILL 3] INFERNAL PILLARS!',
          color: '#f97316',
          fontSize: 16,
          life: 1.5,
          maxLife: 1.5,
          vy: -30
        });
        sounds.playBossAlert();
        for (let p = 0; p < 4; p++) {
          const px = engine.playerPos.x + (p - 1.5) * 75;
          const py = engine.playerPos.y + (Math.random() - 0.5) * 70;
          engine.telegraphs.push({
            x: px,
            y: py,
            radius: 100,
            timer: 0,
            maxTimer: 0.35 + p * 0.2,
            color: '#e11d48',
            onTrigger: () => {
              sounds.playExplosion();
              engine.createShockwave(px, py, '#e11d48', 110);
              if (Math.hypot(engine.playerPos.x - px, engine.playerPos.y - py) <= 100) {
                engine.damagePlayer(this.atk * 1.5);
              }
            }
          });
        }
      } else {
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 35,
          text: '👹 [ULTIMATE] RISEN ARCHFIEND WRATH!',
          color: '#dc2626',
          fontSize: 18,
          life: 2.0,
          maxLife: 2.0,
          vy: -35
        });
        sounds.playBossAlert();
        this.corruptRageTimer = 8;
        this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * 0.08));
        engine.createShockwave(this.x, this.y, '#e11d48', 240);
        if (Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y) <= 240) {
          engine.damagePlayer(this.atk * 2.1);
        }
      }
    }
  }

  private applyWarriorOnHitHeal(engine: GameEngine) {
    if (this.isBoss && this.bossCategory === 'Warrior' && this.hp > 0 && this.hp < this.maxHp) {
      const healMult = this.blightTimer > 0 ? 0.35 : 1.0;
      const healAmt = Math.round(100 * healMult);
      this.hp = Math.min(this.maxHp, this.hp + healAmt);
      if (this.warriorHealPopupCd <= 0) {
        this.warriorHealPopupCd = 0.25;
        engine.floatingTexts.push({
          x: this.x + (Math.random() - 0.5) * 18,
          y: this.y - this.radius - 14,
          text: `🩸 +${healAmt} HP`,
          color: '#fb7185',
          fontSize: 13,
          life: 0.65,
          maxLife: 0.65,
          vy: -22
        });
      }
    }
  }

  public takeDamage(amount: number, isCrit: boolean, source: string, engine: GameEngine) {
    // Assassin Boss Shadow Evasion (20% base, 28% when enraged) against non-true damage
    if (this.isBoss && this.bossCategory === 'Assassin' && source !== 'true_damage') {
      const bossDodge = this.bossEnraged ? 0.28 : 0.20;
      if (Math.random() < bossDodge) {
        engine.floatingTexts.push({
          x: this.x + (Math.random() - 0.5) * 20,
          y: this.y - 25,
          text: '💨 PHANTOM DODGE',
          color: '#22d3ee',
          fontSize: 13,
          life: 0.55,
          maxLife: 0.55,
          vy: -20
        });
        return;
      }
    }

    // Apply Anti-Tank debuffs on player/clone strikes (minions inherit 25% chance)
    if (source === 'player' || source === 'clone' || source === 'lightning' || source === 'minion') {
      const relicProcChance = source === 'minion' ? 0.25 : 1.0;
      if (engine.acquiredAttributes.has('attr_armor_sunder') && (relicProcChance >= 1 || Math.random() < relicProcChance)) {
        this.sunderTimer = 5.0;
        this.sunderStacks = Math.min(6, this.sunderStacks + 1);
      }
      if (engine.acquiredAttributes.has('attr_anti_regen') && (relicProcChance >= 1 || Math.random() < relicProcChance)) {
        this.blightTimer = 5.0;
      }
    }

    if (this.isBoss && this.corruptedShield > 0) {
      const hasShieldBreaker = engine.acquiredAttributes.has('attr_shield_breaker');
      const shieldMult = hasShieldBreaker ? (source === 'minion' ? 1.375 : 2.5) : 1.0;
      const shieldDamage = amount * shieldMult;
      if (this.corruptedShield >= shieldDamage) {
        this.corruptedShield -= shieldDamage;
        engine.addStaggeredFloatingText({
          x: this.x,
          y: this.y - 25,
          text: `${hasShieldBreaker ? '💥 SHATTER' : '🛡️ BARRIER'} -${Math.round(shieldDamage)}`,
          color: hasShieldBreaker ? '#38bdf8' : '#c084fc',
          fontSize: 14,
          life: 0.75,
          maxLife: 0.75,
          vy: -32,
          isDamage: true
        });
        engine.createShockwave(this.x, this.y, hasShieldBreaker ? '#38bdf8' : '#9333ea', 40);
        this.applyWarriorOnHitHeal(engine);
        return;
      } else {
        const remainingDmg = Math.max(0, amount - (this.corruptedShield / shieldMult));
        this.corruptedShield = 0;
        engine.floatingTexts.push({
          x: this.x,
          y: this.y - 25,
          text: '💥 BARRIER BROKEN!',
          color: '#ef4444',
          fontSize: 16,
          life: 0.9,
          maxLife: 0.9,
          vy: -30
        });
        sounds.playExplosion();
        if (hasShieldBreaker) {
          const sbScale = source === 'minion' ? 0.25 : 1.0;
          const shatterBlast = Math.min(Math.round(1200 * sbScale), Math.round(this.maxHp * 0.12 * sbScale));
          this.hp -= shatterBlast;
          engine.totalDamageDealt += shatterBlast;
          this.stunTimer = Math.max(this.stunTimer, 1.2 * sbScale);
          engine.createShockwave(this.x, this.y, '#38bdf8', 135);
          engine.addRelicFloatingText({
            x: this.x,
            y: this.y,
            text: `💥 AEGIS SHATTERED! -${shatterBlast}`,
            color: '#38bdf8',
            fontSize: 12,
            life: 0.9,
            maxLife: 0.9,
            vy: 16
          });
        }
        amount = remainingDmg;
      }
    }

    // Permafrost Blizzard Heart vulnerability (+18% damage taken while chilled)
    if (this.frostSlowTimer > 0 && (source === 'player' || source === 'clone' || source === 'minion' || source === 'true_damage' || source === 'lightning')) {
      amount *= 1.18;
    }

    // Glacial Sovereign Crown (+30% Cryo bonus damage vs chilled or stunned targets; 25% for minions)
    if (engine.acquiredAttributes.has('attr_permafrost_crown') && (this.frostSlowTimer > 0 || this.chronoSlowTimer > 0 || this.stunTimer > 0) && (source === 'player' || source === 'clone' || source === 'minion' || source === 'frost_shatter' || source === 'lightning')) {
      amount *= source === 'minion' ? 1.075 : 1.30;
    }

    // Void Singularity Tether (+22% damage taken inside Spatial Zones or within 220px of player; 25% for minions)
    if (engine.acquiredAttributes.has('attr_singularity_prism') && (source === 'player' || source === 'clone' || source === 'minion' || source === 'true_damage' || source === 'lightning' || source === 'frost_shatter')) {
      const nearPlayer = Math.hypot(this.x - engine.playerPos.x, this.y - engine.playerPos.y) <= 220;
      const inPlayerZone = !nearPlayer && engine.spatialZones.some(z => z.owner !== 'corrupted_hero' && Math.hypot(this.x - z.x, this.y - z.y) <= z.radius);
      if (nearPlayer || inPlayerZone) {
        amount *= source === 'minion' ? 1.055 : 1.22;
      }
    }

    // Titan Sundering Cleaver bonus vs Tank enemies/bosses (+30% damage; 25% for minions)
    const hasArmorSunder = engine.acquiredAttributes.has('attr_armor_sunder');
    if (hasArmorSunder && (this.type === 'wari' || this.bossCategory === 'Tank')) {
      amount *= source === 'minion' ? 1.075 : 1.30;
    }

    // Tank Boss Iron Plating mitigation (45% reduction vs normal dmg, 25% vs true_damage; penetrated 50% by Titan Sundering Cleaver, 25% of effect for minions)
    // Other Bosses have 18% Iron Boss Shell mitigation vs normal dmg
    if (this.isBoss && this.bossCategory === 'Tank') {
      if (source === 'true_damage') {
        amount *= hasArmorSunder ? 0.875 : 0.75;
      } else {
        amount *= hasArmorSunder ? (source === 'minion' ? 0.60625 : 0.775) : 0.55;
      }
    } else if (this.isBoss && source !== 'true_damage') {
      amount *= 0.82;
    }

    const defenseScale = (this.isBoss && this.bossCategory === 'Tank') ? 0.45 : this.isBoss ? 0.25 : 0.12;
    const maxDefCap = (this.isBoss && this.bossCategory === 'Tank') ? 0.60 : this.isBoss ? 0.50 : 0.45;
    const effectiveDefense = this.sunderStacks > 0 ? this.defense * Math.max(0.52, 1 - this.sunderStacks * 0.08) : this.defense;
    const defenseReduction = source === 'true_damage' ? 0 : Math.min(amount * maxDefCap, effectiveDefense * defenseScale);
    const finalDamage = Math.max(1, amount - defenseReduction);

    this.hp -= finalDamage;
    engine.totalDamageDealt += finalDamage;
    if (isCrit && finalDamage > engine.highestCrit) {
      engine.highestCrit = finalDamage;
    }

    // Warrior Boss Passive: Every attack received restores 100 HP (while still alive)
    this.applyWarriorOnHitHeal(engine);

    // Tank Boss Iron Last Stand trigger below 40% HP (1x per fight; heal reduced 65% by Grievous Blight)
    if (this.isBoss && this.bossCategory === 'Tank' && !this.tankLastStandUsed && this.hp > 0 && this.hp < this.maxHp * 0.40) {
      this.tankLastStandUsed = true;
      this.corruptedShield += Math.round(this.maxHp * 0.50);
      const lastStandHealMult = this.blightTimer > 0 ? 0.35 : 1.0;
      this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * 0.18 * lastStandHealMult));
      engine.createShockwave(this.x, this.y, '#10b981', 210);
      sounds.playSkill('buff');
      engine.floatingTexts.push({
        x: this.x,
        y: this.y - 45,
        text: '🛡️ IRON BASTION LAST STAND!',
        color: '#34d399',
        fontSize: 19,
        life: 1.8,
        maxLife: 1.8,
        vy: -32
      });
    }

    // Universal Boss Enrage below 45% HP (1x permanent power surge + emergency barrier)
    if (this.isBoss && !this.bossEnraged && this.hp > 0 && this.hp < this.maxHp * 0.45) {
      this.bossEnraged = true;
      this.atk = Math.round(this.atk * 1.25);
      this.corruptedShield += Math.round(this.maxHp * 0.15);
      if (this.isCorruptedHero) {
        this.corruptRageTimer = Math.max(this.corruptRageTimer, 12);
      }
      engine.createShockwave(this.x, this.y, '#ef4444', 180);
      sounds.playBossAlert();
      engine.floatingTexts.push({
        x: this.x,
        y: this.y - 48,
        text: '🔥 BOSS ENRAGED! (+25% ATK, +22% SPD, +BARRIER)',
        color: '#f43f5e',
        fontSize: 18,
        life: 2.0,
        maxLife: 2.0,
        vy: -34
      });
    }

    // Floating damage text (anti-overlap staggered & outlined)
    engine.addDamageFloatingText(this.x, this.y, finalDamage, isCrit, source);

    // Corrupted Hero extra Rage burst below 35% HP
    if (this.isCorruptedHero && this.hp > 0 && this.hp < this.maxHp * 0.35 && this.corruptRageTimer <= 0) {
      this.corruptRageTimer = 10;
      engine.floatingTexts.push({
        x: this.x,
        y: this.y - 45,
        text: '⚡ CORRUPTED HERO ENRAGED! (+50% SPEED & POWER)',
        color: '#f43f5e',
        fontSize: 18,
        life: 2.0,
        maxLife: 2.0,
        vy: -35
      });
      engine.createShockwave(this.x, this.y, '#dc2626', 160);
      sounds.playBossAlert();
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Stunned indicator
    if (this.stunTimer > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y - this.radius - 8, 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Poisoned indicator
    if (this.poisonTimer > 0) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Permafrost chilled indicator
    if (this.frostSlowTimer > 0) {
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Abyssal Shatter Mark stack pips
    if (this.abyssalMarks > 0) {
      for (let m = 0; m < this.abyssalMarks; m++) {
        ctx.fillStyle = '#e879f9';
        ctx.beginPath();
        ctx.arc(this.x - 10 + m * 5, this.y + this.radius + 7, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius * 0.9, this.radius * 0.9, this.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.isBoss ? 16 : 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner core or Training Dummy Bullseye
    if (this.type === 'dummy' || this.type === 'dummy_striker') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.68, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = this.type === 'dummy' ? '#ef4444' : '#be123c';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(
        `${this.type === 'dummy' ? '🎯 DUMMY' : '🥊 STRIKER'} (${Math.max(0, Math.round(this.hp)).toLocaleString()})`,
        this.x,
        this.y - this.radius - 14
      );
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Corrupted Hero Custom Visuals & Shield
    if (this.isCorruptedHero) {
      const pulse = 1 + Math.sin(Date.now() * 0.007) * 0.15;
      ctx.save();
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 24 * pulse;
      ctx.strokeStyle = '#9333ea';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, (this.radius + 6) * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Outer corruption spikes
      const spikes = 6;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      for (let s = 0; s < spikes; s++) {
        const sAngle = (Date.now() * 0.003) + (s * Math.PI * 2) / spikes;
        const sx1 = this.x + Math.cos(sAngle) * (this.radius + 5);
        const sy1 = this.y + Math.sin(sAngle) * (this.radius + 5);
        const sx2 = this.x + Math.cos(sAngle) * (this.radius + 15 * pulse);
        const sy2 = this.y + Math.sin(sAngle) * (this.radius + 15 * pulse);
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
      }

      // Demonic red eyes
      ctx.fillStyle = '#fca5a5';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.x - 7, this.y - 3, 3, 0, Math.PI * 2);
      ctx.arc(this.x + 7, this.y - 3, 3, 0, Math.PI * 2);
      ctx.fill();

      // Level 10 Corrupted Hero badge
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(`LV. 10 CORRUPTED [${(this.bossCategory || 'WARRIOR').toUpperCase()}]`, this.x, this.y - this.radius - 12);
      ctx.restore();
    } else if (this.isBoss && this.bossCategory) {
      // Category ring & badge for regular bosses (Tank, Warrior, Assassin, Manipulation)
      ctx.save();
      ctx.strokeStyle = this.warriorBerserkTimer > 0 ? '#ef4444' : this.color;
      ctx.lineWidth = this.warriorBerserkTimer > 0 ? 3.5 : 2.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
      ctx.stroke();

      if (this.warriorBerserkTimer > 0) {
        const berserkPulse = 1 + Math.sin(Date.now() * 0.015) * 0.14;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 22;
        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, (this.radius + 11) * berserkPulse, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = this.warriorBerserkTimer > 0 ? '#fca5a5' : this.color;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 5;
      ctx.fillText(
        this.warriorBerserkTimer > 0
          ? `[WARRIOR BOSS · 🔥 BERSERKER ${this.warriorBerserkTimer.toFixed(1)}s]`
          : `[${this.bossCategory.toUpperCase()} BOSS]`,
        this.x,
        this.y - this.radius - 12
      );
      ctx.restore();
    }

    // Boss / Corrupted Barrier Hexagon Ring (also renders Tank Boss's Fortress Aegis shield)
    if (this.isBoss && this.corruptedShield > 0) {
      ctx.save();
      const shieldPulse = 1 + Math.sin(Date.now() * 0.008) * 0.08;
      ctx.strokeStyle = this.isCorruptedHero ? '#c084fc' : this.color;
      ctx.shadowColor = this.isCorruptedHero ? '#a855f7' : this.color;
      ctx.shadowBlur = 15;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const hexPoints = 6;
      const rot = Date.now() * 0.002;
      for (let i = 0; i < hexPoints; i++) {
        const ang = rot + (i * Math.PI * 2) / hexPoints;
        const hx = this.x + Math.cos(ang) * (this.radius + 14) * shieldPulse;
        const hy = this.y + Math.sin(ang) * (this.radius + 14) * shieldPulse;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = this.isCorruptedHero ? '#e9d5ff' : '#d1fae5';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#0f172a';
      ctx.shadowBlur = 4;
      ctx.fillText(`🛡️ BARRIER: ${Math.round(this.corruptedShield)}`, this.x, this.y - this.radius - 26);
      ctx.restore();
    }

    // Health bar above head (unless boss, which has top HUD bar)
    if (!this.isBoss) {
      const barW = this.radius * 2;
      const barH = 3.5;
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(this.x - barW / 2, this.y - this.radius - 8, barW, barH);
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - barW / 2, this.y - this.radius - 8, barW * hpRatio, barH);
    }

    ctx.restore();
  }
}

export class CloneEntity {
  public x: number;
  public y: number;
  public radius: number = 17;
  public lifeTimer: number = 16;
  public maxHp: number;
  public hp: number;
  public defense: number;
  public aegisShield: number = 0;
  private attackTimer: number = 0;
  private overchargeTimer: number = 0;
  private singularityTimer: number = 0;
  private phoenixTimer: number = 0;
  private sunfireTimer: number = 0;
  private meteorTimer: number = 0;
  private sanctuaryTimer: number = 0;
  private phoenixReviveUsed: boolean = false;
  private phoenixInvulnTimer: number = 0;
  private monkeyHitCount: number = 0;
  private mirrorWardReady: boolean = false;
  private mirrorWardTimer: number = 0;
  private frostbiteTimer: number = 0;
  private orbitAngle: number = 0;
  private bloodPactHits: number = 0;
  private ricochetHits: number = 0;
  private blightHits: number = 0;
  public isRiftDecoy: boolean = false;

  public getInheritedStatRatio(): number {
    // Clones inherit 50% of master's stats by default, capped at max 75% (Monkey) or 60% (Rift Walker) when upgraded
    if (this.engine.unlockedTraits.has('m_s1_u1')) return 0.75;
    if (this.engine.unlockedTraits.has('rw_s3_u1')) return 0.60;
    return 0.50;
  }

  constructor(x: number, y: number, private engine: GameEngine) {
    this.x = x;
    this.y = y;
    const statRatio = this.getInheritedStatRatio();
    this.maxHp = Math.round(engine.player.maxHp * statRatio);
    this.hp = this.maxHp;
    this.defense = Math.round(engine.player.defense * statRatio);

    // Inherit Titan Aegis Barrier & Mirror Barrier (100% Relic Attribute)
    if (engine.acquiredAttributes.has('attr_shield_aegis')) {
      this.aegisShield = 260;
    }
    if (engine.acquiredAttributes.has('attr_mirror_ward')) {
      this.mirrorWardReady = true;
    }
  }

  public takeDamage(rawDmg: number, engine: GameEngine) {
    if (this.phoenixInvulnTimer > 0) {
      engine.addRelicFloatingText({
        x: this.x,
        y: this.y,
        text: '🔥 CLONE SHIELD!',
        color: '#f97316',
        fontSize: 11,
        life: 0.5,
        maxLife: 0.5,
        vy: 14
      });
      return;
    }

    const statRatio = this.getInheritedStatRatio();

    // Inherit Evasion stat at 50% (max 75%)
    if (Math.random() < engine.player.evasion * statRatio) {
      engine.floatingTexts.push({
        x: this.x,
        y: this.y - 16,
        text: 'DODGE!',
        color: '#67e8f9',
        fontSize: 13,
        life: 0.5,
        maxLife: 0.5,
        vy: -20
      });
      return;
    }

    // Inherit Astral Mirror Barrier (100% Relic Attribute)
    if (this.mirrorWardReady) {
      this.mirrorWardReady = false;
      this.mirrorWardTimer = 0;
      engine.createShockwave(this.x, this.y, '#e2e8f0', 110);
      const attacker = engine.getClosestEnemy(this.x, this.y);
      if (attacker && Math.hypot(attacker.x - this.x, attacker.y - this.y) <= 300) {
        engine.createLaserBeam(this.x, this.y, attacker.x, attacker.y, '#e2e8f0', 6);
        attacker.takeDamage(engine.player.atk * 3.0, true, 'true_damage', engine);
      }
      engine.addRelicFloatingText({
        x: this.x,
        y: this.y,
        text: '🪞 CLONE MIRROR!',
        color: '#f8fafc',
        fontSize: 11,
        life: 0.7,
        maxLife: 0.7,
        vy: 14
      });
      return;
    }

    // 1. Titan Aegis Shield Absorption
    if (this.aegisShield > 0) {
      const absorbed = Math.min(this.aegisShield, rawDmg);
      this.aegisShield -= absorbed;
      rawDmg -= absorbed;
      engine.createShockwave(this.x, this.y, '#38bdf8', 22);
      if (rawDmg <= 0) return;
    }

    // 2. Monkey King Vajra Body built-in 18% incoming damage reduction
    if (engine.heroKey === 'monkey') {
      rawDmg *= 0.82;
    }

    // 3. Sacred Guardian Spirit (20% Damage Reduction - Relic Attribute 100%)
    if (engine.acquiredAttributes.has('attr_guardian_spirit')) {
      rawDmg *= 0.80;
    }

    // 4. Spiked Obsidian Armor (Thornmail): Reflect 50% incoming damage as True Damage (Relic Attribute 100%)
    if (engine.acquiredAttributes.has('attr_thornmail')) {
      const attacker = engine.getClosestEnemy(this.x, this.y);
      if (attacker && Math.hypot(attacker.x - this.x, attacker.y - this.y) <= 220) {
        attacker.takeDamage(Math.max(5, rawDmg * 0.50), false, 'true_damage', engine);
      }
    }

    // 5. Fallen Angel Wings (45% damage reduction if low HP - Relic Attribute 100%)
    if (engine.player.fallenWingsActive && (this.hp / this.maxHp < 0.25)) {
      rawDmg *= 0.55;
    }

    // 6. War God Armor: stacking defense when struck (Relic Attribute 100%)
    if (engine.player.warArmorActive) {
      engine.addWarArmorStack(2);
    }

    this.defense = Math.round(engine.player.defense * statRatio);
    const effectiveDmg = Math.max(1, Math.round(rawDmg * (100 / (100 + this.defense))));
    this.hp -= effectiveDmg;

    engine.floatingTexts.push({
      x: this.x + (Math.random() - 0.5) * 16,
      y: this.y - 14,
      text: `-${effectiveDmg}`,
      color: '#fbbf24',
      fontSize: 13,
      life: 0.6,
      maxLife: 0.6,
      vy: -22
    });

    if (this.hp <= 0) {
      // Inherit Phoenix Ash Ember revive (1x per clone)
      if (engine.acquiredAttributes.has('attr_phoenix_ember') && !this.phoenixReviveUsed) {
        this.phoenixReviveUsed = true;
        this.phoenixInvulnTimer = 2.5;
        this.hp = Math.round(this.maxHp * 0.55);
        engine.createShockwave(this.x, this.y, '#f97316', 180);
        sounds.playExplosion();
        for (const e of engine.enemies) {
          if (Math.hypot(e.x - this.x, e.y - this.y) <= 180) {
            e.takeDamage(engine.player.atk * 2.5, true, 'clone', engine);
            e.stunTimer = Math.max(e.stunTimer, 1.5);
          }
        }
        engine.addRelicFloatingText({
          x: this.x,
          y: this.y,
          text: '🔥 CLONE PHOENIX!',
          color: '#fb923c',
          fontSize: 11,
          life: 0.85,
          maxLife: 0.85,
          vy: 15
        });
      } else {
        this.hp = 0;
        this.lifeTimer = 0;
      }
    }
  }

  public update(dt: number, engine: GameEngine) {
    this.lifeTimer -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;
    if (this.phoenixInvulnTimer > 0) this.phoenixInvulnTimer = Math.max(0, this.phoenixInvulnTimer - dt);
    const statRatio = this.getInheritedStatRatio();
    this.defense = Math.round(engine.player.defense * statRatio);

    // Inherit Emerald Jade Heart passive HP regen (3.5% Max HP/s)
    if (engine.acquiredAttributes.has('attr_jade_vitality') && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.035 * dt);
    }

    // Inherit Overcharge Conduit (every 3.0s)
    if (engine.acquiredAttributes.has('attr_overcharge')) {
      this.overchargeTimer += dt;
      if (this.overchargeTimer >= 3.0) {
        this.overchargeTimer = 0;
        const targets = [...engine.enemies]
          .sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y))
          .slice(0, 4);
        const cloneBoltDmg = 180 + engine.player.atk * 1.2;
        for (const t of targets) {
          engine.createLightningChain(this.x, this.y, t.x, t.y, '#38bdf8');
          t.takeDamage(cloneBoltDmg, true, 'clone', engine);
        }
      }
    }

    // Inherit Cosmic Singularity Core (every 6s)
    if (engine.acquiredAttributes.has('attr_singularity_core')) {
      this.singularityTimer += dt;
      if (this.singularityTimer >= 6.0) {
        this.singularityTimer = 0;
        engine.spatialZones.push({
          x: this.x,
          y: this.y,
          radius: 140,
          duration: 2.0,
          maxDuration: 2.0,
          type: 'judge_collapse',
          color: '#c084fc',
          pulseAngle: 0,
          owner: 'player'
        });
      }
    }

    // Inherit Phoenix Ash Ember periodic fire nova (every 5s)
    if (engine.acquiredAttributes.has('attr_phoenix_ember')) {
      this.phoenixTimer += dt;
      if (this.phoenixTimer >= 5.0) {
        this.phoenixTimer = 0;
        const radius = 150;
        const fireDmg = engine.player.atk * 1.8;
        engine.createShockwave(this.x, this.y, '#f97316', radius);
        for (const e of engine.enemies) {
          if (Math.hypot(e.x - this.x, e.y - this.y) <= radius) {
            e.takeDamage(fireDmg, false, 'clone', engine);
          }
        }
      }
    }

    // Inherit Solar Flare Mantle periodic burn (every 1s)
    if (engine.acquiredAttributes.has('attr_sunfire_cape')) {
      this.sunfireTimer += dt;
      if (this.sunfireTimer >= 1.0) {
        this.sunfireTimer = 0;
        const radius = 140;
        const burnDmg = 45 + this.maxHp * 0.03;
        engine.createShockwave(this.x, this.y, '#fb923c', radius);
        for (const e of engine.enemies) {
          if (Math.hypot(e.x - this.x, e.y - this.y) <= radius) {
            e.takeDamage(burnDmg, false, 'true_damage', engine);
          }
        }
      }
    }

    // Inherit Crimson Meteorite periodic strike (every 7s)
    if (engine.acquiredAttributes.has('attr_crimson_meteor')) {
      this.meteorTimer += dt;
      if (this.meteorTimer >= 7.0) {
        this.meteorTimer = 0;
        const meteorTarget = engine.getClosestEnemy(this.x, this.y);
        if (meteorTarget) {
          const mRadius = 130;
          engine.createShockwave(meteorTarget.x, meteorTarget.y, '#ef4444', mRadius);
          for (const e of engine.enemies) {
            if (Math.hypot(e.x - meteorTarget.x, e.y - meteorTarget.y) <= mRadius) {
              e.takeDamage(engine.player.atk * 3.2, true, 'clone', engine);
              e.stunTimer = Math.max(e.stunTimer, 1.5);
            }
          }
        }
      }
    }

    // Inherit Divine Sanctuary Halo (every 14s)
    if (engine.acquiredAttributes.has('attr_divine_sanctuary')) {
      this.sanctuaryTimer += dt;
      if (this.sanctuaryTimer >= 14.0) {
        this.sanctuaryTimer = 0;
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.18);
        engine.createShockwave(this.x, this.y, '#facc15', 170);
        for (const e of engine.enemies) {
          const d = Math.hypot(e.x - this.x, e.y - this.y);
          if (d <= 170) {
            const ang = Math.atan2(e.y - this.y, e.x - this.x);
            e.x += Math.cos(ang) * 80;
            e.y += Math.sin(ang) * 80;
          }
        }
      }
    }

    // Inherit Astral Mirror Barrier recharge (100% Relic Attribute)
    if (engine.acquiredAttributes.has('attr_mirror_ward') && !this.mirrorWardReady) {
      this.mirrorWardTimer += dt;
      if (this.mirrorWardTimer >= 10.0) {
        this.mirrorWardTimer = 0;
        this.mirrorWardReady = true;
      }
    }

    // Inherit Permafrost Blizzard Heart aura (100% Relic Attribute)
    if (engine.acquiredAttributes.has('attr_frostbite_aura')) {
      for (const e of engine.enemies) {
        if (Math.hypot(e.x - this.x, e.y - this.y) <= 165) {
          e.frostSlowTimer = Math.max(e.frostSlowTimer, 0.25);
        }
      }
      this.frostbiteTimer += dt;
      if (this.frostbiteTimer >= 2.5) {
        this.frostbiteTimer = 0;
        const cryoDmg = engine.player.atk * 1.2;
        engine.createShockwave(this.x, this.y, '#7dd3fc', 165);
        for (const e of engine.enemies) {
          if (Math.hypot(e.x - this.x, e.y - this.y) <= 165) {
            e.takeDamage(cryoDmg, false, 'clone', engine);
          }
        }
      }
    }

    // Inherit Celestial Star Orbs (2 rotating orbs around each Clone)
    if (engine.acquiredAttributes.has('attr_celestial_orbit')) {
      this.orbitAngle += dt * 3.5;
      const orbitRadius = 56;
      for (let o = 0; o < 2; o++) {
        const a = this.orbitAngle + o * Math.PI;
        const ox = this.x + Math.cos(a) * orbitRadius;
        const oy = this.y + Math.sin(a) * orbitRadius;
        for (const e of engine.enemies) {
          if (e.orbitHitCd <= 0 && Math.hypot(e.x - ox, e.y - oy) <= e.radius + 15) {
            e.orbitHitCd = 0.45;
            e.takeDamage(engine.player.atk * 1.10, false, 'true_damage', engine);
            engine.createSlashEffect(ox, oy, e.x, e.y, '#fde047');
          }
        }
      }
    }

    const target = engine.getClosestEnemy(this.x, this.y);
    if (target) {
      const dist = Math.hypot(target.x - this.x, target.y - this.y);
      const cloneRange = Math.max(50, engine.player.range * 0.85);
      if (dist > cloneRange) {
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        this.x += Math.cos(angle) * (engine.player.speed * statRatio) * dt;
        this.y += Math.sin(angle) * (engine.player.speed * statRatio) * dt;
      } else if (this.attackTimer <= 0) {
        // --- 1. Base Damage & Critical Strikes (50% base, max 75% inherited stats) ---
        const isCrit = Math.random() < (engine.player.critChance * statRatio);
        let dmg = engine.player.atk * statRatio;
        if (engine.acquiredAttributes.has('attr_clone_overlord')) {
          dmg *= 1.35; // 100% Relic Attribute
        }
        // Clone also scales with Berserker Blood if Clone itself has low HP (100% Relic Attribute)
        if (engine.acquiredAttributes.has('attr_berserker_blood')) {
          const cloneMissingStacks = Math.floor(Math.max(0, 1 - (this.hp / this.maxHp)) * 10);
          dmg *= (1 + cloneMissingStacks * 0.04);
        }
        if (isCrit) {
          const critMult = engine.player.critDmg > 1.0
            ? 1.0 + (engine.player.critDmg - 1.0) * statRatio
            : engine.player.critDmg;
          dmg *= critMult;
          if (engine.acquiredAttributes.has('attr_blood_crescent')) {
            engine.healPlayer(engine.player.maxHp * 0.02);
            this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.02);
          }
        }

        // --- 2. Magic Destruction Core ---
        if (engine.player.magicDestroActive) {
          dmg += (80 + engine.player.atk * 0.8);
        }

        // --- 2b. Titan Giant Slayer ---
        if (engine.acquiredAttributes.has('attr_giant_slayer') && (target.isBoss || target.maxHp > engine.player.maxHp)) {
          dmg *= 1.35;
        }

        // --- 3. Executioner Guillotine ---
        if (engine.acquiredAttributes.has('attr_executioner_blade')) {
          if (target.hp / target.maxHp < 0.5) {
            dmg *= 1.40;
          }
          if (target.hp / target.maxHp < 0.15 && !target.isBoss) {
            dmg = target.hp + 999;
            engine.addRelicFloatingText({
              x: target.x,
              y: target.y,
              text: '💀 CLONE EXECUTE!',
              color: '#ef4444',
              fontSize: 11,
              life: 0.8,
              maxLife: 0.8,
              vy: 15
            });
          }
        }

        // --- 4. Toxic Spores Debuff ---
        if (engine.acquiredAttributes.has('attr_toxic_spores')) {
          target.poisonTimer = 4.0;
          target.defense = Math.max(0, target.defense - 10);
        }

        // --- 5. Chain Lightning (Thunder God Orb) ---
        if (engine.acquiredAttributes.has('attr_chain_lightning') && Math.random() < 0.35) {
          sounds.playSkill('thunder');
          let prevX = target.x;
          let prevY = target.y;
          let zaps = 0;
          const zapDmg = engine.player.atk * 1.5;
          for (const e of engine.enemies) {
            if (e !== target && Math.hypot(e.x - prevX, e.y - prevY) <= 220 && zaps < 4) {
              engine.createLightningChain(prevX, prevY, e.x, e.y, '#38bdf8');
              e.takeDamage(zapDmg, false, 'lightning', engine);
              prevX = e.x;
              prevY = e.y;
              zaps++;
            }
          }
        }

        // --- 6. Varp Death Scythe Stacking ---
        if (engine.acquiredAttributes.has('attr_varp_scythe')) {
          engine.player.varpScytheStacks = Math.min(20, (engine.player.varpScytheStacks || 0) + 1);
          engine.recalculateStats();
        }

        // --- 7. Monkey Staff Resonance ---
        if (engine.acquiredAttributes.has('attr_monkey_wpn')) {
          this.monkeyHitCount++;
          if (this.monkeyHitCount >= 2) {
            this.monkeyHitCount = 0;
            if (!engine.player.monkeyWeaponActive) {
              engine.player.monkeyWeaponActive = true;
              engine.recalculateStats();
              setTimeout(() => {
                engine.player.monkeyWeaponActive = false;
                engine.recalculateStats();
              }, 2500);
            }
          }
        }

        // --- 8. Deal Damage to Target ---
        target.takeDamage(dmg, isCrit, 'clone', engine);
        if (engine.heroKey === 'monkey') {
          const cloneMaxTrueDmg = Math.round(100 * statRatio);
          const cloneCritTrueDmg = Math.min(cloneMaxTrueDmg, Math.max(0, Math.round(Math.min(1.0, engine.player.critChance * statRatio) * 100)) * 5);
          if (cloneCritTrueDmg > 0) {
            target.takeDamage(cloneCritTrueDmg, false, 'true_damage', engine);
          }
        }
        engine.createSlashEffect(this.x, this.y, target.x, target.y, isCrit ? '#f59e0b' : '#fbbf24');
        if (isCrit) {
          sounds.playHit(true);
        }

        // --- 8b. Clone Inherited Relics: Frost Orb, Void Piercer, Echo Blade, Abyssal Mark, Doom Scythe, Blood Pact, Ricochet Glaive ---
        if (engine.acquiredAttributes.has('attr_frost_orb') && Math.random() < 0.30) {
          target.stunTimer = Math.max(target.stunTimer, 1.2);
          target.takeDamage(engine.player.atk * 0.8, false, 'clone', engine);
          engine.createShockwave(target.x, target.y, '#38bdf8', 50);
        }
        if (engine.acquiredAttributes.has('attr_void_piercer')) {
          target.takeDamage(dmg * 0.30, false, 'true_damage', engine);
        }
        if (engine.acquiredAttributes.has('attr_echo_blade') && Math.random() < 0.35) {
          target.takeDamage(dmg * 0.75, false, 'clone', engine);
          engine.createSlashEffect(this.x, this.y, target.x, target.y, '#c084fc');
        }
        if (engine.acquiredAttributes.has('attr_abyssal_mark')) {
          engine.applyAbyssalMark(target);
        }
        if (engine.acquiredAttributes.has('attr_doom_scythe')) {
          engine.triggerDoomScytheCrit(target, isCrit);
        }
        if (engine.acquiredAttributes.has('attr_blood_pact')) {
          this.bloodPactHits++;
          if (this.bloodPactHits >= 5) {
            this.bloodPactHits = 0;
            engine.triggerBloodPact(target);
          }
        }
        if (engine.acquiredAttributes.has('attr_ricochet_glaive')) {
          this.ricochetHits++;
          if (this.ricochetHits >= 3) {
            this.ricochetHits = 0;
            engine.triggerRicochetGlaive(this.x, this.y, target);
          }
        }
        if (engine.acquiredAttributes.has('attr_anti_regen')) {
          this.blightHits++;
          if (this.blightHits >= 4) {
            this.blightHits = 0;
            engine.triggerBlightBurst(target);
          }
        }

        // --- 9. Burst True Crit ---
        if (isCrit && engine.player.burstCritActive) {
          const trueDmg = target.maxHp * 0.06;
          target.takeDamage(trueDmg, false, 'true_damage', engine);
        }

        // --- 10. Lifesteal (Trait 100% + Inherited Master Lifesteal 50%/75% + Relic Attributes 100%) ---
        let lifestealPct = (engine.unlockedTraits.has('m_s1_u2') ? 0.40 : 0.25) + (engine.player.lifesteal * statRatio);
        if (engine.player.fallenWingsActive && (this.hp / this.maxHp < 0.25)) {
          lifestealPct += 0.40;
        }
        const healAmt = dmg * lifestealPct;
        engine.healPlayer(healAmt); // Heals master
        this.hp = Math.min(this.maxHp, this.hp + healAmt * 0.5); // Also sustains clone

        this.attackTimer = 1 / Math.max(0.2, engine.player.atkSpeed * statRatio);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = 0.9;

    // Rage or Supercharged Aura
    if (this.engine.player.rageTimer > 0) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
    }

    // Body
    ctx.fillStyle = this.engine.player.rageTimer > 0 ? '#ef4444' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner detail
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Clone Mirror Barrier Ring
    if (this.mirrorWardReady) {
      ctx.save();
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Clone Celestial Star Orbs (2 rotating orbs)
    if (this.engine.acquiredAttributes.has('attr_celestial_orbit')) {
      ctx.save();
      const orbitRadius = 56;
      for (let o = 0; o < 2; o++) {
        const a = this.orbitAngle + o * Math.PI;
        const ox = this.x + Math.cos(a) * orbitRadius;
        const oy = this.y + Math.sin(a) * orbitRadius;
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(ox, oy, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Titan Aegis Hexagonal Barrier on Clone
    if (this.aegisShield > 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Date.now() * 0.002);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      const sides = 6;
      const barrierRadius = this.radius + 7;
      for (let s = 0; s < sides; s++) {
        const a = (s * Math.PI * 2) / sides;
        const bx = Math.cos(a) * barrierRadius;
        const by = Math.sin(a) * barrierRadius;
        if (s === 0) ctx.moveTo(bx, by);
        else ctx.lineTo(bx, by);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fill();
      ctx.restore();
    }

    // Health bar above clone head
    const barW = this.radius * 2.2;
    const barH = 4;
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(this.x - barW / 2, this.y - this.radius - 12, barW, barH);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(this.x - barW / 2, this.y - this.radius - 12, barW * hpRatio, barH);

    // Label 'CLONE' or shield counter
    ctx.fillStyle = this.aegisShield > 0 ? '#38bdf8' : '#fef08a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.aegisShield > 0 ? `🛡️ ${Math.round(this.aegisShield)}` : 'CLONE',
      this.x,
      this.y - this.radius - 14
    );

    ctx.restore();
  }
}

export class ProjectileEntity {
  public vx: number;
  public vy: number;
  public radius: number = 6;
  public active: boolean = true;
  private distanceTravelled: number = 0;
  private maxDistance: number = 800;
  private homingTarget: EnemyEntity | null = null;
  private curveOffset: number = 0;
  private startX: number;
  private startY: number;
  private curveProgress: number = 0;
  private trail: { x: number; y: number }[] = [];
  private isMinionShot: boolean = false;

  constructor(
    public x: number,
    public y: number,
    targetX: number,
    targetY: number,
    public speed: number,
    public damage: number,
    public isCrit: boolean,
    public color: string,
    public owner: string,
    curveOpts?: { homingTarget?: EnemyEntity; curveOffset?: number; isMinionShot?: boolean }
  ) {
    this.startX = x;
    this.startY = y;
    const angle = Math.atan2(targetY - y, targetX - x);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    if (curveOpts) {
      if (curveOpts.homingTarget) {
        this.homingTarget = curveOpts.homingTarget;
        this.curveOffset = curveOpts.curveOffset ?? 0;
      }
      this.isMinionShot = Boolean(curveOpts.isMinionShot);
    }
  }

  private applyPlayerHitOnEnemy(e: EnemyEntity, engine: GameEngine) {
    const dmgSource = this.isMinionShot ? 'minion' : 'player';
    const relicMult = this.isMinionShot ? 0.25 : 1.0;

    e.takeDamage(this.damage, this.isCrit, dmgSource, engine);
    if (!this.isMinionShot) {
      if (engine.heroKey === 'monkey') {
        const critChanceTrueDmg = Math.min(100, Math.max(0, Math.round(engine.player.critChance * 100)) * 5);
        if (critChanceTrueDmg > 0) {
          e.takeDamage(critChanceTrueDmg, false, 'true_damage', engine);
        }
      }
      if (engine.heroKey === 'soul_puppeteer' && ((engine.player.souls ?? 0) >= 10 || (engine.player.lichTransformTimer ?? 0) > 0)) {
        e.takeDamage(engine.player.atk * 0.10, false, 'true_damage', engine);
        if ((engine.player.lichTransformTimer ?? 0) > 0) {
          engine.addSouls(1);
        }
      }
    }
    if (engine.acquiredAttributes.has('attr_toxic_spores')) {
      e.poisonTimer = Math.max(e.poisonTimer, 4.0 * relicMult);
      e.defense = Math.max(0, e.defense - 10 * relicMult);
    }
    if (engine.acquiredAttributes.has('attr_frost_orb') && Math.random() < 0.30) {
      e.stunTimer = Math.max(e.stunTimer, 1.2 * relicMult);
      e.frostSlowTimer = Math.max(e.frostSlowTimer, 2.0 * relicMult);
      e.takeDamage(engine.player.atk * 0.8 * relicMult, false, dmgSource, engine);
      engine.createShockwave(e.x, e.y, '#38bdf8', 55);
      if (!this.isMinionShot || Math.random() < 0.25) {
        engine.tryTriggerCryoLanceBurst(e.x, e.y);
      }
    }
    if (this.color === '#7dd3fc' && engine.acquiredAttributes.has('attr_cryo_bastion')) {
      e.frostSlowTimer = Math.max(e.frostSlowTimer, 2.0 * relicMult);
    }
    if (engine.acquiredAttributes.has('attr_temporal_compass') && (engine.player.travelerFieldTimer > 0 || engine.player.isTimeStopActive)) {
      e.takeDamage(this.damage * 0.25 * relicMult, false, 'true_damage', engine);
    }
    if (engine.acquiredAttributes.has('attr_void_piercer')) {
      e.takeDamage(this.damage * 0.30 * relicMult, false, 'true_damage', engine);
    }
    if (engine.acquiredAttributes.has('attr_echo_blade') && Math.random() < 0.35) {
      e.takeDamage(this.damage * 0.75 * relicMult, false, dmgSource, engine);
    }
    if (engine.acquiredAttributes.has('attr_abyssal_mark') && (!this.isMinionShot || Math.random() < 0.25)) {
      engine.applyAbyssalMark(e);
    }
    if (engine.acquiredAttributes.has('attr_doom_scythe') && (!this.isMinionShot || Math.random() < 0.25)) {
      engine.triggerDoomScytheCrit(e, this.isCrit);
    }
    if (engine.acquiredAttributes.has('attr_venom_fang')) {
      e.neurotoxinTimer = Math.max(e.neurotoxinTimer, 3.0 * relicMult);
    }
    if (this.isCrit && engine.acquiredAttributes.has('attr_void_lens')) {
      engine.healPlayer(20 * relicMult);
    }
    if (!this.isMinionShot) {
      if (engine.heroKey === 'demonis' && (engine.player.demonisFCD || 0) >= 30) {
        const splashDmg = this.damage * 0.30;
        for (const near of engine.enemies) {
          if (near !== e && Math.hypot(near.x - e.x, near.y - e.y) <= 75) {
            near.takeDamage(splashDmg, false, 'true_damage', engine);
          }
        }
      }
      if (engine.heroKey === 'traveler' && engine.player.travelerStance === 'staff' && this.color === '#67e8f9') {
        const orbSplash = engine.player.atk * 0.65;
        engine.createShockwave(e.x, e.y, '#67e8f9', 85);
        for (const near of engine.enemies) {
          if (near.hp > 0 && Math.hypot(near.x - e.x, near.y - e.y) <= 85) {
            near.takeDamage(orbSplash, false, 'true_damage', engine);
          }
        }
      }
    }
    engine.createSlashEffect(this.x, this.y, e.x, e.y, this.color);
    this.active = false;
  }

  public update(dt: number, engine: GameEngine) {
    if (this.homingTarget) {
      // Strictly single-target curved arc homing (Quadratic Bezier toward locked target)
      if (this.homingTarget.hp <= 0 || !engine.enemies.includes(this.homingTarget)) {
        this.active = false;
        return;
      }

      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 6) this.trail.shift();

      const dx = this.homingTarget.x - this.startX;
      const dy = this.homingTarget.y - this.startY;
      const totalDist = Math.max(95, Math.hypot(dx, dy));
      const nx = -dy / totalDist;
      const ny = dx / totalDist;
      const ctrlX = (this.startX + this.homingTarget.x) * 0.5 + nx * this.curveOffset;
      const ctrlY = (this.startY + this.homingTarget.y) * 0.5 + ny * this.curveOffset;

      // Account for arc length so curved projectiles travel at crisp combat speed
      const approxArcLen = totalDist + Math.abs(this.curveOffset) * 0.65;
      this.curveProgress = Math.min(1, this.curveProgress + (this.speed * dt) / Math.max(100, approxArcLen));
      const t = this.curveProgress;
      const inv = 1 - t;
      this.x = inv * inv * this.startX + 2 * inv * t * ctrlX + t * t * this.homingTarget.x;
      this.y = inv * inv * this.startY + 2 * inv * t * ctrlY + t * t * this.homingTarget.y;

      if (t >= 1 || Math.hypot(this.homingTarget.x - this.x, this.homingTarget.y - this.y) <= this.homingTarget.radius + this.radius) {
        this.applyPlayerHitOnEnemy(this.homingTarget, engine);
      }
      return;
    }

    const moveDist = this.speed * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.distanceTravelled += moveDist;

    if (this.distanceTravelled >= this.maxDistance) {
      this.active = false;
      return;
    }

    // Check collision with enemies
    if (this.owner === 'player') {
      for (const e of engine.enemies) {
        if (Math.hypot(e.x - this.x, e.y - this.y) <= e.radius + this.radius) {
          this.applyPlayerHitOnEnemy(e, engine);
          break;
        }
      }
    } else if (this.owner === 'corrupted_hero') {
      // Check collision with player (skipped when player is untargetable during Soul Possession)
      if ((engine.player.puppetPossessTimer ?? 0) <= 0 && Math.hypot(engine.playerPos.x - this.x, engine.playerPos.y - this.y) <= 18 + this.radius) {
        engine.damagePlayer(this.damage);
        engine.createSlashEffect(this.x, this.y, engine.playerPos.x, engine.playerPos.y, this.color);
        this.active = false;
      } else {
        // Check collision with clones
        for (const c of engine.clones) {
          if (c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) <= c.radius + this.radius) {
            c.takeDamage(this.damage, engine);
            engine.createSlashEffect(this.x, this.y, c.x, c.y, this.color);
            this.active = false;
            break;
          }
        }
        if (this.active) {
          for (const m of engine.minions) {
            if (m.hp > 0 && m.possessTimer <= 0 && Math.hypot(m.x - this.x, m.y - this.y) <= m.radius + this.radius) {
              m.takeDamage(this.damage, engine);
              engine.createSlashEffect(this.x, this.y, m.x, m.y, this.color);
              this.active = false;
              break;
            }
          }
        }
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    if (this.trail.length > 1) {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.max(2, this.radius * 0.65);
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class PuppetMinionEntity {
  public x: number;
  public y: number;
  public kind: 'puppet' | 'undead';
  public radius: number;
  public hp: number;
  public maxHp: number;
  public lifeTimer: number;
  public modLevel: number = 0;
  public possessTimer: number = 0;
  private attackTimer: number = 0;
  private auraTimer: number = 0;
  private bloodPactHits: number = 0;
  private ricochetHits: number = 0;
  private blightHits: number = 0;

  constructor(x: number, y: number, kind: 'puppet' | 'undead', private engine: GameEngine) {
    this.x = x;
    this.y = y;
    this.kind = kind;
    this.radius = kind === 'puppet' ? 15 : 12;
    this.maxHp = Math.round(engine.player.maxHp * (kind === 'puppet' ? 0.65 : 0.40));
    this.hp = this.maxHp;
    this.lifeTimer = kind === 'puppet' ? 22 : 16;
  }

  public applyModify(levels: number = 1) {
    const prev = this.modLevel;
    this.modLevel = Math.min(3, this.modLevel + levels);
    if (this.modLevel > prev) {
      const hpMult = 1 + (this.modLevel - prev) * 0.30 + (this.modLevel === 3 ? 0.25 : 0);
      this.maxHp = Math.round(this.maxHp * hpMult);
    }
    this.hp = this.maxHp;
    this.radius = (this.kind === 'puppet' ? 15 : 12) + this.modLevel * 3;
    this.lifeTimer = Math.max(this.lifeTimer, this.kind === 'puppet' ? 22 : 16);
  }

  public takeDamage(rawDmg: number, engine: GameEngine) {
    if (this.possessTimer > 0) return; // Possessed vessel is protected with host

    let dmg = rawDmg;
    // Puppets/Undead inherit 25% of Guardian Spirit (5% reduction)
    if (engine.acquiredAttributes.has('attr_guardian_spirit')) {
      dmg *= 0.95;
    }
    const def = engine.player.defense * 0.6;
    const defReduction = Math.min(dmg * 0.55, def * 0.35);
    const finalDmg = Math.max(1, dmg - defReduction);
    this.hp -= finalDmg;

    // Puppets/Undead inherit 25% of Thornmail reflect (12.5%)
    if (engine.acquiredAttributes.has('attr_thornmail')) {
      const attacker = engine.getClosestEnemy(this.x, this.y);
      if (attacker && Math.hypot(attacker.x - this.x, attacker.y - this.y) <= 130) {
        attacker.takeDamage(Math.max(1, finalDmg * 0.125), false, 'true_damage', engine);
      }
    }
  }

  public update(dt: number, engine: GameEngine) {
    this.lifeTimer -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;
    if (this.auraTimer > 0) this.auraTimer -= dt;

    if (this.possessTimer > 0) {
      this.possessTimer = Math.max(0, this.possessTimer - dt);
      // Fused with master as Possessed Exoskeleton Vessel
      this.x = engine.playerPos.x;
      this.y = engine.playerPos.y;
    }

    // Mod Lv.3 Abyssal Titan Core OR Forbidden Bio-Mecha Mod True Damage Aura
    if (this.modLevel >= 3 || (this.modLevel >= 1 && engine.unlockedTraits.has('sp_s3_u1'))) {
      if (this.auraTimer <= 0) {
        this.auraTimer = 1.0;
        const auraDmg = engine.player.atk * (0.25 + this.modLevel * 0.10);
        for (const e of engine.enemies) {
          if (Math.hypot(e.x - this.x, e.y - this.y) <= 110) {
            e.takeDamage(auraDmg, false, 'true_damage', engine);
          }
        }
      }
    }

    const target = engine.getClosestEnemy(this.x, this.y);
    if (!target) return;

    const dist = Math.hypot(target.x - this.x, target.y - this.y);
    const attackRange = this.modLevel >= 2 ? 185 : 58;

    if (this.possessTimer <= 0 && dist > attackRange) {
      const angle = Math.atan2(target.y - this.y, target.x - this.x);
      const moveSpeed = (this.kind === 'puppet' ? 195 : 175) + this.modLevel * 20;
      this.x += Math.cos(angle) * moveSpeed * dt;
      this.y += Math.sin(angle) * moveSpeed * dt;
    } else if (this.attackTimer <= 0 && dist <= attackRange + 25) {
      const isCrit = Math.random() < engine.player.critChance;
      let dmg = engine.player.atk * (this.kind === 'puppet' ? 0.55 : 0.38) * (1 + this.modLevel * 0.25);
      if (this.possessTimer > 0) dmg *= 1.25;
      if (isCrit) dmg *= engine.player.critDmg;

      // Puppets/Undead inherit 25% of Giant Slayer (+8.75%) and Executioner Blade (+10%)
      if (engine.acquiredAttributes.has('attr_giant_slayer') && (target.isBoss || target.maxHp > engine.player.maxHp)) {
        dmg *= 1.0875;
      }
      if (engine.acquiredAttributes.has('attr_executioner_blade') && target.hp / target.maxHp < 0.5) {
        dmg *= 1.10;
      }

      if (this.modLevel >= 2) {
        // Arcane Soul Cannon ranged bolt (inherits 25% relic effects via isMinionShot)
        engine.projectiles.push(new ProjectileEntity(
          this.x,
          this.y,
          target.x,
          target.y,
          560,
          dmg,
          isCrit,
          this.kind === 'puppet' ? '#22d3ee' : '#4ade80',
          'player',
          { isMinionShot: true }
        ));
      } else {
        target.takeDamage(dmg, isCrit, 'minion', engine);
        engine.createSlashEffect(this.x, this.y, target.x, target.y, this.kind === 'puppet' ? '#e879f9' : '#4ade80');
      }

      // Inherit 25% Relic Attributes on minion hits (melee-only guard prevents double-proccing on ranged bolts)
      if (this.modLevel < 2) {
        if (engine.acquiredAttributes.has('attr_toxic_spores')) {
          target.poisonTimer = Math.max(target.poisonTimer, 1.0);
          target.defense = Math.max(0, target.defense - 2.5);
        }
        if (engine.acquiredAttributes.has('attr_frost_orb') && Math.random() < 0.30) {
          target.stunTimer = Math.max(target.stunTimer, 0.3);
          target.takeDamage(engine.player.atk * 0.20, false, 'minion', engine);
        }
        if (engine.acquiredAttributes.has('attr_void_piercer')) {
          target.takeDamage(dmg * 0.075, false, 'true_damage', engine);
        }
        if (engine.acquiredAttributes.has('attr_echo_blade') && Math.random() < 0.35) {
          target.takeDamage(dmg * 0.1875, false, 'minion', engine);
        }
        if (engine.acquiredAttributes.has('attr_abyssal_mark') && Math.random() < 0.25) {
          engine.applyAbyssalMark(target);
        }
        if (engine.acquiredAttributes.has('attr_doom_scythe') && Math.random() < 0.25) {
          engine.triggerDoomScytheCrit(target, isCrit);
        }
      }
      if (engine.acquiredAttributes.has('attr_blood_pact')) {
        this.bloodPactHits++;
        if (this.bloodPactHits >= 20) {
          this.bloodPactHits = 0;
          engine.triggerBloodPact(target);
        }
      }
      if (engine.acquiredAttributes.has('attr_ricochet_glaive')) {
        this.ricochetHits++;
        if (this.ricochetHits >= 12) {
          this.ricochetHits = 0;
          engine.triggerRicochetGlaive(this.x, this.y, target);
        }
      }
      if (engine.acquiredAttributes.has('attr_anti_regen')) {
        this.blightHits++;
        if (this.blightHits >= 16) {
          this.blightHits = 0;
          engine.triggerBlightBurst(target);
        }
      }

      // Vampiric Thread Link heals Soul Puppeteer on Puppet strikes
      if (this.kind === 'puppet' && engine.unlockedTraits.has('sp_s1_u2')) {
        engine.healPlayer(dmg * 0.12);
      }

      const anchorBuff = ((engine.player.puppetPossessTimer ?? 0) > 0 && engine.unlockedTraits.has('sp_s2_u2')) ? 0.40 : 0;
      const effectiveASPD = engine.player.atkSpeed * (0.80 + this.modLevel * 0.15 + (this.possessTimer > 0 ? 0.35 : 0) + anchorBuff);
      this.attackTimer = 1 / Math.max(0.3, effectiveASPD);
    }
  }

  public draw(ctx: CanvasRenderingContext2D, engine: GameEngine) {
    ctx.save();

    if (this.kind === 'puppet') {
      // Glowing Marionette Puppet Strings connected to Soul Puppeteer
      if (this.possessTimer <= 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(232, 121, 249, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(engine.playerPos.x, engine.playerPos.y);
        ctx.lineTo(this.x, this.y - this.radius - 14);
        ctx.stroke();

        // Crossbar above puppet
        ctx.setLineDash([]);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y - this.radius - 14);
        ctx.lineTo(this.x + 10, this.y - this.radius - 14);
        ctx.stroke();
        ctx.restore();
      }

      // Puppet Body
      ctx.shadowColor = this.possessTimer > 0 ? '#22d3ee' : '#e879f9';
      ctx.shadowBlur = this.possessTimer > 0 ? 18 : 10;
      ctx.fillStyle = this.possessTimer > 0 ? '#06b6d4' : '#c026d3';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Puppet face button eyes
      ctx.fillStyle = '#fae8ff';
      ctx.beginPath();
      ctx.arc(this.x - 4, this.y - 2, 2.3, 0, Math.PI * 2);
      ctx.arc(this.x + 4, this.y - 2, 2.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Necromancer Undead Bone Revenant
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Spectral skull glow eyes
      ctx.fillStyle = '#bef264';
      ctx.beginPath();
      ctx.arc(this.x - 3.5, this.y - 1.5, 2, 0, Math.PI * 2);
      ctx.arc(this.x + 3.5, this.y - 1.5, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Modify Visual Gears / Cannon / Titan Core
    if (this.modLevel >= 1) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      const rot = Date.now() * 0.008;
      for (let s = 0; s < 4; s++) {
        const a = rot + (s * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(this.x + Math.cos(a) * this.radius, this.y + Math.sin(a) * this.radius);
        ctx.lineTo(this.x + Math.cos(a) * (this.radius + 6), this.y + Math.sin(a) * (this.radius + 6));
        ctx.stroke();
      }
    }
    if (this.modLevel >= 2) {
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(this.x - this.radius - 2, this.y, 3.5, 0, Math.PI * 2);
      ctx.arc(this.x + this.radius + 2, this.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.modLevel >= 3) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Health bar above minion
    const barW = this.radius * 2;
    const barH = 3.5;
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(this.x - barW / 2, this.y - this.radius - 9, barW, barH);
    ctx.fillStyle = this.kind === 'puppet' ? '#e879f9' : '#4ade80';
    ctx.fillRect(this.x - barW / 2, this.y - this.radius - 9, barW * hpRatio, barH);

    if (this.modLevel > 0) {
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`MOD Lv.${this.modLevel}`, this.x, this.y + this.radius + 10);
    }

    ctx.restore();
  }
}
