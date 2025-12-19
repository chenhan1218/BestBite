import { CAMERA_BUTTON } from '@/styles/themes'

interface CameraButtonProps {
  onClick: () => void
  disabled?: boolean
  ariaLabel?: string
}

export function CameraButton({
  onClick,
  disabled = false,
  ariaLabel = '拍攝食品照片',
}: CameraButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={CAMERA_BUTTON.base}
      style={CAMERA_BUTTON.size}
      aria-label={ariaLabel}
      type="button"
    >
      <span className="text-5xl">📷</span>
    </button>
  )
}
