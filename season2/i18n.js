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

      /* Chapter page — static chrome */
      back_to_journey: "← Journey",
      watch_intro: "Watch Intro ▷",
      ch_timeline: "Timeline",
      ch_read_chronicle: "Read the Chronicle",
      ch_characters: "Characters",
      ch_places: "Places",
      ch_codex: "Codex",
      ch_final_encounter: "Final Encounter",
      ch_chronicle_quiz: "Chronicle Quiz",
      image_coming_soon: "Image coming soon",
      scene_prev: "‹ Prev",
      scene_next: "Next ›",
      unlocked_label: "Unlocked",

      /* Chapter page — dynamic strings */
      ch_loading: "Loading…",
      ch_season2_chapter: "Season 2 · Chapter",
      ch_final_encounter_fallback: "Final encounter",
      ch_no_timeline: "No timeline yet.",
      ch_no_lore: "This chapter has no lore data uploaded yet.",
      ch_unlock_by_scenes: "Unlock by reading scenes",
      ch_unlock_related_scene: "Unlock by reading the related scene.",
      ch_codex_one_entry: "+1 codex entry unlocked",
      ch_codex_n_entries: "+{n} codex entries unlocked",
      ch_scene_completed: "Scene completed",
      ch_next_scene: "Next scene",
      ch_close: "Close",

      /* Battle requirements */
      req_player_gate: "Player gate",
      req_recruit: "Recruit",
      req_item: "Item",
      req_knowledge: "Knowledge",
      req_goal: "Goal",
      boss_sent_by: "Sent by",
      boss_ahriman_lord: "Ahriman — Lord of the Dark",
      battle_challenge_tpl: "Challenge {boss} — Coming next update",
      battle_locked: "Locked — complete all requirements",
      battle_combat_next_update: "Combat arrives in the next update.",

      /* Quiz */
      quiz_question_of: "Question {i} of {n}",
      quiz_no_published: "No quiz published for this chapter yet.",
      quiz_chapter_mastered: "Chapter Quiz Mastered",
      quiz_complete_line: "{n} of {n} answered correctly. Khazura watches from the forest.",
      quiz_xp_earned: "+{xp} XP earned",
      quiz_real_earned: "+{n} REAL earned",
      quiz_real_earned_suffix: "REAL earned",
      quiz_return_journey: "Return to Journey →",
      quiz_replay: "Replay quiz",
      quiz_correct_default: "Correct.",
      difficulty_easy: "EASY",
      difficulty_medium: "MEDIUM",
      difficulty_hard: "HARD",

      /* Document title */
      doc_title_chapter_tpl: "REAL Shahnameh — {title}",

      /* ============== INTRO PAGE ============== */
      /* Top / bottom controls */
      intro_skip: "Skip",
      intro_step_tpl: "{i} / {n}",
      intro_back: "Back",
      intro_continue: "Continue",
      intro_begin_journey: "Begin Journey",
      intro_replay_note: "You can replay this intro anytime from the chapter overview.",
      intro_doc_title: "REAL Shahnameh — In the Name of Wisdom",

      /* Panel bism (opening verse) */
      intro_bism_translation: "In the Name of the Lord of soul and wisdom — higher than this, no thought can pass.",
      intro_bism_author: "— Ferdowsi, opening of the Shahnameh",

      /* Panel A — Ferdowsi */
      intro_kicker_a: "A · The Poet",
      intro_h1_ferdowsi: "Ferdowsi of Tus",
      intro_ferdowsi_lead: "One man · thirty years · sixty thousand verses.",
      intro_ferdowsi_p1: "When the empires of Persia had been broken and her language was bending toward forgetfulness, a poet from Tus picked up a pen and began the slow work of remembering. Ferdowsi did not invent the kings he named. He carried them across the ruined ground so that a child a thousand years later could still say, in her own tongue, the words for dawn and throne and fire.",
      intro_ferdowsi_p2: "What he saved was not a king-list. He saved a way of being Iranian.",
      intro_ferdowsi_quote: "\"I shall not die, for I am alive — for I have sown the seed of words.\"",

      /* Panel B — Shahnameh */
      intro_kicker_b: "B · The Book",
      intro_h1_shahnameh: "The Shahnameh",
      intro_shahnameh_lead: "The Book of Kings.",
      intro_shahnameh_p1: "A single epic that holds the whole memory of Persia: dynasty after dynasty, hero after hero, demon after demon, from the first king of the dawn to the last battle of the age. It is history dressed as myth, and myth dressed as history. They cannot be separated and you are not meant to.",
      intro_shahnameh_p2: "The Shahnameh is the preservation of Persian identity itself — language, ritual, calendar, courage, sorrow. Where empires fell, the verses did not. Where the language of the court changed, Ferdowsi's Persian held. A nation's mythology, kept alive by one poet's stubbornness.",
      intro_fact_60k_num: "≈ 60,000",
      intro_fact_60k_desc: "Couplets — the longest epic by a single poet ever written.",
      intro_fact_50_num: "50",
      intro_fact_50_desc: "Stories, from Keyumars to the fall of the Sassanians.",
      intro_fact_30yrs_num: "30 yrs",
      intro_fact_30yrs_desc: "Of work by Ferdowsi.",
      intro_fact_1lang_num: "1 lang",
      intro_fact_1lang_desc: "Held alive by 60,000 verses — Persian.",

      /* Panel C — Age of Kings */
      intro_kicker_c: "C · The Age",
      intro_h1_age: "The Age of Kings Begins",
      intro_age_lead: "Before the dynasties of Iran, before the Achaemenids, before the prophet of fire — the Pishdadians.",
      intro_age_p1: "The first dynasty of the Shahnameh is older than memory: a line of kings who taught humans to bind hair and hand fire and split iron. They are called Pishdadi — those who set the foremost law. The chronicle begins with the very first of them.",

      /* Panel D — World Before */
      intro_kicker_d: "D · The World Before",
      intro_h1_before: "A World Without Roof",
      intro_before_lead: "No fire. No alphabet. No measure of time.",
      intro_before_p1: "The valleys were full of teeth. The forests were older than language. Children slept under leaves and woke under hawks. There was no single word the people had in common. There was no shared night, no shared morning.",
      intro_before_p2: "And then — high up, where only goats and weather went — a man stood on the cold rock and looked down.",

      /* Panel E — Duality */
      intro_kicker_e: "E · The Two",
      intro_h1_duality: "Light against Darkness",
      intro_dual_ahura_h: "Ahura · Light",
      intro_dual_ahura_body: "Order. Speech. Fire kept. Memory. Kings.",
      intro_dual_ahriman_h: "Ahriman · Dark",
      intro_dual_ahriman_body: "Forgetting. Hunger. The shape under the leaf.",
      intro_duality_foot: "The Shahnameh does not pretend they are equal. It pretends they are old.",

      /* Panel F — Keyumars */
      intro_kicker_f: "F · The First King",
      intro_h1_keyumars: "Keyumars Rises",
      intro_keyumars_lead: "On a high crag of ancient Pars, the first man takes a leopard's skin across his shoulders.",
      intro_keyumars_p1: "He has no army yet. He has no city. He has only the wind, the firelight, and the silence after he speaks. The lions come down from the high pasture and lie at his feet. The mountain learns his name.",
      intro_keyumars_p2: "This is where your chronicle begins.",

      /* Panel timeline */
      intro_kicker_chrono: "The Chronology",
      intro_h1_timeline: "Three Markers Before Chapter 1",
      intro_bc_suffix: "BC",
      intro_year_7000: "~7000",
      intro_year_6900: "~6900",
      intro_year_6800: "~6800",
      intro_tl_age_h: "Age of Keyumars",
      intro_tl_age_body: "The leopard-skin king takes the high mountain. The first court is laid.",
      intro_tl_siamak_h: "Siamak Rises",
      intro_tl_siamak_body: "The prince walks among the people. The mountain knows his name.",
      intro_tl_war_h: "War Against Darkness",
      intro_tl_war_body: "Ahriman wakes. Khazura the Black Div is sent. The first sorrow comes into the world.",

      /* Panel CTA */
      intro_cta_kicker: "SEASON 2 · CHAPTER 1",
      intro_cta_title: "Keyumars — The First King",
      intro_cta_copy: "From here on, the chronicle is yours. Each scene unlocks codex entries. Each correct answer earns REAL. Each level brings you closer to the dark thing in the forest.",
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

      /* Chapter page — static chrome */
      back_to_journey: "→ مسیر",
      watch_intro: "تماشای آغاز ▷",
      ch_timeline: "زمان‌نگار",
      ch_read_chronicle: "خواندنِ تاریخ",
      ch_characters: "شخصیت‌ها",
      ch_places: "مکان‌ها",
      ch_codex: "کدکس",
      ch_final_encounter: "نبرد پایانی",
      ch_chronicle_quiz: "آزمون تاریخ",
      image_coming_soon: "تصویر به‌زودی",
      scene_prev: "قبلی ›",
      scene_next: "‹ بعدی",
      unlocked_label: "باز شد",

      /* Chapter page — dynamic strings */
      ch_loading: "در حال بارگذاری…",
      ch_season2_chapter: "فصل دوم · باب",
      ch_final_encounter_fallback: "نبرد پایانی",
      ch_no_timeline: "هنوز زمان‌نگاری منتشر نشده.",
      ch_no_lore: "هنوز داده‌ای برای این فصل بارگذاری نشده.",
      ch_unlock_by_scenes: "با خواندن صحنه‌ها باز می‌شود",
      ch_unlock_related_scene: "با خواندن صحنه‌ی مربوط باز می‌شود.",
      ch_codex_one_entry: "+۱ ورودی کدکس باز شد",
      ch_codex_n_entries: "+{n} ورودی کدکس باز شد",
      ch_scene_completed: "صحنه تکمیل شد",
      ch_next_scene: "صحنه‌ی بعدی",
      ch_close: "بستن",

      /* Battle requirements */
      req_player_gate: "محدودیتِ بازیکن",
      req_recruit: "همراه",
      req_item: "کالا",
      req_knowledge: "دانش",
      req_goal: "هدف",
      boss_sent_by: "فرستاده‌ی",
      boss_ahriman_lord: "اهریمن — خداوندِ تاریکی",
      battle_challenge_tpl: "چالش با {boss} — در بروزرسانی بعد",
      battle_locked: "قفل — همه‌ی شرایط را کامل کن",
      battle_combat_next_update: "نبرد در بروزرسانی بعدی فعال می‌شود.",

      /* Quiz */
      quiz_question_of: "پرسش {i} از {n}",
      quiz_no_published: "هنوز آزمونی برای این فصل منتشر نشده.",
      quiz_chapter_mastered: "تسلط بر آزمون فصل",
      quiz_complete_line: "{n} از {n} پاسخ درست. خزورا از جنگل می‌نگرد.",
      quiz_xp_earned: "+{xp} تجربه دریافت شد",
      quiz_real_earned: "+{n} REAL دریافت شد",
      quiz_real_earned_suffix: "REAL دریافت شد",
      quiz_return_journey: "بازگشت به مسیر →",
      quiz_replay: "پخش دوباره",
      quiz_correct_default: "درست.",
      difficulty_easy: "آسان",
      difficulty_medium: "متوسط",
      difficulty_hard: "دشوار",

      /* Document title */
      doc_title_chapter_tpl: "ریل شاهنامه — {title}",

      /* ============== INTRO PAGE ============== */
      /* Top / bottom controls */
      intro_skip: "رد شدن",
      intro_step_tpl: "{i} / {n}",
      intro_back: "بازگشت",
      intro_continue: "ادامه",
      intro_begin_journey: "آغازِ سفر",
      intro_replay_note: "این آغاز را هرگاه خواستی از نمای فصل دوباره ببین.",
      intro_doc_title: "ریل شاهنامه — به نامِ خرد",

      /* Panel bism (opening verse) */
      intro_bism_translation: "به نامِ خداوندِ جان و خِرَد — کزین برتر اندیشه برنگذرد.",
      intro_bism_author: "— فردوسی، آغازِ شاهنامه",

      /* Panel A — Ferdowsi */
      intro_kicker_a: "بخشِ یکم · شاعر",
      intro_h1_ferdowsi: "فردوسیِ توس",
      intro_ferdowsi_lead: "یک تن · سی سال · شصت هزار بیت.",
      intro_ferdowsi_p1: "آن‌گاه که شاهنشاهی‌های پارس فروریخته بود و زبانش به سوی فراموشی خم می‌شد، شاعری از توس قلم برداشت و کارِ کندِ یادآوری را آغاز کرد. فردوسی شاهانی را که نام برد، نساخت؛ او آنان را از خاکِ ویران گذراند تا کودکی، هزار سال پس از او، بتواند به زبانِ خویش بگوید: «سپیده‌دم»، «تخت»، «آتش».",
      intro_ferdowsi_p2: "آن‌چه او نگاه داشت، فهرستِ نامِ شاهان نبود. او شیوه‌ی ایرانی‌بودن را نگاه داشت.",
      intro_ferdowsi_quote: "«نمیرم از این پس که من زنده‌ام — که تخمِ سخن را پراکنده‌ام.»",

      /* Panel B — Shahnameh */
      intro_kicker_b: "بخشِ دوم · کتاب",
      intro_h1_shahnameh: "شاهنامه — کتابِ شاهان",
      intro_shahnameh_lead: "کتابِ شاهان.",
      intro_shahnameh_p1: "یک حماسه‌ی یگانه که همه‌ی یادِ پارس را در خود نگه می‌دارد: دودمان پس از دودمان، پهلوان پس از پهلوان، دیو پس از دیو، از نخستین شاهِ سپیده‌دم تا واپسین نبردِ روزگار. تاریخ است که جامه‌ی اسطوره پوشیده، و اسطوره که جامه‌ی تاریخ. این دو را نمی‌توان از هم جدا کرد، و نباید کرد.",
      intro_shahnameh_p2: "شاهنامه، خودِ پاسداریِ هویتِ ایرانی است — زبان، آیین، تقویم، دلیری، اندوه. آن‌جا که شاهنشاهی‌ها فروریختند، بیت‌ها فرو نریختند. آن‌جا که زبانِ درگاه‌ها دگرگون شد، پارسیِ فردوسی پابرجا ماند. اسطوره‌ی یک ملت، که با لجاجِ یک شاعر زنده ماند.",
      intro_fact_60k_num: "≈ ۶۰٬۰۰۰",
      intro_fact_60k_desc: "بیت — بلندترین حماسه‌ای که یک شاعر سروده.",
      intro_fact_50_num: "۵۰",
      intro_fact_50_desc: "داستان، از کیومرث تا فروپاشیِ ساسانیان.",
      intro_fact_30yrs_num: "۳۰ سال",
      intro_fact_30yrs_desc: "از کارِ فردوسی.",
      intro_fact_1lang_num: "یک زبان",
      intro_fact_1lang_desc: "که با شصت هزار بیت زنده مانده — پارسی.",

      /* Panel C — Age of Kings */
      intro_kicker_c: "بخشِ سوم · روزگار",
      intro_h1_age: "آغازِ روزگارِ شاهان",
      intro_age_lead: "پیش از دودمان‌های ایران، پیش از هخامنشیان، پیش از پیامبرِ آتش — پیشدادیان.",
      intro_age_p1: "نخستین دودمانِ شاهنامه از یاد دیرینه‌تر است: تباری از شاهان که به آدمیان آموختند گیسو ببندند، آتش به دست بگیرند و آهن بشکافند. آنان را پیشدادی می‌خوانند — کسانی که نخستین قانون را نهادند. شاهنامه با نخستینِ آنان آغاز می‌شود.",

      /* Panel D — World Before */
      intro_kicker_d: "بخشِ چهارم · جهانِ پیشین",
      intro_h1_before: "جهانی بی‌سقف",
      intro_before_lead: "نه آتش. نه الفبا. نه پیمانه‌ی زمان.",
      intro_before_p1: "دره‌ها پر از دندان بود. جنگل‌ها از زبان دیرینه‌تر بودند. کودکان زیرِ برگ می‌خوابیدند و زیرِ بال‌های شاهین بیدار می‌شدند. هیچ واژه‌ی یگانه‌ای میانِ مردمان نبود. هیچ شبِ مشترکی، هیچ بامدادِ مشترکی.",
      intro_before_p2: "و آن‌گاه — بر بلندی، آن‌جا که تنها بز و باد می‌رفت — مردی بر سنگِ سرد ایستاد و به پایین نگریست.",

      /* Panel E — Duality */
      intro_kicker_e: "بخشِ پنجم · دو نیرو",
      intro_h1_duality: "روشنی در برابرِ تاریکی",
      intro_dual_ahura_h: "اهورا · روشنایی",
      intro_dual_ahura_body: "نظم. سخن. آتشِ نگاه‌داشته. یاد. شاهان.",
      intro_dual_ahriman_h: "اهریمن · تاریکی",
      intro_dual_ahriman_body: "فراموشی. گرسنگی. شکلِ زیرِ برگ.",
      intro_duality_foot: "شاهنامه نمی‌گوید آن دو هم‌سنگ‌اند. می‌گوید کهن‌اند.",

      /* Panel F — Keyumars */
      intro_kicker_f: "بخشِ ششم · نخستین شاه",
      intro_h1_keyumars: "برخاستنِ کیومرث",
      intro_keyumars_lead: "بر صخره‌ای بلند از پارسِ کهن، نخستین مرد پوستِ پلنگی بر دوش می‌اندازد.",
      intro_keyumars_p1: "هنوز سپاهی ندارد. هنوز شهری ندارد. تنها باد را دارد، روشنیِ آتش را، و سکوت پس از سخن. شیران از چراگاهِ بلند فرود می‌آیند و در پایش می‌خوابند. کوهستان نامش را می‌آموزد.",
      intro_keyumars_p2: "اینجا، شاهنامه‌ی تو آغاز می‌شود.",

      /* Panel timeline */
      intro_kicker_chrono: "گاه‌شمار",
      intro_h1_timeline: "سه نشان، پیش از دفترِ یکم",
      intro_bc_suffix: "پ.م",
      intro_year_7000: "~۷۰۰۰",
      intro_year_6900: "~۶۹۰۰",
      intro_year_6800: "~۶۸۰۰",
      intro_tl_age_h: "عصرِ کیومرث",
      intro_tl_age_body: "شاهِ پلنگ‌پوش بر کوهستانِ بلند فرمان می‌راند. نخستین درگاه پی‌ریزی می‌شود.",
      intro_tl_siamak_h: "برخاستنِ سیامک",
      intro_tl_siamak_body: "شاهزاده در میانِ مردمان گام می‌زند. کوهستان نامِ او را می‌داند.",
      intro_tl_war_h: "نبرد با تاریکی",
      intro_tl_war_body: "اهریمن بیدار می‌شود. خزورا، دیوِ سیاه، فرستاده می‌شود. نخستین اندوه به جهان می‌آید.",

      /* Panel CTA */
      intro_cta_kicker: "فصلِ دوم · بابِ یکم",
      intro_cta_title: "کیومرث — نخستین شاه",
      intro_cta_copy: "از این پس، شاهنامه از آنِ توست. هر صحنه ورودی‌های کدکس را باز می‌کند. هر پاسخِ درست REAL می‌بخشد. هر باب تو را به آن چیزِ تاریکِ درونِ جنگل نزدیک‌تر می‌کند.",
    }
  };

  /* =========================================================
     PUBLIC API
     ========================================================= */
  const t = (key, vars) => {
    const lang = getLang();
    let s = (STRINGS[lang] && STRINGS[lang][key])
      || (STRINGS.en && STRINGS.en[key])
      || key;
    if (vars && typeof s === "string") {
      s = s.replace(/\{(\w+)\}/g, (m, k) =>
        Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m);
      if (lang === "fa") s = toPersianDigits(s);
    }
    return s;
  };

  /* =========================================================
     applyLocale — second pass over all data-i18n elements
     ========================================================= */
  const applyLocale = () => {
    const lang = getLang();
    const isFa = (lang === "fa");

    /* Sync <html lang> and <html dir>. app.js does this too, but pages that
       only load i18n.js (e.g. intro.html) need this here. */
    const htmlEl = document.documentElement;
    if (htmlEl) {
      htmlEl.setAttribute("lang", isFa ? "fa" : "en");
      htmlEl.setAttribute("dir", isFa ? "rtl" : "ltr");
    }

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
