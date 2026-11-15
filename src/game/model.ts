// === 1. Import 영역 ===

// === 2. 타입 및 상수 영역 ===
export type Faction = 'player' | 'enemy' | 'neutral'

export interface Territory {
  id: string
  name: string
  x: number
  y: number
  faction: Faction
  aiId: number | null
  isTurret: boolean
  troops: number
}

export interface TerritoryLink {
  fromId: string
  toId: string
}

export interface TroopMovement {
  id: number
  fromId: string
  toId: string
  faction: Faction
  aiId: number | null
  troops: number
  unitIds: number[]
  startedAt: number
  durationMs: number
  arrivesAt: number
}

export interface TroopPosition {
  unitId: number
  x: number
  y: number
}

export interface TroopDispatch {
  id: number
  fromId: string
  toId: string
  faction: 'player' | 'enemy'
  aiId: number | null
  remainingTroops: number
  nextLaunchAt: number
}

export interface GameState {
  stage: number
  territories: Territory[]
  links: TerritoryLink[]
  movements: TroopMovement[]
  dispatches: TroopDispatch[]
  productionNextAt: Record<string, number>
  productionRemainderTenths: Record<string, number>
  playerProductionTenths: number
  playerCapacity: number
  enemyStartingTroops: number
  enemyProductionTenths: number
  enemyCapacity: number
  turretNextShotAt: Record<string, number>
  simulationAt: number
  nextMovementId: number
  nextDispatchId: number
  nextTroopId: number
  result: 'player' | 'enemy' | null
}

export const TROOPS_PER_WAVE = 5
export const TROOP_WAVE_INTERVAL_MS = 250
export const DEFAULT_TROOP_CAPACITY = 50
const TROOP_PRODUCTION_INTERVAL_MS = 1000
const PRODUCTION_TENTHS_PER_TROOP = 10
const DEFAULT_PRODUCTION_TENTHS = 10
const MOVEMENT_STARTUP_MS = 700
export const MIN_TERRITORY_TRAVEL_TIME_MS = 1500
export const MIN_TERRITORY_DISTANCE = 20
export const TURRET_ATTACK_INTERVAL_MS = 500
export const TURRET_RANGE = 20
const MOVEMENT_MS_PER_DISTANCE =
  (MIN_TERRITORY_TRAVEL_TIME_MS - MOVEMENT_STARTUP_MS) / MIN_TERRITORY_DISTANCE
const TROOP_COLLISION_RADIUS = 1.5
const TROOP_DOT_SPACING = 1.5

export interface GameSettings {
  playerStartingTroops: number
  playerProductionTenths: number
  playerCapacity: number
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  playerStartingTroops: 10,
  playerProductionTenths: DEFAULT_PRODUCTION_TENTHS,
  playerCapacity: DEFAULT_TROOP_CAPACITY,
}

export interface StageDefinition {
  stage: number
  territoryCount: number
  enemyCount: number
  turretCount: number
}

export interface EnemyMove {
  aiId: number
  fromId: string
  toId: string
  troopsToSend: number
}

export interface FactionStats {
  player: number
  enemy: number
  neutral: number
  total: number
}

type GameAction =
  | { type: 'reset'; now: number; settings?: GameSettings; stage?: number }
  | { type: 'resume'; now: number; pausedAt: number }
  | { type: 'tick'; now: number }
  | {
      type: 'send'
      fromId: string
      toId: string
      faction: 'player' | 'enemy'
      aiId?: number
      troopsToSend: number
      now: number
    }

export const STAGE_DEFINITIONS: StageDefinition[] = [
  { stage: 1, territoryCount: 6, enemyCount: 1, turretCount: 0 },
  { stage: 2, territoryCount: 8, enemyCount: 1, turretCount: 0 },
  { stage: 3, territoryCount: 9, enemyCount: 2, turretCount: 0 },
  { stage: 4, territoryCount: 10, enemyCount: 2, turretCount: 0 },
  { stage: 5, territoryCount: 12, enemyCount: 3, turretCount: 0 },
  { stage: 6, territoryCount: 13, enemyCount: 4, turretCount: 0 },
  { stage: 7, territoryCount: 15, enemyCount: 4, turretCount: 0 },
  { stage: 8, territoryCount: 15, enemyCount: 4, turretCount: 1 },
]
export const FACTION_LABELS: Record<Faction, string> = {
  player: '아군',
  enemy: '적군',
  neutral: '중립',
}

interface TerritoryTemplate {
  id: string
  name: string
  faction: Faction
  aiId: number | null
  isTurret: boolean
}

interface MapPoint {
  x: number
  y: number
}

interface InterceptableTroop {
  movementId: number
  unitId: number
  distance: number
}

const TERRITORY_TEMPLATES: TerritoryTemplate[] = [
  { id: 'home', name: '본진', faction: 'player', aiId: null, isTurret: false },
  { id: 'enemy-1', name: '전초 1', faction: 'enemy', aiId: 1, isTurret: false },
  { id: 'west', name: '서부', faction: 'neutral', aiId: null, isTurret: false },
  { id: 'east', name: '동부', faction: 'neutral', aiId: null, isTurret: false },
  { id: 'center', name: '중앙', faction: 'neutral', aiId: null, isTurret: false },
  { id: 'southwest', name: '남서', faction: 'neutral', aiId: null, isTurret: false },
  { id: 'southeast', name: '남동', faction: 'neutral', aiId: null, isTurret: false },
  { id: 'north', name: '북부', faction: 'neutral', aiId: null, isTurret: false },
  { id: 'enemy-2', name: '전초 2', faction: 'enemy', aiId: 2, isTurret: false },
  { id: 'northwest', name: '고원', faction: 'neutral', aiId: null, isTurret: false },
  { id: 'south', name: '남부', faction: 'neutral', aiId: null, isTurret: false },
  { id: 'enemy-3', name: '전초 3', faction: 'enemy', aiId: 3, isTurret: false },
  { id: 'enemy-4', name: '전초 4', faction: 'enemy', aiId: 4, isTurret: false },
  { id: 'outpost-west', name: '서초소', faction: 'neutral', aiId: null, isTurret: false },
  { id: 'outpost-east', name: '동초소', faction: 'neutral', aiId: null, isTurret: false },
]

const MAP_POSITION_SLOTS: MapPoint[] = [
  { x: 14, y: 10 }, { x: 38, y: 10 }, { x: 62, y: 10 }, { x: 86, y: 10 },
  { x: 14, y: 36 }, { x: 38, y: 36 }, { x: 62, y: 36 }, { x: 86, y: 36 },
  { x: 14, y: 64 }, { x: 38, y: 64 }, { x: 62, y: 64 }, { x: 86, y: 64 },
  { x: 14, y: 90 }, { x: 38, y: 90 }, { x: 62, y: 90 }, { x: 86, y: 90 },
]

// === 3. 게임 로직 ===
/**
 * Creates a stage map with randomized, spaced positions and faction upgrades.
 */
export function createInitialGameState(
  now = Date.now(),
  settings: GameSettings = DEFAULT_GAME_SETTINGS,
  stage = 1,
  random: () => number = Math.random,
): GameState {
  const stageDefinition = getStageDefinition(stage)
  const positions = getRandomizedPositions(stageDefinition.territoryCount, random)
  const enemyLevel = Math.min(stageDefinition.stage - 1, 6)
  const enemyStartingTroops = 10 + enemyLevel * 2
  const enemyProductionTenths = DEFAULT_PRODUCTION_TENTHS + enemyLevel
  const enemyCapacity = DEFAULT_TROOP_CAPACITY + enemyLevel
  const territories = TERRITORY_TEMPLATES
    .slice(0, stageDefinition.territoryCount)
    .map((template, index) => ({
      ...template,
      ...positions[index],
      isTurret: template.id === 'center' && stageDefinition.turretCount > 0,
      troops: template.faction === 'player'
        ? settings.playerStartingTroops
        : template.faction === 'enemy'
          ? enemyStartingTroops
          : 10,
    }))
  const links = buildTerritoryLinks(territories)
  const productionNextAt = Object.fromEntries(
    territories
      .filter((territory) => territory.faction !== 'neutral')
      .map((territory) => [territory.id, now + TROOP_PRODUCTION_INTERVAL_MS]),
  )
  const productionRemainderTenths = Object.fromEntries(
    territories
      .filter((territory) => territory.faction !== 'neutral')
      .map((territory) => [territory.id, 0]),
  )
  const turretNextShotAt = Object.fromEntries(
    territories
      .filter((territory) => territory.isTurret)
      .map((territory) => [territory.id, now + TURRET_ATTACK_INTERVAL_MS]),
  )

  return {
    stage: stageDefinition.stage,
    territories,
    links,
    movements: [],
    dispatches: [],
    productionNextAt,
    productionRemainderTenths,
    playerProductionTenths: settings.playerProductionTenths,
    playerCapacity: settings.playerCapacity,
    enemyStartingTroops,
    enemyProductionTenths,
    enemyCapacity,
    turretNextShotAt,
    simulationAt: now,
    nextMovementId: 1,
    nextDispatchId: 1,
    nextTroopId: 1,
    result: null,
  }
}

/**
 * Returns a supported stage definition, clamping values to the campaign.
 */
export function getStageDefinition(stage: number): StageDefinition {
  const stageNumber = Math.max(1, Math.min(STAGE_DEFINITIONS.length, Math.floor(stage)))
  return STAGE_DEFINITIONS[stageNumber - 1]
}

/**
 * Places territories with randomized offsets while preserving minimum travel distance.
 */
function getRandomizedPositions(count: number, random: () => number): MapPoint[] {
  for (let layoutAttempt = 0; layoutAttempt < 8; layoutAttempt += 1) {
    const availablePositions = [...MAP_POSITION_SLOTS]
    for (let index = availablePositions.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1))
      ;[availablePositions[index], availablePositions[swapIndex]] =
        [availablePositions[swapIndex], availablePositions[index]]
    }

    const positions: MapPoint[] = []
    let hasValidLayout = true
    for (const slot of availablePositions.slice(0, count)) {
      let foundPosition = false
      for (let positionAttempt = 0; positionAttempt < 300; positionAttempt += 1) {
        const candidate = {
          x: Math.max(12, Math.min(88, slot.x + (random() - 0.5) * 18)),
          y: Math.max(8, Math.min(92, slot.y + (random() - 0.5) * 16)),
        }
        if (positions.every((position) =>
          Math.hypot(candidate.x - position.x, candidate.y - position.y) >= MIN_TERRITORY_DISTANCE,
        )) {
          positions.push(candidate)
          foundPosition = true
          break
        }
      }

      if (!foundPosition) {
        hasValidLayout = false
        break
      }
    }

    if (hasValidLayout) return positions
  }

  return MAP_POSITION_SLOTS.slice(0, count)
}

/**
 * Connects nearby territories and adds links as needed to keep the map connected.
 */
function buildTerritoryLinks(territories: Territory[]): TerritoryLink[] {
  const links: TerritoryLink[] = []
  const linkKeys = new Set<string>()
  const addLink = (from: Territory, to: Territory) => {
    const key = [from.id, to.id].sort().join(':')
    if (linkKeys.has(key)) return
    linkKeys.add(key)
    links.push({ fromId: from.id, toId: to.id })
  }

  for (const territory of territories) {
    const nearestTerritories = territories
      .filter((candidate) => candidate.id !== territory.id)
      .sort((first, second) =>
        getMapDistance(territory, first) - getMapDistance(territory, second),
      )
      .slice(0, 2)
    for (const nearest of nearestTerritories) addLink(territory, nearest)
  }

  const connected = new Set([territories[0]?.id])
  while (connected.size < territories.length) {
    let shortestLink: { from: Territory; to: Territory; distance: number } | null = null
    for (const from of territories.filter((territory) => connected.has(territory.id))) {
      for (const to of territories.filter((territory) => !connected.has(territory.id))) {
        const distance = getMapDistance(from, to)
        if (!shortestLink || distance < shortestLink.distance) {
          shortestLink = { from, to, distance }
        }
      }
    }
    if (!shortestLink) break
    addLink(shortestLink.from, shortestLink.to)
    connected.add(shortestLink.to.id)
  }

  return links
}

/**
 * Measures distance in the map's normalized coordinates.
 */
function getMapDistance(first: MapPoint, second: MapPoint): number {
  return Math.hypot(first.x - second.x, first.y - second.y)
}

/**
 * Counts territories controlled by each faction.
 */
export function getFactionStats(territories: Territory[]): FactionStats {
  const counts = { player: 0, enemy: 0, neutral: 0, total: territories.length }

  for (const territory of territories) {
    counts[territory.faction] += 1
  }

  return counts
}

/**
 * Returns the on-map position of every troop in a moving wave.
 */
export function getMovementUnitPositions(
  movement: TroopMovement,
  source: Territory,
  target: Territory,
  now: number,
): TroopPosition[] {
  const progress = Math.max(0, Math.min(1, (now - movement.startedAt) / movement.durationMs))
  const deltaX = target.x - source.x
  const deltaY = target.y - source.y
  const distance = Math.hypot(deltaX, deltaY) || 1

  return movement.unitIds.map((unitId, index) => {
    const offset = index - (movement.unitIds.length - 1) / 2
    return {
      unitId,
      x: source.x + deltaX * progress - (deltaY / distance) * offset * TROOP_DOT_SPACING,
      y: source.y + deltaY * progress + (deltaX / distance) * offset * TROOP_DOT_SPACING,
    }
  })
}

/**
 * Chooses one move per active enemy AI, including forced attacks at capacity.
 */
export function getEnemyMoves(state: GameState, now = state.simulationAt): EnemyMove[] {
  const enemyAiIds = Array.from(new Set(
    state.territories
      .filter((territory) => territory.faction === 'enemy' && territory.aiId !== null)
      .map((territory) => territory.aiId)
      .filter((aiId): aiId is number => aiId !== null),
  )).sort((first, second) => first - second)
  const territoriesById = new Map(
    state.territories.map((territory) => [territory.id, territory]),
  )

  return enemyAiIds.flatMap((aiId) => {
    const regularCandidates: Array<EnemyMove & {
      targetTroops: number
      distance: number
      sourceTroops: number
    }> = []
    const fullCapacityCandidates: Array<EnemyMove & {
      distance: number
      sourceTroops: number
    }> = []
    const sources = state.territories.filter(
      (territory) => territory.faction === 'enemy' &&
        territory.aiId === aiId &&
        territory.troops > 0 &&
        !state.dispatches.some((dispatch) => dispatch.fromId === territory.id),
    )

    for (const source of sources) {
      const neighborIds = state.links.flatMap((link) =>
        link.fromId === source.id
          ? [link.toId]
          : link.toId === source.id
            ? [link.fromId]
            : [],
      )

      for (const targetId of new Set(neighborIds)) {
        const target = territoriesById.get(targetId)
        if (
          !target ||
          (target.faction === 'enemy' && target.aiId === aiId)
        ) {
          continue
        }

        const durationMs = getMovementDurationMs(source, target)
        const move = {
          aiId,
          fromId: source.id,
          toId: target.id,
          troopsToSend: source.troops,
          distance: durationMs,
          sourceTroops: source.troops,
        }
        if (source.troops >= state.enemyCapacity && target.faction !== 'neutral') {
          fullCapacityCandidates.push(move)
        }

        const targetTroops = getTargetTroopsAtArrival(
          state,
          target,
          now,
          now + durationMs,
        )
        if (source.troops > targetTroops) {
          regularCandidates.push({ ...move, targetTroops })
        }
      }
    }

    const forcedMove = fullCapacityCandidates.sort(
      (first, second) => first.distance - second.distance ||
        second.sourceTroops - first.sourceTroops,
    )[0]
    const regularMove = regularCandidates.sort(
      (first, second) => first.targetTroops - second.targetTroops ||
        first.distance - second.distance ||
        second.sourceTroops - first.sourceTroops,
    )[0]
    const selectedMove = forcedMove ?? regularMove
    return selectedMove
      ? [{
          aiId,
          fromId: selectedMove.fromId,
          toId: selectedMove.toId,
          troopsToSend: selectedMove.troopsToSend,
        }]
      : []
  })
}

/**
 * Predicts a territory's defenders after production during an incoming march.
 */
function getTargetTroopsAtArrival(
  state: GameState,
  target: Territory,
  now: number,
  arrivalAt: number,
): number {
  if (target.faction === 'neutral') return target.troops

  const activeDispatch = state.dispatches.find(
    (dispatch) => dispatch.fromId === target.id,
  )
  let nextProductionAt = state.productionNextAt[target.id] ?? now + TROOP_PRODUCTION_INTERVAL_MS

  if (activeDispatch) {
    const remainingTroops = Math.min(activeDispatch.remainingTroops, target.troops)
    const remainingWaves = Math.ceil(remainingTroops / TROOPS_PER_WAVE)
    const lastLaunchAt = remainingWaves > 0
      ? activeDispatch.nextLaunchAt + (remainingWaves - 1) * TROOP_WAVE_INTERVAL_MS
      : now
    nextProductionAt = lastLaunchAt + TROOP_PRODUCTION_INTERVAL_MS
  }

  if (nextProductionAt >= arrivalAt) return target.troops

  // Arrival is resolved before production on the same simulation tick.
  const productionCount = Math.ceil(
    (arrivalAt - nextProductionAt) / TROOP_PRODUCTION_INTERVAL_MS,
  )
  const productionRemainderTenths = state.productionRemainderTenths[target.id] ?? 0
  const productionRateTenths = target.faction === 'player'
    ? state.playerProductionTenths
    : state.enemyProductionTenths
  const productionUnits = Math.floor(
    (productionRemainderTenths + productionRateTenths * productionCount) /
      PRODUCTION_TENTHS_PER_TROOP,
  )
  const capacity = target.faction === 'player'
    ? state.playerCapacity
    : state.enemyCapacity
  return Math.min(capacity, target.troops + productionUnits)
}

/**
 * Applies troop production, wave dispatches, arrivals, and victory checks immutably.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === 'reset') {
    return createInitialGameState(action.now, action.settings, action.stage)
  }
  if (action.type === 'resume') return resumeGame(state, action.now, action.pausedAt)
  if (state.result) return state
  if (action.type === 'send') return startDispatch(state, action)

  return advanceGame(state, action.now)
}

/**
 * Shifts scheduled game events forward so elapsed menu time does not advance play.
 */
function resumeGame(state: GameState, now: number, pausedAt: number): GameState {
  const pauseDuration = Math.max(0, now - pausedAt)
  if (pauseDuration === 0) return state

  return {
    ...state,
    productionNextAt: Object.fromEntries(
      Object.entries(state.productionNextAt)
        .map(([territoryId, nextAt]) => [territoryId, nextAt + pauseDuration]),
    ),
    dispatches: state.dispatches.map((dispatch) => ({
      ...dispatch,
      nextLaunchAt: dispatch.nextLaunchAt + pauseDuration,
    })),
    movements: state.movements.map((movement) => ({
      ...movement,
      startedAt: movement.startedAt + pauseDuration,
      arrivesAt: movement.arrivesAt + pauseDuration,
    })),
    turretNextShotAt: Object.fromEntries(
      Object.entries(state.turretNextShotAt)
        .map(([territoryId, nextAt]) => [territoryId, nextAt + pauseDuration]),
    ),
    simulationAt: state.simulationAt + pauseDuration,
  }
}

/**
 * Advances dispatches, resolves moving troop collisions, and produces troops.
 */
function advanceGame(state: GameState, now: number): GameState {
  const hasMovements = state.movements.length > 0 || state.dispatches.length > 0
  const hasDueWaves = state.dispatches.some((dispatch) => dispatch.nextLaunchAt <= now)
  const hasDueProduction = state.territories.some(
    (territory) =>
      territory.faction !== 'neutral' &&
      state.productionNextAt[territory.id] <= now &&
      !state.dispatches.some((dispatch) => dispatch.fromId === territory.id),
  )
  if (!hasMovements && !hasDueWaves && !hasDueProduction) return state

  let territories = state.territories
  let dispatches = [...state.dispatches]
  let movements = [...state.movements]
  let productionNextAt = { ...state.productionNextAt }
  let productionRemainderTenths = { ...state.productionRemainderTenths }
  let turretNextShotAt = { ...state.turretNextShotAt }
  let nextMovementId = state.nextMovementId
  let nextTroopId = state.nextTroopId

  const pendingDispatches: TroopDispatch[] = []
  for (const dispatch of dispatches) {
    const source = territories.find((territory) => territory.id === dispatch.fromId)
    const target = territories.find((territory) => territory.id === dispatch.toId)
    if (
      !source ||
      !target ||
      source.faction !== dispatch.faction ||
      (source.faction === 'enemy' && source.aiId !== dispatch.aiId)
    ) {
      if (source) productionNextAt[source.id] = now + TROOP_PRODUCTION_INTERVAL_MS
      continue
    }

    let remainingTroops = Math.min(dispatch.remainingTroops, source.troops)
    let sourceTroops = source.troops
    let nextLaunchAt = dispatch.nextLaunchAt
    let lastLaunchAt: number | null = null

    while (remainingTroops > 0 && nextLaunchAt <= now) {
      const waveTroops = Math.min(TROOPS_PER_WAVE, remainingTroops, sourceTroops)
      if (waveTroops === 0) break

      sourceTroops -= waveTroops
      remainingTroops -= waveTroops
      territories = territories.map((territory) =>
        territory.id === source.id ? { ...territory, troops: sourceTroops } : territory,
      )
      movements.push(createMovement(
        nextMovementId,
        dispatch.fromId,
        dispatch.toId,
        dispatch.faction,
        dispatch.aiId,
        waveTroops,
        source,
        target,
        nextTroopId,
        nextLaunchAt,
      ))
      nextMovementId += 1
      nextTroopId += waveTroops
      lastLaunchAt = nextLaunchAt
      nextLaunchAt += TROOP_WAVE_INTERVAL_MS
    }

    if (remainingTroops > 0 && sourceTroops > 0) {
      pendingDispatches.push({ ...dispatch, remainingTroops, nextLaunchAt })
    } else {
      productionNextAt[source.id] =
        (lastLaunchAt ?? now) + TROOP_PRODUCTION_INTERVAL_MS
    }
  }
  dispatches = pendingDispatches

  movements = cancelCollidingTroops(movements, territories, state.simulationAt, now)

  const inFlightMovements: TroopMovement[] = []
  movements.sort((first, second) => first.arrivesAt - second.arrivesAt)
  for (const movement of movements) {
    if (movement.arrivesAt > now) {
      inFlightMovements.push(movement)
      continue
    }

    const previousTerritory = territories.find((territory) => territory.id === movement.toId)
    territories = resolveArrival(territories, movement)
    const updatedTerritory = territories.find((territory) => territory.id === movement.toId)
    if (!previousTerritory || !updatedTerritory) continue

    const hasOwnershipChanged =
      previousTerritory.faction !== updatedTerritory.faction ||
      (previousTerritory.faction === 'enemy' &&
        previousTerritory.aiId !== updatedTerritory.aiId)
    if (hasOwnershipChanged) {
      dispatches = dispatches.filter((dispatch) => dispatch.fromId !== updatedTerritory.id)
      productionNextAt[updatedTerritory.id] = now + TROOP_PRODUCTION_INTERVAL_MS
      productionRemainderTenths[updatedTerritory.id] = 0
    } else if (updatedTerritory.troops < previousTerritory.troops) {
      const activeDispatch = dispatches.find((dispatch) => dispatch.fromId === updatedTerritory.id)
      if (activeDispatch && updatedTerritory.troops < activeDispatch.remainingTroops) {
        const remainingTroops = updatedTerritory.troops
        if (remainingTroops === 0) {
          dispatches = dispatches.filter((dispatch) => dispatch.id !== activeDispatch.id)
          productionNextAt[updatedTerritory.id] = now + TROOP_PRODUCTION_INTERVAL_MS
        } else {
          dispatches = dispatches.map((dispatch) =>
            dispatch.id === activeDispatch.id
              ? { ...dispatch, remainingTroops }
              : dispatch,
          )
        }
      }
    }
  }
  movements = inFlightMovements
  const turretAttack = interceptTroopsWithTurrets(
    territories,
    movements,
    turretNextShotAt,
    now,
  )
  movements = turretAttack.movements
  turretNextShotAt = turretAttack.turretNextShotAt

  const dispatchingTerritoryIds = new Set(dispatches.map((dispatch) => dispatch.fromId))
  territories = territories.map((territory) => {
    const nextProductionAt = productionNextAt[territory.id]
    if (
      territory.faction === 'neutral' ||
      dispatchingTerritoryIds.has(territory.id) ||
      nextProductionAt === undefined ||
      nextProductionAt > now
    ) {
      return territory
    }

    const productionCount =
      Math.floor((now - nextProductionAt) / TROOP_PRODUCTION_INTERVAL_MS) + 1
    productionNextAt[territory.id] =
      nextProductionAt + productionCount * TROOP_PRODUCTION_INTERVAL_MS
    const capacity = territory.faction === 'player'
      ? state.playerCapacity
      : state.enemyCapacity
    if (territory.troops >= capacity) {
      productionRemainderTenths[territory.id] = 0
      return territory
    }

    const productionRateTenths = territory.faction === 'player'
      ? state.playerProductionTenths
      : state.enemyProductionTenths
    // Keep fractional production as tenths so troops remain whole units.
    const producedTenths =
      (productionRemainderTenths[territory.id] ?? 0) +
      productionRateTenths * productionCount
    const producedTroops = Math.min(
      capacity - territory.troops,
      Math.floor(producedTenths / PRODUCTION_TENTHS_PER_TROOP),
    )
    productionRemainderTenths[territory.id] =
      territory.troops + producedTroops >= capacity
        ? 0
        : producedTenths % PRODUCTION_TENTHS_PER_TROOP
    return producedTroops > 0
      ? { ...territory, troops: territory.troops + producedTroops }
      : territory
  })

  const result = getWinner(territories)
  return {
    ...state,
    territories,
    movements: result ? [] : movements,
    dispatches: result ? [] : dispatches,
    productionNextAt,
    productionRemainderTenths,
    turretNextShotAt,
    simulationAt: now,
    nextMovementId,
    nextTroopId,
    result,
  }
}

/**
 * Immediately launches the first wave and queues the remaining troops.
 */
function startDispatch(
  state: GameState,
  action: Extract<GameAction, { type: 'send' }>,
): GameState {
  const source = state.territories.find((territory) => territory.id === action.fromId)
  const target = state.territories.find((territory) => territory.id === action.toId)
  const aiId = action.faction === 'enemy' ? action.aiId ?? source?.aiId ?? null : null
  if (
    !source ||
    !target ||
    source.id === target.id ||
    source.faction !== action.faction ||
    (source.faction === 'enemy' && source.aiId !== aiId) ||
    !Number.isInteger(action.troopsToSend) ||
    action.troopsToSend < 1 ||
    source.troops < action.troopsToSend ||
    state.dispatches.some((dispatch) => dispatch.fromId === source.id)
  ) {
    return state
  }

  const firstWaveTroops = Math.min(TROOPS_PER_WAVE, action.troopsToSend)
  const remainingTroops = action.troopsToSend - firstWaveTroops
  return {
    ...state,
    territories: state.territories.map((territory) =>
      territory.id === source.id
        ? { ...territory, troops: territory.troops - firstWaveTroops }
        : territory,
    ),
    movements: [
      ...state.movements,
      createMovement(
        state.nextMovementId,
        source.id,
        target.id,
        action.faction,
        aiId,
        firstWaveTroops,
        source,
        target,
        state.nextTroopId,
        action.now,
      ),
    ],
    dispatches: remainingTroops > 0
      ? [
          ...state.dispatches,
          {
            id: state.nextDispatchId,
            fromId: source.id,
            toId: target.id,
            faction: action.faction,
            aiId,
            remainingTroops,
            nextLaunchAt: action.now + TROOP_WAVE_INTERVAL_MS,
          },
        ]
      : state.dispatches,
      simulationAt: action.now,
    nextMovementId: state.nextMovementId + 1,
    nextDispatchId: remainingTroops > 0 ? state.nextDispatchId + 1 : state.nextDispatchId,
      nextTroopId: state.nextTroopId + firstWaveTroops,
  }
}

/**
 * Creates an in-flight wave with a distance-based travel time.
 */
function createMovement(
  id: number,
  fromId: string,
  toId: string,
  faction: 'player' | 'enemy',
  aiId: number | null,
  troops: number,
  source: Territory,
  target: Territory,
  firstTroopId: number,
  startedAt: number,
): TroopMovement {
  const durationMs = getMovementDurationMs(source, target)
  return {
    id,
    fromId,
    toId,
    faction,
    aiId,
    troops,
    unitIds: Array.from({ length: troops }, (_, index) => firstTroopId + index),
    startedAt,
    durationMs,
    arrivesAt: startedAt + durationMs,
  }
}

/**
 * Calculates movement time using the same distance rule as dispatched troops.
 */
export function getMovementDurationMs(source: Territory, target: Territory): number {
  const distance = Math.hypot(source.x - target.x, source.y - target.y)
  return MOVEMENT_STARTUP_MS + distance * MOVEMENT_MS_PER_DISTANCE
}

/**
 * Removes each colliding pair of opposing troops without clearing whole waves.
 */
function cancelCollidingTroops(
  movements: TroopMovement[],
  territories: Territory[],
  intervalStart: number,
  intervalEnd: number,
): TroopMovement[] {
  const cancelledUnitIds = new Map<number, Set<number>>()

  for (let firstIndex = 0; firstIndex < movements.length; firstIndex += 1) {
    const first = movements[firstIndex]
    for (let secondIndex = firstIndex + 1; secondIndex < movements.length; secondIndex += 1) {
      const second = movements[secondIndex]
      if (
        first.faction === second.faction &&
        (first.faction !== 'enemy' || first.aiId === second.aiId)
      ) {
        continue
      }

      const firstSource = territories.find((territory) => territory.id === first.fromId)
      const firstTarget = territories.find((territory) => territory.id === first.toId)
      const secondSource = territories.find((territory) => territory.id === second.fromId)
      const secondTarget = territories.find((territory) => territory.id === second.toId)
      if (!firstSource || !firstTarget || !secondSource || !secondTarget) continue

      const overlapStart = Math.max(intervalStart, first.startedAt, second.startedAt)
      const overlapEnd = Math.min(intervalEnd, first.arrivesAt, second.arrivesAt)
      if (overlapEnd < overlapStart) continue

      const firstStart = getMovementUnitPositions(first, firstSource, firstTarget, overlapStart)
      const firstEnd = getMovementUnitPositions(first, firstSource, firstTarget, overlapEnd)
      const secondStart = getMovementUnitPositions(second, secondSource, secondTarget, overlapStart)
      const secondEnd = getMovementUnitPositions(second, secondSource, secondTarget, overlapEnd)
      const firstEndById = new Map(firstEnd.map((position) => [position.unitId, position]))
      const secondEndById = new Map(secondEnd.map((position) => [position.unitId, position]))

      for (const firstPosition of firstStart) {
        if (hasCancelledUnit(cancelledUnitIds, first.id, firstPosition.unitId)) continue
        const firstEndPosition = firstEndById.get(firstPosition.unitId)
        if (!firstEndPosition) continue

        for (const secondPosition of secondStart) {
          if (hasCancelledUnit(cancelledUnitIds, second.id, secondPosition.unitId)) continue
          const secondEndPosition = secondEndById.get(secondPosition.unitId)
          if (
            secondEndPosition &&
            doTroopPathsCollide(
              firstPosition,
              firstEndPosition,
              secondPosition,
              secondEndPosition,
            )
          ) {
            markUnitCancelled(cancelledUnitIds, first.id, firstPosition.unitId)
            markUnitCancelled(cancelledUnitIds, second.id, secondPosition.unitId)
            break
          }
        }
      }
    }
  }

  if (cancelledUnitIds.size === 0) return movements
  return movements.flatMap((movement) => {
    const cancelled = cancelledUnitIds.get(movement.id)
    if (!cancelled) return [movement]

    const unitIds = movement.unitIds.filter((unitId) => !cancelled.has(unitId))
    if (unitIds.length === 0) return []
    return [{ ...movement, unitIds, troops: unitIds.length }]
  })
}

/**
 * Checks whether two troop trajectories approach within one dot's collision radius.
 */
function doTroopPathsCollide(
  firstStart: TroopPosition,
  firstEnd: TroopPosition,
  secondStart: TroopPosition,
  secondEnd: TroopPosition,
): boolean {
  const relativeStartX = firstStart.x - secondStart.x
  const relativeStartY = firstStart.y - secondStart.y
  const relativeVelocityX =
    (firstEnd.x - firstStart.x) - (secondEnd.x - secondStart.x)
  const relativeVelocityY =
    (firstEnd.y - firstStart.y) - (secondEnd.y - secondStart.y)
  const velocitySquared =
    relativeVelocityX * relativeVelocityX + relativeVelocityY * relativeVelocityY
  const closestFraction = velocitySquared === 0
    ? 0
    : Math.max(
        0,
        Math.min(
          1,
          -(relativeStartX * relativeVelocityX + relativeStartY * relativeVelocityY) /
            velocitySquared,
        ),
      )
  const closestX = relativeStartX + relativeVelocityX * closestFraction
  const closestY = relativeStartY + relativeVelocityY * closestFraction
  return Math.hypot(closestX, closestY) <= TROOP_COLLISION_RADIUS
}

/**
 * Returns whether a specific troop in a movement has already collided.
 */
function hasCancelledUnit(
  cancelledUnitIds: Map<number, Set<number>>,
  movementId: number,
  unitId: number,
): boolean {
  return cancelledUnitIds.get(movementId)?.has(unitId) ?? false
}

/**
 * Records one troop consumed by a collision.
 */
function markUnitCancelled(
  cancelledUnitIds: Map<number, Set<number>>,
  movementId: number,
  unitId: number,
): void {
  const movementCancelledIds = cancelledUnitIds.get(movementId) ?? new Set<number>()
  movementCancelledIds.add(unitId)
  cancelledUnitIds.set(movementId, movementCancelledIds)
}

/**
 * Removes one hostile moving troop per ready turret when it is inside range.
 */
function interceptTroopsWithTurrets(
  territories: Territory[],
  movements: TroopMovement[],
  initialNextShotAt: Record<string, number>,
  now: number,
): { movements: TroopMovement[]; turretNextShotAt: Record<string, number> } {
  let activeMovements = movements
  const turretNextShotAt = { ...initialNextShotAt }

  for (const turret of territories.filter((territory) => territory.isTurret)) {
    if ((turretNextShotAt[turret.id] ?? now + TURRET_ATTACK_INTERVAL_MS) > now) continue

    const interceptableTroops: InterceptableTroop[] = []
    for (const movement of activeMovements) {
      if (
        movement.startedAt > now ||
        movement.arrivesAt <= now ||
        !isMovementHostileToTurret(turret, movement)
      ) {
        continue
      }

      const source = territories.find((territory) => territory.id === movement.fromId)
      const target = territories.find((territory) => territory.id === movement.toId)
      if (!source || !target) continue

      for (const position of getMovementUnitPositions(movement, source, target, now)) {
        const distance = getMapDistance(turret, position)
        if (distance <= TURRET_RANGE) {
          interceptableTroops.push({
            movementId: movement.id,
            unitId: position.unitId,
            distance,
          })
        }
      }
    }

    const targetTroop = interceptableTroops.sort(
      (first, second) =>
        first.distance - second.distance ||
        first.movementId - second.movementId ||
        first.unitId - second.unitId,
    )[0]
    if (!targetTroop) continue

    activeMovements = activeMovements.flatMap((movement) => {
      if (movement.id !== targetTroop.movementId) return [movement]
      const unitIds = movement.unitIds.filter((unitId) => unitId !== targetTroop.unitId)
      return unitIds.length > 0
        ? [{ ...movement, unitIds, troops: unitIds.length }]
        : []
    })
    turretNextShotAt[turret.id] = now + TURRET_ATTACK_INTERVAL_MS
  }

  return { movements: activeMovements, turretNextShotAt }
}

/**
 * Treats all opposing owners as hostile while a turret is neutral.
 */
function isMovementHostileToTurret(
  turret: Territory,
  movement: TroopMovement,
): boolean {
  if (turret.faction === 'neutral' || turret.faction !== movement.faction) return true
  return turret.faction === 'enemy' && turret.aiId !== movement.aiId
}

/**
 * Resolves reinforcement or combat for one troop group at its destination.
 */
function resolveArrival(territories: Territory[], movement: TroopMovement): Territory[] {
  return territories.map((territory) => {
    if (territory.id !== movement.toId) return territory
    const isSameAiFaction =
      territory.faction !== 'enemy' || territory.aiId === movement.aiId
    if (territory.faction === movement.faction && isSameAiFaction) {
      return { ...territory, troops: territory.troops + movement.troops }
    }

    const remainingTroops = territory.troops - movement.troops
    return remainingTroops > 0
      ? { ...territory, troops: remainingTroops }
      : {
          ...territory,
          faction: movement.faction,
          aiId: movement.faction === 'enemy' ? movement.aiId : null,
          troops: Math.abs(remainingTroops),
        }
  })
}

/**
 * Ends the match when the player loses all territory or enemy AIs are eliminated.
 */
function getWinner(territories: Territory[]): GameState['result'] {
  if (!territories.some((territory) => territory.faction === 'player')) return 'enemy'
  if (!territories.some((territory) => territory.faction === 'enemy')) return 'player'
  return null
}
