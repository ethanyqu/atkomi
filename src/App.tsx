import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SpaceInvadersGame from './pages/SpaceInvadersGame';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/space-invaders" element={<SpaceInvadersGame />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
