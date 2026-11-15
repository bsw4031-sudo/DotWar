import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  awardGameReward,
  DEFAULT_PLAYER_PROFILE,
  getGameSettings,
  getPlayerStats,
  getUpgradeCost,
  loadPlayerProfile,
  purchaseUpgrade,
} from './profile'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('player profile upgrades', () => {
  it('starts with the requested default stats and free credits', () => {
    expect(DEFAULT_PLAYER_PROFILE.credits).toBe(0)
    expect(getPlayerStats(DEFAULT_PLAYER_PROFILE)).toEqual({
      startingGarrison: 10,
      productionTenths: 10,
      capacity: 50,
    })
  })

  it('increases stats by their configured amount and charges by level band', () => {
    expect(getUpgradeCost(1)).toBe(10)
    expect(getUpgradeCost(10)).toBe(20)
    expect(getUpgradeCost(20)).toBe(30)

    const profile = purchaseUpgrade(
      {
        credits: 30,
        currentStage: 1,
        soundEnabled: false,
        upgrades: { garrison: 1, production: 1, capacity: 1 },
      },
      'production',
    )
    expect(profile).toEqual({
      credits: 20,
      currentStage: 1,
      soundEnabled: false,
      upgrades: { garrison: 1, production: 2, capacity: 1 },
    })
    expect(getPlayerStats(profile).productionTenths).toBe(11)
    expect(getGameSettings(profile).playerProductionTenths).toBe(11)
  })

  it('passes garrison and capacity upgrades into a new match', () => {
    let profile = {
      credits: 20,
      currentStage: 1,
      soundEnabled: false,
      upgrades: { garrison: 1, production: 1, capacity: 1 },
    }
    profile = purchaseUpgrade(profile, 'garrison')
    profile = purchaseUpgrade(profile, 'capacity')

    expect(getGameSettings(profile)).toEqual({
      playerStartingTroops: 12,
      playerProductionTenths: 10,
      playerCapacity: 51,
    })
  })

  it('does not buy an unaffordable upgrade and awards the correct match reward', () => {
    const unchanged = purchaseUpgrade(DEFAULT_PLAYER_PROFILE, 'garrison')
    expect(unchanged).toBe(DEFAULT_PLAYER_PROFILE)

    expect(awardGameReward(DEFAULT_PLAYER_PROFILE, 'player')).toMatchObject({
      profile: { credits: 50 },
      creditsEarned: 50,
    })
    expect(awardGameReward(DEFAULT_PLAYER_PROFILE, 'enemy')).toMatchObject({
      profile: { credits: 10 },
      creditsEarned: 10,
    })
  })

  it('migrates saved profiles without a stage field to the first stage', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => JSON.stringify({
          credits: 25,
          upgrades: { garrison: 2, production: 1, capacity: 1 },
        }),
      },
    })

    expect(loadPlayerProfile()).toEqual({
      profile: {
        credits: 25,
        currentStage: 1,
        soundEnabled: false,
        upgrades: { garrison: 2, production: 1, capacity: 1 },
      },
      error: null,
    })
  })
})
