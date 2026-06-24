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

  /* Map chapter number → its localStorage slug (heroes.js card-gate numbering) */
  const CH_SLUG = {
    1:  "keyumars",        2:  "hushang",           3:  "tahmuras",
    4:  "jamshid",         5:  "zahhak",             6:  "fereydun",
    7:  "manuchehr",       8:  "nozar",              9:  "zal",
    10: "rudabeh",         11: "birth-of-rostam",    12: "rostam",
    13: "sohrab",          14: "siavash",            15: "kay-kavus",
    16: "kay-khosrow",     17: "akvan",              18: "bijan-manijeh",
    19: "great-war-turan", 20: "lohrasp",            21: "goshtasp",
    22: "esfandiyar",      23: "seven-labours-esp",  24: "clash-rostam-esp",
    25: "simorgh",
    26: "rostams-end",     27: "bahman",             28: "homay",
    29: "darab",           30: "dara",               31: "alexander",
    32: "ashkanian-age",   33: "ardavan",            34: "ardeshir",
    35: "shapur",          36: "bahram-gur",         37: "yazdegerd-sinner",
    38: "bahram-chubin",   39: "anushirvan",         40: "nushzad",
    41: "hormuz",          42: "khosrow-parviz",     43: "shirin",
    44: "crumbling-crown", 45: "yazdegerd-iii",      46: "arab-conquest",
    47: "mourning-pars",   48: "memory-over-sword",  49: "ferdowsi-legacy",
    50: "ages-end",
    "haft-khan":     "rudabeh",
    "haft-khan-esp": "esfandiyar",
  };

  /* Full ordered slug list matching the API's catalog chapter ordering (49 chapters) */
  const STORY_SLUGS = [
    "keyumars","hushang","tahmuras","jamshid","zahhak",
    "fereydun","manuchehr","nozar","zal","rudabeh",
    "birth-of-rostam","rostam","sohrab","simorgh","akvan",
    "seven-labours-esp","siavash","kay-kavus","kay-khosrow",
    "bijan-manijeh","great-war-turan","lohrasp",
    "goshtasp","esfandiyar","clash-rostam-esp","rostams-end",
    "memory-over-sword","bahman","homay","darab","dara",
    "alexander","mourning-pars","ashkanian-age","ardavan",
    "ardeshir","shapur","yazdegerd-sinner","bahram-gur","anushirvan",
    "nushzad","hormuz","bahram-chubin","khosrow-parviz","shirin",
    "yazdegerd-iii","arab-conquest","ages-end","ferdowsi-legacy",
  ];

  const STORY_NAME = {
    1:"The First King",        2:"The Fire-Maker",         3:"Tahmuras",
    4:"The Golden Age",        5:"The Serpent Tyrant",     6:"The Liberator",
    7:"Manuchehr",             8:"Nozar",                  9:"Zal",
    10:"Rudabeh",              11:"Birth of Rostam",       12:"Rostam",
    13:"Rostam & Sohrab",      14:"The Simorgh",           15:"Akvan Div",
    16:"Haft Khan — Esfandiyar", 17:"Siavash",             18:"Kay Kavus",
    19:"Kay Khosrow",          20:"Bijan & Manijeh",       21:"The Great War",
    22:"Lohrasp",              23:"Goshtasp",              24:"Esfandiyar",
    25:"Clash at the Mountain",26:"Rostam's End",          27:"Memory Over Sword",
    28:"Bahman",               29:"Homay",                 30:"Darab",
    31:"Dara",                 32:"Alexander",             33:"Mourning Pars",
    34:"The Ashkanian Age",    35:"Ardavan",               36:"Ardeshir",
    37:"Shapur",               38:"Yazdegerd the Sinner",  39:"Bahram Gur",
    40:"Anushirvan",           41:"Nushzad",               42:"Hormuz",
    43:"Bahram Chubin",        44:"Khosrow Parviz",        45:"Shirin",
    46:"Yazdegerd III",        47:"The Arab Conquest",     48:"Ages End",
    49:"Ferdowsi's Legacy",
  };

  const currentStoryChapter = () => {
    try {
      let last = 0;
      STORY_SLUGS.forEach((slug, i) => {
        if (localStorage.getItem("real_chapter_done_" + slug) === "1") last = i + 1;
      });
      return last + 1;
    } catch { return 1; }
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
      name_ru: "Кеюмарс",
      role_ru: "Первый царь · Горный двор",
      lore_ru: "Первый смертный царь, надевший венец из листьев и правивший со священных гор, научивший человечество готовить пищу, шить одежду и жить по порядку, а не как дикари.",
      biography_ru: "Рождённый из священных гор на заре времён, Кеюмарс был первым существом, заявившим о своей власти над миром смертных. Он построил свой двор на склонах Дамаванда и научил людей первым искусствам цивилизации — одежде, кулинарии, церемониям и закону. Его правление установило божественный образец для всех будущих персидских царей, а его Фарр (божественная слава) был первым светом в эпоху человечества.",
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
      name_ru: "Первый календарь",
      role_ru: "Цивилизационное достижение · Порядок времени",
      lore_ru: "Кеюмарс разделил год на сезоны и научил человечество измерять время. Из этого упорядочивания дней родилось земледелие, праздники и первый великий ритм цивилизации.",
      biography_ru: "Создание календаря было одним из самых глубоких даров Кеюмарса человечеству — более долговечным, чем любой дворец или одежда. Разделив год на сезоны, а сезоны на дни, он дал человечеству способность планировать, помнить и предвидеть. Персидский календарь происходит по непрерывной линии от этого первого упорядочивания времени. От него произошли Новруз, Мехреган, Саде, Йалда — вся архитектура персидской праздничной жизни. Время, будучи измеренным, стало человеческим.",
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
      name_ru: "Сиамак",
      role_ru: "Принц горы · Павший герой",
      lore_ru: "Сын Кеюмарса, первый принц эпохи. Сиамак погиб в битве со слугами Ахримана, став мучеником, чья смерть выковала первую решимость человечества против тьмы.",
      biography_ru: "Сын и избранный наследник Кеюмарса. Смерть Сиамака от рук Чёрного Дива Ахримана была первой великой трагедией мира — моментом, когда человечество осознало смертность и истинную цену противостояния света тьме. Его жертва побудила Хушанга мстить за него, и через эту мсту пламя цивилизации осталось живым.",
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
      name_ru: "Хушанг",
      role_ru: "Создатель огня · Внук Кеюмарса",
      lore_ru: "Хушанг отомстил за Сиамака и отбросил тьму. Он открыл огонь, ударив кремнем о камень, зажёг первый очаг и дал человечеству тепло, металлообработку и пиры.",
      biography_ru: "Внук Кеюмарса и мститель за Сиамака, Хушанг стал вторым великим царём мира. Там, где Кеюмарс установил порядок, Хушанг дал человечеству орудия материального прогресса. Он открыл огонь, когда чёрная змея, которую он преследовал, метнулась по камням — кремень дал искры. Он провозгласил огонь священным для Ахура Мазды, выковал первые железные орудия, охотился на великих зверей и построил первые ирригационные каналы.",
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
      name_ru: "Ахриман",
      role_ru: "Владыка Тьмы · Босс Главы 1",
      lore_ru: "Вечный противник. Ахриман послал своего Чёрного Дива уничтожить Сиамака, надеясь погасить первое пламя цивилизации, прежде чем оно сможет распространиться. Его замыслы древние, терпеливые и неумолимые.",
      biography_ru: "Вечный принцип тьмы в зороастрийской космологии, Ахриман — не просто враждебный царь, а воплощение разрушения, хаоса и Лжи (Друдж). Он действует через посредников — дивов, колдунов, развращённых царей — а не появляется напрямую. Его терпение геологическое, его злоба тотальна. Столкновение в Главе 1 — лишь первая тень, падающая на мир.",
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
      name_ru: "Чёрный Див",
      role_ru: "Тёмный слуга · Демон Ахримана",
      lore_ru: "Могучий див, посланный Ахриманом, чтобы убить Сиамака. Чёрный Див воплощал силы хаоса — но его поражение от Хушанга выковало первую настоящую победу человечества над тьмой.",
      biography_ru: "Один из самых страшных дивов на службе Ахримана. Чёрный Див был послан уничтожить Сиамака и преуспел — но тем самым пробудил праведную ярость Хушанга и выковал первую человеческую волю противостоять тьме. Когда Хушанг гнался за чёрной змеёй по каменистой земле, искры от удара его кремня зажгли первый огонь мира — свет, рождённый из самой тёмной встречи.",
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
      name_ru: "Гора Дамаванд",
      role_ru: "Священная вершина · Трон Кеюмарса",
      lore_ru: "Великий вулкан в сердце мира. Кеюмарс построил свой первый двор на его склонах, и с этих высот человеческая цивилизация распространилась вширь. Дамаванд наблюдает за всеми эпохами Персии.",
      biography_ru: "Великая вулканическая гора северной Персии, Дамаванд — это и трон Кеюмарса, и — в более поздних главах — тюрьма тирана Заххака. Это ось персидского мифологического мира, где божественность касается земли. Его увенчанная снегом вершина видна со всей страны, а его склоны священны для Ахура Мазды. Каждая глава Шахнаме отбрасывает свою тень на Дамаванд.",
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
      name_ru: "Царский двор",
      role_ru: "Первый дворец · Место трона",
      lore_ru: "Двор, построенный Кеюмарсом на склонах Дамаванда — где были произнесены первые законы, проведены первые церемонии и сложены первые песни хвалы.",
      biography_ru: "Двор Кеюмарса на вершине священной горы был первым человеческим институтом. Построенный из камня и обтянутый шкурами диких животных, он был грубым по позднейшим меркам, но величественным по своему значению: первое сооружение, намеренно возведённое для размещения закона, ритуала и общественного порядка. Каждый последующий персидский двор ведёт свою легитимность от этого горного зала.",
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
      name_ru: "Древний Парс",
      role_ru: "Земля происхождения · Родина шахов",
      lore_ru: "Первозданное сердце земли, из которого все персидские цари черпали свой божественный мандат. Кеюмарс прошёл по её рекам и горам до своего царствования.",
      biography_ru: "Родовая земля персидских народов. До городов, до полей, до огня земля древнего Парса была дикими горами и неукротимыми реками, где первые племена скитались по своему божественному мандату. Кеюмарс прошёл эту землю как царь-пастух, прежде чем взойти на Дамаванд. Фарр этой земли древен, глубок и неизменен.",
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
      name_ru: "Лес демонов",
      role_ru: "Тёмное царство · Владения слуг Ахримана",
      lore_ru: "Тенистый лес, где обитал Чёрный Див. Его тьма была первым врагом, с которым столкнулось человечество — и, столкнувшись с ним, Хушанг нашёл искру, что стала огнём.",
      biography_ru: "Первозданный тёмный лес на краю известного мира, где обитали дивы Ахримана, недосягаемые для людей. Именно здесь Чёрный Див устроил засаду на Сиамака. Когда Хушанг погнался за тем, что считал великой змеёй, в этот лес и ударил кремнем по его камню, огонь родился на самом тёмном краю мира — свет, возникший из места глубочайшей тени.",
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
      name_ru: "Фарр — Божественный свет",
      role_ru: "Божественное понятие · Царская слава",
      lore_ru: "Фарр (Хварена) — божественное сияние, отмечающее законного царя. Его невозможно захватить силой — только заслужить справедливостью, мудростью и доблестью.",
      biography_ru: "Фарр (или Хварена на авестийском) — это движущий принцип законного персидского царствования. Это божественное сияние, что нисходит на праведных правителей и покидает тиранов. Его невозможно унаследовать лишь по крови, ни захватить завоеванием — его дарует космический порядок. Когда Кеюмарс носил венец из листьев, он несёт Фарр. Когда цари становятся развращёнными, Фарр взлетает великой птицей и ищет более достойный сосуд.",
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
      name_ru: "Гора Альборз",
      role_ru: "Священный хребет · Первый рубеж",
      lore_ru: "Великий горный хребет, охраняющий северный край Персии. Кеюмарс впервые осмотрел своё царство с этих вершин, прежде чем спуститься к Дамаванду.",
      biography_ru: "Гора Альборз — великий хребет северной Персии — это первый рубеж цивилизованного мира. Именно с этих высот Кеюмарс впервые взглянул на землю, что станет его царством. Хребет Альборз стоит стеной между упорядоченным миром шахов и хаотичной дикой природой за ним, а его высочайшие вершины касаются царства божественного.",
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
      name_ru: "Фраваши",
      role_ru: "Божественный проводник · Крылатый символ Персии",
      lore_ru: "Фраваши — божественный дух-проводник, сопровождающий каждую душу — крылатое существо, представляющее высшее «я», выбор в сторону света и хранитель праведного пути.",
      biography_ru: "Фраваши (или Фраваши) — один из самых глубоких символов зороастрийской мысли — божественный духовный двойник, существующий до рождения и сохраняющийся после смерти. Это не просто ангел-хранитель, а стремящееся высшее «я»: версия вас, что уже избрала праведность. В персидской царской иконографии крылатый диск с человеческой фигурой символизирует божественное одобрение законности царя.",
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
      name_ru: "Шкуры леопарда",
      role_ru: "Первая броня · Одеяние горного царя",
      lore_ru: "Пятнистые шкуры горного леопарда — первая одежда, которую Кеюмарс дал человечеству. До тканой одежды шкура леопарда была знаком царя и первым человеческим достоинством.",
      biography_ru: "До того как было известно искусство прядения и ткачества, Кеюмарс облачил свой двор в шкуры горных леопардов. Это были не просто одеяния, а символы владычества — царь, способный укротить дикого горного хищника и заявить права на его шкуру, стоял выше неукрощённого мира. Пятнистые узоры стали первым геральдическим знаком династии Пешдадидов.",
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
      name_ru: "Чёрный демон",
      role_ru: "Сын Ахримана · Врата тьмы",
      lore_ru: "Рождённый из самой тёмной воли Ахримана, Чёрный демон — посредник между миром смертных и владениями Ахримана, сильнее Чёрного Дива, порог, который нужно преодолеть, прежде чем встретиться с владыкой тьмы напрямую.",
      biography_ru: "Чёрный демон стоит между миром людей и присутствием самого Ахримана. Там, где Чёрный Див был могучим слугой, посланным с заданием, Чёрный демон — постоянный хранитель тёмного порога. Его невозможно обойти; с ним нужно столкнуться. Только после того как его сила поглощена вашей коллекцией, можно приблизиться к самому Ахриману. Он — испытание перед финальной тьмой.",
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
      name_ru: "Открытие огня",
      role_ru: "Событие, изменившее мир · Искра цивилизации",
      lore_ru: "В тот миг, когда Хушанг ударил кремнем о камень, преследуя чёрную змею, огонь вошёл в мир. Он провозгласил его священным для Ахура Мазды, и человечество преобразилось навсегда.",
      biography_ru: "Когда Хушанг гнался за тем, что считал великой змеёй, по каменистому склону, его меч ударил по валуну, и искры взметнулись вверх — и из этих искр родился первый огонь мира. Он собрал свой народ, провозгласил огонь самым священным даром Ахура Мазды, и в ту ночь устроил первый в мире пир при свете пламени. Праздник Саде — отмечаемый и сегодня — увековечивает этот ключевой момент. От огня пришли кулинария, металлообработка, тепло и начало цивилизации.",
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
      name_ru: "Праздник Саде",
      role_ru: "Рождение огня · Первый праздник",
      lore_ru: "Ночь, когда огонь вошёл в мир. Хушанг ударил кремнем по змее, что увернулась — и промахнувшийся камень зажёг дерево. Он назвал эту ночь Саде. Её отмечают до сих пор.",
      biography_ru: "Праздник Саде родился из промаха. Хушанг гнался за чёрной змеёй через каменистый перевал, метнул в неё кремень и промахнулся. Камень ударился о скалу, и взметнулась искра. Загорелось дерево. Хушанг собрал свой народ и дал ночи имя. С той ночи огонь был дан человечеству.",
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
      name_ru: "Первая кузница",
      role_ru: "Колыбель железа · Рождение ремесла",
      lore_ru: "Хушанг направил огонь на железную руду, и кузница родилась. Каждое оружие, каждый плуг, каждый молот несёт родословную к этому склону Парса.",
      biography_ru: "Первая кузница на склонах Парса — где открытие огня Хушангом немедленно обратилось к железной руде. Первый удар молота прозвучал через горы. Из этой кузницы вышли клинок, плуг, топор. То, что Каве-кузнец совершит в главе 5, имеет свой глубочайший корень в этом моменте.",
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
      name_ru: "Железный топор Хушанга",
      role_ru: "Первое железное оружие · Реликвия Главы 2",
      lore_ru: "Первое железное оружие, выкованное в Парсе — заслуженное освоением главы Хушанга. Топор, что строил цивилизацию и защищал её одним и тем же ударом.",
      biography_ru: "Выкован в первой кузнице на склонах Парса. Железный топор Хушанга — и оружие, и символ — первый раз, когда человечество превратило дар огня в нечто, способное и строить, и защищать. Топор давался тем, кто овладел секретами главы.",
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
      name_ru: "Тахмурас",
      role_ru: "Девбанд · Сын Хушанга · Наследник кузницы",
      lore_ru: "Сын Хушанга. Он наблюдает за кузницей, считает демонов, что сбежали в горы, и составляет список. В следующей главе он использует его.",
      biography_ru: "Сын Хушанга, наследник огня и кузницы. Тахмурас возьмёт ремёсла, созданные отцом, и пронесёт их через более тёмное испытание: борьбу с демонами мира, принуждение самого Ахримана стать его скакуном, и обмен жизней связанного войска демонов на тридцать алфавитов. Письменное слово входит в мир через его милосердие.",
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
      name_ru: "Тахмурас — Девбанд",
      role_ru: "Третий царь · Связавший демонов · Отец письменности",
      lore_ru: "Он сделал самого Ахримана своим скакуном. Он заковал в цепи две трети войска демонов. Он принял тридцать алфавитов в обмен на милосердие. Письменное слово — его наследие.",
      biography_ru: "Сын Хушанга, третий царь мира. Тахмурас заставил самого Ахримана служить ему скакуном, проехал через царство демонов и связал всё войско демонов. Две трети умоляли о жизни — и предложили то, что не могло добыть никакое железо: тридцать алфавитов. Тахмурас принял. Его недолгое правление посеяло семя каждой когда-либо написанной буквы.",
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
      name_ru: "Кипарисовая палица",
      role_ru: "Оружие связывания · Реликвия Главы 3",
      lore_ru: "Палица из кипарисового дерева — инструмент ремесленника, ставший царским оружием. Тахмурас нёс её через царство демонов и связал тьму мира с её помощью.",
      biography_ru: "Оружие, которое Тахмурас нёс, входя в царство демонов. Кипарис был священен: он растёт прямо, горит чисто и переживает почти всё, что посажено рядом с ним. С этой палицей и оседлав Ахримана, Тахмурас связал войско демонов и заслужил тридцать алфавитов. Даётся тем, кто осваивает главу 3.",
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
      name_ru: "Тридцать алфавитов",
      role_ru: "Происхождение письменности · Сделка милосердия",
      lore_ru: "Греческий. Тази. Пехлеви. Согдийский. Ещё двадцать шесть. Демоны обучили тридцати письменностям, чтобы сохранить свои жизни. Знание было куплено милосердием — и мир наконец смог запомнить себя.",
      biography_ru: "Тридцать алфавитов, которым демоны-писцы обучили Тахмураса в обмен на свои жизни. Сначала греческий — угловатый, гордый. Затем тази, пехлеви, согдийский и ещё двадцать шесть. Тахмурас сидел с глиняными табличками всю ночь, копируя каждый знак, пока его руки не запомнили их. Затем он научил своих детей. Каждое когда-либо написанное слово несёт долг этой сделке.",
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
      name_ru: "Джамшид",
      role_ru: "Четвёртый царь · Строитель мира · Падшее солнце",
      lore_ru: "Он разделил цивилизацию на четыре сословия. Он возвёл хрустальный трон. Он дал миру Новруз. Он правил триста лет без единой смерти. Затем он провозгласил себя богом — и потерял всё.",
      biography_ru: "Сын Тахмураса. Джамшид организовал цивилизацию в четыре сословия — мобедов, артештаров, вастошан, ахнухошиан. Он построил хрустальный трон, вознёсся в небо на Новруз и дал миру триста лет без смерти. Затем гордыня заменила мудрость. Он провозгласил себя источником всех вещей. Фарр покинул его — и с юга Заххак начал идти на север.",
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
      name_ru: "Хрустальный трон",
      role_ru: "Трон золотого века · Символ величия Джамшида",
      lore_ru: "Строился три года. Грани выровнены по восходу солнца. Швы невидимы. На Новруз он сияет в небе, как второе солнце. Руины Персеполиса до сих пор носят его имя.",
      biography_ru: "Джамшид потратил три года на его постройку — не потому, что с хрусталём трудно работать, а потому, что каждый шов должен был быть невидимым, а каждая грань выровнена по углам восхода солнца. В первый Новруз он сел на него и повелел демонам поднять его. Небо засияло. Люди, наблюдавшие снизу, назвали этот день Новрузом. Руины Персеполиса были названы Тахт-е Джамшид — Трон Джамшида — всеми, кто пришёл после.",
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
      name_ru: "Заххак",
      role_ru: "Грядущая тьма · Змеиный царь",
      lore_ru: "В этой главе он лишь идёт — змей пока нет. Но Шахнаме помещает его в кадр в тот же миг, когда фарр покидает Джамшида. Каждый уход света — это и приход тьмы.",
      biography_ru: "Рождён от арабского владыки в южной пустыне. Воспитан на честолюбии и шёпоте Ахримана. В главе 4 он лишь идёт на север — змей на его плечах пока нет, нет и тысячи лет тьмы. Но Шахнаме представляет его в тот момент, когда Джамшид теряет фарр. Две чёрные змеи вырастут из его плеч. Каждый день они будут требовать два человеческих мозга.",
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
      name_ru: "Рахш — Легендарный конь",
      role_ru: "Хан 1 · Конь Рустама · Рука спящего героя",
      lore_ru: "Пока Рустам спал, измученный, в тростниках, явился лев. Рахш сразился и убил его один, не разбудив хозяина. Первый из Семи подвигов был выиграт конём. Урок Фирдоуси: доверие, данное верному, никогда не напрасно.",
      biography_ru: "Рустам испытывал спину десяти тысяч лошадей, проверяя силу. Десять тысяч прогнулись. Рахш выстоял. Он нёс Рустама через каждый подвиг и каждую битву десятилетиями — не просто скакун, а второе «я».",
      unlockCondition_ru: "Завершите Главу 10 (Рудабе) · Рустам рождён",
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
      name_ru: "Мистический баран — Проводник пустыни",
      role_ru: "Хан 2 · Божественный посланник · Проводник через горящую пустыню",
      lore_ru: "Рустам и Рахш пересекли безводную пустыню и умирали от жажды. Рустам молился. Явился мистический баран и привёл их к скрытому источнику. Второй подвиг выигран божественной милостью — умением знать, когда просить помощи.",
      biography_ru: "Баран, что привёл Рустама к воде во втором подвиге, понимается в Шахнаме как божественный посланник — форма, что принимает Бог, когда герой, заслуживший милость, призывает её. Оазис милости, что он открыл, сохранил жизнь Рустаму на протяжении всех последующих подвигов.",
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
      name_ru: "Аждахо — Щит из драконьей кожи",
      role_ru: "Хан 3 · Трофей убийцы дракона · Терпение, выкованное в доспех",
      lore_ru: "Дракон нападал на Рустама три ночи подряд, исчезая каждый раз, когда Рахш будил его. Рустам разозлился на коня. На третью ночь он увидел дракона сам — и понял, что конь был прав всё это время. Вместе они убили его. Щит из его кожи никогда не забывает этот урок.",
      biography_ru: "Аждахо (дракон) третьего подвига — урок Шахнаме о доверии и терпении. Рустам почти восстал на своего самого верного союзника из нетерпения. Щит из кожи дракона — доспех этого выученного терпения.",
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
      name_ru: "Волшебная лютня — Ловушка иллюзии",
      role_ru: "Хан 4 · Крах колдуньи · Увидеть сквозь прекрасную ложь",
      lore_ru: "Рустам нашёл пиршественный стол в пустыне. Он играл на лютне, пел о своих печалях. Явилась прекрасная женщина и предложила вино. Когда Рустам произнёс имя Бога, она превратилась в отвратительную ведьму. Он убил её своим лассо. Лютня осталась — инструмент, что разоблачил иллюзию.",
      biography_ru: "Четвёртый подвиг — испытание Шахнаме на проницательность. Колдунья предлагает всё приятное — еду, вино, красоту. Её губит одно-единственное слово правды. Волшебная лютня, на которой Рустам играл той ночью, — инструмент этой правды.",
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
      name_ru: "Авлад — Захваченный проводник",
      role_ru: "Хан 5 · Множитель тактики · Враг, обращённый в пользу",
      lore_ru: "Рустам вошёл в Мазандеран и позволил Рахшу пастись на местном поле. Стражник Авлад напал со своими людьми. Рустам одолел их и захватил Авлада, пообещав сделать его царём Мазандерана, если он будет вести верно. Авлад согласился. Пятый подвиг — об обращении препятствия в актив.",
      biography_ru: "Авлад — урок Шахнаме о превращении противостояния. Он атакует, проигрывает и становится ключом ко всей миссии. У каждого препятствия есть информация. Мудрый воин извлекает эту информацию, а не просто уничтожает препятствие.",
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
      name_ru: "Голова дива Аржанга — Трофей ужаса",
      role_ru: "Хан 6 · Трофей демонического генерала · Грубая сила, сделанная видимой",
      lore_ru: "У врат Мазандерана Рустам атаковал войско дива Аржанга — демонического генерала. Рустам штурмовал его шатёр, схватил его, оторвал ему голову и бросил её среди войска демонов. Армия рассыпалась. Врата к тюрьме Кай Кавуса открылись. Иногда самый быстрый путь — самый прямой.",
      biography_ru: "Аржанг — не персонаж, а дверь. Его смерть открывает путь к Кай Кавусу. Шахнаме использует его поражение, чтобы показать: некоторые препятствия существуют лишь для того, чтобы быть устранёнными силой. Трофей его головы — доказательство, что прямое применение подавляющей силы иногда есть милосердие для всех причастных.",
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
      name_ru: "Див-е Сепид — Белый демон",
      role_ru: "Хан 7 · Белый демон · Последний подвиг · Высшая ценность летописи",
      lore_ru: "В тёмной пещере в сердце Мазандерана Рустам сражался с Белым демоном — величайшим демоном среднего цикла Шахнаме. Он был огромен, бледен, как гора железа. Их борьба сотрясла пещеру. Рустам вырвал его печень. Её кровь, накапанная в слепые глаза Кай Кавуса и его воинов, вернула им зрение. Седьмой подвиг — не просто победа. Это исцеление.",
      biography_ru: "Див-е Сепид — вершина Семи подвигов — враг, которого можно победить лишь после того, как все шесть предыдущих подвигов подготовили героя. До него нельзя добраться без верности Рахша, милости пустыни, терпения дракона, правды лютни, тактики Авлада и разбитых врат Аржанга. Он — доказательство, что подготовка есть истинное оружие.",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan: true, haft_khan_order: 7,
    },
  ];

  /* =========================================================
     HAFT KHAN-E ESFANDIYAR — The Seven Labours of Esfandiyar
     ========================================================= */
  COLLECTION.push(
    {
      id: "esp-wolves",
      name: "Twin Wolves — First Labour",
      name_fa: "دو گرگ — خانِ اول",
      name_tg: "Ду Гург — Хони Аввал",
      type: "creature", rarity: "rare", chapter: "haft-khan-esp",
      emoji: "🐺",
      role: "Khan 1 · Precision Under Charge · The First Test of Esfandiyar",
      role_fa: "خانِ اول · دقت در حملهٔ دشمن · نخستین آزمونِ اسفندیار",
      lore: "Two ferocious wolves blocked the road to Turan. Esfandiyar shot them both with his bow. The first labour was won by precision — the wolf's charge is fastest when it thinks you are afraid.",
      lore_fa: "دو گرگِ درنده سرِ راهِ توران را بستند. اسفندیار هر دو را با تیر زد. خانِ اول با دقت برده شد.",
      biography: "The twin wolves of the first labour are the Shahnameh's simplest test — brute threat met by cleaner skill. Esfandiyar does not negotiate or run. He draws his bow and shoots. The lesson is that directness, when it is sufficient, should not be complicated.",
      biography_fa: "دو گرگِ خانِ اول ساده‌ترین آزمونِ شاهنامه است — تهدیدِ خام در برابرِ مهارتِ پاک‌تر.",
      faction: "Creatures of the Road · Haft Khan Esfandiyar",
      mythologyRole: "Khan 1 · Speed and precision · First labour cleared by the bow",
      powers: ["+12% Tap Accuracy", "+50 Zar/hr", "Passive: Wolf's Speed — first tap of each session +20%"],
      storyAppearances: ["Haft Khan Esfandiyar — First Labour: The Wolves"],
      side: "light", season: 2, order: 70, cost: 4000, zar_per_hour: 50,
      collectionId: "S2-ESP-001", nftReady: false,
      unlockCondition: "Enter the Haft Khan-e Esfandiyar",
      name_ru: "Два волка — Первый подвиг",
      role_ru: "Хан 1 · Точность под натиском · Первое испытание Исфандияра",
      lore_ru: "Два свирепых волка преградили дорогу в Туран. Исфандияр застрелил обоих из лука. Первый подвиг был выиграт точностью — натиск волка быстрее всего, когда он думает, что вы боитесь.",
      biography_ru: "Два волка первого подвига — простейшее испытание Шахнаме: грубая угроза, встреченная более чистым умением. Исфандияр не вступает в переговоры и не бежит. Он натягивает лук и стреляет. Урок таков: прямота, когда она достаточна, не должна усложняться.",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan Esfandiyar · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan_esp: true, haft_khan_esp_order: 1,
    },
    {
      id: "esp-lions",
      name: "Twin Lions — Second Labour",
      name_fa: "دو شیر — خانِ دوم",
      name_tg: "Ду Шер — Хони Дуввум",
      type: "creature", rarity: "rare", chapter: "haft-khan-esp",
      emoji: "🦁",
      role: "Khan 2 · Strength Unmounted · Directness as Virtue",
      role_fa: "خانِ دوم · قدرت پیاده · فضیلتِ مستقیم بودن",
      lore: "Two lions stood guard at the second stage. Esfandiyar dismounted and fought them by hand. The second labour rewarded directness — he did not seek a tactical advantage. He stood in the path and refused to move.",
      lore_fa: "دو شیر نگهبانِ خانِ دوم بودند. اسفندیار پیاده شد و با دست با آن‌ها جنگید. خانِ دوم شجاعتِ مستقیم را پاداش داد.",
      biography: "The twin lions are the Shahnameh's tribute to straightforwardness. Lesser warriors seek the angle, the trick, the ambush. Esfandiyar dismounts because he trusts himself more than any tactic. That trust is the second labour's real reward.",
      biography_fa: "دو شیر درودِ شاهنامه به صراحت است. جنگجویانِ کم‌تر زاویه، حیله و کمین می‌جویند. اسفندیار پیاده می‌شود چون به خود بیشتر از هر تاکتیکی اعتماد دارد.",
      faction: "Creatures of the Road · Haft Khan Esfandiyar",
      mythologyRole: "Khan 2 · Brute strength in the open · The lion met on its own terms",
      powers: ["+18% Melee Tap Power", "+35 Zar/hr", "Passive: Unmounted — ZAR/hr +10% when offline"],
      storyAppearances: ["Haft Khan Esfandiyar — Second Labour: The Lions"],
      side: "light", season: 2, order: 71, cost: 5000, zar_per_hour: 35,
      collectionId: "S2-ESP-002", nftReady: false,
      prereq: { hero_id: "esp-wolves", level: 1 },
      unlockCondition: "Own Twin Wolves (Khan 1)",
      name_ru: "Два льва — Второй подвиг",
      role_ru: "Хан 2 · Сила без коня · Прямота как достоинство",
      lore_ru: "Два льва стояли на страже второго этапа. Исфандияр спешился и сразился с ними голыми руками. Второй подвиг наградил прямоту — он не искал тактического преимущества. Он встал на пути и отказался отступить.",
      biography_ru: "Два льва — дань Шахнаме прямоте. Менее значимые воины ищут угол, хитрость, засаду. Исфандияр спешивается, потому что доверяет себе больше любой тактики. Это доверие — настоящая награда второго подвига.",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan Esfandiyar · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan_esp: true, haft_khan_esp_order: 2,
    },
    {
      id: "esp-dragon",
      name: "The Blade Chariot — Dragon Slayer",
      name_fa: "ارابهٔ تیغ‌دار — اژدهاکُش",
      name_tg: "Аробаи Тӣғдор — Аждаҳокуш",
      type: "artifact", rarity: "epic", chapter: "haft-khan-esp",
      emoji: "🐉",
      role: "Khan 3 · Prepared Victory · The Dragon Fed Its Own Jaws",
      role_fa: "خانِ سوم · پیروزیِ از پیش آماده · اژدها جلویِ دهانِ خودش را خورد",
      lore: "A great dragon blocked the third stage. Esfandiyar had prepared a chariot fitted with long blades pointing outward in every direction. He drove it into the dragon's open jaws and the beast destroyed itself swallowing the blades. The third labour was won before it began.",
      lore_fa: "اژدهای عظیمی خانِ سوم را بست. اسفندیار ارابه‌ای با تیغ‌های بلند در همهٔ جهات آماده کرده بود. آن را به دهانِ باز اژدها راند و جانور با بلعیدنِ تیغ‌ها خودش را نابود کرد.",
      biography: "The blade chariot is the Shahnameh's most architectural victory — the problem is solved entirely by preparation. The dragon never had a chance to use its strength because the weapon was already inside it before the battle started. Esfandiyar's genius was not in the fight. It was in the engineering.",
      biography_fa: "ارابهٔ تیغ‌دار معماری‌ترین پیروزیِ شاهنامه است — مسئله کاملاً با آمادگی حل می‌شود.",
      faction: "War Machines · Haft Khan Esfandiyar",
      mythologyRole: "Khan 3 · Victory by design · Engineering defeats brute force",
      powers: ["+25% Tap Power vs Boss", "+70 Zar/hr", "Passive: Prepared Ground — quest completion +15%"],
      storyAppearances: ["Haft Khan Esfandiyar — Third Labour: The Dragon"],
      side: "light", season: 2, order: 72, cost: 7000, zar_per_hour: 70,
      collectionId: "S2-ESP-003", nftReady: false,
      prereq: { hero_id: "esp-lions", level: 1 },
      unlockCondition: "Own Twin Lions (Khan 2)",
      name_ru: "Колесница с лезвиями — Убийца дракона",
      role_ru: "Хан 3 · Подготовленная победа · Дракон, накормивший свою же пасть",
      lore_ru: "Великий дракон преградил третий этап. Исфандияр подготовил колесницу, оснащённую длинными лезвиями, торчащими во все стороны. Он направил её в открытую пасть дракона, и зверь уничтожил себя сам, проглотив лезвия. Третий подвиг был выиграт ещё до того, как начался.",
      biography_ru: "Колесница с лезвиями — самая «инженерная» победа Шахнаме: проблема решена целиком подготовкой. У дракона никогда не было шанса использовать свою силу, потому что оружие уже было внутри него до начала битвы. Гениальность Исфандияра была не в бою. Она была в инженерии.",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan Esfandiyar · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan_esp: true, haft_khan_esp_order: 3,
    },
    {
      id: "esp-sorceress",
      name: "The Sorceress of Turan — Fourth Labour",
      name_fa: "جادوگرِ توران — خانِ چهارم",
      name_tg: "Ҷодугари Турон — Хони Чорум",
      type: "enemy", rarity: "epic", chapter: "haft-khan-esp",
      emoji: "🧿",
      role: "Khan 4 · The Beautiful Deception · Faith Unmasks What Power Cannot",
      role_fa: "خانِ چهارم · فریبِ زیبا · ایمان آنچه را قدرت نمی‌تواند رو می‌کند",
      lore: "A sorceress appeared as a beautiful woman and lured Esfandiyar with feasting and enchantment. He spoke the name of God. Her true form was revealed — hideous and old. He killed her. The fourth labour is the test of discernment: the beautiful trap is the most dangerous kind.",
      lore_fa: "جادوگری به صورتِ زنی زیبا ظاهر شد و اسفندیار را با ضیافت و جادو فریفت. او نامِ خدا را برد. چهرهٔ واقعی‌اش آشکار شد. خانِ چهارم آزمونِ تشخیص است.",
      biography: "The sorceress of the fourth labour is the Shahnameh's lesson that disguise fails at the name of God. Not because God intervenes — but because a man who has truly earned his faith cannot be deceived by surfaces. Esfandiyar did not need magic to defeat magic. He needed sincerity.",
      biography_fa: "جادوگرِ خانِ چهارم درسِ شاهنامه است که تغییرِ چهره در برابرِ نامِ خدا شکست می‌خورد.",
      faction: "Dark Illusions · Haft Khan Esfandiyar",
      mythologyRole: "Khan 4 · Faith defeats deception · The name of God as the only weapon",
      powers: ["+1 Quiz hint per day", "+85 Zar/hr", "Passive: Unveiled — hidden resource spawns +18%"],
      storyAppearances: ["Haft Khan Esfandiyar — Fourth Labour: The Sorceress"],
      side: "dark", season: 2, order: 73, cost: 9000, zar_per_hour: 85,
      collectionId: "S2-ESP-004", nftReady: false,
      prereq: { hero_id: "esp-dragon", level: 1 },
      unlockCondition: "Own Blade Chariot (Khan 3)",
      name_ru: "Колдунья Турана — Четвёртый подвиг",
      role_ru: "Хан 4 · Прекрасный обман · Вера разоблачает то, что не может сила",
      lore_ru: "Колдунья явилась прекрасной женщиной и заманила Исфандияра пиром и колдовством. Он произнёс имя Бога. Её истинный облик раскрылся — отвратительный и старый. Он убил её. Четвёртый подвиг — испытание на проницательность: прекрасная ловушка — самая опасная.",
      biography_ru: "Колдунья четвёртого подвига — урок Шахнаме о том, что маскировка терпит крах перед именем Бога. Не потому, что Бог вмешивается — а потому, что человека, истинно заслужившего свою веру, нельзя обмануть внешностью. Исфандияру не нужна была магия, чтобы победить магию. Ему нужна была искренность.",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan Esfandiyar · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan_esp: true, haft_khan_esp_order: 4,
    },
    {
      id: "esp-simorgh",
      name: "The Shadow Simorgh — Fifth Labour",
      name_fa: "سیمرغِ سایه — خانِ پنجم",
      name_tg: "Симурғи Соя — Хони Панҷум",
      type: "creature", rarity: "legend", chapter: "haft-khan-esp",
      emoji: "🦅",
      role: "Khan 5 · The Dark Mirror of Grace · Even Sacred Symbols Cast Shadows",
      role_fa: "خانِ پنجم · آینهٔ تاریکِ لطف · حتی نمادهای مقدس سایه می‌اندازند",
      lore: "The fifth labour set a great Simorgh against Esfandiyar — not the gentle guardian who raised Zal, but its dark reflection: enormous, predatory, blotting out the sun. Esfandiyar shot it from the sky. Even the most sacred symbols have shadow forms that must be faced.",
      lore_fa: "خانِ پنجم سیمرغِ بزرگی را در برابرِ اسفندیار گذاشت — نه نگهبانِ مهربانی که زال را پرورد، بلکه بازتابِ تاریکِ او. اسفندیار او را از آسمان زد.",
      biography: "The Simorgh of the fifth labour is among the most philosophically complex moments in the Haft Khan. Esfandiyar has to kill a creature the reader has been taught to revere. Ferdowsi's point is careful: there are dark forms of every sacred thing, and a hero must be capable of distinguishing them.",
      biography_fa: "سیمرغِ خانِ پنجم از نظرِ فلسفی پیچیده‌ترین لحظاتِ هفت‌خان است. اسفندیار باید موجودی را بکشد که خواننده آموخته به او احترام بگذارد.",
      faction: "Creatures of Turan · Haft Khan Esfandiyar",
      mythologyRole: "Khan 5 · Sacred form corrupted · The shadow of the divine",
      powers: ["+22% Energy Regen", "+100 Zar/hr", "Passive: Shadow Eye — rare card drop chance +12%"],
      storyAppearances: ["Haft Khan Esfandiyar — Fifth Labour: The Simorgh"],
      side: "dark", season: 2, order: 74, cost: 12000, zar_per_hour: 100,
      collectionId: "S2-ESP-005", nftReady: false,
      prereq: { hero_id: "esp-sorceress", level: 1 },
      unlockCondition: "Own Sorceress of Turan (Khan 4)",
      name_ru: "Тень Симурга — Пятый подвиг",
      role_ru: "Хан 5 · Тёмное зеркало милости · Даже священные символы отбрасывают тень",
      lore_ru: "Пятый подвиг выставил против Исфандияра великого Симурга — не нежного хранителя, что вырастил Заля, а его тёмное отражение: огромное, хищное, затмевающее солнце. Исфандияр сбил его с небес. Даже у самых священных символов есть теневые формы, которым нужно противостоять.",
      biography_ru: "Симург пятого подвига — один из самых философски сложных моментов Семи подвигов. Исфандияр должен убить существо, которое читателя учили почитать. Мысль Фирдоуси осторожна: у всего священного есть тёмные формы, и герой должен уметь их различать.",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan Esfandiyar · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan_esp: true, haft_khan_esp_order: 5,
    },
    {
      id: "esp-blizzard",
      name: "The Great Blizzard — Sixth Labour",
      name_fa: "کولاکِ بزرگ — خانِ ششم",
      name_tg: "Буронии Бузург — Хони Шашум",
      type: "artifact", rarity: "mythic", chapter: "haft-khan-esp",
      emoji: "❄",
      role: "Khan 6 · The Enemy That Cannot Be Fought · Will Over Nature",
      role_fa: "خانِ ششم · دشمنی که نمی‌توان با او جنگید · اراده بر طبیعت",
      lore: "No enemy came at the sixth stage — only the sky. A blizzard of such force it buried soldiers alive descended on the army. There was nothing to defeat with a sword. Esfandiyar led his army through by will alone. The sixth labour taught what cannot be fought — only outlasted.",
      lore_fa: "در خانِ ششم هیچ دشمنی نیامد — فقط آسمان. کولاکی به قدری شدید که سربازان را زنده زیرِ خود دفن کرد. اسفندیار سپاهش را فقط با اراده عبور داد.",
      biography: "The blizzard is the Shahnameh's most unusual labour — the enemy is the world itself. Esfandiyar cannot stab it, cannot outmanoeuvre it, cannot reason with it. He can only persist. The sixth labour is the greatest lesson of the Haft Khan: sometimes endurance is the only weapon, and it is enough.",
      biography_fa: "کولاک غیرمعمول‌ترین خانِ شاهنامه است — دشمن خودِ جهان است. اسفندیار نمی‌تواند آن را بزند، دور بزند یا با آن استدلال کند. فقط می‌تواند پایدار بماند.",
      faction: "Forces of Nature · Haft Khan Esfandiyar",
      mythologyRole: "Khan 6 · Endurance as heroism · Nature's indifference defeated by will",
      powers: ["+35% Tap Power (Endurance)", "+150 Zar/hr", "Passive: Into the Storm — daily streak bonus +25%"],
      storyAppearances: ["Haft Khan Esfandiyar — Sixth Labour: The Blizzard"],
      side: "light", season: 2, order: 75, cost: 18000, zar_per_hour: 150,
      collectionId: "S2-ESP-006", nftReady: false,
      prereq: { hero_id: "esp-simorgh", level: 1 },
      unlockCondition: "Own Shadow Simorgh (Khan 5)",
      name_ru: "Великая буря — Шестой подвиг",
      role_ru: "Хан 6 · Враг, с которым нельзя сражаться · Воля над природой",
      lore_ru: "На шестом этапе не было врага — только небо. Буря такой силы, что хоронила солдат живьём, опустилась на армию. Нечего было поразить мечом. Исфандияр провёл свою армию сквозь неё одной лишь волей. Шестой подвиг учил тому, с чем нельзя сражаться — только пережить.",
      biography_ru: "Буря — самый необычный подвиг Шахнаме: враг — сам мир. Исфандияр не может её заколоть, не может её обойти, не может с ней рассуждать. Он может лишь выстоять. Шестой подвиг — величайший урок Семи подвигов: иногда выносливость — единственное оружие, и этого достаточно.",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan Esfandiyar · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan_esp: true, haft_khan_esp_order: 6,
    },
    {
      id: "esp-ruyeen-dej",
      name: "Ruyeen-Dej — The Brass Fortress",
      name_fa: "رویین‌دژ — دژِ برنجین",
      name_tg: "Руйиндеж — Қалъаи Биринҷӣ",
      type: "artifact", rarity: "mythic", chapter: "haft-khan-esp",
      emoji: "🏰",
      role: "Khan 7 · The Brass Fortress · Sisters Freed · Intelligence Defeats the Unbreakable",
      role_fa: "خانِ هفتم · دژِ برنجین · خواهران آزاد شدند · هوش بر شکست‌ناپذیر پیروز شد",
      lore: "At the end of the seven labours stood Ruyeen-Dej — the Brass Fortress, impenetrable by force. Behind its walls his sisters Humay and Hamaspand were held captive. Esfandiyar had crossed six labours by sword and arrow. He crossed the seventh as a merchant. The brass walls fell without a blow.",
      lore_fa: "در پایانِ هفت خان، رویین‌دژ ایستاده بود — دژِ برنجین که با زور نفوذناپذیر بود. پشتِ دیوارهایش خواهرانش حُمای و همسپندش اسیر بودند. اسفندیار شش خان را با شمشیر و تیر گذشته بود. هفتمین را به صورتِ بازرگانی گذشت.",
      biography: "Ruyeen-Dej is the pinnacle of the Haft Khan-e Esfandiyar — and its final lesson. Six labours proved strength, speed, preparation, faith, judgment, and endurance. The seventh required none of those. It required intelligence. The unbreakable fortress falls to the man who stops trying to break it.",
      biography_fa: "رویین‌دژ اوجِ هفت‌خانِ اسفندیار است — و آخرین درسِ آن. شش خان قدرت، سرعت، آمادگی، ایمان، قضاوت و استقامت را ثابت کرد. هفتمین به هیچ‌کدام از آن‌ها نیاز نداشت. به هوش نیاز داشت.",
      faction: "Fortresses of Turan · Haft Khan Esfandiyar · Liberation",
      mythologyRole: "Khan 7 · Brass fortress taken by wit · Sisters freed · End of the Haft Khan",
      powers: ["+45% Tap Power (Liberation Force)", "+200 Zar/hr", "Passive: The Merchant's Gate — offline ZAR income +30%"],
      storyAppearances: ["Haft Khan Esfandiyar — Seventh Labour: Ruyeen-Dej", "Liberation of Humay and Hamaspand"],
      side: "light", season: 2, order: 76, cost: 25000, zar_per_hour: 200,
      collectionId: "S2-ESP-007", nftReady: false,
      prereq: { hero_id: "esp-blizzard", level: 1 },
      unlockCondition: "Own The Great Blizzard (Khan 6)",
      name_ru: "Руйин-Деж — Медная крепость",
      role_ru: "Хан 7 · Медная крепость · Сёстры освобождены · Разум побеждает неприступное",
      lore_ru: "В конце семи подвигов стоял Руйин-Деж — Медная крепость, неприступная силой. За её стенами держали в плену его сестёр Хумай и Хамаспанд. Исфандияр прошёл шесть подвигов мечом и стрелой. Седьмой он прошёл как купец. Медные стены пали без единого удара.",
      biography_ru: "Руйин-Деж — вершина Семи подвигов Исфандияра — и их последний урок. Шесть подвигов доказали силу, скорость, подготовку, веру, проницательность и выносливость. Седьмой не требовал ничего из этого. Он требовал разума. Неприступная крепость падает перед тем, кто перестаёт пытаться её сломать.",
      tonMetadata: { standard: "TEP-62", collection: "Haft Khan Esfandiyar · Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      haft_khan_esp: true, haft_khan_esp_order: 7,
    }
  );

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
      biography: "In 977 CE, in the city of Tus in Khorasan, an aging poet picked up a quill and began the greatest literary project in Persian history. Ferdowsi would spend 35 years writing the Shahnameh — the Book of Kings — with this instrument, preserving the Persian language and epic tradition through the Arab conquest.",
      powers: ["+3% Tap Power", "+3 Zar/hr", "Passive: Poet's Ink — story XP +5%"],
      storyAppearances: ["Poet Artifact: The Beginning · Tus 977 CE", "Ferdowsi Legacy: The First Verse"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-POET-001",
      season: 2,
      unlockCondition: "Purchase with REAL tokens",
      name_ru: "Перо Туса",
      role_ru: "Орудие поэта · Начало",
      lore_ru: "Перо, которое Фирдоуси окунул в чернила в 977 году н.э., чтобы написать первое двустишие Шахнаме. Тус, Хорасан. Свет лампы. Один поэт. 60 000 двустиший ещё впереди.",
      biography_ru: "В 977 году н.э. в городе Тус в Хорасане стареющий поэт взял перо и начал величайший литературный проект в истории Персии. Фирдоуси потратит 35 лет на написание Шахнаме — Книги царей — этим орудием, сохранив персидский язык и эпическую традицию через арабское завоевание.",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
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
      biography: "Ferdowsi composed the Shahnameh without guaranteed income. His family's land revenues declined over the decades he spent writing. When he finally presented the completed poem to Sultan Mahmud, expecting 60,000 gold coins, he received 60,000 silver dirhams instead — a fraction of what was promised. The empty purse is the symbol of genius unrewarded.",
      powers: ["+5% Story XP", "+14 Zar/hr", "Passive: Patron's Debt — quest reward +8%"],
      storyAppearances: ["Poet Artifact: The Patron's Betrayal", "Ferdowsi Legacy: Decades Without Pay"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-POET-002",
      season: 2,
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 4500,
      zar_per_hour: 14,
      prereq: { hero_id: "quill-of-tus", level: 1 },
      unlockCondition: "Own The Quill of Tus",
      unlockCondition_fa: "قلمِ طوس را داشته باشید",
      name_ru: "Пустой кошелёк",
      role_ru: "Финансовый крах · Предательство покровителя",
      lore_ru: "Доход Фирдоуси от земли таял, пока поэма росла. Десятилетиями он писал без надёжного покровительства. Кошель, привезённый в Газни, вернулся наполовину пустым — серебром вместо обещанного золота.",
      biography_ru: "Фирдоуси сочинял Шахнаме без гарантированного дохода. Доходы его семьи от земли снижались за десятилетия, что он провёл за письмом. Когда он наконец представил законченную поэму султану Махмуду, ожидая 60 000 золотых монет, он получил вместо них 60 000 серебряных дирхемов — лишь долю обещанного. Пустой кошель — символ невознаграждённого гения.",
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
      biography: "Around 1000 CE, as Ferdowsi was writing the Sohrab and Rostam chapter — the story of a father unknowingly killing his own son in battle — his real son died. The grief did not soften the poem. It sharpened it. Scholars believe the extraordinary emotional weight of the Sohrab chapter came from personal loss written into the verse in real time.",
      powers: ["+8% Story XP", "+28 Zar/hr", "Passive: Grief's Clarity — chapter completion XP +12%"],
      storyAppearances: ["Poet Artifact: The Father's Grief", "Chapter 13: Sohrab — The Real Loss Behind the Verse"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-POET-003",
      season: 2,
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 10000,
      zar_per_hour: 28,
      prereq: { hero_id: "empty-purse", level: 1 },
      unlockCondition: "Own The Empty Purse",
      unlockCondition_fa: "کیسه‌ی خالی را داشته باشید",
      name_ru: "Элегия сыну",
      role_ru: "Скорбь · Зеркало Сухраба",
      lore_ru: "Настоящий сын Фирдоуси умер, пока он писал главу о Сухрабе. Отец, неосознанно убивающий своего сына — и лекарство, удержанное расчётливым царём. Эта глава родилась из ещё свежей скорби.",
      biography_ru: "Около 1000 года н.э., когда Фирдоуси писал главу о Сухрабе и Рустаме — историю отца, неосознанно убившего собственного сына в бою — умер его настоящий сын. Скорбь не смягчила поэму. Она заострила её. Учёные считают, что необычайная эмоциональная тяжесть главы о Сухрабе пришла из личной утраты, вписанной в стих в реальном времени.",
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
      biography: "In 1010 CE, Ferdowsi presented the completed Shahnameh to Sultan Mahmud of Ghazni, expecting the promised reward of one gold coin per couplet — 60,000 dinars total. Mahmud paid in silver: 60,000 dirhams, worth a fraction of gold. Ferdowsi, furious, distributed the silver to a bathhouse worker and a beer seller, then wrote a devastating satire of Mahmud and fled Ghazni. The gold-laden caravans of atonement arrived in Tus as his funeral procession left the gates.",
      powers: ["+12% Story XP", "+65 Zar/hr", "Passive: The Broken Oath — passive income +15%"],
      storyAppearances: ["Poet Artifact: The Betrayal of Mahmud · 1010 CE", "Ferdowsi Legacy: The Bitter Satire"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-POET-004",
      season: 2,
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 22000,
      zar_per_hour: 65,
      prereq: { hero_id: "elegy-for-the-son", level: 1 },
      unlockCondition: "Own Elegy for the Son",
      unlockCondition_fa: "مرثیه‌ی پسر را داشته باشید",
      name_ru: "Холодное письмо султана",
      role_ru: "Предательство · Нарушенное обещание",
      lore_ru: "Махмуд обещал 60 000 золотых монет — по одной за каждое двустишие. Он заплатил 60 000 серебряных дирхемов. Фирдоуси написал на него горькую сатиру и сбежал. Возместительный платёж достиг Туса в день его похорон.",
      biography_ru: "В 1010 году н.э. Фирдоуси представил завершённую Шахнаме султану Махмуду Газневи, ожидая обещанной награды — одной золотой монеты за двустишие, всего 60 000 динаров. Махмуд заплатил серебром: 60 000 дирхемов, стоивших лишь долю золота. Фирдоуси, в гневе, раздал серебро банщику и продавцу пива, затем написал разрушительную сатиру на Махмуда и бежал из Газни. Караваны с золотом в искупление прибыли в Тус, когда его похоронная процессия покидала городские врата.",
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
      biography: "The Shahnameh — Book of Kings — was completed by Ferdowsi around 1010 CE in Tus, Khorasan. It took 35 years and produced approximately 60,000 couplets of Persian verse. The poem chronicled the mythological and historical kings of Persia from the first man to the Arab conquest. It preserved the Persian language against Arabization and became the founding text of modern Persian literature. Ferdowsi did not live to see his vindication.",
      powers: ["+20% Story XP", "+160 Zar/hr", "Passive: The Chronicle Lives — all passive income +20%"],
      storyAppearances: ["Poet Artifact: The Finished Manuscript · Tus 1010 CE", "Ferdowsi Legacy: 60,000 Couplets Complete"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-POET-005",
      season: 2,
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 40000,
      zar_per_hour: 160,
      prereq: { hero_id: "sultans-cold-letter", level: 1 },
      unlockCondition: "Own Sultan's Cold Letter",
      unlockCondition_fa: "نامه‌ی سردِ سلطان را داشته باشید",
      name_ru: "Завершённая рукопись",
      role_ru: "Труд всей жизни · 60 000 двустиший",
      lore_ru: "60 000 двустиший. 35 лет. Шахнаме, завершённая в Тусе, Хорасан, около 1010 года н.э. Персидский язык выжил. Летопись продолжается без него.",
      biography_ru: "Шахнаме — Книга царей — была завершена Фирдоуси около 1010 года н.э. в Тусе, Хорасан. На это потребовалось 35 лет, и было создано примерно 60 000 двустиший персидского стиха. Поэма летописала мифологических и исторических царей Персии от первого человека до арабского завоевания. Она сохранила персидский язык от арабизации и стала основополагающим текстом современной персидской литературы. Фирдоуси не дожил до своего оправдания.",
    }
  );

  /* ── Chapter Hero Cards — chapters 6–50 (one primary card per chapter) ───
     Unlock rule: card available after chapter is done (all quiz tiers passed).
     Cost scales with rarity. Zar/hr gives passive income incentive to collect.
     owned_heroes gate (ch 26–50) makes collection mandatory for progression.  */
  COLLECTION.push(

    /* ═══ PISHDADIAN RESTORATION — Ch 6–7 ════════════════════════════════ */
    {
      id: "fereydun-liberator", name: "Fereydun — The Liberator",
      name_fa: "فریدون — رهاننده", name_tg: "Фаридун — Озодкунанда",
      type: "character", rarity: "legend", chapter: 6, emoji: "⚡",
      img: "/season2/uploads/heroes/fereydun.png",
      role: "Sixth King · Slayer of Zahhak · Restorer of the Crown",
      role_fa: "ششمین شاه · کشنده‌ی ضحاک · بازگرداننده‌ی تاج",
      lore: "Hidden from Zahhak's hunters as an infant and raised by a holy cow, Fereydun returned a man with a cow-headed mace and broke a thousand years of tyranny in a single blow.",
      lore_fa: "فریدون که در کودکی از شکارچیان ضحاک پنهان شد و با گاوی مقدس پرورش یافت، با گرزی گاوسر بازگشت و هزار سال ستم را با یک ضربه شکست.",
      lore_tg: "Фаридун, ки дар кӯдакӣ аз шикорчиёни Заҳҳок пинҳон шуд, бо гурзи говсар баргашт ва ҳазор сол зулмро шикаст.",
      biography: "Born while Zahhak's spies searched every cradle in the land, Fereydun survived because his mother fled to the wilderness and gave him to the keeper of a sacred cow, Barmayeh, to nurse. He grew in secret, trained by the smith Kaveh — whose leather apron became the banner of revolt — and returned to Iran wielding a mace shaped like a bull's head. He struck down Zahhak at Mount Damavand, chained him in a cave rather than killing him outright, and was crowned king by the will of the people.",
      biography_fa: "فریدون در زمانی به دنیا آمد که جاسوسانِ ضحاک هر گهواره را می‌کاویدند. مادرش به بیابان گریخت و او را به نگهبانِ گاوِ مقدس، برمایه، سپرد. زیرِ تعلیمِ کاوه‌ی آهنگر — که پیشبندِ چرمی‌اش پرچمِ قیام شد — بزرگ شد و با گرزی به شکلِ سرِ گاو به ایران بازگشت و ضحاک را در دامنه‌ی دماوند بر زمین زد.",
      powers: ["+10% Tap Power", "+60 Zar/hr", "Passive: Kaveh's Banner — quiz hard-tier reward +10%"],
      side: "light", nftReady: false, season: 2, order: 298,
      collectionId: "S2-CH06-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 16000, zar_per_hour: 60, prereq: null,
      unlockCondition: "Complete Chapter 6 · Fereydun",
      unlockCondition_fa: "فصلِ ۶ (فریدون) را کامل کنید",
      name_ru: "Фаридун — Освободитель",
      role_ru: "Шестой царь · Победитель Заххака · Восстановитель короны",
      lore_ru: "Скрытый от охотников Заххака во младенчестве и выращенный священной коровой, Фаридун вернулся мужчиной с булавой в форме бычьей головы и сломал тысячу лет тирании одним ударом.",
      biography_ru: "Рождённый в то время, когда шпионы Заххака обыскивали каждую колыбель в стране, Фаридун выжил, потому что его мать сбежала в глушь и отдала его на воспитание хранителю священной коровы Бармайе. Он рос в тайне, обученный кузнецом Каве — чей кожаный передник стал знаменем восстания — и вернулся в Иран, держа булаву в форме бычьей головы. Он сразил Заххака на горе Дамаванд, заковал его в цепи в пещере, вместо того чтобы убить сразу, и был коронован царём по воле народа.",
    },
    {
      id: "manuchehr-avenger", name: "Manuchehr — The Avenger",
      name_fa: "منوچهر — انتقام‌گیر", name_tg: "Манучеҳр — Интиқомгиранда",
      type: "character", rarity: "epic", chapter: 7, emoji: "🗡",
      img: "/season2/uploads/heroes/manuchehr.png",
      role: "Grandson of Fereydun · King of Iran · Punisher of Salm and Tur",
      role_fa: "نوادهٔ فریدون · شاهِ ایران · مجازات‌کننده‌ی سلم و تور",
      lore: "When Fereydun's elder sons murdered their younger brother Iraj out of envy, the crime did not go unanswered. Manuchehr, Iraj's grandson, was raised for one purpose: to balance the scale his grandfather's sons had broken.",
      lore_fa: "وقتی پسرانِ بزرگِ فریدون برادرِ کوچک‌شان ایرج را از سرِ حسادت کشتند، آن جرم بی‌پاسخ نماند. منوچهر، نوه‌ی ایرج، برای یک هدف پرورش یافت: ترازویی را که پسرانِ پدربزرگش شکسته بودند برابر کند.",
      lore_tg: "Вақте писарони калони Фаридун бародари хурдиашон Иражро аз ҳасад куштанд, ин ҷиноят бе ҷавоб намонд.",
      biography: "Iraj, the gentlest of Fereydun's three sons, was given the best portion of the kingdom and murdered for it by his jealous brothers Salm and Tur. Fereydun raised Iraj's posthumous grandson Manuchehr as heir and instrument of justice. When Manuchehr came of age, he marched against his great-uncles, defeated both in battle, and sent their heads to Fereydun before the old king died in peace.",
      biography_fa: "ایرج، آرام‌ترینِ سه پسرِ فریدون، بهترین بخشِ پادشاهی را گرفت و به همین خاطر به دستِ برادرانِ حسودش، سلم و تور، کشته شد. فریدون نوه‌ی پس از مرگِ ایرج، منوچهر، را به‌عنوانِ وارث و ابزارِ عدالت پرورش داد. وقتی منوچهر بالغ شد، بر عموبزرگ‌هایش تاخت، هر دو را در نبرد شکست داد و سرهایشان را پیش از مرگِ آرامِ فریدون برایش فرستاد.",
      powers: ["+7% Tap Power", "+45 Zar/hr", "Passive: Scale of Iraj — chapter unlock farr cost –1"],
      side: "light", nftReady: false, season: 2, order: 299,
      collectionId: "S2-CH07-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 7000, zar_per_hour: 45, prereq: null,
      unlockCondition: "Complete Chapter 7 · Manuchehr",
      unlockCondition_fa: "فصلِ ۷ (منوچهر) را کامل کنید",
      name_ru: "Манучехр — Мститель",
      role_ru: "Внук Фаридуна · Царь Ирана · Каратель Сальма и Тура",
      lore_ru: "Когда старшие сыновья Фаридуна убили своего младшего брата Ираджа из зависти, преступление не осталось без ответа. Манучехр, внук Ираджа, был воспитан с одной целью: уравновесить чашу весов, которую разбили сыновья его деда.",
      biography_ru: "Ираджу, самому мягкому из трёх сыновей Фаридуна, была дана лучшая часть царства, за что его убили завистливые братья Сальм и Тур. Фаридун воспитал посмертного внука Ираджа, Манучехра, как наследника и орудие справедливости. Когда Манучехр достиг зрелости, он пошёл войной на своих двоюродных дедов, разбил обоих в бою и отправил их головы Фаридуну, прежде чем старый царь умер в мире.",
    },

    /* ═══ PISHDADIAN LATE ERA — Ch 8–12 ══════════════════════════════════ */
    {
      id: "nozar", name: "Nozar — The Divided King",
      name_fa: "نوذر — شاهِ پراکنده", name_tg: "Нӯзар — Шоҳи Тақсимшуда",
      type: "character", rarity: "rare", chapter: 8, emoji: "⚔",
      role: "King of Iran · Son of Manuchehr · Lost the Throne to Afrasiab",
      role_fa: "شاهِ ایران · پسرِ منوچهر · تختی که به افراسیاب رسید",
      lore: "Nozar inherited a kingdom forged in glory — and lost it. Too proud for diplomacy, too weak for war, he became the bridge between the age of Manuchehr and the age of grief.",
      lore_fa: "نوذر پادشاهی‌ای را به ارث برد که در شکوه ساخته شده بود و آن را از دست داد. غرور بی‌اندازه و ضعفِ نظامی او پل میان عصرِ منوچهر و عصرِ غم شد.",
      lore_tg: "Нӯзар салтанатеро ки дар шукӯҳ сохта шуда буд ба мерос гирифт ва аз даст дод.",
      biography: "Son of Manuchehr, Nozar sat on the throne of Iran at a moment when the kingdom could not sustain a weak ruler. Afrasiab of Turan invaded, armies broke, and Nozar was captured and executed. His tragedy is not cowardice but timing — he was a man of average gifts given a dynasty that demanded giants.",
      powers: ["+4% Tap Power", "+15 Zar/hr", "Passive: Fractured Crown — chapter gate farr cost –1"],
      side: "light", nftReady: false, season: 2, order: 300,
      collectionId: "S2-CH08-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 2500, zar_per_hour: 15, prereq: null,
      unlockCondition: "Complete Chapter 8 · Nozar",
      unlockCondition_fa: "فصلِ ۸ (نوذر) را کامل کنید",
      name_ru: "Нозар — Раздвоенный царь",
      role_ru: "Царь Ирана · Сын Манучехра · Потерявший трон Афрасиабу",
      lore_ru: "Нозар унаследовал царство, выкованное в славе — и потерял его. Слишком гордый для дипломатии, слишком слабый для войны, он стал мостом между эпохой Манучехра и эпохой скорби.",
      biography_ru: "Сын Манучехра, Нозар сидел на троне Ирана в момент, когда царство не могло выдержать слабого правителя. Афрасиаб Туранский вторгся, армии разбились, и Нозар был схвачен и казнён. Его трагедия — не трусость, а время: он был человеком средних дарований, которому досталась династия, требовавшая гигантов.",
    },
    {
      id: "zal-prince", name: "Zal — The Albino Prince",
      name_fa: "زال — شاهزاده‌ی سپیدموی", name_tg: "Зол — Шаҳзодаи Сафедмӯй",
      type: "character", rarity: "epic", chapter: 9, emoji: "🦅",
      role: "Son of Sam · Ward of Simorgh · Father of Rostam",
      role_fa: "پسرِ سام · پرورده‌ی سیمرغ · پدرِ رستم",
      lore: "Born with white hair in an age that feared difference, abandoned on Alborz, raised by the Simorgh. Zal returned to the world carrying divine wisdom in feathers. The line of Rostam begins here.",
      lore_fa: "با موهای سپید در عصری که از تفاوت می‌ترسید به دنیا آمد، بر البرز رها شد و سیمرغ او را پرورید. زال با حکمتِ الهی در پرها به جهان بازگشت.",
      lore_tg: "Бо мӯйҳои сафед дар давроне таваллуд шуд ки аз тафовут метарсид, дар Алборз раҳо шуд ва Симурғ ӯро тарбия кард.",
      biography: "Sam, the great warrior, rejected his white-haired son as an ill omen and abandoned him on Mount Alborz. The Simorgh took the child and raised him in her nest among the peaks. When Zal grew to manhood and came down from the mountain, he carried three feathers from the Simorgh — call them and she will come. Every miracle of Rostam's birth and every crisis of his death traces back to this man who was abandoned and survived.",
      powers: ["+8% Story XP", "+38 Zar/hr", "Passive: Simorgh's Ward — summon bonus: quiz hint +1 per chapter"],
      side: "light", nftReady: false, season: 2, order: 301,
      collectionId: "S2-CH09-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 5000, zar_per_hour: 38, prereq: null,
      unlockCondition: "Complete Chapter 9 · Zal",
      unlockCondition_fa: "فصلِ ۹ (زال) را کامل کنید",
      name_ru: "Заль — Принц-альбинос",
      role_ru: "Сын Сама · Воспитанник Симурга · Отец Рустама",
      lore_ru: "Рождённый с белыми волосами в эпоху, что боялась отличий, оставленный на Альборзе, выращенный Симургом. Заль вернулся в мир, нося божественную мудрость в перьях. Здесь начинается род Рустама.",
      biography_ru: "Сам, великий воин, отверг своего белокурого сына как дурное предзнаменование и оставил его на горе Альборз. Симург взяла дитя и вырастила его в своём гнезде среди вершин. Когда Заль вырос и спустился с горы, он нёс три пера Симурга — позови их, и она придёт. Каждое чудо рождения Рустама и каждый кризис его смерти восходят к этому человеку, что был оставлен и выжил.",
    },
    {
      id: "rudabeh-princess", name: "Rudabeh — The Tower of Hair",
      name_fa: "رودابه — برجِ گیسو", name_tg: "Рӯдоба — Бурҷи Зулф",
      type: "character", rarity: "rare", chapter: 10, emoji: "🌹",
      role: "Princess of Kabul · Mother of Rostam · Love That Defied Kingdoms",
      role_fa: "شاهزاده‌ی کابل · مادرِ رستم · عشقی که پادشاهی‌ها را به چالش کشید",
      lore: "She let down her hair from the tower like a rope. Zal climbed up. Two kingdoms stood between them. She did not care. Rudabeh is what love looks like when it is completely fearless.",
      lore_fa: "گیسویش را مانندِ طنابی از برج آویخت. زال بالا رفت. دو پادشاهی میانشان بود. اهمیتی نداد. رودابه تصویرِ عشق است زمانی که کاملاً بی‌باک باشد.",
      lore_tg: "Мӯйҳояшро чун тӯсма аз бурҷ овехт. Зол боло рафт. Ду салтанат дар миёнашон буд.",
      biography: "Daughter of Mehrab, king of Kabul — a man descended from Zahhak, which made the match politically catastrophic. Rudabeh and Zal fell in love through messengers and met secretly, breaking every rule of dynasty and alliance. Their union was eventually sanctioned when Manuchehr saw the worth in it. From this union came Rostam — but first came the most difficult childbirth in Persian mythology, where Zal called the Simorgh to save them both.",
      powers: ["+5% Story XP", "+22 Zar/hr", "Passive: Tower Love — chapter scene XP +8%"],
      side: "light", nftReady: false, season: 2, order: 302,
      collectionId: "S2-CH10-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 3500, zar_per_hour: 22, prereq: null,
      unlockCondition: "Complete Chapter 10 · Rudabeh",
      unlockCondition_fa: "فصلِ ۱۰ (رودابه) را کامل کنید",
      name_ru: "Рудабе — Башня волос",
      role_ru: "Принцесса Кабула · Мать Рустама · Любовь, бросившая вызов царствам",
      lore_ru: "Она спустила свои волосы с башни, как канат. Заль поднялся. Между ними стояли два царства. Ей было всё равно. Рудабе — это то, как выглядит любовь, когда она полностью бесстрашна.",
      biography_ru: "Дочь Мехраба, царя Кабула — человека, происходившего от Заххака, что делало этот союз политически катастрофическим. Рудабе и Заль влюбились через посланников и встречались тайно, нарушая все правила династии и союзов. Их союз был в конце концов одобрен, когда Манучехр увидел в нём ценность. От этого союза родился Рустам — но сначала были самые трудные роды в персидской мифологии, где Заль призвал Симурга, чтобы спасти их обоих.",
    },
    {
      id: "sam-warrior", name: "Sam — The Flawed Father",
      name_fa: "سام — پدرِ ناقص", name_tg: "Сом — Падари Нуқсондор",
      type: "character", rarity: "rare", chapter: 11, emoji: "🏔",
      role: "Champion of Iran · Father of Zal · The Man Who Abandoned and Returned",
      role_fa: "پهلوانِ ایران · پدرِ زال · مردی که ترک کرد و بازگشت",
      lore: "Sam abandoned his white-haired son and spent years regretting it. When the dream came that Zal lived, he climbed Alborz himself to bring him home. Sam is what a hero looks like when he has to face his own greatest failure.",
      lore_fa: "سام پسرِ سپیدمویش را رها کرد و سال‌ها پشیمان بود. وقتی خواب دید که زال زنده است، خودش البرز را پیمود تا او را به خانه بازگرداند.",
      lore_tg: "Сом писарашро раҳо кард ва солҳо пушаймон буд. Вақте хоб дид ки Зол зинда аст, худаш Алборзро тай кард.",
      biography: "One of the greatest warriors of the Pishdadian era, Sam was champion of Iran under Manuchehr. But his most important act was not in battle — it was admitting he was wrong. He abandoned the white-haired Zal on Mount Alborz out of fear and shame. Decades later, a recurring dream that his son still lived drove him to climb the mountain, where the Simorgh returned Zal. Sam had to face the consequence of cowardice dressed as duty.",
      powers: ["+6% Tap Power", "+18 Zar/hr", "Passive: A Father's Return — upgrade cost –6%"],
      side: "light", nftReady: false, season: 2, order: 303,
      collectionId: "S2-CH11-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 3000, zar_per_hour: 18, prereq: null,
      unlockCondition: "Complete Chapter 11 · Birth of Rostam",
      unlockCondition_fa: "فصلِ ۱۱ (تولدِ رستم) را کامل کنید",
      name_ru: "Сам — Несовершенный отец",
      role_ru: "Чемпион Ирана · Отец Заля · Человек, что оставил и вернулся",
      lore_ru: "Сам оставил своего белокурого сына и провёл годы в раскаянии. Когда пришёл сон, что Заль жив, он сам взошёл на Альборз, чтобы вернуть его домой. Сам — это то, как выглядит герой, когда он должен встретиться со своей величайшей неудачей.",
      biography_ru: "Один из величайших воинов эпохи Пешдадидов, Сам был чемпионом Ирана при Манучехре. Но его самым важным поступком была не битва — это было признание своей неправоты. Он оставил белокурого Заля на горе Альборз из страха и стыда. Десятилетия позже повторяющийся сон, что его сын всё ещё жив, заставил его взойти на гору, где Симург вернула ему Заля. Сам должен был встретиться с последствием трусости, одетой в долг.",
    },
    {
      id: "rostam-young", name: "Young Rostam — The Pahlavan Rises",
      name_fa: "رستمِ جوان — پهلوان برمی‌خیزد", name_tg: "Рустами Ҷавон — Паҳлавон Хезад",
      type: "character", rarity: "epic", chapter: 12, emoji: "🦁",
      role: "Champion of Iran · Son of Zal and Rudabeh · The Age's Greatest Hero",
      role_fa: "پهلوانِ ایران · پسرِ زال و رودابه · بزرگ‌ترین قهرمانِ روزگار",
      lore: "At seven he killed the white elephant of the king with a single blow. The palace watched in silence. Something had been born into the world that had no equal and would not for a thousand years.",
      lore_fa: "در هفت سالگی با یک ضربه پیلِ سفیدِ شاه را کشت. دربار در سکوت نگاه کرد. چیزی به جهان آمده بود که همتا نداشت و هزار سال نخواهد داشت.",
      lore_tg: "Дар ҳафтсолагӣ бо як зарб фили сафеди шоҳро кушт. Дарбор дар сукут нигоҳ кард.",
      biography: "Born through miracle — the Simorgh guided the caesarean section that saved Rudabeh's life — Rostam grew at supernatural speed. By childhood he had the frame of a giant. By adolescence he had broken the war-elephant with a single blow. His mace is the tiger-skin mace that would shake mountains. But before the Seven Labours and the great wars, this is Rostam in his beginning: enormous, untested, and already mythic.",
      powers: ["+10% Tap Power", "+50 Zar/hr", "Passive: Pahlavan's Rise — battle gate owned_heroes –1"],
      side: "light", nftReady: false, season: 2, order: 304,
      collectionId: "S2-CH12-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 6000, zar_per_hour: 50, prereq: null,
      unlockCondition: "Complete Chapter 12 · Rostam",
      unlockCondition_fa: "فصلِ ۱۲ (رستم) را کامل کنید",
      name_ru: "Юный Рустам — Восход пахлавана",
      role_ru: "Чемпион Ирана · Сын Заля и Рудабе · Величайший герой эпохи",
      lore_ru: "В семь лет он убил белого слона царя одним ударом. Дворец смотрел в молчании. В мир родилось нечто, не имеющее равных — и не будет иметь их тысячу лет.",
      biography_ru: "Рождённый чудом — Симург направила кесарево сечение, что спасло жизнь Рудабе — Рустам рос со сверхъестественной скоростью. К детству у него было телосложение гиганта. К отрочеству он сломал боевого слона одним ударом. Его булава — это булава с тигровой шкурой, что будет сотрясать горы. Но прежде Семи подвигов и великих войн, вот Рустам в начале: огромный, неиспытанный и уже мифический.",
    },
    {
      id: "sohrab-storm", name: "Sohrab — Son of the Storm",
      name_fa: "سهراب — فرزندِ توفان", name_tg: "Суҳроб — Фарзанди Тӯфон",
      type: "character", rarity: "legend", chapter: 13, emoji: "💔",
      role: "Son of Rostam · Champion of Turan · The Duel That Broke a Father",
      role_fa: "پسرِ رستم · پهلوانِ توران · نبردی که پدر را شکست",
      lore: "Sohrab grew up in Turan never knowing his father's face, searching every battlefield for a man he was told to recognize by a token. He found him at the end of a sword, and recognized him one breath too late.",
      lore_fa: "سهراب در توران بزرگ شد بدون آنکه چهره‌ی پدرش را بشناسد و در هر میدانِ جنگ به دنبالِ مردی بود که نشانی برای شناختنش داشت. در پایانِ شمشیری او را یافت، و یک نفس دیر شناختش.",
      lore_tg: "Суҳроб дар Турон бузург шуд бе он ки чеҳраи падарашро бишносад.",
      biography: "Born from Rostam's brief union with the Turanian princess Tahmineh, Sohrab grew into a warrior of his father's scale without ever meeting him. Tahmineh gave him an armband as a token of recognition, but pride and a fog of misdirection from both kings kept Rostam from learning who he faced on the battlefield. Father and son fought twice. On the second day, Rostam — using a forbidden wrestling trick — struck the fatal blow, and only then saw the armband on his dying son's arm.",
      biography_fa: "سهراب از پیوندی کوتاهِ رستم با شاهزاده‌ی تورانی تهمینه زاده شد و بدون دیدنِ پدرش به اندازه‌ی او پهلوان شد. تهمینه بازوبندی به او داد تا نشانِ بازشناسی باشد، اما غرور و سردرگمی هر دو شاه رستم را از شناختنِ حریفش بازداشت. پدر و فرزند دو روز جنگیدند. در روزِ دوم، رستم با ترفندی ممنوع ضربه‌ی مرگبار را زد و تنها آن‌گاه بازوبند را بر بازویِ فرزندِ رو به مرگش دید.",
      powers: ["+12% Tap Power", "+70 Zar/hr", "Passive: Token of Tahmineh — quiz wrong-answer penalty –10%"],
      side: "neutral", nftReady: false, season: 2, order: 305,
      collectionId: "S2-CH13-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 12000, zar_per_hour: 70, prereq: null,
      unlockCondition: "Complete Chapter 13 · Sohrab",
      unlockCondition_fa: "فصلِ ۱۳ (سهراب) را کامل کنید",
      name_ru: "Сухраб — Сын бури",
      role_ru: "Сын Рустама · Чемпион Турана · Поединок, что сломал отца",
      lore_ru: "Сухраб рос в Туране, никогда не зная лица своего отца, ища на каждом поле битвы человека, которого ему велели узнать по знаку. Он нашёл его на конце меча и узнал на один вдох слишком поздно.",
      biography_ru: "Рождённый от недолгого союза Рустама с туранской принцессой Тахмине, Сухраб вырос воином масштаба своего отца, никогда не встречая его. Тахмине дала ему браслет как знак узнавания, но гордость и туман недопонимания от обоих царей удерживали Рустама от того, чтобы узнать, с кем он сражается на поле боя. Отец и сын сражались дважды. На второй день Рустам — используя запрещённый приём борьбы — нанёс смертельный удар и лишь тогда увидел браслет на руке своего умирающего сына.",
    },

    /* ═══ EARLY KAYANID ERA — Ch 14–19 ════════════════════════════════════ */
    {
      id: "siavash", name: "Siavash — The Pure Prince",
      name_fa: "سیاوش — شاهزاده‌ی پاک", name_tg: "Сиёваш — Шаҳзодаи Пок",
      type: "character", rarity: "legend", chapter: 14, emoji: "🕊",
      role: "Prince of Iran · Son of Kay Kavus · Martyred by Innocence",
      role_fa: "شاهزاده‌ی ایران · پسرِ کیکاووس · شهیدِ بی‌گناهی",
      lore: "He rode through fire to prove his innocence and came out unburned. He then chose exile over war rather than shed unjust blood. Siavash is what purity costs when it refuses to become cruelty.",
      lore_fa: "از آتش گذشت تا بی‌گناهی‌اش را ثابت کند و سوخته بیرون نیامد. سپس تبعید را بر جنگ ترجیح داد تا خونِ ناروا نریزد. سیاوش هزینه‌ی پاکی است وقتی که زیرِ بارِ ظلم تن نمی‌دهد.",
      lore_tg: "Аз оташ гузашт то беайбиашро исбот кунад ва сӯхта берун наомад. Сипас табъид кардро бар ҷанг тарҷеҳ дод.",
      biography: "Son of Kay Kavus and raised partly by Rostam, Siavash became the most beloved figure of the Kayanid era. Falsely accused by Sudabeh the queen, he proved his innocence by riding through fire — the fire parted for him. Rather than return in triumph to a court that would demand war, he fled to Turan. There, Afrasiab honored him, gave him his daughter, and built him a city. Then Afrasiab's brother poisoned the peace and Siavash was executed. His blood turned the ground into flowers. His son Kay Khosrow would avenge him across a generation.",
      powers: ["+10% Story XP", "+80 Zar/hr", "Passive: Fire of Purity — farr points from quiz tiers +1 each"],
      side: "light", nftReady: false, season: 2, order: 310,
      collectionId: "S2-CH14-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 14000, zar_per_hour: 80, prereq: null,
      unlockCondition: "Complete Chapter 14 · Siavash",
      unlockCondition_fa: "فصلِ ۱۴ (سیاوش) را کامل کنید",
      name_ru: "Сиаваш — Чистый принц",
      role_ru: "Принц Ирана · Сын Кай Кавуса · Мученик невинности",
      lore_ru: "Он проехал через огонь, чтобы доказать свою невинность, и вышел несгоревшим. Затем он выбрал изгнание вместо войны, чтобы не проливать неправедную кровь. Сиаваш — это цена чистоты, когда она отказывается становиться жестокостью.",
      biography_ru: "Сын Кай Кавуса, частично воспитанный Рустамом, Сиаваш стал самой любимой фигурой эпохи Кеянидов. Ложно обвинённый царицей Судабе, он доказал свою невинность, проехав через огонь — огонь расступился перед ним. Вместо того чтобы вернуться с триумфом к двору, что потребовал бы войны, он бежал в Туран. Там Афрасиаб почтил его, дал ему свою дочь и построил для него город. Затем брат Афрасиаба отравил мир, и Сиаваш был казнён. Его кровь превратила землю в цветы. Его сын Кай Хосров отомстит за него через поколение.",
    },
    {
      id: "kay-kavus-king", name: "Kay Kavus — The Reckless King",
      name_fa: "کیکاووس — شاهِ بی‌پروا", name_tg: "Кайковус — Шоҳи Бепарво",
      type: "character", rarity: "rare", chapter: 15, emoji: "👑",
      role: "King of Iran · Father of Siavash · A Throne Built on Bad Decisions",
      role_fa: "شاهِ ایران · پدرِ سیاوش · تختی بر تصمیماتِ نادرست",
      lore: "He tried to fly to heaven on a throne carried by eagles baited with meat. He marched into Hamavaran and got himself captured. Kay Kavus is what happens when courage forgets to bring wisdom along.",
      lore_fa: "تلاش کرد با تختی که عقاب‌ها با گوشت به آسمان می‌بردند به بهشت پرواز کند. به هاماوران تاخت و اسیر شد. کیکاووس یعنی شجاعتی که خرد را همراه نبرد.",
      lore_tg: "Кӯшид бо тахте ки уқобҳо ба осмон мебурданд ба биҳишт парвоз кунад.",
      biography: "Kay Kavus inherited the Kayanid throne and spent much of his reign proving that royal ambition without judgment is dangerous to everyone around it: invading Mazandaran and getting blinded by demons until Rostam rescued him, building a flying throne out of vanity that crashed in the wilderness, and later believing the false accusations of his wife Sudabeh against his own son Siavash — a decision that would cost the kingdom dearly. He reigned long and survived only because heroes like Rostam kept cleaning up after him.",
      biography_fa: "کیکاووس تختِ کیانی را به ارث برد و بخشِ بزرگی از فرمانروایی‌اش را صرفِ ثابت‌کردنِ این کرد که بلندپروازیِ شاهانه بدونِ خرد برای همه خطرناک است: حمله به مازندران که با کوریِ او به دستِ دیوان پایان یافت تا رستم نجاتش داد، ساختنِ تختِ پرنده از سرِ غرور که در بیابان سقوط کرد، و بعدها باور کردنِ دروغ‌های سودابه علیه پسرش سیاوش — تصمیمی که قلمرو را به سختی به‌خود هزینه داد.",
      powers: ["+5% Tap Power", "+30 Zar/hr", "Passive: Rostam's Patience — battle gate energy cost –5%"],
      side: "neutral", nftReady: false, season: 2, order: 310.5,
      collectionId: "S2-CH15-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 5000, zar_per_hour: 30, prereq: null,
      unlockCondition: "Complete Chapter 15 · Kay Kavus",
      unlockCondition_fa: "فصلِ ۱۵ (کیکاووس) را کامل کنید",
      name_ru: "Кай Кавус — Безрассудный царь",
      role_ru: "Царь Ирана · Отец Сиаваша · Трон, построенный на плохих решениях",
      lore_ru: "Он попытался взлететь на небо на троне, который несли орлы, привлечённые мясом. Он пошёл войной на Хамаваран и был пленён. Кай Кавус — это то, что бывает, когда отвага забывает взять с собой мудрость.",
      biography_ru: "Кай Кавус унаследовал трон Кеянидов и провёл большую часть своего правления, доказывая, что царское честолюбие без рассудительности опасно для всех вокруг: вторжение в Мазандеран, закончившееся его ослеплением демонами, пока Рустам не спас его, строительство летающего трона из тщеславия, разбившегося в глуши, и позже — веру в ложные обвинения его жены Судабе против собственного сына Сиаваша — решение, что дорого обошлось царству. Он правил долго и выжил лишь потому, что герои вроде Рустама постоянно исправляли его ошибки.",
    },
    {
      id: "kay-khosrow", name: "Kay Khosrow — The Chosen King",
      name_fa: "کیخسرو — شاهِ برگزیده", name_tg: "Кайхусрав — Шоҳи Баргузида",
      type: "character", rarity: "legend", chapter: 16, emoji: "👑",
      role: "Son of Siavash · King of Iran · Avenger and Ender of the Great War",
      role_fa: "پسرِ سیاوش · شاهِ ایران · انتقام‌گیر و پایان‌دهنده‌ی جنگِ بزرگ",
      lore: "Born in Turan, hidden in a shepherd's hut, raised to be a king. He crossed the sea of Khwarazm, liberated Iran, fought Afrasiab across twenty years, and then vanished into a mountain rather than let power corrupt him.",
      lore_fa: "در توران متولد شد، در کلبه‌ای چوپانی پنهان ماند، برای شاه بودن پرورش یافت. دریای خوارزم را گذشت، ایران را آزاد کرد، بیست سال با افراسیاب جنگید و سپس به جای اینکه قدرت فسادش دهد، در کوهی ناپدید شد.",
      lore_tg: "Дар Турон таваллуд шуд, дар кулбаи чӯпонӣ пинҳон монд, барои шоҳ будан тарбия ёфт.",
      biography: "Kay Khosrow is the messianic king of the Shahnameh — born in secret, raised in exile, and chosen by Farr. His reign is the culmination of all the injustice done to his father Siavash. He hunted Afrasiab to the ends of the earth and killed him in a cave beside a holy spring. Then, at the height of his glory, Kay Khosrow abdicated and walked into a mountain snowstorm and was never seen again. His disappearance is the Shahnameh's statement on power: the king who refuses corruption leaves.",
      powers: ["+12% Tap Power", "+95 Zar/hr", "Passive: Farr's Chosen — farr requirement for chapter gates –2"],
      side: "light", nftReady: false, season: 2, order: 311,
      collectionId: "S2-CH16-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 15000, zar_per_hour: 95, prereq: null,
      unlockCondition: "Complete Chapter 16 · Kay Khosrow",
      unlockCondition_fa: "فصلِ ۱۶ (کیخسرو) را کامل کنید",
      name_ru: "Кай Хосров — Избранный царь",
      role_ru: "Сын Сиаваша · Царь Ирана · Мститель и завершитель Великой войны",
      lore_ru: "Рождённый в Туране, скрытый в хижине пастуха, воспитанный, чтобы стать царём. Он пересёк море Хорезма, освободил Иран, сражался с Афрасиабом двадцать лет, а затем исчез в горе, не позволив власти развратить его.",
      biography_ru: "Кай Хосров — мессианский царь Шахнаме — рождённый в тайне, воспитанный в изгнании и избранный Фарром. Его правление — кульминация всей несправедливости, причинённой его отцу Сиавашу. Он преследовал Афрасиаба до краёв земли и убил его в пещере у священного источника. Затем, на вершине своей славы, Кай Хосров отрёкся от престола и ушёл в горную метель, и его больше никто не видел. Его исчезновение — заявление Шахнаме о власти: царь, отказывающийся от коррупции, уходит.",
    },
    {
      id: "akvan-div", name: "Akvan Div — The Demon of Riddles",
      name_fa: "اکوان دیو — دیوِ معماها", name_tg: "Аквони Дев — Девонаи Муаммоҳо",
      type: "character", rarity: "epic", chapter: 17, emoji: "🌊",
      role: "Trickster Demon · The Lake Demon · The Choice That Has No Right Answer",
      role_fa: "دیوِ حیله‌گر · دیوِ دریاچه · گزینه‌ای که پاسخِ درست ندارد",
      lore: "He asked Rostam: shall I throw you into the sea or onto the mountain? Rostam knew — say sea, he throws you to the mountain; say mountain, he throws you to the sea. So Rostam said: the mountain. And was thrown into the sea.",
      lore_fa: "از رستم پرسید: تو را به دریا بیندازم یا به کوه؟ رستم دانست — دریا بگوید، به کوه می‌اندازد؛ کوه بگوید، به دریا. پس رستم گفت: کوه. و به دریا افکنده شد.",
      lore_tg: "Аз Рустам пурсид: туро ба дарё биандозам ё ба кӯҳ? Рустам донист.",
      biography: "Akvan Div is unique in the Shahnameh's demon roster — he is not a warrior but a riddler. He asked Rostam to choose his own fate, knowing that Rostam would reason out the reversal. Rostam chose correctly by choosing wrongly, was thrown into the sea, and survived. The lesson is about the limits of logic when the frame of the puzzle is controlled by someone who doesn't play fair.",
      powers: ["+7% Tap Power", "+42 Zar/hr", "Passive: Riddle Master — hard quiz XP +15%"],
      side: "dark", nftReady: false, season: 2, order: 312,
      collectionId: "S2-CH17-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 7500, zar_per_hour: 42, prereq: null,
      unlockCondition: "Complete Chapter 17 · Akvan Div",
      unlockCondition_fa: "فصلِ ۱۷ (اکوان دیو) را کامل کنید",
      name_ru: "Аквон Див — Демон загадок",
      role_ru: "Демон-обманщик · Демон озера · Выбор без верного ответа",
      lore_ru: "Он спросил Рустама: бросить ли тебя в море или на гору? Рустам знал — скажешь море, бросит на гору; скажешь гора, бросит в море. Поэтому Рустам сказал: гора. И был брошен в море.",
      biography_ru: "Аквон Див уникален в списке демонов Шахнаме — он не воин, а загадочник. Он попросил Рустама выбрать собственную судьбу, зная, что Рустам рассчитает обратное. Рустам выбрал правильно, выбрав неправильно, был брошен в море и выжил. Урок — о пределах логики, когда рамки головоломки контролирует тот, кто играет нечестно.",
    },
    {
      id: "bijan-hero", name: "Bijan — Prisoner of Pashang",
      name_fa: "بیژن — اسیرِ پشنگ", name_tg: "Бижан — Маҳбуси Пашанг",
      type: "character", rarity: "epic", chapter: 18, emoji: "⛓",
      role: "Iranian Hero · Lover of Manijeh · The Pit Beneath the Boulder",
      role_fa: "پهلوانِ ایرانی · معشوقِ منیژه · چاهِ زیرِ تخته‌سنگ",
      lore: "Sent to hunt wild boars at the border, Bijan instead fell in love with Turan's princess — and paid for it with chains, a sealed pit, and years of darkness, until Rostam came looking with a magic cup.",
      lore_fa: "بیژن که برای شکارِ گرازهای مرزی فرستاده شده بود، به‌جای آن عاشقِ شاهزاده‌ی تورانی شد — و بهای آن را با زنجیر، چاهی مهرشده و سال‌ها تاریکی پرداخت، تا رستم با جامی جادویی به سراغش آمد.",
      lore_tg: "Бижан, ки барои шикори гӯроз фиристода шуда буд, ба ҷои он ошиқи шаҳзодаи турониро шуд.",
      biography: "Bijan was a young Iranian hero sent across the border to deal with wild boars ravaging Turanian farmland — a routine mission that turned into the most dangerous love story in the Shahnameh. He met and fell for Manijeh, daughter of king Afrasiab, and was discovered, drugged, and thrown into a sealed pit to die slowly. Manijeh, stripped of her status, kept him alive with stolen scraps for years. Rostam found him only by scrying through a magic cup that revealed Bijan's location, then crossed into enemy territory disguised as a merchant to lift the boulder and pull him free.",
      biography_fa: "بیژن پهلوانِ جوانِ ایرانی بود که برای مقابله با گرازهایی که به مزارعِ تورانی آسیب می‌زدند به آن سو فرستاده شد — ماموریتی معمولی که به خطرناک‌ترین داستانِ عشقِ شاهنامه بدل شد. او عاشقِ منیژه، دخترِ افراسیاب، شد و کشف، بیهوش و در چاهی مهرشده برای مردنِ آرام افتاد. منیژه با لقمه‌های دزدیده سال‌ها او را زنده نگه داشت. رستم تنها با نگاه‌کردن در جامی جادویی او را یافت.",
      powers: ["+9% Story XP", "+52 Zar/hr", "Passive: The Boulder Lifted — pairs with Manijeh: +5% Zar/hr when both owned"],
      side: "light", nftReady: false, season: 2, order: 312.5,
      collectionId: "S2-CH18-002",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 8500, zar_per_hour: 52, prereq: null,
      unlockCondition: "Complete Chapter 18 · Bijan and Manijeh",
      unlockCondition_fa: "فصلِ ۱۸ (بیژن و منیژه) را کامل کنید",
      name_ru: "Бижан — Пленник Пешанга",
      role_ru: "Иранский герой · Возлюбленный Манижи · Яма под валуном",
      lore_ru: "Послан охотиться на диких кабанов на границе, Бижан вместо этого влюбился в туранскую принцессу — и заплатил за это цепями, запечатанной ямой и годами тьмы, пока Рустам не пришёл искать его с волшебной чашей.",
      biography_ru: "Бижан был молодым иранским героем, посланным через границу, чтобы разобраться с дикими кабанами, разорявшими туранские поля — обычная миссия, что превратилась в самую опасную историю любви в Шахнаме. Он встретил и полюбил Манижу, дочь царя Афрасиаба, был обнаружен, опоен и брошен в запечатанную яму, чтобы медленно умереть. Манижа, лишённая своего статуса, годами поддерживала его жизнь украденными крохами. Рустам нашёл его лишь с помощью гадания через волшебную чашу, что показала местоположение Бижана, затем пересёк территорию врага, переодевшись купцом, чтобы поднять валун и освободить его.",
    },
    {
      id: "manijeh", name: "Manijeh — Love That Fed a Prisoner",
      name_fa: "منیژه — عشقی که زندانی را تغذیه کرد", name_tg: "Манижа — Муҳаббате ки зиндониро ғизо дод",
      type: "character", rarity: "epic", chapter: 18, emoji: "🌹",
      role: "Princess of Turan · Lover of Bijan · The Woman Who Kept Him Alive',",
      role_fa: "شاهزاده‌ی توران · محبوبه‌ی بیژن · زنی که او را زنده نگه داشت",
      lore: "Bijan was thrown into a pit by Afrasiab and sealed under a boulder. Manijeh, exiled from her father's court for loving the enemy, begged food from strangers and lowered it into the pit each day for years. Love as endurance.",
      lore_fa: "بیژن را افراسیاب در چاهی انداخت و با سنگی مهر کرد. منیژه که از دربار پدرش به خاطرِ عشق به دشمن رانده شده بود، از بیگانگان غذا گدایی می‌کرد و سال‌ها هر روز آن را به چاه می‌رساند.",
      lore_tg: "Бижанро Афросиёб дар чоҳе андохт. Манижа, ки аз дарбори падараш ронда шуда буд, аз бегонагон хӯрок гадоӣ мекард.",
      biography: "Manijeh is one of the Shahnameh's great heroines — not because she fought but because she endured. She fell in love with Bijan, the Iranian hero who had come to Turan on a mission. Afrasiab had Bijan captured and thrown into a pit sealed by the legendary boulder. Manijeh was stripped of her royal status and exiled. For years she survived as a beggar to keep Bijan alive. When Rostam finally came to free him, it was Manijeh who guided them.",
      powers: ["+9% Story XP", "+48 Zar/hr", "Passive: Undying Love — daily quest reward +12%"],
      side: "light", nftReady: false, season: 2, order: 313,
      collectionId: "S2-CH18-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 8000, zar_per_hour: 48, prereq: null,
      unlockCondition: "Complete Chapter 18 · Bijan and Manijeh",
      unlockCondition_fa: "فصلِ ۱۸ (بیژن و منیژه) را کامل کنید",
      name_ru: "Манижа — Любовь, что кормила пленника",
      role_ru: "Принцесса Турана · Возлюбленная Бижана · Женщина, что сохранила ему жизнь",
      lore_ru: "Бижан был брошен в яму Афрасиабом и запечатан под валуном. Манижа, изгнанная из двора своего отца за любовь к врагу, выпрашивала еду у незнакомцев и спускала её в яму каждый день годами. Любовь как стойкость.",
      biography_ru: "Манижа — одна из великих героинь Шахнаме — не потому что сражалась, а потому что выстояла. Она влюбилась в Бижана, иранского героя, что прибыл в Туран с миссией. Афрасиаб приказал схватить Бижана и бросить в яму, запечатанную легендарным валуном. Манижа была лишена своего царского статуса и изгнана. Годами она выживала как нищенка, чтобы сохранить жизнь Бижана. Когда Рустам наконец пришёл освободить его, именно Манижа вела их.",
    },
    {
      id: "piran-wise", name: "Piran — The Wise Man of Turan",
      name_fa: "پیرانِ ویسه — خردمندِ توران", name_tg: "Пирони Виса — Хирадманди Турон",
      type: "character", rarity: "epic", chapter: 19, emoji: "🕊",
      role: "General of Turan · Friend of Siavash · The Man Who Tried to Stop the War",
      role_fa: "سردارِ توران · دوستِ سیاوش · مردی که تلاش کرد جلوی جنگ را بگیرد",
      lore: "He was the one man in Turan who saw clearly. He sheltered Siavash, tried to stop his execution, and spent decades maneuvering to prevent the war he knew would destroy them all. He was right. And he died in it.",
      lore_fa: "او تنها مردی در توران بود که واضح می‌دید. سیاوش را پناه داد، تلاش کرد جلوی اعدامش را بگیرد و دهه‌ها برای جلوگیری از جنگی که می‌دانست همه را نابود خواهد کرد مانور داد. درست می‌گفت. و در آن جنگ مُرد.",
      lore_tg: "Ӯ ягона марде дар Турон буд ки равшан мефаҳмид. Ба Сиёваш паноҳ дод, кӯшид пеши қатлашро бигирад.",
      biography: "Piran Vise was Afrasiab's greatest general and the conscience of Turan. He recognized Siavash's worth and arranged his marriage to Afrasiab's daughter. He argued against Siavash's execution and was overruled. When the Great War came — Iran and Turan colliding in the final confrontation — Piran fought for his king even knowing it was lost. He was killed by Gudarz in personal combat. The Shahnameh mourns him as a good man trapped on the wrong side of history.",
      powers: ["+8% Story XP", "+55 Zar/hr", "Passive: Voice of Reason — enemy chapter gate requirements –1"],
      side: "neutral", nftReady: false, season: 2, order: 314,
      collectionId: "S2-CH19-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 9000, zar_per_hour: 55, prereq: null,
      unlockCondition: "Complete Chapter 19 · The Great War",
      unlockCondition_fa: "فصلِ ۱۹ (جنگِ بزرگِ ایران و توران) را کامل کنید",
      name_ru: "Пиран — Мудрец Турана",
      role_ru: "Генерал Турана · Друг Сиаваша · Человек, что пытался остановить войну",
      lore_ru: "Он был единственным человеком в Туране, что видел ясно. Он укрыл Сиаваша, пытался остановить его казнь и десятилетиями маневрировал, чтобы предотвратить войну, которая, как он знал, уничтожит их всех. Он был прав. И он погиб в ней.",
      biography_ru: "Пиран Висе был величайшим генералом Афрасиаба и совестью Турана. Он признал ценность Сиаваша и устроил его брак с дочерью Афрасиаба. Он возражал против казни Сиаваша, но был отвергнут. Когда пришла Великая война — Иран и Туран столкнулись в финальной конфронтации — Пиран сражался за своего царя, даже зная, что она проиграна. Он был убит Гударзом в личном бою. Шахнаме скорбит о нём как о хорошем человеке, оказавшемся на неверной стороне истории.",
    },

    /* ═══ LATE KAYANID ERA — Ch 20–23 ══════════════════════════════════════ */
    {
      id: "lohrasp-king", name: "Lohrasp — The Humble King",
      name_fa: "لهراسب — شاهِ فروتن", name_tg: "Лаҳросб — Шоҳи Фурӯтан",
      type: "character", rarity: "rare", chapter: 20, emoji: "⚖",
      role: "King of Iran · Chosen by Kay Khosrow · Ruled Without Glory, Died With It",
      role_fa: "شاهِ ایران · برگزیده‌ی کیخسرو · بدونِ شکوه فرمانروایی کرد و با آن مُرد",
      lore: "Kay Khosrow chose him deliberately — not the most powerful hero, but a man capable of governing in peace. Lohrasp kept the realm together for a generation without a great war. Then his son Goshtasp started one.",
      lore_fa: "کیخسرو او را عمداً انتخاب کرد — نه قدرتمندترین پهلوان، بلکه مردی که می‌توانست در صلح حکومت کند. لهراسب یک نسل بدونِ جنگِ بزرگ قلمرو را نگه داشت. سپس پسرش گشتاسب یکی را آغاز کرد.",
      lore_tg: "Кайхусрав ӯро қасдан интихоб кард — на қудратмандтарин паҳлавон, балки марде ки метавонист дар сулҳ ҳукм ронад.",
      biography: "Lohrasp was not the warrior king the nobles of Iran expected. Kay Khosrow's choice of him was a deliberate break with tradition — a statement that Iran needed a builder, not a warrior. Lohrasp was devout, just, and capable of the slow work of peacetime governance. His reign lasted a generation. He was killed at the fire temple at Balkh when Arjasp's Turanians invaded, dying defending the sacred flame — an appropriate end for the most peaceful of the Kayanid kings.",
      powers: ["+5% Tap Power", "+28 Zar/hr", "Passive: Peacetime Governance — daily check-in bonus +5%"],
      side: "light", nftReady: false, season: 2, order: 320,
      collectionId: "S2-CH20-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 4500, zar_per_hour: 28, prereq: null,
      unlockCondition: "Complete Chapter 20 · Lohrasp",
      unlockCondition_fa: "فصلِ ۲۰ (لهراسب) را کامل کنید",
      name_ru: "Лохрасп — Смиренный царь",
      role_ru: "Царь Ирана · Избранник Кай Хосрова · Правил без славы, умер с ней",
      lore_ru: "Кай Хосров выбрал его намеренно — не самого могущественного героя, а человека, способного править в мире. Лохрасп удерживал царство целое поколение без великой войны. Затем его сын Гуштасп начал одну.",
      biography_ru: "Лохрасп не был царём-воином, которого ожидала знать Ирана. Выбор Кай Хосрова в его пользу был намеренным разрывом с традицией — заявлением, что Ирану нужен строитель, а не воин. Лохрасп был благочестив, справедлив и способен на медленный труд мирного управления. Его правление длилось поколение. Он был убит в храме огня в Балхе, когда вторглись туранцы Арджаспа, погибнув, защищая священное пламя — подходящий конец для самого мирного из царей Кеянидов.",
    },
    {
      id: "goshtasp-king", name: "Goshtasp — Champion of the Faith",
      name_fa: "گشتاسب — قهرمانِ ایمان", name_tg: "Гуштосп — Қаҳрамони Имон",
      type: "character", rarity: "legend", chapter: 21, emoji: "👑",
      role: "King of Iran · First Royal Convert · Father of Esfandiyar",
      role_fa: "شاهِ ایران · اولین حامیِ شاهانه‌ی دینِ تازه · پدرِ اسفندیار",
      lore: "When a prophet walked into his court promising fire instead of proof, Goshtasp made the one decision that outlasted every army he ever raised: he chose to believe.",
      lore_fa: "وقتی پیامبری به دربارش آمد و به‌جای دلیل آتش پیشنهاد کرد، گشتاسب تنها تصمیمی گرفت که از هر سپاهی که برافراشت ماندگارتر بود: باور کردن را انتخاب کرد.",
      lore_tg: "Вақте паёмбаре ба дарбораш омад, Гуштосп тасмим гирифт ки бовар кунад.",
      biography: "Son of Lohrasp and impatient for the throne, Goshtasp spent years in exile and adventure abroad before finally inheriting Iran. His reign would have been one king among many had Zarathustra not arrived at his court and converted him to the new faith of Ahura Mazda. Goshtasp became the religion's first royal patron, building fire temples and defending the faith in war against Turan's Arjasp — wars in which his son Esfandiyar, made invulnerable by a prophet's blessing, did most of the fighting.",
      biography_fa: "گشتاسب پسرِ لهراسب بود و برای رسیدن به تخت بی‌حوصله، سال‌ها در تبعید و ماجراجویی در سرزمین‌های بیگانه گذراند پیش از آنکه سرانجام ایران را به ارث برد. فرمانروایی‌اش تنها یکی از فرمانروایی‌های بی‌شمار بود اگر زرتشت به دربارش نمی‌آمد و او را به دینِ تازه‌ی اهورامزدا نمی‌گرواند. گشتاسب اولین حامیِ شاهانه‌ی این دین شد، آتشکده‌ها ساخت و در جنگ با ارجاسبِ تورانی از ایمان دفاع کرد.",
      powers: ["+10% Story XP", "+85 Zar/hr", "Passive: Royal Patron — Zoroaster card synergy: +8% farr gain when both owned"],
      side: "light", nftReady: false, season: 2, order: 320.5,
      collectionId: "S2-CH21-002",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 15000, zar_per_hour: 85, prereq: null,
      unlockCondition: "Complete Chapter 21 · Goshtasp and Zoroaster",
      unlockCondition_fa: "فصلِ ۲۱ (گشتاسب و زرتشت) را کامل کنید",
      name_ru: "Гуштасп — Чемпион веры",
      role_ru: "Царь Ирана · Первый царственный новообращённый · Отец Исфандияра",
      lore_ru: "Когда пророк вошёл в его двор, обещая огонь вместо доказательства, Гуштасп принял единственное решение, что переживёт каждую армию, которую он когда-либо собрал: он решил поверить.",
      biography_ru: "Сын Лохраспа, нетерпеливый в ожидании трона, Гуштасп провёл годы в изгнании и приключениях за границей, прежде чем наконец унаследовал Иран. Его правление было бы одним царствованием среди многих, если бы Заратустра не прибыл в его двор и не обратил его в новую веру Ахура Мазды. Гуштасп стал первым царственным покровителем религии, строя храмы огня и защищая веру в войне против туранского Арджаспа — войнах, в которых его сын Исфандияр, сделанный неуязвимым благословением пророка, вёл большую часть боёв.",
    },
    {
      id: "zoroaster", name: "Zoroaster — The Prophet of Fire",
      name_fa: "زرتشت — پیامبرِ آتش", name_tg: "Зардушт — Паёмбари Оташ",
      type: "character", rarity: "legend", chapter: 21, emoji: "🔥",
      role: "Prophet · Founder of Zoroastrianism · The Fire That Outlasted Every King",
      role_fa: "پیامبر · بنیان‌گذارِ زرتشتی‌گری · آتشی که از هر شاهی ماندگارتر بود",
      lore: "He came to Goshtasp's court and the king asked for proof. He gave him a choice: believe or don't. Goshtasp chose to believe. What followed changed the course of Persian history for three thousand years.",
      lore_fa: "به دربارِ گشتاسب آمد و شاه درخواستِ دلیل کرد. او انتخابی داد: باور کن یا نکن. گشتاسب انتخاب کرد که باور کند. آنچه پس از آن آمد مسیرِ تاریخِ ایران را سه هزار سال تغییر داد.",
      lore_tg: "Ба дарбори Гуштосп омад ва шоҳ далел хост. Ӯ интихобе дод: бовар кун ё накун.",
      biography: "Zarathustra — the Greek rendering of his Avestan name — came to King Vishtaspa (Goshtasp) and converted him to the religion now called Zoroastrianism. The faith of Ahura Mazda, the Wise Lord, against Angra Mainyu, the Destructive Spirit — truth against the Lie, light against darkness. Under Goshtasp the religion spread. Its fire temples burned at Balkh, Yazd, and Isfahan. When the Arabs came and extinguished those fires, Ferdowsi wrote the Shahnameh to keep their light alive in another form.",
      powers: ["+15% Story XP", "+90 Zar/hr", "Passive: Eternal Flame — chapter completion farr +1 bonus"],
      side: "light", nftReady: false, season: 2, order: 321,
      collectionId: "S2-CH21-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 14000, zar_per_hour: 90, prereq: null,
      unlockCondition: "Complete Chapter 21 · Goshtasp and Zoroaster",
      unlockCondition_fa: "فصلِ ۲۱ (گشتاسب و زرتشت) را کامل کنید",
      name_ru: "Заратустра — Пророк огня",
      role_ru: "Пророк · Основатель зороастризма · Огонь, что переживёт каждого царя",
      lore_ru: "Он пришёл во двор Гуштаспа, и царь попросил доказательство. Он дал ему выбор: верить или нет. Гуштасп решил поверить. То, что последовало, изменило ход персидской истории на три тысячи лет.",
      biography_ru: "Заратустра — греческая форма его авестийского имени — пришёл к царю Виштаспе (Гуштаспу) и обратил его в религию, теперь называемую зороастризмом. Вера Ахура Мазды, Мудрого Господа, против Ангра Майнью, Разрушительного Духа — правда против Лжи, свет против тьмы. Под Гуштаспом религия распространилась. Её храмы огня горели в Балхе, Йезде и Исфахане. Когда пришли арабы и погасили эти огни, Фирдоуси написал Шахнаме, чтобы сохранить их свет живым в другой форме.",
    },
    {
      id: "esfandiyar-young", name: "Esfandiyar — The Brazen-Bodied",
      name_fa: "اسفندیار — روئین‌تن", name_tg: "Исфандиёр — Рӯинтан",
      type: "character", rarity: "legend", chapter: 22, emoji: "🛡",
      role: "Son of Goshtasp · Invincible Warrior · Sent to His Death by His Own Father",
      role_fa: "پسرِ گشتاسب · پهلوانِ شکست‌ناپذیر · توسطِ پدرش به مرگ فرستاده شد",
      lore: "His body could not be pierced by any weapon. His only weakness was his eyes. His father Goshtasp knew this and sent him to fight Rostam anyway — because a living Esfandiyar was too dangerous to have around.",
      lore_fa: "هیچ سلاحی جسمش را نمی‌شکافت. تنها آسیب‌پذیریش چشمانش بود. پدرش گشتاسب این را می‌دانست و با این حال او را برای مبارزه با رستم فرستاد — زیرا اسفندیارِ زنده برای نگه داشتن در اطراف خیلی خطرناک بود.",
      lore_tg: "Ягон силоҳ ҷисмашро нашкофт. Ягона заифиаш чашмонаш буд. Падараш Гуштосп инро медонист.",
      biography: "Esfandiyar underwent a ritual that made his body impervious to weapons — with one exception that Zal and the Simorgh knew. He completed his own version of the Seven Labours and freed his sisters from the Brass Fortress. He was the greatest warrior of his age after Rostam. When his father sent him to bring Rostam back in chains — a mission impossible without war — everyone understood it was a death sentence for one of them. Rostam's arrow found the eye. The invincible man fell.",
      powers: ["+14% Tap Power", "+100 Zar/hr", "Passive: Brazen Body — chapter gate level requirement –1"],
      side: "light", nftReady: false, season: 2, order: 322,
      collectionId: "S2-CH22-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 15000, zar_per_hour: 100, prereq: null,
      unlockCondition: "Complete Chapter 22 · Esfandiyar",
      unlockCondition_fa: "فصلِ ۲۲ (اسفندیار) را کامل کنید",
      name_ru: "Исфандияр — Медное тело",
      role_ru: "Сын Гуштаспа · Непобедимый воин · Послан на смерть собственным отцом",
      lore_ru: "Его тело не могло быть пробито никаким оружием. Его единственной слабостью были глаза. Его отец Гуштасп знал это и всё же послал его сражаться с Рустамом — потому что живой Исфандияр был слишком опасен, чтобы оставаться рядом.",
      biography_ru: "Исфандияр прошёл ритуал, что сделал его тело неприступным для оружия — с одним исключением, что знали Заль и Симург. Он завершил свою собственную версию Семи подвигов и освободил своих сестёр из Медной крепости. Он был величайшим воином своей эпохи после Рустама. Когда его отец послал его привести Рустама в цепях обратно — миссия, невозможная без войны — все понимали, что это смертный приговор для одного из них. Стрела Рустама нашла глаз. Непобедимый человек упал.",
    },
    {
      id: "humay-esp", name: "Humay — The Captive Princess",
      name_fa: "همای — شاهزاده‌ی اسیر", name_tg: "Ҳумой — Шаҳзодаи Асир",
      type: "character", rarity: "epic", chapter: 23, emoji: "🏰",
      role: "Sister of Esfandiyar · Prisoner of the Brass Fortress · The Reason for the Labours",
      role_fa: "خواهرِ اسفندیار · زندانیِ دژِ برنجین · دلیلِ خوان‌ها",
      lore: "Seven labours crossed. A brass fortress stormed as a merchant disguise. All for her. Humay waited in Ruyeen-Dej and knew her brother would come — because Esfandiyar did not fail at things like that.",
      lore_fa: "هفت خوان گذشته شد. دژی برنجین با لباسِ بازرگانی فتح شد. همه برای او. همای در رویین‌دژ منتظر ماند و می‌دانست برادرش خواهد آمد — چون اسفندیار در چنین کارهایی شکست نمی‌خورد.",
      lore_tg: "Ҳафт хон гузашта шуд. Деже барин бо либоси тоҷир фатҳ шуд. Ҳама барои ӯ.",
      biography: "Humay and her sister Hamaspand were taken prisoner by Arjasp of Turan and held in the legendary Ruyeen-Dej — the Brass Fortress. Esfandiyar's seven labours were undertaken specifically to reach and free them. After six labours by sword and force, the seventh required a different approach: disguising himself as a merchant and entering peacefully before striking. Humay's rescue is the culmination and the point. The labours were not about Esfandiyar's glory — they were about his sisters.",
      powers: ["+8% Story XP", "+55 Zar/hr", "Passive: The Brass Gate — scene unlock XP +10%"],
      side: "light", nftReady: false, season: 2, order: 323,
      collectionId: "S2-CH23-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 9000, zar_per_hour: 55, prereq: null,
      unlockCondition: "Complete Chapter 23 · Esfandiyar's Seven Labours",
      unlockCondition_fa: "فصلِ ۲۳ (هفت خانِ اسفندیار) را کامل کنید",
      name_ru: "Хумай — Пленённая принцесса",
      role_ru: "Сестра Исфандияра · Пленница Медной крепости · Причина подвигов",
      lore_ru: "Семь подвигов пройдено. Медная крепость взята штурмом под видом купца. Всё для неё. Хумай ждала в Руйин-Деже и знала, что её брат придёт — потому что Исфандияр не подводил в таких делах.",
      biography_ru: "Хумай и её сестра Хамаспанд были взяты в плен Арджаспом Туранским и удержаны в легендарном Руйин-Деже — Медной крепости. Семь подвигов Исфандияра были предприняты именно для того, чтобы достичь и освободить их. После шести подвигов мечом и силой седьмой требовал иного подхода: переодеться купцом и войти мирно перед тем, как нанести удар. Спасение Хумай — кульминация и смысл всего. Подвиги были не о славе Исфандияра — они были о его сёстрах.",
    },

    /* ═══ POST-ESFANDIYAR — Ch 26–30 ════════════════════════════════════════ */
    {
      id: "rostam-elder", name: "Rostam — The Last Stand",
      name_fa: "رستمِ پیر — آخرین نبرد", name_tg: "Рустами Пир — Охирин Набард",
      type: "character", rarity: "legend", chapter: 26, emoji: "⚔",
      role: "Champion of Iran · Seven Labours Complete · Betrayed at the End of an Age",
      role_fa: "پهلوانِ ایران · هفت خوان تمام‌شده · خیانت دیده در پایانِ یک عصر",
      lore: "He survived seven impossible labours, dozens of wars, and outlived four royal dynasties. In the end it was a pit and a half-brother. Rostam fell into a trap dug by family. The strongest man in Persian mythology died by treachery, not combat.",
      lore_fa: "هفت خانِ ناممکن، ده‌ها جنگ، و چهار سلسله‌ی شاهی را پشتِ سر گذاشت. در آخر یک چاه و یک برادرِ ناتنی بود. رستم در دامِ خانواده افتاد. قوی‌ترین مردِ اساطیرِ ایران با خیانت مُرد، نه در نبرد.",
      lore_tg: "Ҳафт хони ғайриимкон, даҳҳо ҷанг ва чаҳор сулолаи шоҳиро паси сар гузошт.",
      biography: "Rostam's death came at the hands of his own half-brother Shaghad, who dug a pit full of spears and lured him in. Even mortally wounded, Rostam reached up from the pit and killed Shaghad with one last arrow, pinning him to a tree. His horse Rakhsh also died in the trap. Kay Bahman later came to Zabulistan and razed it in revenge. The death of Rostam marks the end of the heroic age of the Shahnameh — after him, the story shifts from myth to history.",
      powers: ["+15% Tap Power", "+110 Zar/hr", "Passive: The Last Arrow — owned_heroes gate requirement –2"],
      side: "light", nftReady: false, season: 2, order: 330,
      collectionId: "S2-CH26-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 18000, zar_per_hour: 110, prereq: null,
      unlockCondition: "Complete Chapter 26 · Rostam's Last Stand",
      unlockCondition_fa: "فصلِ ۲۶ (آخرین ایستادگیِ رستم) را کامل کنید",
      name_ru: "Рустам — Последний бой",
      role_ru: "Чемпион Ирана · Семь подвигов завершены · Предан в конце эпохи",
      lore_ru: "Он пережил семь невозможных подвигов, десятки войн и четыре царские династии. В конце это были яма и сводный брат. Рустам попал в ловушку, выкопанную семьёй. Сильнейший человек персидской мифологии погиб от предательства, а не в бою.",
      biography_ru: "Смерть Рустама пришла от рук его собственного сводного брата Шагада, что выкопал яму, полную копий, и заманил его туда. Даже смертельно раненный, Рустам поднялся из ямы и убил Шагада последней стрелой, пригвоздив его к дереву. Его конь Рахш также погиб в ловушке. Кай Бахман позже пришёл в Заболистан и сравнял его с землёй в отместку. Смерть Рустама отмечает конец героической эпохи Шахнаме — после него история переходит от мифа к истории.",
    },
    {
      id: "bahman-avenger", name: "Bahman — The Avenger's Son",
      name_fa: "بهمن — پسرِ انتقام‌گیر", name_tg: "Баҳмон — Писари Интиқомгир",
      type: "character", rarity: "rare", chapter: 27, emoji: "⚔",
      role: "Son of Esfandiyar · King of Iran · Destroyer of Zabulistan',",
      role_fa: "پسرِ اسفندیار · شاهِ ایران · ویرانگرِ زابلستان",
      lore: "He waited until he was powerful enough, then came down on Zabulistan like a storm. Not for glory. For his father's eye. Revenge that took a generation to arrive is still revenge.",
      lore_fa: "تا زمانی که به اندازه‌ی کافی قوی شد صبر کرد، سپس مانندِ طوفانی بر زابلستان فرود آمد. نه برای شکوه. برای چشمِ پدرش. انتقامی که یک نسل طول کشید تا برسد هنوز انتقام است.",
      lore_tg: "То он даме ки ба қадри кофӣ қавӣ шуд сабр кард, сипас чун тӯфоне бар Зобулистон фуруд омад.",
      biography: "Bahman is Esfandiyar's son and chose the long path — growing in power before striking. When he finally came to Zabulistan to avenge his father's death, he razed it methodically. He took Zal prisoner in chains of iron, though Zal survived through the power of the Simorgh feather. Bahman then ruled Iran and married Katayun, the daughter of the Caesar of Rum. He later had a son, Sasan, from whom the Sasanian dynasty would take its name centuries later — but at the time, no one knew this.",
      powers: ["+6% Tap Power", "+30 Zar/hr", "Passive: Long Patience — Zar income +8% per hour offline"],
      side: "neutral", nftReady: false, season: 2, order: 331,
      collectionId: "S2-CH27-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 5500, zar_per_hour: 30, prereq: null,
      unlockCondition: "Complete Chapter 27 · Bahman",
      unlockCondition_fa: "فصلِ ۲۷ (بهمن) را کامل کنید",
      name_ru: "Бахман — Сын мстителя",
      role_ru: "Сын Исфандияра · Царь Ирана · Разрушитель Заболистана",
      lore_ru: "Он подождал, пока стал достаточно силён, затем обрушился на Заболистан, как буря. Не за славу. За глаз своего отца. Мщение, что заняло поколение, чтобы прийти, всё равно остаётся мщением.",
      biography_ru: "Бахман — сын Исфандияра, и он выбрал долгий путь — наращивать силу, прежде чем нанести удар. Когда он наконец пришёл в Заболистан, чтобы отомстить за смерть отца, он разрушил его методично. Он взял Заля в плен в железных цепях, хотя Заль выжил благодаря силе пера Симурга. Затем Бахман правил Ираном и женился на Катаюн, дочери цезаря Рума. Позже у него родился сын Сасан, от чьего имени династия Сасанидов получит своё название столетия позже — но в то время никто этого не знал.",
    },
    {
      id: "homay-queen", name: "Homay — The Warrior Queen",
      name_fa: "همای — ملکه‌ی جنگاور", name_tg: "Ҳумои Малика — Маликаи Ҷангавар",
      type: "character", rarity: "epic", chapter: 28, emoji: "👑",
      role: "Daughter of Bahman · Queen of Iran · The Mother Who Abandoned Her Son',",
      role_fa: "دختر بهمن · ملکه‌ی ایران · مادری که پسرش را رها کرد",
      lore: "She ruled Iran as the last of the Kayanid line. She placed her infant son in a chest and set it on the river rather than let him threaten her throne. The boy survived. He became Darab. He came back.",
      lore_fa: "آخرین از دودمانِ کیانی بر ایران فرمانروایی کرد. پسرِ نوزادش را در صندوقی گذاشت و به جای اینکه اجازه دهد تختش را تهدید کند، به رودخانه سپرد. پسر زنده ماند. داراب شد. بازگشت.",
      lore_tg: "Охирин аз сулолаи Каёниён бар Эрон ҳукм ронд. Писари навзодашро дар сандуқе гузошт ва ба дарё супурд.",
      biography: "Homay Chahrzad was the daughter of Bahman and became queen of Iran after his death — one of only two women to rule Persia in the Shahnameh (the other being Purandokht of the Sassanid era). Her reign was capable and strong. The tragedy is her son: she became pregnant by Bahman in circumstances the text treats ambiguously, and rather than acknowledge the child she placed him in a chest on the Euphrates. The child was found, raised, and grew into Darab — who eventually discovered his origin and reclaimed Iran.",
      powers: ["+9% Tap Power", "+58 Zar/hr", "Passive: Iron Throne — hero card purchase cost –5%"],
      side: "neutral", nftReady: false, season: 2, order: 332,
      collectionId: "S2-CH28-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 9000, zar_per_hour: 58, prereq: null,
      unlockCondition: "Complete Chapter 28 · Homay",
      unlockCondition_fa: "فصلِ ۲۸ (همای) را کامل کنید",
      name_ru: "Хумай — Царица-воин",
      role_ru: "Дочь Бахмана · Царица Ирана · Мать, что оставила своего сына",
      lore_ru: "Она правила Ираном как последняя из рода Кеянидов. Она положила своего младенца-сына в сундук и пустила его по реке, вместо того чтобы позволить ему угрожать её трону. Мальчик выжил. Он стал Дарабом. Он вернулся.",
      biography_ru: "Хумай Чехрзад была дочерью Бахмана и стала царицей Ирана после его смерти — одной из лишь двух женщин, правивших Персией в Шахнаме (другая — Пурандохт эпохи Сасанидов). Её правление было умелым и сильным. Трагедия — её сын: она зачала от Бахмана в обстоятельствах, что текст трактует неоднозначно, и вместо того чтобы признать ребёнка, она положила его в сундук на Евфрате. Дитя было найдено, воспитано и выросло в Дараба — который в итоге узнал о своём происхождении и вернул себе Иран.",
    },
    {
      id: "darab-foundling", name: "Darab — The Foundling Prince",
      name_fa: "داراب — شاهزاده‌ی سرگردان", name_tg: "Дороб — Шаҳзодаи Саргардон",
      type: "character", rarity: "rare", chapter: 29, emoji: "🌊",
      role: "Son of Homay · Raised as a Commoner · Became King of Iran',",
      role_fa: "پسرِ همای · به‌عنوانِ مردمِ عادی بزرگ شد · شاهِ ایران شد",
      lore: "He was raised by a fuller who found the chest on the river. He grew up working cloth. He had the instincts of royalty — the men around him could feel it — but no name. When the truth came, nothing about him was surprising.",
      lore_fa: "توسطِ گازری که صندوق را در رودخانه یافت بزرگ شد. با کارِ پارچه زندگی کرد. غریزه‌ی اشرافیت داشت — مردانِ اطرافش آن را حس می‌کردند — اما هیچ نامی نداشت.",
      lore_tg: "Аз ҷониби ресандае ки сандуқро дар дарё ёфт тарбия ёфт. Бо коргузории матоъ зиндагӣ кард.",
      biography: "Darab's origin story is one of the Shahnameh's most dramatic: royal birth, secret abandonment on the river, commoner upbringing, gradual discovery of gifts that didn't fit his station. When his identity was revealed and Homay acknowledged him, he was already a man of notable character. His reign bridged the mythological Kayanids and the historical-ish world of Alexander — he fought the Caesar of Rum and won, before his son Dara lost to Eskandar.",
      powers: ["+5% Story XP", "+32 Zar/hr", "Passive: Hidden Crown — referral reward +8%"],
      side: "light", nftReady: false, season: 2, order: 333,
      collectionId: "S2-CH29-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 5500, zar_per_hour: 32, prereq: null,
      unlockCondition: "Complete Chapter 29 · Darab",
      unlockCondition_fa: "فصلِ ۲۹ (داراب) را کامل کنید",
      name_ru: "Дараб — Найдёныш-принц",
      role_ru: "Сын Хумай · Воспитан простолюдином · Стал царём Ирана",
      lore_ru: "Его вырастил сукновал, что нашёл сундук на реке. Он рос, работая с тканью. У него были инстинкты царственности — окружавшие его люди это чувствовали — но не было имени. Когда пришла правда, ничто в нём не было удивительным.",
      biography_ru: "История происхождения Дараба — одна из самых драматичных в Шахнаме: царское рождение, тайное оставление на реке, воспитание простолюдином, постепенное раскрытие дарований, не подходящих его положению. Когда его личность была раскрыта и Хумай признала его, он уже был человеком заметного характера. Его правление соединило мифологических Кеянидов и почти-исторический мир Александра — он сражался с цезарем Рума и победил, прежде чем его сын Дара проиграл Искандару.",
    },
    {
      id: "dara-last", name: "Dara — The Last King Before the Storm",
      name_fa: "دارا — آخرین شاه پیش از طوفان", name_tg: "Дорои Охирин — Охирин Шоҳ Пеш аз Тӯфон",
      type: "character", rarity: "rare", chapter: 30, emoji: "🌑",
      role: "Last Achaemenid · Son of Darab · Betrayed by His Own Ministers',",
      role_fa: "آخرینِ هخامنشیان · پسرِ داراب · توسطِ وزیرانش خیانت دیده شد",
      lore: "He fought Alexander twice and lost. His ministers killed him so they could negotiate with the conqueror. Alexander found him dying and wept. Even enemies can recognize when something irreplaceable is ending.",
      lore_fa: "دو بار با اسکندر جنگید و شکست خورد. وزیرانش او را کشتند تا بتوانند با فاتح مذاکره کنند. اسکندر او را در حالِ مرگ یافت و گریست. حتی دشمنان هم می‌توانند بفهمند وقتی چیزی جایگزین‌ناپذیر دارد پایان می‌یابد.",
      lore_tg: "Ду бор бо Искандар ҷангид ва шикаст хӯрд. Вазирашон ӯро куштанд то бо фотеҳ музокира кунанд.",
      biography: "Dara (Darius III in history) is the last great king of the Achaemenid line in the Shahnameh's telling. He led Persia in two major battles against Alexander — and was outmaneuvered both times. When he fled after the second defeat, his own satraps Bessus and Nabarzanes stabbed him, hoping to buy themselves mercy from Alexander. Alexander arrived while Dara was still breathing, held his head, and refused to let him die dishonored. The moment of the enemy king holding the dying king is one of the Shahnameh's most striking scenes.",
      powers: ["+4% Tap Power", "+35 Zar/hr", "Passive: The Last Watch — XP from completed chapters +6%"],
      side: "light", nftReady: false, season: 2, order: 334,
      collectionId: "S2-CH30-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 6000, zar_per_hour: 35, prereq: null,
      unlockCondition: "Complete Chapter 30 · Dara",
      unlockCondition_fa: "فصلِ ۳۰ (دارا) را کامل کنید",
      name_ru: "Дара — Последний царь перед бурей",
      role_ru: "Последний Ахеменид · Сын Дараба · Предан своими министрами",
      lore_ru: "Он сражался с Александром дважды и проиграл. Его министры убили его, чтобы вести переговоры с завоевателем. Александр нашёл его умирающим и заплакал. Даже враги могут признать, когда заканчивается нечто незаменимое.",
      biography_ru: "Дара (Дарий III в истории) — последний великий царь рода Ахеменидов в изложении Шахнаме. Он вёл Персию в двух крупных битвах против Александра — и был переигран оба раза. Когда он бежал после второго поражения, его собственные сатрапы Бесс и Набарзан зарезали его, надеясь купить себе милость Александра. Александр прибыл, когда Дара ещё дышал, держал его голову и не позволил ему умереть обесчещенным. Момент, когда враждебный царь держит умирающего царя, — одна из самых поразительных сцен Шахнаме.",
    },

    /* ═══ ALEXANDER & ASHKANIAN — Ch 31–33 ════════════════════════════════ */
    {
      id: "eskandar", name: "Eskandar — The Two-Horned",
      name_fa: "اسکندر — ذوالقرنین", name_tg: "Искандар — Зулқарнайн",
      type: "character", rarity: "legend", chapter: 31, emoji: "🌍",
      role: "King of Rum · Conqueror of Persia · Seeker of the Water of Life',",
      role_fa: "شاهِ روم · فاتحِ ایران · جوینده‌ی آبِ حیات",
      lore: "He crossed the world and found it was not enough. He reached the darkness at the edge of reality looking for immortal water and came back without it. Everything he conquered stayed conquered. He did not stay.",
      lore_fa: "جهان را درنوردید و دید که کافی نیست. به تاریکی لبه‌ی واقعیت رفت تا آبِ جاودانگی بیابد و بدونِ آن بازگشت. هرچه فتح کرد فتح‌شده ماند. او نماند.",
      lore_tg: "Ҷаҳонро тай кард ва дид ки кофӣ нест. Ба торикии канори воқеият рафт то оби ҷовидонӣ биёбад.",
      biography: "Ferdowsi's Alexander (Eskandar) is a complex figure — simultaneously the destroyer of Persepolis and a seeker of wisdom. In the Shahnameh's interpretation he is the son of Darab and a Rum princess, making him half-Persian. He is the Two-Horned (Zulqarnayn), who traveled to the edge of the world. He is the philosopher-king who discussed justice with wise men in every country. He is also the conqueror who burned Persepolis. Ferdowsi holds all this without resolving it.",
      powers: ["+12% Story XP", "+105 Zar/hr", "Passive: The Two-Horned — unlock all chapter codex entries automatically"],
      side: "neutral", nftReady: false, season: 2, order: 340,
      collectionId: "S2-CH31-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 18000, zar_per_hour: 105, prereq: null,
      unlockCondition: "Complete Chapter 31 · Alexander",
      unlockCondition_fa: "فصلِ ۳۱ (اسکندر) را کامل کنید",
      name_ru: "Искандар — Двурогий",
      role_ru: "Царь Рума · Завоеватель Персии · Искатель Воды жизни",
      lore_ru: "Он пересёк мир и нашёл, что этого недостаточно. Он достиг тьмы на краю реальности, ища бессмертную воду, и вернулся без неё. Всё, что он завоевал, осталось завоёванным. Сам он не остался.",
      biography_ru: "Александр (Искандар) Фирдоуси — сложная фигура: одновременно разрушитель Персеполиса и искатель мудрости. В трактовке Шахнаме он сын Дараба и румийской принцессы, что делает его наполовину персом. Он Двурогий (Зулькарнайн), что путешествовал на край мира. Он философ-царь, обсуждавший справедливость с мудрецами в каждой стране. Он также завоеватель, что сжёг Персеполис. Фирдоуси удерживает всё это, не разрешая противоречия.",
    },
    {
      id: "ashk-founder", name: "Ashk — First of the Arsacids",
      name_fa: "اشک — نخستین اشکانی", name_tg: "Ашк — Аввалини Ашкониён",
      type: "character", rarity: "rare", chapter: 32, emoji: "🏹",
      role: "Founder of the Ashkanian Dynasty · The Interval King',",
      role_fa: "بنیان‌گذارِ سلسله‌ی اشکانی · شاهِ فاصله",
      lore: "Between Alexander and Ardeshir, five centuries passed. The Ashkanians held Iran together through that long interval — not with the glory of the mythological kings, but with persistence. Ashk was the beginning of that persistence.",
      lore_fa: "بینِ اسکندر و اردشیر، پنج قرن گذشت. اشکانیان ایران را در طولِ آن فاصله‌ی طولانی نه با شکوهِ شاهانِ اسطوره‌ای، بلکه با پایداری نگه داشتند. اشک آغازِ آن پایداری بود.",
      lore_tg: "Дар байни Искандар ва Ардашер панҷ аср гузашт. Ашкониён Эронро дар тӯли он фосилаи тӯлонӣ нигоҳ доштанд.",
      biography: "The Ashkanian (Arsacid) dynasty is treated briefly in the Shahnameh — Ferdowsi was writing under Ghaznavid patronage and focused more attention on the Sassanids who revived Zoroastrianism. Ashk is the dynasty's founder, the moment when Iran began reassembling itself after Alexander. The five centuries of Arsacid rule are compressed into a few lines, but the historical reality was that the Parthians fought Rome to a standstill and preserved Iranian culture through Hellenistic pressures.",
      powers: ["+4% Tap Power", "+35 Zar/hr", "Passive: The Long Interval — daily check-in streak bonus +1 day"],
      side: "light", nftReady: false, season: 2, order: 341,
      collectionId: "S2-CH32-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 6000, zar_per_hour: 35, prereq: null,
      unlockCondition: "Complete Chapter 32 · The Ashkanian Age",
      unlockCondition_fa: "فصلِ ۳۲ (عصرِ اشکانیان) را کامل کنید",
      name_ru: "Ашк — Первый из Аршакидов",
      role_ru: "Основатель династии Аршакидов · Царь промежутка",
      lore_ru: "Между Александром и Ардеширом прошло пять столетий. Аршакиды удерживали Иран целым через этот долгий промежуток — не славой мифологических царей, а упорством. Ашк был началом этого упорства.",
      biography_ru: "Династия Аршакидов (Парфян) рассматривается в Шахнаме кратко — Фирдоуси писал под покровительством Газневидов и уделял больше внимания Сасанидам, что возродили зороастризм. Ашк — основатель династии, момент, когда Иран начал собирать себя после Александра. Пять веков правления Аршакидов сжаты в несколько строк, но историческая реальность была такова, что парфяне сражались с Римом до ничьей и сохранили иранскую культуру через эллинистическое давление.",
    },
    {
      id: "ardavan-last", name: "Ardavan — The Last Arsacid",
      name_fa: "اردوان — آخرین اشکانی", name_tg: "Ардавон — Охирини Ашкониён",
      type: "character", rarity: "epic", chapter: 33, emoji: "⚔",
      role: "Last King of the Arsacid Dynasty · Defeated by Ardeshir · End of 500 Years',",
      role_fa: "آخرین شاهِ سلسله‌ی اشکانی · شکست‌خورده از اردشیر · پایانِ ۵۰۰ سال",
      lore: "He met Ardeshir on the plain of Hormuzdgan. He had the larger army. He lost. Five centuries of Arsacid power ended in a single afternoon.",
      lore_fa: "در دشتِ هرمزدگان با اردشیر روبرو شد. ارتشِ بزرگ‌تری داشت. شکست خورد. پانصد سال قدرتِ اشکانی در یک بعدازظهر پایان یافت.",
      lore_tg: "Дар даштаки Ҳурмуздагон бо Ардашер рӯбарӯ шуд. Артиши бузургтаре дошт. Шикаст хӯрд.",
      biography: "Ardavan IV was the last Parthian king, ruling at the moment Ardeshir Papakan rose from the province of Fars to challenge him. Their confrontation ended at the battle of Hormuzdgan in 224 CE — one of the most decisive battles in Iranian history. Ardavan was killed in the fighting and the Arsacid dynasty, which had ruled for nearly five centuries, ended. From Ardavan's defeat the Sassanid empire was born and with it the last great Iranian empire of the ancient world.",
      powers: ["+7% Tap Power", "+48 Zar/hr", "Passive: Dynasty's End — story XP from historic chapters +12%"],
      side: "neutral", nftReady: false, season: 2, order: 342,
      collectionId: "S2-CH33-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 8000, zar_per_hour: 48, prereq: null,
      unlockCondition: "Complete Chapter 33 · Ardavan",
      unlockCondition_fa: "فصلِ ۳۳ (اردوان) را کامل کنید",
      name_ru: "Ардаван — Последний Аршакид",
      role_ru: "Последний царь династии Аршакидов · Побеждён Ардеширом · Конец 500 лет",
      lore_ru: "Он встретил Ардешира на равнине Хормуздган. У него была армия больше. Он проиграл. Пять столетий власти Аршакидов закончились за один день.",
      biography_ru: "Ардаван IV был последним парфянским царём, правившим в момент, когда Ардешир Папакан поднялся из провинции Фарс, чтобы вызвать его на бой. Их противостояние завершилось в битве при Хормуздгане в 224 году н.э. — одной из самых решающих битв в истории Ирана. Ардаван был убит в бою, и династия Аршакидов, правившая почти пять веков, закончилась. Из поражения Ардавана родилась Сасанидская империя, а с ней — последняя великая иранская империя древнего мира.",
    },

    /* ═══ SASSANID EMPIRE — Ch 34–44 ════════════════════════════════════════ */
    {
      id: "ardeshir-founder", name: "Ardeshir — Founder of Sassan",
      name_fa: "اردشیرِ بابکان — بنیان‌گذارِ ساسانیان", name_tg: "Ардашери Бобакон — Бунёдгузори Сосониён",
      type: "character", rarity: "legend", chapter: 34, emoji: "🔥",
      role: "Founder of the Sassanid Dynasty · Restorer of Zoroastrianism · King of Kings',",
      role_fa: "بنیان‌گذارِ سلسله‌ی ساسانی · احیاگرِ زرتشتی‌گری · شاهنشاه",
      lore: "He came from a family of fire-temple priests in Fars and built the last great Iranian empire from the ground up. He called his dynasty after his ancestor Sasan. He brought back the sacred fires that Alexander had allowed to go dark.",
      lore_fa: "از خانواده‌ای از موبدانِ آتشکده در فارس آمد و آخرین امپراتوریِ بزرگِ ایران را از صفر ساخت. سلسله‌اش را به نامِ جدِّش ساسان نامید. آتش‌های مقدسی را که اسکندر گذاشته بود خاموش شوند بازگرداند.",
      lore_tg: "Аз оилаи мӯбадони оташкада дар Форс омад ва охирин империяи бузурги Эронро аз сифр сохт.",
      biography: "Ardeshir I Papakan destroyed the Arsacid empire and founded the Sassanid dynasty in 224 CE. His program was religious as much as political: the Zoroastrian faith was restored as the state religion, fire temples rebuilt, the Avesta recompiled. He consolidated the fractured satrapy system into a centralized empire. The dynasty he founded would rule Iran for four centuries, produce Anushirvan the Just and Khosrow Parviz, and fall to the Arab conquest in the seventh century. Everything that comes after in the Shahnameh follows from this moment.",
      powers: ["+11% Tap Power", "+88 Zar/hr", "Passive: Sacred Fire Restored — farr generation from all sources +10%"],
      side: "light", nftReady: false, season: 2, order: 350,
      collectionId: "S2-CH34-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 16000, zar_per_hour: 88, prereq: null,
      unlockCondition: "Complete Chapter 34 · Ardeshir",
      unlockCondition_fa: "فصلِ ۳۴ (اردشیر) را کامل کنید",
      name_ru: "Ардешир — Основатель Сасанидов",
      role_ru: "Основатель династии Сасанидов · Восстановитель зороастризма · Царь царей",
      lore_ru: "Он пришёл из семьи жрецов храма огня в Фарсе и построил последнюю великую иранскую империю с нуля. Он назвал свою династию по имени предка Сасана. Он вернул священные огни, что Александр позволил угаснуть.",
      biography_ru: "Ардешир I Папакан уничтожил империю Аршакидов и основал династию Сасанидов в 224 году н.э. Его программа была столь же религиозной, сколь и политической: зороастрийская вера была восстановлена как государственная религия, храмы огня перестроены, Авеста собрана вновь. Он объединил раздробленную систему сатрапий в централизованную империю. Основанная им династия будет править Ираном четыре века, произведёт Ануширвана Справедливого и Хосрова Парвиза и падёт от арабского завоевания в седьмом веке. Всё, что следует далее в Шахнаме, проистекает из этого момента.",
    },
    {
      id: "shapur-great", name: "Shapur the Great — Rome Kneels",
      name_fa: "شاپورِ بزرگ — روم زانو می‌زند", name_tg: "Шопури Бузург — Рум Зону Мезанад",
      type: "character", rarity: "legend", chapter: 35, emoji: "🦁",
      role: "Shapur II · King of Kings · The Emperor Who Captured an Emperor',",
      role_fa: "شاپورِ دوم · شاهنشاه · امپراتوری که امپراتور اسیر کرد",
      lore: "At the battle of Edessa he defeated and captured the Roman Emperor Valerian — the only time in history a Roman emperor was taken prisoner in battle. He carved the image of his victory into rock at Naqsh-e Rostam. The stone is still there.",
      lore_fa: "در نبردِ ادسا امپراتورِ رومی والرین را شکست داد و اسیر کرد — تنها باری در تاریخ که یک امپراتورِ روم در نبرد اسیر شد. تصویرِ پیروزی‌اش را در نقشِ رستم بر سنگ کند. سنگ هنوز آنجاست.",
      lore_tg: "Дар набарди Эдесса Валериани императори Румро шикаст дод ва асир кард — ягона бор дар таърих.",
      biography: "Shapur I founded the convention and his son Shapur II confirmed the dynasty's supremacy. The moment of the Roman Emperor Valerian kneeling before Shapur was carved into the cliff at Naqsh-e Rostam near Persepolis — visible today. Shapur II ruled for 70 years, the longest reign of any Sassanid king, fighting the Romans in nine campaigns and the Kushans in the east. He was born king — his father Hormuz II died before his birth and nobles placed the crown on the queen's pregnant belly.",
      powers: ["+13% Tap Power", "+100 Zar/hr", "Passive: The Kneeling Emperor — battle gate farr –2 for chapters 35+"],
      side: "light", nftReady: false, season: 2, order: 351,
      collectionId: "S2-CH35-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 17000, zar_per_hour: 100, prereq: null,
      unlockCondition: "Complete Chapter 35 · Shapur the Great",
      unlockCondition_fa: "فصلِ ۳۵ (شاپورِ بزرگ) را کامل کنید",
      name_ru: "Шапур Великий — Рим на коленях",
      role_ru: "Шапур II · Царь царей · Император, что взял в плен императора",
      lore_ru: "В битве при Эдессе он победил и захватил в плен римского императора Валериана — единственный раз в истории, когда римский император был взят в плен в бою. Он высек образ своей победы на скале в Накш-е Рустам. Камень там до сих пор.",
      biography_ru: "Шапур I основал традицию, а его сын Шапур II подтвердил превосходство династии. Момент, когда римский император Валериан стоит на коленях перед Шапуром, был высечен на скале Накш-е Рустам близ Персеполиса — видимый и сегодня. Шапур II правил 70 лет — самое долгое правление среди всех царей Сасанидов, — сражаясь с римлянами в девяти походах и с кушанами на востоке. Он родился царём — его отец Хормуз II умер до его рождения, и знать возложила корону на беременный живот царицы.",
    },
    {
      id: "bahram-gur", name: "Bahram Gur — The Lion Hunter",
      name_fa: "بهرامِ گور — شیرشکار", name_tg: "Баҳроми Гӯр — Шершикор",
      type: "character", rarity: "legend", chapter: 36, emoji: "🏹",
      role: "Bahram V · The Poet King · Hunter and Lover · Legend in His Own Lifetime',",
      role_fa: "بهرامِ پنجم · شاهِ شاعر · شکارچی و عاشق · افسانه در زمانِ حیاتش",
      lore: "He could pin two gazelles together with a single arrow through their legs. He hunted lions. He played the harp. He fell into a quicksand while chasing game and was never found. The most beloved king of the Sassanid era vanished the way legends should.",
      lore_fa: "می‌توانست با یک تیر از میانِ پایشان دو آهو را به هم بدوزد. شیر می‌شکار کرد. چنگ می‌نواخت. در حالِ تعقیبِ شکار در باتلاق فرو رفت و هرگز یافت نشد.",
      lore_tg: "Метавонист бо як тир аз байни пойҳояшон ду оҳуро ба ҳам бидӯзад. Шер меовард. Чанг менавохт.",
      biography: "Bahram V is the most celebrated king of the Sassanid era in Persian memory — not for military conquest but for personality. His epithet Gur (onager) came from his preferred prey. He was educated at the Lakhmid court in Arabia and returned to claim the throne against opposition. He fought the Eastern Roman Empire to a draw and signed the first religious freedom treaty in history. His death is the most fitting in the Shahnameh: the great hunter disappearing while hunting, swallowed by the earth as though the land claimed him back.",
      powers: ["+12% Tap Power", "+105 Zar/hr", "Passive: The Perfect Shot — hard quiz score doubles XP once per chapter"],
      side: "light", nftReady: false, season: 2, order: 352,
      collectionId: "S2-CH36-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 17000, zar_per_hour: 105, prereq: null,
      unlockCondition: "Complete Chapter 36 · Bahram Gur",
      unlockCondition_fa: "فصلِ ۳۶ (بهرامِ گور) را کامل کنید",
      name_ru: "Бахрам Гур — Охотник на львов",
      role_ru: "Бахрам V · Царь-поэт · Охотник и влюблённый · Легенда при жизни",
      lore_ru: "Он мог пригвоздить двух газелей вместе одной стрелой через их ноги. Он охотился на львов. Он играл на арфе. Он провалился в зыбучие пески, преследуя дичь, и его так и не нашли. Самый любимый царь эпохи Сасанидов исчез так, как и положено легендам.",
      biography_ru: "Бахрам V — самый прославленный царь эпохи Сасанидов в персидской памяти — не за военные завоевания, а за личность. Его прозвище Гур (онагр) пришло от его любимой дичи. Он получил образование при дворе Лахмидов в Аравии и вернулся, чтобы заявить права на трон против сопротивления. Он сражался с Восточной Римской империей до ничьей и подписал первый в истории договор о религиозной свободе. Его смерть — самая подходящая в Шахнаме: великий охотник, исчезающий на охоте, поглощённый землёй, как будто земля забрала его обратно.",
    },
    {
      id: "yazdegerd-sinner", name: "Yazdegerd the Sinner",
      name_fa: "یزدگردِ بزهکار", name_tg: "Яздигирди Гунаҳкор",
      type: "character", rarity: "rare", chapter: 37, emoji: "⚖",
      role: "Yazdegerd I · Tolerant King · Named Sinner for His Mercy',",
      role_fa: "یزدگردِ اول · شاهِ متسامح · بزهکار نامیده شد به خاطرِ بخشایشش",
      lore: "He let Christians build churches. He let Jews practice their faith. He let Zoroastrian priests feel insecure. The priests called him Sinner. History calls it tolerance. The difference in perspective is the lesson.",
      lore_fa: "به مسیحیان اجازه داد کلیسا بسازند. به یهودیان اجازه داد دینشان را اجرا کنند. موبدانِ زرتشتی را ناامن احساس کرد. موبدان او را بزهکار نامیدند. تاریخ آن را تسامح می‌نامد.",
      lore_tg: "Ба масеҳиён иҷозат дод калисо бисозанд. Ба яҳудиён иҷозат дод дини худро амал кунанд.",
      biography: "Yazdegerd I ruled from 399-420 CE and is a paradox: called 'the Sinner' by Zoroastrian clergy for his relative tolerance of Christians and Jews, he has been viewed more favorably by modern historians as a pragmatic ruler. He married a Jewish woman. He allowed religious diversity. His reign was relatively peaceful. The Zoroastrian establishment was powerful enough to shape his posthumous reputation even though Bahram Gur, his son, immediately took revenge on the nobles and clergy who had caused trouble. The name 'Sinner' stuck anyway.",
      powers: ["+5% Story XP", "+38 Zar/hr", "Passive: Tolerance Doctrine — social task reward +10%"],
      side: "neutral", nftReady: false, season: 2, order: 353,
      collectionId: "S2-CH37-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 7000, zar_per_hour: 38, prereq: null,
      unlockCondition: "Complete Chapter 37 · Yazdegerd the Sinner",
      unlockCondition_fa: "فصلِ ۳۷ (یزدگردِ بزهکار) را کامل کنید",
      name_ru: "Йездигерд-грешник",
      role_ru: "Йездигерд I · Терпимый царь · Прозванный грешником за своё милосердие",
      lore_ru: "Он позволил христианам строить церкви. Он позволил иудеям исповедовать свою веру. Он заставил зороастрийских жрецов почувствовать себя неуверенно. Жрецы назвали его грешником. История называет это терпимостью. Разница во взгляде — и есть урок.",
      biography_ru: "Йездигерд I правил с 399 по 420 год н.э. и представляет собой парадокс: названный «грешником» зороастрийским духовенством за относительную терпимость к христианам и иудеям, он был оценён более благосклонно современными историками как прагматичный правитель. Он женился на еврейке. Он позволял религиозное разнообразие. Его правление было относительно мирным. Зороастрийское духовенство было достаточно влиятельным, чтобы сформировать его посмертную репутацию, хотя Бахрам Гур, его сын, немедленно отомстил знати и духовенству, причинявшим неприятности. Имя «Грешник» всё же прилипло.",
    },
    {
      id: "bahram-chubin", name: "Bahram Chubin — The Rebel General",
      name_fa: "بهرامِ چوبین — سردارِ شورشی", name_tg: "Баҳроми Чӯбин — Сардори Шӯришгар",
      type: "character", rarity: "legend", chapter: 38, emoji: "⚔",
      role: "Sassanid General · Rebel King · The General Who Toppled His Own Emperor',",
      role_fa: "سردارِ ساسانی · شاهِ شورشی · سرداری که امپراتورِ خودش را سرنگون کرد",
      lore: "He defeated the Turks in the east and the Romans in the west and came back to a throne that insulted him for it. So he took the throne. Bahram Chubin briefly ruled Iran without being from the royal line. No one had done that since Alexander.",
      lore_fa: "ترکان را در شرق و رومیان را در غرب شکست داد و به تختی بازگشت که برایش توهین کرد. پس تخت را گرفت. بهرامِ چوبین برای مدتی کوتاه ایران را بدون آنکه از خاندانِ سلطنتی باشد اداره کرد. از زمانِ اسکندر کسی این کار را نکرده بود.",
      lore_tg: "Турконро дар шарқ ва Руминиёнро дар ғарб шикаст дод ва ба тахте баргашт ки ӯро таҳқир кард.",
      biography: "Bahram Chubin was the most brilliant general of the late Sassanid era and the first commoner (by blood) to rule Persia since Alexander. He rose from the nobility of Ray, won a series of spectacular victories, and when Hormuz IV had him publicly humiliated after an embarrassing tactical defeat, he refused to accept it. He raised the army's banner of rebellion and drove Hormuz from the throne. He ruled as Bahram VI before Khosrow Parviz, backed by Byzantine forces, returned and killed him. He died in Turkic exile. His story is the tragedy of competence in a system built on birth.",
      powers: ["+13% Tap Power", "+115 Zar/hr", "Passive: The Thinned Blade — battle gate owned_heroes –2 for ch 38+"],
      side: "neutral", nftReady: false, season: 2, order: 354,
      collectionId: "S2-CH38-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 19000, zar_per_hour: 115, prereq: null,
      unlockCondition: "Complete Chapter 38 · Bahram Chubin",
      unlockCondition_fa: "فصلِ ۳۸ (بهرامِ چوبین) را کامل کنید",
      name_ru: "Бахрам Чубин — Мятежный генерал",
      role_ru: "Сасанидский генерал · Мятежный царь · Генерал, что сверг своего императора",
      lore_ru: "Он победил турков на востоке и римлян на западе и вернулся к трону, что оскорбил его за это. Тогда он взял трон сам. Бахрам Чубин недолго правил Ираном, не будучи из царского рода. Никто не делал этого со времён Александра.",
      biography_ru: "Бахрам Чубин был самым блестящим генералом позднего периода Сасанидов и первым простолюдином (по крови), правившим Персией со времён Александра. Он поднялся из знати Рея, выиграл серию впечатляющих побед, и когда Хормуз IV публично унизил его после досадного тактического поражения, он отказался это принять. Он поднял знамя восстания армии и сверг Хормуза с трона. Он правил как Бахрам VI, прежде чем Хосров Парвиз, поддержанный византийскими силами, вернулся и убил его. Он умер в тюркском изгнании. Его история — трагедия компетентности в системе, построенной на происхождении.",
    },
    {
      id: "anushirvan", name: "Anushirvan — The Just",
      name_fa: "انوشیروانِ عادل", name_tg: "Анӯшервони Одил",
      type: "character", rarity: "mythic", chapter: 39, emoji: "⚖",
      role: "Khosrow I · The Just King · Standard of Justice for a Thousand Years',",
      role_fa: "خسروِ اول · شاهِ عادل · معیارِ عدالت برای هزار سال",
      lore: "He reformed the tax system so no one could be taxed beyond their means. He welcomed the Greek philosophers expelled from Athens. He invited the chess game from India and sent backgammon in return. He is what a king looks like when he is trying.",
      lore_fa: "سیستمِ مالیاتی را اصلاح کرد تا کسی بیش از توانش مالیات ندهد. فیلسوفانِ یونانی اخراج‌شده از آتن را پذیرفت. بازیِ شطرنج را از هند آورد و نرد را به جایش فرستاد. او تصویرِ یک شاه است وقتی که واقعاً تلاش می‌کند.",
      lore_tg: "Системаи андозро ислоҳ кард то ҳеҷ кас аз тавони худ бештар андоз надиҳад. Файласуфони юнониро аз Атина ронда буданд пазируфт.",
      biography: "Khosrow I Anushirvan (531-579 CE) is the ideal Persian king in collective memory — the standard against which all others are measured. He administered a massive land tax reform that based assessment on actual productivity rather than arbitrary imposition. He built schools and hospitals. He corresponded with philosophers across the known world. He codified the Sassanid administrative system. He is called 'Just' because he built structures meant to distribute justice — courts of appeal, fixed tax rates, protection for farmers against noble exploitation. The Prophet Muhammad was reportedly born during his reign and is recorded as saying: 'I was born in the era of the just king.'",
      powers: ["+18% Story XP", "+155 Zar/hr", "Passive: The Just Law — all REAL income from quizzes +15%"],
      side: "light", nftReady: false, season: 2, order: 355,
      collectionId: "S2-CH39-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 28000, zar_per_hour: 155, prereq: null,
      unlockCondition: "Complete Chapter 39 · Anushirvan the Just",
      unlockCondition_fa: "فصلِ ۳۹ (انوشیروانِ عادل) را کامل کنید",
      name_ru: "Ануширван — Справедливый",
      role_ru: "Хосров I · Справедливый царь · Эталон справедливости на тысячу лет",
      lore_ru: "Он реформировал налоговую систему, чтобы никого не облагали налогом сверх его средств. Он принял греческих философов, изгнанных из Афин. Он пригласил игру в шахматы из Индии и отправил взамен нарды. Он — то, как выглядит царь, когда он по-настоящему старается.",
      biography_ru: "Хосров I Ануширван (531-579 н.э.) — идеальный персидский царь в коллективной памяти, эталон, по которому измеряют всех остальных. Он провёл масштабную земельную налоговую реформу, основанную на реальной продуктивности, а не на произвольном начислении. Он строил школы и больницы. Он переписывался с философами по всему известному миру. Он кодифицировал административную систему Сасанидов. Его называют «Справедливым», потому что он создал структуры для распределения справедливости — апелляционные суды, фиксированные налоговые ставки, защиту крестьян от эксплуатации знатью. Пророк Мухаммад, по преданию, родился во время его правления и, как сообщается, сказал: «Я родился в эпоху справедливого царя».",
    },
    {
      id: "nushzad", name: "Nushzad — The Rebel Son",
      name_fa: "نوشزاد — پسرِ شورشی", name_tg: "Нӯшзод — Писари Шӯришгар",
      type: "character", rarity: "rare", chapter: 40, emoji: "✝",
      role: "Son of Anushirvan · Christian · Rebelled Against His Father While He Was at War',",
      role_fa: "پسرِ انوشیروان · مسیحی · در زمانِ جنگِ پدرش علیه او شورید",
      lore: "His mother was a Christian woman. He grew up in her faith. When Anushirvan marched east, Nushzad raised the Christians of Khuzestan in revolt. His father sent a general, not himself. That was its own message.",
      lore_fa: "مادرش زنی مسیحی بود. در ایمانِ او بزرگ شد. وقتی انوشیروان به شرق رفت، نوشزاد مسیحیانِ خوزستان را به شورش برانگیخت. پدرش یک سردار فرستاد، نه خودش. این خودش پیامی بود.",
      lore_tg: "Модараш зани масеҳӣ буд. Ӯ дар имони ӯ калон шуд. Вақте Анӯшервон ба шарқ рафт, Нӯшзод масеҳиёни Хузистонро ба шӯриш бархезонд.",
      biography: "Nushzad is a minor figure who represents a major tension: the question of religious identity inside a Zoroastrian empire. Born of a Christian mother, he identifies with her faith and with the Christian population of Khuzestan. When his father Anushirvan is occupied with wars in the east, Nushzad sees an opportunity. The revolt fails. Nushzad is captured and — in the historical sources — executed. Ferdowsi treats him with some sympathy: a man whose identity was divided by birth and who chose the wrong side at the wrong time.",
      powers: ["+4% Story XP", "+35 Zar/hr", "Passive: The Divided Son — social and referral task bonus +8%"],
      side: "neutral", nftReady: false, season: 2, order: 356,
      collectionId: "S2-CH40-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 7000, zar_per_hour: 35, prereq: null,
      unlockCondition: "Complete Chapter 40 · Nushzad",
      unlockCondition_fa: "فصلِ ۴۰ (نوشزاد) را کامل کنید",
      name_ru: "Нушзад — Мятежный сын",
      role_ru: "Сын Ануширвана · Христианин · Восстал против отца, пока тот был на войне",
      lore_ru: "Его мать была христианкой. Он рос в её вере. Когда Ануширван пошёл на восток, Нушзад поднял христиан Хузестана на восстание. Его отец послал генерала, а не явился сам. Это само было посланием.",
      biography_ru: "Нушзад — второстепенная фигура, представляющая большое напряжение: вопрос религиозной идентичности внутри зороастрийской империи. Рождённый от христианской матери, он отождествляет себя с её верой и с христианским населением Хузестана. Когда его отец Ануширван занят войнами на востоке, Нушзад видит возможность. Восстание проваливается. Нушзад захвачен и — по историческим источникам — казнён. Фирдоуси относится к нему с некоторым сочувствием: человек, чья идентичность была разделена с рождения, и который выбрал неверную сторону в неверное время.",
    },
    {
      id: "hormuz-iv", name: "Hormuz — The Crumbling Crown",
      name_fa: "هرمزِ چهارم — تاجِ فروپاشنده", name_tg: "Ҳурмузи Чаҳорум — Тоҷи Фурӯпошанда",
      type: "character", rarity: "rare", chapter: 41, emoji: "💀",
      role: "Son of Anushirvan · Cruel King · Blinded and Deposed by His Own Nobles',",
      role_fa: "پسرِ انوشیروان · شاهِ ستمگر · توسطِ اشرافش کور و خلع شد",
      lore: "He inherited the most powerful throne in Asia and spent it making enemies of everyone. The nobles blinded him and put his son on the throne. Bahram Chubin had already taken the throne by then. There were three kings of Persia at once.",
      lore_fa: "قدرتمندترین تخت آسیا را به ارث برد و صرفِ دشمن‌تراشی از همه کرد. اشراف او را کور کردند و پسرش را بر تخت نشاندند. بهرامِ چوبین تا آن موقع تخت را گرفته بود. سه شاه به طورِ هم‌زمان در ایران بودند.",
      lore_tg: "Қудратмандтарин тахти Осиёро ба мерос гирифт ва барои душман сохтан аз ҳама сарф кард.",
      biography: "Hormuz IV ruled from 579-590 CE — a period of mounting crisis. He executed or imprisoned senior generals and nobles, including Bahram Chubin's humiliation after a tactical defeat. He was cruel to the aristocracy and the clergy simultaneously, which is a difficult achievement. His nobles eventually seized him, blinded him, and installed his young son Khosrow Parviz on the throne. Meanwhile Bahram Chubin declared himself king. The period of three simultaneous claimants was brief but established that the late Sassanid empire was structurally unstable — a warning nobody heeded.",
      powers: ["+4% Tap Power", "+38 Zar/hr", "Passive: Crumbling Authority — chapter XP +10% from crisis chapters"],
      side: "dark", nftReady: false, season: 2, order: 357,
      collectionId: "S2-CH41-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 7500, zar_per_hour: 38, prereq: null,
      unlockCondition: "Complete Chapter 41 · Hormuz",
      unlockCondition_fa: "فصلِ ۴۱ (هرمز) را کامل کنید",
      name_ru: "Хормуз — Рушащаяся корона",
      role_ru: "Сын Ануширвана · Жестокий царь · Ослеплён и низложен своей же знатью",
      lore_ru: "Он унаследовал самый могущественный трон Азии и потратил его, наживая врагов из всех. Знать ослепила его и посадила на трон его сына. Бахрам Чубин к тому времени уже занял трон. В Персии одновременно было три царя.",
      biography_ru: "Хормуз IV правил с 579 по 590 год н.э. — период нарастающего кризиса. Он казнил или заключал в тюрьму старших генералов и знать, включая унижение Бахрама Чубина после тактического поражения. Он был жесток к аристократии и духовенству одновременно, что является непростым достижением. Его знать в конце концов схватила его, ослепила и поставила на трон его юного сына Хосрова Парвиза. Тем временем Бахрам Чубин провозгласил себя царём. Период с тремя одновременными претендентами был коротким, но показал, что поздняя империя Сасанидов структурно неустойчива — предупреждение, которое никто не услышал.",
    },
    {
      id: "khosrow-parviz", name: "Khosrow Parviz — The Conqueror",
      name_fa: "خسرویِ پرویز — فاتح", name_tg: "Хусрави Парвез — Фотеҳ",
      type: "character", rarity: "legend", chapter: 42, emoji: "👑",
      role: "Khosrow II · The Last Great Sassanid · Conqueror of Jerusalem · Lover of Shirin',",
      role_fa: "خسروِ دوم · آخرین ساسانیِ بزرگ · فاتحِ بیت‌المقدس · عاشقِ شیرین",
      lore: "He conquered more territory than any Persian king since Darius I. He seized Jerusalem and carried the True Cross to Ctesiphon. Then Heraclius came back. Then his son killed him. Then Islam came. In thirty years the greatest empire in Asia became a ruin.",
      lore_fa: "بیشتر از هر شاهِ ایرانی از داریوشِ اول سرزمین فتح کرد. بیت‌المقدس را گرفت و صلیبِ واقعی را به تیسفون آورد. سپس هراکلیوس برگشت. سپس پسرش او را کشت. سپس اسلام آمد. در سی سال بزرگ‌ترین امپراتوری آسیا به ویرانه تبدیل شد.",
      lore_tg: "Бештар аз ҳар шоҳи Эронӣ аз Дориуши Аввал қаламрав фатҳ кард. Байтулмуқаддасро гирифт.",
      biography: "Khosrow II Parviz began brilliantly — reconquering most of the Byzantine east, seizing Egypt and Syria, reaching the walls of Constantinople. He built the famed throne room Takht-e Taqdis and owned the legendary horse Shabdiz. But the Byzantine Emperor Heraclius launched a devastating counter-campaign that penetrated deep into Persia. When Khosrow refused to make peace, his son Shiroe organized a palace coup, killed him, and negotiated with Heraclius. The empire, exhausted by decades of war, was now defenseless against the Arab armies that arrived a decade later.",
      powers: ["+14% Tap Power", "+120 Zar/hr", "Passive: Empire's Peak — REAL sink resistance: upgrade costs –8%"],
      side: "light", nftReady: false, season: 2, order: 358,
      collectionId: "S2-CH42-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 21000, zar_per_hour: 120, prereq: null,
      unlockCondition: "Complete Chapter 42 · Khosrow Parviz",
      unlockCondition_fa: "فصلِ ۴۲ (خسرویِ پرویز) را کامل کنید",
    },
    {
      id: "shirin", name: "Shirin — Queen of Love",
      name_fa: "شیرین — ملکه‌ی عشق", name_tg: "Ширин — Маликаи Ишқ",
      type: "character", rarity: "mythic", chapter: 43, emoji: "🌹",
      role: "Armenian Princess · Queen of Persia · The Woman Two Great Kings Loved and Lost',",
      role_fa: "شاهزاده‌ی ارمنی · ملکه‌ی ایران · زنی که دو شاهِ بزرگ دوستش داشتند و از دست دادند",
      lore: "Khosrow fell in love with her portrait before meeting her. She refused him until he was worthy. Farhad the stone-cutter carved a mountain for her and Khosrow had him thrown off it. She never forgave him. She killed herself on his grave.",
      lore_fa: "خسرو عاشقِ تصویرش شد پیش از اینکه ببیندش. تا شایسته نشد، ردَّش کرد. فرهادِ سنگتراش برای او کوهی را کند و خسرو او را از آن انداخت. هرگز نبخشید. روی مزارش خودکشی کرد.",
      lore_tg: "Хусрав ошиқи тасвираш шуд пеш аз он ки ӯро бубинад. То шоиста нашуд, радаш кард.",
      biography: "Shirin is the great love of Persian literature — equal parts real historical figure (a Christian queen who wielded significant power at the Sassanid court) and literary archetype. In Nezami's later telling she becomes the full symbol of the beloved who tests and refuses until worthy. In Ferdowsi's version she is the queen who outlives her king: when Khosrow Parviz was assassinated by their son Shiroe, Shirin went to view the body, spoke to it, and then stabbed herself. No one took her political power by force. She refused to yield it while living and refused to live without it.",
      powers: ["+16% Story XP", "+145 Zar/hr", "Passive: The Worthy Love — chapter quiz score required to pass reduced by 5%"],
      side: "light", nftReady: false, season: 2, order: 359,
      collectionId: "S2-CH43-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 27000, zar_per_hour: 145, prereq: null,
      unlockCondition: "Complete Chapter 43 · Shirin",
      unlockCondition_fa: "فصلِ ۴۳ (شیرین) را کامل کنید",
    },
    {
      id: "purandokht", name: "Purandokht — The Warrior Queen",
      name_fa: "پوراندخت — ملکه‌ی جنگاور", name_tg: "Пӯрондухт — Маликаи Ҷангавар",
      type: "character", rarity: "legend", chapter: 44, emoji: "⚔",
      role: "Daughter of Khosrow Parviz · First Woman to Rule Sassanid Persia',",
      role_fa: "دختر خسروی پرویز · نخستین زنی که بر ایرانِ ساسانی حکومت کرد",
      lore: "After her father's assassination, the Sassanid empire went through twelve kings in four years. She was one of two women who ruled in that chaos. She negotiated with Heraclius and returned the True Cross. She held what was left together.",
      lore_fa: "پس از ترورِ پدرش، امپراتوریِ ساسانی طیِّ چهار سال دوازده شاه دید. او یکی از دو زنی بود که در آن آشوب فرمانروایی کردند. با هراکلیوس مذاکره کرد و صلیبِ واقعی را بازگرداند. آنچه باقی مانده بود را نگه داشت.",
      lore_tg: "Пас аз қатли падараш, империяи Сосониён дар тӯли чаҳор сол дувоздаҳ шоҳ дид.",
      biography: "Purandokht ruled briefly — probably 629-630 CE — during the collapse of the Sassanid system. She was the daughter of Khosrow Parviz and sister of Shiroe, who had murdered their father. Her reign is characterized by one major diplomatic achievement: returning the True Cross to the Byzantines, ending the 26-year war that had exhausted both empires. The Arab armies would arrive within a decade. Purandokht represents the last coherent attempt to stabilize Persia before the final collapse. Her sister Azarmidokht ruled briefly after her.",
      powers: ["+11% Tap Power", "+110 Zar/hr", "Passive: Iron Diplomacy — chapter gate requirements for final 5 chapters –1"],
      side: "light", nftReady: false, season: 2, order: 360,
      collectionId: "S2-CH44-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 20000, zar_per_hour: 110, prereq: null,
      unlockCondition: "Complete Chapter 44 · The Crumbling Crown",
      unlockCondition_fa: "فصلِ ۴۴ (تاجِ فروپاشنده) را کامل کنید",
    },

    /* ═══ FALL OF PERSIA & FERDOWSI — Ch 45–50 ════════════════════════════ */
    {
      id: "yazdegerd-iii", name: "Yazdegerd III — The Last King",
      name_fa: "یزدگردِ سوم — آخرین شاه", name_tg: "Яздигирди III — Охирин Шоҳ",
      type: "character", rarity: "mythic", chapter: 45, emoji: "🌑",
      role: "Last Sassanid Emperor · Fled Across All of Persia · Died in a Miller\'s Hut',",
      role_fa: "آخرین امپراتورِ ساسانی · از سراسرِ ایران گریخت · در کلبه‌ی آسیابانی مُرد",
      lore: "He ran for sixteen years. From Ctesiphon to Isfahan to Merv, always one step ahead of the Arab armies, always hoping for a final battle that never came. He was murdered by a miller for the coins on his belt.",
      lore_fa: "شانزده سال گریخت. از تیسفون به اصفهان به مرو، همیشه یک قدم جلوتر از ارتشِ عرب، همیشه امیدوار به نبردِ نهایی‌ای که هرگز نیامد. یک آسیابان برای سکه‌های کمربندش او را کشت.",
      lore_tg: "Шонздаҳ сол гурехт. Аз Тайсафун то Исфаҳон то Марв, ҳамеша як қадам пеш аз артиши арабон.",
      biography: "Yazdegerd III came to the throne as a child during the chaos following Khosrow Parviz's murder. He was the grandson of Khosrow Parviz and the last Sassanid emperor. The Arab armies crossed the border in 633 CE. The battles of Qadisiyyah and Nahavand broke the Sassanid military permanently. Yazdegerd fled east, appealing to the Turks and Chinese for help that never came. He died in 651 CE in Merv, murdered for his possessions. The 400-year Sassanid empire was over. The Persian world would continue under Arab rule and later resurface in new forms — but the fire-worshipping empire of Ardeshir and Anushirvan was extinguished.",
      powers: ["+14% Story XP", "+155 Zar/hr", "Passive: The Last Fire — Zar from all sources +20% for 24h after chapter completion"],
      side: "light", nftReady: false, season: 2, order: 370,
      collectionId: "S2-CH45-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 29000, zar_per_hour: 155, prereq: null,
      unlockCondition: "Complete Chapter 45 · Yazdegerd III",
      unlockCondition_fa: "فصلِ ۴۵ (یزدگردِ سوم) را کامل کنید",
    },
    {
      id: "rustam-farrokhzad", name: "Rustam Farrokhzad — The Last Wall",
      name_fa: "رستمِ فرخزاد — آخرین دیوار", name_tg: "Рустами Фаррухзод — Охирин Девор",
      type: "character", rarity: "mythic", chapter: 46, emoji: "🔥",
      role: "Sassanid Commander at Qadisiyyah · Died Defending Persia · The Last General',",
      role_fa: "فرمانده‌ی ساسانی در قادسیه · کشته شد در دفاع از ایران · آخرین سردار",
      lore: "He wrote a letter to his brother warning that Islam would change the world and that he did not expect to survive the battle. He was right on both counts. At Qadisiyyah, on the third day, he was killed. Iran's last army broke behind him.",
      lore_fa: "نامه‌ای به برادرش نوشت و هشدار داد که اسلام جهان را تغییر خواهد داد و انتظار ندارد از نبرد جان سالم به در برد. در هر دو مورد درست می‌گفت. در قادسیه، روزِ سوم، کشته شد. آخرین ارتشِ ایران پشتِ سرش از هم پاشید.",
      lore_tg: "Номае ба бародараш навишт ва огоҳ дод ки ислом ҷаҳонро тағйир хоҳад дод.",
      biography: "Rustam Farrokhzad was the Spahbod (supreme commander) of the Sassanid army at the battle of Qadisiyyah in 636 CE — the decisive battle of the Arab conquest of Persia. He commanded an army with war elephants against a smaller but more motivated Arab force under Sa'd ibn Abi Waqqas. The battle lasted three to four days. On the final day, Rustam Farrokhzad was killed — some accounts say by Hilal ibn Ullafa, others by Sa'd himself. His death broke the Sassanid line. The name Rustam — the same as the great Shahnameh hero — makes his death feel like the Shahnameh ending itself.",
      powers: ["+16% Tap Power", "+165 Zar/hr", "Passive: The Final Stand — owned_heroes count: each card counts double for ch46+ gates"],
      side: "light", nftReady: false, season: 2, order: 371,
      collectionId: "S2-CH46-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 32000, zar_per_hour: 165, prereq: null,
      unlockCondition: "Complete Chapter 46 · The Arab Conquest",
      unlockCondition_fa: "فصلِ ۴۶ (فتحِ عرب) را کامل کنید",
    },
    {
      id: "piruz-resistance", name: "Piruz — The Undying Resistance",
      name_fa: "پیروز — مقاومتِ جاودان", name_tg: "Пируз — Муқовимати Ҷовидон",
      type: "character", rarity: "legend", chapter: 47, emoji: "🌑",
      role: "Son of Yazdegerd III · Led the Persian Resistance · The Flame That Would Not Die',",
      role_fa: "پسرِ یزدگردِ سوم · مقاومتِ ایرانی را رهبری کرد · شعله‌ای که خاموش نمی‌شد",
      lore: "After his father died, Piruz took the resistance east to Khorasan and then to China. The Tang Dynasty received him. The flame of Sassanid legitimacy burned in exile for decades before it finally died. But fire is hard to kill.",
      lore_fa: "پس از مرگِ پدرش، پیروز مقاومت را به شرق — به خراسان و سپس به چین — برد. سلسله‌ی تانگ او را پذیرفت. شعله‌ی مشروعیتِ ساسانی دهه‌ها در تبعید سوخت پیش از آنکه سرانجام خاموش شود. اما آتش کشتنش سخت است.",
      lore_tg: "Пас аз марги падараш, Пируз муқовиматро ба шарқ — ба Хуросон ва сипас ба Чин — бурд.",
      biography: "Piruz (Peroz in some transliterations) was the son of Yazdegerd III who fled east following his father's murder. He reached Khorasan and tried to organize resistance with Turkic allies. When that failed, he traveled to the Tang court in China, where the Emperor Gaozong gave him a position and title. Piruz represented the continuation of Sassanid legitimacy in exile. His son Narsieh also lived in China. The line eventually disappeared into Chinese history. The Shahnameh tells the story of the mourning of Pars — the grief of the land itself at what was lost.",
      powers: ["+12% Story XP", "+125 Zar/hr", "Passive: Exile's Flame — offline Zar income +15% after 8h"],
      side: "light", nftReady: false, season: 2, order: 372,
      collectionId: "S2-CH47-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 22000, zar_per_hour: 125, prereq: null,
      unlockCondition: "Complete Chapter 47 · The Mourning of Pars",
      unlockCondition_fa: "فصلِ ۴۷ (عزایِ پارس) را کامل کنید",
    },
    {
      id: "ferdowsi-writing", name: "Ferdowsi — The Poem Against Forgetting",
      name_fa: "فردوسی — شعر علیهِ فراموشی", name_tg: "Фирдавсӣ — Шеър Зидди Фаромӯшӣ",
      type: "character", rarity: "legend", chapter: 48, emoji: "🪶",
      role: "Abu\'l-Qasim Ferdowsi · Poet of Tus · 35 Years at the Quill',",
      role_fa: "ابوالقاسم فردوسی · شاعرِ طوس · ۳۵ سال با قلم",
      lore: "He was over sixty when he finished it. He had watched the Persian world change around him for decades. He wrote the Shahnameh not because anyone asked him to, but because the language needed defending and he was the one who could do it.",
      lore_fa: "وقتی تمامش کرد بیش از شصت سال داشت. دهه‌ها دیده بود که جهانِ ایرانی اطرافش تغییر می‌کند. شاهنامه را ننوشت چون کسی خواسته بود، بلکه چون زبان نیاز به دفاع داشت و او کسی بود که می‌توانست.",
      lore_tg: "Вақте тамомаш кард аз шаст гузашта буд. Даҳҳо сол дида буд ки ҷаҳони Эронӣ дар атрофаш тағйир мекунад.",
      biography: "Abu'l-Qasim Ferdowsi Tusi (940-1020 CE) spent approximately 35 years composing the Shahnameh. He was a landowner in the village of Tabaran, near Tus in Khorasan, who used his own resources to support the writing when no patronage was secure. The Shahnameh was not commissioned by Sultan Mahmud — Ferdowsi had been working on it for decades before the Sultan's court took interest. The poem preserves approximately 1,000 years of Persian mythological and historical tradition in approximately 60,000 couplets. Without it, the pre-Islamic history of Iran would exist only in fragments.",
      powers: ["+18% Story XP", "+130 Zar/hr", "Passive: Memory Against Time — quiz knowledge score +20% for airdrop"],
      side: "light", nftReady: false, season: 2, order: 373,
      collectionId: "S2-CH48-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 24000, zar_per_hour: 130, prereq: null,
      unlockCondition: "Complete Chapter 48 · Memory Over Sword",
      unlockCondition_fa: "فصلِ ۴۸ (حافظه بر شمشیر) را کامل کنید",
    },
    {
      id: "ferdowsi-complete", name: "Ferdowsi — The Poem Is Finished",
      name_fa: "فردوسی — شعر تمام شد", name_tg: "Фирдавсӣ — Шеър Тамом Шуд",
      type: "character", rarity: "mythic", chapter: 49, emoji: "📖",
      role: "Ferdowsi at Completion · 60,000 Couplets Written · The Language Saved',",
      role_fa: "فردوسی در لحظه‌ی اتمام · ۶۰,۰۰۰ بیت نوشته شده · زبان نجات یافت",
      lore: "Around 1010 CE, in Tus. The last couplet was written. Ferdowsi set down his quill. He had done something that had never been done. The Persian language now had armor that no conquest could remove.",
      lore_fa: "حدودِ ۱۰۱۰ م، در طوس. آخرین بیت نوشته شد. فردوسی قلمش را گذاشت. کاری کرده بود که هرگز انجام نشده بود. زبانِ فارسی حالا زرهی داشت که هیچ فتحی نمی‌توانست از تن در بیاورد.",
      lore_tg: "Тақрибан соли 1010 м, дар Тус. Охирин байт навишта шуд. Фирдавсӣ қаламашро гузошт.",
      biography: "When Ferdowsi completed the Shahnameh around 1010 CE, he was approximately 70 years old. He had outlived his son, seen his land income decline, and watched the cultural landscape of Khorasan become increasingly Arabized. The Shahnameh was the answer he had spent his life writing. Sultan Mahmud's reception was reportedly cold — silver coins instead of gold, a deliberate humiliation. Ferdowsi is said to have distributed the silver to a bathhouse keeper and fled, and then written a devastating satire of the Sultan. He died around 1020 CE in Tus, never seeing his vindication. Within a century the Shahnameh was recognized as the greatest work in Persian literature.",
      powers: ["+22% Story XP", "+175 Zar/hr", "Passive: The Chronicle Lives — all passive Zar/hr from all owned cards +25%"],
      side: "light", nftReady: false, season: 2, order: 374,
      collectionId: "S2-CH49-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 38000, zar_per_hour: 175, prereq: null,
      unlockCondition: "Complete Chapter 49 · Ferdowsi's Legacy",
      unlockCondition_fa: "فصلِ ۴۹ (میراثِ فردوسی) را کامل کنید",
    },
    {
      id: "farr-of-iran", name: "The Farr of Iran — Eternal",
      name_fa: "فرِّ ایران — جاودان", name_tg: "Фарри Эрон — Ҷовидон",
      type: "artifact", rarity: "mythic", chapter: 50, emoji: "✦",
      role: "Divine Glory of Iran · The Farr That Survived Every Conquest',",
      role_fa: "فرِّ الهیِ ایران · فرّی که از هر فتحی جان سالم به در برد",
      lore: "It left Jamshid when he grew arrogant. It blessed Fereydun. It chose Kay Khosrow and left with him into the mountain. It lived in the language of the poem. Every chapter you have read is a fragment of it.",
      lore_fa: "از جمشید رفت وقتی مغرور شد. فریدون را برکت داد. کیخسرو را برگزید و با او در کوه ناپدید شد. در زبانِ شعر زندگی کرد. هر فصلی که خوانده‌ای تکه‌ای از آن است.",
      lore_tg: "Аз Ҷамшед рафт вақте мағрур шуд. Фаридунро баракат дод. Кайхусравро баргузид ва бо ӯ дар кӯҳ ноподид шуд.",
      biography: "The Farr (Khvarenah in Avestan) is the divine royal glory of the Shahnameh — the luminous force that grants legitimacy to kings, enables their victories, and abandons them when they betray their purpose. It is not given. It is not inherited. It chooses. When a king grows arrogant or unjust, the Farr departs and he falls. The whole arc of the Shahnameh is the story of where the Farr goes and why. Ferdowsi channeled it into the poem. The poem is now what carries it. This card is awarded to those who complete the journey.",
      powers: ["+25% Story XP", "+200 Zar/hr", "Passive: Eternal Farr — all Farr income doubled · Airdrop score maximum bonus"],
      side: "light", nftReady: false, season: 2, order: 375,
      collectionId: "S2-CH50-001",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" },
      cost: 40000, zar_per_hour: 200, prereq: null,
      unlockCondition: "Complete Chapter 50 · Ages End · The Final Chapter",
      unlockCondition_fa: "فصلِ ۵۰ (پایانِ عصرها) را کامل کنید · فصلِ نهایی",
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

    const total      = COLLECTION.length;
    const discovered = Object.keys(ownedHeroes).length;
    const pct        = Math.round((Math.min(discovered, total) / total) * 100);

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
    /* artifact_poet items unlock by prereq chain only — skip chapter gate */
    if (item.type !== "artifact_poet" && !isChapterDone(item.chapter)) return "locked";
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
  let currentHkHero = "rostam"; // tracks which sub-tab is active

  const KHAN_STORIES = [
    "Rostam slept in the reeds. A lion came. Rakhsh fought alone and killed it without waking his master. The first labour was the horse's victory.",
    "A waterless desert nearly killed them. Rostam prayed. A mystical ram appeared and led them to a hidden spring. Divine mercy arrives when earned.",
    "A dragon attacked three nights in a row, vanishing each time Rakhsh woke Rostam — who grew angry at the horse. The third night, Rostam finally saw the dragon. The horse had been right all along.",
    "A feast table appeared in the wilderness. A beautiful woman offered wine. When Rostam spoke God's name, she became a hideous witch. He killed her with his lasso. The lute exposed the illusion.",
    "Awlad the warden attacked Rostam with his men and lost. Rostam captured him and made a promise: guide me faithfully, and I will make you king. The enemy became the key.",
    "At the gates of Mazandaran, Rostam stormed Arzhang Div's tent, seized him, and threw his severed head among the demon army. The army broke. The path to Kay Kavus opened.",
    "In the dark cave at Mazandaran's heart, Rostam wrestled the White Demon — enormous, pale as iron. Their battle shook the mountain. Rostam tore out his liver. Its blood, dripped into blind eyes, gave back sight. The seventh labour was a cure.",
  ];

  const KHAN_ESP_STORIES = [
    "Two ferocious wolves blocked the road to Turan. Esfandiyar shot them both with his bow. The first labour was won by precision — the wolf's charge is fastest when it thinks you are afraid.",
    "Two lions stood guard at the second stage. Esfandiyar dismounted and fought them by hand. The second labour rewarded directness — he stood in the path and refused to move.",
    "A great dragon came at the third stage. Esfandiyar had built a chariot fitted with long blades pointing outward. He drove it into the dragon's open jaws. The beast destroyed itself swallowing the blades. The third labour was won before it began.",
    "A sorceress appeared as a beautiful woman and set a feast. When Esfandiyar spoke the name of God, she was revealed in her true form. He killed her. The fourth labour taught: the beautiful trap is the most dangerous kind.",
    "The fifth labour set a great Simorgh against him — not the gentle guardian who raised Zal, but its dark reflection. Esfandiyar shot it from the sky. Even the most sacred symbols have shadow forms that must be faced.",
    "No enemy came at the sixth stage — only the sky. A blizzard of such force it buried soldiers alive descended on the army. There was nothing to defeat with a sword. Esfandiyar led his army through by will alone.",
    "At the end of the seven labours stood Ruyeen-Dej — the Brass Fortress, impenetrable by force. His sisters Humay and Hamaspand were held inside. Esfandiyar crossed six labours by sword. He crossed the seventh as a merchant. The brass walls fell without a blow.",
  ];

  const buildHaftKhanView = (hero) => {
    if (hero) currentHkHero = hero;
    const isEsp = currentHkHero === "esfandiyar";

    const view = document.getElementById("haft-khan-view");
    const grid = document.getElementById("coll-grid");
    if (!view) return;

    grid.style.display = "none";
    view.style.display = "block";
    view.innerHTML = "";

    const khans = isEsp
      ? COLLECTION.filter(i => i.haft_khan_esp).sort((a, b) => a.haft_khan_esp_order - b.haft_khan_esp_order)
      : COLLECTION.filter(i => i.haft_khan).sort((a, b) => a.haft_khan_order - b.haft_khan_order);

    const ownedCount = khans.filter(k => ownedHeroes[k.id]).length;
    const pips = khans.map((k, i) => {
      const owned = ownedHeroes[k.id];
      const cls = owned ? "hk-pip done" : (i === ownedCount ? "hk-pip active" : "hk-pip");
      return `<div class="${cls}"></div>`;
    }).join("");

    const bannerKicker = isEsp ? "🏹 Haft Khan-e Esfandiyar" : "⚔ Haft Khan-e Rostam";
    const bannerTitle  = isEsp ? "هفت خوان اسفندیار" : "هفت خوان رستم";
    const bannerSub    = isEsp
      ? "Read each labour's story · Unlock the card with REAL · Upgrade with ZAR for passive mining. All seven labours end at the Brass Fortress."
      : "Read each labour's story · Unlock the card with REAL · Upgrade with ZAR for passive mining. Complete all seven to earn the chronicle's highest ROI.";
    const stories = isEsp ? KHAN_ESP_STORIES : KHAN_STORIES;

    view.innerHTML = `
      <div class="hk-hero-tabs">
        <button class="hk-hero-tab${!isEsp ? " active" : ""}" data-hk-hero="rostam">⚔ هفت خوان رستم</button>
        <button class="hk-hero-tab${isEsp ? " active" : ""}" data-hk-hero="esfandiyar">🏹 هفت خوان اسفندیار</button>
      </div>
      <article class="hk-banner">
        <div class="hk-banner-kicker">${bannerKicker}</div>
        <div class="hk-banner-title">${bannerTitle}</div>
        <div class="hk-banner-sub">${bannerSub}</div>
        <div class="hk-progress">${pips}</div>
      </article>
      <div id="hk-steps"></div>`;

    /* Wire sub-tab clicks */
    view.querySelectorAll("[data-hk-hero]").forEach(btn => {
      btn.addEventListener("click", () => buildHaftKhanView(btn.dataset.hkHero));
    });

    const stepsEl = view.querySelector("#hk-steps");
    khans.forEach((item) => {
      const order  = item.haft_khan_order || item.haft_khan_esp_order;
      const state  = heroEconomyState(item);
      const owned  = ownedHeroes[item.id];
      const lvl    = owned ? (owned.level || 1) : 0;
      const zarHr  = owned ? (owned.zar_per_hour || 0) : item.zar_per_hour;
      const cost   = item.cost || 25000;
      const stateClass = state === "owned" ? "hk-owned" : state === "available" ? "hk-available" : "hk-locked";

      let badge = "";
      if (state === "owned")          badge = `<span class="hk-step-badge hk-badge-owned">Lv.${lvl} · ${fmtN(zarHr)} ZAR/hr</span>`;
      else if (state === "available") badge = `<span class="hk-step-badge hk-badge-available">${fmtN(cost)} ${t("currency_name", "REAL")}</span>`;
      else                            badge = `<span class="hk-step-badge hk-badge-locked">🔒</span>`;

      const story    = stories[order - 1] || "";
      const itemName = locF(item, "name") || item.name;
      const upgCost  = cost * Math.max(1, lvl);

      let econHtml = "";
      if (state === "available") {
        econHtml = `
          <div class="hk-econ">
            <div class="hk-zar-stat">🪙 ${fmtN(zarHr)} ZAR/hr at Lv.1</div>
            <button class="hk-buy-btn" data-hk-buy="${item.id}" data-cost="${cost}">
              ${RT} ${fmtN(cost)} — ${t("hero_buy_cta_label", "Buy Hero")}
            </button>
          </div>`;
      } else if (state === "owned") {
        const nextZar = (item.zar_per_hour || 50) + 50 * order;
        econHtml = `
          <div class="hk-econ">
            <div class="hk-zar-stat">🪙 +${fmtN(zarHr)} ZAR/hr now</div>
            <button class="hk-upg-btn" data-hk-upgrade="${item.id}" data-cost="${upgCost}" data-next-zar="${nextZar}">
              ↑ Lv.${lvl + 1} · +${fmtN(50 * order)}/hr · ${fmtN(upgCost)} ${t("currency_name", "REAL")}
            </button>
          </div>`;
      }

      const step = document.createElement("article");
      step.className = `hk-step ${stateClass}`;
      step.dataset.heroId = item.id;
      step.innerHTML = `
        <div class="hk-step-head">
          <div class="hk-num">${order}</div>
          <div class="hk-step-info">
            <div class="hk-step-title">${itemName}</div>
            <div class="hk-step-sub">${locF(item, "role") || item.role}</div>
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
        buildHaftKhanView();
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
    const baseZar = item.zar_per_hour || RARITY_ZAR[item.rarity] || 0;

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

  /* ── Update stats strip + chapter banner from real ownership data ── */
  const updateStatsStrip = () => {
    const ownedIds   = Object.keys(ownedHeroes);
    const ownedCount = ownedIds.length;
    const total      = COLLECTION.length;

    /* 1. Discovered / Locked counts */
    const discVal = document.querySelector(".css-cell:first-child .css-val");
    const lockVal = document.querySelector(".css-cell:nth-child(2) .css-val");
    if (discVal) discVal.textContent = ownedCount;
    if (lockVal) lockVal.textContent = total - ownedCount;

    /* 2. Current story chapter — from localStorage, same logic as profile.js */
    const storyCh = currentStoryChapter();
    const chVal = document.querySelector(".css-cell:nth-child(3) .css-val");
    if (chVal) chVal.textContent = storyCh;

    /* 3. Avg Rarity — dominant rarity among owned cards */
    const RARITY_RANK = { common: 1, rare: 2, epic: 3, legend: 4, mythic: 5 };
    const RARITY_LABEL = { common: "Common", rare: "Rare", epic: "Epic", legend: "Legend", mythic: "Mythic" };
    let totalRank = 0;
    ownedIds.forEach(id => {
      const item = COLLECTION.find(c => c.id === id);
      if (item) totalRank += RARITY_RANK[item.rarity] || 1;
    });
    const avgRank = ownedCount > 0 ? totalRank / ownedCount : 1;
    const avgRarity = avgRank >= 4.5 ? "mythic" : avgRank >= 3.5 ? "legend" : avgRank >= 2.5 ? "epic" : avgRank >= 1.5 ? "rare" : "common";
    const rarityVal = document.querySelector(".css-cell:nth-child(4) .css-val");
    if (rarityVal) {
      rarityVal.textContent = RARITY_LABEL[avgRarity] || "Rare";
      rarityVal.className = "css-val" + (avgRarity !== "common" ? " gold" : "");
    }

    /* 4. Progress bar */
    const countEl = document.querySelector("#coll-progress .coll-ph-left");
    const fillEl  = document.querySelector("#coll-progress .coll-progress-fill");
    const pct     = Math.round((ownedCount / total) * 100);
    if (countEl) countEl.innerHTML = `<strong>${ownedCount}</strong> <span>of ${total} discovered</span>`;
    if (fillEl)  fillEl.style.width = `${pct}%`;

    /* 5. Chapter banner — show user's actual story progress from localStorage */
    const bannerTitle  = document.querySelector(".cb-title");
    const bannerSub    = document.querySelector(".cb-sub");
    const bannerKicker = document.querySelector(".cb-kicker");
    const headerPill   = document.querySelector(".page-head .pill");
    const chName = t(`story_ch_${storyCh}`) !== `story_ch_${storyCh}` ? t(`story_ch_${storyCh}`) : (STORY_NAME[storyCh] || `Chapter ${storyCh}`);
    const chSlugStr = (STORY_SLUGS[storyCh - 1] || "").replace(/-/g, " ");
    if (bannerKicker) bannerKicker.textContent = storyCh > 1 ? "Chronicle Progress" : "Begin Your Journey";
    if (bannerTitle)  bannerTitle.textContent  = `Chapter ${storyCh} — ${chName}`;
    if (bannerSub)    bannerSub.textContent    = `${ownedCount} card${ownedCount !== 1 ? "s" : ""} collected · ${chSlugStr} era`;
    if (headerPill)   headerPill.textContent   = `S2 · Ch.${storyCh}`;
  };

  const _doOpenCertificate = (item, backdrop, modal) => {
    /* Record first discovery */
    trackDiscovery(item.id);
    const discoveredDate = getDiscoveryDate(item.id);
    const meta = item.tonMetadata || {};

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
            <span class="cmr-val mono">${meta.standard || "TEP-62"}</span>
          </div>
          <div class="cert-meta-row">
            <span class="cmr-key">${t("cert_artwork_lbl")}</span>
            <span class="cmr-val">v${meta.artworkVersion || "1.0"}</span>
          </div>
          <div class="cert-meta-row">
            <span class="cmr-key">${t("cert_mint_lbl")}</span>
            <span class="cmr-val">${(meta.mintStatus || "pending") === "pending" ? t("cert_mint_pending") : t("cert_mint_done")}</span>
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

    /* Auto-open a specific hero card when ?open=slug is in the URL
       (e.g. navigated from the Hero Spotlight on the home page) */
    const autoOpenSlug = new URLSearchParams(location.search).get('open');
    if (autoOpenSlug) {
      const item = COLLECTION.find(c => c.id === autoOpenSlug || c.slug === autoOpenSlug);
      if (item) {
        // Wait one tick so cards are rendered, then open
        setTimeout(() => openCertificate(item), 50);
      }
      // Clean the URL so a back-navigate doesn't re-open
      history.replaceState(null, '', location.pathname);
    }

    /* After user sync completes, refresh from server */
    if (window.RealSync) {
      window.RealSync.ready().then(async () => {
        const fresh = await window.RealSync.syncHeroes();
        ownedHeroes = fresh;
        saveZarHr();
        buildProgressSection();
        updateStatsStrip();
        buildCards(
          document.querySelector("[data-filter].active")?.getAttribute("data-filter") || "all"
        );
        // Re-open if sync delayed the card build
        if (autoOpenSlug && !document.getElementById("cert-backdrop")?.classList.contains("open")) {
          const item = COLLECTION.find(c => c.id === autoOpenSlug || c.slug === autoOpenSlug);
          if (item) openCertificate(item);
        }
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
