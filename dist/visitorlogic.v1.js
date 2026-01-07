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
  industry: "agriculture",     // agriculture | fintech | fashion | health | logistics | etc
  audience: "teams",           // teams | founders | enterprises | individuals
  region_focus: "africa",      // africa | global
  brand_tone: "professional",  // professional | friendly | bold
  page_type: "homepage"        // homepage | pricing | features | landing
}

const CONFIG = window.VisitorLogic_CONFIG

/* ===============================
   2. SEGMENTS HOLDER
   =============================== */

let SEGMENTS = {}

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
  return [
    `${ctx.page}|${ctx.audience}|${ctx.industry}|${ctx.region}|${ctx.referrer}`,
    `${ctx.page}|${ctx.audience}|${ctx.industry}|${ctx.region}|*`,
    `${ctx.page}|${ctx.audience}|${ctx.industry}|global|*`,
    `${ctx.page}|*|${ctx.industry}|${ctx.region}|*`,
    `${ctx.page}|*|*|${ctx.region}|*`,
    "default"
  ]
}

/* ===============================
   5. RESOLUTION ENGINE
   =============================== */

function resolveCopy(keys, segments) {
  for (const key of keys) {
    const match = segments.find(
      s => s.segment_key === key
    )
    if (match) {
      return { copy: match, key }
    }
  }

  // fallback
  const fallback = segments.find(s => s.segment_key === "default") || null
  return { copy: fallback, key: "default" }
}

/* ===============================
   6. DOM INJECTION (SAFE)
   =============================== */

function applyCopy(copy) {
  if (!copy) return

  const h = document.querySelector("[data-vl-headline]")
  const s = document.querySelector("[data-vl-subheadline]")
  const c = document.querySelector("[data-vl-cta]")

  if (h && copy.headline) h.textContent = copy.headline
  if (s && copy.subheadline) s.textContent = copy.subheadline
  if (c && copy.cta) c.textContent = copy.cta
}

/* ===============================
   7. RUNTIME BOOTSTRAP
   =============================== */

function bootVisitorLogic() {
  try {
    const cacheKey = "VL_copy_" + CONFIG.page_type
    const cached = sessionStorage.getItem(cacheKey)

    if (cached) {
      applyCopy(JSON.parse(cached))
      return
    }

    const ctx = {
      industry: CONFIG.industry,
      audience: CONFIG.audience,
      page: CONFIG.page_type,
      region: detectRegion(),
      referrer: detectReferrer()
    }

    const keys = buildSegmentKeys(ctx)
    const result = resolveCopy(keys)

    if (result.copy) {
      sessionStorage.setItem(cacheKey, JSON.stringify(result.copy))
      sessionStorage.setItem("VL_segment_key", result.key)
      applyCopy(result.copy)
    }

    // Optional debug
    // console.log("VisitorLogic segment:", result.key)

  } catch (e) {
    console.error("VisitorLogic failed safely:", e)
  }
}

/* ===============================
   8. SEGMENT FETCH & START
   =============================== */

fetch("./segments.v1.json")
  .then(r => r.json())
  .then(data => {
    SEGMENTS = data || {}
    bootVisitorLogic()
  })
  .catch(() => {
    SEGMENTS = {}
    bootVisitorLogic()
  })
