import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { MainCanvas } from './components/MainCanvas';
import { SidePanel } from './components/SidePanel';

function App() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <MainCanvas />
        <SidePanel />
      </div>
    </div>
  );
}

export default App;
