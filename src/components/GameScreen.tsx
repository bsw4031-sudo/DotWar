// === 1. Import 영역 ===
/**
 * @file GameScreen.tsx
 * @title 게임 화면
 * @description 전투 지도와 점령 상태, 게임 조작 UI를 표시합니다.
 */
import TerritoryMap from './TerritoryMap'
import OverflowMenuButton from './OverflowMenuButton'
import {
  FACTION_LABELS,
  getFactionStats,
  STAGE_DEFINITIONS,
} from '../game/model'
import type { Faction, GameState } from '../game/model'

// === 2. 타입 및 상수 영역 ===
interface GameScreenProps {
  gameState: GameState
  selectedSourceId: string | null
  earnedCredits: number | null
  creditBalance: number
  playerCapacity: number
  isPaused: boolean
  onOpenMenu: () => void
  onBackToSetup: () => void
  onSelectTerritory: (territoryId: string) => void
  onSendTroops: (fromId: string, toId: string) => void
}

// === 3. 화면 컴포넌트 ===
/**
 * Renders the active territory game and its match result.
 */
function GameScreen({
  gameState,
  selectedSourceId,
  earnedCredits,
  creditBalance,
  playerCapacity,
  isPaused,
  onOpenMenu,
  onBackToSetup,
  onSelectTerritory,
  onSendTroops,
}: GameScreenProps) {
  const factionStats = getFactionStats(gameState.territories)
  const totalTerritories = Math.max(1, factionStats.total)
  const dispatchingSourceIds = gameState.dispatches.map((item) => item.fromId)
  const resultLabel = gameState.result === 'player' ? '작전 성공' : '작전 실패'
  const resultMessage = gameState.result === 'player'
    ? gameState.stage < STAGE_DEFINITIONS.length
      ? `다음 스테이지 ${gameState.stage + 1}이 열렸습니다.`
      : '최종 스테이지를 클리어했습니다.'
    : `${gameState.stage} 스테이지에서 다시 도전하세요.`
  const reward = earnedCredits ?? (gameState.result === 'player' ? 50 : 10)
  const capacityByFaction = {
    player: playerCapacity,
    enemy: gameState.enemyCapacity,
  }
  const enemyAiIds = Array.from(new Set(
    gameState.territories
      .filter((territory) => territory.faction === 'enemy' && territory.aiId !== null)
      .map((territory) => territory.aiId)
      .filter((aiId): aiId is number => aiId !== null),
  ))
  const factionPercent = (faction: Faction) =>
    Math.round((factionStats[faction] / totalTerritories) * 100)

  // === 4. 이펙트 영역 ===
  // === 5. 이벤트 핸들러 및 내부 함수 영역 ===
  // === 6. 렌더링 영역 ===
  return (
    <main className="game-shell game-map-screen">
      <section className="faction-status" aria-label="세력별 영토 비율">
        <div className="faction-labels">
          {(['player', 'enemy', 'neutral'] as const).map((faction) => (
            <span className={`faction-label faction-text-${faction}`} key={faction}>
              {FACTION_LABELS[faction]} <strong>{factionPercent(faction)}%</strong>
            </span>
          ))}
        </div>
        <div
          className="faction-meter"
          role="img"
          aria-label={`아군 ${factionPercent('player')}%, 적군 ${factionPercent('enemy')}%, 중립 ${factionPercent('neutral')}%`}
        >
          <span
            className="meter-player"
            style={{ width: `${(factionStats.player / totalTerritories) * 100}%` }}
          />
          {enemyAiIds.map((aiId) => {
            const aiTerritories = gameState.territories.filter(
              (territory) => territory.faction === 'enemy' && territory.aiId === aiId,
            ).length
            return (
              <span
                className={`meter-enemy enemy-ai-${aiId}`}
                key={aiId}
                style={{ width: `${(aiTerritories / totalTerritories) * 100}%` }}
              />
            )
          })}
          <span
            className="meter-neutral"
            style={{ width: `${(factionStats.neutral / totalTerritories) * 100}%` }}
          />
        </div>
      </section>

      <section className="battlefield" aria-label="전장">
        <div className="map-label">
          <span>TACTICAL MAP</span>
          <div className="map-label-actions">
            <OverflowMenuButton className="game-menu-button" onClick={onOpenMenu} />
            <span><i className="live-dot" /> {isPaused ? 'PAUSED' : 'LIVE'}</span>
          </div>
        </div>
        <TerritoryMap
          territories={gameState.territories}
          hasPlayerIssuedMove={gameState.hasPlayerIssuedMove}
          capacityByFaction={capacityByFaction}
          links={gameState.links}
          movements={gameState.movements}
          turretShots={gameState.turretShots}
          dispatchingSourceIds={dispatchingSourceIds}
          selectedSourceId={selectedSourceId}
          isPaused={isPaused}
          onSelectTerritory={onSelectTerritory}
          onSendTroops={onSendTroops}
        />
        {gameState.result && (
          <div className="result-overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
            <p className={`result-eyebrow faction-text-${gameState.result}`}>BATTLE ENDED</p>
            <h2 id="result-title">{resultLabel}</h2>
            <p>{resultMessage}</p>
            <div className="result-reward">
              <span>획득 크레딧</span>
              <strong>+{reward} CR</strong>
              <small>보유 {creditBalance.toLocaleString('ko-KR')} CR</small>
            </div>
            <button onClick={onBackToSetup}>업그레이드 화면</button>
          </div>
        )}
      </section>
    </main>
  )
}

export default GameScreen
