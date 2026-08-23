import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  color: string
}

export default function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-warm-gray">{title}</p>
          <p className="text-3xl font-semibold text-charcoal mt-1">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
