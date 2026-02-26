# speclang-header lines:5
# id: @specs/ui-dashboard
# version: 1.0.0
# layer: 5

/**
 * Sidebar component for navigation
 * Generated from: @implementation/ui-dashboard
 */

import React from 'react';

interface NavItem {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
}

interface SidebarProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

const defaultNavItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: '◉' },
  { id: 'cascade', label: 'Cascade', icon: '⟳', badge: 0 },
  { id: 'agents', label: 'Agents', icon: '◈' },
  { id: 'files', label: 'File Watcher', icon: '◫' },
  { id: 'specs', label: 'Specs', icon: '☰' },
  { id: 'logs', label: 'Logs', icon: '☷' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem = 'overview',
  onItemClick,
}) => {
  const handleItemClick = (itemId: string) => {
    if (onItemClick) {
      onItemClick(itemId);
    }
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-black border-r border-gray-800">
      <nav className="p-4">
        <ul className="space-y-1">
          {defaultNavItems.map((item) => (
            <li key={item.id}>
              <button
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                  activeItem === item.id
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                }`}
                onClick={() => handleItemClick(item.id)}
              >
                <span className="flex items-center gap-3">
                  <span className="w-4 text-center">{item.icon}</span>
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-blue-600 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          <div>SpecLang v1.0.0</div>
          <div className="mt-1">MCP Server: Connected</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
