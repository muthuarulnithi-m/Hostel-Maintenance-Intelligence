/**
 * intelligence.js
 * Rule-based complaint intelligence engine.
 *
 * Architecture:
 *   Input:  Free-text complaint description (string)
 *   Output: { category, priority, confidence, reasoning, keywords }
 *
 * How it works:
 *   1. Normalize text (lowercase, remove punctuation noise)
 *   2. Match against keyword rules per category
 *   3. Score each category by keyword hits + weight
 *   4. Pick highest scoring category (or GENERAL if nothing matches)
 *   5. Separately score priority from urgency keywords
 *   6. Return result with reasoning for display
 *
 * Upgrade path:
 *   Replace classifyComplaint() with an API call to an NLP service
 *   (OpenAI, Gemini, a fine-tuned model) and the rest of the UI
 *   stays unchanged — it only depends on the return shape.
 */

// ─── Category keyword rules ───────────────────────────────────────────────────
// Each rule: { keywords: string[], weight: number }
// weight > 1 means this keyword is a strong signal for this category
const CATEGORY_RULES = {
  ELECTRICAL: {
    label: 'Electrical',
    keywords: [
      { word: 'fan',           weight: 2 },
      { word: 'ceiling fan',   weight: 3 },
      { word: 'light',         weight: 2 },
      { word: 'bulb',          weight: 2 },
      { word: 'tube light',    weight: 3 },
      { word: 'switch',        weight: 2 },
      { word: 'socket',        weight: 2 },
      { word: 'plug',          weight: 1 },
      { word: 'power',         weight: 1 },
      { word: 'electricity',   weight: 3 },
      { word: 'electric',      weight: 2 },
      { word: 'wiring',        weight: 3 },
      { word: 'wire',          weight: 2 },
      { word: 'short circuit', weight: 3 },
      { word: 'trip',          weight: 1 },
      { word: 'voltage',       weight: 2 },
      { word: 'power cut',     weight: 2 },
      { word: 'no power',      weight: 3 },
      { word: 'sparking',      weight: 3 },
      { word: 'spark',         weight: 2 },
      { word: 'fuse',          weight: 2 },
      { word: 'inverter',      weight: 2 },
      { word: 'mcb',           weight: 3 },
    ],
  },

  PLUMBING: {
    label: 'Plumbing',
    keywords: [
      { word: 'water',         weight: 1 },
      { word: 'leak',          weight: 3 },
      { word: 'leaking',       weight: 3 },
      { word: 'leakage',       weight: 3 },
      { word: 'pipe',          weight: 3 },
      { word: 'tap',           weight: 2 },
      { word: 'faucet',        weight: 2 },
      { word: 'drain',         weight: 2 },
      { word: 'drainage',      weight: 2 },
      { word: 'overflow',      weight: 2 },
      { word: 'block',         weight: 1 },
      { word: 'blocked',       weight: 2 },
      { word: 'clog',          weight: 2 },
      { word: 'clogged',       weight: 2 },
      { word: 'flush',         weight: 2 },
      { word: 'toilet',        weight: 2 },
      { word: 'bathroom',      weight: 1 },
      { word: 'shower',        weight: 2 },
      { word: 'wet',           weight: 1 },
      { word: 'dripping',      weight: 3 },
      { word: 'drip',          weight: 2 },
      { word: 'water supply',  weight: 3 },
      { word: 'no water',      weight: 3 },
      { word: 'sewage',        weight: 3 },
      { word: 'stench',        weight: 1 },
      { word: 'smell',         weight: 1 },
    ],
  },

  CARPENTRY: {
    label: 'Carpentry',
    keywords: [
      { word: 'door',          weight: 2 },
      { word: 'window',        weight: 2 },
      { word: 'lock',          weight: 2 },
      { word: 'broken',        weight: 1 },
      { word: 'hinge',         weight: 3 },
      { word: 'latch',         weight: 3 },
      { word: 'handle',        weight: 2 },
      { word: 'frame',         weight: 2 },
      { word: 'wood',          weight: 2 },
      { word: 'shelf',         weight: 2 },
      { word: 'cabinet',       weight: 2 },
      { word: 'wardrobe',      weight: 2 },
      { word: 'cupboard',      weight: 2 },
      { word: 'stuck',         weight: 1 },
      { word: 'jammed',        weight: 2 },
      { word: 'not closing',   weight: 2 },
      { word: 'not opening',   weight: 2 },
      { word: 'creak',         weight: 2 },
      { word: 'creaking',      weight: 2 },
      { word: 'crack',         weight: 1 },
    ],
  },

  CLEANING: {
    label: 'Cleaning',
    keywords: [
      { word: 'dirty',         weight: 2 },
      { word: 'clean',         weight: 2 },
      { word: 'cleaning',      weight: 2 },
      { word: 'dust',          weight: 2 },
      { word: 'dusty',         weight: 2 },
      { word: 'garbage',       weight: 3 },
      { word: 'trash',         weight: 2 },
      { word: 'waste',         weight: 2 },
      { word: 'stain',         weight: 2 },
      { word: 'stains',        weight: 2 },
      { word: 'mosquito',      weight: 2 },
      { word: 'cockroach',     weight: 3 },
      { word: 'rat',           weight: 3 },
      { word: 'pest',          weight: 3 },
      { word: 'insect',        weight: 2 },
      { word: 'hygiene',       weight: 2 },
      { word: 'unhygienic',    weight: 3 },
      { word: 'mop',           weight: 2 },
      { word: 'sweep',         weight: 2 },
      { word: 'floor',         weight: 1 },
      { word: 'toilet cleani', weight: 3 },
    ],
  },

  INTERNET: {
    label: 'Internet',
    keywords: [
      { word: 'internet',      weight: 3 },
      { word: 'wifi',          weight: 3 },
      { word: 'wi-fi',         weight: 3 },
      { word: 'network',       weight: 2 },
      { word: 'connection',    weight: 2 },
      { word: 'broadband',     weight: 3 },
      { word: 'slow',          weight: 1 },
      { word: 'no signal',     weight: 2 },
      { word: 'signal',        weight: 1 },
      { word: 'router',        weight: 3 },
      { word: 'disconnected',  weight: 2 },
      { word: 'bandwidth',     weight: 2 },
      { word: 'speed',         weight: 1 },
      { word: 'lan',           weight: 3 },
      { word: 'ethernet',      weight: 3 },
      { word: 'data',          weight: 1 },
    ],
  },

  GENERAL: {
    label: 'General',
    keywords: [
      { word: 'general',       weight: 1 },
      { word: 'maintenance',   weight: 1 },
      { word: 'repair',        weight: 1 },
      { word: 'fix',           weight: 1 },
      { word: 'problem',       weight: 1 },
      { word: 'issue',         weight: 1 },
    ],
  },
};

// ─── Priority keyword rules ───────────────────────────────────────────────────
const PRIORITY_RULES = {
  CRITICAL: {
    label: 'Critical',
    keywords: [
      'fire', 'flooding', 'flood', 'gas leak', 'electric shock',
      'short circuit', 'sparking', 'spark', 'emergency', 'urgent urgent',
      'dangerous', 'hazard', 'hazardous', 'sewage overflow', 'collapsed',
      'burst pipe', 'no power entire', 'unconscious',
    ],
    threshold: 1, // even 1 match = CRITICAL
  },
  HIGH: {
    label: 'High',
    keywords: [
      'urgent', 'immediately', 'asap', 'as soon as possible',
      'no water', 'no electricity', 'no power', 'completely broken',
      'not working at all', 'stopped working', 'total failure',
      'very bad', 'serious', 'major', 'severe', 'continuous leak',
      'continuously', 'constantly', 'all day', 'since yesterday',
      'since last week', 'exam', 'study', 'cannot sleep',
    ],
    threshold: 1,
  },
  MEDIUM: {
    label: 'Medium',
    keywords: [
      'sometimes', 'intermittent', 'occasionally', 'slow', 'partially',
      'partial', 'not properly', 'not fully', 'weak', 'making noise',
      'noise', 'rattling', 'dripping', 'flickering',
    ],
    threshold: 1,
  },
  LOW: {
    label: 'Low',
    keywords: [
      'minor', 'small', 'little', 'slight', 'not urgent', 'whenever possible',
      'when free', 'convenience', 'cosmetic', 'paint', 'colour', 'color',
    ],
    threshold: 1,
  },
};

// ─── Skill → Category map ─────────────────────────────────────────────────────
// Used for smart staff assignment suggestion
export const SKILL_CATEGORY_MAP = {
  ELECTRICAL:  ['ELECTRICAL'],
  PLUMBING:    ['PLUMBING'],
  CIVIL:       ['CARPENTRY', 'GENERAL'],
  FURNITURE:   ['CARPENTRY'],
  SANITATION:  ['CLEANING', 'PLUMBING'],
  NETWORK:     ['INTERNET'],
  CLEANING:    ['CLEANING'],
  SECURITY:    ['GENERAL'],
  GENERAL:     ['GENERAL', 'CARPENTRY', 'CLEANING'],
};

// ─── Text normalizer ──────────────────────────────────────────────────────────
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // remove punctuation
    .replace(/\s+/g, ' ')     // collapse whitespace
    .trim();
}

// ─── Main classifier ──────────────────────────────────────────────────────────
/**
 * classifyComplaint(text)
 *
 * Given a complaint description string, returns:
 * {
 *   category:   'ELECTRICAL' | 'PLUMBING' | ...
 *   priority:   'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
 *   confidence: 'high' | 'medium' | 'low'
 *   categoryScore: number   (raw score for category)
 *   matchedKeywords: string[] (which keywords triggered)
 *   reasoning: string        (human-readable explanation)
 *   suggestedSkills: string[] (staff skills that match)
 * }
 *
 * Returns null if text is too short to classify (<10 chars).
 */
export function classifyComplaint(text) {
  if (!text || text.trim().length < 10) return null;

  const normalized = normalizeText(text);

  // ── Score each category ──────────────────────────────────────────────────
  const categoryScores = {};
  const matchedByCategory = {};

  Object.entries(CATEGORY_RULES).forEach(([cat, rule]) => {
    let score = 0;
    const matched = [];

    rule.keywords.forEach(({ word, weight }) => {
      if (normalized.includes(word)) {
        score += weight;
        matched.push(word);
      }
    });

    categoryScores[cat]    = score;
    matchedByCategory[cat] = matched;
  });

  // Remove GENERAL from competition unless nothing else matches
  const nonGeneral = Object.entries(categoryScores)
    .filter(([cat]) => cat !== 'GENERAL')
    .sort(([, a], [, b]) => b - a);

  let topCategory    = 'GENERAL';
  let topScore       = categoryScores['GENERAL'];
  let matchedKeywords = matchedByCategory['GENERAL'] || [];

  if (nonGeneral.length > 0 && nonGeneral[0][1] > 0) {
    topCategory     = nonGeneral[0][0];
    topScore        = nonGeneral[0][1];
    matchedKeywords = matchedByCategory[topCategory] || [];
  }

  // ── Confidence level ─────────────────────────────────────────────────────
  let confidence = 'low';
  if (topScore >= 6)      confidence = 'high';
  else if (topScore >= 3) confidence = 'medium';
  else if (topScore >= 1) confidence = 'low';

  // ── Score priority ───────────────────────────────────────────────────────
  let detectedPriority = 'MEDIUM'; // default

  // Check from highest to lowest (CRITICAL first)
  for (const [level, rule] of Object.entries(PRIORITY_RULES)) {
    const hits = rule.keywords.filter(kw => normalized.includes(kw));
    if (hits.length >= rule.threshold) {
      detectedPriority = level;
      break;
    }
  }

  // ── Reasoning string ─────────────────────────────────────────────────────
  let reasoning = '';
  if (topCategory === 'GENERAL' || topScore === 0) {
    reasoning = 'No specific keywords detected. Defaulting to General category.';
  } else {
    const keywordList = matchedKeywords.slice(0, 3).map(k => `"${k}"`).join(', ');
    reasoning = `Detected keywords: ${keywordList}. Score: ${topScore}.`;
  }

  // ── Suggested skills ─────────────────────────────────────────────────────
  const suggestedSkills = Object.entries(SKILL_CATEGORY_MAP)
    .filter(([, cats]) => cats.includes(topCategory))
    .map(([skill]) => skill);

  return {
    category:        topCategory,
    priority:        detectedPriority,
    confidence,
    categoryScore:   topScore,
    matchedKeywords,
    reasoning,
    suggestedSkills,
  };
}

/**
 * getSuggestedStaff(staffList, skillsList, category)
 *
 * Given a list of staff and their skills, suggests the best staff
 * members for the given complaint category.
 *
 * staffList:  [{ id, user_id, employee_code, availability_status }]
 * skillsList: { [staffId]: [{ skill }] }
 * category:   'ELECTRICAL' | 'PLUMBING' | ...
 *
 * Returns: staffId[] sorted by relevance (available first, skill match first)
 */
export function getSuggestedStaff(staffList, skillsMap, category) {
  const relevantSkills = Object.entries(SKILL_CATEGORY_MAP)
    .filter(([, cats]) => cats.includes(category))
    .map(([skill]) => skill);

  return staffList
    .map(staff => {
      const staffSkills = (skillsMap[staff.id] || []).map(s => s.skill);
      const skillMatch  = staffSkills.some(s => relevantSkills.includes(s));
      const isAvailable = staff.availability_status === 'AVAILABLE';

      return {
        ...staff,
        skillMatch,
        score: (skillMatch ? 10 : 0) + (isAvailable ? 5 : 0),
      };
    })
    .filter(s => s.score > 0) // only return relevant staff
    .sort((a, b) => b.score - a.score);
}

/**
 * getConfidenceColor(confidence)
 * Returns a color for the confidence badge.
 */
export function getConfidenceColor(confidence) {
  return {
    high:   '#10B981',
    medium: '#F59E0B',
    low:    '#94A3B8',
  }[confidence] || '#94A3B8';
}

/**
 * getPriorityFromUrgencyWords(text)
 * Quick check — returns true if text contains urgent/emergency words.
 * Useful for showing a warning before submission.
 */
export function isUrgentComplaint(text) {
  if (!text) return false;
  const norm = normalizeText(text);
  const urgentWords = ['fire', 'flood', 'emergency', 'dangerous', 'hazard',
    'electric shock', 'short circuit', 'sparking', 'burst pipe', 'gas leak'];
  return urgentWords.some(w => norm.includes(w));
}