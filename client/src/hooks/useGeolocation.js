import { useState } from 'react';

export function useGeolocation() {
  const [state, setState] = useState({ loading: false, error: null });

  const request = () =>
    new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const err = new Error('Geolocation not supported by this browser.');
        setState({ loading: false, error: err.message });
        reject(err);
        return;
      }
      setState({ loading: true, error: null });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setState({ loading: false, error: null });
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => {
          setState({ loading: false, error: err.message });
          reject(err);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
      );
    });

  return { ...state, request };
}
