import {
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  KanbanSquare,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

/** Navegación principal (Blueprint §1.5.2). */
export const navItems: NavItem[] = [
  { label: 'Inicio', href: '/', icon: LayoutGrid },
  { label: 'Clientes', href: '/clients', icon: Users },
  { label: 'Propiedades', href: '/properties', icon: Building2 },
  { label: 'Coincidencias', href: '/matching', icon: Sparkles },
  { label: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
  { label: 'Agenda', href: '/agenda', icon: CalendarDays },
  { label: 'Visitas', href: '/visits', icon: MapPin },
  { label: 'Documentos', href: '/documents', icon: FileText },
  { label: 'Reportes', href: '/reports', icon: BarChart3 },
  { label: 'Mensajes', href: '/messages', icon: MessageSquare },
  { label: 'Configuración', href: '/settings', icon: Settings },
];
