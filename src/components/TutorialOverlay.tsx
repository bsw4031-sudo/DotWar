/**
 * @file TutorialOverlay.tsx
 * @title 전투 가이드 팝업
 * @description 첫 스테이지의 이동과 병력 충돌 규칙을 애니메이션으로 안내합니다.
 */
interface TutorialOverlayProps {
  page: 1 | 2
  onNext: () => void
  onStart: () => void
}

function TutorialOverlay({ page, onNext, onStart }: TutorialOverlayProps) {
  const isMovementPage = page === 1

  return (
    <div className="tutorial-backdrop">
      <section className="tutorial-dialog" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
        <p className="tutorial-eyebrow">DOTWAR · 전투 가이드</p>
        <div className="tutorial-progress" aria-label={`2장 중 ${page}장`}>
          <span className={page === 1 ? 'is-current' : ''} />
          <span className={page === 2 ? 'is-current' : ''} />
          <small>{page} / 2</small>
        </div>
        <div className={`tutorial-scene ${isMovementPage ? 'is-movement-demo' : 'is-clash-demo'}`} aria-hidden="true">
          <div className="tutorial-route" />
          <div className="tutorial-node tutorial-ally"><span>아군</span></div>
          <div className="tutorial-node tutorial-enemy"><span>적군</span></div>
          <i className="tutorial-troop tutorial-troop-one" />
          {!isMovementPage && <i className="tutorial-troop tutorial-troop-two" />}
          {!isMovementPage && <i className="tutorial-clash">✦</i>}
          <span className="tutorial-motion-label">{isMovementPage ? '드래그' : '이동 병력 충돌'}</span>
        </div>
        <h2 id="tutorial-title">{isMovementPage ? '병력 이동하기' : '병력끼리 부딪히면'}</h2>
        <p className="tutorial-description">
          {isMovementPage
            ? '아군 영토에서 적군이나 중립 영토로 드래그하면 병력이 이동합니다.'
            : '아군과 적군 병력이 마주치면 서로 상쇄됩니다.'}
        </p>
        <button className="tutorial-next-button" type="button" onClick={isMovementPage ? onNext : onStart}>
          {isMovementPage ? '다음' : '게임 시작'}
        </button>
      </section>
    </div>
  )
}

export default TutorialOverlay
