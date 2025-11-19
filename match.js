import { db } from './db.js';
import { distance } from 'fastest-levenshtein';

// --- Database Queries ---
// Get all active staff to filter in-memory
const qAllActiveStaff = db.prepare("SELECT * FROM staff WHERE active=1");
// Get all services for matching
const qAllServices = db.prepare("SELECT * FROM services");
// Get a service by name (for service matching)
const qFindService = db.prepare("SELECT * FROM services WHERE LOWER(name)=LOWER(?)");

// --- Helper Functions ---

/**
 * Calculates a similarity score between 0.0 and 1.0
 */
function score(str1, str2) {
  const d = distance(str1, str2);
  const len = Math.max(str1.length, str2.length);
  if (len === 0) return 1.0;
  return Math.max(0, (len - d) / len);
}

/**
 * Checks if a staff member can perform a specific service.
 * @param {object} stf - The staff object from the database.
 * @param {number} serviceId - The ID of the service.
 * @returns {boolean}
 */
function canStaffDoService(stf, serviceId) {
  if (!serviceId) return true; // No service specified, so yes
  if (!stf.skills) return true; // null skills means they can do everything
  
  try {
    const skills = JSON.parse(stf.skills);
    if (skills.length === 0) return true; // Empty array means they can do everything
    return skills.includes(serviceId);
  } catch (e) {
    console.error(`Error parsing skills for staff ID ${stf.id}: ${stf.skills}`);
    return false; // Fail safe
  }
}

/**
 * Finds the best service match using fuzzy search.
 * @param {string} text - User input for service.
 * @returns {{service: object | null, score: number}}
 */
export function matchServiceWithScore(text) {
  const name = (text || '').toLowerCase().trim();
  if (!name) return { service: null, score: 0 };

  // 1. Try direct match first
  const direct = qFindService.get(name);
  if (direct) return { service: direct, score: 1.0 };

  // 2. Try fuzzy matching
  const services = qAllServices.all();
  let bestMatch = { service: null, score: 0.0 };

  for (const svc of services) {
    const namesToCompare = [svc.name.toLowerCase()];
    if (svc.synonyms) {
      try {
        const synonyms = JSON.parse(svc.synonyms);
        synonyms.forEach(s => namesToCompare.push(s.toLowerCase()));
      } catch {}
    }

    for (const compareName of namesToCompare) {
      const s = score(name, compareName);
      if (s > bestMatch.score) {
        bestMatch = { service: svc, score: s };
      }
    }
  }

  // Use a threshold to avoid bad matches
  if (bestMatch.score < 0.7) {
    return { service: null, score: 0 };
  }

  return bestMatch;
}

/**
 * Finds the best staff match, handling "any" and service-based skills.
 * @param {string} text - User input for staff (e.g., "Ben", "anyone").
 * @param {number | null} serviceId - The ID of the service they must be able to do.
 * @returns {{staff: object | null, score: number}}
 */
export function matchStaffWithScore(text, serviceId = null) {
  const name = (text || '').toLowerCase().trim();

  // --- 1. Handle "any" ---
  const anyWords = ['any', 'anyone', 'anybody', 'no preference', "don't care", ''];
  if (anyWords.includes(name)) {
    const allStaff = qAllActiveStaff.all();
    
    // Find the first staff member who can do this service
    const candidate = allStaff.find(stf => canStaffDoService(stf, serviceId));

    if (candidate) {
      // Return the first available, qualified staff
      return { staff: candidate, score: 1.0 };
    } else {
      // "Any" was requested, but no staff can do this service
      console.warn(`"any" staff requested for service ${serviceId}, but no qualified staff found.`);
      return { staff: null, score: 0 };
    }
  }

  // --- 2. Handle specific name ---
  const allStaff = qAllActiveStaff.all();
  let bestMatch = { staff: null, score: 0.0 };

  for (const stf of allStaff) {
    // Check if this staff can do the service *before* scoring them
    if (!canStaffDoService(stf, serviceId)) {
      continue; // This staff can't do the service, skip them
    }
    
    // This staff is a candidate, now check their name and aliases
    const namesToCompare = [stf.name.toLowerCase()];
    if (stf.aliases) {
      try {
        const aliases = JSON.parse(stf.aliases);
        aliases.forEach(a => namesToCompare.push(a.toLowerCase()));
      } catch {}
    }

    for (const compareName of namesToCompare) {
      const s = score(name, compareName);
      if (s > bestMatch.score) {
        bestMatch = { staff: stf, score: s };
      }
    }
  }

  // Use a threshold to avoid bad matches
  if (bestMatch.score < 0.6) {
    return { staff: null, score: 0 };
  }

  return bestMatch;
}