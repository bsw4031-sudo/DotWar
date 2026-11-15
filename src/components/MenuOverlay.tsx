// === 1. Import 영역 ===
import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { playSoundEffect } from '../game/sound'

// === 2. 타입 및 상수 영역 ===
type MenuScreen = 'setup' | 'game'
type MenuView = 'menu' | 'settings' | 'logout'

interface MenuOverlayProps {
  screen: MenuScreen
  isGameOver: boolean
  soundEnabled: boolean
  storageError: string | null
  onToggleSound: () => void
  onClose: () => void
  onGiveUp: () => void
}

// === 3. 화면 컴포넌트 ===
/**
 * Renders the dimmed menu, sound settings, and screen-specific actions.
 */
function MenuOverlay({
  screen,
  isGameOver,
  soundEnabled,
  storageError,
  onToggleSound,
  onClose,
  onGiveUp,
}: MenuOverlayProps) {
  const [view, setView] = useState<MenuView>('menu')

  // === 4. 이펙트 영역 ===
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape') return
      if (view === 'menu') onClose()
      else setView('menu')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, view])

  // === 5. 이벤트 핸들러 및 내부 함수 영역 ===
  /**
   * Closes the popup when the player clicks the dimmed backdrop.
   */
  function handleBackdropClick(event: MouseEvent<HTMLDivElement>): void {
    if (event.target === event.currentTarget) onClose()
  }

  /**
   * Opens the sound preference screen from the menu.
   */
  function handleOpenSettings(): void {
    playSoundEffect(soundEnabled, 'click')
    setView('settings')
  }

  /**
   * Shows the local guest-mode logout explanation.
   */
  function handleLogout(): void {
    playSoundEffect(soundEnabled, 'click')
    setView('logout')
  }

  /**
   * Returns from settings to the screen-specific menu.
   */
  function handleBackToMenu(): void {
    playSoundEffect(soundEnabled, 'click')
    setView('menu')
  }

  // === 6. 렌더링 영역 ===
  return (
    <div className="menu-backdrop" onClick={handleBackdropClick}>
      <section
        className="menu-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-dialog-title"
      >
        <button
          className="menu-close-button"
          type="button"
          aria-label="메뉴 닫기"
          onClick={onClose}
        >
          ×
        </button>

        {view === 'menu' && (
          <>
            <p className="menu-eyebrow">DOTWAR</p>
            <h2 id="menu-dialog-title">메뉴</h2>
            <div className="menu-actions">
              <button type="button" onClick={handleOpenSettings}>설정</button>
              {screen === 'setup'
                ? <button type="button" onClick={handleLogout}>로그아웃</button>
                : !isGameOver && (
                    <button className="menu-danger-button" type="button" onClick={onGiveUp}>
                      게임 포기
                    </button>
                  )}
            </div>
          </>
        )}

        {view === 'settings' && (
          <>
            <p className="menu-eyebrow">PREFERENCES</p>
            <h2 id="menu-dialog-title">설정</h2>
            <div className="sound-setting">
              <div>
                <strong>효과음</strong>
                <span>메뉴와 전투 효과음</span>
              </div>
              <button
                className={`sound-switch${soundEnabled ? ' is-on' : ''}`}
                type="button"
                role="switch"
                aria-checked={soundEnabled}
                aria-label="효과음"
                onClick={onToggleSound}
              >
                <span />
              </button>
            </div>
            {storageError && <p className="menu-storage-error" role="alert">{storageError}</p>}
            <button className="menu-secondary-button" type="button" onClick={handleBackToMenu}>
              메뉴로 돌아가기
            </button>
          </>
        )}

        {view === 'logout' && (
          <>
            <p className="menu-eyebrow">GUEST SESSION</p>
            <h2 id="menu-dialog-title">로그아웃</h2>
            <p className="menu-message">
              계정 로그인 없이 플레이 중입니다. 저장된 크레딧과 업그레이드는 이 기기에 유지됩니다.
            </p>
            <button className="menu-secondary-button" type="button" onClick={onClose}>
              확인
            </button>
          </>
        )}
      </section>
    </div>
  )
}

export default MenuOverlay
