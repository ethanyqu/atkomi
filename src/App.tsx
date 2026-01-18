import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SpaceInvadersGame from './pages/SpaceInvadersGame';
import TankWarfare from './pages/TankWarfare';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/space-invaders" element={<SpaceInvadersGame />} />
        <Route path="/tank-warfare" element={<TankWarfare />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
