import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { CharacterDetail } from '@/pages/CharacterDetail';
import { RunewordPlanner } from '@/pages/RunewordPlanner';
import { StashBrowser } from '@/pages/StashBrowser';
import { Recommendations } from '@/pages/Recommendations';
import { CubeCalculator } from '@/pages/CubeCalculator';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/character/:characterId" element={<CharacterDetail />} />
          <Route path="/runewords" element={<RunewordPlanner />} />
          <Route path="/cube" element={<CubeCalculator />} />
          <Route path="/stash" element={<StashBrowser />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
