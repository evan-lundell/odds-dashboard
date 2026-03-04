import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import BetsPage from './components/BetsPage';
import BetsStandings from './components/BetsStandings';
import EventSetup from './components/EventSetup';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/odds" replace />} />
            <Route path="/odds" element={<Dashboard />} />
            <Route path="/bets" element={<BetsPage />} />
            <Route path="/leaderboard" element={<BetsStandings />} />
            <Route path="/events/new" element={<EventSetup />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
