import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Layers,
  ListChecks,
  Route,
  Settings,
  StickyNote,
  Target,
  type LucideIcon
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sessions', label: 'Study Log', icon: BookOpenCheck },
  { to: '/content', label: 'Content Review', icon: ListChecks },
  { to: '/questions', label: 'Question Bank', icon: Target },
  { to: '/exams', label: 'Full-Lengths', icon: GraduationCap },
  { to: '/plan', label: 'Study Plan', icon: Route },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/anki', label: 'Anki', icon: Layers },
  { to: '/settings', label: 'Settings', icon: Settings }
]
