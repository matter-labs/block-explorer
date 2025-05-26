import { ref } from "vue";

import { resolveAddress, resolveName } from "@sophon-labs/account-core";

import useContext from "./useContext";

import type { Address } from "@/types";

import { isAddress, isSNS } from "@/utils/validators";

export interface SNSCacheEntry {
  name: string;
  address: Address;
  timestamp: number;
  expiresAt: number;
}

export interface SNSCache {
  [key: string]: SNSCacheEntry;
}

// Cache duration: 24 hours in milliseconds
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// localStorage key for SNS cache
const STORAGE_KEY = "sns-cache";

/**
 * Load cache from localStorage
 */
const loadCacheFromStorage = (): SNSCache => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};

    const parsed = JSON.parse(stored) as SNSCache;

    // Clean expired entries while loading
    const now = Date.now();
    const validEntries: SNSCache = {};

    for (const [key, entry] of Object.entries(parsed)) {
      if (now < entry.expiresAt) {
        validEntries[key] = entry;
      }
    }

    return validEntries;
  } catch (error) {
    console.warn("Failed to load SNS cache from localStorage:", error);
    return {};
  }
};

/**
 * Save cache to localStorage
 */
const saveCacheToStorage = (cache: SNSCache): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("Failed to save SNS cache to localStorage:", error);
  }
};

// Initialize cache from localStorage
const snsCache = ref<SNSCache>(loadCacheFromStorage());

const { currentNetwork } = useContext();

/**
 * Check if a cache entry is still valid (not older than 24 hours)
 */
const isCacheEntryValid = (entry: SNSCacheEntry): boolean => {
  return Date.now() < entry.expiresAt;
};

/**
 * Get cache entry by name or address
 */
const getCacheEntry = (key: string): SNSCacheEntry | null => {
  const entry = snsCache.value[key];
  if (entry && isCacheEntryValid(entry)) {
    return entry;
  }

  // Remove expired entry
  if (entry) {
    delete snsCache.value[key];
    saveCacheToStorage(snsCache.value);
  }

  return null;
};

/**
 * Store entry in cache with bi-directional mapping
 */
const setCacheEntry = (name: string, address: Address): void => {
  const timestamp = Date.now();
  const expiresAt = timestamp + CACHE_DURATION;

  const entry: SNSCacheEntry = {
    name,
    address,
    timestamp,
    expiresAt,
  };

  // Store bi-directional mapping
  snsCache.value[name] = entry;
  snsCache.value[address] = entry;

  // Persist to localStorage
  saveCacheToStorage(snsCache.value);
};

/**
 * Clear expired entries from cache
 */
const cleanExpiredEntries = (): void => {
  const now = Date.now();
  const entries = Object.entries(snsCache.value);
  let hasChanges = false;

  for (const [key, entry] of entries) {
    if (now >= entry.expiresAt) {
      delete snsCache.value[key];
      hasChanges = true;
    }
  }

  // Only save to localStorage if there were changes
  if (hasChanges) {
    saveCacheToStorage(snsCache.value);
  }
};

const getSNSAddress = async (name: string): Promise<Address | null> => {
  if (!isSNS(name)) {
    return null;
  }

  return await resolveName(name, currentNetwork.value.l2ChainId === 531050104);
};

const getSNSName = async (address: Address): Promise<string | null> => {
  if (!isAddress(address)) {
    return null;
  }

  return await resolveAddress(address, currentNetwork.value.l2ChainId === 531050104);
};

export default () => {
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);

  /**
   * Fetch SNS name for a given address
   * Returns the domain name associated with the address
   */
  const fetchSNSName = async (address: Address, onlyCache = false): Promise<string | null> => {
    if (!address) return null;

    // Check cache first
    const cachedEntry = getCacheEntry(address);
    if (cachedEntry) {
      return cachedEntry.name;
    }

    if (onlyCache) {
      return null;
    }

    isRequestPending.value = true;
    isRequestFailed.value = false;

    try {
      const result = await getSNSName(address);

      if (result) {
        setCacheEntry(result, address);
        return result;
      }

      return null;
    } catch (error) {
      isRequestFailed.value = true;
      return null;
    } finally {
      isRequestPending.value = false;
    }
  };

  /**
   * Resolve address for a given SNS name
   * Returns the address associated with the domain name
   */
  const resolveSNSName = async (name: string, onlyCache = false): Promise<Address | null> => {
    if (!name) return null;

    // Check cache first
    const cachedEntry = getCacheEntry(name);
    if (cachedEntry) {
      return cachedEntry.address;
    }

    if (onlyCache) {
      return null;
    }

    isRequestPending.value = true;
    isRequestFailed.value = false;

    try {
      const result = await getSNSAddress(name);

      if (result) {
        setCacheEntry(name, result);
        return result;
      }

      return null;
    } catch (error) {
      isRequestFailed.value = true;
      return null;
    } finally {
      isRequestPending.value = false;
    }
  };

  /**
   * Clear all cache entries
   */
  const clearCache = (): void => {
    snsCache.value = {};
    saveCacheToStorage(snsCache.value);
  };

  /**
   * Get all cached entries (for debugging/monitoring)
   */
  const getCachedEntries = (): SNSCacheEntry[] => {
    return Object.values(snsCache.value).filter(isCacheEntryValid);
  };

  /**
   * Check if a specific entry exists in cache
   */
  const isCached = (key: string): boolean => {
    return getCacheEntry(key) !== null;
  };

  // Clean expired entries periodically
  setInterval(cleanExpiredEntries, 60 * 60 * 1000); // Every hour

  return {
    // Main functions
    fetchSNSName,
    resolveSNSName,

    // State
    isRequestPending,
    isRequestFailed,

    // Cache utilities
    clearCache,
    getCachedEntries,
    isCached,
  };
};
