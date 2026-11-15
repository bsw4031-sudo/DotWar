// === 1. Import 영역 ===

// === 2. 타입 및 상수 영역 ===
interface OverflowMenuButtonProps {
  className?: string
  onClick: () => void
}

// === 3. 화면 컴포넌트 ===
/**
 * Renders the shared three-dot menu trigger.
 */
function OverflowMenuButton({ className = '', onClick }: OverflowMenuButtonProps) {
  return (
    <button
      className={['overflow-menu-button', className].filter(Boolean).join(' ')}
      type="button"
      aria-label="메뉴 열기"
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="5" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="12" cy="19" r="1.8" />
      </svg>
    </button>
  )
}

export default OverflowMenuButton
