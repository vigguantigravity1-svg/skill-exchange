export default function TrustBadge({ score }: { score: number }) {
  const tier = score > 80 ? 'high' : score >= 50 ? 'mid' : 'low'
  const icon = score > 80 ? '✓' : score >= 50 ? '⏳' : '!'
  const label = `${score}% Verified`

  return (
    <span className={`trust-badge trust-badge-${tier}`} title={`AI Trust Score: ${score}/100`}>
      {icon} {label}
    </span>
  )
}
