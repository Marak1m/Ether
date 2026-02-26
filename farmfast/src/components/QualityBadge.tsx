import { Badge } from "@/components/ui/badge"

interface QualityBadgeProps {
  grade: 'A' | 'B' | 'C'
  size?: 'sm' | 'md' | 'lg'
}

export function QualityBadge({ grade, size = 'md' }: QualityBadgeProps) {
  const config = {
    A: { label: 'Premium', variant: 'success' as const, emoji: '🌟' },
    B: { label: 'Standard', variant: 'warning' as const, emoji: '✅' },
    C: { label: 'Economy', variant: 'default' as const, emoji: '👍' }
  }

  const { label, variant, emoji } = config[grade]

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  }

  return (
    <Badge variant={variant} className={sizeClasses[size]}>
      {emoji} Grade {grade} - {label}
    </Badge>
  )
}
