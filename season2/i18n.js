/* ==========================================================================
   REAL Shahnameh — Extended Localization System
   i18n.js — comprehensive FA/EN dictionary + Persian digit formatting
   Loaded after app.js; provides window.RealI18N for all pages and JS modules.
   ========================================================================== */
(() => {
  "use strict";

  const LANG_LS = "real_lang";
  const getLang = () => { try { return localStorage.getItem(LANG_LS) || "en"; } catch { return "en"; } };

  /* ---- Persian digit tables ---- */
  const FA_DIGITS = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
  const toPersianDigits = (str) => String(str).replace(/[0-9]/g, (d) => FA_DIGITS[+d]);

  const formatNumber = (n) => {
    const s = Number(n).toLocaleString("en-US");
    return getLang() === "fa" ? toPersianDigits(s) : s;
  };
  const formatPercent = (n) => {
    const s = `${n}%`;
    return getLang() === "fa" ? toPersianDigits(s) : s;
  };

  /* =========================================================
     COMPREHENSIVE STRING DICTIONARY
     (supplements app.js's existing 122-key FA dict)
     ========================================================= */
  const STRINGS = {

    /* ── ENGLISH ─────────────────────────────────────────── */
    en: {
      /* Nav */
      home: "Home", tap: "Tap", heroes: "Heroes",
      learn: "Learn", earn: "Earn", social: "Social",

      /* Common */
      season2: "Season 2", season2_pill: "S2 · Ch.1",
      continue_journey: "Continue Journey",
      daily_quests: "Daily Quests", your_real: "Your REAL",
      hero_spotlight: "Hero Spotlight", explore: "Explore",
      resets_midnight: "Resets midnight",
      apply: "Apply", full: "Full", close: "Close",
      watch_ad: "Watch ad", claim: "Claim ›",

      /* Tap page */
      mining_title: "REAL Mining",
      tap_subtitle: "Tap · Earn · Claim",
      balance: "Balance", real_per_hr: "REAL / hr", streak: "Streak",
      auto_mining_income: "Auto-mining income",
      minting_core_label: "⬡ Minting Core — Tap to Create REAL",
      energy: "Energy",
      tap_hint: "Each tap creates new REAL tokens · combo multiplies your yield",
      combo_multiplier: "Combo Multiplier",
      streak_label: "Daily streak",
      streak_val: "🔥 12 days",
      refill: "Refill",
      refill_copy: "Restore 500 energy instantly. Watch an ad.",
      watch_ad_energy: "Watch ad",
      tap_skins_title: "⬡ Tap Skins",
      skins_sub: "Earn through chapters · Buy with REAL · Win in events & airdrops",
      market_title: "◆ REAL Market",
      market_powered: "powered by TON",
      market_price_lbl: "REAL Price",
      market_7d: "7 Day",
      market_status_conn: "● connecting",
      market_liq: "Liquidity",
      market_trust: "Trust Score",
      market_holders: "Holders",
      market_contract: "Contract",
      market_copy_btn: "Copy",
      market_dyor: "View on DYOR ↗",
      market_tonviewer: "Tonviewer ↗",
      market_note: "Connecting to TON market data…",
      recent_mining: "Recent mining",
      tap_burst_evt: "Tap burst · ×1.4 combo",
      crit_hit_evt: "Critical hit!",
      auto_claim_evt: "Auto-claim · 1 hr",
      boost_activated_evt: "Boost activated",
      gain_power: "+3× power",

      /* Learn page */
      chronicle_progress: "Chronicle progress",
      chapters_done_label: "2 of 12 chapters complete",
      day_of_journey: "Day 1 of your 9-month journey",
      hero_fragments: "Hero fragments",
      boost_drops: "Boost drops",
      chronicle: "Chronicle",
      chronological: "Chronological",
      chapter_completed: "Completed",
      chapter_active: "Active chapter",
      chapter_locked: "Locked",
      final_boss_chip: "Final boss",
      modal_sub: "Read the cinematic and answer to claim rewards.",
      modal_continue: "Continue",
      modal_close: "Close",

      /* Chapter titles */
      ch1_title: "Keyumars — The First King",
      ch1_copy: "The dawn of mankind. Keyumars rules from the mountain, clad in leopard skin, and the world learns awe.",
      ch2_title: "Hushang — The Spark of Fire",
      ch2_copy: "Hushang strikes flint against serpent and wakes the eternal flame. Sade is born.",
      ch3_title: "Tahmuras — Binder of Demons",
      ch3_copy: "The Div-band rides through smoke and chains the demons. The arts of writing are won.",
      ch4_title: "Jamshid — The Golden Throne",
      ch4_copy: "A kingdom of seven crafts and crystal cups — until pride outshines the sun.",
      ch5_title: "Zahhak — The Serpent King",
      ch5_copy: "A thousand years of darkness coils on the king's shoulders. Brains are the price of bread.",
      ch6_title: "Fereydun — The Liberator",
      ch6_copy: "A blacksmith's apron becomes a banner. The mace of bull-head ends a tyrant.",
      ch7_title: "Zal — The Albino Prince",
      ch7_copy: "Cast to the mountain, raised by Simorgh, returned to a kingdom that once feared him.",
      ch8_title: "Rostam — Pahlavan of the Age",
      ch8_copy: "Seven labours, one Rakhsh, no equal under the sky.",
      ch9_title: "Sohrab — Son of the Storm",
      ch9_copy: "Two armies, two hearts, a single tragic blade.",
      ch10_title: "Esfandiyar — The Brazen-Bodied",
      ch10_copy: "Invulnerable, except where his eyes can be reached.",
      ch11_title: "Simorgh — The Phoenix Council",
      ch11_copy: "Wings the colour of the sun. Wisdom older than language.",
      ch12_title: "The Final War — Ages End",
      ch12_copy: "The chronicle closes where it began: with fire, with iron, with kings.",

      /* Chapter rewards */
      xp_200: "⭐ 200 XP claimed",
      xp_250: "⭐ 250 XP claimed",
      xp_300: "⭐ 300 XP · 🪙 120 REAL",
      xp_350: "⭐ 350 XP · 🪙 150 REAL",
      xp_400: "⭐ 400 XP · 🐍 Hero fragment",
      xp_450: "⭐ 450 XP · 🪙 200 REAL",
      xp_500: "⭐ 500 XP · 🪶 Simorgh feather",
      xp_600: "⭐ 600 XP · ⚔ Rostam shard",
      xp_650: "⭐ 650 XP · 🪙 280 REAL",
      xp_700: "⭐ 700 XP · 🪙 320 REAL",
      xp_800: "⭐ 800 XP · 🪶 Mythic feather",
      xp_1500: "⭐ 1500 XP · 🏆 Founder badge",

      /* Earn page */
      watch_earn: "Watch & Earn",
      ad_remaining: "5 / 5 today",
      ad_energy_h: "+25 Energy",
      ad_energy_copy: "Top up your energy to keep tapping.",
      ad_energy_btn: "Watch ad · +25 ⚡",
      ad_gems_h: "+10 Gems",
      ad_gems_copy: "Stockpile gems for hero upgrades.",
      ad_gems_btn: "Watch ad · +10 💎",
      ad_real_h: "+100 REAL",
      ad_real_copy: "Quick boost to your balance. Daily limit applies.",
      ad_real_btn: "Watch ad · +100 REAL",
      invite_3_h: "Invite 3 friends",
      invite_3_copy: "3 / 3 — Reward chest claimed.",
      invite_10_h: "Invite 10 friends",
      invite_10_copy: "7 / 10 — Rare hero awaiting.",
      invite_25_h: "Invite 25 friends",
      invite_25_copy: "7 / 25 — Airdrop access unlocks.",
      invite_100_h: "Invite 100 friends",
      invite_100_copy: "7 / 100 — Founder badge + mythic frame.",
      reward_chest: "🎁 Chest",
      reward_rare_hero: "⚔ Rare hero",
      reward_airdrop: "🪂 Airdrop",
      reward_founder: "🏆 Founder",
      util_boosts_h: "Boosts & energy refills",
      util_boosts_copy: "Spend REAL to break the cooldown loop.",
      util_hero_h: "Hero upgrades",
      util_hero_copy: "Push passives into mythic territory.",
      util_chapter_h: "Premium chapter unlocks",
      util_chapter_copy: "Skip ahead in the chronicle, keep rewards.",
      util_tourn_h: "Tournaments & cosmetics",
      util_tourn_copy: "Entry fees, exclusive frames, weekly prizes.",
      airdrop_invite_more: "Invite 18 more to lock guaranteed allocation.",
      guild_lions_copy: "Your guild boosts everyone's tap by +6% while you climb. Invite into the same guild for stacked rewards in the seasonal contest.",

      /* Social page */
      pahlavan_sub: "Pahlavan · Lions of Pars",
      mythic_frame_sub: "Mythic frame",
      house_simorgh: "House of Simorgh",
      all_myths: "All myths",
      tribe_leader: "Tribe leader",
      free_agent: "Free agent",
      climb_ranks: "Climb 14 ranks for chest",
      guild_simorgh: "House of Simorgh",
      guild_rostam: "Warriors of Rostam",
      guild_members_lions: "142 / 200 members · #12 globally",
      guild_members_simorgh: "98 / 200 members · #5 globally",
      guild_members_rostam: "187 / 200 members · #2 globally",
      event_weekly_h: "Weekly Tournament — Royal Cup",
      event_weekly_copy: "Top 100 share 100,000 REAL · Ends in 2d 14h",
      event_referral_h: "Referral Contest",
      event_referral_copy: "Top 10 referrers earn the Founder Frame · Ends Sunday",
      event_learning_h: "Learning Race",
      event_learning_copy: "Finish chapters 1–6 first for 5,000 REAL bonus.",

      /* Heroes page */
      discovery_album: "Discovery Album",
      your_collection: "Your unlocked collection from the Shahnameh",
      ch_complete_kicker: "Chapter Complete",
      ch1_banner_title: "Chapter 1 — The First King",
      ch1_banner_sub: "10 items discovered · Keyumars era",
      stat_discovered: "Discovered",
      stat_locked: "Locked",
      stat_chapters: "Chapters",
      stat_avg_rarity: "Avg Rarity",
      progress_of: "of 69 discovered",
      progress_ch1: "Ch.1 complete",
      tab_all: "All",
      tab_characters: "Characters",
      tab_places: "Places",
      tab_enemies: "Enemies",
      tab_codex: "Codex",
      type_character: "Character",
      type_enemy: "Enemy",
      type_place: "Place",
      type_codex: "Codex",
      rarity_common: "Common",
      rarity_rare: "Rare",
      rarity_epic: "Epic",
      rarity_legend: "Legendary",
      rarity_mythic: "Mythic",
      locked_unknown: "???",
      locked_ch2_warrior: "Unlocks in Chapter 2",
      locked_ch2_realm: "Unlocks in Chapter 2",
      locked_ch3_king: "Unlocks in Chapter 3",
      locked_ch4_hero: "Unlocks in Chapter 4",
      locked_teaser_title: "Chapters 2 – 50",
      locked_teaser_count: "55 more items locked · Complete new chapters to discover",
      cert_watermark: "◆ Certificate of Discovery · REAL Shahnameh",
      cert_biography: "📖 Biography",
      cert_faction_role: "⚔ Faction & Role",
      cert_powers: "⬡ Powers & Bonuses",
      cert_story: "📜 Story Appearances",
      cert_zoom: "⊕ Tap to expand",
      cert_col_id: "ID",
      cert_col_rarity: "Rarity",
      cert_col_season: "Season / Ch.",
      cert_col_unlock: "Unlock",
      cert_col_ton: "TON Std",
      cert_col_art: "Artwork",
      cert_col_mint: "Mint",
      cert_mint_pending: "Pending after TGE",
      cert_mint_done: "Minted",
      cert_nft_pending_txt: "◈ NFT Pending · Will mint on TON after TGE",
      cert_nft_ready_txt: "◆ NFT Ready · Claim on TON",
      cert_discovered_prefix: "Discovered",
      cert_season_prefix: "Season",
      side_light: "Light Side",
      side_dark: "Dark Side",

      /* Skin names (tap.js) */
      skin_real: "REAL Token",
      skin_keyumars: "Keyumars",
      skin_hushang: "Hushang",
      skin_zahhak: "Zahhak",
      skin_rostam: "Rostam",
      skin_simorgh: "Simorgh",
      skin_royal: "Royal Seal",
      skin_equipped_toast: "skin equipped",
      skin_locked_toast: "Coming soon",
      skin_copy_toast: "Contract address copied",
      skin_copy_soon: "Contract address coming soon",
      skin_claimed_toast: "+172 REAL claimed to balance!",

      /* Intro page */
      intro_enter: "Enter Season 2",
    },

    /* ── PERSIAN / فارسی ──────────────────────────────── */
    fa: {
      /* Nav */
      home: "خانه", tap: "استخراج", heroes: "قهرمانان",
      learn: "یادگیری", earn: "درآمد", social: "اجتماعی",

      /* Common */
      season2: "فصل دوم", season2_pill: "S۲ · باب ۱",
      continue_journey: "ادامه مسیر",
      daily_quests: "مأموریت‌های روزانه",
      your_real: "ریال شما",
      hero_spotlight: "قهرمان ویژه",
      explore: "کاوش",
      resets_midnight: "بازنشانی در نیمه‌شب",
      apply: "درخواست", full: "تکمیل", close: "بستن",
      watch_ad: "تبلیغ ببین", claim: "دریافت ›",

      /* Tap page */
      mining_title: "استخراج ریال",
      tap_subtitle: "بزن · کسب کن · دریافت کن",
      balance: "موجودی", real_per_hr: "ریال / ساعت", streak: "زنجیره",
      auto_mining_income: "درآمد استخراج خودکار",
      minting_core_label: "⬡ هسته ضرب — برای ساخت ریال بزن",
      energy: "انرژی",
      tap_hint: "هر ضربه ریال جدید می‌سازد · ترکیب درآمد را چند برابر می‌کند",
      combo_multiplier: "ضریب ترکیب",
      streak_label: "زنجیره روزانه",
      streak_val: "🔥 ۱۲ روز",
      refill: "شارژ مجدد",
      refill_copy: "۵۰۰ انرژی را فوری بازگردان. تبلیغ ببین.",
      watch_ad_energy: "تبلیغ ببین",
      tap_skins_title: "⬡ پوسته‌های ضربه",
      skins_sub: "از فصل‌ها کسب کن · با REAL بخر · در رویدادها و ایردراپ‌ها برنده شو",
      market_title: "◆ بازار ریال",
      market_powered: "پشتیبانی شده توسط TON",
      market_price_lbl: "قیمت ریال",
      market_7d: "۷ روز",
      market_status_conn: "● در حال اتصال",
      market_liq: "نقدینگی",
      market_trust: "امتیاز اعتماد",
      market_holders: "دارندگان",
      market_contract: "قرارداد",
      market_copy_btn: "کپی",
      market_dyor: "مشاهده در DYOR ↗",
      market_tonviewer: "Tonviewer ↗",
      market_note: "در حال اتصال به بازار TON…",
      recent_mining: "استخراج اخیر",
      tap_burst_evt: "ضربه ترکیبی · ×۱.۴ ترکیب",
      crit_hit_evt: "ضربه بحرانی!",
      auto_claim_evt: "دریافت خودکار · ۱ ساعت",
      boost_activated_evt: "تقویت فعال شد",
      gain_power: "+۳× قدرت",

      /* Learn page */
      chronicle_progress: "پیشرفت شاهنامه",
      chapters_done_label: "۲ از ۱۲ فصل کامل شد",
      day_of_journey: "روز ۱ از سفر ۹ ماهه شما",
      hero_fragments: "قطعات قهرمان",
      boost_drops: "دریافت تقویتی",
      chronicle: "شرح وقایع",
      chronological: "ترتیب تاریخی",
      chapter_completed: "کامل شد",
      chapter_active: "فصل جاری",
      chapter_locked: "قفل",
      final_boss_chip: "رئیس نهایی",
      modal_sub: "داستان را بخوان و پاسخ بده تا جایزه بگیری.",
      modal_continue: "ادامه",
      modal_close: "بستن",

      /* Chapter titles */
      ch1_title: "کیومرث — اولین شاه",
      ch1_copy: "سپیده‌دم انسانیت. کیومرث از کوه فرمان می‌راند، جامه پلنگ به تن، و جهان شگفتی می‌آموزد.",
      ch2_title: "هوشنگ — جرقه آتش",
      ch2_copy: "هوشنگ چخماق را بر مار می‌کوبد و شعله ابدی را بیدار می‌کند. جشن سده متولد می‌شود.",
      ch3_title: "طهمورث — دیوبند",
      ch3_copy: "دیوبند در دود سواری می‌کند و دیوان را به زنجیر می‌کشد. هنر نوشتن به‌دست می‌آید.",
      ch4_title: "جمشید — تخت طلایی",
      ch4_copy: "شاهنشاهی هفت هنر و جام‌های بلورین — تا آنکه غرور از خورشید می‌گذرد.",
      ch5_title: "ضحاک — شاه مار",
      ch5_copy: "هزار سال تاریکی بر دوش شاه می‌پیچد. مغز مردم بهای نان است.",
      ch6_title: "فریدون — رهایی‌بخش",
      ch6_copy: "پیش‌بند آهنگر به پرچم تبدیل می‌شود. گرز گاوسر به پایان ستمگر می‌رسد.",
      ch7_title: "زال — شاهزاده سپیدموی",
      ch7_copy: "به کوه افکنده شد، در آغوش سیمرغ پرورش یافت، به شاهنشاهی که زمانی از او می‌هراسید بازگشت.",
      ch8_title: "رستم — پهلوان عصر",
      ch8_copy: "هفت خوان، یک رخش، بی‌همتا زیر آسمان.",
      ch9_title: "سهراب — پسر طوفان",
      ch9_copy: "دو سپاه، دو دل، یک شمشیر تراژیک.",
      ch10_title: "اسفندیار — رویین‌تن",
      ch10_copy: "آسیب‌ناپذیر، مگر جایی که چشمانش دیده شود.",
      ch11_title: "سیمرغ — شورای ققنوس",
      ch11_copy: "بال‌هایی به رنگ خورشید. خردی دیرینه‌تر از زبان.",
      ch12_title: "جنگ پایانی — پایان عصرها",
      ch12_copy: "شاهنامه آنجا که آغاز شد پایان می‌یابد: با آتش، با آهن، با شاهان.",

      /* Chapter rewards */
      xp_200: "⭐ ۲۰۰ تجربه دریافت شد",
      xp_250: "⭐ ۲۵۰ تجربه دریافت شد",
      xp_300: "⭐ ۳۰۰ تجربه · 🪙 ۱۲۰ REAL",
      xp_350: "⭐ ۳۵۰ تجربه · 🪙 ۱۵۰ REAL",
      xp_400: "⭐ ۴۰۰ تجربه · 🐍 قطعه قهرمان",
      xp_450: "⭐ ۴۵۰ تجربه · 🪙 ۲۰۰ REAL",
      xp_500: "⭐ ۵۰۰ تجربه · 🪶 پر سیمرغ",
      xp_600: "⭐ ۶۰۰ تجربه · ⚔ خرده رستم",
      xp_650: "⭐ ۶۵۰ تجربه · 🪙 ۲۸۰ REAL",
      xp_700: "⭐ ۷۰۰ تجربه · 🪙 ۳۲۰ REAL",
      xp_800: "⭐ ۸۰۰ تجربه · 🪶 پر اساطیری",
      xp_1500: "⭐ ۱۵۰۰ تجربه · 🏆 نشان بنیان‌گذار",

      /* Earn page */
      watch_earn: "ببین و کسب کن",
      ad_remaining: "۵ / ۵ امروز",
      ad_energy_h: "+۲۵ انرژی",
      ad_energy_copy: "انرژی‌ات را پر کن تا به ضرب ادامه دهی.",
      ad_energy_btn: "تبلیغ ببین · +۲۵ ⚡",
      ad_gems_h: "+۱۰ جواهر",
      ad_gems_copy: "جواهر ذخیره کن برای ارتقای قهرمان.",
      ad_gems_btn: "تبلیغ ببین · +۱۰ 💎",
      ad_real_h: "+۱۰۰ REAL",
      ad_real_copy: "تقویت سریع موجودی. محدودیت روزانه اعمال می‌شود.",
      ad_real_btn: "تبلیغ ببین · +۱۰۰ REAL",
      invite_3_h: "دعوت از ۳ دوست",
      invite_3_copy: "۳ / ۳ — صندوقچه جایزه دریافت شد.",
      invite_10_h: "دعوت از ۱۰ دوست",
      invite_10_copy: "۷ / ۱۰ — قهرمان نادر در انتظار است.",
      invite_25_h: "دعوت از ۲۵ دوست",
      invite_25_copy: "۷ / ۲۵ — دسترسی به ایردراپ باز می‌شود.",
      invite_100_h: "دعوت از ۱۰۰ دوست",
      invite_100_copy: "۷ / ۱۰۰ — نشان بنیان‌گذار + قاب اساطیری.",
      reward_chest: "🎁 صندوقچه",
      reward_rare_hero: "⚔ قهرمان نادر",
      reward_airdrop: "🪂 ایردراپ",
      reward_founder: "🏆 بنیان‌گذار",
      util_boosts_h: "تقویت‌ها و شارژ انرژی",
      util_boosts_copy: "REAL را خرج کن تا چرخه خنک‌سازی را بشکنی.",
      util_hero_h: "ارتقای قهرمان",
      util_hero_copy: "توانمندی‌های غیرفعال را به قلمرو اساطیری برسان.",
      util_chapter_h: "باز کردن فصل‌های ویژه",
      util_chapter_copy: "در شاهنامه جلو برو، جایزه‌ها را نگه‌دار.",
      util_tourn_h: "مسابقات و ظاهرسازی",
      util_tourn_copy: "کارمزدها، قاب‌های انحصاری، جوایز هفتگی.",
      airdrop_invite_more: "۱۸ نفر دیگر دعوت کن تا تخصیص تضمینی قفل شود.",
      guild_lions_copy: "اتحادیه‌ات در زمان صعود ضربه همه را +۶٪ تقویت می‌کند. با دعوت به همان اتحادیه جوایز انبوه فصلی بگیر.",

      /* Social page */
      pahlavan_sub: "پهلوان · شیران پارس",
      mythic_frame_sub: "قاب اساطیری",
      house_simorgh: "خانه سیمرغ",
      all_myths: "همه اساطیر",
      tribe_leader: "رهبر قبیله",
      free_agent: "مستقل",
      climb_ranks: "۱۴ رتبه بالا برو برای صندوقچه",
      guild_simorgh: "خانه سیمرغ",
      guild_rostam: "جنگاوران رستم",
      guild_members_lions: "۱۴۲ / ۲۰۰ عضو · #۱۲ در جهان",
      guild_members_simorgh: "۹۸ / ۲۰۰ عضو · #۵ در جهان",
      guild_members_rostam: "۱۸۷ / ۲۰۰ عضو · #۲ در جهان",
      event_weekly_h: "مسابقه هفتگی — جام شاهی",
      event_weekly_copy: "۱۰۰ نفر برتر ۱۰۰٬۰۰۰ REAL می‌برند · پایان در ۲ روز و ۱۴ ساعت",
      event_referral_h: "مسابقه معرفی",
      event_referral_copy: "۱۰ معرف برتر قاب بنیان‌گذار می‌برند · پایان یکشنبه",
      event_learning_h: "مسابقه یادگیری",
      event_learning_copy: "فصل‌های ۱ تا ۶ را اول تمام کن و ۵٬۰۰۰ REAL ببر.",

      /* Heroes page */
      discovery_album: "آلبوم کشفیات",
      your_collection: "مجموعه باز‌شده شما از شاهنامه",
      ch_complete_kicker: "فصل کامل شد",
      ch1_banner_title: "فصل ۱ — اولین شاه",
      ch1_banner_sub: "۱۰ آیتم کشف شد · دوران کیومرث",
      stat_discovered: "کشف‌شده",
      stat_locked: "قفل",
      stat_chapters: "فصل‌ها",
      stat_avg_rarity: "نادرتی میانگین",
      progress_of: "از ۶۹ کشف شده",
      progress_ch1: "فصل ۱ کامل",
      tab_all: "همه",
      tab_characters: "شخصیت‌ها",
      tab_places: "مکان‌ها",
      tab_enemies: "دشمنان",
      tab_codex: "کدکس",
      type_character: "شخصیت",
      type_enemy: "دشمن",
      type_place: "مکان",
      type_codex: "کدکس",
      rarity_common: "عادی",
      rarity_rare: "نادر",
      rarity_epic: "حماسی",
      rarity_legend: "افسانه‌ای",
      rarity_mythic: "اساطیری",
      locked_unknown: "؟؟؟",
      locked_ch2_warrior: "در فصل ۲ باز می‌شود",
      locked_ch2_realm: "در فصل ۲ باز می‌شود",
      locked_ch3_king: "در فصل ۳ باز می‌شود",
      locked_ch4_hero: "در فصل ۴ باز می‌شود",
      locked_teaser_title: "فصل‌های ۲ تا ۵۰",
      locked_teaser_count: "۵۵ آیتم قفل · فصل‌های جدید را کامل کن تا کشف کنی",
      cert_watermark: "◆ گواهی کشف · ریل شاهنامه",
      cert_biography: "📖 زندگینامه",
      cert_faction_role: "⚔ جناح و نقش",
      cert_powers: "⬡ توانایی‌ها و پاداش‌ها",
      cert_story: "📜 حضور در داستان",
      cert_zoom: "⊕ برای بزرگ‌نمایی بزن",
      cert_col_id: "شناسه",
      cert_col_rarity: "نادرتی",
      cert_col_season: "فصل / باب",
      cert_col_unlock: "شرط باز کردن",
      cert_col_ton: "استاندارد TON",
      cert_col_art: "نسخه هنری",
      cert_col_mint: "ضرب",
      cert_mint_pending: "در انتظار TGE",
      cert_mint_done: "ضرب شده",
      cert_nft_pending_txt: "◈ NFT در انتظار · پس از TGE در TON ضرب می‌شود",
      cert_nft_ready_txt: "◆ NFT آماده · در TON دریافت کن",
      cert_discovered_prefix: "کشف شد",
      cert_season_prefix: "فصل",
      side_light: "جانب نور",
      side_dark: "جانب تاریکی",

      /* Skin names */
      skin_real: "REAL Token",
      skin_keyumars: "کیومرث",
      skin_hushang: "هوشنگ",
      skin_zahhak: "ضحاک",
      skin_rostam: "رستم",
      skin_simorgh: "سیمرغ",
      skin_royal: "مهر شاهی",
      skin_equipped_toast: "پوسته فعال شد",
      skin_locked_toast: "به زودی",
      skin_copy_toast: "قرارداد کپی شد",
      skin_copy_soon: "آدرس قرارداد به زودی",
      skin_claimed_toast: "!+۱۷۲ REAL به موجودی اضافه شد",

      /* Intro page */
      intro_enter: "ورود به فصل دوم",
    }
  };

  /* =========================================================
     PUBLIC API
     ========================================================= */
  const t = (key) => {
    const lang = getLang();
    return (STRINGS[lang] && STRINGS[lang][key])
      || (STRINGS.en && STRINGS.en[key])
      || key;
  };

  /* =========================================================
     applyLocale — second pass over all data-i18n elements
     ========================================================= */
  const applyLocale = () => {
    const lang = getLang();
    const isFa = (lang === "fa");

    /* Apply data-i18n text content */
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = STRINGS[lang] && STRINGS[lang][key];
      if (val) el.textContent = val;
    });

    /* Apply data-i18n-html (innerHTML) */
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      const val = STRINGS[lang] && STRINGS[lang][key];
      if (val) el.innerHTML = val;
    });

    /* Apply data-i18n-placeholder */
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const val = STRINGS[lang] && STRINGS[lang][key];
      if (val) el.placeholder = val;
    });

    /* Convert numbers in data-fa-num elements (FA only) */
    if (isFa) {
      document.querySelectorAll("[data-fa-num]").forEach((el) => {
        el.textContent = toPersianDigits(el.textContent);
      });
    }

    /* Update document.title */
    if (isFa) {
      const page = (location.pathname.split("/").pop() || "index.html").replace(/\?.*/, "");
      const titles = {
        "tap.html":    "ریل شاهنامه — استخراج",
        "learn.html":  "ریل شاهنامه — یادگیری",
        "heroes.html": "ریل شاهنامه — قهرمانان",
        "earn.html":   "ریل شاهنامه — درآمد",
        "social.html": "ریل شاهنامه — اجتماعی",
        "index.html":  "ریل شاهنامه",
        "intro.html":  "ریل شاهنامه",
        "chapter.html":"ریل شاهنامه — فصل",
      };
      if (titles[page]) document.title = titles[page];
    }

    /* Observe dynamic data-balance / data-energy for digit conversion */
    if (isFa) {
      const dynamicEls = document.querySelectorAll(
        "[data-balance], [data-energy], [data-combo], [data-level], [data-team-mult], [data-referrals], [data-chapters-done], [data-chapters-pct]"
      );
      dynamicEls.forEach((el) => {
        el.textContent = toPersianDigits(el.textContent);
        const obs = new MutationObserver(() => {
          const raw = el.textContent;
          const conv = toPersianDigits(raw);
          if (raw !== conv) {
            obs.disconnect();
            el.textContent = conv;
            obs.observe(el, { childList: true, subtree: true, characterData: true });
          }
        });
        obs.observe(el, { childList: true, subtree: true, characterData: true });
      });
    }
  };

  /* =========================================================
     EXPOSE GLOBALLY
     ========================================================= */
  window.RealI18N = {
    t, formatNumber, formatPercent, toPersianDigits,
    getLang, applyLocale, STRINGS
  };

  /* Run on DOM ready (after app.js has done its first pass) */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyLocale);
  } else {
    applyLocale();
  }
})();
