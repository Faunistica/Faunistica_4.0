import { LayoutDashboard, Award, Flag, MapPin } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Главная' },
    { id: 'badges', icon: Award, label: 'Значки' },
    { id: 'marathons', icon: Flag, label: 'Марафоны' },
    { id: 'map', icon: MapPin, label: 'Карта' },
  ];

  return (
    <aside className="w-48 bg-[#1a2332] border-r border-gray-700 p-3 hidden md:flex md:flex-col md:shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
              activeTab === item.id
                ? 'bg-[#2bb3d9] text-white'
                : 'text-gray-300 hover:bg-[#2a3448] hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}