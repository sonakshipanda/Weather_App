import { useEffect, useState } from 'react';
import SearchBar from './components/SearchBar.jsx';
import CurrentWeather from './components/CurrentWeather.jsx';
import ForecastList from './components/ForecastList.jsx';
import Embeds from './components/Embeds.jsx';
import SavedList from './components/SavedList.jsx';
import { useGeolocation } from './hooks/useGeolocation.js';
import { api } from './api/client.js';

export default function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState([]);
  const [saving, setSaving] = useState(false);
  const geo = useGeolocation();

  async function refreshSaved() {
    try {
      const items = await api.list();
      setSaved(items);
    } catch (err) {
      console.warn('Could not load saved queries:', err.message);
    }
  }

  useEffect(() => {
    refreshSaved();
  }, []);

  async function doSearch(location) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.lookup(location);
      setResult({ ...data, originalQuery: location });
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function doAISearch(text) {
    setLoading(true);
    setError(null);
    try {
      const parsed = await api.parseNL(text);
      if (!parsed.location) {
        throw new Error("Couldn't extract a location from that query. Try mentioning a city or landmark.");
      }
      await doSearch(parsed.location);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function useMyLocation() {
    setError(null);
    try {
      const { lat, lon } = await geo.request();
      await doSearch(`${lat},${lon}`);
    } catch (err) {
      setError(err.message || 'Could not access your location.');
    }
  }

  async function saveCurrentResult() {
    if (!result) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const end = result.forecast.daily[result.forecast.daily.length - 1]?.date || today;
      await api.create({
        location: result.originalQuery || result.location.displayName,
        startDate: today,
        endDate: end,
      });
      await refreshSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSaved(id) {
    try {
      await api.remove(id);
      await refreshSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateSaved(id, patch) {
    setError(null);
    try {
      await api.update(id, patch);
      await refreshSaved();
    } catch (err) {
      setError(err.message);
      throw err; // let SavedList keep the form open so user can retry
    }
  }

  return (
    <div className="container">
      <header className="app-header">
        <h1 className="mark">Weather, by way of an almanac.</h1>
        <div className="byline">Sonakshi Panda — PM Accelerator assessment</div>
      </header>

      <SearchBar
        onSearch={doSearch}
        onUseLocation={useMyLocation}
        onAskAI={doAISearch}
        loading={loading || geo.loading}
      />

      {error && <div className="error">{error}</div>}

      {result && (
        <>
          <CurrentWeather location={result.location} current={result.forecast.current} />
          <ForecastList daily={result.forecast.daily} />

          <button
            className="btn-primary"
            onClick={saveCurrentResult}
            disabled={saving}
            style={{ marginBottom: 28 }}
          >
            {saving ? 'Saving…' : 'Save this query'}
          </button>

          <Embeds
            embeds={result.embeds}
            locationLabel={result.location?.displayName?.split(',')[0]?.trim()}
          />
        </>
      )}

      <SavedList
        items={saved}
        onRefresh={refreshSaved}
        onDelete={deleteSaved}
        onUpdate={updateSaved}
      />

      <details className="about-collapsible">
        <summary>
          <span className="about-chevron" aria-hidden="true">▸</span>
          About PM Accelerator
        </summary>
        <p>
          The Product Manager Accelerator Program supports PM professionals through every
          stage of their career — from students seeking entry-level roles to Directors
          stepping into leadership. The flagship PM Bootcamp has trained students at Google,
          Meta, Amazon, Microsoft, and more. See{' '}
          <a href="https://www.linkedin.com/school/pmaccelerator/" target="_blank" rel="noreferrer">
            Product Manager Accelerator on LinkedIn
          </a>
          .
        </p>
      </details>
    </div>
  );
}
