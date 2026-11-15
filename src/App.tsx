// === 1. Import 영역 ===
import { useEffect, useReducer, useRef, useState } from 'react'
import GameScreen from './components/GameScreen'
import MenuOverlay from './components/MenuOverlay'
import UpgradeScreen from './components/UpgradeScreen'
import {
  awardGameReward,
  getGameSettings,
  loadPlayerProfile,
  purchaseUpgrade,
  savePlayerProfile,
} from './game/profile'
import type { PlayerProfile, UpgradeType } from './game/profile'
import {
  createInitialGameState,
  gameReducer,
  getEnemyMoves,
} from './game/model'
import { playSoundEffect } from './game/sound'

// === 2. 타입 및 상수 영역 ===
type ActiveScreen = 'setup' | 'game'

const ENEMY_TURN_MS = 2500
const GAME_TICK_MS = 50

// === 3. 컴포넌트 선언부 ===
function App() {
  const [gameState, dispatch] = useReducer(
    gameReducer,
    undefined,
    () => createInitialGameState(),
  )
  const [profileState, setProfileState] = useState(loadPlayerProfile)
  const [screen, setScreen] = useState<ActiveScreen>('setup')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [earnedCredits, setEarnedCredits] = useState<number | null>(null)
  const gameStateRef = useRef(gameState)
  const rewardedGameRef = useRef(false)
  const pauseStartedAtRef = useRef<number | null>(null)
  const gamePausedRef = useRef(false)
  const previousOwnersRef = useRef(
    new Map(gameState.territories.map((territory) => [
      territory.id,
      `${territory.faction}:${territory.aiId ?? ''}`,
    ])),
  )
  const previousResultRef = useRef(gameState.result)
  gameStateRef.current = gameState

  const profile = profileState.profile

  // === 4. 이펙트 영역 ===
  useEffect(() => {
    if (screen !== 'game' || gameState.result || isMenuOpen) return
    const timer = window.setInterval(
      () => {
        if (!gamePausedRef.current) dispatch({ type: 'tick', now: Date.now() })
      },
      GAME_TICK_MS,
    )
    return () => window.clearInterval(timer)
  }, [screen, gameState.result, isMenuOpen])

  useEffect(() => {
    if (screen !== 'game' || gameState.result || isMenuOpen) return
    const timer = window.setInterval(() => {
      if (gamePausedRef.current) return
      const now = Date.now()
      getEnemyMoves(gameStateRef.current, now).forEach((enemyMove) => {
        dispatch({
          type: 'send',
          ...enemyMove,
          faction: 'enemy',
          now,
        })
      })
    }, ENEMY_TURN_MS)
    return () => window.clearInterval(timer)
  }, [screen, gameState.result, isMenuOpen])

  useEffect(() => {
    if (screen !== 'game' || !gameState.result || rewardedGameRef.current) return
    rewardedGameRef.current = true
    const reward = awardGameReward(profile, gameState.result)
    setEarnedCredits(reward.creditsEarned)
    handleProfileChange(reward.profile)
  }, [gameState.result, screen])

  useEffect(() => {
    const hasOwnershipChanged = gameState.territories.some((territory) => {
      const previousOwner = previousOwnersRef.current.get(territory.id)
      return previousOwner !== undefined &&
        previousOwner !== `${territory.faction}:${territory.aiId ?? ''}`
    })
    const resultChanged = previousResultRef.current !== gameState.result

    if (gameState.result && resultChanged) {
      playSoundEffect(
        profile.soundEnabled,
        gameState.result === 'player' ? 'victory' : 'defeat',
      )
    } else if (hasOwnershipChanged) {
      playSoundEffect(profile.soundEnabled, 'capture')
    }

    previousOwnersRef.current = new Map(gameState.territories.map((territory) => [
      territory.id,
      `${territory.faction}:${territory.aiId ?? ''}`,
    ]))
    previousResultRef.current = gameState.result
  }, [gameState.territories, gameState.result, profile.soundEnabled])

  // === 5. 이벤트 핸들러 및 내부 함수 영역 ===
  /**
   * Updates local profile state and reports storage failures to the player.
   */
  function handleProfileChange(nextProfile: PlayerProfile): void {
    let errorMessage: string | null = null
    try {
      savePlayerProfile(nextProfile)
    } catch (error) {
      console.error('Unable to save the DotWar player profile.', error)
      errorMessage = '진행 정보를 저장하지 못했습니다. 다시 시작하면 변경 내용이 사라질 수 있습니다.'
    }
    setProfileState({ profile: nextProfile, error: errorMessage })
  }

  /**
   * Buys one level of an upgrade when the profile has enough credits.
   */
  function handleUpgrade(upgradeType: UpgradeType): void {
    const nextProfile = purchaseUpgrade(profile, upgradeType)
    if (nextProfile === profile) return
    playSoundEffect(profile.soundEnabled, 'click')
    handleProfileChange(nextProfile)
  }

  /**
   * Opens the menu and records when gameplay paused.
   */
  function handleOpenMenu(): void {
    playSoundEffect(profile.soundEnabled, 'click')
    if (screen === 'game' && !gameStateRef.current.result) {
      pauseStartedAtRef.current = Date.now()
      gamePausedRef.current = true
    }
    setIsMenuOpen(true)
  }

  /**
   * Resumes paused gameplay without counting time spent in the menu.
   */
  function handleCloseMenu(): void {
    const pausedAt = pauseStartedAtRef.current
    if (
      screen === 'game' &&
      !gameStateRef.current.result &&
      pausedAt !== null
    ) {
      dispatch({ type: 'resume', pausedAt, now: Date.now() })
    }
    pauseStartedAtRef.current = null
    gamePausedRef.current = false
    setIsMenuOpen(false)
  }

  /**
   * Gives up without awarding a match reward.
   */
  function handleGiveUp(): void {
    if (gameStateRef.current.result) return
    rewardedGameRef.current = true
    pauseStartedAtRef.current = null
    gamePausedRef.current = false
    setSelectedSourceId(null)
    setIsMenuOpen(false)
    setScreen('setup')
  }

  /**
   * Saves the player's sound-effects preference.
   */
  function handleToggleSound(): void {
    const soundEnabled = !profile.soundEnabled
    playSoundEffect(soundEnabled, 'click')
    handleProfileChange({ ...profile, soundEnabled })
  }

  /**
   * Starts a match using the current upgrade levels.
   */
  function handleStartGame(): void {
    rewardedGameRef.current = false
    pauseStartedAtRef.current = null
    gamePausedRef.current = false
    setIsMenuOpen(false)
    setEarnedCredits(null)
    setSelectedSourceId(null)
    playSoundEffect(profile.soundEnabled, 'click')
    dispatch({
      type: 'reset',
      now: Date.now(),
      settings: getGameSettings(profile),
      stage: profile.currentStage,
    })
    setScreen('game')
  }

  /**
   * Returns to upgrades without awarding a reward for an unfinished match.
   */
  function handleBackToSetup(): void {
    pauseStartedAtRef.current = null
    gamePausedRef.current = false
    setIsMenuOpen(false)
    setSelectedSourceId(null)
    setScreen('setup')
  }

  /**
   * Dispatches all troops from the selected player territory.
   */
  function handleSendTroops(fromId: string, toId: string): void {
    const source = gameStateRef.current.territories.find(
      (territory) => territory.id === fromId,
    )
    if (!source) return

    playSoundEffect(profile.soundEnabled, 'send')
    dispatch({
      type: 'send',
      fromId,
      toId,
      faction: 'player',
      troopsToSend: source.troops,
      now: Date.now(),
    })
    setSelectedSourceId(null)
  }

  /**
   * Selects a source territory or sends troops to a tapped destination.
   */
  function handleSelectTerritory(territoryId: string): void {
    if (gameState.result) return
    const territory = gameState.territories.find((item) => item.id === territoryId)
    if (!territory) return

    if (territory.faction === 'player') {
      setSelectedSourceId((currentId) => currentId === territoryId ? null : territoryId)
      return
    }

    if (selectedSourceId) handleSendTroops(selectedSourceId, territoryId)
  }

  // === 6. 렌더링 영역 ===
  if (screen === 'setup') {
    return (
      <>
        <UpgradeScreen
          profile={profile}
          stage={profile.currentStage}
          storageError={profileState.error}
          onOpenMenu={handleOpenMenu}
          onUpgrade={handleUpgrade}
          onStartGame={handleStartGame}
        />
        {isMenuOpen && (
          <MenuOverlay
            screen={screen}
            isGameOver={Boolean(gameState.result)}
            soundEnabled={profile.soundEnabled}
            storageError={profileState.error}
            onToggleSound={handleToggleSound}
            onClose={handleCloseMenu}
            onGiveUp={handleGiveUp}
          />
        )}
      </>
    )
  }

  return (
    <>
      <GameScreen
        gameState={gameState}
        selectedSourceId={selectedSourceId}
        earnedCredits={earnedCredits}
        creditBalance={profile.credits}
        playerCapacity={gameState.playerCapacity}
        isPaused={isMenuOpen}
        onOpenMenu={handleOpenMenu}
        onBackToSetup={handleBackToSetup}
        onSelectTerritory={handleSelectTerritory}
        onSendTroops={handleSendTroops}
      />
      {isMenuOpen && (
        <MenuOverlay
          screen={screen}
          isGameOver={Boolean(gameState.result)}
          soundEnabled={profile.soundEnabled}
          storageError={profileState.error}
          onToggleSound={handleToggleSound}
          onClose={handleCloseMenu}
          onGiveUp={handleGiveUp}
        />
      )}
    </>
  )
}

export default App
