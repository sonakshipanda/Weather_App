import { useState } from 'react';

export default function SearchBar({ onSearch, onUseLocation, onAskAI, loading }) {
  const [text, setText] = useState('');
  const [aiMode, setAiMode] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (aiMode) onAskAI?.(text);
    else onSearch?.(text);
  };

  return (
    <>
      <form className="search" onSubmit={submit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            aiMode
              ? 'Ask anything — "weather in Tokyo next week"'
              : 'City, zip, "lat,lon", or landmark'
          }
          aria-label="Location or natural-language query"
        />
        <button type="submit" disabled={loading || !text.trim()}>
          {loading ? '…' : aiMode ? 'Ask' : 'Search'}
        </button>
      </form>

      <div className="search-actions">
        <button type="button" onClick={onUseLocation} disabled={loading}>
          Use my location
        </button>
        <button
          type="button"
          onClick={() => setAiMode((m) => !m)}
          className={aiMode ? 'active' : ''}
          title="Toggle natural-language mode"
        >
          {aiMode ? 'AI mode · on' : 'AI mode · off'}
        </button>
      </div>
    </>
  );
}
