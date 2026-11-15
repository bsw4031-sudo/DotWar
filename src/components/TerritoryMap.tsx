// === 1. Import 영역 ===
import useTerritoryDrag from '../hooks/useTerritoryDrag'
import {
  FACTION_LABELS,
  getMovementUnitPositions,
  TURRET_RANGE,
} from '../game/model'
import type { Territory, TerritoryLink, TroopMovement } from '../game/model'

// === 2. 타입 및 상수 영역 ===
interface TerritoryMapProps {
  territories: Territory[]
  hasPlayerIssuedMove: boolean
  capacityByFaction: Record<'player' | 'enemy', number>
  links: TerritoryLink[]
  movements: TroopMovement[]
  dispatchingSourceIds: string[]
  selectedSourceId: string | null
  isPaused: boolean
  onSelectTerritory: (territoryId: string) => void
  onSendTroops: (fromId: string, toId: string) => void
}

// === 3. 컴포넌트 선언부 ===
function TerritoryMap({
  territories,
  hasPlayerIssuedMove,
  capacityByFaction,
  links,
  movements,
  dispatchingSourceIds,
  selectedSourceId,
  isPaused,
  onSelectTerritory,
  onSendTroops,
}: TerritoryMapProps) {
  const {
    now,
    dragSourceId,
    dragPreview,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleTerritoryClick,
  } = useTerritoryDrag({
    territories,
    hasMovements: movements.length > 0,
    isPaused,
    onSelectTerritory,
    onSendTroops,
  })

  // === 4. 이펙트 영역 ===
  // === 5. 이벤트 핸들러 및 내부 함수 영역 ===
  // === 6. 렌더링 영역 ===
  const dragSource = territories.find((territory) => territory.id === dragSourceId)
  const movementRoutes = movements.filter(
    (movement, index) =>
      movements.findIndex(
        (candidate) =>
          candidate.fromId === movement.fromId && candidate.toId === movement.toId,
      ) === index,
  )

  return (
    <div
      className="map-board"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      role="group"
      aria-label="영토 지도"
    >
      <svg className="map-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker
            id="troop-arrow-head"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" />
          </marker>
        </defs>
        {territories.filter((territory) => territory.isTurret).map((territory) => (
          <circle
            key={`turret-range-${territory.id}`}
            className="turret-range"
            cx={territory.x}
            cy={territory.y}
            r={TURRET_RANGE}
          />
        ))}
        {links.map((link) => {
          const from = territories.find((territory) => territory.id === link.fromId)
          const to = territories.find((territory) => territory.id === link.toId)
          if (!from || !to) return null
          return (
            <line
              key={`${link.fromId}-${link.toId}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className="map-connection"
            />
          )
        })}
        {movementRoutes.map((movement) => {
          const from = territories.find((territory) => territory.id === movement.fromId)
          const to = territories.find((territory) => territory.id === movement.toId)
          if (!from || !to) return null
          return (
            <line
              key={`route-${movement.fromId}-${movement.toId}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className="movement-direction"
              markerEnd="url(#troop-arrow-head)"
            />
          )
        })}
        {dragSource && dragPreview && (
          <line
            x1={dragSource.x}
            y1={dragSource.y}
            x2={dragPreview.x}
            y2={dragPreview.y}
            className="drag-direction"
            markerEnd="url(#troop-arrow-head)"
          />
        )}
      </svg>

      {movements.map((movement) => {
        const from = territories.find((territory) => territory.id === movement.fromId)
        const to = territories.find((territory) => territory.id === movement.toId)
        if (!from || !to) return null

        return getMovementUnitPositions(movement, from, to, now).map((position) => (
          <span
            key={`${movement.id}-${position.unitId}`}
            className={[
              'moving-troop',
              `faction-${movement.faction}`,
              movement.aiId !== null ? `enemy-ai-${movement.aiId}` : '',
            ].filter(Boolean).join(' ')}
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
            aria-hidden="true"
          />
        ))
      })}

      {territories.map((territory) => {
        const isProductionPaused =
          territory.faction !== 'neutral' &&
          territory.troops >= capacityByFaction[territory.faction]
        const isDispatching = dispatchingSourceIds.includes(territory.id)
        const factionLabel = territory.faction === 'enemy' && territory.aiId !== null
          ? `${FACTION_LABELS.enemy} ${territory.aiId}`
          : FACTION_LABELS[territory.faction]

        return (
          <button
            key={territory.id}
            type="button"
            className={[
              'territory-node',
              `faction-${territory.faction}`,
              territory.aiId !== null ? `enemy-ai-${territory.aiId}` : '',
              territory.isTurret ? 'is-turret' : '',
              selectedSourceId === territory.id ? 'is-selected' : '',
              dragSourceId === territory.id ? 'is-dragging' : '',
              isDispatching ? 'is-dispatching' : '',
            ].filter(Boolean).join(' ')}
            style={{ left: `${territory.x}%`, top: `${territory.y}%` }}
            data-territory-id={territory.id}
            onClick={() => handleTerritoryClick(territory.id)}
            aria-label={`${territory.name}, ${factionLabel}${territory.isTurret ? ', 포탑 영토' : ''}, 병력 ${territory.troops}${isDispatching ? ', 출정 중' : ''}${isProductionPaused ? ', 생산 정지' : ''}`}
            aria-pressed={selectedSourceId === territory.id}
            title={territory.name}
          >
            {territory.id === 'home' && !hasPlayerIssuedMove && (
              <svg
                className="start-point-marker"
                viewBox="0 0 100 70"
                aria-hidden="true"
              >
                <path d="M4 4H96L50 66Z" />
              </svg>
            )}
            <span className="territory-node-glow" />
            {territory.isTurret && (
              <svg className="turret-emblem" viewBox="0 0 64 64" aria-hidden="true">
                <path d="M13 38h38v10H13zM20 33l20-23 9 8-20 23zM39 9l6-6 14 13-6 6z" />
                <path d="M9 49h46v5H9z" />
              </svg>
            )}
            <span className="territory-troop-count">{territory.troops}</span>
            {isProductionPaused && (
              <span className="production-paused-icon" aria-hidden="true">
                <svg viewBox="0 0 12 12">
                  <path d="M2 1h3v10H2zM7 1h3v10H7z" />
                </svg>
              </span>
            )}
          </button>
        )
      })}

      <span className="map-hint" aria-hidden="true">
        {dragSourceId ? '목표 영토로 이동' : '영토를 연결해 확장하세요'}
      </span>
    </div>
  )
}

export default TerritoryMap
