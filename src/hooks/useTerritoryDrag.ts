// === 1. Import 영역 ===
/**
 * @file useTerritoryDrag.ts
 * @title 영토 드래그 훅
 * @description 포인터 입력을 영토 선택과 병력 이동 동작으로 처리합니다.
 */
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { Territory } from '../game/model'

// === 2. 타입 및 상수 영역 ===
interface UseTerritoryDragOptions {
  territories: Territory[]
  hasMovements: boolean
  isPaused: boolean
  onSelectTerritory: (territoryId: string) => void
  onSendTroops: (fromId: string, toId: string) => void
}

interface MapPoint {
  x: number
  y: number
}

// === 3. 훅 선언부 ===
function useTerritoryDrag({
  territories,
  hasMovements,
  isPaused,
  onSelectTerritory,
  onSendTroops,
}: UseTerritoryDragOptions) {
  const [now, setNow] = useState(Date.now())
  const [dragSourceId, setDragSourceId] = useState<string | null>(null)
  const [dragPreview, setDragPreview] = useState<MapPoint | null>(null)
  const dragSourceRef = useRef<string | null>(null)
  const dragStartRef = useRef<MapPoint | null>(null)
  const dragMovedRef = useRef(false)
  const ignoreClickRef = useRef(false)
  const ignoreClickTimerRef = useRef<number | null>(null)

  // === 4. 이펙트 영역 ===
  useEffect(() => {
    if (isPaused) {
      setNow(Date.now())
      return
    }
    if (!hasMovements) return
    const timer = window.setInterval(() => setNow(Date.now()), 32)
    return () => window.clearInterval(timer)
  }, [hasMovements, isPaused])

  useEffect(
    () => () => {
      if (ignoreClickTimerRef.current !== null) {
        window.clearTimeout(ignoreClickTimerRef.current)
      }
    },
    [],
  )

  // === 5. 이벤트 핸들러 및 내부 함수 영역 ===
  /**
   * Finds the territory node associated with a pointer target.
   */
  function getTerritoryId(element: EventTarget | null): string | null {
    if (!(element instanceof Element)) return null
    return element.closest<HTMLElement>('[data-territory-id]')?.dataset.territoryId ?? null
  }

  /**
   * Converts screen coordinates into percentages within the map.
   */
  function getMapPoint(event: PointerEvent<HTMLDivElement>): MapPoint {
    const bounds = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100)),
    }
  }

  /**
   * Starts a drag only when it begins on one of the player's territories.
   */
  function handlePointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (event.button !== 0) return
    const territoryId = getTerritoryId(event.target)
    const territory = territories.find((item) => item.id === territoryId)
    if (!territory || territory.faction !== 'player') {
      return
    }

    if (ignoreClickTimerRef.current !== null) {
      window.clearTimeout(ignoreClickTimerRef.current)
      ignoreClickTimerRef.current = null
    }
    ignoreClickRef.current = false
    dragSourceRef.current = territory.id
    dragStartRef.current = { x: event.clientX, y: event.clientY }
    dragMovedRef.current = false
    setDragSourceId(territory.id)
    setDragPreview(null)
  }

  /**
   * Tracks a drag preview and distinguishes it from a tap.
   */
  function handlePointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!dragSourceRef.current || !dragStartRef.current) return

    const distance = Math.hypot(
      event.clientX - dragStartRef.current.x,
      event.clientY - dragStartRef.current.y,
    )
    if (distance < 8) return

    dragMovedRef.current = true
    setDragPreview(getMapPoint(event))
  }

  /**
   * Sends troops to the territory under the released pointer.
   */
  function handlePointerUp(event: PointerEvent<HTMLDivElement>): void {
    const sourceId = dragSourceRef.current
    if (!sourceId) return

    if (dragMovedRef.current) {
      ignoreClickRef.current = true
      const targetId = getTerritoryId(document.elementFromPoint(event.clientX, event.clientY))
      if (targetId && targetId !== sourceId) onSendTroops(sourceId, targetId)
      ignoreClickTimerRef.current = window.setTimeout(() => {
        ignoreClickRef.current = false
        ignoreClickTimerRef.current = null
      }, 300)
    }

    dragSourceRef.current = null
    dragStartRef.current = null
    dragMovedRef.current = false
    setDragSourceId(null)
    setDragPreview(null)
  }

  /**
   * Cancels a drag when the browser interrupts its pointer sequence.
   */
  function handlePointerCancel(): void {
    dragSourceRef.current = null
    dragStartRef.current = null
    dragMovedRef.current = false
    setDragSourceId(null)
    setDragPreview(null)
  }

  /**
   * Selects or targets a territory for tap-based play.
   */
  function handleTerritoryClick(territoryId: string): void {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false
      if (ignoreClickTimerRef.current !== null) {
        window.clearTimeout(ignoreClickTimerRef.current)
        ignoreClickTimerRef.current = null
      }
      return
    }
    onSelectTerritory(territoryId)
  }

  // === 6. 반환 영역 ===
  return {
    now,
    dragSourceId,
    dragPreview,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleTerritoryClick,
  }
}

export default useTerritoryDrag
