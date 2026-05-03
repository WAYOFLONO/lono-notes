import { Sidebar } from './components/Sidebar';
import { PlayerDetail } from './components/PlayerDetail';
import { Header } from './components/Header';

export function App() {
  return (
    <div className="flex h-full flex-col bg-bg text-text">
      <Header />
      <div className="grid min-h-0 flex-1 grid-cols-[300px_1fr]">
        <Sidebar />
        <PlayerDetail />
      </div>
    </div>
  );
}
