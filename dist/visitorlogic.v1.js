/**
 * VisitorLogic Phase-1
 * A lightweight runtime for visitor-aware websites.
 * No backend, no AI, no async blocking
 * License: BSD-3-Clause
 */

/* ===============================
   1. SITE OWNER CONFIG
   =============================== */

window.VisitorLogic_CONFIG = window.VisitorLogic_CONFIG || {
  industry: "agriculture",
  audience: "teams",
  region_focus: "africa",
  brand_tone: "professional",
  page_type: "homepage",
  debug: false // 👈 optional, default off
}

const CONFIG = window.VisitorLogic_CONFIG
const DEBUG = CONFIG.debug === true

function log(...args) {
  if (DEBUG) {
    console.log("[VisitorLogic]", ...args)
  }
}

/* ===============================
   2. SEGMENTS HOLDER
   =============================== */

let SEGMENTS = []

/* ===============================
   3. VISITOR CONTEXT DETECTION
   =============================== */

function detectDevice() {
  return /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop"
}

function detectReferrer() {
  const ref = document.referrer || ""
  if (!ref) return "direct"
  if (ref.includes("twitter") || ref.includes("x.com")) return "social"
  if (ref.includes("linkedin") || ref.includes("facebook")) return "social"
  if (ref.includes("google") || ref.includes("bing")) return "search"
  return "other"
}

function detectRegion() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
  return tz.includes("Africa") ? "africa" : "global"
}

/* ===============================
   4. SEGMENT KEY BUILDER
   =============================== */

function buildSegmentKeys(ctx) {
  const keys = [
    `${ctx.page}|${ctx.audience}|${ctx.industry}|${ctx.region}|${ctx.referrer}`,
    `${ctx.page}|${ctx.audience}|${ctx.industry}|${ctx.region}|*`,
    `${ctx.page}|${ctx.audience}|${ctx.industry}|global|*`,
    `${ctx.page}|*|${ctx.industry}|${ctx.region}|*`,
    `${ctx.page}|*|*|${ctx.region}|*`,
    "default"
  ]

  log("Segment keys generated:", keys)
  return keys
}

/* ===============================
   5. RESOLUTION ENGINE
   =============================== */

function resolveCopy(keys, segments) {
  log("Resolving copy from segments:", segments)

  for (const key of keys) {
    const match = segments.find(s => s.segment_key === key)
    if (match) {
      log("Matched segment:", key, match)
      return { copy: match, key }
    }
  }

  const fallback = segments.find(s => s.segment_key === "default") || null
  log("No match found. Using fallback:", fallback)

  return { copy: fallback, key: "default" }
}

/* ===============================
   6. DOM INJECTION (SAFE)
   =============================== */

function applyCopy(copy) {
  if (!copy) {
    log("No copy to apply")
    return
  }

  const h = document.querySelector("[data-vl-headline]")
  const s = document.querySelector("[data-vl-subheadline]")
  const c = document.querySelector("[data-vl-cta]")

  if (h && copy.headline) {
    h.textContent = copy.headline
    log("Injected headline:", copy.headline)
  }

  if (s && copy.subheadline) {
    s.textContent = copy.subheadline
    log("Injected subheadline:", copy.subheadline)
  }

  if (c && copy.cta) {
    c.textContent = copy.cta
    log("Injected CTA:", copy.cta)
  }
}

/* ===============================
   7. RUNTIME BOOTSTRAP
   =============================== */

function bootVisitorLogic() {
  try {
    const cacheKey = "VL_copy_" + CONFIG.page_type
    const cached = sessionStorage.getItem(cacheKey)

    if (cached) {
      log("Using cached copy")
      applyCopy(JSON.parse(cached))
      return
    }

    const ctx = {
      industry: CONFIG.industry,
      audience: CONFIG.audience,
      page: CONFIG.page_type,
      region: detectRegion(),
      referrer: detectReferrer(),
      device: detectDevice()
    }

    log("Context detected:", ctx)

    const keys = buildSegmentKeys(ctx)
    const result = resolveCopy(keys, SEGMENTS)

    if (result.copy) {
      sessionStorage.setItem(cacheKey, JSON.stringify(result.copy))
      sessionStorage.setItem("VL_segment_key", result.key)
      applyCopy(result.copy)
    } else {
      log("No copy applied (null result)")
    }

  } catch (e) {
    console.error("VisitorLogic failed safely:", e)
  }
}

/* ===============================
   8. SEGMENT FETCH & START
   =============================== */

fetch("https://cdn.jsdelivr.net/gh/investor-uyah/visitor-logic/dist/segments.v1.json")
  .then(r => r.json())
  .then(data => {
    SEGMENTS = Array.isArray(data) ? data : []
    log("Segments loaded:", SEGMENTS.length)
    bootVisitorLogic()
  })
  .catch(err => {
    log("Failed to load segments:", err)
    SEGMENTS = []
    bootVisitorLogic()
  })
