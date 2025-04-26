'use client';
import React, { useState } from 'react';

export default function Home() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ genre: string; priority: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setError('Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Complaint Classifier</h1>
      <form onSubmit={handlePredict} className="flex flex-col gap-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Enter complaint here..."
          className="border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? 'Predicting...' : 'Predict'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {result && (
        <div className="mt-6">
          <p>
            <strong>Genre:</strong> {result.genre}
          </p>
          <p>
            <strong>Priority:</strong> {result.priority}
          </p>
        </div>
      )}
    </div>
  );
}
