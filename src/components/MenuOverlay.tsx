// === 1. Import 영역 ===
/**
 * @file MenuOverlay.tsx
 * @title 메뉴 팝업
 * @description 설정과 피드백 등 메뉴 화면 및 팝업 UI를 제공합니다.
 */
import { useEffect, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { playSoundEffect } from '../game/sound'

// === 2. 타입 및 상수 영역 ===
type MenuScreen = 'setup' | 'game'
type MenuView = 'menu' | 'settings' | 'logout' | 'feedback' | 'resetProgress'

interface MenuOverlayProps {
  screen: MenuScreen
  isGameOver: boolean
  soundEnabled: boolean
  storageError: string | null
  onToggleSound: () => void
  onClose: () => void
  onGiveUp: () => void
  onSubmitFeedback: (nickname: string, content: string) => Promise<void>
  onResetProgress: () => void
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
  onSubmitFeedback,
  onResetProgress,
}: MenuOverlayProps) {
  const [view, setView] = useState<MenuView>('menu')
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

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
    if (event.target !== event.currentTarget) return
    if (view === 'menu') onClose()
    else setView('menu')
  }

  /** Closes the current sub-popup first, keeping the three-dot menu open. */
  function handleCloseCurrentView(): void {
    if (view === 'menu') onClose()
    else setView('menu')
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

  async function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!nickname.trim() || !content.trim() || feedbackStatus === 'saving') return
    setFeedbackStatus('saving')
    try {
      await onSubmitFeedback(nickname.trim(), content.trim())
      setFeedbackStatus('success')
    } catch {
      setFeedbackStatus('error')
    }
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
          onClick={handleCloseCurrentView}
        >
          ×
        </button>

        {view === 'menu' && (
          <>
            <p className="menu-eyebrow">DOTWAR</p>
            <h2 id="menu-dialog-title">메뉴</h2>
            <div className="menu-actions">
              <button type="button" onClick={handleOpenSettings}>설정</button>
              <button type="button" onClick={() => { playSoundEffect(soundEnabled, 'click'); setView('feedback') }}>피드백</button>
              <button className="menu-danger-button" type="button" onClick={() => { playSoundEffect(soundEnabled, 'click'); setView('resetProgress') }}>진행도 초기화</button>
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
            <button className="menu-secondary-button" type="button" onClick={handleBackToMenu}>
              확인
            </button>
          </>
        )}

        {view === 'feedback' && (
          <>
            <p className="menu-eyebrow">FEEDBACK</p>
            <h2 id="menu-dialog-title">피드백</h2>
            {feedbackStatus === 'success' ? (
              <div className="feedback-success" role="status">피드백 감사합니다!</div>
            ) : (
              <>
                <p className="feedback-instructions">문제점이나 건의사항을 적어주세요. 작성자가 불명확하면 반영 안 해줌!</p>
                <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
                  <label>작성자 (닉네임)
                    <input required maxLength={40} value={nickname} onChange={(event) => setNickname(event.target.value)} />
                  </label>
                  <label>내용
                    <textarea required rows={5} maxLength={2000} value={content} onChange={(event) => setContent(event.target.value)} />
                  </label>
                  {feedbackStatus === 'error' && <p className="menu-storage-error" role="alert">피드백 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.</p>}
                  <button className="menu-secondary-button" type="submit" disabled={feedbackStatus === 'saving'}>
                    {feedbackStatus === 'saving' ? '저장 중…' : '피드백 보내기'}
                  </button>
                </form>
              </>
            )}
          </>
        )}

        {view === 'resetProgress' && (
          <>
            <p className="menu-eyebrow">RESET PROGRESS</p>
            <h2 id="menu-dialog-title">진행도 초기화</h2>
            <p className="reset-progress-warning">
              모든 진행도를 초기화 하시겠습니까?
              <br />*경고! 초기화되면 복구가 불가능합니다.
            </p>
            <div className="reset-progress-actions">
              <button className="menu-secondary-button" type="button" onClick={handleBackToMenu}>취소</button>
              <button className="reset-progress-confirm-button" type="button" onClick={onResetProgress}>초기화</button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default MenuOverlay
