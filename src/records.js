import { FIREBASE_COLLECTION, FIREBASE_CONFIG } from './config.js';

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const LOCAL_TOP_KEY = 'india-baiana-driver-top5';
const LOCAL_PROFILE_KEY = 'india-baiana-driver-profile';

let firebaseEnabled = false;
let firestore = null;

function isFirebaseConfigured() {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
      FIREBASE_CONFIG.authDomain &&
      FIREBASE_CONFIG.projectId &&
      FIREBASE_CONFIG.appId
  );
}

function sanitizeName(name) {
  const text = String(name || '').trim();
  return text.slice(0, 18) || 'Jogador';
}

function generateUserId() {
  const stamp = Date.now().toString(36);
  const random = Math.floor(Math.random() * 1e8)
    .toString(36)
    .padStart(5, '0');
  return `u-${stamp}-${random}`;
}

function readProfile() {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object' || !parsed.userId) {
      return null;
    }
    return {
      userId: String(parsed.userId),
      name: sanitizeName(parsed.name),
    };
  } catch {
    return null;
  }
}

function writeProfile(profile) {
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
}

function ensureUserProfile(preferredName) {
  const existing = readProfile();
  const chosenName = sanitizeName(preferredName || existing?.name);

  if (existing) {
    const merged = {
      userId: existing.userId,
      name: chosenName,
    };
    writeProfile(merged);
    return merged;
  }

  const created = {
    userId: generateUserId(),
    name: chosenName,
  };
  writeProfile(created);
  return created;
}

function toDateISO(value) {
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return new Date().toISOString();
}

function asReadableDate(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }
  return date.toLocaleDateString('pt-BR');
}

function normalizeRecord(record) {
  const score = Number(record.score) || 0;
  const dateISO = toDateISO(record.updatedAtISO || record.createdAtISO || record.updatedAt || record.createdAt);

  return {
    userId: String(record.userId || ''),
    name: sanitizeName(record.name),
    score,
    dateISO,
    dateLabel: asReadableDate(dateISO),
  };
}

function loadLocalRecords() {
  try {
    const raw = localStorage.getItem(LOCAL_TOP_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizeRecord).sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

function saveLocalRecords(records) {
  localStorage.setItem(LOCAL_TOP_KEY, JSON.stringify(records));
}

function initFirebase() {
  if (!isFirebaseConfigured()) {
    return;
  }
  if (!getApps().length) {
    initializeApp(FIREBASE_CONFIG);
  }
  firestore = getFirestore();
  firebaseEnabled = true;
}

initFirebase();

export function getStoredUserProfile() {
  return readProfile();
}

export async function fetchTopRecords() {
  if (!firebaseEnabled || !firestore) {
    return loadLocalRecords().slice(0, 5);
  }

  const recordsRef = collection(firestore, FIREBASE_COLLECTION);
  const q = query(recordsRef, orderBy('score', 'desc'), limit(5));
  const snap = await getDocs(q);

  return snap.docs.map((entry) => {
    const data = entry.data();
    return normalizeRecord({
      userId: data.userId,
      name: data.name,
      score: data.score,
      createdAtISO: data.createdAtISO,
      updatedAtISO: data.updatedAtISO,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  });
}

function saveOrUpdateLocal(profile, score) {
  const records = loadLocalRecords();
  const index = records.findIndex((item) => item.userId === profile.userId);
  const nowISO = new Date().toISOString();

  if (index < 0) {
    records.push(
      normalizeRecord({
        userId: profile.userId,
        name: profile.name,
        score,
        createdAtISO: nowISO,
        updatedAtISO: nowISO,
      })
    );
    records.sort((a, b) => b.score - a.score);
    saveLocalRecords(records);
    return { changed: true, created: true };
  }

  const current = records[index];
  current.name = profile.name;
  if (score > current.score) {
    current.score = score;
    current.dateISO = nowISO;
    current.dateLabel = asReadableDate(nowISO);
    records.sort((a, b) => b.score - a.score);
    saveLocalRecords(records);
    return { changed: true, created: false };
  }

  saveLocalRecords(records);
  return { changed: false, created: false };
}

async function saveOrUpdateFirebase(profile, score) {
  const recordsRef = collection(firestore, FIREBASE_COLLECTION);
  const existingQuery = query(recordsRef, where('userId', '==', profile.userId), limit(1));
  const existingSnap = await getDocs(existingQuery);
  const nowISO = new Date().toISOString();

  if (existingSnap.empty) {
    await addDoc(recordsRef, {
      userId: profile.userId,
      name: profile.name,
      score,
      createdAtISO: nowISO,
      updatedAtISO: nowISO,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { changed: true, created: true };
  }

  const docRef = existingSnap.docs[0].ref;
  const data = existingSnap.docs[0].data();
  const previousScore = Number(data.score) || 0;

  if (score > previousScore) {
    await updateDoc(docRef, {
      name: profile.name,
      score,
      updatedAtISO: nowISO,
      updatedAt: serverTimestamp(),
    });
    return { changed: true, created: false };
  }

  return { changed: false, created: false };
}

export async function saveOrUpdateUserBestScore({ name, score }) {
  const cleanScore = Math.floor(Number(score) || 0);
  const profile = ensureUserProfile(name);

  if (!firebaseEnabled || !firestore) {
    const localResult = saveOrUpdateLocal(profile, cleanScore);
    return {
      source: 'local',
      ...localResult,
      profile,
    };
  }

  const firebaseResult = await saveOrUpdateFirebase(profile, cleanScore);
  return {
    source: 'firebase',
    ...firebaseResult,
    profile,
  };
}

export function isUsingFirebase() {
  return firebaseEnabled;
}
