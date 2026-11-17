// === 1. Import 영역 ===
/**
 * @file profile.ts
 * @title 플레이어 프로필
 * @description 플레이어 진행 정보와 업그레이드 저장 로직을 관리합니다.
 */
import { STAGE_DEFINITIONS } from './model'
import type { GameSettings } from './model'

// === 2. 타입 및 상수 영역 ===
export type UpgradeType = 'garrison' | 'production' | 'capacity'
export type GameResult = 'player' | 'enemy'

export interface PlayerProfile {
  credits: number
  currentStage: number
  soundEnabled: boolean
  upgrades: Record<UpgradeType, number>
}

export interface PlayerStats {
  startingGarrison: number
  productionTenths: number
  capacity: number
}

export interface ProfileLoadResult {
  profile: PlayerProfile
  error: string | null
}

type StoredPlayerProfile = Pick<PlayerProfile, 'credits' | 'upgrades'> & {
  currentStage?: number
  soundEnabled?: boolean
}

const PROFILE_STORAGE_KEY = 'dotwar-player-profile'
const STARTING_GARRISON = 10
const GARRISON_PER_UPGRADE_LEVEL = 1
const STARTING_PRODUCTION_TENTHS = 10
const STARTING_CAPACITY = 50

export const DEFAULT_PLAYER_PROFILE: PlayerProfile = {
  credits: 0,
  currentStage: 1,
  soundEnabled: false,
  upgrades: {
    garrison: 1,
    production: 1,
    capacity: 1,
  },
}

const UPGRADE_DETAILS: Record<UpgradeType, { amount: number }> = {
  garrison: { amount: GARRISON_PER_UPGRADE_LEVEL },
  production: { amount: 1 },
  capacity: { amount: 1 },
}

// === 3. 프로필 및 업그레이드 로직 ===
/**
 * Calculates the price of upgrading from the current level.
 */
export function getUpgradeCost(currentLevel: number): number {
  return (Math.floor(currentLevel / 10) + 1) * 10
}

/**
 * Converts upgrade levels into the player's game-start values.
 */
export function getPlayerStats(profile: PlayerProfile): PlayerStats {
  return {
    startingGarrison:
      STARTING_GARRISON + (profile.upgrades.garrison - 1) * UPGRADE_DETAILS.garrison.amount,
    productionTenths:
      STARTING_PRODUCTION_TENTHS +
      (profile.upgrades.production - 1) * UPGRADE_DETAILS.production.amount,
    capacity:
      STARTING_CAPACITY + (profile.upgrades.capacity - 1) * UPGRADE_DETAILS.capacity.amount,
  }
}

/**
 * Returns a new profile when the player can afford the selected upgrade.
 */
export function purchaseUpgrade(
  profile: PlayerProfile,
  upgradeType: UpgradeType,
): PlayerProfile {
  const currentLevel = profile.upgrades[upgradeType]
  const cost = getUpgradeCost(currentLevel)
  if (profile.credits < cost) return profile

  return {
    credits: profile.credits - cost,
    currentStage: profile.currentStage,
    soundEnabled: profile.soundEnabled,
    upgrades: {
      ...profile.upgrades,
      [upgradeType]: currentLevel + 1,
    },
  }
}

/**
 * Converts the player's profile into settings for a new match.
 */
export function getGameSettings(profile: PlayerProfile): GameSettings {
  const stats = getPlayerStats(profile)
  return {
    playerStartingTroops: stats.startingGarrison,
    playerProductionTenths: stats.productionTenths,
    playerCapacity: stats.capacity,
  }
}

/**
 * Adds the reward for a completed match and returns the awarded amount.
 */
export function awardGameReward(
  profile: PlayerProfile,
  result: GameResult,
): { profile: PlayerProfile; creditsEarned: number } {
  const creditsEarned = result === 'player' ? 50 : 10
  return {
    profile: {
      ...profile,
      credits: profile.credits + creditsEarned,
      currentStage: result === 'player'
        ? Math.min(profile.currentStage + 1, STAGE_DEFINITIONS.length)
        : profile.currentStage,
    },
    creditsEarned,
  }
}

/**
 * Loads and validates the locally saved player profile.
 */
export function loadPlayerProfile(): ProfileLoadResult {
  try {
    const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY)
    if (storedProfile === null) return { profile: DEFAULT_PLAYER_PROFILE, error: null }

    const parsed: unknown = JSON.parse(storedProfile)
    if (!isStoredPlayerProfile(parsed)) throw new Error('Invalid saved player profile')
    return {
      profile: {
        credits: parsed.credits,
        currentStage: parsed.currentStage ?? 1,
        soundEnabled: parsed.soundEnabled ?? DEFAULT_PLAYER_PROFILE.soundEnabled,
        upgrades: parsed.upgrades,
      },
      error: null,
    }
  } catch (error) {
    console.error('Unable to load the DotWar player profile.', error)
    return {
      profile: DEFAULT_PLAYER_PROFILE,
      error: '저장된 진행 정보를 불러오지 못했습니다. 이번 세션에서는 임시로 진행합니다.',
    }
  }
}

/**
 * Persists the player's credits, campaign progress, upgrades, and preferences.
 */
export function savePlayerProfile(profile: PlayerProfile): void {
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
}

/**
 * Checks that saved data has the expected profile shape.
 */
function isStoredPlayerProfile(value: unknown): value is StoredPlayerProfile {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>
  if (!isIntegerAtLeast(candidate.credits, 0)) return false
  if (typeof candidate.upgrades !== 'object' || candidate.upgrades === null) return false
  if (
    candidate.currentStage !== undefined &&
    (!isIntegerAtLeast(candidate.currentStage, 1) ||
      candidate.currentStage > STAGE_DEFINITIONS.length)
  ) {
    return false
  }
  if (candidate.soundEnabled !== undefined && typeof candidate.soundEnabled !== 'boolean') {
    return false
  }

  const upgrades = candidate.upgrades as Record<string, unknown>
  return (['garrison', 'production', 'capacity'] as const).every(
    (upgradeType) => isIntegerAtLeast(upgrades[upgradeType], 1),
  )
}

/**
 * Validates a saved integer value without coercion.
 */
function isIntegerAtLeast(value: unknown, minimum: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= minimum
}
