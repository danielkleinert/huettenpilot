interface LoadingBarProps {
  isLoading: boolean
}

export function LoadingBar({ isLoading }: LoadingBarProps) {
  if (!isLoading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full h-1 bg-transparent">
      <div className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] animate-[gradient_2s_ease-in-out_infinite]" />
    </div>
  )
}