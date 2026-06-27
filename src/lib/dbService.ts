/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile, MoodLog, HighRiskAlert } from "../types";

// Active flag to indicate if we have fallen back to local storage mode
let localSandboxActive = false;

export function isLocalSandboxMode(): boolean {
  return localSandboxActive;
}

export function setLocalSandboxMode(active: boolean) {
  localSandboxActive = active;
  console.log(`[dbService] Local Sandbox Mode set to: ${active}`);
}

// Helper to generate IDs when in local storage mode
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to get/set lists in local storage
function getLocalList<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`[dbService] Error parsing local list for key: ${key}`, e);
    return [];
  }
}

function saveLocalList<T>(key: string, list: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.error(`[dbService] Error saving local list for key: ${key}`, e);
  }
}

/**
 * 1. User Profile Operations
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (localSandboxActive) {
    const localProfile = localStorage.getItem(`thrive_profile_${uid}`);
    return localProfile ? JSON.parse(localProfile) : null;
  }

  try {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    // Fallback check in local storage if not found in cloud
    const localProfile = localStorage.getItem(`thrive_profile_${uid}`);
    return localProfile ? JSON.parse(localProfile) : null;
  } catch (e) {
    console.warn("[dbService] Firestore profile fetch failed, using local fallback.", e);
    const localProfile = localStorage.getItem(`thrive_profile_${uid}`);
    return localProfile ? JSON.parse(localProfile) : null;
  }
}

export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  // Always update local storage as backup
  localStorage.setItem(`thrive_profile_${uid}`, JSON.stringify(profile));

  if (localSandboxActive) {
    return;
  }

  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, profile);
  } catch (e) {
    console.warn("[dbService] Firestore profile save failed, operating in offline fallback.", e);
    // Auto-engage sandbox mode
    setLocalSandboxMode(true);
  }
}

/**
 * 2. Mood Logs Operations
 */
export async function addMoodLog(log: Omit<MoodLog, "logId">): Promise<string> {
  const generatedId = generateId("log");
  const completeLog: MoodLog = { logId: generatedId, ...log };

  // Always save locally
  const localLogs = getLocalList<MoodLog>("thrive_mood_logs");
  localLogs.unshift(completeLog);
  saveLocalList("thrive_mood_logs", localLogs);

  if (localSandboxActive) {
    return generatedId;
  }

  try {
    const docRef = await addDoc(collection(db, "moodLogs"), log);
    return docRef.id;
  } catch (e) {
    console.warn("[dbService] Firestore addMoodLog failed, falling back to local list.", e);
    return generatedId;
  }
}

export function subscribeMoodLogs(userId: string, callback: (logs: MoodLog[]) => void): () => void {
  if (localSandboxActive) {
    // Return local logs filtered by userId
    const localLogs = getLocalList<MoodLog>("thrive_mood_logs").filter(l => l.userId === userId);
    callback(localLogs);
    return () => {};
  }

  try {
    const q = query(collection(db, "moodLogs"), where("userId", "==", userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: MoodLog[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ logId: docSnap.id, ...docSnap.data() } as MoodLog);
      });
      // Sort by newest
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Update local cache as backup
      if (list.length > 0) {
        const otherLogs = getLocalList<MoodLog>("thrive_mood_logs").filter(l => l.userId !== userId);
        saveLocalList("thrive_mood_logs", [...list, ...otherLogs]);
      }
      
      callback(list);
    }, (error) => {
      console.warn("[dbService] MoodLogs snapshot listener failed, falling back to local storage.", error);
      const localLogs = getLocalList<MoodLog>("thrive_mood_logs").filter(l => l.userId === userId);
      callback(localLogs);
    });

    return unsubscribe;
  } catch (e) {
    console.warn("[dbService] Failed to establish MoodLogs snapshot, using local callback.", e);
    const localLogs = getLocalList<MoodLog>("thrive_mood_logs").filter(l => l.userId === userId);
    callback(localLogs);
    return () => {};
  }
}

/**
 * 3. High Risk Alerts Operations
 */
export async function addHighRiskAlert(alert: Omit<HighRiskAlert, "alertId"> & { alertId?: string }): Promise<string> {
  const alertId = alert.alertId || generateId("alert");
  const completeAlert: HighRiskAlert = { alertId, ...alert };

  // Always save locally
  const localAlerts = getLocalList<HighRiskAlert>("thrive_high_risk_alerts");
  // Avoid duplicates
  const filtered = localAlerts.filter(a => a.alertId !== alertId);
  filtered.unshift(completeAlert);
  saveLocalList("thrive_high_risk_alerts", filtered);

  if (localSandboxActive) {
    return alertId;
  }

  try {
    await setDoc(doc(db, "highRiskAlerts", alertId), alert);
    return alertId;
  } catch (e) {
    console.warn("[dbService] Firestore addHighRiskAlert failed, falling back to local storage.", e);
    return alertId;
  }
}

export function subscribeHighRiskAlerts(callback: (alerts: HighRiskAlert[]) => void): () => void {
  if (localSandboxActive) {
    const localAlerts = getLocalList<HighRiskAlert>("thrive_high_risk_alerts");
    callback(localAlerts);
    return () => {};
  }

  try {
    const q = query(collection(db, "highRiskAlerts"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: HighRiskAlert[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ alertId: docSnap.id, ...docSnap.data() } as HighRiskAlert);
      });
      // Sort by newest timestamp
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Sync local cache
      saveLocalList("thrive_high_risk_alerts", list);

      callback(list);
    }, (error) => {
      console.warn("[dbService] HighRiskAlerts snapshot listener failed, using local fallback.", error);
      const localAlerts = getLocalList<HighRiskAlert>("thrive_high_risk_alerts");
      callback(localAlerts);
    });

    return unsubscribe;
  } catch (e) {
    console.warn("[dbService] Failed to establish HighRiskAlerts snapshot, using local callback.", e);
    const localAlerts = getLocalList<HighRiskAlert>("thrive_high_risk_alerts");
    callback(localAlerts);
    return () => {};
  }
}

export async function resolveHighRiskAlert(alertId: string): Promise<void> {
  // Update locally first
  const localAlerts = getLocalList<HighRiskAlert>("thrive_high_risk_alerts");
  const updated = localAlerts.map(a => {
    if (a.alertId === alertId) {
      return { ...a, status: "resolved" as const };
    }
    return a;
  });
  saveLocalList("thrive_high_risk_alerts", updated);

  if (localSandboxActive) {
    return;
  }

  try {
    const alertRef = doc(db, "highRiskAlerts", alertId);
    await updateDoc(alertRef, { status: "resolved" });
  } catch (e) {
    console.warn("[dbService] Firestore resolve alert failed, saved to local cache.", e);
  }
}
