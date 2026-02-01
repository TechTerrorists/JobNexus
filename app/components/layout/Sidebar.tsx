'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, Briefcase, FileText, Users, MessageSquare, 
  ChevronDown, ChevronRight, Menu, X 
} from 'lucide-react'

type SubMenuItem = {
  label: string
  href: string
  icon: React.ReactNode
}

type MenuItem = {
  label: string
  icon: React.ReactNode
  href?: string
  subItems?: SubMenuItem[]
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: <Home size={20} />, href: '/dashboard' },
  {
    label: 'Jobs',
    icon: <Briefcase size={20} />,
    subItems: [
      { label: 'All Jobs', href: '/dashboard/jobs', icon: <Briefcase size={18} /> },
      { label: 'Saved Jobs', href: '/dashboard/jobs/saved', icon: <Briefcase size={18} /> },
    ],
  },
  {
    label: 'Applications',
    icon: <FileText size={20} />,
    subItems: [
      { label: 'My Applications', href: '/dashboard/applications', icon: <FileText size={18} /> },
      { label: 'Interviews', href: '/dashboard/interviews', icon: <MessageSquare size={18} /> },
    ],
  },
  { label: 'Chat', icon: <MessageSquare size={20} />, href: '/dashboard/chat' },
  { label: 'Profile', icon: <Users size={20} />, href: '/dashboard/profile' },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ Jobs: true, Applications: true })
  const pathname = usePathname()

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg lg:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-0 lg:w-16'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <h2 className={`font-bold text-xl ${!isOpen && 'lg:hidden'}`}>JobNexus</h2>
          </div>

          <nav className="flex-1 overflow-y-auto p-2">
            {menuItems.map((item) => (
              <div key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 ${
                      pathname === item.href ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {item.icon}
                    <span className={!isOpen ? 'lg:hidden' : ''}>{item.label}</span>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className={!isOpen ? 'lg:hidden' : ''}>{item.label}</span>
                      </div>
                      {isOpen && (openMenus[item.label] ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                    </button>
                    {openMenus[item.label] && item.subItems && (
                      <div className={`ml-4 mt-1 space-y-1 ${!isOpen && 'lg:hidden'}`}>
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 ${
                              pathname === subItem.href ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                            }`}
                          >
                            {subItem.icon}
                            <span className="text-sm">{subItem.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-16'}`} />
    </>
  )
}
