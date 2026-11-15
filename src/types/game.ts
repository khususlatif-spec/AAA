export type GameState = 
  | 'TITLE' 
  | 'CHARACTER_SELECT' 
  | 'SKILL_SELECT' 
  | 'PLAYING' 
  | 'LEVEL_UP' 
  | 'PAUSED' 
  | 'GAME_OVER' 
  | 'VICTORY';

export type GameMode = 'arena' | 'practice';

export type HeroKey = 'monkey' | 'demonis' | 'traveler' | 'valkyrie' | 'dimension_judge' | 'rift_walker' | 'soul_puppeteer' | 'solaris' | 'fallen_angel' | 'demon_raised';

export type BossCategory = 'Tank' | 'Warrior' | 'Assassin' | 'Manipulation';

export type TravelerStance = 'sword' | 'bow' | 'staff';

export interface SkillDefinition {
  id: string;
  name: string;
  cd: number; // base cooldown in seconds
  desc: string;
  icon: string;
  type: 'attack' | 'aoe' | 'buff' | 'control' | 'ultimate';
  level: number;
  maxLevel: number;
}

export interface AttributeDefinition {
  id: string;
  title: string;
  desc: string;
  category: 'offense' | 'defense' | 'utility' | 'unique';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  stackable?: boolean;
  recommendedHeroes?: HeroKey[];
}

export interface HeroConfig {
  key: HeroKey;
  name: string;
  subtitle: string;
  color: string;
  secondaryColor: string;
  hp: number;
  atk: number;
  atkSpeed: number;
  critChance: number;
  critDmg: number;
  range: number;
  speed: number;
  defense: number;
  lore: string;
  passiveName: string;
  passiveDesc: string;
  skills: SkillDefinition[];
}

export interface CombatStats {
  kills: number;
  wave: number;
  enemiesRemaining?: number;
  timeSurvived: number;
  damageDealt: number;
  highestCrit: number;
  damageTaken: number;
  level: number;
  dps?: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  atk: number;
  atkSpeed: number;
  critChance: number;
  critDmg: number;
  speed: number;
  range: number;
  defense: number;
  cdr: number;
  evasion: number;
  lifesteal: number;
  level: number;
  exp: number;
  maxExp: number;
  demonisStacks: number;
  demonisFCD: number;
  travelerStance: TravelerStance;
  travelerTimeStacks: number;
  travelerRewindReady: boolean;
  travelerKillsRecharge: number;
  isTimeStopActive: boolean;
  timeStopTimer: number;
  rageTimer: number;
  swiftTimer: number;
  monkeyWeaponActive: boolean;
  varpScytheStacks: number;
  burstCritActive: boolean;
  fallenWingsActive: boolean;
  magicDestroActive: boolean;
  warArmorActive: boolean;
  warArmorBonusDef: number;
  judgeDomainTimer: number;
  travelerFieldTimer: number;
  soulMagnetRange: number;
  aegisShield?: number;
  riftBlinkCombo?: number;
  riftWarpBuffTimer?: number;
  isInvulnerable?: boolean;
  frostArmorShield?: number;
  frostChillHits?: number;
  monkeyHavocTimer?: number;
  monkeyDuelStacks?: number;
  monkeyComboHits?: number;
  monkeySubCd?: number;
  souls?: number;
  puppetCount?: number;
  undeadCount?: number;
  puppetPossessTimer?: number;
  lichTransformTimer?: number;
  solarHeat?: number;
  solarAvatarTimer?: number;
  travelerOverdriveTimer?: number;
  riftStormTimer?: number;
  angelFeathers?: number;
  angelEclipseTimer?: number;
  demonEssence?: number;
  demonAwakenTimer?: number;
  demonRebirthCd?: number;
  skillCDs: number[];
  skillMaxCDs: number[];
}
