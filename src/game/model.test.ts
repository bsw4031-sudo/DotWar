import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  gameReducer,
  getMovementDurationMs,
  getEnemyMoves,
  MIN_TERRITORY_DISTANCE,
  MIN_TERRITORY_TRAVEL_TIME_MS,
  STAGE_DEFINITIONS,
  TURRET_ATTACK_INTERVAL_MS,
} from './model'
import { awardGameReward } from './profile'
import type { GameState } from './model'

/**
 * Returns a copy of the game with one territory adjusted for a scenario.
 */
function updateTerritory(
  state: GameState,
  territoryId: string,
  changes: Partial<GameState['territories'][number]>,
): GameState {
  return {
    ...state,
    territories: state.territories.map((territory) =>
      territory.id === territoryId ? { ...territory, ...changes } : territory,
    ),
  }
}

/**
 * Creates a short-distance setup for testing dispatch wave timing.
 */
function createWaveTestState(
  homeTroops: number,
  targetTroops: number,
  targetFaction: 'player' | 'neutral' = 'neutral',
): GameState {
  let state = createInitialGameState(0)
  state = updateTerritory(state, 'home', { x: 50, y: 50, troops: homeTroops })
  state = updateTerritory(state, 'west', {
    x: 50,
    y: 50,
    faction: targetFaction,
    troops: targetTroops,
  })
  return { ...state, links: [{ fromId: 'home', toId: 'west' }] }
}

/**
 * Creates a stage-one test map with a controlled set of enemy neighbors.
 */
function createEnemyTestState(): GameState {
  const state = createInitialGameState(0, undefined, 1, () => 0.37)
  return {
    ...state,
    links: [
      { fromId: 'enemy-1', toId: 'center' },
      { fromId: 'enemy-1', toId: 'west' },
      { fromId: 'enemy-1', toId: 'east' },
    ],
  }
}

describe('gameReducer', () => {
  it('hides the starting marker after the first valid player move', () => {
    const initialState = createInitialGameState(0)
    expect(initialState.hasPlayerIssuedMove).toBe(false)

    const rejectedMove = gameReducer(initialState, {
      type: 'send',
      fromId: 'home',
      toId: 'home',
      faction: 'player',
      troopsToSend: 10,
      now: 0,
    })
    expect(rejectedMove.hasPlayerIssuedMove).toBe(false)

    const playerMove = gameReducer(initialState, {
      type: 'send',
      fromId: 'home',
      toId: 'west',
      faction: 'player',
      troopsToSend: 10,
      now: 0,
    })
    expect(playerMove.hasPlayerIssuedMove).toBe(true)
  })

  it('produces troops for player and enemy territories but not neutral ones', () => {
    const initialState = createInitialGameState(0)
    expect(initialState.territories.every((territory) => territory.troops === 10)).toBe(true)
    const nextState = gameReducer(initialState, { type: 'tick', now: 1000 })

    expect(nextState.territories.find(({ id }) => id === 'home')?.troops).toBe(11)
    expect(nextState.territories.find(({ id }) => id === 'enemy-1')?.troops).toBe(11)
    expect(nextState.territories.find(({ id }) => id === 'west')?.troops).toBe(10)
  })

  it('applies upgraded starting troops and fractional production rates', () => {
    let state = createInitialGameState(0, {
      playerStartingTroops: 12,
      playerProductionTenths: 11,
      playerCapacity: 50,
    })
    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(12)

    state = gameReducer(state, { type: 'tick', now: 9000 })
    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(21)
    state = gameReducer(state, { type: 'tick', now: 10000 })
    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(23)
  })

  it('stops production at the configured territory capacity', () => {
    const initialState = createInitialGameState(0, {
      playerStartingTroops: 10,
      playerProductionTenths: 11,
      playerCapacity: 11,
    })
    const state = gameReducer(initialState, { type: 'tick', now: 5000 })

    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(11)
    expect(state.territories.find(({ id }) => id === 'enemy-1')?.troops).toBe(15)
  })

  it('sends all troops in waves of five every 250 milliseconds', () => {
    let state = gameReducer(createWaveTestState(14, 12), {
      type: 'send',
      fromId: 'home',
      toId: 'west',
      faction: 'player',
      troopsToSend: 14,
      now: 0,
    })

    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(14)
    expect(state.movements).toHaveLength(0)
    expect(state.dispatches[0]).toMatchObject({ remainingTroops: 14, nextLaunchAt: 250 })

    state = gameReducer(state, { type: 'tick', now: 250 })
    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(9)
    expect(state.movements.map(({ troops }) => troops)).toEqual([5])

    state = gameReducer(state, { type: 'tick', now: 500 })
    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(4)
    expect(state.movements.map(({ troops }) => troops)).toEqual([5, 5])

    state = gameReducer(state, { type: 'tick', now: 750 })
    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(0)
    expect(state.movements.map(({ troops }) => troops)).toEqual([5, 5, 4])
    expect(state.dispatches).toHaveLength(0)
  })

  it('splits remaining troops across a second dispatch from the same territory', () => {
    let state = gameReducer(createWaveTestState(100, 0, 'player'), {
      type: 'send',
      fromId: 'home',
      toId: 'west',
      faction: 'player',
      troopsToSend: 100,
      now: 0,
    })
    state = gameReducer(state, { type: 'tick', now: 1000 })
    state = updateTerritory(state, 'east', {
      faction: 'player',
      troops: 0,
      x: 50,
      y: 50,
    })

    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(80)
    state = gameReducer(state, {
      type: 'send',
      fromId: 'home',
      toId: 'east',
      faction: 'player',
      troopsToSend: 80,
      now: 1000,
    })

    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(80)
    expect(state.dispatches.map(({ toId, remainingTroops }) => [toId, remainingTroops]))
      .toEqual([['west', 40], ['east', 40]])
    expect(new Set(state.dispatches.map(({ nextLaunchAt }) => nextLaunchAt)))
      .toEqual(new Set([1250]))

    state = gameReducer(state, { type: 'tick', now: 1250 })
    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(70)
    state = gameReducer(state, { type: 'tick', now: 3000 })
    const troopsSentTo = (territoryId: string) =>
      (state.territories.find(({ id }) => id === territoryId)?.troops ?? 0) +
      state.movements
        .filter((movement) => movement.toId === territoryId)
        .reduce((total, movement) => total + movement.troops, 0)

    expect(state.dispatches).toHaveLength(0)
    expect(troopsSentTo('west')).toBe(60)
    expect(troopsSentTo('east')).toBe(40)
    expect(state.productionNextAt.home).toBe(4000)
  })

  it('pauses source production during dispatch and resumes one second after the last wave', () => {
    let state = gameReducer(createWaveTestState(14, 12), {
      type: 'send',
      fromId: 'home',
      toId: 'west',
      faction: 'player',
      troopsToSend: 14,
      now: 0,
    })

    state = gameReducer(state, { type: 'tick', now: 1000 })
    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(0)

    state = gameReducer(state, { type: 'tick', now: 1499 })
    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(0)

    state = gameReducer(state, { type: 'tick', now: 1749 })
    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(0)

    state = gameReducer(state, { type: 'tick', now: 1750 })
    expect(state.territories.find(({ id }) => id === 'home')?.troops).toBe(1)
  })

  it('resolves each wave in order and captures with the remaining troops', () => {
    let state = gameReducer(createWaveTestState(14, 12), {
      type: 'send',
      fromId: 'home',
      toId: 'west',
      faction: 'player',
      troopsToSend: 14,
      now: 0,
    })
    state = gameReducer(state, { type: 'tick', now: 1450 })

    expect(state.territories.find(({ id }) => id === 'west')).toMatchObject({
      faction: 'player',
      troops: 2,
    })
  })

  it('reduces defenders when the complete attack is too small to capture', () => {
    let state = gameReducer(createWaveTestState(14, 30), {
      type: 'send',
      fromId: 'home',
      toId: 'west',
      faction: 'player',
      troopsToSend: 14,
      now: 0,
    })
    state = gameReducer(state, { type: 'tick', now: 1450 })

    expect(state.territories.find(({ id }) => id === 'west')).toMatchObject({
      faction: 'neutral',
      troops: 16,
    })
  })

  it('reinforces a friendly territory and ends the game after the final capture', () => {
    let reinforcedState = gameReducer(createWaveTestState(14, 5, 'player'), {
      type: 'send',
      fromId: 'home',
      toId: 'west',
      faction: 'player',
      troopsToSend: 14,
      now: 0,
    })
    reinforcedState = gameReducer(reinforcedState, { type: 'tick', now: 1450 })
    expect(reinforcedState.territories.find(({ id }) => id === 'west')?.troops).toBe(19)

    const initialState = createInitialGameState(0)
    const nearVictory: GameState = {
      ...initialState,
      territories: initialState.territories.map((territory) => ({
        ...territory,
        faction: territory.id === 'home'
          ? 'player'
          : territory.id === 'enemy-1'
            ? 'enemy'
            : 'neutral',
        troops: territory.id === 'home' ? 2 : territory.id === 'enemy-1' ? 0 : territory.troops,
        x: 50,
        y: 50,
      })),
    }
    const finalAttack = gameReducer(nearVictory, {
      type: 'send',
      fromId: 'home',
      toId: 'enemy-1',
      faction: 'player',
      troopsToSend: 2,
      now: 0,
    })
    const attackLaunched = gameReducer(finalAttack, {
      type: 'tick',
      now: finalAttack.dispatches[0].nextLaunchAt,
    })
    const victory = gameReducer(attackLaunched, {
      type: 'tick',
      now: attackLaunched.movements[0].arrivesAt,
    })

    expect(victory.result).toBe('player')
    expect(victory.territories.filter(({ faction }) => faction === 'neutral')).toHaveLength(4)
  })

  it('defeats the player after losing its last territory', () => {
    let state = createEnemyTestState()
    state = updateTerritory(state, 'home', { troops: 1 })
    state = updateTerritory(state, 'enemy-1', { troops: 1 })
    state = {
      ...state,
      territories: state.territories.map((territory) =>
        territory.id === 'home'
          ? territory
          : territory.id === 'enemy-1'
            ? territory
            : { ...territory, faction: 'neutral', aiId: null },
      ),
    }

    state = gameReducer(state, {
      type: 'send',
      fromId: 'enemy-1',
      toId: 'home',
      faction: 'enemy',
      aiId: 1,
      troopsToSend: 1,
      now: 0,
    })
    state = gameReducer(state, { type: 'tick', now: state.dispatches[0].nextLaunchAt })
    const defeat = gameReducer(state, { type: 'tick', now: state.movements[0].arrivesAt })

    expect(defeat.result).toBe('enemy')
  })
})

describe('stage campaign', () => {
  it.each(STAGE_DEFINITIONS)(
    'creates stage $stage with the configured territory and AI counts',
    ({ stage, territoryCount, enemyCount, turretCount }) => {
      const state = createInitialGameState(0, undefined, stage, () => 0.37)
      const enemyTerritories = state.territories.filter(
        (territory) => territory.faction === 'enemy',
      )
      const territories = state.territories

      expect(state.territories).toHaveLength(territoryCount)
      expect(new Set(enemyTerritories.map(({ aiId }) => aiId)).size).toBe(enemyCount)
      const enemyUpgradeLevel = Math.min(stage - 1, 6)
      expect(state.enemyStartingTroops).toBe(10 + enemyUpgradeLevel * 2)
      expect(state.enemyProductionTenths).toBe(10 + enemyUpgradeLevel)
      expect(state.enemyCapacity).toBe(50 + enemyUpgradeLevel)
      expect(state.territories.filter(({ isTurret }) => isTurret)).toHaveLength(turretCount)
      for (let first = 0; first < territories.length; first += 1) {
        for (let second = first + 1; second < territories.length; second += 1) {
          expect(Math.hypot(
            territories[first].x - territories[second].x,
            territories[first].y - territories[second].y,
          )).toBeGreaterThanOrEqual(MIN_TERRITORY_DISTANCE)
          expect(getMovementDurationMs(
            territories[first],
            territories[second],
          )).toBeGreaterThanOrEqual(MIN_TERRITORY_TRAVEL_TIME_MS)
        }
      }
    },
  )

  it('randomizes both map axes without reducing territory spacing', () => {
    for (let initialSeed = 1; initialSeed <= 20; initialSeed += 1) {
      let seed = initialSeed
      const random = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296
        return seed / 4294967296
      }
      const territories = createInitialGameState(0, undefined, 7, random).territories

      expect(new Set(territories.map(({ x }) => x)).size).toBeGreaterThan(10)
      expect(new Set(territories.map(({ y }) => y)).size).toBeGreaterThan(10)
      for (let first = 0; first < territories.length; first += 1) {
        for (let second = first + 1; second < territories.length; second += 1) {
          expect(Math.hypot(
            territories[first].x - territories[second].x,
            territories[first].y - territories[second].y,
          )).toBeGreaterThanOrEqual(MIN_TERRITORY_DISTANCE)
        }
      }
    }
  })

  it('supports enemy AI attacking and capturing a different AI territory', () => {
    let state = createInitialGameState(0, undefined, 3, () => 0.37)
    state = updateTerritory(state, 'enemy-1', { troops: 20 })
    state = updateTerritory(state, 'enemy-2', { troops: 10 })
    state = {
      ...state,
      links: [{ fromId: 'enemy-1', toId: 'enemy-2' }],
    }
    state = gameReducer(state, {
      type: 'send',
      fromId: 'enemy-1',
      toId: 'enemy-2',
      faction: 'enemy',
      aiId: 1,
      troopsToSend: 20,
      now: 0,
    })
    state = gameReducer(state, { type: 'tick', now: 1000 })
    const lastArrival = Math.max(...state.movements.map(({ arrivesAt }) => arrivesAt))
    const resolved = gameReducer(state, { type: 'tick', now: lastArrival })

    expect(resolved.territories.find(({ id }) => id === 'enemy-2')).toMatchObject({
      faction: 'enemy',
      aiId: 1,
    })
    expect(resolved.result).toBeNull()
  })

  it('opens the next stage on victory and stays on the current stage after defeat', () => {
    const startingProfile = {
      credits: 0,
      currentStage: 6,
      soundEnabled: false,
      upgrades: { garrison: 1, production: 1, capacity: 1 },
    }

    expect(awardGameReward(startingProfile, 'player').profile.currentStage).toBe(7)
    expect(awardGameReward(startingProfile, 'enemy').profile.currentStage).toBe(6)
    expect(awardGameReward({ ...startingProfile, currentStage: 7 }, 'player')
      .profile.currentStage).toBe(8)
    expect(awardGameReward({ ...startingProfile, currentStage: 8 }, 'player')
      .profile.currentStage).toBe(9)
    expect(
      awardGameReward({ ...startingProfile, currentStage: STAGE_DEFINITIONS.length }, 'player')
        .profile.currentStage,
    ).toBe(STAGE_DEFINITIONS.length)
  })

  it('pauses troop movement and production while shifting scheduled times on resume', () => {
    let state = gameReducer(createWaveTestState(10, 10), {
      type: 'send',
      fromId: 'home',
      toId: 'west',
      faction: 'player',
      troopsToSend: 10,
      now: 0,
    })
    state = gameReducer(state, { type: 'tick', now: 250 })
    const originalArrivalAt = state.movements[0].arrivesAt

    state = gameReducer(state, { type: 'resume', now: 1000, pausedAt: 200 })

    expect(state.movements[0].startedAt).toBe(1050)
    expect(state.movements[0].arrivesAt).toBe(originalArrivalAt + 800)
    expect(state.dispatches[0].nextLaunchAt).toBe(1300)
    expect(state.productionNextAt.home).toBe(1800)
  })
})

describe('getEnemyMoves', () => {
  it('sends all source troops when it can outnumber an adjacent target', () => {
    let state = updateTerritory(createEnemyTestState(), 'enemy-1', { troops: 14 })
    state = updateTerritory(state, 'center', { troops: 10 })

    expect(getEnemyMoves(state)).toEqual([{
      aiId: 1,
      fromId: 'enemy-1',
      toId: 'center',
      troopsToSend: 14,
    }])
  })

  it('uses the weakest target when no immediately capturable neighbor is available', () => {
    let state = updateTerritory(createEnemyTestState(), 'enemy-1', { troops: 16 })
    state = updateTerritory(state, 'center', { troops: 9 })
    state = updateTerritory(state, 'west', { troops: 11 })
    state = updateTerritory(state, 'east', { troops: 12 })

    expect(getEnemyMoves(state)).toEqual([{
      aiId: 1,
      fromId: 'enemy-1',
      toId: 'center',
      troopsToSend: 16,
    }])
  })

  it('accounts for target production before deciding if an attack can capture', () => {
    let state = updateTerritory(createEnemyTestState(), 'enemy-1', {
      troops: 12,
      x: 20,
      y: 50,
    })
    state = updateTerritory(state, 'home', {
      faction: 'player',
      aiId: null,
      troops: 11,
      x: 80,
      y: 50,
    })
    state = updateTerritory(state, 'west', {
      troops: 11,
      x: 20,
      y: 80,
    })
    state = {
      ...state,
      links: [
        { fromId: 'enemy-1', toId: 'home' },
        { fromId: 'enemy-1', toId: 'west' },
      ],
      productionNextAt: { ...state.productionNextAt, home: 1000 },
    }

    expect(getEnemyMoves(state, 0)).toEqual([{
      aiId: 1,
      fromId: 'enemy-1',
      toId: 'west',
      troopsToSend: 12,
    }])
  })

  it('forces a full-capacity attack against the nearest hostile territory', () => {
    let state = updateTerritory(createEnemyTestState(), 'enemy-1', {
      troops: 50,
      x: 20,
      y: 50,
    })
    state = updateTerritory(state, 'home', {
      troops: 60,
      x: 60,
      y: 50,
    })
    state = updateTerritory(state, 'center', {
      troops: 1,
      x: 20,
      y: 80,
    })
    state = {
      ...state,
      links: [
        { fromId: 'enemy-1', toId: 'home' },
        { fromId: 'enemy-1', toId: 'center' },
      ],
    }

    expect(getEnemyMoves(state)).toEqual([{
      aiId: 1,
      fromId: 'enemy-1',
      toId: 'home',
      troopsToSend: 50,
    }])
  })

  it('chooses no more than one move for each active AI and allows AI-vs-AI targets', () => {
    let state = createInitialGameState(0, undefined, 3, () => 0.37)
    state = updateTerritory(state, 'enemy-1', { troops: 20 })
    state = updateTerritory(state, 'enemy-2', { troops: 20 })
    state = {
      ...state,
      links: [
        { fromId: 'enemy-1', toId: 'enemy-2' },
        { fromId: 'enemy-1', toId: 'west' },
        { fromId: 'enemy-2', toId: 'center' },
      ],
      territories: state.territories.map((territory) =>
        territory.faction === 'enemy'
          ? territory
          : { ...territory, faction: 'neutral', aiId: null, troops: 0 },
      ),
    }

    const moves = getEnemyMoves(state)
    expect(moves).toHaveLength(2)
    expect(new Set(moves.map(({ aiId }) => aiId))).toEqual(new Set([1, 2]))
    expect(moves.find(({ aiId }) => aiId === 1)?.toId).toBe('west')
    expect(moves.find(({ aiId }) => aiId === 2)?.toId).toBe('center')
  })

  it('does not attack if no neighbor can be outnumbered at arrival', () => {
    let state = updateTerritory(createEnemyTestState(), 'enemy-1', { troops: 11 })
    state = updateTerritory(state, 'center', { troops: 11 })
    state = updateTerritory(state, 'west', { troops: 11 })
    state = updateTerritory(state, 'east', { troops: 11 })
    expect(getEnemyMoves(state, 0)).toEqual([])
  })
})

describe('turret territories', () => {
  it('intercepts one hostile troop per attack interval while it is in range', () => {
    let state = createInitialGameState(0, undefined, 8, () => 0.37)
    state = updateTerritory(state, 'center', { x: 50, y: 50 })
    state = updateTerritory(state, 'enemy-1', { x: 30, y: 50, troops: 3 })
    state = updateTerritory(state, 'west', { x: 70, y: 50 })
    state = gameReducer(state, {
      type: 'send',
      fromId: 'enemy-1',
      toId: 'west',
      faction: 'enemy',
      aiId: 1,
      troopsToSend: 3,
      now: 0,
    })

    state = gameReducer(state, { type: 'tick', now: TURRET_ATTACK_INTERVAL_MS })
    expect(state.movements[0].troops).toBe(2)
    expect(state.turretNextShotAt.center).toBe(TURRET_ATTACK_INTERVAL_MS * 2)

    state = gameReducer(state, { type: 'tick', now: 999 })
    expect(state.movements[0].troops).toBe(2)
    state = gameReducer(state, { type: 'tick', now: 1000 })
    expect(state.movements[0].troops).toBe(1)
  })

  it('protects its player owner from friendly troops and intercepts enemy AI troops', () => {
    let state = createInitialGameState(0, undefined, 8, () => 0.37)
    state = updateTerritory(state, 'center', {
      x: 50,
      y: 50,
      faction: 'player',
    })
    state = updateTerritory(state, 'home', { x: 30, y: 50, troops: 3 })
    state = updateTerritory(state, 'west', { x: 70, y: 50 })
    state = updateTerritory(state, 'enemy-1', {
      x: 30,
      y: 40,
      troops: 3,
    })
    state = updateTerritory(state, 'east', { x: 70, y: 40 })

    state = gameReducer(state, {
      type: 'send',
      fromId: 'home',
      toId: 'west',
      faction: 'player',
      troopsToSend: 3,
      now: 0,
    })
    state = gameReducer(state, {
      type: 'send',
      fromId: 'enemy-1',
      toId: 'east',
      faction: 'enemy',
      aiId: 1,
      troopsToSend: 3,
      now: 0,
    })
    state = gameReducer(state, { type: 'tick', now: TURRET_ATTACK_INTERVAL_MS })

    expect(state.movements.find(({ faction }) => faction === 'player')?.troops).toBe(3)
    expect(state.movements.find(({ faction }) => faction === 'enemy')?.troops).toBe(2)
  })
})

describe('movement collisions', () => {
  it('cancels moving troops one-for-one when opposing waves meet', () => {
    let state = createInitialGameState(0, undefined, 3)
    state = updateTerritory(state, 'home', { x: 20, y: 50, troops: 3 })
    state = updateTerritory(state, 'west', { x: 80, y: 50, troops: 0 })
    state = updateTerritory(state, 'enemy-1', {
      x: 80,
      y: 50,
      troops: 1,
    })
    state = updateTerritory(state, 'north', { x: 20, y: 50, troops: 0 })
    state = gameReducer(state, {
      type: 'send',
      fromId: 'home',
      toId: 'west',
      faction: 'player',
      troopsToSend: 3,
      now: 0,
    })
    state = gameReducer(state, {
      type: 'send',
      fromId: 'enemy-1',
      toId: 'north',
      faction: 'enemy',
      aiId: 1,
      troopsToSend: 1,
      now: 0,
    })
    state = gameReducer(state, { type: 'tick', now: 1800 })

    expect(state.movements).toHaveLength(1)
    expect(state.movements[0]).toMatchObject({ faction: 'player', troops: 2 })
    expect(state.movements[0].unitIds).toHaveLength(2)
  })

  it('lets friendly moving troops pass through one another', () => {
    let state = createInitialGameState(0, undefined, 3)
    state = updateTerritory(state, 'home', { x: 20, y: 50, troops: 3 })
    state = updateTerritory(state, 'west', { x: 80, y: 50, troops: 0 })
    state = updateTerritory(state, 'center', {
      x: 80,
      y: 50,
      faction: 'player',
      troops: 1,
    })
    state = updateTerritory(state, 'north', { x: 20, y: 50, troops: 0 })
    state = gameReducer(state, {
      type: 'send',
      fromId: 'home',
      toId: 'west',
      faction: 'player',
      troopsToSend: 3,
      now: 0,
    })
    state = gameReducer(state, {
      type: 'send',
      fromId: 'center',
      toId: 'north',
      faction: 'player',
      troopsToSend: 1,
      now: 0,
    })
    state = gameReducer(state, { type: 'tick', now: 890 })

    expect(state.movements.map(({ troops }) => troops)).toEqual([3, 1])
  })
})
