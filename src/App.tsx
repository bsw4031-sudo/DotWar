import { useEffect, useState } from 'react'

const ROUND_SECONDS = 30

type GameState = 'ready' | 'playing' | 'finished'

function App() {
  const [gameState, setGameState] = useState<GameState>('ready')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 })

  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = window.setInterval(() => {
      setTimeLeft((time) => Math.max(0, time - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [gameState])

  useEffect(() => {
    if (gameState === 'playing' && timeLeft === 0) {
      setGameState('finished')
    }
  }, [gameState, timeLeft])

  function startGame() {
    setScore(0)
    setTimeLeft(ROUND_SECONDS)
    setTargetPosition({ x: 50, y: 50 })
    setGameState('playing')
  }

  function hitTarget() {
    if (gameState !== 'playing') return
    setScore((currentScore) => currentScore + 1)
    setTargetPosition({
      x: 16 + Math.random() * 68,
      y: 16 + Math.random() * 68,
    })
  }

  return (
    <main className="game-shell">
      <header className="top-bar">
        <a className="wordmark" href="/" aria-label="DotWar 홈">
          <span className="wordmark-dot" />
          DOTWAR
        </a>
        <span className="mode-label">MINI GAME <span>01</span></span>
      </header>

      <section className="intro" aria-labelledby="game-title">
        <p className="eyebrow">반응 속도 테스트</p>
        <h1 id="game-title">TAP<br />RUSH<span>.</span></h1>
        <p className="subtitle">30초 동안 나타나는 점을<br />최대한 많이 터치하세요.</p>
      </section>

      <section className="scoreboard" aria-label="게임 기록">
        <div className="stat">
          <span className="stat-label">SCORE</span>
          <strong aria-live="polite">{String(score).padStart(2, '0')}</strong>
        </div>
        <div className="stat stat-time">
          <span className="stat-label">TIME</span>
          <strong aria-live="off">{String(timeLeft).padStart(2, '0')}<small>s</small></strong>
        </div>
      </section>

      <section className="arena" aria-label="게임 영역">
        {gameState === 'playing' && (
          <button
            className="target"
            style={{ left: `${targetPosition.x}%`, top: `${targetPosition.y}%` }}
            onClick={hitTarget}
            aria-label="점 터치하기"
          >
            <span />
          </button>
        )}

        {gameState !== 'playing' && (
          <div className="arena-message">
            {gameState === 'finished' ? (
              <>
                <span className="result-label">TIME'S UP</span>
                <strong>{score}<small>점</small></strong>
                <span className="result-hint">다시 도전해 볼까요?</span>
              </>
            ) : (
              <>
                <span className="ready-dot" />
                <span className="result-hint">준비되면 시작하세요</span>
              </>
            )}
          </div>
        )}

        <span className="arena-corner corner-tl" />
        <span className="arena-corner corner-tr" />
        <span className="arena-corner corner-bl" />
        <span className="arena-corner corner-br" />
      </section>

      <button
        className="start-button"
        onClick={startGame}
        disabled={gameState === 'playing'}
      >
        {gameState === 'playing' ? '게임 진행 중' : gameState === 'finished' ? '다시 시작' : '게임 시작'}
        {gameState !== 'playing' && <span aria-hidden="true">↗</span>}
      </button>

      <footer className="footer">
        <span>손가락을 준비하세요</span>
        <span>MADE FOR MOBILE</span>
      </footer>
    </main>
  )
}

export default App
