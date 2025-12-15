'use client'

import { useState } from 'react'

interface CameraButtonProps {
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
}

export default function CameraButton({
  onClick,
  disabled = false,
  loading = false,
}: CameraButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick()
    }
  }

  const handleTouchStart = () => {
    setIsPressed(true)
  }

  const handleTouchEnd = () => {
    setIsPressed(false)
  }

  return (
    <button
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      disabled={disabled || loading}
      aria-label={loading ? 'Processing...' : 'Capture food photo'}
      className={`
        relative
        flex items-center justify-center
        w-20 h-20
        rounded-full
        bg-gradient-to-br from-blue-500 to-blue-600
        hover:from-blue-600 hover:to-blue-700
        active:from-blue-700 active:to-blue-800
        shadow-lg hover:shadow-xl
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        disabled:hover:shadow-lg
        ${isPressed ? 'scale-95' : 'scale-100'}
        ${loading ? 'animate-pulse' : ''}
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <span className="text-5xl leading-none" role="img" aria-label="camera">
          =÷
        </span>
      )}

      {!disabled && !loading && (
        <span
          className={`
            absolute inset-0 rounded-full
            bg-white opacity-0
            ${isPressed ? 'animate-ping opacity-25' : ''}
          `}
        />
      )}
    </button>
  )
}
