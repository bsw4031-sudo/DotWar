/**
 * @file TurretTutorialOverlay.tsx
 * @title 포탑 가이드 팝업
 * @description 스테이지 8에서 중립 포탑과 점령 포탑의 공격 규칙을 안내합니다.
 */
interface TurretTutorialOverlayProps {
  page: 1 | 2
  onNext: () => void
  onStart: () => void
}

function TurretTutorialOverlay({ page, onNext, onStart }: TurretTutorialOverlayProps) {
  return (
    <div className="tutorial-backdrop">
      <section className="tutorial-dialog" role="dialog" aria-modal="true" aria-labelledby="turret-tutorial-title">
        <p className="tutorial-eyebrow">DOTWAR · 포탑 가이드</p>
        <div className="tutorial-progress" aria-label={`2장 중 ${page}장`}>
          <span className={page === 1 ? 'is-current' : ''} />
          <span className={page === 2 ? 'is-current' : ''} />
          <small>{page} / 2</small>
        </div>
        <div className={`turret-guide-scene turret-guide-page-${page}`} aria-hidden="true">
          <div className="turret-guide-range" />
          <div className="turret-guide-route turret-guide-route-ally" />
          <div className="turret-guide-route turret-guide-route-enemy" />
          <div className="turret-guide-node turret-guide-ally">아군</div>
          <div className="turret-guide-node turret-guide-turret">포탑</div>
          <div className="turret-guide-node turret-guide-enemy">적군</div>
          <i className="turret-guide-troop turret-guide-ally-troop" />
          <i className="turret-guide-troop turret-guide-enemy-troop" />
          <i className="turret-guide-laser" />
          <i className="turret-guide-impact">✦</i>
          <span className="turret-guide-caption">{page === 1 ? '범위 안의 가까운 병력을 공격' : '점령 후에는 적군만 공격'}</span>
        </div>
        <h2 id="turret-tutorial-title">{page === 1 ? '중립 포탑' : '아군 포탑'}</h2>
        <p className="tutorial-description">
          {page === 1
            ? '포탑 범위 내에 들어온 가까운 병력을 공격한다.'
            : '아군이 점령하면 적군만 공격한다. 점령된 포탑영역은 병력이 증가하지 않는다.'}
        </p>
        <button className="tutorial-next-button" type="button" onClick={page === 1 ? onNext : onStart}>
          {page === 1 ? '다음' : '게임 시작'}
        </button>
      </section>
    </div>
  )
}

export default TurretTutorialOverlay
