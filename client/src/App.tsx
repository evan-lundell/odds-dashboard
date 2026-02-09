import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import BetsStandings from './components/BetsStandings';
import EventSetup from './components/EventSetup';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bets" element={<BetsStandings />} />
            <Route path="/events/new" element={<EventSetup />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
