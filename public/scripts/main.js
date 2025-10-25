const yearEl = document.querySelector('[data-year]');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

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

const formatterCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 6,
});

const formatterPercent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const tokenAddress = 'EQDhq_DjQUMJqfXLP8K8J6SlOvon08XQQK0T49xon2e0xU8p';
const tokenNetwork = 'ton';

const FALLBACK_ROADMAP = [
  {
    title: 'Season I — Dawn of the Epic',
    description:
      'Opening season delivered the first playable tales and anchored REAL as the currency of heroic progression.',
    timeframe: 'Season I (complete)',
    state: 'complete',
  },
  {
    title: 'Interlude — Between Seasons',
    description:
      'Community quests, lore drops, and balancing updates bridge the gap as Khabat Setaei curates the transition.',
    timeframe: 'Current moment',
    state: 'current',
  },
  {
    title: 'Season II — Ascending Legends',
    description:
      'Season two readies fresh sagas, upgraded on-chain rewards, and deeper REAL token integrations.',
    timeframe: 'Season II (in development)',
    state: 'upcoming',
  },
];

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
    return `${value.toExponential(2)} USD`;
  }
  return formatterCurrency.format(value);
}

function formatPercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return formatterPercent.format(value / 100);
}

function formatCompact(value, suffix = 'USD') {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return `${compactFormatter.format(value)} ${suffix}`;
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
  drawPriceChart(chartSelectors.canvas, points);

  if (chartSelectors.status) {
    if (points.length) {
      const start = new Date(points[0].time);
      const end = new Date(points[points.length - 1].time);
      chartSelectors.status.textContent = `Covering ${dateFormatter.format(start)} – ${dateFormatter.format(end)} (DYOR feed).`;
      setHidden(chartSelectors.status, false);
    } else {
      chartSelectors.status.textContent = 'DYOR has not provided price history yet.';
      setHidden(chartSelectors.status, false);
    }
  }
}

async function hydrateTokenChart(entry) {
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
    if (chartSelectors.status) {
      chartSelectors.status.textContent = 'Unable to render the DYOR chart right now.';
      setHidden(chartSelectors.status, false);
    }
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
  if (!hash) return 'Transaction';
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 0) return '';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function renderTransactions(transactions) {
  if (!transactionSelectors.list) return;
  transactionSelectors.list.innerHTML = '';

  if (!transactions.length) {
    if (transactionSelectors.status) {
      transactionSelectors.status.textContent = 'DYOR has not published recent REAL transactions yet.';
      setHidden(transactionSelectors.status, false);
    }
    return;
  }

  if (transactionSelectors.status) {
    transactionSelectors.status.textContent = 'Live transactions pulled from DYOR.';
    setHidden(transactionSelectors.status, false);
  }

  transactions.forEach((transaction) => {
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
    if (transactionSelectors.status) {
      transactionSelectors.status.textContent = 'Unable to load the latest REAL transactions.';
      setHidden(transactionSelectors.status, false);
    }
  }
}

function buildList(list, items) {
  if (!list) return;
  list.innerHTML = '';
  if (!items || !items.length) {
    const li = document.createElement('li');
    li.textContent = 'DYOR has not exposed this metric yet.';
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
  const roadmap = items && items.length ? items : FALLBACK_ROADMAP;

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

function labelForSocialKey(key) {
  if (!key) return null;
  const value = key.toLowerCase();
  if (value.includes('twitter') || value === 'x') return "Follow Shahnameh on X";
  if (value.includes('telegram')) return 'Join Shahnameh on Telegram';
  if (value.includes('discord')) return 'Enter Shahnameh on Discord';
  if (value.includes('website') || value.includes('site')) return 'Visit Shahnameh website';
  if (value.includes('medium')) return 'Read Shahnameh updates on Medium';
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
          label: labelForSocialKey(key) ?? 'Explore Shahnameh social feed',
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
          label: 'Explore Shahnameh social feed',
        };
      }
      if (typeof item === 'object') {
        const url = item.url ?? item.href ?? item.link ?? item.value;
        if (typeof url === 'string' && url.trim()) {
          const key = (item.type ?? item.platform ?? item.label ?? '').toString();
          return {
            url,
            label: labelForSocialKey(key) ?? (item.label || 'Explore Shahnameh social feed'),
          };
        }
      }
    }
  }

  return null;
}

function hydrateSocialLink(entry) {
  if (!socialSelectors.link) return;
  const social = extractPrimarySocial(entry);
  if (social) {
    socialSelectors.link.href = social.url;
    socialSelectors.link.textContent = social.label;
    setHidden(socialSelectors.container, false);
  } else {
    socialSelectors.link.href = 'https://dyor.io/dapps/games/shahnameh';
    socialSelectors.link.textContent = "Explore Shahnameh's DYOR social hub";
    if (socialSelectors.container) {
      setHidden(socialSelectors.container, false);
    }
  }
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

    const description =
      resolveTokenField(entry, ['description', 'summary', 'details', 'about']) ??
      'DYOR has not published a narrative for the REAL token. Khabat Setaei continues to monitor liquidity and governance updates.';

    const updatedAt = resolveTokenField(entry, ['updatedAt', 'lastUpdated', 'timestamp']);

    setTextContent(tokenSelectors.price, formatCurrency(price));
    setTextContent(tokenSelectors.change, formatPercent(change));
    setTextContent(tokenSelectors.volume, formatCompact(volume));
    setTextContent(tokenSelectors.cap, formatCompact(marketCap));

    if (tokenSelectors.description) {
      tokenSelectors.description.innerHTML = `<p>${description}</p>`;
    }

    if (tokenSelectors.updated) {
      if (updatedAt) {
        try {
          const date = new Date(updatedAt);
          const formatted = Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(date);
          tokenSelectors.updated.textContent = `Synced ${formatted} (DYOR)`;
        } catch (error) {
          tokenSelectors.updated.textContent = 'Synced from DYOR.';
        }
      } else {
        tokenSelectors.updated.textContent = 'Synced from DYOR.';
      }
    }

    return entry;
  } catch (error) {
    console.error(error);
    if (tokenSelectors.updated) {
      tokenSelectors.updated.textContent = 'Unable to reach the DYOR token feed right now.';
    }
    if (tokenSelectors.description) {
      tokenSelectors.description.innerHTML = '<p>Khabat Setaei is retrying the DYOR feed. Refresh to attempt again.</p>';
    }
    return null;
  }
}

async function fetchDappData() {
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

    const summary =
      entry?.description ?? entry?.summary ?? entry?.about ?? 'DYOR has not published a description for this dapp yet.';

    const tags = [
      ...resolveArray(entry?.categories),
      ...resolveArray(entry?.chains ?? entry?.networks),
    ];

    const insightCandidates = [
      { label: 'Users 24h', value: entry?.metrics?.users24h ?? entry?.users24h },
      { label: 'Volume 24h', value: entry?.metrics?.volume24hUsd ?? entry?.volume24hUsd },
      { label: 'Transactions 24h', value: entry?.metrics?.tx24h ?? entry?.transactions24h },
      { label: 'TVL', value: entry?.metrics?.tvlUsd ?? entry?.tvlUsd },
    ];

    const insights = insightCandidates
      .filter((item) => typeof item.value === 'number' && !Number.isNaN(item.value))
      .map((item) => `${item.label}: ${formatCompact(item.value)}`);

    setTextContent(dappSelectors.summary, summary);

    if (dappSelectors.tags) {
      dappSelectors.tags.innerHTML = '';
      if (tags.length) {
        tags.slice(0, 6).forEach((tag) => {
          const li = document.createElement('li');
          li.textContent = tag;
          dappSelectors.tags.appendChild(li);
        });
      }
    }

    buildList(dappSelectors.insights, insights.length ? insights : null);
  } catch (error) {
    console.error(error);
    setTextContent(dappSelectors.summary, 'Setaei could not load the DYOR dapp feed. Please refresh to retry.');
    buildList(dappSelectors.insights, null);
  }

  renderRoadmap(entry ? extractRoadmap(entry) : null);
  hydrateSocialLink(entry);
}

(async () => {
  const tokenEntry = await fetchTokenData();
  await Promise.all([hydrateTokenChart(tokenEntry), hydrateTokenTransactions(tokenEntry)]);
})();

fetchDappData();
