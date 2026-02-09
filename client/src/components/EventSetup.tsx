import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../lib/api';

export default function EventSetup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [startingBalance, setStartingBalance] = useState('1000');
  const [participantInput, setParticipantInput] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function addParticipant() {
    const trimmed = participantInput.trim();
    if (!trimmed) return;
    if (participants.includes(trimmed)) {
      setError(`"${trimmed}" is already added`);
      return;
    }
    setParticipants([...participants, trimmed]);
    setParticipantInput('');
    setError('');
  }

  function removeParticipant(name: string) {
    setParticipants(participants.filter((p) => p !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addParticipant();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Event name is required'); return; }
    if (participants.length < 2) { setError('Add at least 2 participants'); return; }

    setSubmitting(true);
    try {
      await createEvent({
        name: name.trim(),
        participantNames: participants,
        startingBalance: parseFloat(startingBalance) || 1000,
      });
      navigate('/');
    } catch {
      setError('Failed to create event');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Create Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Name */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Event Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="March Madness 2026"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Starting Balance */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Starting Balance ($)</label>
          <input
            type="number"
            min="1"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Participants */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Participants</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={participantInput}
              onChange={(e) => setParticipantInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter name and press Enter"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={addParticipant}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              Add
            </button>
          </div>

          {participants.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {participants.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300"
                >
                  {p}
                  <button
                    type="button"
                    onClick={() => removeParticipant(p)}
                    className="text-gray-500 hover:text-red-400 ml-1"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
}
