// === 1. Import 영역 ===
import OverflowMenuButton from './OverflowMenuButton'
import {
  getPlayerStats,
  getUpgradeCost,
} from '../game/profile'
import { STAGE_DEFINITIONS } from '../game/model'
import type { PlayerProfile, UpgradeType } from '../game/profile'

// === 2. 타입 및 상수 영역 ===
interface UpgradeScreenProps {
  profile: PlayerProfile
  stage: number
  storageError: string | null
  onOpenMenu: () => void
  onUpgrade: (upgradeType: UpgradeType) => void
  onStartGame: () => void
}

const UPGRADE_CARDS: Array<{
  type: UpgradeType
  name: string
  amount: string
}> = [
  { type: 'garrison', name: '주둔군', amount: '+2' },
  { type: 'production', name: '생산력', amount: '+0.1/초' },
  { type: 'capacity', name: '수용량', amount: '+1' },
]

// === 3. 화면 컴포넌트 ===
/**
 * Shows one of the three current upgrade values.
 */
function StatSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="upgrade-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

/**
 * Draws the small coin symbol used for balances and upgrade prices.
 */
function CoinIcon() {
  return (
    <svg className="coin-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 7.5v9M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" />
    </svg>
  )
}

/**
 * Draws a compact illustration for the selected upgrade.
 */
function UpgradeIcon({ type }: { type: UpgradeType }) {
  if (type === 'garrison') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="24" cy="14" r="8" />
        <path d="M12 43c0-9 5-15 12-15s12 6 12 15v4H12z" />
        <path className="upgrade-flag" d="M39 27h14l-5 6 5 6H39zM39 27v25" />
      </svg>
    )
  }
  if (type === 'production') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="20" cy="15" r="7" />
        <circle cx="39" cy="18" r="6" />
        <path d="M8 42c0-8 5-14 12-14s12 6 12 14v4H8zM31 39c0-7 3-11 8-11 4 0 7 3 8 8" />
        <path className="upgrade-plus" d="M49 40v15M41.5 47.5h15" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M14 13h36v27H14zM10 43h44v5H10z" />
      <text x="32" y="37" textAnchor="middle">MAX</text>
    </svg>
  )
}

/**
 * Renders the pre-game upgrade shop and match launch controls.
 */
function UpgradeScreen({
  profile,
  stage,
  storageError,
  onOpenMenu,
  onUpgrade,
  onStartGame,
}: UpgradeScreenProps) {
  const stats = getPlayerStats(profile)

  // === 4. 이펙트 영역 ===
  // === 5. 이벤트 핸들러 및 내부 함수 영역 ===
  // === 6. 렌더링 영역 ===
  return (
    <main className="setup-shell">
      <header className="setup-top-bar">
        <a className="wordmark" href="/" aria-label="DotWar 홈">
          <span className="wordmark-mark">D</span>
          <span>DOTWAR<small> TERRITORY CONTROL</small></span>
        </a>
        <div className="setup-header-actions">
          <div className="credit-balance" aria-label={`보유 크레딧 ${profile.credits}`}>
            <CoinIcon />
            <strong>{profile.credits.toLocaleString('ko-KR')}</strong>
            <span>CR</span>
          </div>
          <OverflowMenuButton onClick={onOpenMenu} />
        </div>
      </header>

      <section className="setup-heading">
        <p className="eyebrow">
          PREPARE FOR BATTLE <span>· STAGE {String(stage).padStart(2, '0')} / {String(STAGE_DEFINITIONS.length).padStart(2, '0')}</span>
        </p>
        <h1>전투 준비<span>.</span></h1>
        <p>업그레이드하고 다음 전투를 시작하세요.</p>
      </section>

      {storageError && <p className="profile-storage-error" role="alert">{storageError}</p>}

      <section className="upgrade-summary" aria-label="현재 플레이어 능력치">
        <StatSummary label="주둔군" value={String(stats.startingGarrison)} />
        <StatSummary label="생산력" value={`${(stats.productionTenths / 10).toFixed(1)}/초`} />
        <StatSummary label="수용량" value={String(stats.capacity)} />
      </section>

      <section className="upgrade-section" aria-labelledby="upgrade-title">
        <div className="upgrade-section-heading">
          <div>
            <p className="eyebrow">PLAYER DEVELOPMENT</p>
            <h2 id="upgrade-title">보유 업그레이드</h2>
          </div>
          <span>UPGRADE</span>
        </div>

        <div className="upgrade-grid">
          {UPGRADE_CARDS.map(({ type, name, amount }) => {
            const level = profile.upgrades[type]
            const cost = getUpgradeCost(level)
            const canAfford = profile.credits >= cost

            return (
              <button
                className="upgrade-card"
                key={type}
                type="button"
                disabled={!canAfford}
                onClick={() => onUpgrade(type)}
                aria-label={`${name} 레벨 ${level + 1} 업그레이드, ${cost} 크레딧`}
              >
                <span className="upgrade-level">LEVEL {level}</span>
                <span className={`upgrade-icon upgrade-icon-${type}`}>
                  <UpgradeIcon type={type} />
                </span>
                <strong className="upgrade-amount">{amount}</strong>
                <span className="upgrade-name">{name}</span>
                <span className="upgrade-cost">
                  <CoinIcon />
                  {cost.toLocaleString('ko-KR')}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <footer className="setup-footer">
        <p>승리 <strong>+50 CR</strong><span />패배 <strong>+10 CR</strong></p>
        <button className="setup-start-button" type="button" onClick={onStartGame}>
          게임 시작 <span aria-hidden="true">↗</span>
        </button>
      </footer>
    </main>
  )
}

export default UpgradeScreen
