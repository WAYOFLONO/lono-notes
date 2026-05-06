import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PlayerDetail } from './components/PlayerDetail';
import { Header } from './components/Header';
import { useStore } from './store';

export function App() {
  const loadAll = useStore((s) => s.loadAll);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSidebar]);

  return (
    <div className="flex h-full flex-col bg-bg text-text">
      <Header />
      <div
        className={`grid min-h-0 flex-1 ${
          sidebarCollapsed ? 'grid-cols-[1fr]' : 'grid-cols-[300px_1fr]'
        }`}
      >
        {!sidebarCollapsed && <Sidebar />}
        <PlayerDetail />
      </div>
    </div>
  );
}
