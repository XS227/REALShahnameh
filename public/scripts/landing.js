const realTokenMeta = {
  address: "0:e1abf0e3414309a9f5cb3fc2bc27a4a53afa27d3c5d040ad13e3dc689f67b4c5",
  name: "RealShahnameh",
  symbol: "REAL",
  decimals: "9",
  image: "https://storage.dyor.io/jettons/EQDhq_DjQUMJqfXLP8K8J6SlOvon08XQQK0T49xon2e0xU8p/image.png",
  description:
    "REAL is the Shahnameh game's utility token, linked to the Iranian Rial. Starting with 227 tokens, the supply grows with players!",
  social: [
    "https://x.com/shahnamehgamefi",
    "https://tonscan.org/jetton/EQDhq_DjQUMJqfXLP8K8J6SlOvon08XQQK0T49xon2e0xU8p",
    "https://t.me/Shahnameh_news",
  ],
  websites: ["https://realshahnameh.setaei.com//"],
};

function normalizeUrl(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    parsed.pathname = parsed.pathname.replace(/\/+$/u, "/");
    return parsed.toString();
  } catch (error) {
    return url;
  }
}

function fillText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function createLink(label, url) {
  const template = document.getElementById("link-template");
  if (!template) return null;
  const fragment = template.content.cloneNode(true);
  const anchor = fragment.querySelector(".link-card");
  const labelSpan = fragment.querySelector(".link-card__label");
  const urlSpan = fragment.querySelector(".link-card__url");

  if (anchor) anchor.href = url;
  if (labelSpan) labelSpan.textContent = label;
  if (urlSpan) urlSpan.textContent = url.replace(/^https?:\/\//, "");

  return fragment;
}

function buildLinks() {
  const container = document.querySelector("[data-token-links]");
  if (!container) return;

  const primarySite = normalizeUrl(realTokenMeta.websites?.find(Boolean));
  if (primarySite) {
    const node = createLink("Official site", primarySite);
    if (node) container.appendChild(node);
  }

  realTokenMeta.social?.forEach((url) => {
    if (!url) return;
    let label = "Social";
    if (url.includes("x.com")) label = "X / Twitter";
    else if (url.includes("t.me")) label = "Telegram";
    else if (url.includes("tonscan")) label = "TONScan";
    const node = createLink(label, url);
    if (node) container.appendChild(node);
  });

  const dyorUrl = `https://dyor.io/jetton/${encodeURIComponent(realTokenMeta.address)}`;
  const dyorNode = createLink("DYOR dossier", dyorUrl);
  if (dyorNode) container.appendChild(dyorNode);
}

function attachLogo() {
  const logo = document.querySelector("[data-token-image]");
  if (logo) {
    logo.src = realTokenMeta.image;
  }
}

function configureLinks() {
  const primarySite = normalizeUrl(realTokenMeta.websites?.find(Boolean)) || "https://realshahnameh.setaei.com";
  const dyorLink = `https://tonscan.org/jetton/${encodeURIComponent(realTokenMeta.address)}`;

  document.querySelectorAll("[data-primary-link]").forEach((anchor) => {
    anchor.href = primarySite;
  });

  const dyorAnchor = document.querySelector("[data-dyor-link]");
  if (dyorAnchor) {
    dyorAnchor.href = dyorLink;
  }
}

function enableCopyAddress() {
  const button = document.querySelector("[data-copy-address]");
  const status = document.querySelector(".copy-button__status");
  const addressNode = document.querySelector("[data-token-address]");

  if (!button || !status || !addressNode) return;

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(realTokenMeta.address);
      status.textContent = "Address copied!";
      button.disabled = true;
      setTimeout(() => {
        status.textContent = "";
        button.disabled = false;
      }, 2500);
    } catch (error) {
      status.textContent = "Unable to copy. Please copy manually.";
    }
  });
}

function init() {
  fillText("[data-token-symbol]", realTokenMeta.symbol);
  fillText("[data-token-name]", realTokenMeta.name);
  fillText("[data-token-decimals]", realTokenMeta.decimals);
  fillText("[data-token-address]", realTokenMeta.address);
  fillText("[data-token-description]", realTokenMeta.description);

  attachLogo();
  configureLinks();
  buildLinks();
  enableCopyAddress();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
