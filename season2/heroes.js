/* ==========================================================================
   REAL Shahnameh — Heroes / Collection page
   heroes.js — premium collectible codex, certificate modal, particles
   ========================================================================== */
(() => {
  "use strict";
  const RT = '<img src="/assets/images/tokens/realtoken.png" alt="REAL" class="real-tok-img" onerror="this.outerHTML=\'◆\'">';

  const t    = (k, v) => (window.RealI18N && window.RealI18N.t(k, v)) || k;
  const fmtN = (n) => (window.RealI18N && window.RealI18N.compactNumber) ? window.RealI18N.compactNumber(n) : String(Number(n) || 0);
  const locF = (obj, field) => (window.RealI18N && window.RealI18N.locField)
    ? window.RealI18N.locField(obj, field) : (obj && obj[field] != null ? obj[field] : "");

  /* =========================================================
     HERO ECONOMY — prices, Zar/hr, chapter unlock map
     ========================================================= */
  const RARITY_COST = { common: 500, rare: 2000, epic: 5000, legend: 10000, mythic: 25000 };
  const RARITY_ZAR  = { common: 2,   rare: 8,    epic: 20,   legend: 50,    mythic: 120 };

  /* Map chapter number → its localStorage slug (from chapter.js `real_chapter_done_${SLUG}`) */
  const CH_SLUG = {
    1: "keyumars", 2: "hushang", 3: "tahmuras", 4: "jamshid",
    5: "zahhak", 6: "fereydun", 7: "manuchehr", 8: "nozar",
    9: "zal", 10: "rudabeh", 12: "rostam",
    "haft-khan": "rudabeh", // Haft Khan unlocks after Rudabeh (Rostam born)
  };

  const isChapterDone = (n) => {
    try {
      return localStorage.getItem(`real_chapter_done_${CH_SLUG[n] || n}`) === "1";
    } catch { return false; }
  };

  /* Owned heroes map: { hero_id: { level, zar_per_hour } } */
  let ownedHeroes = {};
  const loadOwned = () => {
    if (window.RealSync && window.RealSync.getOwnedHeroes) {
      ownedHeroes = window.RealSync.getOwnedHeroes();
    }
  };

  const zarHrForHero = (rarity, level) =>
    (RARITY_ZAR[rarity] || 0) * (level || 1);

  const totalZarHr = () =>
    Object.values(ownedHeroes).reduce((sum, h) => sum + (h.zar_per_hour || 0), 0);

  const saveZarHr = () => {
    try { localStorage.setItem("real_total_zar_hr", String(totalZarHr())); } catch {}
  };

  const tgUserId = () => {
    try {
      const u = window.Telegram?.WebApp?.initDataUnsafe?.user;
      return u ? String(u.id) : null;
    } catch { return null; }
  };

  const apiPost = (url, body) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).then(r => r.ok ? r.json() : null).catch(() => null);

  /* =========================================================
     COLLECTION DATA — Chapter 1 (10 items)
     ========================================================= */
  const COLLECTION = [
    {
      id: "keyumars",
      name: "Keyumars", name_fa: "کیومرث",
      type: "character",
      rarity: "rare",
      chapter: 1,
      img: "/assets/images/heroes/keyumars-hero.png",
      emoji: "👑",
      role: "First King · Mountain Court",
      lore: "The first mortal king to wear a crown of leaves and rule from the sacred mountains, teaching humanity to cook food, craft garments, and live in order rather than savagery.",
      biography: "Born from the sacred mountains at the dawn of time, Keyumars was the first being to claim kingship over the mortal world. He built his court on the slopes of Damavand and taught the first arts of civilization — clothing, cooking, ceremony, and law. His reign established the divine template for all future Persian kings, and his Farr (divine glory) shone as the first light in the age of humanity.",
      faction: "First Dynasty · Mountain Court · Pishdad Line",
      mythologyRole: "Proto-king who bridged divine and mortal worlds; first bearer of Farr",
      powers: ["+5% Tap Power", "+8% Story XP", "Passive: Farr Aura — quiz error penalty –8%"],
      storyAppearances: ["Chapter 1: The First King — The Mountain Court", "Chapter 1 Quiz: The Age of Keyumars"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-001",
      season: 2, order: 1, cost: 2000, prereq: null,
      unlockCondition: "Complete Chapter 1 · The First King",
      role_fa: "اولین شاه · دربار کوهستان",
      lore_fa: "اولین پادشاه میرا که تاج برگ بر سر نهاد و از کوه‌های مقدس فرمان راند؛ به بشریت آشپزی، بافتن جامه و زندگی در نظم به جای توحش آموخت.",
      biography_fa: "کیومرث از دل کوه‌های مقدس در آغاز زمان زاده شد و اولین کسی بود که بر جهان فانی ادعای شاهی کرد. دربار خود را بر دامنه‌های دماوند بنا نهاد و اولین هنرهای تمدن را آموخت — پوشاک، آشپزی، آیین و قانون. فرمانروایی او الگوی الهی برای همه‌ی پادشاهان آینده‌ی پارس بود، و فرّ او اولین نور در عصر بشریت درخشید.",
      faction_fa: "دودمان اول · دربار کوهستان · خط پیشدادیان",
      mythologyRole_fa: "پادشاه نخستین که جهان الهی و فانی را به هم پیوست؛ اولین حامل فرّ",
      unlockCondition_fa: "فصل ۱ را کامل کنید · اولین شاه",
      powers_fa: ["+۵٪ قدرت ضربه", "+۸٪ تجربه داستان", "غیرفعال: هاله‌ی فرّ — جریمه‌ی خطا در آزمون −۸٪"],
      storyAppearances_fa: ["فصل ۱: اولین شاه — دربار کوهستان", "آزمون فصل ۱: عصر کیومرث"],
      role_tg: "Шоҳи Аввал · Дарбори Кӯҳ",
      lore_tg: "Аввалин шоҳи мирое ки тоҷи барг бар сар ниҳод ва аз кӯҳҳои муқаддас ҳукмронӣ кард; ба башарият пухтупаз, дӯхтани ҷома ва зиндагии мунтазамро омӯхт.",
      biography_tg: "Каюмарс аз кӯҳҳои муқаддас дар аввали замон таваллуд шуд ва аввалин касе буд ки бар ҷаҳони фонӣ даъвои шоҳӣ кард. Дарбори худро дар доманаи Дамованд бино кард ва аввалин санъатҳои тамаддунро омӯхт — либос, пухтупаз, маросим ва қонун. Ҳукмронии ӯ намунаи илоҳӣ барои ҳамаи шоҳони оянда буд, ва Фарри ӯ аввалин нур дар асри башарият буд.",
      faction_tg: "Сулолаи Аввал · Дарбори Кӯҳ · Насли Пешдодиён",
      mythologyRole_tg: "Шоҳи ибтидоӣ ки ҷаҳони илоҳӣ ва фониро пайваст; аввалин соҳиби Фарр",
      unlockCondition_tg: "Боби 1-ро иҷро кунед · Шоҳи Аввал",
      powers_tg: ["+5% Қудрати зарба", "+8% Таҷрибаи ҳикоя", "Ғайрифаъол: Ҳалааи Фарр — ҷарима барои хато дар имтиҳон −8%"],
      storyAppearances_tg: ["Боби 1: Шоҳи Аввал — Дарбори Кӯҳ", "Имтиҳони Боби 1: Асри Каюмарс"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "first-calendar",
      name: "The First Calendar", name_fa: "اولین تقویم",
      type: "codex",
      rarity: "rare",
      chapter: 1,
      img: "/season2/uploads/heroes/first_calender.png",
      emoji: "📅",
      role: "Civilizing Achievement · Order of Time",
      lore: "Keyumars divided the year into seasons and taught humanity to measure time. From this ordering of days came agriculture, festivals, and the first great rhythm of civilization.",
      biography: "The establishment of the calendar was among Keyumars's most profound gifts to humanity — more lasting than any palace or garment. By dividing the year into seasons and the seasons into days, he gave humanity the ability to plan, to remember, and to anticipate. The Persian calendar descends in unbroken lineage from this first ordering of time. From it came Nowruz, Mehregan, Sade, Yalda — the entire architecture of Persian festival life. Time, once measured, became human.",
      faction: "Pishdad Achievement · Sacred Discoveries · Order of Civilization",
      mythologyRole: "First measurement of time; foundation of the agricultural cycle; origin of Persian festivals; basis of all planning",
      powers: ["+6% Story XP", "+8 Zar/hr", "Passive: Timekeeper — daily quest XP bonus +5%"],
      storyAppearances: ["Chapter 1 Codex: The First Calendar", "Chapter 1: Keyumars Orders the Days"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-016",
      season: 2, order: 2, cost: 1800, prereq: { hero_id: "keyumars", level: 1 },
      unlockCondition: "Complete Chapter 1 · Own Keyumars",
      role_fa: "دستاورد تمدنی · نظم زمان",
      lore_fa: "کیومرث سال را به فصل‌ها تقسیم کرد و به بشریت آموخت که زمان را اندازه بگیرد. از این نظم‌بخشی به روزها، کشاورزی، جشن‌ها و نخستین ریتم بزرگ تمدن پدیدار شد.",
      biography_fa: "برپایی تقویم از ژرف‌ترین هدیه‌های کیومرث به بشریت بود — پایدارتر از هر کاخ یا جامه‌ای. با تقسیم سال به فصل‌ها و فصل‌ها به روزها، توانایی برنامه‌ریزی، به یادآوری و پیش‌بینی را به انسان‌ها داد. تقویم پارسی در خط بی‌گسستی از این اولین نظم‌دهی به زمان فرود می‌آید. از آن نوروز، مهرگان، سده و یلدا برخاستند — تمام معماری زندگی جشنواره‌ای پارسی.",
      faction_fa: "دستاورد پیشدادیان · کشفیات مقدس · نظم تمدن",
      mythologyRole_fa: "اولین اندازه‌گیری زمان؛ بنیاد چرخه‌ی کشاورزی؛ سرچشمه‌ی جشن‌های پارسی؛ پایه‌ی همه‌ی برنامه‌ریزی‌ها",
      unlockCondition_fa: "فصل ۱ را کامل کنید · کیومرث داشته باشید",
      powers_fa: ["+۶٪ تجربه داستان", "+۸ Zar/ساعت", "غیرفعال: نگهبان زمان — پاداش XP مأموریت روزانه +۵٪"],
      storyAppearances_fa: ["فصل ۱ کدکس: اولین تقویم", "فصل ۱: کیومرث روزها را مرتب می‌کند"],
      role_tg: "Дастоварди Тамаддун · Тартиби Замон",
      lore_tg: "Каюмарс солро ба фаслҳо тақсим кард ва ба башарият омӯхт ки вақтро андоза кунад. Аз ин тартибдиҳии рӯзҳо кишоварзӣ, ҷашнҳо ва аввалин ритми бузурги тамаддун пайдо шуд.",
      biography_tg: "Бунёди тақвим аз амиқ-тарин ҳадяҳои Каюмарс ба башарият буд — пойдортар аз ҳар қаср ё либосе. Бо тақсими сол ба фаслҳо ва фаслҳо ба рӯзҳо, қобилияти барномарезӣ, ба ёд овардан ва пешбинӣро ба одамон дод. Тақвими Порсӣ дар хати бегусастае аз ин аввалин тартибдиҳии вақт фаромеояд. Аз он Навруз, Меҳргон, Сада ва Ялдо баромаданд.",
      faction_tg: "Дастоварди Пешдодиён · Кашфиёти Муқаддас · Тартиби Тамаддун",
      mythologyRole_tg: "Аввалин андозагирии вақт; бунёди давраи кишоварзӣ; сарчашмаи ҷашнҳои Порсӣ; пояи ҳамаи барномарезиҳо",
      unlockCondition_tg: "Боби 1-ро иҷро кунед · Каюмарсро дошта бошед",
      powers_tg: ["+6% Таҷрибаи ҳикоя", "+8 Zar/соат", "Ғайрифаъол: Нигаҳбони Вақт — XP ҷоизавии вазифаи рӯзона +5%"],
      storyAppearances_tg: ["Кодекси Боби 1: Аввалин Тақвим", "Боби 1: Каюмарс Рӯзҳоро Тартиб Медиҳад"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "siamak",
      name: "Siamak", name_fa: "سیامک",
      type: "character",
      rarity: "common",
      chapter: 1,
      img: "/assets/images/heroes/siamak-hero.png",
      emoji: "🗡",
      role: "Prince of the Mountain · Fallen Hero",
      lore: "Son of Keyumars, first prince of the age. Siamak fell in battle against the servants of Ahriman, becoming a martyr whose death forged humanity's first resolve against darkness.",
      biography: "Son and chosen heir of Keyumars. Siamak's death at the hands of Ahriman's Black Div was the first great tragedy of the world — the moment humanity understood mortality and the true cost of light opposing darkness. His sacrifice galvanized Hushang to avenge him, and through that vengeance, civilization's flame was kept alive.",
      faction: "First Dynasty · Mountain Court · Pishdad Line",
      mythologyRole: "First human martyr; symbol of nobility sacrificed for the survival of civilization",
      powers: ["+3% Quiz XP", "+2 REAL/hr", "Passive: Martyr's Memory — story scene bonus XP"],
      storyAppearances: ["Chapter 1: The First King — The Fall of Siamak", "Chapter 1: Ahriman's Plot"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-002",
      season: 2, order: 9, cost: 500, prereq: { hero_id: "keyumars", level: 1 },
      unlockCondition: "Complete Chapter 1 · The First King",
      role_fa: "شاهزاده‌ی کوهستان · قهرمان شهید",
      lore_fa: "پسر کیومرث، اولین شاهزاده‌ی این دوران. سیامک در نبرد با خادمان اهریمن کشته شد و شهیدی شد که مرگ او اولین اراده‌ی بشریت را در برابر تاریکی پدید آورد.",
      biography_fa: "پسر و وارث برگزیده‌ی کیومرث. مرگ سیامک به دست دیو سیاه اهریمن، اولین تراژدی بزرگ جهان بود — لحظه‌ای که بشریت فانی بودن را درک کرد و بهای واقعی مقابله‌ی روشنایی با تاریکی را دانست. قربانی او هوشنگ را برانگیخت تا از او انتقام بگیرد و از طریق این انتقام، شعله‌ی تمدن زنده ماند.",
      faction_fa: "دودمان اول · دربار کوهستان · خط پیشدادیان",
      mythologyRole_fa: "اولین شهید بشری؛ نماد نجابتی که برای بقای تمدن قربانی شد",
      unlockCondition_fa: "فصل ۱ را کامل کنید · اولین شاه",
      powers_fa: ["+۳٪ تجربه آزمون", "+۲ REAL/ساعت", "غیرفعال: خاطره‌ی شهید — پاداش XP صحنه‌ی داستانی"],
      storyAppearances_fa: ["فصل ۱: اولین شاه — سقوط سیامک", "فصل ۱: توطئه‌ی اهریمن"],
      role_tg: "Шоҳзодаи Кӯҳ · Қаҳрамони Шаҳид",
      lore_tg: "Писари Каюмарс, аввалин шоҳзодаи ин давр. Сиёмак дар набард бо хидматгузорони Аҳриман кушта шуд ва шаҳид шуд, ки марги ӯ аввалин азми башариятро дар муқобили торикӣ шакл дод.",
      biography_tg: "Писар ва вориси баргузидаи Каюмарс. Марги Сиёмак ба дасти Диви Сиёҳи Аҳриман аввалин фоҷиаи бузурги ҷаҳон буд — лаҳзае ки башарият фановариро дарк кард ва нархи воқеии муқобилаи рӯшноӣ бо торикиро фаҳмид. Фидокории ӯ Ҳушангро барангехт ки интиқом гирад ва аз тариқи ин интиқом шӯълаи тамаддун зинда монд.",
      faction_tg: "Сулолаи Аввал · Дарбори Кӯҳ · Насли Пешдодиён",
      mythologyRole_tg: "Аввалин шаҳиди инсонӣ; рамзи нажодате ки барои бақои тамаддун қурбон шуд",
      unlockCondition_tg: "Боби 1-ро иҷро кунед · Шоҳи Аввал",
      powers_tg: ["+3% Таҷрибаи имтиҳон", "+2 REAL/соат", "Ғайрифаъол: Хотираи Шаҳид — XP ҷоизавии саҳнаи ҳикоя"],
      storyAppearances_tg: ["Боби 1: Шоҳи Аввал — Суқути Сиёмак", "Боби 1: Нақшаи Аҳриман"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "hushang",
      name: "Hushang", name_fa: "هوشنگ",
      type: "character",
      rarity: "rare",
      chapter: 1,
      img: "/assets/images/heroes/hushang-hero.png",
      emoji: "🔥",
      role: "The Fire-Maker · Grandson of Keyumars",
      lore: "Hushang avenged Siamak and drove back the darkness. He discovered fire when striking flint against stone, lit the first hearth, and gave humanity warmth, metalwork, and feasts.",
      biography: "Grandson of Keyumars and avenger of Siamak, Hushang became the second great king of the world. Where Keyumars established order, Hushang gave humanity the tools of material progress. He discovered fire when a black serpent he pursued fled across rocks — the flint striking sparks. He declared fire sacred to Ahura Mazda, forged the first iron tools, hunted great beasts, and built the first irrigation canals.",
      faction: "First Dynasty · Pishdad Line · Civilizing Kings",
      mythologyRole: "Civilizer-king; discoverer of fire; founder of metalwork, hunting, and irrigation",
      powers: ["+6% Tap Power", "+4 REAL/hr", "Passive: Fire-Maker — critical tap chance +3%"],
      storyAppearances: ["Chapter 1: The First King — The Age of Hushang", "Chapter 1 Reward: The Discovery of Fire"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-003",
      season: 2, order: 13, cost: 3500, prereq: { hero_id: "siamak", level: 1 },
      unlockCondition: "Complete Chapter 1 · The First King",
      role_fa: "آتش‌افروز · نوه‌ی کیومرث",
      lore_fa: "هوشنگ از سیامک انتقام گرفت و تاریکی را پس زد. آتش را هنگام زدن سنگ چخماق به هم کشف کرد، اولین کانون گرما را افروخت و به بشریت گرما، آهنگری و جشن بخشید.",
      biography_fa: "نوه‌ی کیومرث و منتقم سیامک، هوشنگ دومین پادشاه بزرگ جهان شد. آنجا که کیومرث نظم برقرار کرد، هوشنگ ابزار پیشرفت مادی به بشریت داد. وقتی مار سیاهی را که تعقیب می‌کرد از روی سنگ‌ها گریخت — چخماق جرقه زد و آتش روشن شد. آتش را مقدس به اهورامزدا اعلام کرد، اولین ابزارهای آهنی را ساخت، جانوران بزرگ شکار کرد و اولین کانال‌های آبیاری را احداث کرد.",
      faction_fa: "دودمان اول · خط پیشدادیان · پادشاهان متمدن‌ساز",
      mythologyRole_fa: "پادشاه متمدن‌ساز؛ کاشف آتش؛ بنیانگذار آهنگری، شکار و آبیاری",
      unlockCondition_fa: "فصل ۱ را کامل کنید · اولین شاه",
      powers_fa: ["+۶٪ قدرت ضربه", "+۴ REAL/ساعت", "غیرفعال: آتش‌افروز — احتمال ضربه‌ی بحرانی +۳٪"],
      storyAppearances_fa: ["فصل ۱: اولین شاه — عصر هوشنگ", "پاداش فصل ۱: کشف آتش"],
      role_tg: "Оташафрӯз · Набераи Каюмарс",
      lore_tg: "Ҳушанг аз Сиёмак интиқом гирифт ва торикиро ба ақиб ронд. Оташро ҳангоми задани чақмоқ ба санг кашф кард, аввалин оташдонро афрӯхт ва ба башарият гармӣ, оҳангарӣ ва зиёфат бахшид.",
      biography_tg: "Набераи Каюмарс ва мунтақими Сиёмак, Ҳушанг дуввумин шоҳи бузурги ҷаҳон шуд. Дар ҷое ки Каюмарс тартиб барқарор кард, Ҳушанг абзорҳои пешрафти моддиро ба башарият дод. Вақте морсиёҳеро ки таъқиб мекард аз болои сангҳо гурехт — чақмоқ ба санг расид ва оташ афрӯхт. Оташро муқаддас ба Аҳурамазда эълон кард, аввалин абзорҳои оҳинро сохт, ҷонварони бузург шикор кард ва аввалин каналҳои обёриро бино кард.",
      faction_tg: "Сулолаи Аввал · Насли Пешдодиён · Шоҳони Тамаддунсоз",
      mythologyRole_tg: "Шоҳи тамаддунсоз; кашшофи оташ; асосгузори оҳангарӣ, шикор ва обёрӣ",
      unlockCondition_tg: "Боби 1-ро иҷро кунед · Шоҳи Аввал",
      powers_tg: ["+6% Қудрати зарба", "+4 REAL/соат", "Ғайрифаъол: Оташафрӯз — эҳтимоли зарбаи критикӣ +3%"],
      storyAppearances_tg: ["Боби 1: Шоҳи Аввал — Асри Ҳушанг", "Ҷоизаи Боби 1: Кашфи Оташ"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "ahriman",
      name: "Ahriman", name_fa: "اهریمن",
      type: "enemy",
      rarity: "epic",
      chapter: 1,
      img: "/assets/images/enemies/ahriman-boss.png",
      emoji: "🌑",
      role: "Lord of Darkness · Chapter 1 Boss",
      lore: "The eternal adversary. Ahriman sent his Black Div to destroy Siamak, hoping to extinguish the first flame of civilization before it could spread. His schemes are ancient, patient, and relentless.",
      biography: "The eternal dark principle in Zoroastrian cosmology, Ahriman is not merely an enemy king but the embodiment of destruction, chaos, and the Lie (Druj). He works through agents — divs, sorcerers, corrupt kings — rather than appearing directly. His patience is geological, his malice total. The encounter in Chapter 1 is only his first shadow falling across the world.",
      faction: "Forces of Darkness · Ahriman's Court · Realm of Druj",
      mythologyRole: "Cosmic antagonist; embodiment of the Lie; eternal opposition to Ahura Mazda's order",
      powers: ["+8% Combo Duration", "Risk: +15% Energy Cost", "Passive: Darkness Aura — rare crit ×2 but volatile"],
      storyAppearances: ["Chapter 1: Ahriman's Plot", "Chapter 1 Boss Encounter: Lord of Darkness"],
      side: "dark",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-004",
      season: 2, order: 12, cost: 8000, farr_cost: 1, prereq: { hero_id: "black-demon", level: 1 },
      unlockCondition: "Defeat Ahriman · Chapter 1 Boss",
      role_fa: "ارباب تاریکی · رئیس فصل ۱",
      lore_fa: "دشمن ابدی. اهریمن دیو سیاه خود را فرستاد تا سیامک را بکشد، به این امید که اولین شعله‌ی تمدن را قبل از گسترش خاموش کند. توطئه‌های او کهن، صبور و بی‌امان است.",
      biography_fa: "اصل تاریکی ابدی در کیهان‌شناسی زرتشتی، اهریمن نه صرفاً یک پادشاه دشمن، بلکه تجسم ویرانگری، هرج و مرج و دروغ (دروج) است. از طریق عوامل خود — دیوان، جادوگران، پادشاهان فاسد — کار می‌کند نه اینکه مستقیم ظاهر شود. صبر او زمین‌شناختی، بدخواهی‌اش کامل است. رویارویی در فصل ۱ تنها اولین سایه‌ای است که بر جهان می‌افتد.",
      faction_fa: "نیروهای تاریکی · دربار اهریمن · قلمرو دروج",
      mythologyRole_fa: "دشمن کیهانی؛ تجسم دروغ؛ مخالفت ابدی با نظم اهورامزدا",
      unlockCondition_fa: "اهریمن را شکست دهید · رئیس فصل ۱",
      powers_fa: ["+۸٪ مدت کمبو", "ریسک: +۱۵٪ هزینه‌ی انرژی", "غیرفعال: هاله‌ی تاریکی — کریت نادر ×۲ اما متغیر"],
      storyAppearances_fa: ["فصل ۱: توطئه‌ی اهریمن", "رویارویی با رئیس فصل ۱: ارباب تاریکی"],
      role_tg: "Арбоби Торикӣ · Рейси Боби 1",
      lore_tg: "Душмани абадӣ. Аҳриман Диви Сиёҳи худро фиристод то Сиёмакро бикушад, ба умеди хомӯш кардани аввалин шӯълаи тамаддун пеш аз густаш. Нақшаҳои ӯ қадимӣ, сабурона ва беамон аст.",
      biography_tg: "Принсипи торикии абадӣ дар космологияи зардуштӣ, Аҳриман на танҳо шоҳи душман, балки таҷассуми вайронкорӣ, ҳарҷ ва мерҷ ва Дурӯғ (Друҷ) аст. Тавассути агентҳо — девҳо, ҷодугарон, шоҳони фосид — кор мекунад на бевосита намоён мешавад. Сабурии ӯ заминшинохтӣ, бадхоҳии ӯ комил аст. Мулоқот дар Боби 1 танҳо аввалин сояи ӯ аст, ки бар ҷаҳон меафтад.",
      faction_tg: "Нирӯҳои Торикӣ · Дарбори Аҳриман · Қаламрави Друҷ",
      mythologyRole_tg: "Антагонисти космикӣ; таҷассуми Дурӯғ; мухолифати абадӣ ба тартиби Аҳурамазда",
      unlockCondition_tg: "Аҳриманро мағлуб кунед · Рейси Боби 1",
      powers_tg: ["+8% Давомнокии комбо", "Хатар: +15% Хароҷоти энергия", "Ғайрифаъол: Ҳалааи Торикӣ — критити нодир ×2 аммо тағйирёбанда"],
      storyAppearances_tg: ["Боби 1: Нақшаи Аҳриман", "Рӯёрӯии Рейс Боби 1: Арбоби Торикӣ"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "black-div",
      name: "Black Div", name_fa: "دیو سیاه",
      type: "enemy",
      rarity: "rare",
      chapter: 1,
      img: "/assets/images/enemies/black-div-enemy.png",
      emoji: "👁",
      role: "Dark Servant · Demon of Ahriman",
      lore: "A powerful div dispatched by Ahriman to slay Siamak. The Black Div embodied the forces of chaos — but its defeat by Hushang forged humanity's first true victory over darkness.",
      biography: "One of the most feared divs in Ahriman's service. The Black Div was sent to destroy Siamak, and succeeded — but in doing so awakened Hushang's righteous fury and forged the first human will to resist darkness. When Hushang pursued a black serpent across the stony ground, the sparks of his flint strike lit the world's first fire — light born from the blackest encounter.",
      faction: "Forces of Darkness · Ahriman's Servants · Div Legion",
      mythologyRole: "Archetype of the powerful adversary whose defeat catalyzes human strength",
      powers: ["+4% Critical Hit Chance", "Passive: Dark Knowledge — enemy codex entries unlocked"],
      storyAppearances: ["Chapter 1: The Fall of Siamak", "Chapter 1 Boss: Phase 1 — The Black Servant"],
      side: "dark",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-005",
      season: 2, order: 10, cost: 2500, prereq: { hero_id: "siamak", level: 1 },
      unlockCondition: "Complete Chapter 1 · The First King",
      role_fa: "خادم تاریک · دیو اهریمن",
      lore_fa: "دیو قدرتمندی که اهریمن برای کشتن سیامک فرستاد. دیو سیاه نیروهای هرج و مرج را تجسم می‌بخشید — اما شکستش توسط هوشنگ اولین پیروزی واقعی بشریت بر تاریکی را پدید آورد.",
      biography_fa: "یکی از ترسناک‌ترین دیوان در خدمت اهریمن. دیو سیاه برای نابودی سیامک فرستاده شد و موفق شد — اما در این کار خشم راستین هوشنگ را بیدار کرد و اولین اراده‌ی انسانی برای مقاومت در برابر تاریکی را شکل داد. وقتی هوشنگ مار سیاهی را روی زمین سنگی دنبال کرد، جرقه‌های چخماقش اولین آتش جهان را روشن کرد — نوری که از تاریک‌ترین رویارویی متولد شد.",
      faction_fa: "نیروهای تاریکی · خادمان اهریمن · لژیون دیوان",
      mythologyRole_fa: "کهن‌الگوی دشمن قدرتمندی که شکستش قدرت انسانی را می‌آفریند",
      unlockCondition_fa: "فصل ۱ را کامل کنید · اولین شاه",
      powers_fa: ["+۴٪ احتمال ضربه‌ی بحرانی", "غیرفعال: دانش تاریک — ورودی‌های کدکس دشمن باز می‌شود"],
      storyAppearances_fa: ["فصل ۱: سقوط سیامک", "رئیس فصل ۱: مرحله ۱ — خادم سیاه"],
      role_tg: "Хидматгузори Торик · Деви Аҳриман",
      lore_tg: "Деви пурқудрате ки Аҳриман барои куштани Сиёмак фиристод. Диви Сиёҳ нирӯҳои ҳарҷ ва мерҷро таҷассум мекард — аммо мағлубияташ аз ҷониби Ҳушанг аввалин пирӯзии воқеии башариятро бар торикӣ эҷод кард.",
      biography_tg: "Яке аз тарсноктарин девҳо дар хидмати Аҳриман. Диви Сиёҳ барои нобудкардани Сиёмак фиристода шуд ва муваффақ шуд — аммо бо ин кор ғазаби одилонаи Ҳушангро бедор кард ва аввалин иродаи инсониро барои муқовимат ба торикӣ шакл дод. Вақте Ҳушанг мореро ки мепиндошт бузург аст дар замини сангин таъқиб кард, ҷарақаҳои чақмоқаш аввалин оташи ҷаҳонро афрӯхт — нуре ки аз торик-тарин мулоқот таваллуд шуд.",
      faction_tg: "Нирӯҳои Торикӣ · Хидматгузорони Аҳриман · Легиони Девҳо",
      mythologyRole_tg: "Архетипи душмани пурқудрат ки мағлубияташ қудрати инсониро барангезонад",
      unlockCondition_tg: "Боби 1-ро иҷро кунед · Шоҳи Аввал",
      powers_tg: ["+4% Эҳтимоли зарбаи критикӣ", "Ғайрифаъол: Дониши Торик — вуруди кодекси душман боз мешавад"],
      storyAppearances_tg: ["Боби 1: Суқути Сиёмак", "Рейси Боби 1: Марҳалаи 1 — Хидматгузори Сиёҳ"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "mount-damavand",
      name: "Mount Damavand", name_fa: "کوه دماوند",
      type: "place",
      rarity: "legend",
      chapter: 1,
      img: "/assets/images/locations/mount-damavand-location.png",
      emoji: "🏔",
      role: "Sacred Peak · Throne of Keyumars",
      lore: "The great volcano at the heart of the world. Keyumars built his first court on its slopes, and from those heights human civilization radiated outward. Damavand watches over all of Persia's epochs.",
      biography: "The great volcanic mountain of northern Persia, Damavand is both the throne of Keyumars and — in later chapters — the prison of the tyrant Zahhak. It is the axis of the Persian mythological world, where divinity touches earth. Its snow-crowned peak is visible from across the land, and its slopes are sacred to Ahura Mazda. Every chapter of the Shahnameh casts its shadow against Damavand.",
      faction: "Sacred Landscape · Axis Mundi · Persian Heartland",
      mythologyRole: "World mountain; throne of the first king; later prison of the tyrant; eternal witness",
      powers: ["+12% Daily Drop Chance", "+6 REAL/hr", "Passive: Sacred Peak — location XP bonus in Ch.1 scenes"],
      storyAppearances: ["Chapter 1: The Mountain Court of Keyumars", "Chapter 1: Hushang's Victory at the Peak"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-006",
      season: 2, order: 3, cost: 4000, prereq: { hero_id: "keyumars", level: 1 },
      unlockCondition: "Complete Chapter 1 · The First King",
      role_fa: "قله‌ی مقدس · تخت کیومرث",
      lore_fa: "آتشفشان بزرگ در قلب جهان. کیومرث اولین دربار خود را بر دامنه‌هایش بنا کرد و از آن ارتفاعات تمدن بشری به بیرون تابید. دماوند بر همه‌ی دوران‌های پارس نظارت می‌کند.",
      biography_fa: "کوه آتشفشانی بزرگ شمال پارس، دماوند هم تخت کیومرث است و هم — در فصل‌های بعدی — زندان ضحاک ستمگر. این محور جهان اساطیری پارس است، جایی که الوهیت به زمین می‌رسد. قله‌ی برف‌پوشیده‌اش از سراسر سرزمین دیده می‌شود و دامنه‌هایش مقدس به اهورامزداست. هر فصل از شاهنامه سایه‌اش را بر دماوند می‌اندازد.",
      faction_fa: "چشم‌انداز مقدس · محور جهان · قلب پارس",
      mythologyRole_fa: "کوه جهانی؛ تخت اولین شاه؛ بعداً زندان ستمگر؛ شاهد ابدی",
      unlockCondition_fa: "فصل ۱ را کامل کنید · اولین شاه",
      powers_fa: ["+۱۲٪ احتمال افت روزانه", "+۶ REAL/ساعت", "غیرفعال: قله‌ی مقدس — پاداش XP مکان در صحنه‌های فصل ۱"],
      storyAppearances_fa: ["فصل ۱: دربار کوهستانی کیومرث", "فصل ۱: پیروزی هوشنگ در قله"],
      role_tg: "Қуллаи Муқаддас · Тахти Каюмарс",
      lore_tg: "Оташфишони бузург дар қалби ҷаҳон. Каюмарс аввалин дарбори худро дар доманаҳояш бино кард ва аз он баландиҳо тамаддуни башарӣ густаш. Дамованд бар ҳамаи дурании Порс нигоҳбонӣ мекунад.",
      biography_tg: "Кӯҳи оташфишони бузурги шимоли Порс, Дамованд ҳам тахти Каюмарс аст ва ҳам — дар бобҳои баъдӣ — зиндони тоғути Заҳҳок. Маҳвари ҷаҳони асотирии Порс аст, ҷое ки илоҳиёт ба замин мерасад. Қуллаи барфпӯшидааш аз саросари сарзамин дида мешавад ва доманаҳояш муқаддас ба Аҳурамазда аст. Ҳар бобе аз Шоҳнома сояи худро ба Дамованд меандозад.",
      faction_tg: "Манзараи Муқаддас · Маҳвари Ҷаҳон · Дили Порс",
      mythologyRole_tg: "Кӯҳи ҷаҳонӣ; тахти аввалин шоҳ; баъдан зиндони тоғут; шоҳиди абадӣ",
      unlockCondition_tg: "Боби 1-ро иҷро кунед · Шоҳи Аввал",
      powers_tg: ["+12% Эҳтимоли афти рӯзона", "+6 REAL/соат", "Ғайрифаъол: Қуллаи Муқаддас — XP ҷоизавии мавзеъ дар саҳнаҳои Боби 1"],
      storyAppearances_tg: ["Боби 1: Дарбори Кӯҳии Каюмарс", "Боби 1: Пирӯзии Ҳушанг дар Қулла"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "royal-court",
      name: "Royal Court", name_fa: "دربار شاهی",
      type: "place",
      rarity: "rare",
      chapter: 1,
      img: "/assets/images/locations/royal-mountain-court.png",
      emoji: "🏛",
      role: "First Palace · Seat of the Crown",
      lore: "The court built by Keyumars on Damavand's slopes — where the first laws were spoken, the first ceremonies held, and the first songs of praise composed.",
      biography: "The court of Keyumars atop the sacred mountain was the first human institution. Built from stone and dressed in the skins of wild animals, it was crude by later standards but magnificent in its meaning: the first deliberate structure raised to host law, ritual, and the social order. Every subsequent Persian court traces its legitimacy back to this mountain hall.",
      faction: "First Dynasty · Mountain Civilization · Seat of Farr",
      mythologyRole: "First human institution; prototype of righteous rule; archetype of all future courts",
      powers: ["+6% Story XP", "Passive: Court Wisdom — quiz hint available once per chapter"],
      storyAppearances: ["Chapter 1: The Mountain Court of Keyumars", "Chapter 1: The First Ceremonies"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-007",
      season: 2, order: 5, cost: 2200, prereq: { hero_id: "keyumars", level: 2 },
      unlockCondition: "Complete Chapter 1 · The First King",
      role_fa: "اولین کاخ · جایگاه تاج",
      lore_fa: "درباری که کیومرث بر دامنه‌های دماوند بنا کرد — جایی که اولین قوانین بیان شدند، اولین مراسم برگزار شدند و اولین سرودهای ستایش سروده شدند.",
      biography_fa: "دربار کیومرث بر فراز کوه مقدس اولین نهاد انسانی بود. از سنگ ساخته شده و با پوست جانوران وحشی پوشیده، از نظر معیارهای بعدی خام بود اما در معنایش باشکوه: اولین سازه‌ای که عمداً برای میزبانی قانون، مراسم و نظم اجتماعی برپا شده بود. هر دربار پارسی بعدی مشروعیتش را به این تالار کوهستانی برمی‌گرداند.",
      faction_fa: "دودمان اول · تمدن کوهستانی · جایگاه فرّ",
      mythologyRole_fa: "اولین نهاد انسانی؛ نمونه‌ی فرمانروایی راستین؛ کهن‌الگوی همه‌ی دربارهای آینده",
      unlockCondition_fa: "فصل ۱ را کامل کنید · اولین شاه",
      powers_fa: ["+۶٪ تجربه داستان", "غیرفعال: خرد دربار — یک راهنمای آزمون در هر فصل"],
      storyAppearances_fa: ["فصل ۱: دربار کوهستانی کیومرث", "فصل ۱: اولین مراسم"],
      role_tg: "Аввалин Қаср · Нишонгоҳи Тоҷ",
      lore_tg: "Дарборе ки Каюмарс дар доманаи Дамованд бино кард — ҷое ки аввалин қонунҳо гуфта шуданд, аввалин маросимҳо баргузор шуданд ва аввалин суруди ситоиш сароида шуд.",
      biography_tg: "Дарбори Каюмарс дар фарози кӯҳи муқаддас аввалин муассисаи инсонӣ буд. Аз санг сохта шуда ва бо пӯсти ҳайвоноти ваҳшӣ пӯшонида шуда, аз назари меъёрҳои баъдӣ содда буд аммо дар маънояш бошукӯҳ: аввалин иморати аз рӯи ниятсозӣ барои ҷойгиркунии қонун, маросим ва тартиби иҷтимоӣ бино шуда. Ҳар дарбори баъдии Порс машрӯъияти худро аз ин тори кӯҳӣ мегирад.",
      faction_tg: "Сулолаи Аввал · Тамаддуни Кӯҳӣ · Нишонгоҳи Фарр",
      mythologyRole_tg: "Аввалин муассисаи инсонӣ; намунаи ҳукмронии одилона; архетипи ҳамаи дарборҳои оянда",
      unlockCondition_tg: "Боби 1-ро иҷро кунед · Шоҳи Аввал",
      powers_tg: ["+6% Таҷрибаи ҳикоя", "Ғайрифаъол: Хиради Дарбор — як маслиҳати имтиҳон дар ҳар боб"],
      storyAppearances_tg: ["Боби 1: Дарбори Кӯҳии Каюмарс", "Боби 1: Аввалин Маросимҳо"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "ancient-pars",
      name: "Ancient Pars", name_fa: "پارس باستان",
      type: "place",
      rarity: "rare",
      chapter: 1,
      img: "/assets/images/locations/ancient-pars-location.png",
      emoji: "🌄",
      role: "Land of Origin · Homeland of the Shahs",
      lore: "The primordial heartland from which all Persian kings drew their divine mandate. Keyumars walked its rivers and mountains before his kingship.",
      biography: "The ancestral homeland of the Persian peoples. Before cities, before farms, before fire, the land of ancient Pars was wild mountains and untamed rivers where the first tribes wandered according to their divine mandate. Keyumars walked this land as a shepherd-king before ascending to Damavand. The Farr of this land is old, deep, and enduring.",
      faction: "Sacred Landscape · Persian Homeland · Ancient World",
      mythologyRole: "Ancestral homeland; wellspring of Farr; root of Persian royal legitimacy",
      powers: ["+4% Auto-Mining Rate", "Passive: Homeland Blessing — REAL/hr +2 during Ch.1"],
      storyAppearances: ["Chapter 1: The Origins — Land of the First People", "Chapter 1: Keyumars Walks the Land"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-008",
      season: 2, order: 2, cost: 1500, prereq: { hero_id: "keyumars", level: 1 },
      unlockCondition: "Complete Chapter 1 · The First King",
      role_fa: "سرزمین اصلی · وطن شاهان",
      lore_fa: "قلب اجدادی که همه‌ی پادشاهان پارس از آن فرمان الهی می‌گرفتند. کیومرث رودخانه‌ها و کوه‌هایش را قبل از شاهیش گشت.",
      biography_fa: "وطن اجدادی مردم پارس. قبل از شهرها، قبل از کشاورزی، قبل از آتش، سرزمین پارس باستان کوه‌های وحشی و رودهای رام‌نشده بود که اولین قبایل بر اساس فرمان الهی‌شان در آن سرگردان بودند. کیومرث این سرزمین را به عنوان شاه-چوپان قبل از صعود به دماوند گشت. فرّ این سرزمین کهن، عمیق و پایدار است.",
      faction_fa: "چشم‌انداز مقدس · وطن پارسی · جهان باستانی",
      mythologyRole_fa: "وطن اجدادی؛ چشمه‌ی فرّ؛ ریشه‌ی مشروعیت سلطنتی پارسی",
      unlockCondition_fa: "فصل ۱ را کامل کنید · اولین شاه",
      powers_fa: ["+۴٪ نرخ استخراج خودکار", "غیرفعال: برکت وطن — REAL/ساعت +۲ در فصل ۱"],
      storyAppearances_fa: ["فصل ۱: خاستگاه‌ها — سرزمین مردم اول", "فصل ۱: گشت‌وگذار کیومرث در سرزمین"],
      role_tg: "Сарзамини Аслӣ · Ватани Шоҳон",
      lore_tg: "Қалби аҷдодие ки ҳамаи шоҳони Порс фармони илоҳӣ аз он мегирифтанд. Каюмарс дарёҳо ва кӯҳҳояшро пеш аз шоҳиаш гашт.",
      biography_tg: "Ватани аҷдодии мардуми Порс. Пеш аз шаҳрҳо, пеш аз кишоварзӣ, пеш аз оташ, сарзамини Порси қадим кӯҳҳои ваҳшӣ ва дарёҳои рамнашуда буд ки аввалин қабилаҳо мувофиқи фармони илоҳии худ дар он сарсону саргардон буданд. Каюмарс ин сарзаминро ба ҳайси шоҳ-чӯпон пеш аз боло рафтан ба Дамованд гашт. Фарри ин сарзамин қадимӣ, амиқ ва пойдор аст.",
      faction_tg: "Манзараи Муқаддас · Ватани Порсӣ · Ҷаҳони Қадим",
      mythologyRole_tg: "Ватани аҷдодӣ; чашмаи Фарр; решаи машрӯъияти шоҳии Порсӣ",
      unlockCondition_tg: "Боби 1-ро иҷро кунед · Шоҳи Аввал",
      powers_tg: ["+4% Суръати истихроҷи худкор", "Ғайрифаъол: Баракати Ватан — REAL/соат +2 дар Боби 1"],
      storyAppearances_tg: ["Боби 1: Хостгоҳҳо — Сарзамини Мардуми Аввал", "Боби 1: Гашти Каюмарс дар Сарзамин"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "demon-forest",
      name: "Demon Forest", name_fa: "جنگل دیوان",
      type: "place",
      rarity: "epic",
      chapter: 1,
      img: "/assets/images/locations/demon-forest-location.png",
      emoji: "🌑",
      role: "Dark Realm · Domain of Ahriman's Servants",
      lore: "The shadowed woods where the Black Div dwelled. Its darkness was the first enemy humanity faced — and in facing it, Hushang found the spark that became fire.",
      biography: "The primordial dark forest at the edge of the known world, where Ahriman's divs dwelled beyond human reach. It was here that the Black Div ambushed Siamak. When Hushang pursued what he believed was a great serpent into this forest and struck flint against its rock, fire was born at the darkest edge of the world — light emerging from the place of deepest shadow.",
      faction: "Forces of Darkness · Ahriman's Realm · Borderlands",
      mythologyRole: "Liminal space where light and darkness first clash; birthplace of fire; threshold of civilization",
      powers: ["+10% Combo Multiplier", "Risk: Energy Cost elevated", "Passive: Dark Forest — combo window +1s in night sessions"],
      storyAppearances: ["Chapter 1: The Fall of Siamak", "Chapter 1: The Discovery of Fire — Edge of Darkness"],
      side: "dark",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-009",
      season: 2, order: 14, cost: 7000, prereq: { hero_id: "ahriman", level: 1 },
      unlockCondition: "Defeat Chapter 1 Boss",
      role_fa: "قلمرو تاریک · دامنه‌ی خادمان اهریمن",
      lore_fa: "جنگل‌های سایه‌دار که دیو سیاه در آن زندگی می‌کرد. تاریکی‌اش اولین دشمنی بود که بشریت با آن روبرو شد — و در مواجهه با آن، هوشنگ جرقه‌ای یافت که آتش شد.",
      biography_fa: "جنگل تاریک اولیه در لبه‌ی جهان شناخته‌شده، جایی که دیوان اهریمن فراتر از دسترس بشری می‌زیستند. اینجا بود که دیو سیاه به سیامک کمین زد. وقتی هوشنگ آنچه فکر می‌کرد مار بزرگی است را به داخل این جنگل تعقیب کرد و چخماق را به سنگش زد، آتش در تاریک‌ترین لبه‌ی جهان متولد شد — نوری که از محل عمیق‌ترین سایه برخاست.",
      faction_fa: "نیروهای تاریکی · قلمرو اهریمن · مناطق مرزی",
      mythologyRole_fa: "فضای آستانه‌ای که روشنایی و تاریکی اول با هم برخورد می‌کنند؛ زادگاه آتش؛ آستانه‌ی تمدن",
      unlockCondition_fa: "رئیس فصل ۱ را شکست دهید",
      powers_fa: ["+۱۰٪ ضریب کمبو", "ریسک: هزینه‌ی انرژی افزایش می‌یابد", "غیرفعال: جنگل تاریک — پنجره‌ی کمبو در جلسات شب +۱ ثانیه"],
      storyAppearances_fa: ["فصل ۱: سقوط سیامک", "فصل ۱: کشف آتش — لبه‌ی تاریکی"],
      role_tg: "Қаламрави Торик · Домени Хидматгузорони Аҳриман",
      lore_tg: "Ҷангалҳои сояафкан ки Диви Сиёҳ дар онҳо зиндагӣ мекард. Торикияш аввалин душмане буд ки башарият бо он рӯ ба рӯ шуд — ва дар рӯ ба рӯ шудан бо он, Ҳушанг ҷарақае ёфт ки оташ шуд.",
      biography_tg: "Ҷангали торики ибтидоӣ дар лабаи ҷаҳони маълум, ки дарҷои Аҳриман фаротар аз дасти башарӣ зиндагӣ мекарданд. Инҷо буд ки Диви Сиёҳ ба Сиёмак камин зад. Вақте Ҳушанг чизеро ки мепиндошт морсиёҳ буд ба ин ҷангал таъқиб кард ва чақмоқро ба санги он зад, оташ дар торик-тарин канори ҷаҳон таваллуд шуд — нуре ки аз ҷои амиқ-тарин сояи ҷаҳон бархост.",
      faction_tg: "Нирӯҳои Торикӣ · Қаламрави Аҳриман · Сарҳадҳо",
      mythologyRole_tg: "Фазои остона ки рӯшноӣ ва торикӣ аввалбор бо ҳам дучор мешаванд; зодгоҳи оташ; остонаи тамаддун",
      unlockCondition_tg: "Рейси Боби 1-ро мағлуб кунед",
      powers_tg: ["+10% Зарбзании комбо", "Хатар: Хароҷоти энергия баланд мешавад", "Ғайрифаъол: Ҷангали Торик — тирезаи комбо дар ҷаласаҳои шаб +1с"],
      storyAppearances_tg: ["Боби 1: Суқути Сиёмак", "Боби 1: Кашфи Оташ — Лабаи Торикӣ"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "farr-codex",
      name: "Farr — Divine Light", name_fa: "فرّ — نور الهی",
      type: "codex",
      rarity: "epic",
      chapter: 1,
      img: "/assets/images/lore/ferdowsi-intro.png",
      emoji: "✦",
      role: "Divine Concept · Royal Glory",
      lore: "Farr (Khvarenah) is the divine radiance that marks the rightful king. It cannot be seized by force — only earned through justice, wisdom, and valor.",
      biography: "The Farr (or Khvarenah in Avestan) is the animating principle of legitimate Persian kingship. It is the divine radiance that descends upon rightful rulers and departs from tyrants. It cannot be inherited through blood alone, nor seized through conquest — it is granted by the cosmic order. When Keyumars wore the crown of leaves, he bore the Farr. When kings become corrupt, the Farr takes flight as a great bird and seeks a worthier vessel.",
      faction: "Divine Principle · Ahura Mazda's Emanation · Royal Metaphysics",
      mythologyRole: "Divine legitimacy of kingship; cosmic endorsement of just rule; animating force of the Persian royal tradition",
      powers: ["+10% Tap Power", "Lore unlock: Farr concept tree", "Passive: Divine Radiance — +XP bonus on perfect quiz scores"],
      storyAppearances: ["Chapter 1 Codex: The Meaning of Farr", "Chapter 1 Quiz: Divine Kingship and the Farr"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-010",
      season: 2, order: 7, cost: 5000, prereq: { hero_id: "keyumars", level: 3 },
      unlockCondition: "Complete Chapter 1 Quiz with 80%+ score",
      role_fa: "مفهوم الهی · شکوه سلطنتی",
      lore_fa: "فرّ (خوارنه) تابش الهی است که پادشاه راستین را نشان می‌دهد. نمی‌توان آن را با زور گرفت — فقط از طریق عدالت، خرد و شجاعت به دست می‌آید.",
      biography_fa: "فرّ (یا خوارنه در اوستایی) اصل محرک شاهی مشروع پارسی است. تابش الهی است که بر فرمانروایان راستین نازل می‌شود و از ستمگران می‌رود. نه از طریق خون به ارث می‌رسد و نه با فتح گرفته می‌شود — از طرف نظم کیهانی اعطا می‌شود. وقتی کیومرث تاج برگ را بر سر نهاد، فرّ را با خود داشت. وقتی شاهان فاسد می‌شوند، فرّ به عنوان پرنده‌ای بزرگ پرواز می‌کند و دنبال ظرف شایسته‌تری می‌گردد.",
      faction_fa: "اصل الهی · تجلی اهورامزدا · متافیزیک سلطنتی",
      mythologyRole_fa: "مشروعیت الهی شاهی؛ تأیید کیهانی فرمانروایی عادلانه؛ نیروی محرک سنت سلطنتی پارسی",
      unlockCondition_fa: "آزمون فصل ۱ را با نمره‌ی ۸۰٪ یا بیشتر کامل کنید",
      powers_fa: ["+۱۰٪ قدرت ضربه", "باز شدن دانش: درخت مفهوم فرّ", "غیرفعال: تابش الهی — پاداش XP در نمرات کامل آزمون"],
      storyAppearances_fa: ["فصل ۱ کدکس: معنای فرّ", "آزمون فصل ۱: شاهی الهی و فرّ"],
      role_tg: "Мафҳуми Илоҳӣ · Шарофати Шоҳӣ",
      lore_tg: "Фарр (Хваренаҳ) тобиши илоҳиест ки шоҳи растинро нишон медиҳад. Бо зӯр гирифта намешавад — танҳо аз тариқи адолат, хирад ва далерӣ ба даст меояд.",
      biography_tg: "Фарр (ё Хваренаҳ дар авестоӣ) принсипи муҳаррики шоҳии машрӯи Порсӣ аст. Тобиши илоҳиест ки ба ҳукмронони раститнӣ нозил мешавад ва аз тоғутон мегурезад. На тавассути хун ба мерос мерасад ва на тавассути забт гирифта мешавад — аз тарафи тартиби космикӣ ато мешавад. Вақте Каюмарс тоҷи барг пӯшид, Фарр ба ӯ тааллуқ дошт. Вақте шоҳон фосид мешаванд, Фарр ба ҳайси паррандаи бузург парвоз мекунад ва дунболи зарфи шоистатаре мегардад.",
      faction_tg: "Принсипи Илоҳӣ · Зуҳури Аҳурамазда · Метафизики Шоҳӣ",
      mythologyRole_tg: "Машрӯъияти илоҳии шоҳӣ; тасдиқи космикии ҳукмронии одилона; нирӯи муҳаррики суннати шоҳии Порсӣ",
      unlockCondition_tg: "Имтиҳони Боби 1-ро бо нишонаи 80%+ иҷро кунед",
      powers_tg: ["+10% Қудрати зарба", "Кушоиши дониш: Дарахти мафҳуми Фарр", "Ғайрифаъол: Тобиши Илоҳӣ — XP ҷоизавӣ дар нишонаҳои комили имтиҳон"],
      storyAppearances_tg: ["Кодекси Боби 1: Маъноии Фарр", "Имтиҳони Боби 1: Шоҳии Илоҳӣ ва Фарр"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },

    /* ── 5 NEW Chapter 1 cards ─────────────────────────── */
    {
      id: "mount-alborz",
      name: "Mount Alborz", name_fa: "کوه البرز",
      type: "place",
      rarity: "rare",
      chapter: 1,
      img: "/season2/uploads/heroes/mount_alborz.png",
      emoji: "⛰",
      role: "Sacred Range · First Frontier",
      lore: "The great mountain range that cradles the northern edge of Persia. Keyumars first surveyed his kingdom from these peaks before descending to Damavand.",
      biography: "Mount Alborz — the great spine of northern Persia — is the first frontier of the civilized world. It was from these heights that Keyumars first looked across the land that would become his kingdom. The Alborz range stands as a wall between the ordered world of the Shahs and the chaotic wilds beyond, and its highest peaks brush the realm of the divine.",
      faction: "Sacred Landscape · Northern Frontier · Persian Heartland",
      mythologyRole: "First frontier; boundary between civilized world and wilderness; realm of the first royal survey",
      powers: ["+5% Tap Power", "+8 Zar/hr", "Passive: Mountain Sight — +2% chapter exploration bonus"],
      storyAppearances: ["Chapter 1: Keyumars Surveys the Land", "Chapter 1: The First Borders"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-011",
      season: 2, order: 4, cost: 2500, prereq: { hero_id: "keyumars", level: 1 },
      unlockCondition: "Complete Chapter 1 · Own Keyumars",
      role_fa: "رشته‌کوه مقدس · مرز اول",
      lore_fa: "رشته‌کوه بزرگی که لبه‌ی شمالی پارس را در آغوش می‌گیرد. کیومرث از این قله‌ها قبل از پایین آمدن به دماوند برای اولین بار سلطنت خود را بررسی کرد.",
      biography_fa: "البرز — ستون بزرگ شمال پارس — اولین مرز جهان متمدن است. از این ارتفاعات بود که کیومرث برای اولین بار به سرزمینی که پادشاهیش می‌شد نگاه کرد. رشته‌کوه البرز به عنوان دیواری بین جهان منظم شاهان و بیابان‌های هرج و مرجی بیرون ایستاده، و بلندترین قله‌هایش قلمرو الهی را لمس می‌کنند.",
      faction_fa: "چشم‌انداز مقدس · مرز شمالی · قلب پارس",
      mythologyRole_fa: "اولین مرز؛ مرز بین جهان متمدن و بیابان؛ قلمرو اولین بررسی سلطنتی",
      unlockCondition_fa: "فصل ۱ را کامل کنید · کیومرث داشته باشید",
      powers_fa: ["+۵٪ قدرت ضربه", "+۸ Zar/ساعت", "غیرفعال: دید کوهستانی — +۲٪ پاداش کاوش فصل"],
      storyAppearances_fa: ["فصل ۱: کیومرث سرزمین را بررسی می‌کند", "فصل ۱: اولین مرزها"],
      role_tg: "Силсилаи Кӯҳҳои Муқаддас · Марзи Аввал",
      lore_tg: "Силсилаи кӯҳҳои бузурге ки канори шимолии Порсро дар оғӯш мегирад. Каюмарс аз ин қуллаҳо пеш аз фаромадан ба Дамованд барои аввалин бор шоҳиаш را бозбинӣ кард.",
      biography_tg: "Албурз — сутуни бузурги шимоли Порс — аввалин марзи ҷаҳони мутамаддин аст. Аз ин баландиҳо буд ки Каюмарс барои аввалин бор ба сарзамине ки шоҳияш мешуд нигоҳ кард.",
      faction_tg: "Манзараи Муқаддас · Марзи Шимолӣ · Дили Порс",
      mythologyRole_tg: "Аввалин марз; ҳад байни ҷаҳони мутамаддин ва биёбон; қаламрави аввалин бозбинии шоҳонӣ",
      unlockCondition_tg: "Боби 1-ро иҷро кунед · Каюмарсро дошта бошед",
      powers_tg: ["+5% Қудрати зарба", "+8 Zar/соат", "Ғайрифаъол: Биниши Кӯҳӣ — +2% ҷоизаи кофтукови боб"],
      storyAppearances_tg: ["Боби 1: Каюмарс сарзаминро бозбинӣ мекунад", "Боби 1: Аввалин Марзҳо"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "fravahar",
      name: "Fravahar", name_fa: "فَروَهَر",
      type: "codex",
      rarity: "epic",
      chapter: 1,
      img: "/season2/uploads/heroes/farvahar.png",
      emoji: "🦅",
      role: "Divine Guide · Winged Symbol of Persia",
      lore: "The Fravahar is the divine spirit-guide accompanying each soul — a winged being representing the higher self, choices made toward light, and the guardian of the righteous path.",
      biography: "The Fravahar (or Fravashi) is one of the most profound symbols in Zoroastrian thought — a divine spiritual double that exists before birth and persists after death. It is not merely a guardian angel but an aspirational higher self: the version of you that has already chosen righteousness. In Persian royal iconography, the winged disc with a human figure represents divine endorsement of the king's legitimacy.",
      faction: "Divine Principle · Zoroastrian Theology · Royal Iconography",
      mythologyRole: "Personal divine guide; embodiment of righteous aspiration; guardian of the soul's highest path",
      powers: ["+8% Story XP", "+20 Zar/hr", "Passive: Divine Guidance — quiz hint available +1 per chapter"],
      storyAppearances: ["Chapter 1 Codex: The Fravahar — Guide of the Righteous", "Chapter 1: The Sacred Symbol"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-012",
      season: 2, order: 6, cost: 4500, prereq: { hero_id: "keyumars", level: 2 },
      unlockCondition: "Complete Chapter 1 · Own Keyumars Lv.2",
      role_fa: "راهنمای الهی · نماد بالدار پارس",
      lore_fa: "فروهر روح-راهنمای الهی است که هر روح را همراهی می‌کند — موجودی بالدار که نماینده‌ی خود برتر، انتخاب‌های انجام‌شده به سوی روشنایی و نگهبان راه راستین است.",
      biography_fa: "فروهر (یا فروشی) یکی از عمیق‌ترین نمادهای اندیشه‌ی زرتشتی است — دوگانه‌ی روحانی الهی که قبل از تولد وجود دارد و بعد از مرگ ادامه می‌یابد. نه صرفاً یک فرشته‌ی نگهبان بلکه یک خود برتر آرمانی: نسخه‌ای از شما که قبلاً پارسایی را انتخاب کرده است.",
      faction_fa: "اصل الهی · الهیات زرتشتی · نمادنگاری سلطنتی",
      mythologyRole_fa: "راهنمای روحانی شخصی؛ تجسم آرزوی پارسایانه؛ نگهبان بلندترین مسیر روح",
      unlockCondition_fa: "فصل ۱ را کامل کنید · کیومرث Lv.۲ داشته باشید",
      powers_fa: ["+۸٪ تجربه داستان", "+۲۰ Zar/ساعت", "غیرفعال: راهنمایی الهی — راهنمای آزمون +۱ در هر فصل"],
      storyAppearances_fa: ["فصل ۱ کدکس: فروهر — راهنمای راستان", "فصل ۱: نماد مقدس"],
      role_tg: "Роҳнамои Илоҳӣ · Рамзи Болдори Порс",
      lore_tg: "Фравоҳар рӯҳ-роҳнамои илоҳист ки ҳар рӯҳро ҳамроҳӣ мекунад — мавҷудоти болдоре ки намояндаи худи бартар, интихобҳои анҷомёфта ба сӯи рӯшноӣ ва нигаҳбони роҳи растин аст.",
      biography_tg: "Фравоҳар (ё Фравашӣ) яке аз амиқ-тарин рамзҳои андешаи зардуштӣ аст — дуганаи рӯҳонии илоҳӣ ки пеш аз таваллуд вуҷуд дорад ва баъд аз марг идома меёбад. На танҳо фариштаи нигаҳбон балки худи бартари ормонӣ: нусхае аз шумо ки қаблан покизагиро интихоб кардааст.",
      faction_tg: "Принсипи Илоҳӣ · Илоҳиёти Зардуштӣ · Рамзнигории Шоҳӣ",
      mythologyRole_tg: "Роҳнамои рӯҳонии шахсӣ; таҷассуми ормони покизагӣ; нигаҳбони баландтарин масири рӯҳ",
      unlockCondition_tg: "Боби 1-ро иҷро кунед · Каюмарс Lv.2 дошта бошед",
      powers_tg: ["+8% Таҷрибаи ҳикоя", "+20 Zar/соат", "Ғайрифаъол: Роҳнамоии Илоҳӣ — маслиҳати имтиҳон +1 дар ҳар боб"],
      storyAppearances_tg: ["Кодекси Боби 1: Фравоҳар — Роҳнамои Раститнон", "Боби 1: Рамзи Муқаддас"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "leopard-skins",
      name: "The Leopard Skins", name_fa: "پوست‌های پلنگ",
      type: "artifact",
      rarity: "epic",
      chapter: 1,
      img: "/season2/uploads/heroes/leopard_skin.png",
      emoji: "🐆",
      role: "First Armor · Garment of the Mountain King",
      lore: "The spotted skins of the mountain leopard — the first garments Keyumars gave to humanity. Before woven cloth, the leopard's hide was the mark of the king and the first human dignity.",
      biography: "Before the art of spinning and weaving was known, Keyumars clothed his court in the skins of mountain leopards. These were not merely garments but symbols of dominion — the king who could tame the wild mountain predator and claim its skin stood above the untamed world. The spotted patterns became the first heraldic mark of the Pishdad dynasty.",
      faction: "First Dynasty · Pishdad Regalia · Mountain Court Artifacts",
      mythologyRole: "First human clothing; royal regalia of the mountain court; symbol of the civilizing act",
      powers: ["+7% Tap Power", "+20 Zar/hr", "Passive: King's Mantle — upgrade costs reduced 5%"],
      storyAppearances: ["Chapter 1: The Court of Keyumars — The First Garments", "Chapter 1 Artifact: The Royal Hide"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-013",
      season: 2, order: 8, cost: 6500, prereq: { hero_id: "keyumars", level: 3 },
      unlockCondition: "Complete Chapter 1 · Own Keyumars Lv.3",
      role_fa: "اولین زره · لباس شاه کوهستان",
      lore_fa: "پوست خال‌خال پلنگ کوهستانی — اولین جامه‌ای که کیومرث به بشریت بخشید. قبل از پارچه‌ی بافته‌شده، پوست پلنگ نشانه‌ی شاه و اولین کرامت انسانی بود.",
      biography_fa: "قبل از اینکه هنر ریسیدن و بافتن شناخته شود، کیومرث دربار خود را با پوست پلنگ‌های کوهستانی پوشاند. اینها نه صرفاً جامه بلکه نماد سلطه بودند — شاهی که می‌توانست شکارچی وحشی کوهستان را رام کند. خال‌خال‌ها اولین نشان هرالدیک خاندان پیشدادی شدند.",
      faction_fa: "دودمان اول · نشان پیشدادیان · آثار دربار کوهستانی",
      mythologyRole_fa: "اولین لباس انسانی؛ نشان سلطنتی دربار کوهستانی؛ نماد عمل متمدن‌سازی",
      unlockCondition_fa: "فصل ۱ را کامل کنید · کیومرث Lv.۳ داشته باشید",
      powers_fa: ["+۷٪ قدرت ضربه", "+۲۰ Zar/ساعت", "غیرفعال: ردای شاه — هزینه‌های ارتقاء ۵٪ کاهش می‌یابد"],
      storyAppearances_fa: ["فصل ۱: دربار کیومرث — اولین جامه‌ها", "فصل ۱ اثر: پوست سلطنتی"],
      role_tg: "Аввалин Зиреҳ · Либоси Шоҳи Кӯҳ",
      lore_tg: "Пӯсти хол‌холи паланги кӯҳӣ — аввалин либосе ки Каюмарс ба башарият бахшид. Пеш аз матои бофташуда, пӯсти паланг нишонаи шоҳ ва аввалин карамати инсонӣ буд.",
      biography_tg: "Пеш аз иниқе ки санъати ресида ва бофтан маълум шавад, Каюмарс дарбори худро бо пӯсти палангҳои кӯҳӣ пӯшонд. Инҳо на танҳо либос балки рамзи ҳукмронӣ буданд. Хол‌холҳо аввалин нишони ҳеральдикии сулолаи Пешдодӣ шуданд.",
      faction_tg: "Сулолаи Аввал · Нишонаи Пешдодиён · Осори Дарбори Кӯҳӣ",
      mythologyRole_tg: "Аввалин либоси инсонӣ; нишони шоҳонии дарбори кӯҳӣ; рамзи амали тамаддунсозӣ",
      unlockCondition_tg: "Боби 1-ро иҷро кунед · Каюмарс Lv.3 дошта бошед",
      powers_tg: ["+7% Қудрати зарба", "+20 Zar/соат", "Ғайрифаъол: Риши Шоҳ — хароҷоти баланд 5% кам мешавад"],
      storyAppearances_tg: ["Боби 1: Дарбори Каюмарс — Аввалин Либосҳо", "Боби 1 Осор: Пӯсти Шоҳонӣ"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "black-demon",
      name: "The Black Demon", name_fa: "دیو تاریکی",
      type: "enemy",
      rarity: "epic",
      chapter: 1,
      img: "/season2/uploads/heroes/blak_demon.png",
      emoji: "👹",
      role: "Son of Ahriman · Gate of Darkness",
      lore: "Born from Ahriman's darkest will, the Black Demon is the intermediary between the mortal world and Ahriman's realm — stronger than the Black Div, a threshold that must be overcome before the lord of darkness can be confronted directly.",
      biography: "The Black Demon stands between the world of men and the presence of Ahriman himself. Where the Black Div was a powerful servant sent on a mission, the Black Demon is the permanent guardian of the dark threshold. He cannot be bypassed; he must be faced. Only after his power has been absorbed into your collection can Ahriman himself be approached. He is the test before the final darkness.",
      faction: "Forces of Darkness · Ahriman's Inner Court · Div Elite",
      mythologyRole: "Guardian of the dark threshold; gate between mortal darkness and Ahriman's realm; final obstacle before the confrontation",
      powers: ["+6% Critical Hit Chance", "+20 Zar/hr", "Passive: Dark Threshold — combo multiplier +0.2"],
      storyAppearances: ["Chapter 1: The Dark Threshold", "Chapter 1: Before the Presence of Ahriman"],
      side: "dark",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-014",
      season: 2, order: 11, cost: 5500, prereq: { hero_id: "black-div", level: 1 },
      unlockCondition: "Complete Chapter 1 · Defeat the Black Div",
      role_fa: "پسر اهریمن · دروازه‌ی تاریکی",
      lore_fa: "زاده شده از تاریک‌ترین اراده‌ی اهریمن، دیو سیاه واسطه‌ی بین جهان فانی و قلمرو اهریمن است — قوی‌تر از دیو سیاه، آستانه‌ای که باید پیش از مواجهه‌ی مستقیم با ارباب تاریکی پشت سر گذاشته شود.",
      biography_fa: "دیو سیاه بین جهان بشری و حضور خود اهریمن ایستاده است. دیو سیاه نگهبان دائمی آستانه‌ی تاریک است — دربان حرم درونی اهریمن. نمی‌توان از او عبور کرد؛ باید با او روبرو شد. تنها پس از اینکه قدرت او در مجموعه‌ی شما جذب شد، می‌توان به خود اهریمن نزدیک شد.",
      faction_fa: "نیروهای تاریکی · دربار درونی اهریمن · نخبگان دیوان",
      mythologyRole_fa: "نگهبان آستانه‌ی تاریک؛ دروازه بین تاریکی فانی و قلمرو اهریمن؛ مانع نهایی قبل از مواجهه",
      unlockCondition_fa: "فصل ۱ را کامل کنید · دیو سیاه را شکست دهید",
      powers_fa: ["+۶٪ احتمال ضربه‌ی بحرانی", "+۲۰ Zar/ساعت", "غیرفعال: آستانه‌ی تاریک — ضریب کمبو +۰.۲"],
      storyAppearances_fa: ["فصل ۱: آستانه‌ی تاریک", "فصل ۱: پیش از حضور اهریمن"],
      role_tg: "Писари Аҳриман · Дарвозаи Торикӣ",
      lore_tg: "Таваллудёфта аз торик-тарин иродаи Аҳриман, Деви Сиёҳ миёнарав байни ҷаҳони фонӣ ва қаламрави Аҳриман аст — қавитар аз Диви Сиёҳ, остонае ки пеш аз рӯ ба рӯ шудани мустақим бо арбоби торикӣ бояд паси сар гузошта шавад.",
      biography_tg: "Деви Сиёҳ байни ҷаҳони башарӣ ва ҳузури худи Аҳриман меистад. Деви Сиёҳ нигаҳбони доимии остонаи торик аст — дарбони ҳарами дарунии Аҳриман. Наметавон аз ӯ гузашт; бояд бо ӯ рӯ ба рӯ шуд.",
      faction_tg: "Нирӯҳои Торикӣ · Дарбори Дарунии Аҳриман · Элитаи Девҳо",
      mythologyRole_tg: "Нигаҳбони остонаи торик; дарвоза байни торикии фонӣ ва қаламрави Аҳриман; монеи ниҳоӣ пеш аз рӯёрӯӣ",
      unlockCondition_tg: "Боби 1-ро иҷро кунед · Диви Сиёҳро мағлуб кунед",
      powers_tg: ["+6% Эҳтимоли зарбаи критикӣ", "+20 Zar/соат", "Ғайрифаъол: Остонаи Торик — зарбзании комбо +0.2"],
      storyAppearances_tg: ["Боби 1: Остонаи Торик", "Боби 1: Пеш аз Ҳузури Аҳриман"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "discovery-of-fire",
      name: "The Discovery of Fire", name_fa: "کشف آتش",
      type: "codex",
      rarity: "epic",
      chapter: 1,
      img: "/season2/uploads/heroes/discovery_of_fire.png",
      emoji: "🔥",
      role: "World-Changing Event · The Spark of Civilization",
      lore: "The moment Hushang struck flint against stone while pursuing the black serpent, fire entered the world. He declared it sacred to Ahura Mazda, and humanity was transformed forever.",
      biography: "When Hushang pursued what he believed was a great serpent across a stony hillside, his sword striking a boulder sent sparks flying — and from those sparks, the world's first fire was born. He gathered his people, declared fire the most sacred gift of Ahura Mazda, and that night held the world's first feast lit by flame. The festival of Sadeh — still celebrated today — commemorates this pivotal moment. From fire came cooking, metalwork, warmth, and the beginning of civilization.",
      faction: "Civilizing Events · Pishdad Achievement · Sacred Discoveries",
      mythologyRole: "Pivotal civilizing event; birth of fire; transition from animal to human culture; foundation of the Sadeh festival",
      powers: ["+10% Tap Power", "+20 Zar/hr", "Passive: Sacred Flame — critical tap chance +5%, energy refills 10% faster"],
      storyAppearances: ["Chapter 1 Conclusion: The Discovery of Fire", "Chapter 1 Reward: The First Feast of Sadeh"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-015",
      season: 2, order: 15, cost: 9000, farr_cost: 2, prereq: { hero_id: "hushang", level: 2 },
      unlockCondition: "Complete Chapter 1 · Own Hushang Lv.2",
      role_fa: "رویداد تغییردهنده‌ی جهان · جرقه‌ی تمدن",
      lore_fa: "لحظه‌ای که هوشنگ در تعقیب مار سیاه سنگ چخماق را به هم کوبید، آتش وارد جهان شد. آن را مقدس به اهورامزدا اعلام کرد و بشریت برای همیشه دگرگون شد.",
      biography_fa: "وقتی هوشنگ آنچه فکر می‌کرد مار بزرگی است را روی تپه‌ای سنگی تعقیب کرد، شمشیر چخماقش جرقه پروراند — و از آن جرقه‌ها، اولین آتش جهان متولد شد. مردمش را گرد آورد، آتش را مقدس‌ترین هدیه‌ی اهورامزدا اعلام کرد و آن شب اولین جشن روشن‌شده با شعله را برگزار کرد. جشن سده — که هنوز هم برگزار می‌شود — این لحظه را گرامی می‌دارد.",
      faction_fa: "رویدادهای متمدن‌ساز · دستاورد پیشدادیان · کشفیات مقدس",
      mythologyRole_fa: "رویداد محوری متمدن‌سازی؛ تولد آتش؛ گذار از فرهنگ حیوانی به انسانی؛ بنیاد جشن سده",
      unlockCondition_fa: "فصل ۱ را کامل کنید · هوشنگ Lv.۲ داشته باشید",
      powers_fa: ["+۱۰٪ قدرت ضربه", "+۲۰ Zar/ساعت", "غیرفعال: شعله‌ی مقدس — احتمال ضربه‌ی بحرانی +۵٪، انرژی ۱۰٪ سریع‌تر شارژ می‌شود"],
      storyAppearances_fa: ["نتیجه‌ی فصل ۱: کشف آتش", "پاداش فصل ۱: اولین جشن سده"],
      role_tg: "Рӯйдоди Ҷаҳонтағйирдиҳанда · Ҷарақаи Тамаддун",
      lore_tg: "Лаҳзае ки Ҳушанг дар таъқиби мори сиёҳ чақмоқро ба санг зад, оташ ба ҷаҳон даромад. Онро муқаддас ба Аҳурамазда эълон кард ва башарият барои ҳамеша дигаргун шуд.",
      biography_tg: "Вақте Ҳушанг чизеро ки мепиндошт мори бузург аст дар теппаи сангие таъқиб кард, шамшираш ба санг хӯрд ва ҷарақаҳо парид — ва аз он ҷарақаҳо аввалин оташи ҷаҳон таваллуд шуд. Мардумашро гирд овард, оташро муқаддастарин ҳадияи Аҳурамазда эълон кард ва он шаб аввалин зиёфатро баргузор кард. Ҷашни Сада ин лаҳзаро гиромӣ медорад.",
      faction_tg: "Рӯйдодҳои Тамаддунсоз · Дастоварди Пешдодиён · Кашфиёти Муқаддас",
      mythologyRole_tg: "Рӯйдоди маркази тамаддунсозӣ; таваллуди оташ; гузар аз фарҳанги ҳайвонӣ ба инсонӣ; бунёди ҷашни Сада",
      unlockCondition_tg: "Боби 1-ро иҷро кунед · Ҳушанг Lv.2 дошта бошед",
      powers_tg: ["+10% Қудрати зарба", "+20 Zar/соат", "Ғайрифаъол: Шӯълаи Муқаддас — эҳтимоли зарбаи критикӣ +5%, энергия 10% зудтар пур мешавад"],
      storyAppearances_tg: ["Хулосаи Боби 1: Кашфи Оташ", "Ҷоизаи Боби 1: Аввалин Ҷашни Сада"],
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },

    /* ── Chapter 2 (Hushang) ──────────────────────────────── */
    {
      id: "sade-ch2", name: "The Festival of Sade", name_fa: "جشن سده",
      type: "codex", rarity: "rare", chapter: 2, emoji: "🔥",
      img: "/season2/uploads/heroes/discovery_of_fire.png",
      role: "Birth of Fire · First Festival", role_fa: "تولد آتش · اولین جشن",
      lore: "The night fire entered the world. Hushang struck flint at a serpent that dodged — and the missed stone lit a tree. He named the night Sade. It is still celebrated.",
      lore_fa: "شبی که آتش وارد جهان شد. هوشنگ چخماقی به افعی زد که طفره رفت — سنگِ خطاخورده درختی را روشن کرد. او شب را سده نامید. هنوز هم جشن گرفته می‌شود.",
      biography: "The Festival of Sade was born from a missed throw. Hushang pursued a black serpent across a rocky pass, hurled a flint stone at it, and missed. The stone struck the rock-face and a spark leaped. A tree caught fire. Hushang gathered his people and named the night. From that night, fire was given to humankind.",
      biography_fa: "جشن سده از یک پرتاب خطا زاده شد. هوشنگ افعی سیاهی را از گذرگاهی سنگی تعقیب کرد، سنگی به آن انداخت و خطا رفت. سنگ به صخره خورد و جرقه‌ای جهید. درختی آتش گرفت. هوشنگ مردمانش را گرد آورد و شب را نامید.",
      faction: "Sacred Discoveries · Pishdad Age · Persian Festivals",
      faction_fa: "کشفیات مقدس · عصر پیشدادیان · جشن‌های ایرانی",
      mythologyRole: "Origin of the Persian festival of fire; civilizing gift born from accident and wisdom",
      mythologyRole_fa: "سرآغاز جشن آتش ایرانی؛ هدیه‌ی تمدن‌ساز زاده از تصادف و خرد",
      powers: ["+6% Story XP", "+10 Zar/hr", "Passive: Sade Night — chapter scene XP +5%"],
      powers_fa: ["+۶٪ تجربه داستان", "+۱۰ Zar/ساعت", "غیرفعال: شب سده — XP صحنه‌ی فصل +۵٪"],
      storyAppearances: ["Chapter 2: The Serpent in the Pass", "Chapter 2: Fire is Born"],
      storyAppearances_fa: ["فصل ۲: افعی در گذرگاه", "فصل ۲: آتش زاده می‌شود"],
      side: "light", nftReady: false, collectionId: "SHAHNAMEH-S2-CH2-001",
      season: 2, order: 16, cost: 1800, prereq: { hero_id: "hushang", level: 1 },
      unlockCondition: "Complete Chapter 2 · The Spark of Fire",
      unlockCondition_fa: "فصل ۲ را کامل کنید · جرقه‌ی آتش",
      role_tg: "Таваллуди Оташ · Аввалин Ид", lore_tg: "Шаби дохили оташи ҷаҳон. Ҳушанг чақмоқро ба мор зад ва хато рафт — санги хатохурда дарахтеро равшан кард. Ӯ шабро Сада номид.",
      biography_tg: "Ҷашни Сада аз як партоби хато зода шуд. Ҳушанг мори сиёҳро аз гузаргоҳи сангие таъқиб кард, санге ба он партофт ва хато рафт. Санг ба санг хӯрд ва ҷарақа ҷаст. Дарахте оташ гирифт.",
      faction_tg: "Кашфиёти Муқаддас · Асри Пешдодиён · Ҷашнҳои Эронӣ",
      mythologyRole_tg: "Сарчашмаи ҷашни оташи эронӣ; ҳадяи тамаддун аз тасодуф ва хирад",
      powers_tg: ["+6% Таҷрибаи ҳикоя", "+10 Zar/соат", "Ғайрифаъол: Шаби Сада — XP саҳнаи боб +5%"],
      storyAppearances_tg: ["Боби 2: Мор дар Гузаргоҳ", "Боби 2: Оташ Таваллуд Мешавад"],
      unlockCondition_tg: "Боби 2-ро иҷро кунед · Ҷарақаи Оташ",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "first-iron-forge-card", name: "The First Iron Forge", name_fa: "نخستین آهنگری",
      type: "place", rarity: "epic", chapter: 2, emoji: "⚒",
      img: "/season2/uploads/heroes/first_fire_forge.png",
      role: "Cradle of Iron · Birth of Craft", role_fa: "گاهوارهٔ آهن · زایش صنعت",
      lore: "Hushang turned fire on iron ore and the forge was born. Every weapon, every plough, every hammer ever made carries a lineage back to this slope of Pars.",
      lore_fa: "هوشنگ آتش را به سنگِ معدن آهن تاباند و آهنگری زاده شد. هر سلاح، هر گاوآهن، هر چکشی که ساخته شده نسبنامه‌ای به این دامنه از پارس دارد.",
      biography: "The first forge on the slopes of Pars — where Hushang's discovery of fire was immediately turned toward iron ore. The first hammer-strike rang out across the mountains. From this forge came the blade, the plough, the axe. What Kaveh the blacksmith will do in chapter 5 has its deepest root in this moment.",
      biography_fa: "نخستین آهنگری بر دامنه‌های پارس — جایی که کشف آتشِ هوشنگ فوری به سمتِ سنگ معدنِ آهن چرخید. نخستین ضربه‌ی چکش در کوه‌ها طنین انداخت. از این آهنگری تیغ، گاوآهن و تبر برخاستند.",
      faction: "Pishdad Achievement · Sacred Discoveries · Civilizing Age",
      faction_fa: "دستاورد پیشدادیان · کشفیات مقدس · عصر تمدن‌ساز",
      mythologyRole: "First metalworking site; foundation of Persian craftsmanship; root of the Kaveh the Blacksmith tradition",
      mythologyRole_fa: "نخستین محل فلزکاری؛ بنیاد صنعتگری پارسی؛ ریشه‌ی سنتِ کاوه‌ی آهنگر",
      powers: ["+8% Tap Power", "+20 Zar/hr", "Passive: Iron Legacy — upgrade cost –8%"],
      powers_fa: ["+۸٪ قدرت ضربه", "+۲۰ Zar/ساعت", "غیرفعال: میراث آهن — هزینه‌ی ارتقا −۸٪"],
      storyAppearances: ["Chapter 2: A World Reborn", "Chapter 2: The Age of Craft"],
      storyAppearances_fa: ["فصل ۲: جهانی از نو", "فصل ۲: عصر صنعت"],
      side: "light", nftReady: false, collectionId: "SHAHNAMEH-S2-CH2-002",
      season: 2, order: 17, cost: 4500, prereq: { hero_id: "hushang", level: 2 },
      unlockCondition: "Complete Chapter 2 · Own Hushang Lv.2",
      unlockCondition_fa: "فصل ۲ را کامل کنید · هوشنگ Lv.۲ داشته باشید",
      role_tg: "Гаҳвораи Оҳан · Зоиши Ҳунар", lore_tg: "Ҳушанг оташро ба санги кони оҳан тобонд ва оҳангарӣ зода шуд. Ҳар аслиҳа, ҳар говоҳан, ҳар чакуше насабномае ба ин доманаи Порс дорад.",
      biography_tg: "Аввалин оҳангарӣ дар доманаҳои Порс — ҷое ки кашфи оташи Ҳушанг фавран ба сӯи санги маъдании оҳан гардид. Аввалин зарбаи чакуш дар кӯҳҳо садо дод. Аз ин оҳангарӣ теғ, говоҳан ва табар баромаданд.",
      faction_tg: "Дастоварди Пешдодиён · Кашфиёти Муқаддас · Асри Тамаддунсоз",
      mythologyRole_tg: "Аввалин мавзеи металлкорӣ; бунёди ҳунармандии Порсӣ; решаи суннати Коваи Оҳангар",
      powers_tg: ["+8% Қудрати зарба", "+20 Zar/соат", "Ғайрифаъол: Мероси Оҳан — хароҷоти баланд −8%"],
      storyAppearances_tg: ["Боби 2: Ҷаҳоне Аз Нав", "Боби 2: Асри Ҳунар"],
      unlockCondition_tg: "Боби 2-ро иҷро кунед · Ҳушанг Lv.2 дошта бошед",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "iron-axe-card", name: "Iron Axe of Hushang", name_fa: "تبر آهنینِ هوشنگ",
      type: "artifact", rarity: "epic", chapter: 2, emoji: "🪓",
      img: "/season2/uploads/heroes/iron_ax_of_hushang.png",
      role: "First Iron Weapon · Relic of Chapter 2", role_fa: "نخستین سلاح آهنین · یادگارِ فصل ۲",
      lore: "The first iron weapon forged in Pars — earned by mastering Hushang's chapter. The axe that built civilization and defended it in the same breath.",
      lore_fa: "نخستین سلاح آهنین ساخته‌شده در پارس — با تسلط بر دفترِ هوشنگ به دست آمده. تبری که تمدن را هم ساخت و هم از آن دفاع کرد.",
      biography: "Forged at the first iron forge on the slopes of Pars. Hushang's iron axe is both a weapon and a symbol — the first time humanity turned the gift of fire into something that could both build and defend. The axe was awarded to those who mastered the chapter's secrets.",
      biography_fa: "در نخستین آهنگری بر دامنه‌های پارس ساخته شده. تبر آهنینِ هوشنگ هم سلاح است و هم نماد — نخستین باری که بشریت هدیه‌ی آتش را به چیزی تبدیل کرد که هم می‌سازد و هم دفاع می‌کند.",
      faction: "Pishdad Regalia · Iron Age · Mountain Court Artifacts",
      faction_fa: "نشان پیشدادیان · عصر آهن · آثار دربار کوهستانی",
      mythologyRole: "First iron weapon; bridge between the age of fire and the age of iron; relic of mastery",
      mythologyRole_fa: "نخستین سلاح آهنین؛ پل میان عصر آتش و عصر آهن؛ یادگار تسلط",
      powers: ["+9% Tap Power", "+25 Zar/hr", "Passive: Iron Will — perfect-answer XP +10%"],
      powers_fa: ["+۹٪ قدرت ضربه", "+۲۵ Zar/ساعت", "غیرفعال: اراده‌ی آهنین — XP پاسخ کامل +۱۰٪"],
      storyAppearances: ["Chapter 2: The Age of Craft", "Chapter 2 Quiz Reward: The Iron Axe"],
      storyAppearances_fa: ["فصل ۲: عصر صنعت", "پاداش آزمون فصل ۲: تبر آهنین"],
      side: "light", nftReady: false, collectionId: "SHAHNAMEH-S2-CH2-003",
      season: 2, order: 18, cost: 5500, prereq: { hero_id: "hushang", level: 3 },
      unlockCondition: "Complete Chapter 2 · Own Hushang Lv.3",
      unlockCondition_fa: "فصل ۲ را کامل کنید · هوشنگ Lv.۳ داشته باشید",
      role_tg: "Аввалин Аслиҳаи Оҳанин · Ёдгори Боби 2", lore_tg: "Аввалин аслиҳаи оҳанин сохташуда дар Порс — бо тасаллут бар бобои Ҳушанг ба даст омада.",
      biography_tg: "Дар аввалин оҳангарӣ дар доманаҳои Порс сохта шудааст. Табари оҳанини Ҳушанг ҳам аслиҳа аст ва ҳам рамз.",
      faction_tg: "Нишонаи Пешдодиён · Асри Оҳан · Осори Дарбори Кӯҳӣ",
      mythologyRole_tg: "Аввалин аслиҳаи оҳанин; пул байни асри оташ ва асри оҳан; ёдгори тасаллут",
      powers_tg: ["+9% Қудрати зарба", "+25 Zar/соат", "Ғайрифаъол: Иродаи Оҳанин — XP ҷавоби комил +10%"],
      storyAppearances_tg: ["Боби 2: Асри Ҳунар", "Ҷоизаи Имтиҳони Боби 2: Табари Оҳанин"],
      unlockCondition_tg: "Боби 2-ро иҷро кунед · Ҳушанг Lv.3 дошта бошед",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "tahmuras-hero", name: "Tahmuras", name_fa: "تهمورث",
      type: "character", rarity: "rare", chapter: 2, emoji: "⚔",
      img: "/season2/uploads/chapters/tahmuras.png?v=1778880294493",
      role: "Div-band · Son of Hushang · Heir to the Forge", role_fa: "دیوبند · پسر هوشنگ · وارث آهنگری",
      lore: "Hushang's son. He watches the forge, counts the demons that fled to the hills, and makes a list. In the next chapter he will use it.",
      lore_fa: "پسر هوشنگ. آهنگری پدرش را می‌نگرد، دیوانی را که به تپه‌ها گریختند می‌شمارد و فهرستی می‌سازد. در دفتر بعدی از آن بهره خواهد برد.",
      biography: "Son of Hushang, heir to the fire and the forge. Tahmuras will take the crafts his father built and carry them into a darker test: wrestling the demons of the world, forcing Ahriman himself to become his mount, and trading the lives of the bound demon host for thirty alphabets. The written word enters the world through his mercy.",
      biography_fa: "پسر هوشنگ، وارث آتش و آهنگری. تهمورث هنرهای پدرش را می‌گیرد و در رویارویی تاریک‌تری به‌کار می‌بندد: کشتی با دیوان، اهریمن را مرکب‌کردن، و معامله جانِ سپاهِ دیوانِ به‌زنجیرکشیده با سی الفبا.",
      faction: "Pishdad Line · Civilizing Kings · Div-band",
      faction_fa: "خط پیشدادیان · پادشاهان متمدن‌ساز · دیوبند",
      mythologyRole: "Third king; demon-binder; father of writing; bridge between the age of iron and the age of the word",
      mythologyRole_fa: "سومین شاه؛ دیوبند؛ پدر نوشتار؛ پل میان عصر آهن و عصر کلام",
      powers: ["+7% Tap Power", "+12 Zar/hr", "Passive: Div-band — chapter gate costs –5%"],
      powers_fa: ["+۷٪ قدرت ضربه", "+۱۲ Zar/ساعت", "غیرفعال: دیوبند — هزینه‌ی دروازه‌ی فصل −۵٪"],
      storyAppearances: ["Chapter 2 Finale: The Next King", "Chapter 3: Tahmuras — Binder of Demons"],
      storyAppearances_fa: ["پایان فصل ۲: شاه بعدی", "فصل ۳: تهمورث — دیوبند"],
      side: "light", nftReady: false, collectionId: "SHAHNAMEH-S2-CH2-004",
      season: 2, order: 19, cost: 3500, prereq: { hero_id: "hushang", level: 2 },
      unlockCondition: "Complete Chapter 2 · Own Hushang Lv.2",
      unlockCondition_fa: "فصل ۲ را کامل کنید · هوشنگ Lv.۲ داشته باشید",
      role_tg: "Девбанд · Писари Ҳушанг · Вориси Оҳангарӣ", lore_tg: "Писари Ҳушанг. Оҳангарии падарашро менигарад, девонеро ки ба теппаҳо гурехтанд мешуморад ва рӯйхате месозад.",
      biography_tg: "Писари Ҳушанг, вориси оташ ва оҳангарӣ. Таҳмурас ҳунарҳои падарашро мегирад ва дар озмоиши торик-тар ба кор мебарад.",
      faction_tg: "Насли Пешдодиён · Шоҳони Тамаддунсоз · Девбанд",
      mythologyRole_tg: "Шоҳи сеюм; девбанд; падари навиштан; пул байни асри оҳан ва асри калом",
      powers_tg: ["+7% Қудрати зарба", "+12 Zar/соат", "Ғайрифаъол: Девбанд — хароҷоти дарвозаи боб −5%"],
      storyAppearances_tg: ["Хотимаи Боби 2: Шоҳи Баъдӣ", "Боби 3: Таҳмурас — Девбанд"],
      unlockCondition_tg: "Боби 2-ро иҷро кунед · Ҳушанг Lv.2 дошта бошед",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    /* ── Chapter 3 (Tahmuras) ─────────────────────────────── */
    {
      id: "tahmuras-king", name: "Tahmuras — Div-band", name_fa: "تهمورث — دیوبند",
      type: "character", rarity: "legend", chapter: 3, emoji: "⛓",
      img: "/season2/uploads/chapters/tahmuras.png?v=1778880294493",
      role: "Third King · Demon-Binder · Father of Writing", role_fa: "سومین شاه · دیوبند · پدر نوشتار",
      lore: "He saddled Ahriman himself. He chained two-thirds of the demon host. He accepted thirty alphabets in exchange for mercy. The written word is his legacy.",
      lore_fa: "خودِ اهریمن را مرکب کرد. دوسوم سپاه دیوان را به زنجیر کشید. سی الفبا را در ازای رحمت پذیرفت. کلام نوشتاری میراث اوست.",
      biography: "Son of Hushang, third king of the world. Tahmuras forced Ahriman himself to serve as his mount, rode through the demon realm, and bound the entire demon host. Two-thirds begged for their lives — and offered something no iron could win: thirty alphabets. Tahmuras accepted. His short reign planted the seed of every letter ever written.",
      biography_fa: "پسر هوشنگ، سومین شاه جهان. تهمورث خود اهریمن را مجبور به مرکب‌شدنش کرد، از میان قلمرو دیوان تاخت و سپاه دیوان را به‌زنجیر کشید. دوسوم جانشان را طلبیدند و چیزی پیشنهاد دادند که هیچ آهنی نمی‌توانست به دست آورد: سی الفبا. تهمورث پذیرفت.",
      faction: "Pishdad Line · Div-band Kings · Age of Writing",
      faction_fa: "خط پیشدادیان · شاهان دیوبند · عصر نوشتار",
      mythologyRole: "Demon-binder; conqueror of Ahriman; father of the alphabet; third king of the Shahnameh's early age",
      mythologyRole_fa: "دیوبند؛ فاتح اهریمن؛ پدر الفبا؛ سومین شاه در عصر نخستین شاهنامه",
      powers: ["+10% Tap Power", "+30 Zar/hr", "Passive: Binder's Will — quiz tier unlock XP +15%"],
      powers_fa: ["+۱۰٪ قدرت ضربه", "+۳۰ Zar/ساعت", "غیرفعال: اراده‌ی دیوبند — XP باز شدن سطح آزمون +۱۵٪"],
      storyAppearances: ["Chapter 3: All Scenes", "Chapter 3 Boss: The Demon Host"],
      storyAppearances_fa: ["فصل ۳: همه‌ی صحنه‌ها", "رئیس فصل ۳: سپاه دیوان"],
      side: "light", nftReady: false, collectionId: "SHAHNAMEH-S2-CH3-001",
      season: 2, order: 20, cost: 8000, prereq: null,
      unlockCondition: "Complete Chapter 3 · Binder of Demons",
      unlockCondition_fa: "فصل ۳ را کامل کنید · دیوبند",
      role_tg: "Шоҳи Сеюм · Девбанд · Падари Навиштан", lore_tg: "Худи Аҳриманро мархаба кард. Ду сеяки лашкари девонро банд кард. Си алифборо дар ивази раҳм пазируфт.",
      biography_tg: "Писари Ҳушанг, шоҳи сеюми ҷаҳон. Таҳмурас Аҳриманро маҷбур кард мархабааш шавад, аз қаламрови девон тохт ва лашкари девонро банд кард.",
      faction_tg: "Насли Пешдодиён · Шоҳони Девбанд · Асри Навиштан",
      mythologyRole_tg: "Девбанд; фотеҳи Аҳриман; падари алифбо; шоҳи сеюм дар асри аввали Шоҳнома",
      powers_tg: ["+10% Қудрати зарба", "+30 Zar/соат", "Ғайрифаъол: Иродаи Девбанд — XP кушоиши дараҷаи имтиҳон +15%"],
      storyAppearances_tg: ["Боби 3: Ҳама Саҳнаҳо", "Рейси Боби 3: Лашкари Девон"],
      unlockCondition_tg: "Боби 3-ро иҷро кунед · Девбанд",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "cypress-club-card", name: "The Cypress Club", name_fa: "چوبِ سرو",
      type: "artifact", rarity: "epic", chapter: 3, emoji: "🌲",
      img: "/season2/uploads/heroes/cypres_club.png",
      role: "Weapon of Binding · Relic of Chapter 3", role_fa: "سلاح به‌زنجیرکشیدن · یادگار فصل ۳",
      lore: "A club of cypress-wood — a craftsman's tool turned royal weapon. Tahmuras carried it through the demon realm and bound the world's darkness with it.",
      lore_fa: "چوبدستی از درختِ سرو — ابزار هنرمند که به سلاح شاهی بدل شده. تهمورث آن را از میان قلمرو دیوان برد و تاریکی جهان را با آن به زنجیر کشید.",
      biography: "The weapon Tahmuras carried when he entered the demon realm. Cypress was sacred: it grows straight, burns clean, and outlasts almost everything planted beside it. With this club and by riding Ahriman as his mount, Tahmuras bound the demon host and earned the thirty alphabets. Awarded to those who master chapter 3.",
      biography_fa: "سلاحی که تهمورث هنگام ورود به قلمروی دیوان با خود داشت. سرو مقدس بود: مستقیم می‌روید، پاک می‌سوزد و تقریباً از همه چیزی که کنارش کاشته می‌شود دوام می‌آورد. با این چوب و با سواری بر اهریمن، تهمورث سپاه دیوان را به زنجیر کشید.",
      faction: "Pishdad Regalia · Age of Iron · Sacred Wood",
      faction_fa: "نشان پیشدادیان · عصر آهن · چوب مقدس",
      mythologyRole: "Weapon of the binding; symbol of Tahmuras' mastery over darkness; relic of the age of writing",
      mythologyRole_fa: "سلاح به‌زنجیرکشیدن؛ نماد تسلط تهمورث بر تاریکی؛ یادگار عصر نوشتار",
      powers: ["+8% Tap Power", "+22 Zar/hr", "Passive: Binding Force — battle gate prereq level –1"],
      powers_fa: ["+۸٪ قدرت ضربه", "+۲۲ Zar/ساعت", "غیرفعال: نیروی زنجیر — سطح مورد نیاز دروازه‌ی نبرد −۱"],
      storyAppearances: ["Chapter 3: Demons at the Edge", "Chapter 3: Chain by Chain"],
      storyAppearances_fa: ["فصل ۳: دیوان بر کرانه", "فصل ۳: زنجیر به زنجیر"],
      side: "light", nftReady: false, collectionId: "SHAHNAMEH-S2-CH3-002",
      season: 2, order: 21, cost: 5500, prereq: { hero_id: "tahmuras-king", level: 1 },
      unlockCondition: "Complete Chapter 3 · Own Tahmuras",
      unlockCondition_fa: "فصل ۳ را کامل کنید · تهمورث داشته باشید",
      role_tg: "Аслиҳаи Банд Кардан · Ёдгори Боби 3", lore_tg: "Чӯби сарв — абзори ҳунарманд, ки ба аслиҳаи шоҳӣ табдил шудааст. Таҳмурас онро аз қаламрови девон бурд.",
      biography_tg: "Аслиҳае ки Таҳмурас ҳангоми ворид шудан ба қаламрови девон бо худ дошт. Сарв муқаддас буд: рост мерӯяд, пок месӯзад.",
      faction_tg: "Нишонаи Пешдодиён · Асри Оҳан · Чӯби Муқаддас",
      mythologyRole_tg: "Аслиҳаи бандкардан; рамзи тасаллути Таҳмурас бар торикӣ; ёдгори асри навиштан",
      powers_tg: ["+8% Қудрати зарба", "+22 Zar/соат", "Ғайрифаъол: Нирӯи Занҷир — сатҳи лозимаи дарвозаи набард −1"],
      storyAppearances_tg: ["Боби 3: Девон дар Канора", "Боби 3: Занҷир ба Занҷир"],
      unlockCondition_tg: "Боби 3-ро иҷро кунед · Таҳмурасро дошта бошед",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "thirty-scripts", name: "The Thirty Alphabets", name_fa: "سی الفبا",
      type: "codex", rarity: "legend", chapter: 3, emoji: "📜",
      img: "/season2/uploads/heroes/thirty_alphabets.png",
      role: "Origin of Writing · The Bargain of Mercy", role_fa: "سرآغاز نوشتار · معامله‌ی رحمت",
      lore: "Greek. Tazi. Pahlavi. Sogdian. Twenty-six more. The demons taught thirty scripts to keep their lives. Knowledge was bought with mercy — and the world could finally remember itself.",
      lore_fa: "یونانی. تازی. پهلوی. سغدی. بیست‌وشش تای دیگر. دیوان سی خط را آموختند تا جانشان را نگه دارند. دانش با رحمت خریده شد — و جهان بالاخره می‌توانست خود را به یاد بسپارد.",
      biography: "The thirty alphabets taught by the demon scribes to Tahmuras in exchange for their lives. Greek first — angular, proud. Then Tazi, Pahlavi, Sogdian, and twenty-six more. Tahmuras sat with the clay tablets through the night, copying each shape until his hands knew them. Then he taught his children. Every word ever written carries a debt to this bargain.",
      biography_fa: "سی الفبایی که کاتبان دیو به تهمورث آموختند در ازای جانشان. ابتدا یونانی — زاویه‌دار، باشکوه. بعد تازی، پهلوی، سغدی و بیست‌وشش تای دیگر. تهمورث تا صبح با لوح‌های گِلی نشست و هر شکل را تکرار کرد. هر واژه‌ای که نوشته شده وامدار این معامله است.",
      faction: "Sacred Knowledge · Age of Writing · Pishdad Achievement",
      faction_fa: "دانش مقدس · عصر نوشتار · دستاورد پیشدادیان",
      mythologyRole: "Origin of writing in the Shahnameh; triumph of mercy over force; birth of human memory",
      mythologyRole_fa: "سرآغاز نوشتار در شاهنامه؛ پیروزی رحمت بر زور؛ تولد حافظه‌ی بشری",
      powers: ["+12% Story XP", "+35 Zar/hr", "Passive: Written Memory — hard quiz XP +20%"],
      powers_fa: ["+۱۲٪ تجربه داستان", "+۳۵ Zar/ساعت", "غیرفعال: حافظه‌ی نوشتاری — XP آزمون سخت +۲۰٪"],
      storyAppearances: ["Chapter 3: The Bargain", "Chapter 3: Thirty Alphabets"],
      storyAppearances_fa: ["فصل ۳: معامله", "فصل ۳: سی الفبا"],
      side: "light", nftReady: false, collectionId: "SHAHNAMEH-S2-CH3-003",
      season: 2, order: 22, cost: 9000, farr_cost: 1, prereq: { hero_id: "tahmuras-king", level: 2 },
      unlockCondition: "Complete Chapter 3 · Own Tahmuras Lv.2",
      unlockCondition_fa: "فصل ۳ را کامل کنید · تهمورث Lv.۲ داشته باشید",
      role_tg: "Сарчашмаи Навиштан · Муомилаи Раҳм", lore_tg: "Юнонӣ. Тозӣ. Паҳлавӣ. Суғдӣ. Бист ва шаш дигар. Девон си хатро омӯхтанд то ҷонашонро нигоҳ доранд.",
      biography_tg: "Си алифбое ки котибони дев ба Таҳмурас омӯхтанд дар ивази ҷонашон. Аввал юнонӣ. Сипас тозӣ, паҳлавӣ, суғдӣ ва бист ва шаш дигар. Ҳар вожае навишташуда вомдори ин муомила аст.",
      faction_tg: "Дониши Муқаддас · Асри Навиштан · Дастоварди Пешдодиён",
      mythologyRole_tg: "Сарчашмаи навиштан дар Шоҳнома; ғалабаи раҳм бар зӯр; таваллуди хотираи башарӣ",
      powers_tg: ["+12% Таҷрибаи ҳикоя", "+35 Zar/соат", "Ғайрифаъол: Хотираи Хаттӣ — XP имтиҳони душвор +20%"],
      storyAppearances_tg: ["Боби 3: Муомила", "Боби 3: Си Алифбо"],
      unlockCondition_tg: "Боби 3-ро иҷро кунед · Таҳмурас Lv.2 дошта бошед",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    /* ── Chapter 4 (Jamshid) ──────────────────────────────── */
    {
      id: "jamshid", name: "Jamshid", name_fa: "جمشید",
      type: "character", rarity: "legend", chapter: 4, emoji: "☀",
      img: "/season2/uploads/chapters/jamshid.png?v=1778880394377",
      role: "Fourth King · World-Builder · Fallen Sun", role_fa: "چهارمین شاه · سازنده‌ی جهان · خورشید افتاده",
      lore: "He divided civilization into four orders. He raised a crystal throne. He gave the world Nowruz. He ruled for three hundred years without a death. Then he claimed to be god — and lost everything.",
      lore_fa: "تمدن را به چهار طبقه تقسیم کرد. تخت بلورین برافراشت. نوروز را به جهان داد. سیصد سال بدون یک مرگ حکم راند. بعد ادعا کرد خداست — و همه چیز را از دست داد.",
      biography: "Son of Tahmuras. Jamshid organized civilization into four orders — Mobeds, Arteshtars, Vastoshan, Ahnukhoshian. He built the crystal throne, rode into the sky on Nowruz, and gave the world three hundred years without death. Then pride replaced wisdom. He claimed to be the source of all things. The farr departed — and from the south, Zahhak began walking north.",
      biography_fa: "پسر تهمورث. جمشید تمدن را به چهار طبقه — موبدان، ارتشتاران، واستوشان، اهنوخوشان — سازمان داد. تخت بلورین ساخت، در نوروز به آسمان رفت و سیصد سال بدون مرگ به جهان داد. بعد غرور جای خرد را گرفت.",
      faction: "Pishdad Line · Golden Age · Crystal Throne",
      faction_fa: "خط پیشدادیان · عصر طلایی · تخت بلورین",
      mythologyRole: "Fourth king; giver of Nowruz; organizer of civilization; warning against pride; the chronicle's first great tragedy",
      mythologyRole_fa: "چهارمین شاه؛ بخشنده‌ی نوروز؛ سازمان‌دهنده‌ی تمدن؛ هشدار از غرور؛ نخستین تراژدی بزرگ این تاریخ",
      powers: ["+11% Tap Power", "+40 Zar/hr", "Passive: Crystal Farr — farr resource gains +10%"],
      powers_fa: ["+۱۱٪ قدرت ضربه", "+۴۰ Zar/ساعت", "غیرفعال: فرّ بلورین — دریافتِ منبع فرّ +۱۰٪"],
      storyAppearances: ["Chapter 4: All Scenes", "Chapter 4 Boss: The Pride of Jamshid"],
      storyAppearances_fa: ["فصل ۴: همه‌ی صحنه‌ها", "رئیس فصل ۴: غرور جمشید"],
      side: "light", nftReady: false, collectionId: "SHAHNAMEH-S2-CH4-001",
      season: 2, order: 23, cost: 10000, prereq: null,
      unlockCondition: "Complete Chapter 4 · The Golden Throne",
      unlockCondition_fa: "فصل ۴ را کامل کنید · تخت زرین",
      role_tg: "Шоҳи Чорум · Созандаи Ҷаҳон · Офтоби Афтода", lore_tg: "Тамаддунро ба чаҳор табақа тақсим кард. Тахти булурин бино кард. Наврӯзро ба ҷаҳон дод. Сесад сол бе марг ҳукм ронд. Баъд иддаъо кард худост — ва ҳама чизро аз даст дод.",
      biography_tg: "Писари Таҳмурас. Ҷамшид тамаддунро ба чаҳор табақа — Мӯбадон, Арташторон, Вастӯшон, Аҳнухӯшон — ташкил дод.",
      faction_tg: "Насли Пешдодиён · Асри Тиллоӣ · Тахти Булурин",
      mythologyRole_tg: "Шоҳи чорум; дихандаи Наврӯз; ташкилдиҳандаи тамаддун; огоҳӣ аз ғурур; аввалин фоҷиаи бузурги ин таърих",
      powers_tg: ["+11% Қудрати зарба", "+40 Zar/соат", "Ғайрифаъол: Фарри Булурин — дарёфти манбаи фарр +10%"],
      storyAppearances_tg: ["Боби 4: Ҳама Саҳнаҳо", "Рейси Боби 4: Ғурури Ҷамшид"],
      unlockCondition_tg: "Боби 4-ро иҷро кунед · Тахти Тиллоӣ",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "crystal-throne-card", name: "The Crystal Throne", name_fa: "تختِ بلورین",
      type: "artifact", rarity: "legend", chapter: 4, emoji: "💎",
      img: "/season2/uploads/heroes/crystal_throne.png",
      role: "Throne of the Golden Age · Symbol of Jamshid's Height", role_fa: "تخت عصر طلایی · نماد اوج جمشید",
      lore: "Built over three years. Facets aligned with sunrise. Joints invisible. On Nowruz it blazes in the sky like a second sun. The ruins of Persepolis still carry its name.",
      lore_fa: "طی سه سال ساخته شده. وجه‌ها با طلوع آفتاب هم‌راستا. درزها نامرئی. در نوروز در آسمان چون خورشید دوم می‌درخشد. ویرانه‌های تخت‌جمشید هنوز نامش را با خود دارند.",
      biography: "Jamshid spent three years building it — not because crystal is hard to work, but because every joint had to be invisible and every facet aligned with the angles of sunrise. On the first Nowruz he sat on it and commanded the demons to lift him. The sky blazed. The people watching below called the day Nowruz. The ruins of Persepolis were named Takht-e Jamshid — Jamshid's Throne — by all who came after.",
      biography_fa: "جمشید سه سال صرف ساختن آن کرد — نه چون کار کردن با بلور سخت است، بلکه چون هر درزی باید نامرئی باشد. در اولین نوروز روی آن نشست. آسمان درخشید. مردم پایین روز را نوروز نامیدند. ویرانه‌های تخت‌جمشید «تخت جمشید» نامیده شد.",
      faction: "Pishdad Regalia · Golden Age Artifacts · Crystal Age",
      faction_fa: "نشان پیشدادیان · آثار عصر طلایی · عصر بلور",
      mythologyRole: "Greatest artifact of the early Shahnameh; origin of Nowruz; symbol of civilization at its peak",
      mythologyRole_fa: "بزرگ‌ترین اثر عصر نخستین شاهنامه؛ سرآغاز نوروز؛ نماد تمدن در اوجش",
      powers: ["+14% Story XP", "+45 Zar/hr", "Passive: Crystal Light — farr cost on cards –1"],
      powers_fa: ["+۱۴٪ تجربه داستان", "+۴۵ Zar/ساعت", "غیرفعال: نور بلورین — هزینه‌ی فرّ کارت‌ها −۱"],
      storyAppearances: ["Chapter 4: The Crystal Throne", "Chapter 4: The Nowruz Ascent"],
      storyAppearances_fa: ["فصل ۴: تخت بلورین", "فصل ۴: صعود نوروز"],
      side: "light", nftReady: false, collectionId: "SHAHNAMEH-S2-CH4-002",
      season: 2, order: 24, cost: 12000, farr_cost: 1, prereq: { hero_id: "jamshid", level: 2 },
      unlockCondition: "Complete Chapter 4 · Own Jamshid Lv.2",
      unlockCondition_fa: "فصل ۴ را کامل کنید · جمشید Lv.۲ داشته باشید",
      role_tg: "Тахти Асри Тиллоӣ · Рамзи Авҷи Ҷамшид", lore_tg: "Дар тӯли се сол сохта шуд. Вуҷуҳо бо тулӯъи офтоб ҳамроста. Дарзҳо ноаён. Дар Наврӯз дар осмон мисли офтоби дуввум медурахшад.",
      biography_tg: "Ҷамшид се сол барои сохтани он сарф кард. Дар аввалин Наврӯз бар он нишаст ва ба девон амр дод боло бибаранд. Осмон дурахшид. Мардуми поён рӯзро Наврӯз номиданд.",
      faction_tg: "Нишонаи Пешдодиён · Осори Асри Тиллоӣ · Асри Булур",
      mythologyRole_tg: "Бузургтарин осори асри аввали Шоҳнома; сарчашмаи Наврӯз; рамзи тамаддун дар авҷаш",
      powers_tg: ["+14% Таҷрибаи ҳикоя", "+45 Zar/соат", "Ғайрифаъол: Нури Булурин — хароҷоти фарри корт −1"],
      storyAppearances_tg: ["Боби 4: Тахти Булурин", "Боби 4: Болорафтани Наврӯз"],
      unlockCondition_tg: "Боби 4-ро иҷро кунед · Ҷамшид Lv.2 дошта бошед",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },
    {
      id: "zahhak-shadow", name: "Zahhak", name_fa: "ضحاک",
      type: "character", rarity: "mythic", chapter: 4, emoji: "🐍",
      img: "/season2/uploads/chapters/zahhak.png?v=1778880472603",
      role: "The Coming Darkness · Serpent King", role_fa: "تاریکی در راه · شاه مار",
      lore: "He is only walking in this chapter — no serpents yet. But the Shahnameh places him in view the moment the farr departs Jamshid. Every departure of light is an arrival of darkness.",
      lore_fa: "در این دفتر فقط دارد می‌آید — هنوز بی‌مار. اما شاهنامه او را درست در لحظه رفتن فرّ از جمشید به نمایش می‌گذارد. هر رفتن روشنایی یک آمدن تاریکی هم هست.",
      biography: "Born of an Arab lord in the southern desert. Raised on ambition and a whisper from Ahriman. In chapter 4 he is only walking north — no serpents on his shoulders yet, no thousand years of darkness. But the Shahnameh introduces him the moment Jamshid loses the farr. Two black serpents will grow from his shoulders. Each day they will demand two human brains.",
      biography_fa: "زاده ارباب عربی در صحرای جنوبی. با بلندپروازی و نجوای اهریمن پرورش یافته. در فصل چهارم فقط به شمال می‌آید — هنوز ماران بر شانه‌هایش ندارد. اما دو مار سیاه از شانه‌هایش خواهند رویید. هر روز دو مغز انسانی مطالبه خواهند کرد.",
      faction: "Forces of Darkness · Serpent Court · Coming Age of Tyrants",
      faction_fa: "نیروهای تاریکی · دربار مار · عصر در راه ستمگران",
      mythologyRole: "Fifth king; instrument of Ahriman; the chronicle's first true tyrant; one thousand years of darkness",
      mythologyRole_fa: "پنجمین شاه؛ ابزار اهریمن؛ اولین ستمگر واقعی این تاریخ؛ هزار سال تاریکی",
      powers: ["+12% Combo Duration", "Risk: +20% Energy Cost", "Passive: Serpent Power — rare drop rate ×2 but volatile"],
      powers_fa: ["+۱۲٪ مدت کمبو", "ریسک: +۲۰٪ هزینه‌ی انرژی", "غیرفعال: قدرت مار — نرخ افت نادر ×۲ اما متغیر"],
      storyAppearances: ["Chapter 4: The Shadow from the South", "Chapter 5: The Serpent King"],
      storyAppearances_fa: ["فصل ۴: سایه از جنوب", "فصل ۵: شاه مار"],
      side: "dark", nftReady: false, collectionId: "SHAHNAMEH-S2-CH4-003",
      season: 2, order: 25, cost: 20000, farr_cost: 2, prereq: { hero_id: "jamshid", level: 3 },
      unlockCondition: "Complete Chapter 4 · Own Jamshid Lv.3 · 2 Farr",
      unlockCondition_fa: "فصل ۴ را کامل کنید · جمشید Lv.۳ · ۲ فرّ داشته باشید",
      role_tg: "Торикии Дар Роҳ · Шоҳи Мор", lore_tg: "Дар ин боб фақат дорад меравад — ҳанӯз бе мор. Аммо Шоҳнома ӯро маҳз дар лаҳзаи рафтани фарри Ҷамшид намоиш медиҳад.",
      biography_tg: "Зодаи арбоби арабӣ дар биёбони ҷанубӣ. Бо баландпарвозӣ ва наҷвои Аҳриман парвариш ёфтааст. Дар боби 4 фақат ба шимол меравад — ҳанӯз морон бар китфонаш надорад.",
      faction_tg: "Нирӯҳои Торикӣ · Дарбори Мор · Асри Дар Роҳи Ситамгарон",
      mythologyRole_tg: "Шоҳи панҷум; абзори Аҳриман; аввалин ситамгари воқеии ин таърих; ҳазор соли торикӣ",
      powers_tg: ["+12% Давомнокии комбо", "Хатар: +20% Хароҷоти энергия", "Ғайрифаъол: Қудрати Мор — суръати афти нодир ×2 аммо тағйирёбанда"],
      storyAppearances_tg: ["Боби 4: Сояи Аз Ҷануб", "Боби 5: Шоҳи Мор"],
      unlockCondition_tg: "Боби 4-ро иҷро кунед · Ҷамшид Lv.3 · 2 Фарр дошта бошед",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    },

    /* ── HAFT KHAN-E ROSTAM — The Seven Labours ─────────────────────────── */
    {
      id: "rakhsh", name: "Rakhsh — The Legendary Steed",
      name_fa: "رخش — اسبِ افسانه‌ای", name_tg: "Рахш — Аспи Афсонавӣ",
      type: "character", rarity: "legend", chapter: "haft-khan",
      img: "/season2/uploads/heroes/rostam.png",
      emoji: "🐎",
      role: "Khan 1 · Rostam's Steed · The Sleeping Hero's Arm",
      role_fa: "خانِ اول · رخشِ رستم · بازویِ قهرمانِ خفته",
      lore: "While Rostam slept exhausted in the reed bed, a lion came. Rakhsh fought and killed it alone without waking his master. The first of the Seven Labours was won by a horse. Ferdowsi's lesson: trust given to the faithful is never wasted.",
      lore_fa: "در حالی که رستم خسته در نیزار خوابیده بود، شیری آمد. رخش آن را تنها کشت بدون آنکه اربابش را بیدار کند. خانِ اول توسطِ اسب برده شد.",
      biography: "Rostam pressed the back of ten thousand horses testing strength. Ten thousand buckled. Rakhsh held. He carried Rostam through every labour and every battle for decades — not a mount but a second self.",
      biography_fa: "رستم پشتِ ده هزار اسب را فشار داد تا قدرتشان را بسنجد. ده هزار خم شدند. رخش ایستاد.",
      faction: "Rostam's Circle · Haft Khan",
      mythologyRole: "Khan 1 · Loyal beyond duty · Fights when his master cannot",
      powers: ["+15% Tap Power", "+50 Zar/hr", "Passive: While You Sleep — offline ZAR income +8%"],
      powers_fa: ["+۱۵٪ قدرتِ ضربه", "+۵۰ زر/ساعت", "غیرفعال: در خواب — درآمدِ زرِ آفلاین +۸٪"],
      storyAppearances: ["Haft Khan — First Labour: The Lion"],
      side: "light", season: 2, order: 60, cost: 4000, zar_per_hour: 50,
      collectionId: "S2-HK-001", nftReady: false,
      unlockCondition: "Complete Chapter 10 (Rudabeh) · Rostam is born",
      unlockCondition_fa: "دفترِ ۱۰ (رودابه) را کامل کنید · رستم متولد شده",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan: true, haft_khan_order: 1,
    },
    {
      id: "mystical-ram", name: "The Mystical Ram — Desert Guide",
      name_fa: "قوچِ اسرارآمیز — راهنمای بیابان", name_tg: "Гӯсфанди Асрорӣ — Роҳнамои Биёбон",
      type: "creature", rarity: "rare", chapter: "haft-khan",
      img: "/season2/uploads/heroes/mount_alborz.png",
      emoji: "🐏",
      role: "Khan 2 · Divine Messenger · Guide Through the Burning Desert",
      role_fa: "خانِ دوم · فرستاده‌ی الهی · راهنما در بیابانِ سوزان",
      lore: "Rostam and Rakhsh crossed a waterless desert and were dying of thirst. Rostam prayed. A mystical ram appeared and led them to a hidden spring. The second labour is won by divine mercy — by knowing when to ask for help.",
      lore_fa: "رستم و رخش از بیابانِ بی‌آب گذشتند و از تشنگی داشتند می‌مردند. رستم دعا کرد. قوچی اسرارآمیز ظاهر شد و آن‌ها را به چشمه‌ای پنهان راهنمایی کرد.",
      biography: "The ram that led Rostam to water in the second labour is understood in the Shahnameh as a divine messenger — the form God takes when a hero who has earned mercy calls for it. The Oasis of Grace it revealed kept Rostam alive for every labour that followed.",
      biography_fa: "قوچی که رستم را در خانِ دوم به آب راهنمایی کرد در شاهنامه به‌عنوانِ فرستاده‌ای الهی فهمیده می‌شود.",
      faction: "Divine Messengers · Haft Khan",
      mythologyRole: "Khan 2 · Grace under extremity · Hidden providence",
      powers: ["+8% Daily Quest XP", "+35 Zar/hr", "Passive: Oasis Blessing — ZAR/hr bonus +5% every 24h login"],
      powers_fa: ["+۸٪ تجربه‌ی مأموریتِ روزانه", "+۳۵ زر/ساعت", "غیرفعال: برکتِ واحه — +۵٪ زر/ساعت هر ۲۴ساعت ورود"],
      storyAppearances: ["Haft Khan — Second Labour: The Desert"],
      side: "light", season: 2, order: 61, cost: 5000, zar_per_hour: 35,
      collectionId: "S2-HK-002", nftReady: false,
      prereq: { hero_id: "rakhsh", level: 1 },
      unlockCondition: "Own Rakhsh (Khan 1)",
      unlockCondition_fa: "رخش (خانِ اول) را داشته باشید",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan: true, haft_khan_order: 2,
    },
    {
      id: "azhdaha-shield", name: "Azhdaha — The Dragon-Skin Shield",
      name_fa: "اژدها — سپرِ پوستِ اژدها", name_tg: "Аждаҳо — Сипари Пӯсти Аждаҳо",
      type: "artifact", rarity: "epic", chapter: "haft-khan",
      img: "/season2/uploads/heroes/blak_demon.png",
      emoji: "🐉",
      role: "Khan 3 · Dragon Slayer's Trophy · Patience Forged Into Armor",
      role_fa: "خانِ سوم · غنیمتِ اژدهاکُش · صبر در قالبِ زره",
      lore: "A dragon attacked Rostam three nights in a row, vanishing each time Rakhsh woke him. Rostam grew impatient with the horse. The third night he saw the dragon himself — and understood that the horse had been right all along. Together they killed it. The shield made from its skin never forgets that lesson.",
      lore_fa: "سه شب اژدهایی به رستم حمله کرد و هر بار که رخش او را بیدار کرد ناپدید شد. رستم از اسبش عصبانی شد. شبِ سوم خودش اژدها را دید — و فهمید که اسب از همان ابتدا درست می‌گفت.",
      biography: "The Azhdaha (dragon) of the third labour is the Shahnameh's lesson about trust and patience. Rostam almost turned on his most loyal ally out of impatience. The shield made from the dragon's skin is the armor of that learned patience.",
      biography_fa: "اژدهای خانِ سوم درسِ شاهنامه درباره‌ی اعتماد و صبر است. رستم تقریباً به خاطرِ بی‌صبری به وفادارترین یارش حمله کرد.",
      faction: "Battle Trophies · Haft Khan",
      mythologyRole: "Khan 3 · Dragon's patience as armor · Trust earned through hardship",
      powers: ["+20% Defense vs negative events", "+70 Zar/hr", "Passive: Dragon's Patience — combo multiplier +0.3"],
      powers_fa: ["+۲۰٪ دفاع در برابرِ رویدادهای منفی", "+۷۰ زر/ساعت", "غیرفعال: صبرِ اژدها — ضربدهنده‌ی کومبو +۰.۳"],
      storyAppearances: ["Haft Khan — Third Labour: The Dragon"],
      side: "light", season: 2, order: 62, cost: 7000, zar_per_hour: 70,
      collectionId: "S2-HK-003", nftReady: false,
      prereq: { hero_id: "mystical-ram", level: 1 },
      unlockCondition: "Own Mystical Ram (Khan 2)",
      unlockCondition_fa: "قوچِ اسرارآمیز (خانِ دوم) را داشته باشید",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan: true, haft_khan_order: 3,
    },
    {
      id: "enchanted-lute", name: "The Enchanted Lute — Illusion's Trap",
      name_fa: "رباب جادویی — دامِ توهم", name_tg: "Рубоби Ҷодуӣ — Домгоҳи Иллюзия",
      type: "artifact", rarity: "epic", chapter: "haft-khan",
      img: "/season2/uploads/heroes/festival_of_sade.png",
      emoji: "🪕",
      role: "Khan 4 · The Sorceress's Undoing · See Through the Beautiful Lie",
      role_fa: "خانِ چهارم · فروپاشیِ جادوگر · دیدنِ دروغِ زیبا",
      lore: "Rostam found a feasting table in the wilderness. He played the lute, sang his sorrows. A beautiful woman appeared and offered wine. When Rostam spoke the name of God, she became a hideous witch. He killed her with his lasso. The lute remains — the instrument that exposed the illusion.",
      lore_fa: "رستم سفره‌ای پر از خوراک در بیابان یافت. ربابی نواخت، غم‌هایش را خواند. زنی زیبا ظاهر شد و شراب پیشنهاد داد. وقتی رستم نامِ خدا را برد، به پیرزنی زشت تبدیل شد. او را با کمند کشت.",
      biography: "The fourth labour is the Shahnameh's test of discernment. The sorceress offers everything pleasant — food, wine, beauty. She is undone by a single word of truth. The enchanted lute Rostam played that night is the instrument of that truth.",
      biography_fa: "خانِ چهارم آزمونِ شاهنامه درباره‌ی تشخیص است. جادوگر همه چیزِ خوشایند پیشنهاد می‌دهد — خوراک، شراب، زیبایی. با یک کلمه‌ی حقیقت نابود می‌شود.",
      faction: "Wisdom Artifacts · Haft Khan",
      mythologyRole: "Khan 4 · Truth that breaks illusion · The test of discernment",
      powers: ["+1 Quiz hint per chapter tier", "+85 Zar/hr", "Passive: True Sight — identify hidden rewards +12%"],
      powers_fa: ["+۱ راهنمای آزمون هر ردیف", "+۸۵ زر/ساعت", "غیرفعال: بینشِ حقیقی — یافتنِ پاداش‌های پنهان +۱۲٪"],
      storyAppearances: ["Haft Khan — Fourth Labour: The Sorceress"],
      side: "light", season: 2, order: 63, cost: 9000, zar_per_hour: 85,
      collectionId: "S2-HK-004", nftReady: false,
      prereq: { hero_id: "azhdaha-shield", level: 1 },
      unlockCondition: "Own Azhdaha Shield (Khan 3)",
      unlockCondition_fa: "سپرِ اژدها (خانِ سوم) را داشته باشید",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan: true, haft_khan_order: 4,
    },
    {
      id: "awlad-guide", name: "Awlad — The Captured Guide",
      name_fa: "اولاد — راهنمای اسیر", name_tg: "Авлод — Роҳнамои Асир",
      type: "character", rarity: "legend", chapter: "haft-khan",
      img: "/season2/uploads/heroes/thirty_alphabets.png",
      emoji: "🗺",
      role: "Khan 5 · Tactics Multiplier · The Enemy Made Useful",
      role_fa: "خانِ پنجم · ضربدهنده‌ی تاکتیک · دشمنی که مفید شد",
      lore: "Rostam entered Mazandaran and let Rakhsh graze on a local field. The warden Awlad attacked with his men. Rostam overcame them and captured Awlad, promising to make him king of Mazandaran if he guided faithfully. Awlad accepted. The fifth labour is about turning an obstacle into an asset.",
      lore_fa: "رستم وارد مازندران شد. نگهبانِ اولاد با مردانش حمله کرد. رستم آن‌ها را شکست داد و اولاد را گرفتار کرد، قول داد اگر وفادارانه راهنمایی کند او را شاهِ مازندران کند. اولاد پذیرفت.",
      biography: "Awlad is the Shahnameh's lesson about transforming opposition. He attacks, fails, and becomes the key to the whole mission. Every obstacle has information. The wise warrior extracts that information instead of simply destroying the obstacle.",
      biography_fa: "اولاد درسِ شاهنامه درباره‌ی تبدیلِ مخالفت است. حمله می‌کند، شکست می‌خورد و کلیدِ کلِ مأموریت می‌شود.",
      faction: "Tactics Cards · Haft Khan",
      mythologyRole: "Khan 5 · Obstacle turned ally · Intelligence extracted from defeat",
      powers: ["+20% ZAR/hr on all heroes (Tactics Multiplier)", "+100 Zar/hr", "Passive: Revealed Path — hidden map resources unlock +15%"],
      powers_fa: ["+۲۰٪ زر/ساعت روی همه‌ی قهرمانان (ضربدهنده‌ی تاکتیک)", "+۱۰۰ زر/ساعت", "غیرفعال: مسیرِ آشکارشده — منابعِ پنهانِ نقشه +۱۵٪"],
      storyAppearances: ["Haft Khan — Fifth Labour: Awlad the Guide"],
      side: "light", season: 2, order: 64, cost: 12000, zar_per_hour: 100,
      collectionId: "S2-HK-005", nftReady: false,
      prereq: { hero_id: "enchanted-lute", level: 1 },
      unlockCondition: "Own Enchanted Lute (Khan 4)",
      unlockCondition_fa: "رباب جادویی (خانِ چهارم) را داشته باشید",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan: true, haft_khan_order: 5,
    },
    {
      id: "arzhang-trophy", name: "Arzhang Div's Head — Trophy of Terror",
      name_fa: "سرِ ارژنگ دیو — غنیمتِ وحشت", name_tg: "Сари Аржанги Дев — Ғанимати Ваҳшат",
      type: "artifact", rarity: "mythic", chapter: "haft-khan",
      img: "/season2/uploads/heroes/blak_demon.png",
      emoji: "💀",
      role: "Khan 6 · Demon General's Trophy · Raw Power Made Visible",
      role_fa: "خانِ ششم · غنیمتِ سردارِ دیو · قدرتِ خامِ نمایان",
      lore: "At the gates of Mazandaran, Rostam attacked the army of Arzhang Div — a demon general. Rostam stormed his tent, seized him, tore off his head, and threw it among the demon host. The army broke. The gates to Kay Kavus's prison opened. Sometimes the fastest path is the most direct one.",
      lore_fa: "در دروازه‌های مازندران، رستم به سپاهِ ارژنگ دیو حمله کرد. به خیمه‌اش هجوم آورد، گرفتش، سرش را کَند و میانِ سپاهِ دیوان انداخت. سپاه متلاشی شد.",
      biography: "Arzhang is not a character — he is a door. His death opens the path to Kay Kavus. The Shahnameh uses his defeat to demonstrate that some obstacles exist only to be removed by force. The trophy of his head is proof that the direct application of overwhelming strength is sometimes mercy for everyone involved.",
      biography_fa: "ارژنگ شخصیت نیست — در است. مرگِ او مسیر را به کی‌کاووس باز می‌کند.",
      faction: "Battle Trophies · Haft Khan · Demon Hunters",
      mythologyRole: "Khan 6 · Demon general slain · The direct path to the prison",
      powers: ["+30% Tap Power (Fear's force)", "+150 Zar/hr", "Passive: Army Broken — battle gate costs –10%"],
      powers_fa: ["+۳۰٪ قدرتِ ضربه", "+۱۵۰ زر/ساعت", "غیرفعال: سپاه شکست — هزینه‌ی دروازه‌ی نبرد –۱۰٪"],
      storyAppearances: ["Haft Khan — Sixth Labour: Arzhang Div"],
      side: "light", season: 2, order: 65, cost: 18000, zar_per_hour: 150,
      collectionId: "S2-HK-006", nftReady: false,
      prereq: { hero_id: "awlad-guide", level: 1 },
      unlockCondition: "Own Awlad the Guide (Khan 5)",
      unlockCondition_fa: "اولادِ راهنما (خانِ پنجم) را داشته باشید",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan: true, haft_khan_order: 6,
    },
    {
      id: "div-e-sepid", name: "Div-e Sepid — The White Demon",
      name_fa: "دیوِ سپید — شیطانِ سفید", name_tg: "Дев-и Сафед — Девонаи Сафед",
      type: "enemy", rarity: "mythic", chapter: "haft-khan",
      img: "/season2/uploads/heroes/farvahar.png",
      emoji: "👁",
      role: "Khan 7 · The White Demon · Final Labour · Highest ROI in the Chronicle",
      role_fa: "خانِ هفتم · دیوِ سپید · آخرین خان · بالاترین بازده‌ی شاهنامه",
      lore: "In the dark cave at the heart of Mazandaran, Rostam fought the White Demon — the greatest demon in the Shahnameh's middle arc. He was enormous, pale as a mountain of iron. Their wrestling match shook the cave. Rostam tore out his liver. Its blood, dripped into the blind eyes of Kay Kavus and his warriors, restored their sight. The seventh labour is not simply a victory. It is a cure.",
      lore_fa: "در غارِ تاریکِ قلبِ مازندران، رستم با دیوِ سپید — بزرگترین دیوِ بخشِ میانیِ شاهنامه — جنگید. عظیم بود، سفید مثلِ کوهی از آهن. کشتی‌گرفتنشان غار را لرزاند. رستم جگرش را در آورد. خونش، در چشمانِ کورِ کی‌کاووس و جنگجویانش چکیده، بینایی‌شان را باز گرداند. خانِ هفتم فقط پیروزی نیست. درمان است.",
      biography: "Div-e Sepid is the pinnacle of the Haft Khan — the enemy who can only be defeated after all six previous labours have prepared the hero. He cannot be reached without Rakhsh's loyalty, the desert's grace, the dragon's patience, the lute's truth, Awlad's tactics, and Arzhang's broken gates. He is the proof that preparation is the true weapon.",
      biography_fa: "دیوِ سپید اوجِ هفت‌خان است — دشمنی که فقط بعد از آنکه همه‌ی شش خانِ قبلی قهرمان را آماده کرده‌اند می‌توان او را شکست داد.",
      faction: "Legendary Enemies · Haft Khan · Healing Powers",
      mythologyRole: "Khan 7 · Supreme demon · Ultimate test · Blood that heals the blind",
      powers: ["+40% Tap Power (Supreme force)", "+200 Zar/hr", "Passive: Vial of Restoration — energy +20% regeneration daily"],
      powers_fa: ["+۴۰٪ قدرتِ ضربه", "+۲۰۰ زر/ساعت", "غیرفعال: ویالِ بهبودی — +۲۰٪ بازیابیِ انرژی روزانه"],
      storyAppearances: ["Haft Khan — Seventh Labour: Div-e Sepid", "The Restoration of Kay Kavus"],
      side: "dark", season: 2, order: 66, cost: 25000, zar_per_hour: 200,
      collectionId: "S2-HK-007", nftReady: false,
      prereq: { hero_id: "arzhang-trophy", level: 1 },
      unlockCondition: "Own Arzhang Trophy (Khan 6)",
      unlockCondition_fa: "غنیمتِ ارژنگ (خانِ ششم) را داشته باشید",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan: true, haft_khan_order: 7,
    },
  ];

  /* =========================================================
     ARTIFACTS OF THE POET — Ferdowsi biographical collectibles
     ========================================================= */
  COLLECTION.push(
    {
      id: "quill-of-tus",
      name: "The Quill of Tus",
      name_fa: "قلمِ طوس",
      type: "artifact_poet",
      rarity: "common",
      chapter: 1,
      order: 901,
      emoji: "🪶",
      role: "Poet's Tool · The Beginning",
      lore: "The quill Ferdowsi dipped in ink in 977 CE to write the first couplet of the Shahnameh. Tus, Khorasan. Lamplight. One poet. 60,000 couplets still ahead of him.",
      lore_fa: "قلمی که فردوسی در ۹۷۷ م در طوسِ خراسان در مرکب فرو برد تا اولین بیتِ شاهنامه را بنویسد. نورِ چراغ. یک شاعر. ۶۰,۰۰۰ بیتِ پیشِ رو.",
      lore_tg: "Қалами Фирдавсӣ ки дар Тус, Хуросон, соли 977 м барои навиштани аввалин байти Шоҳнома дар сиёҳӣ фурӯ бурд.",
      faction: "Artifacts of the Poet · Khorasan · 977 CE",
      mythologyRole: "The instrument that started 60,000 couplets and preserved the Persian language",
      cost: 1200,
      zar_per_hour: 3,
    },
    {
      id: "empty-purse",
      name: "The Empty Purse",
      name_fa: "کیسهٔ خالی",
      type: "artifact_poet",
      rarity: "rare",
      chapter: 15,
      order: 902,
      emoji: "👜",
      role: "Financial Ruin · Patron's Betrayal",
      lore: "Ferdowsi's land income eroded while the poem grew. He wrote without secure patronage for decades. The purse carried to Ghazni returned half-full — silver instead of the promised gold.",
      lore_fa: "درآمدِ زمینیِ فردوسی کاهش یافت در حالی که شعر رشد کرد. کیسه‌ای که به غزنین برده شد با نقره به جای طلای وعده‌داده‌شده برگشت.",
      lore_tg: "Даромади заминии Фирдавсӣ кам шуд. Ки ба Ғазнин бурда шуд бо нуқра ба ҷои тиллои ваъдашуда баргашт.",
      faction: "Artifacts of the Poet · Economic Hardship",
      mythologyRole: "Symbol of the broken patronage promise that defined the last decade of Ferdowsi's life",
      cost: 4500,
      zar_per_hour: 14,
      prereq: { hero_id: "quill-of-tus", level: 1 },
      unlockCondition: "Own The Quill of Tus",
      unlockCondition_fa: "قلمِ طوس را داشته باشید",
    },
    {
      id: "elegy-for-the-son",
      name: "Elegy for the Son",
      name_fa: "مرثیه‌ی پسر",
      type: "artifact_poet",
      rarity: "epic",
      chapter: 13,
      order: 903,
      emoji: "🕯",
      role: "Grief · The Sohrab Mirror",
      lore: "Ferdowsi's real son died while he was writing the Sohrab chapter. A father killing his son without knowing it — and the medicine withheld by a calculating king. This chapter came from grief still wet.",
      lore_fa: "پسرِ واقعیِ فردوسی همزمان با نوشتنِ فصلِ سهراب درگذشت. پدری که پسرش را بی‌خبر می‌کشد از اندوهِ هنوزِ تازه آمد.",
      lore_tg: "Писари воқеии Фирдавсӣ ҳамзамон бо навиштани фасли Суҳроб даргузашт. Падаре ки писарашро нодонсона мекушад аз ғами ҳоло тозае омад.",
      faction: "Artifacts of the Poet · Personal Tragedy · ~1000 CE",
      mythologyRole: "The chapter Ferdowsi could not soften because he was living it",
      cost: 10000,
      zar_per_hour: 28,
      prereq: { hero_id: "empty-purse", level: 1 },
      unlockCondition: "Own The Empty Purse",
      unlockCondition_fa: "کیسه‌ی خالی را داشته باشید",
    },
    {
      id: "sultans-cold-letter",
      name: "Sultan's Cold Letter",
      name_fa: "نامهٔ سردِ سلطان",
      type: "artifact_poet",
      rarity: "legend",
      chapter: 24,
      order: 904,
      emoji: "📜",
      role: "Betrayal · The Broken Promise",
      lore: "Mahmud promised 60,000 gold coins — one per couplet. He paid 60,000 silver dirhams. Ferdowsi wrote a bitter satire against him and fled. The amends-payment reached Tus the day of his funeral.",
      lore_fa: "محمود ۶۰,۰۰۰ سکه‌ی طلا وعده داد — یکی برای هر بیت. ۶۰,۰۰۰ درهمِ نقره پرداخت کرد. جبران به طوس رسید روزِ تشییعِ جنازه‌اش.",
      lore_tg: "Маҳмуд 60,000 тангаи тилло ваъда дод — яке барои ҳар байт. 60,000 дирҳами нуқра пардохт кард. Ҷуброн ба Тус расид рӯзи ташйеъи ҷаноза.",
      faction: "Artifacts of the Poet · The Betrayal · 1010 CE",
      mythologyRole: "The broken promise that defined the end of Ferdowsi's life and became a symbol of unrecognized genius",
      cost: 22000,
      zar_per_hour: 65,
      prereq: { hero_id: "elegy-for-the-son", level: 1 },
      unlockCondition: "Own Elegy for the Son",
      unlockCondition_fa: "مرثیه‌ی پسر را داشته باشید",
    },
    {
      id: "finished-manuscript",
      name: "The Finished Manuscript",
      name_fa: "نسخهٔ تمام‌شده",
      type: "artifact_poet",
      rarity: "mythic",
      chapter: 25,
      order: 905,
      emoji: "📖",
      role: "Life's Work · 60,000 Couplets",
      lore: "60,000 couplets. 35 years. The Shahnameh, completed in Tus, Khorasan, ~1010 CE. The Persian language survived. The chronicle continues without him.",
      lore_fa: "۶۰,۰۰۰ بیت. ۳۵ سال. شاهنامه در طوسِ خراسان حدودِ ۱۰۱۰ م تمام شد. زبانِ فارسی بقا یافت. شاهنامه بدونِ او ادامه داد.",
      lore_tg: "60,000 байт. 35 сол. Шоҳнома дар Тус, Хуросон, ҳудуди 1010 м тамом шуд. Забони Форсӣ бақо ёфт. Шоҳнома бидуни ӯ идома дод.",
      faction: "Artifacts of the Poet · Legacy · The Chronicle",
      mythologyRole: "The completed life's work — the poem that preserved the Persian language for a thousand years",
      cost: 40000,
      zar_per_hour: 160,
      prereq: { hero_id: "sultans-cold-letter", level: 1 },
      unlockCondition: "Own Sultan's Cold Letter",
      unlockCondition_fa: "نامه‌ی سردِ سلطان را داشته باشید",
    }
  );

  /* Locked mystery teasers — chapters 5+ not yet released */
  const LOCKED_PREVIEWS = [
    { id: "locked-ch5-a", rarity: "mythic",  type: "character", emoji: "🐍", chapter: 5, label: "Serpent King",      hint: "Unlocks in Chapter 5" },
    { id: "locked-ch5-b", rarity: "epic",    type: "place",     emoji: "⛰", chapter: 5, label: "Mountain Prison",   hint: "Unlocks in Chapter 5" },
    { id: "locked-ch6-a", rarity: "legend",  type: "character", emoji: "🔨", chapter: 6, label: "The Liberator",     hint: "Unlocks in Chapter 6" },
    { id: "locked-ch7-a", rarity: "legend",  type: "character", emoji: "🦅", chapter: 7, label: "The Albino Prince", hint: "Unlocks in Chapter 7" }
  ];

  /* ---- Label helpers (use i18n when available) ---- */
  const rarityLabel = (r) => t("rarity_" + (r || "common"));
  const typeLabel   = (tp) => t("type_" + (tp || "character"));

  /* ---- Particle colours per rarity ---- */
  const PARTICLE_COLORS = {
    common: ["rgba(154,166,196,.9)"],
    rare:   ["rgba(94,162,255,.9)",  "rgba(140,200,255,.8)"],
    epic:   ["rgba(140,109,255,.9)", "rgba(190,150,255,.8)", "rgba(210,170,255,.7)"],
    legend: ["rgba(244,197,107,.9)", "rgba(255,220,130,.8)", "rgba(255,200,70,.7)"],
    mythic: ["rgba(255,82,103,.9)",  "rgba(255,138,61,.85)", "rgba(255,60,80,.7)"]
  };

  /* =========================================================
     DISCOVERY TRACKING
     ========================================================= */
  const DISCOVERY_LS = "real_coll_discovered_v1";

  const getDiscoveryMap = () => {
    try { return JSON.parse(localStorage.getItem(DISCOVERY_LS) || "{}"); } catch { return {}; }
  };
  const trackDiscovery = (id) => {
    try {
      const map = getDiscoveryMap();
      if (!map[id]) {
        map[id] = new Date().toISOString().split("T")[0];
        localStorage.setItem(DISCOVERY_LS, JSON.stringify(map));
      }
      return map[id];
    } catch { return null; }
  };
  const getDiscoveryDate = (id) => {
    const d = getDiscoveryMap()[id];
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    } catch { return d; }
  };

  /* =========================================================
     HELPERS
     ========================================================= */
  const showToast = (msg) => {
    const el = document.querySelector("[data-toast]");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("show"), 2400);
  };

  /* =========================================================
     RARITY PARTICLES
     ========================================================= */
  const spawnRarityParticles = (event, rarity) => {
    if (document.hidden) return;
    const colors = PARTICLE_COLORS[rarity] || PARTICLE_COLORS.common;
    const count  = rarity === "mythic" ? 9 : rarity === "legend" ? 7 : rarity === "epic" ? 5 : 4;
    const cx     = event.clientX || window.innerWidth  / 2;
    const cy     = event.clientY || window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI + Math.random() * 0.9;
      const dist  = 28 + Math.random() * 55;
      const endX  = Math.cos(angle) * dist;
      const endY  = Math.sin(angle) * dist - 30;
      const color = colors[i % colors.length];
      const size  = 3 + Math.random() * 4;

      const p = document.createElement("span");
      p.className = "rarity-particle";
      p.style.cssText = `left:${cx - size/2}px;top:${cy - size/2}px;width:${size}px;height:${size}px;background:${color};border-radius:50%;`;
      document.body.appendChild(p);

      p.animate([
        { transform: "translate(0,0) scale(1)", opacity: .9 },
        { transform: `translate(${endX * .5}px,${endY * .5}px) scale(1.3)`, opacity: .7, offset: .3 },
        { transform: `translate(${endX}px,${endY}px) scale(0)`, opacity: 0 }
      ], { duration: 520 + Math.random() * 200, delay: i * 38, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" });

      setTimeout(() => p.remove(), 950);
    }
  };

  /* =========================================================
     PROGRESS SECTION
     ========================================================= */
  const buildProgressSection = () => {
    const section = document.getElementById("coll-progress");
    if (!section) return;

    const counts = { common: 0, rare: 0, epic: 0, legend: 0, mythic: 0 };
    COLLECTION.forEach((it) => { counts[it.rarity] = (counts[it.rarity] || 0) + 1; });

    const total      = 69;
    const discovered = COLLECTION.length;
    const pct        = Math.round((discovered / total) * 100);

    const countEl = section.querySelector(".coll-ph-left");
    const pctEl   = section.querySelector(".coll-ph-right");
    const fillEl  = section.querySelector(".coll-progress-fill");

    if (countEl) countEl.innerHTML = t("coll_discovered_tpl", { n: `<strong>${discovered}</strong>`, total });
    if (pctEl)   pctEl.textContent = t("coll_ch1_complete_tpl", { pct });

    /* Animate fill after render */
    if (fillEl) {
      fillEl.style.width = "0%";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { fillEl.style.width = `${pct}%`; });
      });
    }

    Object.entries(counts).forEach(([rarity, count]) => {
      const el = section.querySelector(`.crb-item.r-${rarity} .crb-count`);
      if (el) el.textContent = count;
    });
  };

  /* =========================================================
     BUILD CARDS
     ========================================================= */
  const heroEconomyState = (item) => {
    const owned = ownedHeroes[item.id];
    if (owned) return "owned";
    if (!isChapterDone(item.chapter)) return "locked";
    if (item.prereq) {
      const prereqOwned = ownedHeroes[item.prereq.hero_id];
      if (!prereqOwned || (prereqOwned.level || 1) < item.prereq.level) return "prereq_locked";
    }
    if (item.farr_cost) {
      const farr = window.RealPlayer ? (window.RealPlayer.getResource("farr") || 0) : 0;
      if (farr < item.farr_cost) return "farr_locked";
    }
    return "available";
  };

  /* ── Haft Khan sequential view ─────────────────────────────────────── */
  const KHAN_STORIES = [
    "Rostam slept in the reeds. A lion came. Rakhsh fought alone and killed it without waking his master. The first labour was the horse's victory.",
    "A waterless desert nearly killed them. Rostam prayed. A mystical ram appeared and led them to a hidden spring. Divine mercy arrives when earned.",
    "A dragon attacked three nights in a row, vanishing each time Rakhsh woke Rostam — who grew angry at the horse. The third night, Rostam finally saw the dragon. The horse had been right all along.",
    "A feast table appeared in the wilderness. A beautiful woman offered wine. When Rostam spoke God's name, she became a hideous witch. He killed her with his lasso. The lute exposed the illusion.",
    "Awlad the warden attacked Rostam with his men and lost. Rostam captured him and made a promise: guide me faithfully, and I will make you king. The enemy became the key.",
    "At the gates of Mazandaran, Rostam stormed Arzhang Div's tent, seized him, and threw his severed head among the demon army. The army broke. The path to Kay Kavus opened.",
    "In the dark cave at Mazandaran's heart, Rostam wrestled the White Demon — enormous, pale as iron. Their battle shook the mountain. Rostam tore out his liver. Its blood, dripped into blind eyes, gave back sight. The seventh labour was a cure.",
  ];

  const buildHaftKhanView = () => {
    const view = document.getElementById("haft-khan-view");
    const grid = document.getElementById("coll-grid");
    if (!view) return;

    grid.style.display = "none";
    view.style.display = "block";
    view.innerHTML = "";

    const khans = COLLECTION.filter(i => i.haft_khan).sort((a,b) => a.haft_khan_order - b.haft_khan_order);
    const ownedCount = khans.filter(k => ownedHeroes[k.id]).length;
    const pips = khans.map((k, i) => {
      const owned = ownedHeroes[k.id];
      const cls = owned ? "hk-pip done" : (i === ownedCount ? "hk-pip active" : "hk-pip");
      return `<div class="${cls}"></div>`;
    }).join("");

    view.innerHTML = `
      <article class="hk-banner">
        <div class="hk-banner-kicker">⚔ Haft Khan-e Rostam</div>
        <div class="hk-banner-title">The Seven Labours</div>
        <div class="hk-banner-sub">Read each labour's story · Unlock the card with REAL · Upgrade with ZAR for passive mining. Complete all seven to earn the chronicle's highest ROI.</div>
        <div class="hk-progress">${pips}</div>
      </article>
      <div id="hk-steps"></div>`;

    const stepsEl = view.querySelector("#hk-steps");
    khans.forEach((item) => {
      const state  = heroEconomyState(item);
      const owned  = ownedHeroes[item.id];
      const lvl    = owned ? (owned.level || 1) : 0;
      const zarHr  = owned ? (owned.zar_per_hour || 0) : item.zar_per_hour;
      const cost   = item.cost || 25000;
      const stateClass = state === "owned" ? "hk-owned" : state === "available" ? "hk-available" : "hk-locked";

      let badge = "";
      if (state === "owned")     badge = `<span class="hk-step-badge hk-badge-owned">Lv.${lvl} · ${fmtN(zarHr)} ZAR/hr</span>`;
      else if (state === "available") badge = `<span class="hk-step-badge hk-badge-available">${fmtN(cost)} ${t('currency_name','REAL')}</span>`;
      else                       badge = `<span class="hk-step-badge hk-badge-locked">🔒</span>`;

      const story = KHAN_STORIES[item.haft_khan_order - 1] || "";
      const itemName = locF(item, 'name') || item.name;
      const baseZar  = 50 * item.haft_khan_order; // progressive base for upgrade preview
      const upgCost  = cost * Math.max(1, lvl);

      let econHtml = "";
      if (state === "available") {
        econHtml = `
          <div class="hk-econ">
            <div class="hk-zar-stat">🪙 ${fmtN(zarHr)} ZAR/hr at Lv.1</div>
            <button class="hk-buy-btn" data-hk-buy="${item.id}" data-cost="${cost}">
              ${RT} ${fmtN(cost)} — ${t('hero_buy_cta_label','Buy Hero')}
            </button>
          </div>`;
      } else if (state === "owned") {
        const nextZar = (item.zar_per_hour || 50) + 50 * item.haft_khan_order;
        econHtml = `
          <div class="hk-econ">
            <div class="hk-zar-stat">🪙 +${fmtN(zarHr)} ZAR/hr now</div>
            <button class="hk-upg-btn" data-hk-upgrade="${item.id}" data-cost="${upgCost}" data-next-zar="${nextZar}">
              ↑ Lv.${lvl + 1} · +${fmtN(50 * item.haft_khan_order)}/hr · ${fmtN(upgCost)} ${t('currency_name','REAL')}
            </button>
          </div>`;
      }

      const step = document.createElement("article");
      step.className = `hk-step ${stateClass}`;
      step.dataset.heroId = item.id;
      step.innerHTML = `
        <div class="hk-step-head">
          <div class="hk-num">${item.haft_khan_order}</div>
          <div class="hk-step-info">
            <div class="hk-step-title">${itemName}</div>
            <div class="hk-step-sub">${locF(item,'role') || item.role}</div>
          </div>
          ${badge}
        </div>
        <div class="hk-step-body">
          <div class="hk-story">${story}</div>
          ${econHtml}
        </div>`;
      stepsEl.appendChild(step);
    });

    /* Wire buy buttons */
    view.querySelectorAll("[data-hk-buy]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const heroId = btn.dataset.hkBuy;
        const item   = COLLECTION.find(i => i.id === heroId);
        if (!item) return;
        btn.disabled = true; btn.textContent = "…";
        await handleEconomyAction(btn, item);
        buildHaftKhanView(); // refresh the whole view
      });
    });

    /* Wire upgrade buttons */
    view.querySelectorAll("[data-hk-upgrade]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const heroId = btn.dataset.hkUpgrade;
        const item   = COLLECTION.find(i => i.id === heroId);
        if (!item) return;
        btn.disabled = true; btn.textContent = "…";
        await handleEconomyAction(btn, item);
        buildHaftKhanView();
      });
    });
  };

  const buildCards = (filter) => {
    const grid = document.getElementById("coll-grid");
    if (!grid) return;

    /* Toggle Haft Khan dedicated view */
    const hkView = document.getElementById("haft-khan-view");
    if (filter === "haft-khan") {
      grid.innerHTML = "";
      buildHaftKhanView();
      return;
    }
    /* Hide Haft Khan view when switching to other tabs */
    if (hkView) { hkView.style.display = "none"; hkView.innerHTML = ""; }
    grid.style.display = "";
    grid.innerHTML = "";

    const items = (filter === "all" ? COLLECTION : COLLECTION.filter((it) => it.type === filter))
      .slice().sort((a, b) => (a.order || 99) - (b.order || 99));

    if (!items.length) {
      const empty = document.createElement("p");
      empty.style.cssText = "grid-column:1/-1;text-align:center;color:var(--muted);padding:28px 0;font-size:13px;";
      empty.textContent = t("coll_no_items");
      grid.appendChild(empty);
    } else {
      items.forEach((item) => {
        const state = heroEconomyState(item);
        const owned = ownedHeroes[item.id];
        const card  = document.createElement("button");
        card.className = `coll-card r-${item.rarity} hero-state-${state}`;
        card.setAttribute("data-hero-id", item.id);
        const itemName = locF(item, 'name') || item.name;
        card.setAttribute("aria-label", `View ${itemName}`);

        let imgHTML = item.img
          ? `<img src="${item.img}" alt="${itemName}" loading="lazy"
              onerror="this.style.display='none';this.parentNode.querySelector('.coll-emoji').style.display='flex'">
             <span class="coll-emoji" style="display:none;">${item.emoji || "?"}</span>`
          : `<span class="coll-emoji">${item.emoji || "?"}</span>`;

        /* State badge overlay */
        let stateBadge = "";
        if (state === "locked") {
          stateBadge = `<span class="hero-state-badge locked-badge">🔒</span>`;
        } else if (state === "prereq_locked") {
          stateBadge = `<span class="hero-state-badge prereq-badge">🔐</span>`;
        } else if (state === "farr_locked") {
          stateBadge = `<span class="hero-state-badge farr-badge">✦${item.farr_cost}</span>`;
        } else if (state === "owned") {
          stateBadge = `<span class="hero-state-badge owned-badge">${t("hero_owned_badge", { n: owned.level || 1 })}</span>`;
        } else {
          const cardCost = item.cost || RARITY_COST[item.rarity] || 0;
          stateBadge = `<span class="hero-state-badge available-badge">${RT} ${fmtN(cardCost)}</span>`;
        }

        const subLine = state === "owned"
          ? `<span class="zar-ico">🪙</span> ${t("hero_zar_subline", { zar: fmtN(owned.zar_per_hour || 0) })}`
          : rarityLabel(item.rarity);

        card.innerHTML = `
          <div class="coll-portrait">
            ${imgHTML}
            <span class="coll-type-chip">${typeLabel(item.type)}</span>
            <span class="coll-chapter-dot">Ch${item.chapter}</span>
            ${stateBadge}
          </div>
          <div class="coll-info">
            <div class="coll-name">${itemName}</div>
            <div class="coll-rarity">${subLine}</div>
          </div>
        `;

        card.addEventListener("click", (e) => {
          spawnRarityParticles(e, item.rarity);
          if (navigator.vibrate) navigator.vibrate(6);
          openCertificate(item);
        });
        grid.appendChild(card);
      });
    }

    /* Mystery locked previews (all tab only) */
    if (filter === "all") buildLockedPreviews(grid);
    else buildLockedTeaser(grid, filter);
  };

  /* =========================================================
     LOCKED MYSTERY CARDS
     ========================================================= */
  const buildLockedPreviews = (grid) => {
    LOCKED_PREVIEWS.forEach((preview) => {
      const card = document.createElement("div");
      card.className = "coll-card-locked";

      card.innerHTML = `
        <div class="coll-portrait-locked">
          <span class="locked-silhouette">${preview.emoji}</span>
          <div class="coll-locked-badge">🔒</div>
        </div>
        <div class="coll-info-locked">
          <div class="coll-name-locked">???</div>
          <div class="coll-hint-locked">${t("locked_hint_ch_tpl", { n: preview.chapter })}</div>
        </div>
      `;

      card.addEventListener("click", () => showToast(`🔒 ${t("locked_hint_ch_tpl", { n: preview.chapter })}`));
      grid.appendChild(card);
    });

    /* Teaser row for remaining */
    buildLockedTeaser(grid, "all");
  };

  const buildLockedTeaser = (grid, filter) => {
    if (filter !== "all" && filter !== "character") return;
    const row = document.createElement("div");
    row.className = "coll-locked-chapter";
    row.innerHTML = `
      <div class="clc-lock">🔒</div>
      <div>
        <div class="clc-title">${t("coll_locked_chapters")}</div>
        <div class="clc-count">${t("coll_locked_count")}</div>
      </div>
      <img class="clc-thumb" src="/season2/uploads/chapters/zahhak.png" alt=""
        onerror="this.outerHTML='<div class=clc-thumb-fallback>🔒</div>'">
    `;
    grid.appendChild(row);
  };

  /* =========================================================
     CERTIFICATE MODAL
     ========================================================= */
  const CINEMATIC_HEROES = new Set(["zahhak", "fereydun", "rostam", "zal", "jamshid"]);

  const openCertificate = (item) => {
    const backdrop = document.getElementById("cert-backdrop");
    const modal    = document.getElementById("cert-modal");
    if (!backdrop || !modal) return;

    // Record hero view for Hakim memory
    if (window.HakimMemory) window.HakimMemory.recordHero(item.id);

    // Hero reveal cinematic for major heroes (first view only)
    if (CINEMATIC_HEROES.has(item.id) && window.RealCinematic) {
      const seenKey = `real_hero_reveal_${item.id}`;
      if (!localStorage.getItem(seenKey)) {
        window.RealCinematic.showHeroReveal(item.id, () => _doOpenCertificate(item, backdrop, modal));
        return;
      }
    }
    _doOpenCertificate(item, backdrop, modal);
  };

  /* ── Economy panel HTML builder ── */
  const buildEconomyPanel = (item) => {
    const state = heroEconomyState(item);
    const owned = ownedHeroes[item.id];
    const cost  = item.cost || RARITY_COST[item.rarity] || 0;
    const baseZar = RARITY_ZAR[item.rarity] || 0;

    if (state === "locked") {
      return `<div class="hero-econ-panel locked">
        <span class="hecon-lock">🔒</span>
        <span class="hecon-msg">${t("hero_locked_chapter", { n: item.chapter })}</span>
      </div>`;
    }

    if (state === "prereq_locked") {
      const prereq = item.prereq;
      const prereqItem = COLLECTION.find(c => c.id === prereq.hero_id);
      const prereqName = prereqItem ? (locF(prereqItem, 'name') || prereqItem.name) : prereq.hero_id;
      return `<div class="hero-econ-panel prereq_locked">
        <span class="hecon-lock">🔐</span>
        <span class="hecon-msg">${t("hero_prereq_locked", { name: prereqName, level: prereq.level })}</span>
      </div>`;
    }

    if (state === "farr_locked") {
      return `<div class="hero-econ-panel farr_locked">
        <span class="hecon-lock">✦</span>
        <span class="hecon-msg">${t("hero_farr_locked", { cost: item.farr_cost || 1 })}</span>
      </div>`;
    }

    if (state === "owned") {
      const lvl     = (owned.level != null ? owned.level : 1);
      const upgCost = cost * lvl;
      const curZar  = owned.zar_per_hour || 0;
      const nextZar = baseZar * (lvl + 1);
      const zarDelta = Math.max(0, nextZar - curZar);
      return `<div class="hero-econ-panel owned">
        <div class="hecon-owned-row">
          <span class="hecon-level">${t("hero_owned_badge", { n: lvl })}</span>
          <span class="hecon-zar"><span class="zar-ico">🪙</span> ${t("hero_zar_subline", { zar: fmtN(curZar) })}</span>
        </div>
        <button class="hecon-upgrade-btn" data-action="upgrade"
          data-hero-id="${item.id}" data-cost="${upgCost}" data-next-zar="${nextZar}">
          ${t("hero_upgrade_cta", { lvl: lvl + 1, delta: fmtN(zarDelta), cost: `${RT} ${fmtN(upgCost)}` })}
        </button>
      </div>`;
    }

    /* available to buy */
    const buyZar = baseZar;
    return `<div class="hero-econ-panel available">
      <div class="hecon-price-row">
        <span class="hecon-cost">${RT} ${fmtN(cost)} ${t("currency_name","REAL")}</span>
        <span class="hecon-zar"><span class="zar-ico">🪙</span> ${t("hero_zar_subline", { zar: fmtN(buyZar) })}</span>
      </div>
      <button class="hecon-buy-btn" data-action="buy"
        data-hero-id="${item.id}" data-cost="${cost}" data-zar="${buyZar}">
        ${RT} ${fmtN(cost)} ${t("currency_name","REAL")} — ${t("hero_buy_cta_label","Buy Hero")}
      </button>
    </div>`;
  };

  /* ── Buy / Upgrade action handler (called from modal) ── */
  const handleEconomyAction = async (btn, item) => {
    const action    = btn.getAttribute("data-action");
    const heroId    = item.id;
    const cost      = parseInt(btn.getAttribute("data-cost"), 10) || 0;
    const tid       = tgUserId();

    if (!tid) { showToast("Telegram session required"); return; }

    /* Always take the max of in-memory and localStorage — guards against
       stale bfcache state after a ZAR→REAL swap done on another page. */
    const balance = (() => {
      const mem = window.RealPlayer ? (window.RealPlayer.getResource("real") || 0) : 0;
      try {
        const ls = JSON.parse(localStorage.getItem("real_player_state_v1") || "{}");
        const lsBal = ls.balance || 0;
        if (lsBal > mem && window.RealPlayer && window.RealPlayer.set) {
          window.RealPlayer.set({ balance: lsBal });  // sync in-memory from fresh LS
        }
        return Math.max(mem, lsBal);
      } catch { return mem; }
    })();
    if (balance < cost) { showToast(t("hero_insufficient_real")); return; }

    btn.disabled = true;
    btn.textContent = "…";

    if (action === "buy") {
      const zarHr  = parseInt(btn.getAttribute("data-zar"), 10) || 0;
      const prereq = item.prereq || null;
      const result = await apiPost("/api/season2/user/buy-hero", {
        telegram_id: tid, hero_id: heroId, cost, zar_per_hour: zarHr,
        prereq_hero_id: prereq ? prereq.hero_id : null,
        prereq_level:   prereq ? prereq.level   : null,
      });

      if (!result || result.status !== 1) {
        const errKey = result?.error === "insufficient_balance" ? t("hero_insufficient_real")
          : result?.error === "prereq_not_met" ? t("hero_prereq_locked", { name: item.prereq?.hero_id || "?", level: item.prereq?.level || 1 })
          : (result?.error || "Error");
        showToast(errKey);
        btn.disabled = false;
        btn.textContent = t("hero_buy_btn", { cost: cost.toLocaleString() });
        return;
      }

      /* Update local state */
      ownedHeroes[heroId] = { level: 1, zar_per_hour: zarHr };
      if (window.RealSync) { try { localStorage.setItem("real_owned_heroes_v1", JSON.stringify(ownedHeroes)); } catch {} }
      if (window.RealPlayer) window.RealPlayer.set({ balance: result.new_balance });
      saveZarHr();
      updateStatsStrip();
      refreshCardBadge(heroId);

      showToast(t("hero_buy_success", { name: locF(item, 'name') || item.name }));
      if (navigator.vibrate) navigator.vibrate([8, 4, 12]);

      /* Refresh economy panel in modal */
      const panelHost = document.querySelector(".cert-econ-slot");
      if (panelHost) panelHost.innerHTML = buildEconomyPanel(item);
      bindEconomyPanel(panelHost, item);

    } else if (action === "upgrade") {
      const nextZar = parseInt(btn.getAttribute("data-next-zar"), 10) || 0;
      const result  = await apiPost("/api/season2/user/upgrade-hero", {
        telegram_id: tid, hero_id: heroId, cost, new_zar_per_hour: nextZar
      });

      if (!result || result.status !== 1) {
        showToast(result?.error === "insufficient_balance" ? t("hero_insufficient_real") : (result?.error || "Error"));
        btn.disabled = false;
        const cur = ownedHeroes[heroId];
        btn.textContent = t("hero_upgrade_btn", { level: (cur?.level || 1) + 1, cost: cost.toLocaleString() });
        return;
      }

      const updLevel = result.level != null ? result.level : ((ownedHeroes[heroId]?.level || 1) + 1);
      const updZar   = result.zar_per_hour != null ? result.zar_per_hour : 0;
      ownedHeroes[heroId] = { level: updLevel, zar_per_hour: updZar };
      if (window.RealSync) { try { localStorage.setItem("real_owned_heroes_v1", JSON.stringify(ownedHeroes)); } catch {} }
      if (window.RealPlayer) window.RealPlayer.set({ balance: result.new_balance });
      saveZarHr();
      updateStatsStrip();
      refreshCardBadge(heroId);

      showToast(t("hero_upgrade_success", { name: locF(item, 'name') || item.name, level: updLevel }));
      if (navigator.vibrate) navigator.vibrate([8, 4, 12]);

      const panelHost = document.querySelector(".cert-econ-slot");
      if (panelHost) panelHost.innerHTML = buildEconomyPanel(item);
      bindEconomyPanel(panelHost, item);
    }
  };

  const bindEconomyPanel = (host, item) => {
    if (!host) return;
    host.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", () => handleEconomyAction(btn, item));
    });
  };

  /* ── Refresh a single card badge without full rebuild ── */
  const refreshCardBadge = (heroId) => {
    const card  = document.querySelector(`[data-hero-id="${heroId}"]`);
    const item  = COLLECTION.find(i => i.id === heroId);
    if (!card || !item) return;

    const state = heroEconomyState(item);
    const owned = ownedHeroes[heroId];
    card.className = `coll-card r-${item.rarity} hero-state-${state}`;

    const badge = card.querySelector(".hero-state-badge");
    if (badge) {
      const badgeClass = state === "prereq_locked" ? "prereq-badge"
                       : state === "farr_locked"   ? "farr-badge"
                       : `${state}-badge`;
      badge.className = `hero-state-badge ${badgeClass}`;
      if (state === "owned") badge.textContent = `Lv.${owned.level || 1}`;
      else if (state === "prereq_locked") badge.textContent = `🔐`;
      else if (state === "farr_locked") badge.textContent = `✦${item.farr_cost || 1}`;
      else if (state === "available") badge.innerHTML = `${RT} ${(item.cost || RARITY_COST[item.rarity] || 0).toLocaleString()}`;
    }
    const rarityEl = card.querySelector(".coll-rarity");
    if (rarityEl && state === "owned") {
      rarityEl.innerHTML = `<span class="zar-ico">🪙</span> +${owned.zar_per_hour || 0} Zar/hr`;
    }
  };

  /* ── Update stats strip from real ownership data ── */
  const updateStatsStrip = () => {
    const ownedCount = Object.keys(ownedHeroes).length;
    const total      = 69;

    /* Stats strip */
    const discVal = document.querySelector(".css-cell:first-child .css-val");
    const lockVal = document.querySelector(".css-cell:nth-child(2) .css-val");
    if (discVal) discVal.textContent = ownedCount;
    if (lockVal) lockVal.textContent = total - ownedCount;

    /* Progress bar */
    const countEl = document.querySelector("#coll-progress .coll-ph-left");
    const fillEl  = document.querySelector("#coll-progress .coll-progress-fill");
    const pct     = Math.round((ownedCount / total) * 100);
    if (countEl) countEl.innerHTML = `<strong>${ownedCount}</strong> <span>of ${total} discovered</span>`;
    if (fillEl)  fillEl.style.width = `${pct}%`;
  };

  const _doOpenCertificate = (item, backdrop, modal) => {
    /* Record first discovery */
    trackDiscovery(item.id);
    const discoveredDate = getDiscoveryDate(item.id);

    const certName = locF(item, 'name') || item.name;
    let portraitInner = item.img
      ? `<img src="${item.img}" alt="${certName}"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="cert-portrait-emoji" style="display:none;">${item.emoji || "?"}</div>`
      : `<div class="cert-portrait-emoji">${item.emoji || "?"}</div>`;

    const sideTag = item.side === "dark"
      ? `<span class="cert-tag side-dark">${t("side_dark")}</span>`
      : `<span class="cert-tag side-light">${t("side_light")}</span>`;

    const nftClass = item.nftReady ? "nft-ready" : "nft-pending";
    const nftText  = t(item.nftReady ? "cert_nft_ready_txt" : "cert_nft_pending_txt");

    const discoveredLine = discoveredDate
      ? `<div class="cert-discovered">${t("cert_discovered_prefix")} ${discoveredDate} · Season ${item.season}</div>`
      : "";

    const powers = locF(item, "powers") || item.powers;
    const appearances = locF(item, "storyAppearances") || item.storyAppearances;

    /* Build accordion sections */
    const accordionItems = [
      {
        label: t("cert_biography"),
        content: `<p>${locF(item, "biography")}</p>`
      },
      {
        label: t("cert_faction_role"),
        content: `
          <div class="faction-val">${locF(item, "faction")}</div>
          <div class="faction-sub">${locF(item, "mythologyRole")}</div>`
      },
      {
        label: t("cert_powers"),
        content: `<ul>${(Array.isArray(powers) ? powers : []).map((p) => `<li><strong>${p}</strong></li>`).join("")}</ul>`
      },
      {
        label: t("cert_story"),
        content: (Array.isArray(appearances) ? appearances : []).map((s) => `<div class="story-entry">${s}</div>`).join("")
      }
    ];

    const accordionHTML = accordionItems.map((a, i) => `
      <div class="cert-acc-item" data-acc="${i}">
        <button class="cert-acc-trigger" aria-expanded="false">
          <span>${a.label}</span>
          <span class="cert-acc-arrow">›</span>
        </button>
        <div class="cert-acc-body">
          <div class="cert-acc-content">${a.content}</div>
        </div>
      </div>
    `).join("");

    modal.innerHTML = `
      <div class="cert-grabber-row"><div class="cert-grabber"></div></div>

      <div class="cert-portrait-panel" data-fullscreen-src="${item.img || ""}" data-fullscreen-alt="${certName}">
        ${portraitInner}
        <span class="cert-zoom-hint">${t("cert_zoom_hint")}</span>
        <span class="cert-type-badge t-${item.type}">${typeLabel(item.type)}</span>
        <button class="cert-close" id="cert-close-btn" aria-label="Close">✕</button>
      </div>

      <div class="cert-scroll">
        <div class="cert-watermark">${t("cert_watermark")}</div>

        <div class="cert-name-row">
          <h2 class="cert-name">${certName}</h2>
          <span class="cert-rarity-pill r-${item.rarity}">${rarityLabel(item.rarity)}</span>
        </div>

        <div class="cert-role">${locF(item, "role")}</div>

        <div class="cert-tags">
          <span class="cert-tag era">Season ${item.season} · Ch.${item.chapter}</span>
          <span class="cert-tag season">${RT} REAL Collection</span>
          ${sideTag}
        </div>

        <p class="cert-lore-excerpt">${locF(item, "lore")}</p>

        <div class="cert-econ-slot">${buildEconomyPanel(item)}</div>

        <div class="cert-accordion">${accordionHTML}</div>

        <hr class="cert-divider">

        <div class="cert-nft-badge ${nftClass}">
          <span class="nft-ico">◈</span> ${nftText}
        </div>

        <div class="cert-meta-section">
          <div class="cert-meta-row">
            <span class="cmr-key">${t("cert_id_lbl")}</span>
            <span class="cmr-val mono">${item.collectionId}</span>
          </div>
          <div class="cert-meta-row">
            <span class="cmr-key">${t("cert_col_rarity")}</span>
            <span class="cmr-val gold-val">${rarityLabel(item.rarity)}</span>
          </div>
          <div class="cert-meta-row">
            <span class="cmr-key">${t("cert_season_ch_lbl")}</span>
            <span class="cmr-val">Season ${item.season} · Chapter ${item.chapter}</span>
          </div>
          <div class="cert-meta-row">
            <span class="cmr-key">${t("cert_unlock_lbl")}</span>
            <span class="cmr-val">${locF(item, "unlockCondition")}</span>
          </div>
          <div class="cert-meta-row">
            <span class="cmr-key">${t("cert_ton_std_lbl")}</span>
            <span class="cmr-val mono">${item.tonMetadata.standard}</span>
          </div>
          <div class="cert-meta-row">
            <span class="cmr-key">${t("cert_artwork_lbl")}</span>
            <span class="cmr-val">v${item.tonMetadata.artworkVersion}</span>
          </div>
          <div class="cert-meta-row">
            <span class="cmr-key">${t("cert_mint_lbl")}</span>
            <span class="cmr-val">${item.tonMetadata.mintStatus === "pending" ? t("cert_mint_pending") : t("cert_mint_done")}</span>
          </div>
        </div>

        ${discoveredLine}
      </div>
    `;

    backdrop.classList.add("open");
    /* Reset scroll so name row is always the first visible element */
    requestAnimationFrame(() => {
      const scroll = modal.querySelector(".cert-scroll");
      if (scroll) scroll.scrollTop = 0;
    });
    if (navigator.vibrate) navigator.vibrate([6, 2, 4]);

    /* Bind economy panel buttons */
    bindEconomyPanel(modal.querySelector(".cert-econ-slot"), item);

    /* Bind close — stopPropagation so click doesn't bubble to portrait panel */
    document.getElementById("cert-close-btn")
      ?.addEventListener("click", (e) => { e.stopPropagation(); closeCertificate(); });

    /* Portrait → fullscreen (skip if the click originated from the close button) */
    const portraitPanel = modal.querySelector(".cert-portrait-panel");
    if (portraitPanel) {
      portraitPanel.addEventListener("click", (e) => {
        if (e.target.closest(".cert-close")) return;
        const src = portraitPanel.dataset.fullscreenSrc;
        const alt = portraitPanel.dataset.fullscreenAlt;
        if (src) openFullscreen(src, alt);
      });
    }

    /* Set up accordion */
    setupAccordion(modal);
  };

  const closeCertificate = () => {
    const backdrop = document.getElementById("cert-backdrop");
    if (backdrop) backdrop.classList.remove("open");
    closeFullscreen();
  };

  /* =========================================================
     ACCORDION
     ========================================================= */
  const setupAccordion = (container) => {
    container.querySelectorAll(".cert-acc-item").forEach((item) => {
      const trigger = item.querySelector(".cert-acc-trigger");
      if (!trigger) return;
      trigger.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        /* Close all */
        container.querySelectorAll(".cert-acc-item.open").forEach((el) => {
          el.classList.remove("open");
          el.querySelector(".cert-acc-trigger")?.setAttribute("aria-expanded", "false");
        });
        /* Toggle clicked */
        if (!isOpen) {
          item.classList.add("open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });
    });
  };

  /* =========================================================
     FULLSCREEN PORTRAIT
     ========================================================= */
  const openFullscreen = (src, alt) => {
    const overlay = document.getElementById("img-fullscreen");
    const imgEl   = document.getElementById("img-fullscreen-img");
    if (!overlay || !imgEl || !src) return;

    imgEl.src = src;
    imgEl.alt = alt || "";
    overlay.classList.add("open");
    if (navigator.vibrate) navigator.vibrate(4);
  };

  const closeFullscreen = () => {
    const overlay = document.getElementById("img-fullscreen");
    if (overlay) overlay.classList.remove("open");
  };

  /* =========================================================
     TAB FILTERING
     ========================================================= */
  const setupTabs = () => {
    const tabBar = document.getElementById("coll-tabs");
    if (!tabBar) return;
    tabBar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      tabBar.querySelectorAll("[data-filter]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      buildCards(btn.getAttribute("data-filter"));
    });
  };

  /* =========================================================
     INIT
     ========================================================= */
  const init = async () => {
    /* Load cached ownership immediately, then fetch fresh from server */
    loadOwned();
    buildProgressSection();
    updateStatsStrip();
    setupTabs();
    buildCards("all");

    /* Backdrop click closes certificate */
    document.getElementById("cert-backdrop")
      ?.addEventListener("click", (e) => { if (e.target.id === "cert-backdrop") closeCertificate(); });

    /* Fullscreen close */
    document.getElementById("img-fullscreen-close")
      ?.addEventListener("click", closeFullscreen);
    document.getElementById("img-fullscreen")
      ?.addEventListener("click", (e) => { if (e.target.id === "img-fullscreen") closeFullscreen(); });

    /* Escape key */
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeFullscreen(); closeCertificate(); }
    });

    /* After user sync completes, refresh from server */
    if (window.RealSync) {
      window.RealSync.ready().then(async () => {
        const fresh = await window.RealSync.syncHeroes();
        ownedHeroes = fresh;
        saveZarHr();
        updateStatsStrip();
        buildCards(
          document.querySelector("[data-filter].active")?.getAttribute("data-filter") || "all"
        );
      });
    }
  };

  /* Re-hydrate balance from localStorage when page is restored from bfcache
     (e.g. after a ZAR→REAL swap done on tap.html then navigating back). */
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    try {
      const ls = JSON.parse(localStorage.getItem("real_player_state_v1") || "{}");
      if (window.RealPlayer && window.RealPlayer.set) {
        window.RealPlayer.set({ balance: ls.balance || 0, zar: ls.zar || 0 });
      }
    } catch {}
    loadOwned();
    buildCards(document.querySelector("[data-filter].active")?.getAttribute("data-filter") || "all");
  });

  /* Global balance sync — when any page changes REAL/ZAR/XP it fires
     'shahnama:state_sync'; re-sync RealPlayer from localStorage so
     the hero upgrade check always reads the freshest balance, and
     rebuild the Haft Khan view live if it is currently visible. */
  window.addEventListener("shahnama:state_sync", (e) => {
    try {
      const detail = e.detail;
      if (detail && window.RealPlayer && window.RealPlayer.set) {
        window.RealPlayer.set({ balance: detail.balance || 0, zar: detail.zar || 0 });
      }
    } catch {}
    const hkView = document.getElementById("haft-khan-view");
    if (hkView && hkView.style.display !== "none") {
      loadOwned();
      buildHaftKhanView();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
