/* ==========================================================================
   REAL Shahnameh — Heroes / Collection page
   heroes.js — premium collectible codex, certificate modal, particles
   ========================================================================== */
(() => {
  "use strict";

  const t = (k, v) => (window.RealI18N && window.RealI18N.t(k, v)) || k;
  const locF = (obj, field) => (window.RealI18N && window.RealI18N.locField)
    ? window.RealI18N.locField(obj, field) : (obj && obj[field] != null ? obj[field] : "");

  /* =========================================================
     COLLECTION DATA — Chapter 1 (10 items)
     ========================================================= */
  const COLLECTION = [
    {
      id: "keyumars",
      name: "Keyumars",
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
      season: 2,
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
      id: "siamak",
      name: "Siamak",
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
      season: 2,
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
      name: "Hushang",
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
      season: 2,
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
      name: "Ahriman",
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
      season: 2,
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
      name: "Black Div",
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
      season: 2,
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
      name: "Mount Damavand",
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
      season: 2,
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
      name: "Royal Court",
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
      season: 2,
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
      name: "Ancient Pars",
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
      season: 2,
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
      name: "Demon Forest",
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
      season: 2,
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
      name: "Farr — Divine Light",
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
      season: 2,
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
    }
  ];

  /* Locked mystery teasers — no real names, no spoilers */
  const LOCKED_PREVIEWS = [
    { id: "locked-ch2-a", rarity: "epic",   type: "character", emoji: "⚔", chapter: 2, label: "Unknown Warrior",  hint: "Unlocks in Chapter 2" },
    { id: "locked-ch2-b", rarity: "rare",   type: "place",     emoji: "🏰", chapter: 2, label: "Hidden Realm",    hint: "Unlocks in Chapter 2" },
    { id: "locked-ch3-a", rarity: "legend", type: "character", emoji: "👤", chapter: 3, label: "Ancient King",    hint: "Unlocks in Chapter 3" },
    { id: "locked-ch4-a", rarity: "mythic", type: "character", emoji: "❓", chapter: 4, label: "Legendary Hero",  hint: "Unlocks in Chapter 4" }
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
  const buildCards = (filter) => {
    const grid = document.getElementById("coll-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const items = filter === "all"
      ? COLLECTION
      : COLLECTION.filter((it) => it.type === filter);

    if (!items.length) {
      const empty = document.createElement("p");
      empty.style.cssText = "grid-column:1/-1;text-align:center;color:var(--muted);padding:28px 0;font-size:13px;";
      empty.textContent = t("coll_no_items");
      grid.appendChild(empty);
    } else {
      items.forEach((item) => {
        const card = document.createElement("button");
        card.className = `coll-card r-${item.rarity}`;
        card.setAttribute("aria-label", `View ${item.name} certificate`);

        let imgHTML = item.img
          ? `<img src="${item.img}" alt="${item.name}" loading="lazy"
              onerror="this.style.display='none';this.parentNode.querySelector('.coll-emoji').style.display='flex'">
             <span class="coll-emoji" style="display:none;">${item.emoji || "?"}</span>`
          : `<span class="coll-emoji">${item.emoji || "?"}</span>`;

        card.innerHTML = `
          <div class="coll-portrait">
            ${imgHTML}
            <span class="coll-type-chip">${typeLabel(item.type)}</span>
            <span class="coll-chapter-dot">Ch${item.chapter}</span>
          </div>
          <div class="coll-info">
            <div class="coll-name">${item.name}</div>
            <div class="coll-rarity">${rarityLabel(item.rarity)}</div>
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
      <img class="clc-thumb" src="/season2/uploads/chapters/hushang.png" alt=""
        onerror="this.outerHTML='<div class=clc-thumb-fallback>🏰</div>'">
    `;
    grid.appendChild(row);
  };

  /* =========================================================
     CERTIFICATE MODAL
     ========================================================= */
  const openCertificate = (item) => {
    const backdrop = document.getElementById("cert-backdrop");
    const modal    = document.getElementById("cert-modal");
    if (!backdrop || !modal) return;

    /* Record first discovery */
    trackDiscovery(item.id);
    const discoveredDate = getDiscoveryDate(item.id);

    let portraitInner = item.img
      ? `<img src="${item.img}" alt="${item.name}"
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

      <div class="cert-portrait-panel" data-fullscreen-src="${item.img || ""}" data-fullscreen-alt="${item.name}">
        ${portraitInner}
        <span class="cert-zoom-hint">${t("cert_zoom_hint")}</span>
        <span class="cert-type-badge t-${item.type}">${typeLabel(item.type)}</span>
        <button class="cert-close" id="cert-close-btn" aria-label="Close">✕</button>
      </div>

      <div class="cert-scroll">
        <div class="cert-watermark">${t("cert_watermark")}</div>

        <div class="cert-name-row">
          <h2 class="cert-name">${item.name}</h2>
          <span class="cert-rarity-pill r-${item.rarity}">${rarityLabel(item.rarity)}</span>
        </div>

        <div class="cert-role">${locF(item, "role")}</div>

        <div class="cert-tags">
          <span class="cert-tag era">Season ${item.season} · Ch.${item.chapter}</span>
          <span class="cert-tag season">◆ REAL Collection</span>
          ${sideTag}
        </div>

        <p class="cert-lore-excerpt">${locF(item, "lore")}</p>

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
    if (navigator.vibrate) navigator.vibrate([6, 2, 4]);

    /* Bind close */
    document.getElementById("cert-close-btn")
      ?.addEventListener("click", closeCertificate);

    /* Portrait → fullscreen */
    const portraitPanel = modal.querySelector(".cert-portrait-panel");
    if (portraitPanel) {
      portraitPanel.addEventListener("click", () => {
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
  const init = () => {
    buildProgressSection();
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
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
