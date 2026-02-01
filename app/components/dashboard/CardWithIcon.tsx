import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

type CardWithIconProps = {
  icon: LucideIcon
  title: string
  subtitle: string | number
  href: string
  children?: React.ReactNode
}

export default function CardWithIcon({ icon: Icon, title, subtitle, href, children }: CardWithIconProps) {
  return (
    <div className={`bg-white rounded-lg shadow ${children ? 'flex flex-col' : ''}`}>
      <Link href={href} className="no-underline">
        <div className="relative overflow-hidden p-4 flex justify-between items-center">
          <div className="absolute top-1/2 left-0 w-32 h-32 -translate-x-1/3 -translate-y-3/5 rounded-full bg-blue-500 opacity-15"></div>
          <div className="relative z-10 text-blue-600">
            <Icon size={48} />
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm">{title}</p>
            <h2 className="text-3xl font-bold text-gray-800">{subtitle}</h2>
          </div>
        </div>
      </Link>
      {children && <div className="border-t border-gray-200">{children}</div>}
    </div>
  )
}
