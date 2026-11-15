import { HeroConfig, AttributeDefinition } from '../types/game';

export const HERO_DATABASE: Record<string, HeroConfig> = {
  monkey: {
    key: 'monkey',
    name: 'MONKEY KING',
    subtitle: 'Melee Brawler & Illusion Master',
    color: '#f59e0b', // Amber
    secondaryColor: '#b45309',
    hp: 780, // Buffed defense & survivability
    atk: 38, // Nerfed base ATK
    atkSpeed: 1.25,
    critChance: 0.10, // Nerfed to 10%
    critDmg: 0.10, // Nerfed Base Crit Damage 10%
    range: 75,
    speed: 170,
    defense: 24, // Buffed defense significantly
    lore: 'Master of simian martial arts and clone duplicates. Absorbs lifeforce from enemy strikes.',
    passiveName: 'Crit Converter, Immortal Vajra, Duel Ascendance, Jingu Mastery & 72-Form Substitution',
    passiveDesc: 'Base Crit Damage: 10%. Setiap 1% Crit Damage diubah menjadi +2 Attack Damage dan setiap 1% Crit Chance dikonversi menjadi +5 True Damage per serangan dasar (Maks. 100 True Damage, Clone mewarisi 50%-75%). Tubuh Immortal Vajra mengurangi 25% damage diterima, memberi +12% Lifesteal & +12% Evasion dasar, dan Clone mewarisi 50%-75% Stats + 100% Relic Attribute. Duel Ascendance: Lawan 1 musuh terus hidup tiap 2s memberi +1 stack (maks 25): +6% ATK, +4% ASPD, +1.5% Crit, +2 DEF. Jingu Mastery: Tiap 4 serangan dasar menyapu 145px (160% ATK, Sunder -8% DEF), heal 3% HP (4% Overdrive), +75 Vajra Shield (maks 35% Max HP), -0.4s CD Skill, & Clone Echo Sweep. 72-Form Substitution: Menahan serangan mematikan (CD 40s, -1s per Jingu Sweep), memulihkan 45% Max HP, kebal 2.0s, +150 Shield, dan menukar posisi dengan Clone (atau memanggil 1 Clone) dengan ledakan stun 1.2s!',
    skills: [
      {
        id: 'm_s1',
        name: 'Monkey Clone',
        cd: 14,
        desc: 'Memanggil clone bertarget musuh yang mewarisi 50% Stats master (HP, ATK, DEF, ASPD, Crit, Speed, Evasion), pengurangan damage 18%, 100% seluruh Relic Attribute master & menyembuhkan master saat memukul musuh.',
        icon: 'Copy',
        type: 'buff',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'm_s2',
        name: 'RuYi: Heavenly Staff Slam',
        cd: 8.5,
        desc: 'Memanjangkan Tongkat Emas Sakti RuYi Jingu Bang dan menghantamkannya ke tanah! Menghasilkan 165% Damage garis gempa, stun 0.8 detik, dan seluruh clone ikut menghantam (50%-75% damage). Jika musuh memiliki Barrier, memberi bonus damage sebesar 50 + (5% Barrier + 1.5% Max HP Musuh)!',
        icon: 'Zap',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'm_s3',
        name: 'Somersault Cloud: Gale Cyclone',
        cd: 12.5,
        desc: 'Menaiki Awan Kinton (Jindou Yun) melesat kilat menerobos barisan musuh, menciptakan badai tornado topan emas (115% damage), serta kebal (invulnerable) selama 0.8 detik.',
        icon: 'Wind',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'm_s4',
        name: 'Havoc in Heaven: Colossus Pillar',
        cd: 28.0,
        desc: 'Membangkitkan wujud Kera Sakti Sejati! Menghujamkan tiang RuYi, memicu gempa 250px (67.5% damage), 5 sambaran petir emas (150% True Damage), serta Overdrive amarah pada master dan semua clone selama 6.5 detik!',
        icon: 'Flame',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      }
    ]
  },
  demonis: {
    key: 'demonis',
    name: 'DEMONIS (REVAMP)',
    subtitle: 'Abyssal Void Sovereign',
    color: '#a855f7', // Purple
    secondaryColor: '#7e22ce',
    hp: 860,
    atk: 82,
    atkSpeed: 1.75,
    critChance: 0.35,
    critDmg: 2.2,
    range: 280,
    speed: 210,
    defense: 12,
    lore: 'Penguasa jurang void yang memanen jiwa musuh untuk mengisi muatan energi kosmik dan melepaskan hujan proyektil kehancuran.',
    passiveName: 'Full Charger Demonis & Abyssal Hunger',
    passiveDesc: 'Setiap 4 serangan (+2 Stack per kill) memberi +1 FCD (maks 30). Tiap FCD menambah +1 Proyektil Void Single-Target melengkung (12% ATK, bisa Crit), +1.5% Crit Damage & +1.5% ASPD. Pada 30/30 FCD memasuki Abyssal Ascendance (+20% ATK & Proyektil meledak Void AoE!), serta regenerasi 2.5% Max HP/dtk.',
    skills: [
      {
        id: 'd_s1',
        name: 'Void Obliteration Beam',
        cd: 3.4,
        desc: 'Menembakkan Laser Kosmik berdamage 320% + 8% ATK per FCD (dapat Critical!), memberi +2 Stack, mengeksekusi non-Boss HP < 25%, dan +120% True Damage ke Boss HP < 30%.',
        icon: 'Eye',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'd_s2',
        name: 'Abyssal Shadow Waltz',
        cd: 8.5,
        desc: 'Melompat taktis meninggalkan Ledakan Void Singularity (180% ATK True Damage) di titik asal! Memicu Shadow Veil 2.5s (+60% Evasion, +35% Speed) & Dark Soul Drain tiap 0.5s (90% ATK True Damage AoE & heal 3% HP/musuh).',
        icon: 'ShieldAlert',
        type: 'buff',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'd_s3',
        name: 'Cataclysm Void Eclipse',
        cd: 13.5,
        desc: 'Menciptakan gerhana Void di area target (radius 260px): menarik & men-stun musuh selama 1.0s, meledakkan 155% ATK + (20% + 3.5% per FCD) True Damage, memulihkan HP saat kill, dan memberi +1 FCD!',
        icon: 'Skull',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      }
    ]
  },
  traveler: {
    key: 'traveler',
    name: 'TRAVELER (REVAMP)',
    subtitle: 'Chronos Stance Sovereign',
    color: '#06b6d4', // Cyan
    secondaryColor: '#0e7490',
    hp: 740,
    atk: 56,
    atkSpeed: 1.50,
    critChance: 0.32,
    critDmg: 2.05,
    range: 155,
    speed: 195,
    defense: 18,
    lore: 'Pengembara dimensi pengendali waktu yang menggabungkan Pedang, Busur, dan Tongkat Kosmik dengan resonansi Chronos yang mematikan.',
    passiveName: 'Chronos Resonance & Time Reversal Berserk',
    passiveDesc: 'Auto Stance Mastery: Sword (+50% ATK, +20% ASPD, +15% Lifesteal, tebasan AoE), Bow (+35% ATK, +45% ASPD, +10% Crit, Twin Arrows 55%), Staff (+70% ATK, +10% ASPD, ledakan AoE 65% True Damage). Setiap kill +2% ATK (maks +60%). Setiap Skill memangkas cooldown skill lain 0.5s. Saat HP 0, Time Stop Berserk memutar balik waktu (+40% ATK/ASPD) & terisi ulang tiap 30 kill!',
    skills: [
      {
        id: 't_s1_revamp',
        name: 'Chrono Dimension Nova',
        cd: 4.5,
        desc: 'Gelombang dimensi radius 185px menghasilkan 280% AoE True Damage (dapat Critical!), menarik musuh ke pusat cincin waktu, dan memberi Chrono Shield 160 HP.',
        icon: 'Sparkles',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 't_s2',
        name: 'Tri-Stance Phantom Slash',
        cd: 5.2,
        desc: 'Melancarkan serangan beruntun 100% Critical Strike sesuai Stance aktif: Sword (3 tebasan AoE 155% + heal 4%), Bow (5 Panah Waktu 105%), Staff (3 Pilar Astral AoE 165%).',
        icon: 'Crosshair',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 't_s3',
        name: 'Temporal Stasis & Rewind',
        cd: 11.5,
        desc: 'Membekukan waktu di radius 250px selama 2.4 detik, meledakkan Chrono Rewind (180% True Damage, bisa Crit), kebal 1.0 detik, dan memulihkan 28% Max HP.',
        icon: 'Hourglass',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 't_s4',
        name: 'Chronos Overdrive Domain',
        cd: 12.5,
        desc: 'Membuka Aura & Zona Chronos selama 7 detik: memperlambat musuh 45%, memberi +35% ATK, +50% ASPD, +25% Crit Damage, dan menembakkan Bilah Waktu (110% True Damage, bisa Crit) tiap 0.7 detik!',
        icon: 'Maximize2',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      }
    ]
  },
  valkyrie: {
    key: 'valkyrie',
    name: 'VALKYRIE FROST',
    subtitle: 'Glacial Valkyrie & Cryo Vanguard',
    color: '#38bdf8', // Sky Blue
    secondaryColor: '#0284c7',
    hp: 880,
    atk: 66,
    atkSpeed: 1.60,
    critChance: 0.28,
    critDmg: 2.0,
    range: 145,
    speed: 205,
    defense: 26,
    lore: 'Nordic battle maiden commanding piercing permafrost and glacial ice storms in relentless cryo vanguard warfare.',
    passiveName: 'Permafrost Dominion & Frostbite Shiver',
    passiveDesc: 'Serangan dasar memperlambat musuh & memberi +20% Damage pada target Chill/Stun. Meregenerasi +12 Ice Shield/dtk (maks 650 HP); saat Ice Shield aktif mendapat +35 ATK, +35% ASPD, +35 DEF, +20 Speed & -18% DMG diterima! Setiap 3 hit memicu Deep Freeze (1.8s), ledakan 160% ATK, 6 pecahan es (80% ATK), & +110 Ice Shield.',
    skills: [
      {
        id: 'v_s1',
        name: 'Glacial Piercing Rush',
        cd: 4.0,
        desc: 'Menerjang maju menusuk dengan Tombak Es Glasial (250% AoE Frost Damage), memperlambat musuh 3.5 detik, memberi +80 Permafrost Shield, dan +55 Speed selama 3 detik.',
        icon: 'Zap',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'v_s2',
        name: 'Cryo Vortex & Diamond Dust',
        cd: 5.5,
        desc: 'Memanggil pusaran badai es kristal (150% ATK) yang menarik musuh & menghancurkan -35% Defense sambil meluncurkan 9 tombak kristal es (135% ATK).',
        icon: 'Wind',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'v_s3',
        name: 'Glacial Fortress Aegis',
        cd: 10.0,
        desc: 'Membentangkan benteng sayap es kristal (+750 Permafrost Shield), membekukan musuh sekitar selama 2.8 detik dan memberi 210% AoE Frost Damage.',
        icon: 'Shield',
        type: 'buff',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'v_s4',
        name: 'Ragnarok Glacial Calamity',
        cd: 18.5,
        desc: 'Membekukan SELURUH musuh 4.0 detik & menjatuhkan 8 komet es glasial (360% AoE Frost Damage per komet) serta menciptakan zona badai salju berkala (65% ATK)!',
        icon: 'Snowflake',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      }
    ]
  },
  dimension_judge: {
    key: 'dimension_judge',
    name: 'DIMENSION JUDG',
    subtitle: 'Spatial Architect & Reality Arbiter',
    color: '#818cf8', // Indigo / Celestial Purple
    secondaryColor: '#4f46e5',
    hp: 680,
    atk: 60,
    atkSpeed: 1.45,
    critChance: 0.26,
    critDmg: 1.85,
    range: 210,
    speed: 180,
    defense: 14,
    lore: 'Entitas kosmik pengendali ruang dan gravitasi. Mampu melipat dimensi, memanggil singularitas lubang hitam, dan menciptakan domain ruang penghakiman mutlak.',
    passiveName: 'Spatial Gravity Distortion',
    passiveDesc: 'Memanipulasi ruang dalam radius 180px: musuh ditarik perlahan ke pusat gravitasi Dimension Judg.',
    skills: [
      {
        id: 'dj_s1',
        name: 'Spatial Collapse (Singularitas)',
        cd: 7.0,
        desc: 'Menciptakan ruang singularitas berputar yang menyedot musuh lalu meledak dengan 240% AoE Spatial Damage (dapat menghasilkan Critical Strike!).',
        icon: 'CircleDot',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'dj_s2',
        name: 'Dimensional Barrier (Dinding Ruang)',
        cd: 9.0,
        desc: 'Menciptakan dinding pembatas ruang dimensional yang memblokade jalan musuh dan memberi 55% ATK damage berkala setiap 0.45 detik (dapat Critical Strike!).',
        icon: 'Shield',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'dj_s3',
        name: 'Spatial Warp Blink',
        cd: 7.5,
        desc: 'Membelah ruang untuk berteleportasi seketika, meninggalkan ledakan ruang hampa (175% Vacuum Implosion, dapat Critical Strike!) yang men-stun musuh 1.8 detik.',
        icon: 'Compass',
        type: 'buff',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'dj_s4',
        name: 'Judgement Spatial Domain',
        cd: 18.0,
        desc: 'Membuka kubah ruang isolasi selama 6 detik: seluruh musuh di dalamnya terkena True Damage berkala (25 + 70% ATK) tiap 0.5 detik yang dapat Critical Strike, dan ATK Dimension Judg +100%!',
        icon: 'Sparkles',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      }
    ]
  },
  rift_walker: {
    key: 'rift_walker',
    name: 'RIFT WALKER (REVAMP)',
    subtitle: 'Quantum Phantom & Dimensional Assassin',
    color: '#06b6d4', // Cyan
    secondaryColor: '#0891b2',
    hp: 680,
    atk: 52,
    atkSpeed: 1.45,
    critChance: 0.24,
    critDmg: 1.85,
    range: 120,
    speed: 215,
    defense: 14,
    lore: 'Pendekar bayangan kuantum yang membelah dimensi dalam sekejap mata. Mengubah setiap teleportasi dan penghindaran menjadi tebasan pemecah realitas dan tanda ledakan Rift.',
    passiveName: 'Quantum Blink Resonance & Phase Shroud',
    passiveDesc: 'Memiliki +12% Evasion dasar. Setiap Dodge atau Blink/Teleport memicu Phase Counter-Slash (65% ATK True Damage AoE, CD 0.65s) & memotong cooldown semua Skill 0.2s! Setiap 4 serangan dasar melakukan Quantum Blink ke belakang target: 100% Crit 125% Damage + 3% Max HP target True Damage, menumpuk Rift Mark (3 mark meledak 120% True Damage AoE), heal 2.5% Max HP, +110 Phase Shield (maks 350), dan Quantum Warp 2.0s (+30% ASPD, +12% Evasion, +10% Crit, -15% DMG diterima).',
    skills: [
      {
        id: 'rw_s1',
        name: 'Quantum Blink Strike',
        cd: 5.2,
        desc: 'Teleportasi instan ke belakang target, menebas AoE radius 130px dengan 100% Crit (175% ATK) + 3% Max HP target True Damage, stun 0.9 detik, heal 4% Max HP, +120 Phase Shield & Quantum Warp 2.0s.',
        icon: 'Zap',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'rw_s2',
        name: 'Phase Crossfire Ambush',
        cd: 7.5,
        desc: 'Melakukan 3x teleportasi tebasan kilat antar musuh terdekat! Tiap tebasan memberi 100% Crit 115% ATK AoE, stun 0.4s, dan meninggalkan Garis Laser Rift (55% ATK True Damage) sepanjang jalur warp.',
        icon: 'Compass',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'rw_s3',
        name: 'Phantom Decoy Singularity',
        cd: 8.8,
        desc: 'Teleportasi menghindar 185px (kebal 0.45s), memulihkan 4% Max HP + 120 Phase Shield, menarik & meledakkan musuh di titik asal (110% ATK True Damage), serta memanggil Klon Bayangan Warp selama 5.5 detik.',
        icon: 'Copy',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'rw_s4',
        name: 'Omnipresent Void Storm',
        cd: 19.5,
        desc: 'Menjadi tak tersentuh (Invulnerable) selama badai teleportasi 10x tebasan kilat beruntun (100% Crit 95% ATK + 1.2% Max HP True Damage per tebasan), ditutup ledakan Void Shatter Nova 210% ATK True Damage radius 220px!',
        icon: 'Sparkles',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      }
    ]
  },
  soul_puppeteer: {
    key: 'soul_puppeteer',
    name: 'SOUL PUPPETEER',
    subtitle: 'Necromancer, Puppeteer & Soul Maker Sovereign',
    color: '#e879f9', // Fuchsia Soul Glow
    secondaryColor: '#9333ea',
    hp: 640,
    atk: 40,
    atkSpeed: 1.15,
    critChance: 0.18,
    critDmg: 1.85,
    range: 220,
    speed: 190,
    defense: 12,
    lore: 'Penguasa benang jiwa terlarang yang menempakan Soul, mengendalikan boneka perang, merasuki wadah boneka, membangkitkan pasukan mayat hidup, memodifikasi ciptaannya, hingga bertransformasi menjadi Soul Lich.',
    passiveName: 'Soul Maker & Necro Strings',
    passiveDesc: 'Setiap serangan dasar menempa +1 Soul & membunuh musuh memberi +3 Soul (+10 Boss, maks 30 Soul) serta membangkitkan Bone Revenant (Boneka & Undead hanya mewarisi 25% efek Relic). Tiap 1 Soul memberi +0.8% ATK; pada >=10 Soul, serangan menembakkan Soul Thread Bolt (+10% ATK True Damage).',
    skills: [
      {
        id: 'sp_s1',
        name: 'Marionette Control (Kendali Boneka)',
        cd: 7.5,
        desc: 'Memanggil 2 Boneka Perang (maks 3 aktif) yang terhubung Benang Jiwa ke Soul Puppeteer. Boneka menyerang otonom (55% ATK) & mewarisi 25% efek Relic + Modifikasi.',
        icon: 'Copy',
        type: 'buff',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'sp_s2',
        name: 'Soul Possession (Merasuki Boneka)',
        cd: 10.0,
        desc: 'Melesat merasuki boneka (3.0 detik, tubuh utama kebal & TIDAK BISA DI-HIT selama durasi rasukan), memulihkan 15% HP + 220 Soul Shield, meledakkan Soul Shockwave 150% True Damage, serta mendapat +30% ASPD & +65 Speed.',
        icon: 'Ghost',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'sp_s3',
        name: 'Necro Forge & Puppet Modify',
        cd: 11.0,
        desc: 'Necromancer membangkitkan 2 Bone Revenant (maks 5) & memodifikasi seluruh Boneka/Undead (+1 Tier Modify: +25% ATK per tier, maks Lv.3) sekaligus men-transform musuh HP <28% menjadi Boneka!',
        icon: 'Wrench',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'sp_s4',
        name: 'Sovereign Transform: Ascendant Lich',
        cd: 24.0,
        desc: 'Bertransformasi menjadi Soul Lich selama 8 detik (+30% ATK, +20% ASPD, +25 DEF, +180 Range), serangan berubah menjadi 3-arah Soul Scythe (45% samping) & Execution 160% True Damage ke seluruh musuh!',
        icon: 'Crown',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      }
    ]
  },
  solaris: {
    key: 'solaris',
    name: 'SOLARIS IGNIS',
    subtitle: 'Pyre Dragoon & Solar Flare Sovereign',
    color: '#f97316', // Solar Orange
    secondaryColor: '#c2410c',
    hp: 760,
    atk: 56,
    atkSpeed: 1.40,
    critChance: 0.25,
    critDmg: 1.95,
    range: 145,
    speed: 195,
    defense: 18,
    lore: 'Ksatria naga matahari pembawa tombak inti bintang. Mengumpulkan panas surya di setiap serangan untuk meledakkan meteor dan berubah menjadi Avatar Matahari.',
    passiveName: 'Solar Flare Ignition',
    passiveDesc: 'Setiap serangan dasar & skill mengumpulkan +1 Solar Heat (+3 per kill, maks 20). Tiap stack memberi +2% ATK & +1.5% ASPD. Pada 10+ stack, serangan memicu ledakan Solar Flare (45% ATK True Damage AoE) & setiap kill memulihkan 2% Max HP.',
    skills: [
      {
        id: 'sol_s1',
        name: 'Solar Lance Thrust',
        cd: 4.8,
        desc: 'Menerjang menusukkan Tombak Matahari sejauh 220px, menembus semua musuh di jalur dengan 230% ATK + 60% ATK True Damage serta menambah +3 Solar Heat.',
        icon: 'Zap',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'sol_s2',
        name: 'Corona Nova Ring',
        cd: 6.5,
        desc: 'Meledakkan cincin api matahari radius 190px berdamage 190% AoE (dapat Critical), mendorong musuh mundur, dan memberi Solar Shield 220 HP.',
        icon: 'Shield',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'sol_s3',
        name: 'Starfall Meteor Barrage',
        cd: 9.5,
        desc: 'Memanggil 4 meteor matahari menghujani musuh terdekat! Tiap meteor meledak radius 115px berdamage 185% ATK (dapat Critical) dan men-stun 0.9 detik.',
        icon: 'Flame',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'sol_s4',
        name: 'Supernova Incarnation',
        cd: 20.0,
        desc: 'Bertransformasi menjadi Avatar Matahari selama 8 detik: langsung mengisi 20 Solar Heat penuh, +45% ATK, +40% ASPD, +40 Speed, aura bakar 90% ATK True Damage/dtk (dapat Crit!), dan ledakan awal 320% True Damage!',
        icon: 'Sun',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      }
    ]
  },
  fallen_angel: {
    key: 'fallen_angel',
    name: 'FALLEN ANGEL',
    subtitle: 'Eclipse Seraph & Black-Feather Arbiter',
    color: '#c084fc', // Fallen Seraph Violet
    secondaryColor: '#e11d48',
    hp: 780,
    atk: 56,
    atkSpeed: 1.55,
    critChance: 0.26,
    critDmg: 1.95,
    range: 185,
    speed: 225,
    defense: 16,
    lore: 'Seraphim terbuang dengan enam sayap gerhana obsidian. Menari di medan perang dengan bulu-bulu terkutuk yang menembus pertahanan dan menghakimi dosa seluruh lawan.',
    passiveName: 'Eclipse Seraph & Fallen Feathers',
    passiveDesc: 'Memiliki +12% Evasion & +12% Lifesteal alami. Setiap serangan dasar & kill mengumpulkan +1 Fallen Feather (+2 per kill, +6 Boss, maks 12). Tiap Feather memberi +1.5% ATK & +2.5 Speed. Setiap serangan ke-3 (atau saat Feather penuh) menembakkan 3 Bulu Gerhana Penembus (55% ATK True Damage) & heal 2% Max HP. Saat HP <45% (Eclipse Grace), menerima -20% DMG & +12% Evasion!',
    skills: [
      {
        id: 'fa_s1',
        name: 'Crimson Feather Barrage',
        cd: 4.5,
        desc: 'Meluncurkan 7 Bulu Gerhana berbentuk kipas ke arah target (115% ATK per bulu, bisa Crit) yang merobek Defense musuh -20% & menambah +3 Fallen Feathers.',
        icon: 'Feather',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'fa_s2',
        name: 'Shattered Halo Dash',
        cd: 7.0,
        desc: 'Melesat kebal sesaat (0.6s Invulnerable + 240 Shield) dan meninggalkan lingkaran Halo Hitam radius 185px yang meledak 195% ATK True Damage serta men-stun musuh 1.3 detik.',
        icon: 'Sparkles',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'fa_s3',
        name: 'Judgement of Sin',
        cd: 10.5,
        desc: 'Menjatuhkan Pilar Penghakiman Korup radius 215px ke kelompok musuh terdekat: ledakan ganda 175% ATK + 4% Max HP (maks 600) True Damage & stun 1.1 detik!',
        icon: 'Zap',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'fa_s4',
        name: 'Eclipse of the Fallen Seraph',
        cd: 20.0,
        desc: 'Membuka 6 Sayap Gerhana selama 8 detik (+45% ATK, +35% ASPD, +18% Evasion), ledakan awal 320% ATK True Damage radius 240px, dan menghujankan 4 Bulu Hitam (95% ATK True Damage) tiap 0.65 detik!',
        icon: 'Crown',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      }
    ]
  },
  demon_raised: {
    key: 'demon_raised',
    name: 'DEMON RAISED',
    subtitle: 'Risen Archfiend & Hellfire Overlord',
    color: '#e11d48', // Hellfire Crimson
    secondaryColor: '#991b1b',
    hp: 920,
    atk: 62,
    atkSpeed: 1.45,
    critChance: 0.22,
    critDmg: 2.0,
    range: 130,
    speed: 205,
    defense: 24,
    lore: 'Raja Iblis kuno yang bangkit kembali dari jurang neraka abadi. Semakin banyak darah tertumpah, semakin membara amarah Hellfire-nya hingga tak terhentikan oleh kematian itu sendiri.',
    passiveName: 'Risen Abyssal Sovereign',
    passiveDesc: 'Serangan dasar & kill mengumpulkan +1 Hellfire Essence (+3 per kill, +8 Boss, maks 25). Tiap Essence memberi +2% ATK, +1.5 DEF, & +0.6% Lifesteal. Pada >=10 Essence atau HP <50%, serangan memicu ledakan Api Neraka (50% ATK True Damage) & -18% DMG diterima. Abyssal Rebirth (CD 45s): saat HP habis, otomatis bangkit dengan 45% HP + Hellfire Nova 260% ATK True Damage!',
    skills: [
      {
        id: 'dr_s1',
        name: 'Hellfire Claw Cleave',
        cd: 4.2,
        desc: 'Tebasan cakar iblis radius 165px ke depan menghasilkan 235% ATK (bisa Crit) + 85% ATK True Damage Api Neraka serta memberi +3 Hellfire Essence.',
        icon: 'Swords',
        type: 'attack',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'dr_s2',
        name: 'Abyssal Chains & Blood Pact',
        cd: 7.5,
        desc: 'Menembakkan rantai neraka radius 235px menarik seluruh musuh (170% ATK AoE), menguras darah untuk memulihkan 14% Max HP + 260 Blood Shield!',
        icon: 'Shield',
        type: 'control',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'dr_s3',
        name: 'Infernal Abyss Eruption',
        cd: 10.0,
        desc: 'Membelah tanah neraka memanggil 5 letusan pilar magma beruntun di sekitar musuh terdekat (210% ATK per letusan radius 115px) & +4 Hellfire Essence!',
        icon: 'Flame',
        type: 'aoe',
        level: 1,
        maxLevel: 5
      },
      {
        id: 'dr_s4',
        name: 'Risen Archfiend Ascension',
        cd: 19.5,
        desc: 'Kebangkitan Raja Iblis selama 9 detik: langsung mengisi Essence penuh, +55% ATK, +45% ASPD, +40 Speed, -25% DMG diterima, ledakan awal 350% True Damage & aura Hellfire 110% True Damage tiap 0.75s!',
        icon: 'Skull',
        type: 'ultimate',
        level: 1,
        maxLevel: 5
      }
    ]
  }
};

export const ATTRIBUTE_POOL: AttributeDefinition[] = [
  {
    id: 's_hp',
    title: 'Titan Health',
    desc: '+240 Max HP & pulihkan 180 HP secara instan.',
    category: 'defense',
    rarity: 'common',
    icon: 'Heart',
    stackable: true
  },
  {
    id: 's_atk',
    title: 'Physical Destruction',
    desc: '+34 Base Physical Damage ke seluruh serangan & skill.',
    category: 'offense',
    rarity: 'common',
    icon: 'Sword',
    stackable: true
  },
  {
    id: 's_crit',
    title: 'Critical Precision',
    desc: '+18% Critical Chance & +55% Critical Strike Damage.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Target',
    stackable: true
  },
  {
    id: 's_speed',
    title: 'Swiftness Aura',
    desc: '+45 Movement Speed & +25% Attack Speed.',
    category: 'utility',
    rarity: 'common',
    icon: 'Footprints',
    stackable: true
  },
  {
    id: 'attr_monkey_wpn',
    title: 'Monkey Staff Resonance',
    desc: '+12% ASPD pasif. Setiap 2 hit berturut memberi +80% ASPD selama 2.5 detik.',
    category: 'unique',
    rarity: 'epic',
    icon: 'Wand2',
    recommendedHeroes: ['monkey']
  },
  {
    id: 'attr_varp_scythe',
    title: 'Varp Death Scythe',
    desc: 'Setiap hit memberikan +5% Attack Speed yang dapat di-stack hingga 20 kali (Total +100% ASPD).',
    category: 'offense',
    rarity: 'epic',
    icon: 'Activity'
  },
  {
    id: 'attr_burst_crit',
    title: 'Burst True Crit',
    desc: 'Setiap serangan Critical memicu ledakan 6% True Damage dari Max HP target.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Zap'
  },
  {
    id: 'attr_fallen_wings',
    title: 'Fallen Angel Wings',
    desc: 'Ketika HP berada di bawah 25%: Dmg masuk berkurang 45% dan peroleh +40% Lifesteal.',
    category: 'defense',
    rarity: 'legendary',
    icon: 'Feather'
  },
  {
    id: 'attr_magic_destro',
    title: 'Magic Destruction Core',
    desc: 'Menambahkan bonus 80 + 80% Magic Damage ekstra pada semua serangan dasar.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Sparkles'
  },
  {
    id: 'attr_war_armor',
    title: 'War God Armor',
    desc: '+20% CDR & +2 Defense permanen setiap kali menerima hit (Maksimal bonus Def: 100).',
    category: 'defense',
    rarity: 'epic',
    icon: 'ShieldCheck'
  },
  {
    id: 'attr_soul_magnet',
    title: 'Cosmic Soul Magnet',
    desc: 'Meningkatkan jangkauan penyerapan Exp Gem sebesar +180% dan bonus +35% EXP.',
    category: 'utility',
    rarity: 'common',
    icon: 'Magnet',
    stackable: true
  },
  {
    id: 'attr_overcharge',
    title: 'Overcharge Conduit',
    desc: 'Setiap 3.0 detik melepaskan rantai petir otomatis ke 4 musuh terdekat berdamage 180 + 120% ATK.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Cpu'
  },
  {
    id: 'attr_vampiric_embrace',
    title: 'Bloodthirsty Fang',
    desc: '+22% Lifesteal permanen dan setiap kali membunuh musuh memulihkan 40 HP seketika.',
    category: 'defense',
    rarity: 'rare',
    icon: 'Heart'
  },
  {
    id: 'attr_shield_aegis',
    title: 'Titan Aegis Barrier',
    desc: 'Mendapatkan perisai energi penyerap damage sebesar 380 HP setiap 10 detik. Selama perisai aktif, kebal stun.',
    category: 'defense',
    rarity: 'legendary',
    icon: 'Shield'
  },
  {
    id: 'attr_chain_lightning',
    title: 'Thunder God Orb',
    desc: 'Serangan dasar memiliki peluang 35% memicu petir berantai ke 4 musuh dengan 150% ATK damage.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Zap'
  },
  {
    id: 'attr_singularity_core',
    title: 'Cosmic Singularity Core',
    desc: 'Setiap 6 detik memanggil lubang hitam gravitasi mini yang menyedot dan memperlambat musuh di sekitar.',
    category: 'utility',
    rarity: 'epic',
    icon: 'Sparkles'
  },
  {
    id: 'attr_executioner_blade',
    title: 'Executioner Guillotine',
    desc: '+40% ekstra damage pada musuh dengan HP < 50%, dan mengeksekusi instan monster non-boss ber-HP < 15%.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Sword'
  },
  {
    id: 'attr_chronos_hourglass',
    title: 'Chrono Temporal Hourglass',
    desc: '+25% Cooldown Reduction (CDR) dan +40 Movement Speed permanen.',
    category: 'utility',
    rarity: 'epic',
    icon: 'Hourglass'
  },
  {
    id: 'attr_berserker_blood',
    title: 'Berserker Fury Blood',
    desc: 'Setiap 10% HP yang hilang memberikan +8% Attack Damage dan +6% Attack Speed.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Flame'
  },
  {
    id: 'attr_toxic_spores',
    title: 'Abyssal Venom Flask',
    desc: 'Serangan memberikan racun selama 4 detik (75 damage/detik) dan mengikis 10 Defense musuh.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Skull'
  },
  // --- NEW RELIC ATTRIBUTES ---
  {
    id: 'attr_iron_fortress',
    title: 'Adamantite Plate',
    desc: '+24 Defense & +180 Max HP permanen untuk ketahanan garis depan.',
    category: 'defense',
    rarity: 'common',
    icon: 'Shield',
    stackable: true
  },
  {
    id: 'attr_sniper_scope',
    title: 'Eagle Horizon Lens',
    desc: '+85 Attack Range & +16% Critical Chance secara permanen.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Crosshair',
    stackable: true
  },
  {
    id: 'attr_blood_crescent',
    title: 'Blood Moon Crescent',
    desc: '+36 Attack Damage & +35% Critical Damage. Setiap Critical memulihkan 3% Max HP.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Moon',
    stackable: true
  },
  {
    id: 'attr_wind_dancer',
    title: 'Tempest Gale Boots',
    desc: '+65 Movement Speed, +30% Attack Speed, & +12% Evasion permanen.',
    category: 'utility',
    rarity: 'rare',
    icon: 'Wind',
    stackable: true
  },
  {
    id: 'attr_quantum_prism',
    title: 'Quantum Chaos Prism',
    desc: '+35 ATK, +30% ASPD, +16% Crit Chance, +45% Crit Damage, & +15% CDR sekaligus!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Gem',
    stackable: true
  },
  {
    id: 'attr_phoenix_ember',
    title: 'Phoenix Ash Ember',
    desc: 'Setiap 5 detik memicu ledakan api (180% ATK AoE) & bangkit 1x saat mati dengan 55% HP + kebal 2.5 detik.',
    category: 'defense',
    rarity: 'legendary',
    icon: 'Flame'
  },
  {
    id: 'attr_frost_orb',
    title: 'Glacial Frost Orb',
    desc: 'Serangan dasar & Clone berpeluang 30% membekukan musuh 1.2 detik serta memicu ledakan es 80% ATK.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Snowflake'
  },
  {
    id: 'attr_sunfire_cape',
    title: 'Solar Flare Mantle',
    desc: 'Membakar musuh dalam radius 150px setiap detik dengan True Damage sebesar 45 + 3% Max HP pemain.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Sun'
  },
  {
    id: 'attr_giant_slayer',
    title: 'Titan Giant Slayer',
    desc: '+35% damage bonus terhadap Boss dan musuh yang memiliki Max HP lebih tinggi dari pahlawan.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Sword'
  },
  {
    id: 'attr_crimson_meteor',
    title: 'Crimson Meteorite',
    desc: 'Setiap 7 detik menjatuhkan meteor raksasa ke musuh terdekat (320% ATK AoE Damage & stun 1.5 detik).',
    category: 'offense',
    rarity: 'legendary',
    icon: 'Flame'
  },
  {
    id: 'attr_echo_blade',
    title: 'Phantom Echo Blade',
    desc: 'Serangan dasar & Clone berpeluang 35% memicu serangan ganda instan (Double Strike) 75% damage.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Swords'
  },
  {
    id: 'attr_void_piercer',
    title: 'Void Armor Piercer',
    desc: 'Menambahkan 30% bonus True Damage murni pada setiap serangan dasar dan Clone yang menembus Defense.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Zap'
  },
  {
    id: 'attr_thornmail',
    title: 'Spiked Obsidian Armor',
    desc: '+22 Defense permanen & memantulkan 50% damage yang diterima ke musuh terdekat sebagai True Damage.',
    category: 'defense',
    rarity: 'rare',
    icon: 'ShieldAlert'
  },
  {
    id: 'attr_phantom_cloak',
    title: 'Shadow Phantom Cloak',
    desc: '+20% Evasion (peluang menghindar serangan) & +30 Movement Speed permanen.',
    category: 'defense',
    rarity: 'rare',
    icon: 'Ghost'
  },
  {
    id: 'attr_jade_vitality',
    title: 'Emerald Jade Heart',
    desc: '+380 Max HP & regenerasi pasif 3.5% Max HP setiap detik secara terus-menerus.',
    category: 'defense',
    rarity: 'epic',
    icon: 'Heart'
  },
  {
    id: 'attr_divine_sanctuary',
    title: 'Divine Sanctuary Halo',
    desc: 'Setiap 14 detik memancarkan aura suci yang memulihkan 18% Max HP & mendorong mundur seluruh musuh.',
    category: 'defense',
    rarity: 'legendary',
    icon: 'Sparkles'
  },
  {
    id: 'attr_guardian_spirit',
    title: 'Sacred Guardian Spirit',
    desc: 'Mengurangi seluruh damage yang diterima pahlawan sebesar 20% secara permanen.',
    category: 'defense',
    rarity: 'epic',
    icon: 'ShieldCheck'
  },
  {
    id: 'attr_arcane_battery',
    title: 'Arcane Mana Dynamo',
    desc: '+22% Cooldown Reduction (CDR) & setiap mengaktifkan Skill memulihkan 6% Max HP.',
    category: 'utility',
    rarity: 'rare',
    icon: 'BatteryCharging'
  },
  {
    id: 'attr_golden_crown',
    title: 'Scholar Wisdom Crown',
    desc: '+45% bonus EXP dari setiap EXP Gem yang diambil & +100 Jangkauan Magnet.',
    category: 'utility',
    rarity: 'rare',
    icon: 'Crown'
  },
  {
    id: 'attr_soul_harvester',
    title: 'Grim Soul Harvester',
    desc: 'Setiap 10 musuh yang dikalahkan memberikan +5 Base Attack Damage & +20 Max HP permanen (tanpa batas!).',
    category: 'unique',
    rarity: 'epic',
    icon: 'Skull'
  },
  {
    id: 'attr_nova_pulse',
    title: 'Astral Shockwave Core',
    desc: 'Setiap kali melancarkan Skill, memicu gelombang Astral (radius 180px) berdamage 160% ATK.',
    category: 'unique',
    rarity: 'epic',
    icon: 'Sparkles'
  },
  {
    id: 'attr_clone_overlord',
    title: 'Illusion Sovereign Sigil',
    desc: '+30% ATK, +25% ASPD, +15% Lifesteal untuk pahlawan, serta +35% Damage ekstra untuk seluruh Clone!',
    category: 'unique',
    rarity: 'epic',
    icon: 'Crown'
  },
  // --- UNIQUE & TACTICAL RELIC EXPANSION ---
  {
    id: 'attr_blood_pact',
    title: 'Crimson Blood Pact',
    desc: 'Setiap serangan dasar ke-5 mengorbankan 3% HP saat ini untuk melepaskan Blood Rend: 220% ATK + 6% Max HP target (3% vs Boss) sebagai True Damage & heal 6% Max HP!',
    category: 'unique',
    rarity: 'epic',
    icon: 'Flame'
  },
  {
    id: 'attr_mirror_ward',
    title: 'Astral Mirror Barrier',
    desc: 'Setiap 10 detik mendapat perisai cermin yang memblokir 100% damage serangan berikutnya dan memantulkan 300% ATK ke penyerang.',
    category: 'defense',
    rarity: 'legendary',
    icon: 'Shield'
  },
  {
    id: 'attr_chrono_anchor',
    title: 'Temporal Chrono Engine',
    desc: 'Setiap 8 detik memicu Time Pulse: memotong sisa cooldown semua Skill sebesar 1.5 detik & memberi +35% Speed + 25% ASPD selama 3 detik.',
    category: 'utility',
    rarity: 'epic',
    icon: 'Hourglass'
  },
  {
    id: 'attr_abyssal_mark',
    title: 'Abyssal Shatter Mark',
    desc: 'Serangan dasar & Clone menumpuk Abyssal Mark (maks 5). Pada stack ke-5, tanda meledak 300% ATK AoE True Damage & meremukkan 20% Defense target.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Crosshair'
  },
  {
    id: 'attr_celestial_orbit',
    title: 'Celestial Star Orbs',
    desc: 'Memanggil 3 Bola Bintang berputar di sekitar pahlawan (dan 2 di tiap Clone) yang menabrak musuh sebesar 110% ATK menembus armor!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Sparkles'
  },
  {
    id: 'attr_berserk_totem',
    title: 'Warlord Frenzy Banner',
    desc: 'Setiap musuh yang mati di sekitar menambah 1 stack Bloodlust (maks 20 stack selama 8 detik): +3% ASPD & +4 ATK per stack.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Swords',
    stackable: true
  },
  {
    id: 'attr_frostbite_aura',
    title: 'Permafrost Blizzard Heart',
    desc: 'Aura es permanen radius 190px memperlambat musuh 30% (15% Boss), memicu Cryo Burst 120% ATK tiap 2.5 detik, dan membuat musuh menerima +18% damage!',
    category: 'defense',
    rarity: 'epic',
    icon: 'Snowflake'
  },
  {
    id: 'attr_ricochet_glaive',
    title: 'Storm Ricochet Glaive',
    desc: 'Setiap serangan dasar ke-3 (termasuk Clone & Ranged) melempar Bumerang Energi yang memantul ke 4 musuh beruntun berdamage 135% ATK.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Zap'
  },
  {
    id: 'attr_titan_heart',
    title: 'Colossus Titan Heart',
    desc: '+500 Max HP & +30 Defense permanen, serta mengonversi 10% Max HP pahlawan menjadi bonus Attack Damage tambahan!',
    category: 'defense',
    rarity: 'legendary',
    icon: 'Heart',
    stackable: true
  },
  {
    id: 'attr_doom_scythe',
    title: 'Reaper Harvest Moon',
    desc: '+25% Crit Chance & +50% Crit Damage. Setiap Critical terhadap Boss memicu True Strike sebesar 2.5% Max HP Boss (maks 450/hit, CD 1.5s).',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Moon'
  },
  // --- ANTI-TANK TACTICAL RELICS ---
  {
    id: 'attr_shield_breaker',
    title: 'Aegis Shatter Fang',
    desc: 'Serangan Hero & Clone menghasilkan +150% Damage terhadap Barrier/Shield musuh (2.5x). Saat Barrier pecah, meledak 12% Max HP musuh (maks 1.200) sebagai True Damage & Stun 1.2 detik!',
    category: 'offense',
    rarity: 'epic',
    icon: 'ShieldAlert'
  },
  {
    id: 'attr_armor_sunder',
    title: 'Titan Sundering Cleaver',
    desc: 'Serangan Hero & Clone merobek Defense musuh -8% per stack (maks 6 stack = -48% DEF selama 5 detik), menembus 50% Iron Plating Tank Boss, serta memberi +30% Damage ke musuh tipe Tank!',
    category: 'offense',
    rarity: 'epic',
    icon: 'Sword'
  },
  {
    id: 'attr_anti_regen',
    title: 'Cursed Blight Brand',
    desc: 'Serangan Hero & Clone mengutuk musuh 5 detik: memangkas 65% semua Healing & Regenerasi Tank, membakar 2.5% Max HP/dtk (maks 350/dtk), dan setiap serangan dasar ke-4 meledak +4% Max HP (maks 500) True Damage!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Skull'
  },
  // --- HERO-SYNERGY ATTRIBUTE RELICS (TRAVELER, VALKYRIE, DIMENSION JUDGE, RIFT WALKER) ---
  {
    id: 'attr_chrono_pendulum',
    title: 'Chronos Stance Pendulum',
    desc: '+18% CDR & +22% Attack Speed. Bonus ATK semua Stance Traveler +20%. Saat berganti Stance atau tiap serangan ke-4 memicu Chrono Paradox Pulse (170% ATK True Damage AoE & -0.5s sisa cooldown Skill).',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Hourglass',
    recommendedHeroes: ['traveler']
  },
  {
    id: 'attr_temporal_compass',
    title: 'Aether Temporal Compass',
    desc: '+35 ATK & +12% Lifesteal. Setiap menggunakan Skill memicu Time Echo (+35% Attack Speed selama 3 detik) dan serangan di dalam Chrono Field atau Time Stop memberi +25% True Damage.',
    category: 'utility',
    rarity: 'epic',
    icon: 'Zap',
    recommendedHeroes: ['traveler']
  },
  {
    id: 'attr_permafrost_crown',
    title: 'Glacial Sovereign Crown',
    desc: '+24 Defense & +280 Max HP. Kapasitas Ice Shield menjadi 1000 HP (+150 Shield saat Deep Freeze & regenerasi +18/+30 Shield/detik). Serangan ke musuh Slow atau Stun menghasilkan +30% Cryo Damage!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Snowflake',
    recommendedHeroes: ['valkyrie']
  },
  {
    id: 'attr_cryo_bastion',
    title: 'Frostbite Lance Core',
    desc: '+30 ATK & +20% Attack Speed. Saat memicu Freeze/Deep Freeze atau menerima hit ketika Shield aktif (CD 1.0s), menembakkan 6 Tombak Es ke sekeliling berdamage 115% ATK & memperlambat musuh 2 detik.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Gem',
    recommendedHeroes: ['valkyrie']
  },
  {
    id: 'attr_reality_edict',
    title: 'Arbiter Reality Edict',
    desc: '+32 ATK & +18% CDR. Memperluas radius Zona Dimensi & Gravitasi +35%, durasi Zona +2 detik, serta Aura Gravitasi meledakkan pulsa 110% ATK True Damage setiap 0.8 detik!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Sparkles',
    recommendedHeroes: ['dimension_judge']
  },
  {
    id: 'attr_singularity_prism',
    title: 'Void Singularity Tether',
    desc: '+28 ATK, +20% Crit Damage & +25 Movement Speed. Musuh di dalam Zona Dimensi atau radius 220px menerima +22% Damage lebih besar, dan setiap 2 Skill memanggil Mini Spatial Collapse!',
    category: 'offense',
    rarity: 'epic',
    icon: 'Cpu',
    recommendedHeroes: ['dimension_judge']
  },
  {
    id: 'attr_quantum_echo',
    title: 'Quantum Rift Shadow Core',
    desc: '+18% Crit Chance, +40% Crit Damage & +10% Evasion. Syarat Quantum Blink berkurang menjadi 3 hit (hero lain: tiap 5 hit), dan setiap Blink/Teleport memicu Rift Shock Slash (165% ATK True Damage AoE) + memperpanjang Warp Buff.',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Zap',
    recommendedHeroes: ['rift_walker']
  },
  {
    id: 'attr_void_assassin_seal',
    title: 'Phantom Phase Seal',
    desc: '+25% Attack Speed, +35 Movement Speed & +15% Evasion. Selama 2.5 detik setelah Blink, Teleport, atau Dodge, memperoleh +20% Crit Chance, +35% Crit Damage & serangan memulihkan 3% Max HP.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Swords',
    recommendedHeroes: ['rift_walker']
  },
  // --- 20 NEW ATTRIBUTE RELICS ---
  {
    id: 'attr_solar_core',
    title: 'Solar Flare Core',
    desc: '+35 ATK & +15% Crit Chance. Batas Solar Heat naik ke 30 stack (hero lain: tiap 3 serangan meledak 35% ATK Solar Burn AoE) & semua ledakan Solar +40% Damage!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Sun',
    recommendedHeroes: ['solaris']
  },
  {
    id: 'attr_ember_greaves',
    title: 'Blazing Ember Greaves',
    desc: '+45 Movement Speed, +22% Attack Speed & +15% CDR. Meninggalkan jejak api 65% ATK saat bergerak & tiap Skill memulihkan 5% Max HP + cincin api 120% ATK!',
    category: 'utility',
    rarity: 'epic',
    icon: 'Flame',
    recommendedHeroes: ['solaris']
  },
  {
    id: 'attr_crimson_vortex',
    title: 'Crimson Vortex Fang',
    desc: '+28 ATK & +10% Lifesteal. Setiap 6 serangan dasar melepaskan tebasan pusaran darah 180% ATK AoE di sekitar target.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Swords'
  },
  {
    id: 'attr_obsidian_heart',
    title: 'Obsidian Bulwark Heart',
    desc: '+320 Max HP & +28 Defense permanen. Mengurangi seluruh damage yang diterima dari Boss sebesar 12%.',
    category: 'defense',
    rarity: 'epic',
    icon: 'Shield'
  },
  {
    id: 'attr_storm_quiver',
    title: 'Tempest Volt Quiver',
    desc: '+25% Attack Speed & +60 Attack Range. Setiap serangan dasar ikut menembakkan panah petir tambahan (55% ATK) ke musuh terdekat.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Zap'
  },
  {
    id: 'attr_astral_hourglass',
    title: 'Astral Echo Hourglass',
    desc: '+18% Cooldown Reduction (CDR) & +20 Movement Speed. Setiap musuh yang dikalahkan memangkas sisa cooldown semua Skill sebesar 0.25 detik.',
    category: 'utility',
    rarity: 'rare',
    icon: 'Hourglass'
  },
  {
    id: 'attr_reaper_grasp',
    title: 'Soul Reaper Grasp',
    desc: '+32 ATK & +35% Critical Damage. Setiap musuh yang mati meledakkan ledakan jiwa 110% ATK AoE ke musuh di sekitarnya.',
    category: 'offense',
    rarity: 'epic',
    icon: 'Skull'
  },
  {
    id: 'attr_radiant_aegis',
    title: 'Radiant Sun Aegis',
    desc: '+20 Defense & +200 Max HP. Setiap 12 detik memberi Radiant Shield 260 HP dan men-stun musuh sekitar selama 0.8 detik.',
    category: 'defense',
    rarity: 'rare',
    icon: 'ShieldCheck'
  },
  {
    id: 'attr_venom_fang',
    title: 'Viper Neurotoxin Blade',
    desc: '+22 ATK & +12% Attack Speed. Serangan menyuntikkan neurotoksin (+35 True Damage/detik selama 3 detik, dapat di-stack).',
    category: 'offense',
    rarity: 'common',
    icon: 'Sword',
    stackable: true
  },
  {
    id: 'attr_celestial_feather',
    title: 'Seraphim Wing Feather',
    desc: '+35 Movement Speed, +10% Evasion & +90 Jangkauan Magnet EXP secara permanen.',
    category: 'utility',
    rarity: 'common',
    icon: 'Feather',
    stackable: true
  },
  {
    id: 'attr_iron_will',
    title: 'Unbreakable Iron Will',
    desc: '+18 Defense & +160 Max HP permanen. Saat HP di bawah 50%, mendapat bonus +20 Defense tambahan.',
    category: 'defense',
    rarity: 'common',
    icon: 'Shield',
    stackable: true
  },
  {
    id: 'attr_void_lens',
    title: 'Abyssal Rift Lens',
    desc: '+14% Critical Chance & +40% Critical Damage. Setiap serangan Critical memulihkan 20 HP secara instan.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Crosshair'
  },
  {
    id: 'attr_thunder_crown',
    title: 'Stormcaller Crown',
    desc: '+40 ATK & +25% Critical Chance. Setiap 4 detik memanggil 3 petir langit menyambar musuh terdekat (220% ATK True Damage & stun 0.8 detik).',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Crown'
  },
  {
    id: 'attr_blood_chalice',
    title: 'Eternal Blood Chalice',
    desc: '+18% Lifesteal & +240 Max HP. Kelebihan heal (Overheal) otomatis diubah menjadi Shield pelindung hingga 350 HP!',
    category: 'defense',
    rarity: 'epic',
    icon: 'Heart'
  },
  {
    id: 'attr_arcane_catalyst',
    title: 'Arcane Catalyst Rune',
    desc: '+20% Cooldown Reduction & +38 ATK. Setiap kali melancarkan Skill, ATK meningkat +20% selama 3.5 detik!',
    category: 'offense',
    rarity: 'epic',
    icon: 'Sparkles'
  },
  {
    id: 'attr_frost_prism',
    title: 'Glacial Mirror Prism',
    desc: '+22 Defense & +12% Evasion. Musuh yang menyerang pahlawan terkena Frostbite (-30% Speed 2.5s) dan balasan 85% ATK Ice Counter!',
    category: 'defense',
    rarity: 'epic',
    icon: 'Snowflake'
  },
  {
    id: 'attr_gravity_anchor',
    title: 'Singularity Mass Anchor',
    desc: '+180 Max HP & +25 ATK. Setiap 5 detik menarik musuh dalam radius 240px ke pusat gravitasi dan memperlambat mereka 1.5 detik.',
    category: 'utility',
    rarity: 'rare',
    icon: 'CircleDot'
  },
  {
    id: 'attr_berserk_claw',
    title: 'Savage Frenzy Claw',
    desc: '+26 ATK & +18% Attack Speed. Membunuh Boss atau tiap 15 kill memberi Frenzy +10% ASPD selama 5 detik.',
    category: 'offense',
    rarity: 'rare',
    icon: 'Activity',
    stackable: true
  },
  {
    id: 'attr_mystic_orb',
    title: 'Infinite Mana Orb',
    desc: '+15% CDR, +25% EXP Gain & +150 Max HP. Setiap kali Level Up, memulihkan 100% HP dan mereset seluruh Cooldown Skill!',
    category: 'utility',
    rarity: 'epic',
    icon: 'BatteryCharging'
  },
  {
    id: 'attr_omega_annihilator',
    title: 'Omega Star Annihilator',
    desc: '+50 ATK, +30% Critical Damage & +20% Attack Speed. Setiap serangan dasar ke-8 memicu Omega Starburst (280% AoE True Damage & stun 1.0 detik)!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Gem'
  },
  // --- HERO-SYNERGY ATTRIBUTE RELICS (FALLEN ANGEL & DEMON RAISED) ---
  {
    id: 'attr_eclipse_halo',
    title: 'Obsidian Seraph Halo',
    desc: '+34 ATK, +14% Evasion & +15% Lifesteal. Batas Fallen Feathers naik menjadi 20 stack (hero lain: +25% Crit Damage), dan setiap Skill memancarkan 6 Bulu Penghakiman (95% ATK True Damage)!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Crown',
    recommendedHeroes: ['fallen_angel']
  },
  {
    id: 'attr_abyssal_pinion',
    title: 'Ash-Stained Pinion',
    desc: '+24% Attack Speed, +35 Movement Speed & +15% Crit Chance. Saat HP < 60% atau saat berhasil Dodge, memanggil Pilar Petir Gerhana (145% ATK True Damage AoE, CD 1.0s).',
    category: 'offense',
    rarity: 'epic',
    icon: 'Sparkles',
    recommendedHeroes: ['fallen_angel']
  },
  {
    id: 'attr_hellfire_crown',
    title: 'Crown of the Risen Fiend',
    desc: '+38 ATK, +280 Max HP & +12% Lifesteal. Batas Hellfire Essence naik menjadi 40 stack (hero lain: setiap 4 serangan memicu Hellfire Eruption 125% ATK True Damage) & damage Api Neraka +35%!',
    category: 'unique',
    rarity: 'legendary',
    icon: 'Flame',
    recommendedHeroes: ['demon_raised']
  },
  {
    id: 'attr_infernal_shackles',
    title: 'Abyssal Pact Chains',
    desc: '+24 Defense, +20% Attack Speed & +20% Crit Damage. Mengurangi damage diterima saat HP < 65% sebesar 18% & setiap melancarkan Skill memicu ledakan Rantai Darah (145% ATK + stun 0.8s)!',
    category: 'defense',
    rarity: 'epic',
    icon: 'Shield',
    recommendedHeroes: ['demon_raised']
  }
];

export const SKILL_UPGRADE_TRAITS: Record<string, { id: string; title: string; desc: string; icon: string }[]> = {
  m_s1: [
    { id: 'm_s1_u1', title: 'Twin Shadow Clones', desc: 'Memanggil 2 clone sekaligus dan meningkatkan pewarisan Stats clone dari 50% menjadi 75% (Maksimal), tetap mewarisi 100% Relic Attribute master.', icon: 'Copy' },
    { id: 'm_s1_u2', title: 'Vampiric Clone Aura', desc: 'Lifesteal clone meningkat menjadi 40% heal ke master.', icon: 'Heart' }
  ],
  m_s2: [
    { id: 'm_s2_u1', title: 'Colossus RuYi Expansion', desc: 'Jangkauan dan lebar hantaman tongkat sakti +45%, damage meningkat menjadi 220% ATK.', icon: 'Zap' },
    { id: 'm_s2_u2', title: 'Synchronized Shockwave', desc: 'Hantaman tongkat master dan clone menciptakan gempa sekunder yang meremukkan armor musuh -20%.', icon: 'ShieldAlert' }
  ],
  m_s3: [
    { id: 'm_s3_u1', title: 'Celestial Typhoon', desc: 'Durasi kebal Awan Kinton naik menjadi 1.2 detik dan menarik musuh ke pusaran.', icon: 'Wind' },
    { id: 'm_s3_u2', title: 'Golden Body Vajra', desc: 'Memperoleh perisai emas 220 HP saat melesat.', icon: 'Shield' }
  ],
  m_s4: [
    { id: 'm_s4_u1', title: 'Cosmic Pillar Cataclysm', desc: 'Gempa pilar langit mencakup seluruh arena & sambaran petir emas bertambah menjadi 8 sambaran.', icon: 'Flame' },
    { id: 'm_s4_u2', title: 'Immortality of Huaguo', desc: 'Mereset durasi hidup semua clone aktif ke maksimal dan memulihkan 25% HP master seketika.', icon: 'Heart' }
  ],
  d_s1: [
    { id: 'd_s1_u1', title: 'Hyperion Beam Overdrive', desc: 'Lebar laser 2x lipat, eksekusi non-Boss HP < 35%, dan memicu 3 ledakan Void 100% ATK di sepanjang jalur!', icon: 'Eye' },
    { id: 'd_s1_u2', title: 'Rapid Void Discharge', desc: 'Cooldown laser berkurang menjadi 2.2 detik dan tembakan laser dijamin 100% Critical Strike!', icon: 'Zap' }
  ],
  d_s2: [
    { id: 'd_s2_u1', title: 'Eternal Abyssal Veil', desc: 'Durasi Shadow Veil naik menjadi 3.5 detik & langsung memberi Void Shield 280 HP!', icon: 'ShieldCheck' },
    { id: 'd_s2_u2', title: 'Phantom Barrage Waltz', desc: 'Saat Shadow Veil aktif, setiap 0.6 detik otomatis menembakkan 6 Void Darts (45% ATK, bisa Crit) ke musuh sekitar!', icon: 'Activity' }
  ],
  d_s3: [
    { id: 'd_s3_u1', title: 'Abyssal Rupture Chains', desc: 'Cataclysm memberi +120% True Damage ekstra ke Boss dan meremukkan -30% Defense semua musuh!', icon: 'Skull' },
    { id: 'd_s3_u2', title: 'Soul Harvest Overdrive', desc: 'Setiap musuh yang mati akibat Cataclysm memotong cooldown semua skill 0.6 detik (maks 3.0 detik) & memberi +1 FCD (maks +3 FCD)!', icon: 'Hourglass' }
  ],
  t_s1_revamp: [
    { id: 't_s1_u1', title: 'Grand Singularity Vortex', desc: 'Radius gelombang membesar menjadi 250px, menarik musuh 2x lebih kuat, dan meledakkan pulsa kedua 140% True Damage (bisa Crit)!', icon: 'Sparkles' },
    { id: 't_s1_u2', title: 'Temporal Armor Fracture', desc: 'Meremukkan Defense musuh sebesar -35% dan men-stun semua musuh terkena selama 1.2 detik!', icon: 'Crosshair' }
  ],
  t_s2: [
    { id: 't_s2_u1', title: 'Echoing Mirage Strikes', desc: 'Menambah jumlah serangan semua Stance (+2 hits: Sword 5 tebasan, Bow 7 panah, Staff 5 pilar)!', icon: 'Sword' },
    { id: 't_s2_u2', title: 'Vorpal Chrono Execution', desc: 'Damage meningkat 1.6x pada musuh ber-HP < 55% dan mengeksekusi instan non-Boss ber-HP < 20%!', icon: 'Zap' }
  ],
  t_s3: [
    { id: 't_s3_u1', title: 'Eternal Chrono Sphere', desc: 'Radius Time Stasis meluas ke 420px selama 3.2 detik & pemulihan HP bertambah menjadi 40% Max HP!', icon: 'Hourglass' },
    { id: 't_s3_u2', title: 'Temporal Accelerator', desc: 'Mengurangi sisa cooldown semua skill aktif lain sebesar 3.5 detik & memberi +30% Movement Speed selama 3 detik.', icon: 'FastForward' }
  ],
  v_s1: [
    { id: 'v_s1_u1', title: 'Absolute Glacial Path', desc: 'Jejak es memancarkan serpihan kristal tajam (damage menjadi 320% ATK).', icon: 'Zap' },
    { id: 'v_s1_u2', title: 'Deep Frost Piercing', desc: 'Membekukan seluruh musuh yang terkena terjangan es selama 2.2 detik.', icon: 'Snowflake' }
  ],
  v_s2: [
    { id: 'v_s2_u1', title: 'Icicle Storm Overdrive', desc: 'Jumlah tombak kristal es bertambah dari 9 menjadi 14 tombak tajam berkecepatan tinggi.', icon: 'Compass' },
    { id: 'v_s2_u2', title: 'Glacier Shatter Burst', desc: 'Tombak es memperkuat daya hancur menjadi 180% ATK per tombak.', icon: 'Sparkles' }
  ],
  v_s3: [
    { id: 'v_s3_u1', title: 'Cryo Thorns Barrier', desc: 'Perisai es memberi +90 + 100% ATK True Damage AoE & membalas 65% ATK True Damage saat diserang ketika Shield aktif.', icon: 'Shield' },
    { id: 'v_s3_u2', title: 'Glacial Rejuvenation', desc: 'Memulihkan 35% Max HP saat skill aktif dan memberi +45 Defense permanen.', icon: 'Heart' }
  ],
  v_s4: [
    { id: 'v_s4_u1', title: 'Absolute Zero Cataclysm', desc: 'Komet es meningkat dayanya menjadi 460% ATK per komet.', icon: 'Snowflake' },
    { id: 'v_s4_u2', title: 'Perpetual Blizzard Realm', desc: 'Zona badai salju permafrost meluas (340px) selama 7.5 detik dengan pulsa 95% ATK!', icon: 'Wind' }
  ],
  t_s4: [
    { id: 't_s4_u1', title: 'Infinite Chronos Domain', desc: 'Radius aura & zona membesar +50% (345px), durasi menjadi 10 detik, dan menembakkan 2 Bilah Waktu tiap 0.55 detik!', icon: 'Maximize2' },
    { id: 't_s4_u2', title: 'Hyper-Temporal Overdrive', desc: 'Bonus Overdrive meningkat menjadi +55% ATK, +75% ASPD, dan +15% Evasion!', icon: 'Zap' }
  ],
  dj_s1: [
    { id: 'dj_s1_u1', title: 'Supermassive Collapse', desc: 'Radius sedotan singularitas bertambah +45%.', icon: 'CircleDot' },
    { id: 'dj_s1_u2', title: 'Event Horizon Cleave', desc: 'Ledakan singularitas memberikan tekanan ruang lebih kuat.', icon: 'Sparkles' }
  ],
  dj_s2: [
    { id: 'dj_s2_u1', title: 'Reflective Space Mirror', desc: 'Dinding memblokade musuh dan menahan serangan.', icon: 'Shield' },
    { id: 'dj_s2_u2', title: 'Dimensional Fortress', desc: 'Memulihkan 300 HP saat memanggil dinding & memperpanjang durasi menjadi 8 detik.', icon: 'ShieldCheck' }
  ],
  dj_s3: [
    { id: 'dj_s3_u1', title: 'Vacuum Implosion Shatter', desc: 'Vacuum implosion mengguncang musuh di titik asal teleportasi.', icon: 'Zap' },
    { id: 'dj_s3_u2', title: 'Spatial Shift Reset', desc: 'Teleportasi memulihkan 15% HP secara instan.', icon: 'Compass' }
  ],
  dj_s4: [
    { id: 'dj_s4_u1', title: 'Infinite Reality Domain', desc: 'Memperluas cakupan domain ruang.', icon: 'Sparkles' },
    { id: 'dj_s4_u2', title: 'Eternal Judgement', desc: 'Durasi domain isolasi meningkat menjadi 9 detik.', icon: 'Hourglass' }
  ],
  rw_s1: [
    { id: 'rw_s1_u1', title: 'Quantum Execution', desc: 'Blink Strike memberi +40% Damage pada target ber-HP < 50% dan mengeksekusi instan non-Boss ber-HP < 16%!', icon: 'Zap' },
    { id: 'rw_s1_u2', title: 'Instant Warp Reset', desc: 'Membunuh musuh dengan Blink Strike memotong -65% cooldown skill ini (atau -30% cooldown jika mengenai Boss)!', icon: 'FastForward' }
  ],
  rw_s2: [
    { id: 'rw_s2_u1', title: 'Dimensional Laser Crossfire', desc: 'Setiap jalur laser warp meledak susulan dengan 90% ATK True Damage (bisa Crit) & memangkas Defense musuh -15%!', icon: 'Compass' },
    { id: 'rw_s2_u2', title: 'Penta-Phase Ambush', desc: 'Jumlah tebasan teleportasi beruntun meningkat dari 3x menjadi 5x tebasan kilat!', icon: 'Maximize2' }
  ],
  rw_s3: [
    { id: 'rw_s3_u1', title: 'Twin Warp Phantoms', desc: 'Memanggil 2 Klon Bayangan Warp sekaligus dengan pewarisan stats 60%!', icon: 'Copy' },
    { id: 'rw_s3_u2', title: 'Decoy Supernova', desc: 'Klon Bayangan meledakkan Void Supernova (135% ATK True Damage, stun 0.9s & slow 45%) saat muncul dan saat berakhir!', icon: 'ShieldAlert' }
  ],
  rw_s4: [
    { id: 'rw_s4_u1', title: 'Endless Omnipresence', desc: 'Jumlah tebasan teleportasi badai meningkat dari 10 menjadi 15 tebasan kilat!', icon: 'Sparkles' },
    { id: 'rw_s4_u2', title: 'Void Shatter Annihilation', desc: 'Radius Void Shatter Nova meluas menjadi 290px, mengeksekusi non-Boss HP < 22%, & memberi +7% Max HP True Damage ke Boss!', icon: 'Flame' }
  ],
  sp_s1: [
    { id: 'sp_s1_u1', title: 'Grand Marionette Theater', desc: 'Batas maksimal boneka aktif meningkat menjadi 4 dan setiap aktivasi langsung memanggil 3 boneka!', icon: 'Copy' },
    { id: 'sp_s1_u2', title: 'Vampiric Thread Link', desc: 'Serangan boneka menyembuhkan Soul Puppeteer sebesar 12% damage yang dihasilkan.', icon: 'Heart' }
  ],
  sp_s2: [
    { id: 'sp_s2_u1', title: 'Phantom Vessel Overload', desc: 'Durasi Merasuki Boneka naik menjadi 4.2 detik, +45% Crit Chance, dan ledakan rasukan men-stun musuh 1.8 detik!', icon: 'Zap' },
    { id: 'sp_s2_u2', title: 'Immortal Soul Anchor', desc: 'Saat merasuki boneka, semua boneka & undead mendapat +40% ASPD dan cooldown skill lain berkurang 1.5 detik.', icon: 'Hourglass' }
  ],
  sp_s3: [
    { id: 'sp_s3_u1', title: 'Forbidden Bio-Mecha Mod', desc: 'Modify langsung menaikkan +2 Tingkat Modifikasi sekaligus serta memberi aura True Damage ke semua boneka & undead!', icon: 'Wrench' },
    { id: 'sp_s3_u2', title: 'Army of the Damned', desc: 'Membangkitkan 3 Bone Revenant sekaligus dan batas maksimal Undead naik menjadi 8.', icon: 'Skull' }
  ],
  sp_s4: [
    { id: 'sp_s4_u1', title: 'Eternal Abyssal Lich', desc: 'Durasi Transformasi Lich meningkat menjadi 11 detik dan bonus ATK naik menjadi +50%!', icon: 'Crown' },
    { id: 'sp_s4_u2', title: 'Soul Maker Genesis', desc: 'Selama Transformasi Lich aktif, setiap 2 detik otomatis menempa +5 Soul, 1 Boneka Modifikasi & 2 Bone Revenant!', icon: 'Sparkles' }
  ],
  sol_s1: [
    { id: 'sol_s1_u1', title: 'Piercing Sunbeam', desc: 'Jarak tusukan Tombak Matahari bertambah +80px dan men-stun semua musuh yang tertusuk selama 1.2 detik.', icon: 'Zap' },
    { id: 'sol_s1_u2', title: 'Blazing Penetration', desc: 'Tusukan Tombak Matahari selalu Critical Strike dan memangkas Defense musuh -25%.', icon: 'Crosshair' }
  ],
  sol_s2: [
    { id: 'sol_s2_u1', title: 'Superheated Corona', desc: 'Radius ledakan Corona Nova bertambah +50px dan damage meningkat menjadi 260% ATK.', icon: 'Flame' },
    { id: 'sol_s2_u2', title: 'Phoenix Shielding', desc: 'Solar Shield meningkat menjadi 380 HP serta memulihkan 12% Max HP secara instan.', icon: 'Shield' }
  ],
  sol_s3: [
    { id: 'sol_s3_u1', title: 'Celestial Bombardment', desc: 'Jumlah meteor matahari yang dijatuhkan bertambah dari 4 meteor menjadi 7 meteor!', icon: 'Flame' },
    { id: 'sol_s3_u2', title: 'Molten Crater', desc: 'Setiap ledakan meteor menambahkan kawah magma berdamage +80% ATK True Damage.', icon: 'Sparkles' }
  ],
  sol_s4: [
    { id: 'sol_s4_u1', title: 'Eternal Star Core', desc: 'Durasi Avatar Matahari meningkat menjadi 11 detik dan bonus ATK naik menjadi +70%!', icon: 'Sun' },
    { id: 'sol_s4_u2', title: 'Hypernova Collapse', desc: 'Selama Avatar Matahari aktif, setiap 2 detik otomatis menjatuhkan Meteor 170% ATK ke musuh terdekat.', icon: 'Zap' }
  ],
  fa_s1: [
    { id: 'fa_s1_u1', title: 'Eleven-Wing Volley', desc: 'Jumlah Bulu Gerhana bertambah dari 7 menjadi 11 bulu & menghasilkan +30% Damage ke target ber-HP < 50%!', icon: 'Sparkles' },
    { id: 'fa_s1_u2', title: 'Cursed Plumage', desc: 'Seluruh bulu barrage dijamin Critical Strike & memicu +45% ATK True Damage tambahan!', icon: 'Crosshair' }
  ],
  fa_s2: [
    { id: 'fa_s2_u1', title: 'Sanctuary Redemption', desc: 'Melesat memulihkan 18% Max HP secara instan & memperpanjang durasi kebal menjadi 1.1 detik.', icon: 'Heart' },
    { id: 'fa_s2_u2', title: 'Void Gravity Halo', desc: 'Menarik seluruh musuh dalam radius 260px ke pusat Halo Hitam & memperlambat mereka 2.5 detik.', icon: 'CircleDot' }
  ],
  fa_s3: [
    { id: 'fa_s3_u1', title: 'Abyssal Verdict', desc: 'Radius pilar penghakiman meluas menjadi 320px & langsung mengeksekusi non-Boss ber-HP < 20%!', icon: 'Maximize2' },
    { id: 'fa_s3_u2', title: 'Sinful Haste', desc: 'Langsung mereset cooldown Crimson Feather Barrage & memberi +35% Attack Speed selama 4 detik!', icon: 'Zap' }
  ],
  fa_s4: [
    { id: 'fa_s4_u1', title: 'Eternal Fallen Seraph', desc: 'Durasi Sayap Gerhana meningkat menjadi 11 detik dan bonus ATK naik menjadi +65%!', icon: 'Crown' },
    { id: 'fa_s4_u2', title: 'Apocalypse Plume Storm', desc: 'Setiap hujan bulu menembakkan 6 bulu penghancur & memulihkan 2% Max HP per siklus!', icon: 'Flame' }
  ],
  dr_s1: [
    { id: 'dr_s1_u1', title: 'Crimson Bloodletter', desc: 'Tebasan Cakar Neraka dijamin Critical Strike & memulihkan HP sebesar 25% dari damage yang dihasilkan!', icon: 'Heart' },
    { id: 'dr_s1_u2', title: 'Hellwave Slash', desc: 'Tebasan turut meluncurkan gelombang api neraka jarak jauh (360px) berdamage 175% ATK menembus musuh!', icon: 'Zap' }
  ],
  dr_s2: [
    { id: 'dr_s2_u1', title: 'Torment Shackles', desc: 'Rantai Neraka men-stun musuh selama 1.6 detik & merobek Defense mereka -30%!', icon: 'ShieldAlert' },
    { id: 'dr_s2_u2', title: 'Sovereign Blood Ward', desc: 'Blood Shield meningkat menjadi 440 HP & jangkauan rantai meluas menjadi 310px!', icon: 'Shield' }
  ],
  dr_s3: [
    { id: 'dr_s3_u1', title: 'Cataclysmic Hellscape', desc: 'Jumlah letusan pilar magma bertambah dari 5 menjadi 8 pilar & seluruhnya menghasilkan True Damage!', icon: 'Flame' },
    { id: 'dr_s3_u2', title: 'Ashen Tremor', desc: 'Setiap letusan pilar magma men-stun musuh 1.0 detik & memperlambat gerakan mereka!', icon: 'Sparkles' }
  ],
  dr_s4: [
    { id: 'dr_s4_u1', title: 'Immortal Demon King', desc: 'Durasi Kebangkitan Raja Iblis meningkat menjadi 12 detik & bonus ATK naik menjadi +75%!', icon: 'Crown' },
    { id: 'dr_s4_u2', title: 'Doomsday Hellstorm', desc: 'Selama Kebangkitan aktif, setiap 1.8 detik otomatis memanggil Meteor Neraka 185% ATK + stun 0.9s!', icon: 'Skull' }
  ]
};
