const languageSelect = document.querySelector('[data-language-switcher]');

const tokenSelectors = {
  price: document.querySelector('[data-token-price]'),
  change: document.querySelector('[data-token-change]'),
  volume: document.querySelector('[data-token-volume]'),
  cap: document.querySelector('[data-token-cap]'),
  updated: document.querySelector('[data-token-updated]'),
  description: document.querySelector('[data-token-description]'),
};

const chartSelectors = {
  canvas: document.querySelector('[data-token-chart]'),
  status: document.querySelector('[data-token-chart-status]'),
};

const transactionSelectors = {
  list: document.querySelector('[data-token-transactions]'),
  status: document.querySelector('[data-token-transactions-status]'),
};

const dappSelectors = {
  summary: document.querySelector('[data-dapp-summary]'),
  tags: document.querySelector('[data-dapp-tags]'),
  insights: document.querySelector('[data-dapp-insights]'),
};

const roadmapSelectors = {
  list: document.querySelector('[data-dapp-roadmap]'),
};

const socialSelectors = {
  container: document.querySelector('[data-dapp-social-container]'),
  link: document.querySelector('[data-dapp-social]'),
};

const staticTextMap = {
  brandTitle: document.querySelector('[data-i18n="brandTitle"]'),
  languageLabel: document.querySelector('[data-i18n="languageLabel"]'),
  tokenOverline: document.querySelector('[data-i18n="tokenOverline"]'),
  tokenTitle: document.querySelector('[data-i18n="tokenTitle"]'),
  tokenSummary: document.querySelector('[data-i18n="tokenSummary"]'),
  tokenPriceLabel: document.querySelector('[data-i18n="tokenPriceLabel"]'),
  tokenChangeLabel: document.querySelector('[data-i18n="tokenChangeLabel"]'),
  tokenVolumeLabel: document.querySelector('[data-i18n="tokenVolumeLabel"]'),
  tokenMarketCapLabel: document.querySelector('[data-i18n="tokenMarketCapLabel"]'),
  tokenChartTitle: document.querySelector('[data-i18n="tokenChartTitle"]'),
  tokenChartCaption: document.querySelector('[data-i18n="tokenChartCaption"]'),
  tokenTransactionsTitle: document.querySelector('[data-i18n="tokenTransactionsTitle"]'),
  tokenTransactionsCaption: document.querySelector('[data-i18n="tokenTransactionsCaption"]'),
  tokenFooterLink: document.querySelector('[data-i18n="tokenFooterLink"]'),
  dappOverline: document.querySelector('[data-i18n="dappOverline"]'),
  dappTitle: document.querySelector('[data-i18n="dappTitle"]'),
  dappSummary: document.querySelector('[data-i18n="dappSummary"]'),
  dappRoadmapTitle: document.querySelector('[data-i18n="dappRoadmapTitle"]'),
  dappRoadmapCaption: document.querySelector('[data-i18n="dappRoadmapCaption"]'),
  dappInsightsTitle: document.querySelector('[data-i18n="dappInsightsTitle"]'),
  dappSocialLink: document.querySelector('[data-i18n="dappSocialLink"]'),
  dappFooterLink: document.querySelector('[data-i18n="dappFooterLink"]'),
  footerRights: document.querySelector('[data-i18n="footerRights"]'),
};

const LANGUAGES = {
  en: {
    label: 'English',
    dir: 'ltr',
    locale: 'en-US',
    strings: {
      brandTitle: 'REAL Shahnameh',
      languageLabel: 'Language',
      tokenOverline: 'Live token pulse',
      tokenTitle: 'REAL token on DYOR',
      tokenSummary:
        'Direct feed from DYOR keeps the REAL Shahnameh community informed about liquidity, sentiment, and velocity on TON.',
      tokenPriceLabel: 'Price (USD)',
      tokenChangeLabel: '24h change',
      tokenVolumeLabel: '24h volume',
      tokenMarketCapLabel: 'Market cap',
      tokenUpdatedWaiting: 'Waiting for the latest DYOR block…',
      tokenUpdatedSynced: 'Synced {{timestamp}} (DYOR)',
      tokenUpdatedFallback: 'Synced from DYOR.',
      tokenUpdatedError: 'Unable to reach the DYOR token feed right now.',
      tokenDescriptionPlaceholder:
        'DYOR metrics for the REAL token will populate here as soon as they load. The REAL Shahnameh collective keeps the narrative grounded in verifiable numbers.',
      tokenDescriptionMissing:
        'DYOR has not published a narrative for the REAL token. The REAL Shahnameh collective continues to monitor liquidity and governance updates.',
      tokenDescriptionError:
        'The REAL Shahnameh collective is retrying the DYOR feed. Refresh to attempt again.',
      tokenChartTitle: 'Price trajectory',
      tokenChartCaption: 'Rolling DYOR history for REAL on TON',
      tokenChartStatusWaiting: 'Waiting for DYOR chart data…',
      tokenChartStatusRange: 'Covering {{start}} – {{end}} (DYOR feed).',
      tokenChartStatusEmpty: 'DYOR has not provided price history yet.',
      tokenChartStatusError: 'Unable to render the DYOR chart right now.',
      tokenTransactionsTitle: 'Latest transactions',
      tokenTransactionsCaption: 'Streaming activity straight from DYOR',
      tokenTransactionsStatusWaiting: 'Loading live flow…',
      tokenTransactionsStatusLive: 'Live transactions pulled from DYOR.',
      tokenTransactionsStatusEmpty: 'DYOR has not published recent REAL transactions yet.',
      tokenTransactionsStatusError: 'Unable to load the latest REAL transactions.',
      tokenFooterLink: 'View full token dossier on DYOR',
      dappOverline: 'Shahnameh dossier',
      dappTitle: 'REAL Shahnameh experience',
      dappSummary:
        'Every insight is curated by the REAL Shahnameh team. Data points below are streamed from DYOR’s Shahnameh profile.',
      dappSummaryLoading: 'Loading the living chronicle…',
      dappSummaryMissing: 'DYOR has not published a description for this dapp yet.',
      dappSummaryError: 'The REAL Shahnameh team could not load the DYOR dapp feed. Please refresh to retry.',
      dappRoadmapTitle: 'Season roadmap',
      dappRoadmapCaption: 'We are between Season I and II — curated for the REAL Shahnameh community',
      dappRoadmapLoading: 'Loading Shahnameh timeline…',
      dappInsightsTitle: 'Key streams watched by the team',
      dappInsightsLoading: 'Awaiting DYOR highlights…',
      dappInsightsUnavailable: 'DYOR has not exposed this metric yet.',
      dappSocialLink: "Explore Shahnameh's DYOR social hub",
      dappFooterLink: 'Open Shahnameh on DYOR',
      footerRights: '© {{year}} REAL Shahnameh. All rights reserved.',
      usdSuffix: 'USD',
      transactionFallback: 'Transaction',
      timeJustNow: 'just now',
      timeMinutesAgo: '{{minutes}}m ago',
      timeHoursAgo: '{{hours}}h ago',
      timeDaysAgo: '{{days}}d ago',
      socialLabelX: 'Follow Shahnameh on X',
      socialLabelTelegram: 'Join Shahnameh on Telegram',
      socialLabelDiscord: 'Enter Shahnameh on Discord',
      socialLabelWebsite: 'Visit Shahnameh website',
      socialLabelMedium: 'Read Shahnameh updates on Medium',
      socialLabelGeneric: 'Explore Shahnameh social feed',
      roadmapFallbackTitle1: 'Season I — Dawn of the Epic',
      roadmapFallbackDesc1:
        'Opening season delivered the first playable tales and anchored REAL as the currency of heroic progression.',
      roadmapFallbackTime1: 'Season I (complete)',
      roadmapFallbackTitle2: 'Interlude — Between Seasons',
      roadmapFallbackDesc2:
        'Community quests, lore drops, and balancing updates bridge the gap as the REAL Shahnameh team curates the transition.',
      roadmapFallbackTime2: 'Current moment',
      roadmapFallbackTitle3: 'Season II — Ascending Legends',
      roadmapFallbackDesc3:
        'Season two readies fresh sagas, upgraded on-chain rewards, and deeper REAL token integrations.',
      roadmapFallbackTime3: 'Season II (in development)',
      insightUsers24h: 'Users 24h',
      insightVolume24h: 'Volume 24h',
      insightTransactions24h: 'Transactions 24h',
      insightTVL: 'TVL',
    },
  },
  fa: {
    label: 'فارسی',
    dir: 'rtl',
    locale: 'fa-IR',
    strings: {
      brandTitle: 'REAL شاهنامه',
      languageLabel: 'زبان',
      tokenOverline: 'نبض لحظه‌ای توکن',
      tokenTitle: 'توکن REAL در DYOR',
      tokenSummary:
        'فید مستقیم DYOR جامعه REAL شاهنامه را از نقدینگی، احساس بازار و شتاب روی TON باخبر نگه می‌دارد.',
      tokenPriceLabel: 'قیمت (دلار)',
      tokenChangeLabel: 'تغییر ۲۴ ساعته',
      tokenVolumeLabel: 'حجم ۲۴ ساعته',
      tokenMarketCapLabel: 'ارزش بازار',
      tokenUpdatedWaiting: 'در انتظار آخرین بلاک DYOR…',
      tokenUpdatedSynced: 'همگام‌سازی {{timestamp}} (منبع DYOR)',
      tokenUpdatedFallback: 'از DYOR همگام‌سازی شد.',
      tokenUpdatedError: 'در حال حاضر دسترسی به فید توکن DYOR ممکن نیست.',
      tokenDescriptionPlaceholder:
        'به‌محض بارگذاری داده‌ها، شاخص‌های DYOR برای توکن REAL اینجا نمایش داده می‌شود تا روایت با اعداد موثق پیش برود.',
      tokenDescriptionMissing:
        'DYOR هنوز روایت رسمی برای توکن REAL منتشر نکرده است. تیم REAL شاهنامه همچنان نقدینگی و حاکمیت را زیر نظر دارد.',
      tokenDescriptionError:
        'تیم REAL شاهنامه دوباره تلاش می‌کند فید DYOR را بازیابی کند. لطفاً صفحه را بازآوری کنید.',
      tokenChartTitle: 'مسیر قیمت',
      tokenChartCaption: 'تاریخچه DYOR برای REAL روی TON',
      tokenChartStatusWaiting: 'در انتظار داده‌های نمودار DYOR…',
      tokenChartStatusRange: 'پوشش از {{start}} تا {{end}} (منبع DYOR).',
      tokenChartStatusEmpty: 'DYOR هنوز تاریخچه قیمتی منتشر نکرده است.',
      tokenChartStatusError: 'نمایش نمودار DYOR ممکن نشد.',
      tokenTransactionsTitle: 'تراکنش‌های اخیر',
      tokenTransactionsCaption: 'جریان زنده مستقیماً از DYOR',
      tokenTransactionsStatusWaiting: 'در حال بارگذاری جریان زنده…',
      tokenTransactionsStatusLive: 'تراکنش‌های زنده از DYOR واکشی شد.',
      tokenTransactionsStatusEmpty: 'DYOR هنوز تراکنش تازه‌ای برای REAL منتشر نکرده است.',
      tokenTransactionsStatusError: 'بارگذاری تازه‌ترین تراکنش‌های REAL ممکن نشد.',
      tokenFooterLink: 'مشاهده پرونده کامل توکن در DYOR',
      dappOverline: 'پرونده شاهنامه',
      dappTitle: 'تجربه REAL شاهنامه',
      dappSummary:
        'هر بینش توسط تیم REAL شاهنامه کیوریت شده است. داده‌های زیر از پروفایل شاهنامه در DYOR پخش می‌شود.',
      dappSummaryLoading: 'وقایع‌نامه زنده در حال بارگذاری است…',
      dappSummaryMissing: 'DYOR هنوز توضیحی برای این برنامه منتشر نکرده است.',
      dappSummaryError: 'تیم REAL شاهنامه نتوانست فید dapp DYOR را بارگیری کند. لطفاً دوباره تلاش کنید.',
      dappRoadmapTitle: 'نقشه‌راه فصل‌ها',
      dappRoadmapCaption: 'در گذر میان فصل اول و دوم ـ برای جامعه REAL شاهنامه کیوریت شده است',
      dappRoadmapLoading: 'زمان‌بندی شاهنامه در حال بارگذاری است…',
      dappInsightsTitle: 'جریان‌های کلیدی زیر نظر تیم',
      dappInsightsLoading: 'در انتظار هایلایت‌های DYOR…',
      dappInsightsUnavailable: 'DYOR هنوز این شاخص را منتشر نکرده است.',
      dappSocialLink: 'مرکز اجتماعی DYOR شاهنامه را ببینید',
      dappFooterLink: 'شاهنامه را در DYOR باز کنید',
      footerRights: '© {{year}} REAL شاهنامه. تمام حقوق محفوظ است.',
      usdSuffix: 'دلار آمریکا',
      transactionFallback: 'تراکنش',
      timeJustNow: 'همین حالا',
      timeMinutesAgo: '{{minutes}} دقیقه پیش',
      timeHoursAgo: '{{hours}} ساعت پیش',
      timeDaysAgo: '{{days}} روز پیش',
      socialLabelX: 'شاهنامه را در ایکس دنبال کنید',
      socialLabelTelegram: 'به تلگرام شاهنامه بپیوندید',
      socialLabelDiscord: 'به دیسکورد شاهنامه وارد شوید',
      socialLabelWebsite: 'وب‌سایت شاهنامه را ببینید',
      socialLabelMedium: 'به‌روزرسانی‌های شاهنامه در مدیوم',
      socialLabelGeneric: 'شبکه‌های اجتماعی شاهنامه را مرور کنید',
      roadmapFallbackTitle1: 'فصل اول ـ طلوع حماسه',
      roadmapFallbackDesc1:
        'فصل نخست نخستین داستان‌های قابل بازی را عرضه کرد و REAL را به ارز پیشروی قهرمانان بدل ساخت.',
      roadmapFallbackTime1: 'فصل اول (تکمیل‌شده)',
      roadmapFallbackTitle2: 'میان‌پرده ـ بین فصل‌ها',
      roadmapFallbackDesc2:
        'ماموریت‌های جامعه، افشای لور و به‌روزرسانی‌های تعادل، پل گذار تیم REAL شاهنامه را رقم می‌زند.',
      roadmapFallbackTime2: 'لحظه اکنون',
      roadmapFallbackTitle3: 'فصل دوم ـ افسانه‌های اوج‌گیر',
      roadmapFallbackDesc3:
        'فصل دوم با داستان‌های تازه، پاداش‌های درون زنجیره ارتقا یافته و یکپارچگی عمیق‌تر REAL آماده می‌شود.',
      roadmapFallbackTime3: 'فصل دوم (در حال توسعه)',
      insightUsers24h: 'کاربران ۲۴ ساعته',
      insightVolume24h: 'حجم ۲۴ ساعته',
      insightTransactions24h: 'تراکنش‌های ۲۴ ساعته',
      insightTVL: 'ارزش قفل‌شده',
    },
  },
};

const DEFAULT_LANGUAGE = 'en';

const tokenAddress = 'EQDhq_DjQUMJqfXLP8K8J6SlOvon08XQQK0T49xon2e0xU8p';
const tokenNetwork = 'ton';

const FALLBACK_ROADMAP = [
  {
    titleKey: 'roadmapFallbackTitle1',
    descriptionKey: 'roadmapFallbackDesc1',
    timeframeKey: 'roadmapFallbackTime1',
    state: 'complete',
  },
  {
    titleKey: 'roadmapFallbackTitle2',
    descriptionKey: 'roadmapFallbackDesc2',
    timeframeKey: 'roadmapFallbackTime2',
    state: 'current',
  },
  {
    titleKey: 'roadmapFallbackTitle3',
    descriptionKey: 'roadmapFallbackDesc3',
    timeframeKey: 'roadmapFallbackTime3',
    state: 'upcoming',
  },
];

let currentLanguage = DEFAULT_LANGUAGE;
let formatterCurrency;
let formatterPercent;
let compactFormatter;
let dateFormatter;
let dateTimeFormatter;
let integerFormatter;

let cachedTokenEntry = null;
let cachedTokenHistory = null;
let cachedTransactions = null;
let cachedDappEntry = null;
let cachedDappTags = null;
let cachedRoadmapItems = null;
let cachedInsights = null;
let cachedSocialLink = null;

let tokenUpdatedState = { type: 'waiting' };
let chartStatusState = { type: 'waiting' };
let transactionStatusState = { type: 'waiting' };
let tokenDescriptionState = { type: 'placeholder', content: null };
let dappSummaryState = { type: 'loading', content: null };
let insightsState = 'loading';

function getLanguageConfig(language) {
  return LANGUAGES[language] ?? LANGUAGES[DEFAULT_LANGUAGE];
}

function configureFormatters(locale) {
  formatterCurrency = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 6,
  });

  formatterPercent = new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 2,
  });

  compactFormatter = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 2,
  });

  dateFormatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  });

  dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  integerFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  });
}

function formatNumber(value) {
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  try {
    return integerFormatter ? integerFormatter.format(value) : String(value);
  } catch (error) {
    return String(value);
  }
}

function translate(key, params) {
  const config = getLanguageConfig(currentLanguage);
  const fallback = LANGUAGES[DEFAULT_LANGUAGE];
  let template = config.strings[key];
  if (template === undefined) {
    template = fallback?.strings?.[key];
  }
  if (template === undefined) {
    return key;
  }
  if (typeof template === 'function') {
    return template(params ?? {});
  }
  if (!params) {
    return template;
  }
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, token) => {
    const value = params[token];
    return value === undefined || value === null ? '' : String(value);
  });
}

function applyStaticText() {
  Object.entries(staticTextMap).forEach(([key, node]) => {
    if (!node) return;
    if (key === 'footerRights') {
      const year = formatNumber(new Date().getFullYear());
      node.textContent = translate(key, { year });
      return;
    }
    node.textContent = translate(key);
  });
}

function updateDocumentLanguage(language) {
  const config = getLanguageConfig(language);
  document.documentElement.lang = language;
  document.documentElement.dir = config.dir ?? 'ltr';
}

function updateTokenUpdatedText() {
  if (!tokenSelectors.updated) return;
  if (tokenUpdatedState.type === 'synced' && tokenUpdatedState.timestamp) {
    const formatted = dateTimeFormatter.format(new Date(tokenUpdatedState.timestamp));
    tokenSelectors.updated.textContent = translate('tokenUpdatedSynced', { timestamp: formatted });
    return;
  }
  if (tokenUpdatedState.type === 'fallback') {
    tokenSelectors.updated.textContent = translate('tokenUpdatedFallback');
    return;
  }
  if (tokenUpdatedState.type === 'error') {
    tokenSelectors.updated.textContent = translate('tokenUpdatedError');
    return;
  }
  tokenSelectors.updated.textContent = translate('tokenUpdatedWaiting');
}

function updateChartStatusText() {
  if (!chartSelectors.status) return;
  if (chartStatusState.type === 'range' && chartStatusState.start && chartStatusState.end) {
    const start = dateFormatter.format(new Date(chartStatusState.start));
    const end = dateFormatter.format(new Date(chartStatusState.end));
    chartSelectors.status.textContent = translate('tokenChartStatusRange', { start, end });
    chartSelectors.status.hidden = false;
    return;
  }
  if (chartStatusState.type === 'empty') {
    chartSelectors.status.textContent = translate('tokenChartStatusEmpty');
    chartSelectors.status.hidden = false;
    return;
  }
  if (chartStatusState.type === 'error') {
    chartSelectors.status.textContent = translate('tokenChartStatusError');
    chartSelectors.status.hidden = false;
    return;
  }
  chartSelectors.status.textContent = translate('tokenChartStatusWaiting');
  chartSelectors.status.hidden = false;
}

function updateTransactionStatusText() {
  if (!transactionSelectors.status) return;
  if (transactionStatusState.type === 'live') {
    transactionSelectors.status.textContent = translate('tokenTransactionsStatusLive');
    transactionSelectors.status.hidden = false;
    return;
  }
  if (transactionStatusState.type === 'empty') {
    transactionSelectors.status.textContent = translate('tokenTransactionsStatusEmpty');
    transactionSelectors.status.hidden = false;
    return;
  }
  if (transactionStatusState.type === 'error') {
    transactionSelectors.status.textContent = translate('tokenTransactionsStatusError');
    transactionSelectors.status.hidden = false;
    return;
  }
  transactionSelectors.status.textContent = translate('tokenTransactionsStatusWaiting');
  transactionSelectors.status.hidden = false;
}

function applyLanguage(language) {
  const config = getLanguageConfig(language);
  currentLanguage = language in LANGUAGES ? language : DEFAULT_LANGUAGE;
  if (languageSelect && languageSelect.value !== currentLanguage) {
    languageSelect.value = currentLanguage;
  }
  updateDocumentLanguage(currentLanguage);
  configureFormatters(config.locale);
  applyStaticText();
  updateTokenUpdatedText();
  updateChartStatusText();
  updateTransactionStatusText();
  renderTokenOverview(cachedTokenEntry);
  updateTokenDescription();
  renderTokenChart(cachedTokenHistory);
  renderTransactions(cachedTransactions);
  updateDappSummary();
  renderDappTags(cachedDappTags);
  renderInsights(cachedInsights);
  renderRoadmap(cachedRoadmapItems);
  renderSocialLink(cachedSocialLink);
  try {
    localStorage.setItem('preferred-language', currentLanguage);
  } catch (error) {
    // ignore storage errors
  }
}

function updateTokenDescription() {
  if (!tokenSelectors.description) return;
  let html;
  if (tokenDescriptionState.type === 'content' && tokenDescriptionState.content) {
    html = `<p>${tokenDescriptionState.content}</p>`;
  } else if (tokenDescriptionState.type === 'missing') {
    html = `<p>${translate('tokenDescriptionMissing')}</p>`;
  } else if (tokenDescriptionState.type === 'error') {
    html = `<p>${translate('tokenDescriptionError')}</p>`;
  } else {
    html = `<p>${translate('tokenDescriptionPlaceholder')}</p>`;
  }
  tokenSelectors.description.innerHTML = html;
}

function renderTokenOverview(entry) {
  cachedTokenEntry = entry ?? null;

  if (!entry) {
    setTextContent(tokenSelectors.price, '—');
    setTextContent(tokenSelectors.change, '—');
    setTextContent(tokenSelectors.volume, '—');
    setTextContent(tokenSelectors.cap, '—');
    if (tokenDescriptionState.type !== 'error') {
      tokenDescriptionState = { type: 'placeholder', content: null };
    }
    return;
  }

  const price = Number(
    resolveTokenField(entry, [
      'price.usd',
      'priceUsd',
      'price.priceUsd',
      'marketData.priceUsd',
      'metrics.price.usd',
    ]),
  );

  const change = Number(
    resolveTokenField(entry, [
      'price.change24hPercent',
      'priceChange24hPercent',
      'change24hPercent',
      'metrics.change24hPercent',
    ]),
  );

  const volume = Number(
    resolveTokenField(entry, [
      'volume.usd24h',
      'volume24h.usd',
      'volume24hUsd',
      'metrics.volume24h.usd',
    ]),
  );

  const marketCap = Number(
    resolveTokenField(entry, [
      'marketCap.usd',
      'marketcap.usd',
      'market_cap.usd',
      'metrics.marketCap.usd',
    ]),
  );

  setTextContent(tokenSelectors.price, formatCurrency(price));
  setTextContent(tokenSelectors.change, formatPercent(change));
  setTextContent(tokenSelectors.volume, formatCompact(volume));
  setTextContent(tokenSelectors.cap, formatCompact(marketCap));

  const rawDescription = resolveTokenField(entry, ['description', 'summary', 'details', 'about']);
  const description = typeof rawDescription === 'string' ? rawDescription.trim() : '';

  if (description) {
    tokenDescriptionState = { type: 'content', content: description };
  } else if (tokenDescriptionState.type !== 'error') {
    tokenDescriptionState = { type: 'missing', content: null };
  }
}

function updateDappSummary() {
  if (!dappSelectors.summary) return;
  if (dappSummaryState.type === 'content' && dappSummaryState.content) {
    dappSelectors.summary.textContent = dappSummaryState.content;
  } else if (dappSummaryState.type === 'missing') {
    dappSelectors.summary.textContent = translate('dappSummaryMissing');
  } else if (dappSummaryState.type === 'error') {
    dappSelectors.summary.textContent = translate('dappSummaryError');
  } else {
    dappSelectors.summary.textContent = translate('dappSummaryLoading');
  }
}

function renderDappTags(tags) {
  cachedDappTags = Array.isArray(tags) && tags.length ? tags.slice(0, 6) : null;
  if (!dappSelectors.tags) return;
  dappSelectors.tags.innerHTML = '';
  if (cachedDappTags) {
    cachedDappTags.forEach((tag) => {
      const li = document.createElement('li');
      li.textContent = tag;
      dappSelectors.tags.appendChild(li);
    });
  }
}

function renderInsights(insights) {
  if (Array.isArray(insights)) {
    cachedInsights = insights;
    insightsState = insights.length ? 'ready' : 'empty';
  } else if (insights === null) {
    cachedInsights = null;
    insightsState = 'loading';
  }

  if (!dappSelectors.insights) return;
  dappSelectors.insights.innerHTML = '';

  if (insightsState === 'loading') {
    const li = document.createElement('li');
    li.textContent = translate('dappInsightsLoading');
    dappSelectors.insights.appendChild(li);
    return;
  }

  if (insightsState === 'empty' || !cachedInsights || !cachedInsights.length) {
    buildList(dappSelectors.insights, null);
    return;
  }

  const formatted = cachedInsights.map((item) => {
    let valueText = '';
    if (item.format === 'compactCurrency') {
      valueText = formatCompact(item.value);
    } else if (item.format === 'number') {
      valueText = formatNumber(Math.round(item.value));
    } else if (item.format === 'compact') {
      valueText = compactFormatter.format(item.value);
    } else if (item.value !== undefined && item.value !== null) {
      valueText = String(item.value);
    }
    const displayValue = valueText ? valueText : '—';
    return `${translate(item.key)}: ${displayValue}`;
  });

  buildList(dappSelectors.insights, formatted);
}

function resolveTokenField(entry, candidates) {
  for (const key of candidates) {
    const parts = key.split('.');
    let value = entry;
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined || value === null) break;
    }
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function formatCurrency(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  if (value === 0) return formatterCurrency.format(0);
  if (Math.abs(value) < 0.000001) {
    const suffix = translate('usdSuffix');
    return `${value.toExponential(2)} ${suffix}`.trim();
  }
  return formatterCurrency.format(value);
}

function formatPercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return formatterPercent.format(value / 100);
}

function formatCompact(value, suffix = 'USD') {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  const translatedSuffix = suffix === 'USD' ? translate('usdSuffix') : suffix;
  return translatedSuffix ? `${compactFormatter.format(value)} ${translatedSuffix}` : compactFormatter.format(value);
}

function setTextContent(node, text) {
  if (!node) return;
  node.textContent = text;
}

function setHidden(node, hidden) {
  if (!node) return;
  node.hidden = hidden;
}

async function requestTrpc(endpoint, payload) {
  const response = await fetch(`https://dyor.io/api/trpc/${endpoint}?batch=1`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload ?? { 0: { json: {} } }),
  });

  if (!response.ok) {
    throw new Error(`DYOR ${endpoint} ${response.status}`);
  }

  const body = await response.json();
  return body?.[0]?.result?.data?.json ?? body?.[0]?.result?.data ?? body;
}

function asNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.+-eE]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseTime(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') {
    const normalised = value < 1_000_000_000_000 ? value * 1000 : value;
    return Number.isFinite(normalised) ? normalised : null;
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function normalisePriceHistoryCandidate(candidate) {
  if (!candidate) return [];

  const inspectArray = (array) => {
    const points = [];
    array.forEach((item) => {
      if (!item) return;
      if (Array.isArray(item)) {
        const time = parseTime(item[0]);
        const value = asNumber(item[1]);
        if (time !== null && value !== null) {
          points.push({ time, value });
        }
        return;
      }
      if (typeof item === 'object') {
        const time = parseTime(
          item.timestamp ?? item.time ?? item.date ?? item[0] ?? item.t ?? item.ts ?? item.at,
        );
        const value =
          asNumber(item.price ?? item.priceUsd ?? item.value ?? item.usd ?? item.close ?? item.amount) ??
          asNumber(item.y);
        if (time !== null && value !== null) {
          points.push({ time, value });
        }
      }
    });
    return points;
  };

  if (Array.isArray(candidate)) {
    const direct = inspectArray(candidate);
    if (direct.length) return direct;
  }

  if (typeof candidate === 'object') {
    const keys = ['prices', 'series', 'history', 'usd', 'points', 'values', 'data', 'items'];
    for (const key of keys) {
      const nested = candidate[key];
      if (Array.isArray(nested)) {
        const points = inspectArray(nested);
        if (points.length) return points;
      }
    }
    if (Array.isArray(candidate.entries)) {
      const points = inspectArray(candidate.entries);
      if (points.length) return points;
    }
  }

  return [];
}

function extractPriceHistory(entry) {
  if (!entry || typeof entry !== 'object') return [];
  const candidates = [
    entry.marketChart?.prices,
    entry.marketChart,
    entry.chart?.prices,
    entry.chart,
    entry.priceHistory,
    entry.history,
    entry.prices,
    entry.series,
    entry.data?.prices,
  ];

  for (const candidate of candidates) {
    const points = normalisePriceHistoryCandidate(candidate);
    if (points.length) {
      return points.sort((a, b) => a.time - b.time);
    }
  }

  return [];
}

function drawPriceChart(canvas, points) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, width, height);

  if (!points.length) {
    return;
  }

  const values = points.map((point) => point.value);
  const times = points.map((point) => point.time);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const padding = 32;

  const mapX = (time) => {
    if (maxTime === minTime) return padding;
    return padding + ((time - minTime) / (maxTime - minTime)) * (width - padding * 2);
  };

  const mapY = (value) => {
    if (maxValue === minValue) return height / 2;
    return height - (padding + ((value - minValue) / (maxValue - minValue)) * (height - padding * 2));
  };

  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  const firstX = mapX(points[0].time);
  const firstY = mapY(points[0].value);

  ctx.beginPath();
  ctx.moveTo(firstX, firstY);
  points.forEach((point) => {
    ctx.lineTo(mapX(point.time), mapY(point.value));
  });
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.lineTo(mapX(points[points.length - 1].time), height - padding);
  ctx.lineTo(firstX, height - padding);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();
}

function renderTokenChart(points) {
  if (!chartSelectors.canvas) return;

  if (!Array.isArray(points)) {
    cachedTokenHistory = null;
    chartStatusState = { type: 'waiting' };
    updateChartStatusText();
    drawPriceChart(chartSelectors.canvas, []);
    return;
  }

  cachedTokenHistory = points;
  drawPriceChart(chartSelectors.canvas, points);

  if (points.length) {
    chartStatusState = {
      type: 'range',
      start: points[0].time,
      end: points[points.length - 1].time,
    };
  } else {
    chartStatusState = { type: 'empty' };
  }
  updateChartStatusText();
}

async function hydrateTokenChart(entry) {
  chartStatusState = { type: 'waiting' };
  updateChartStatusText();
  try {
    const localHistory = extractPriceHistory(entry);
    if (localHistory.length) {
      renderTokenChart(localHistory);
      return;
    }

    const attempts = [
      {
        endpoint: 'token.marketChart',
        payload: {
          0: {
            json: {
              address: tokenAddress,
              network: tokenNetwork,
              range: '7d',
              resolution: '1h',
            },
          },
        },
      },
      {
        endpoint: 'token.history',
        payload: {
          0: {
            json: {
              address: tokenAddress,
              network: tokenNetwork,
              window: '7d',
            },
          },
        },
      },
      {
        endpoint: 'token.chart',
        payload: {
          0: {
            json: {
              address: tokenAddress,
              network: tokenNetwork,
            },
          },
        },
      },
    ];

    for (const attempt of attempts) {
      try {
        const response = await requestTrpc(attempt.endpoint, attempt.payload);
        const history = extractPriceHistory(response);
        if (history.length) {
          renderTokenChart(history);
          return;
        }
      } catch (error) {
        console.error(error);
      }
    }

    renderTokenChart([]);
  } catch (error) {
    console.error(error);
    chartStatusState = { type: 'error' };
    updateChartStatusText();
  }
}

function normaliseTransactions(array) {
  if (!Array.isArray(array)) return [];
  return array
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const hash = item.hash ?? item.txHash ?? item.transactionHash ?? item.id ?? item.signature ?? null;
      const from = item.from ?? item.sender ?? item.owner ?? item.source ?? null;
      const to = item.to ?? item.recipient ?? item.target ?? item.destination ?? null;
      const amountToken =
        asNumber(item.amount ?? item.value ?? item.quantity ?? item.volume ?? item.tokenAmount ?? item.realAmount) ?? null;
      const amountUsd =
        asNumber(item.amountUsd ?? item.valueUsd ?? item.usdValue ?? item.priceUsd ?? item.volumeUsd ?? item.usd) ?? null;
      const timestamp =
        parseTime(item.timestamp ?? item.time ?? item.date ?? item.blockTime ?? item.createdAt ?? item.occurredAt);

      if (!hash && !from && !to && amountToken === null && amountUsd === null && timestamp === null) {
        return null;
      }

      return {
        hash,
        from,
        to,
        amountToken,
        amountUsd,
        timestamp,
      };
    })
    .filter(Boolean);
}

function extractTransactions(entry) {
  if (!entry) return [];

  const candidates = [];
  if (Array.isArray(entry)) candidates.push(entry);
  if (Array.isArray(entry.transactions)) candidates.push(entry.transactions);
  if (Array.isArray(entry.items)) candidates.push(entry.items);
  if (Array.isArray(entry.records)) candidates.push(entry.records);
  if (Array.isArray(entry.activity)) candidates.push(entry.activity);
  if (Array.isArray(entry.feed)) candidates.push(entry.feed);
  if (Array.isArray(entry.data?.transactions)) candidates.push(entry.data.transactions);
  if (Array.isArray(entry.result?.transactions)) candidates.push(entry.result.transactions);
  if (Array.isArray(entry.entries)) candidates.push(entry.entries);

  for (const candidate of candidates) {
    const normalised = normaliseTransactions(candidate);
    if (normalised.length) {
      return normalised.slice(0, 8);
    }
  }

  return [];
}

function formatAddress(address) {
  if (!address || typeof address !== 'string') return '—';
  if (address.length <= 12) return address;
  return `${address.slice(0, 5)}…${address.slice(-4)}`;
}

function formatHash(hash) {
  if (!hash) return translate('transactionFallback');
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 0) return '';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return translate('timeJustNow');
  if (minutes < 60) return translate('timeMinutesAgo', { minutes: formatNumber(minutes) });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate('timeHoursAgo', { hours: formatNumber(hours) });
  const days = Math.floor(hours / 24);
  return translate('timeDaysAgo', { days: formatNumber(days) });
}

function renderTransactions(transactions) {
  const items = Array.isArray(transactions) ? transactions : [];
  cachedTransactions = Array.isArray(transactions) ? transactions : null;
  if (!transactionSelectors.list) return;
  transactionSelectors.list.innerHTML = '';

  if (!items.length) {
    transactionStatusState = Array.isArray(transactions) ? 'empty' : 'waiting';
    updateTransactionStatusText();
    return;
  }

  transactionStatusState = 'live';
  updateTransactionStatusText();

  items.forEach((transaction) => {
    const li = document.createElement('li');
    li.className = 'transaction-item';

    const primaryRow = document.createElement('div');
    primaryRow.className = 'transaction-item__row transaction-item__row--primary';
    primaryRow.innerHTML = `
      <span class="transaction-item__hash">${formatHash(transaction.hash)}</span>
      <span class="transaction-item__time">${formatTimeAgo(transaction.timestamp)}</span>
    `;

    const secondaryRow = document.createElement('div');
    secondaryRow.className = 'transaction-item__row transaction-item__row--secondary';
    const amountLabel =
      transaction.amountUsd !== null
        ? formatCompact(transaction.amountUsd)
        : transaction.amountToken !== null
        ? `${compactFormatter.format(transaction.amountToken)} REAL`
        : '—';
    secondaryRow.innerHTML = `
      <span class="transaction-item__route">${formatAddress(transaction.from)} → ${formatAddress(transaction.to)}</span>
      <span class="transaction-item__amount">${amountLabel}</span>
    `;

    li.appendChild(primaryRow);
    li.appendChild(secondaryRow);
    transactionSelectors.list.appendChild(li);
  });
}

async function hydrateTokenTransactions(entry) {
  transactionStatusState = 'waiting';
  updateTransactionStatusText();
  try {
    const localTransactions = extractTransactions(entry);
    if (localTransactions.length) {
      renderTransactions(localTransactions);
      return;
    }

    const attempts = [
      {
        endpoint: 'token.transactionsByAddress',
        payload: {
          0: {
            json: {
              address: tokenAddress,
              network: tokenNetwork,
              limit: 8,
            },
          },
        },
      },
      {
        endpoint: 'token.transactions',
        payload: {
          0: {
            json: {
              address: tokenAddress,
              network: tokenNetwork,
              limit: 8,
            },
          },
        },
      },
      {
        endpoint: 'token.activityFeed',
        payload: {
          0: {
            json: {
              address: tokenAddress,
              network: tokenNetwork,
              limit: 8,
            },
          },
        },
      },
    ];

    for (const attempt of attempts) {
      try {
        const response = await requestTrpc(attempt.endpoint, attempt.payload);
        const transactions = extractTransactions(response);
        if (transactions.length) {
          renderTransactions(transactions);
          return;
        }
      } catch (error) {
        console.error(error);
      }
    }

    renderTransactions([]);
  } catch (error) {
    console.error(error);
    transactionStatusState = 'error';
    updateTransactionStatusText();
  }
}

function buildList(list, items) {
  if (!list) return;
  list.innerHTML = '';
  if (!items || !items.length) {
    const li = document.createElement('li');
    li.textContent = translate('dappInsightsUnavailable');
    list.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  });
}

function resolveArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function interpretRoadmapState(status) {
  if (!status) return null;
  const value = status.toString().toLowerCase();
  if (value.includes('current') || value.includes('active') || value.includes('live')) return 'current';
  if (value.includes('complete') || value.includes('done') || value.includes('finished')) return 'complete';
  if (value.includes('upcoming') || value.includes('future') || value.includes('next')) return 'upcoming';
  return null;
}

function extractRoadmap(entry) {
  if (!entry || typeof entry !== 'object') return [];
  const sources = [];
  if (Array.isArray(entry.roadmap)) sources.push(entry.roadmap);
  if (Array.isArray(entry.timeline)) sources.push(entry.timeline);
  if (Array.isArray(entry.milestones)) sources.push(entry.milestones);
  if (Array.isArray(entry.roadmap?.items)) sources.push(entry.roadmap.items);
  if (Array.isArray(entry.timeline?.items)) sources.push(entry.timeline.items);

  for (const source of sources) {
    const items = source
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const state = interpretRoadmapState(item.state ?? item.status ?? item.progress);
        return {
          title: item.title ?? item.name ?? 'Roadmap item',
          description: item.description ?? item.summary ?? item.details ?? '',
          timeframe: item.timeframe ?? item.phase ?? item.period ?? '',
          state: state ?? 'upcoming',
        };
      })
      .filter((item) => item && item.title);

    if (items.length) {
      return items;
    }
  }

  return [];
}

function renderRoadmap(items) {
  if (!roadmapSelectors.list) return;
  const hasItems = Array.isArray(items) && items.length;
  cachedRoadmapItems = hasItems ? items : null;
  const roadmap = hasItems
    ? items
    : FALLBACK_ROADMAP.map((item) => ({
        title: translate(item.titleKey),
        description: translate(item.descriptionKey),
        timeframe: translate(item.timeframeKey),
        state: item.state,
      }));

  roadmapSelectors.list.innerHTML = '';
  roadmap.forEach((item) => {
    const li = document.createElement('li');
    li.className = `roadmap__item roadmap__item--${item.state ?? 'upcoming'}`;

    const title = document.createElement('h4');
    title.textContent = item.title;
    li.appendChild(title);

    if (item.timeframe) {
      const timeframe = document.createElement('p');
      timeframe.className = 'roadmap__timeframe';
      timeframe.textContent = item.timeframe;
      li.appendChild(timeframe);
    }

    if (item.description) {
      const description = document.createElement('p');
      description.className = 'roadmap__description';
      description.textContent = item.description;
      li.appendChild(description);
    }

    roadmapSelectors.list.appendChild(li);
  });
}

function resolveSocialLabelKey(key) {
  if (!key) return null;
  const value = key.toLowerCase();
  if (value.includes('twitter') || value === 'x') return 'socialLabelX';
  if (value.includes('telegram')) return 'socialLabelTelegram';
  if (value.includes('discord')) return 'socialLabelDiscord';
  if (value.includes('website') || value.includes('site')) return 'socialLabelWebsite';
  if (value.includes('medium')) return 'socialLabelMedium';
  return null;
}

function extractPrimarySocial(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const testObject = (object) => {
    if (!object || typeof object !== 'object') return null;
    const priorityKeys = ['twitter', 'x', 'telegram', 'discord', 'website', 'medium'];
    for (const key of priorityKeys) {
      const value = object[key];
      if (typeof value === 'string' && value.trim()) {
        return {
          url: value,
          labelKey: resolveSocialLabelKey(key) ?? 'socialLabelGeneric',
        };
      }
    }
    return null;
  };

  const objectResult = testObject(entry.socials) ?? testObject(entry.links) ?? testObject(entry.profiles);
  if (objectResult) return objectResult;

  const arrays = [];
  if (Array.isArray(entry.socials)) arrays.push(entry.socials);
  if (Array.isArray(entry.links)) arrays.push(entry.links);
  if (Array.isArray(entry.profiles)) arrays.push(entry.profiles);

  for (const array of arrays) {
    for (const item of array) {
      if (!item) continue;
      if (typeof item === 'string' && item.trim()) {
        return {
          url: item,
          labelKey: 'socialLabelGeneric',
        };
      }
      if (typeof item === 'object') {
        const url = item.url ?? item.href ?? item.link ?? item.value;
        if (typeof url === 'string' && url.trim()) {
          const key = (item.type ?? item.platform ?? item.label ?? '').toString();
          return {
            url,
            labelKey: resolveSocialLabelKey(key) ?? null,
            label: typeof item.label === 'string' ? item.label : null,
          };
        }
      }
    }
  }

  return null;
}

function renderSocialLink(social) {
  const fallback = { url: 'https://dyor.io/dapps/games/shahnameh', labelKey: 'dappSocialLink' };
  cachedSocialLink = social ?? null;
  const target = social ?? fallback;

  if (!socialSelectors.link) return;
  socialSelectors.link.href = target.url;
  const label = target.labelKey ? translate(target.labelKey) : target.label ?? translate('dappSocialLink');
  socialSelectors.link.textContent = label;
  if (socialSelectors.container) {
    setHidden(socialSelectors.container, false);
  }
}

function hydrateSocialLink(entry) {
  const social = extractPrimarySocial(entry);
  renderSocialLink(social);
}

async function fetchTokenData() {
  try {
    const payload = await requestTrpc('token.byAddress', {
      0: {
        json: {
          address: tokenAddress,
          network: tokenNetwork,
        },
      },
    });

    const entry = payload?.token ?? payload;
    if (!entry) {
      throw new Error('Token payload missing');
    }
    renderTokenOverview(entry);
    updateTokenDescription();

    const updatedAt = resolveTokenField(entry, ['updatedAt', 'lastUpdated', 'timestamp']);
    const parsedUpdated = parseTime(updatedAt);
    if (parsedUpdated) {
      tokenUpdatedState = { type: 'synced', timestamp: parsedUpdated };
    } else {
      tokenUpdatedState = { type: 'fallback' };
    }
    updateTokenUpdatedText();

    return entry;
  } catch (error) {
    console.error(error);
    tokenUpdatedState = { type: 'error' };
    tokenDescriptionState = { type: 'error', content: null };
    updateTokenUpdatedText();
    updateTokenDescription();
    return null;
  }
}

async function fetchDappData() {
  dappSummaryState = { type: 'loading', content: null };
  updateDappSummary();
  let entry = null;
  try {
    const payload = await requestTrpc('dapp.bySlug', {
      0: {
        json: {
          slug: 'shahnameh',
        },
      },
    });

    entry = payload?.dapp ?? payload;
    if (!entry) {
      throw new Error('Dapp payload missing');
    }

    cachedDappEntry = entry;

    const summary = entry?.description ?? entry?.summary ?? entry?.about ?? null;
    if (summary && typeof summary === 'string') {
      dappSummaryState = { type: 'content', content: summary };
    } else {
      dappSummaryState = { type: 'missing', content: null };
    }
    updateDappSummary();

    const tags = [
      ...resolveArray(entry?.categories),
      ...resolveArray(entry?.chains ?? entry?.networks),
    ];
    renderDappTags(tags);

    const insightCandidates = [
      { key: 'insightUsers24h', value: entry?.metrics?.users24h ?? entry?.users24h, format: 'number' },
      { key: 'insightVolume24h', value: entry?.metrics?.volume24hUsd ?? entry?.volume24hUsd, format: 'compactCurrency' },
      { key: 'insightTransactions24h', value: entry?.metrics?.tx24h ?? entry?.transactions24h, format: 'number' },
      { key: 'insightTVL', value: entry?.metrics?.tvlUsd ?? entry?.tvlUsd, format: 'compactCurrency' },
    ].filter((item) => typeof item.value === 'number' && !Number.isNaN(item.value));

    renderInsights(insightCandidates.length ? insightCandidates : []);
  } catch (error) {
    console.error(error);
    dappSummaryState = { type: 'error', content: null };
    updateDappSummary();
    renderDappTags(null);
    renderInsights([]);
    cachedDappEntry = null;
  }

  renderRoadmap(entry ? extractRoadmap(entry) : null);
  hydrateSocialLink(entry);
}

(function initialiseLanguage() {
  let stored = null;
  try {
    stored = localStorage.getItem('preferred-language');
  } catch (error) {
    stored = null;
  }
  const initialLanguage = stored && stored in LANGUAGES ? stored : DEFAULT_LANGUAGE;
  if (languageSelect) {
    languageSelect.value = initialLanguage;
    languageSelect.addEventListener('change', (event) => {
      applyLanguage(event.target.value);
    });
  }
  applyLanguage(initialLanguage);
})();

(async () => {
  const tokenEntry = await fetchTokenData();
  await Promise.all([hydrateTokenChart(tokenEntry), hydrateTokenTransactions(tokenEntry)]);
})();

fetchDappData();
