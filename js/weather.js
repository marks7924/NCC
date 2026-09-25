/**
 * Nitrogen Cylinder Calculator – Weather Module
 *
 * Uses the free Open-Meteo API (https://open-meteo.com/) which requires
 * no API key, making it safe for frontend-only deployment.
 *
 * Architecture:
 *   1. Try Geolocation API → get lat/lon
 *   2. Hit Open-Meteo Current Weather → get actual air temperature
 *   3. Populate the temperature field automatically
 *   4. If anything fails → graceful fallback to manual input
 *
 * Privacy: Location is used solely for the weather request and is never stored.
 */

const Weather = (() => {
  // ─── State ───────────────────────────────────────────────────────────────────
  let _lastFetchTime = null;
  let _lastTemperature = null;
  let _lastLocationName = null;
  let _coords = null;
  let _isAutomatic = false;

  // ─── Callbacks (set by UI module) ────────────────────────────────────────────
  let _onTemperatureReceived = null;  // (tempC, locationName) => void
  let _onStatusChange = null;         // (status: string) => void
  let _onError = null;                // (message: string) => void

  /**
   * Register callback handlers from the UI layer.
   */
  function onTemperatureReceived(cb) { _onTemperatureReceived = cb; }
  function onStatusChange(cb) { _onStatusChange = cb; }
  function onError(cb) { _onError = cb; }

  function _status(msg) { _onStatusChange && _onStatusChange(msg); }
  function _error(msg) { _onError && _onError(msg); }

  // ─── Geolocation ─────────────────────────────────────────────────────────────

  /**
   * Request the user's position via the browser Geolocation API.
   * Returns { latitude, longitude } or throws.
   */
  function _getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              reject(new Error('PERMISSION_DENIED'));
              break;
            case err.POSITION_UNAVAILABLE:
              reject(new Error('Location information is unavailable.'));
              break;
            case err.TIMEOUT:
              reject(new Error('Location request timed out.'));
              break;
            default:
              reject(new Error('An unknown geolocation error occurred.'));
          }
        },
        { timeout: 10000, maximumAge: 300000 } // 10 s timeout, 5 min cache
      );
    });
  }

  // ─── Open-Meteo API ──────────────────────────────────────────────────────────

  /**
   * Fetch current temperature from Open-Meteo.
   * Uses `temperature_2m` (actual air temp), NOT apparent/"feels like".
   */
  async function _fetchTemperature(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
    const data = await res.json();
    if (!data.current || data.current.temperature_2m === undefined) {
      throw new Error('Unexpected weather API response format.');
    }
    return Math.round(data.current.temperature_2m * 10) / 10; // 1 decimal
  }

  /**
   * Reverse-geocode coordinates to a city name using Open-Meteo's geocoding API.
   */
  async function _reverseGeocode(lat, lon) {
    try {
      // Open-Meteo doesn't have reverse geocoding, use a simple approach
      // We'll use the Nominatim API (OpenStreetMap) which is free
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.address?.city || data.address?.town || data.address?.village || data.display_name?.split(',')[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Helper to swap end-of-word Arabic Taa Marbouta (ة) and Haa (ه) and Alifs for flexible matching.
   */
  function _normalizeArabicQuery(str) {
    if (!str) return '';
    // Replace 'ه' at end with 'ة' or vice versa
    if (str.endsWith('ه')) return str.slice(0, -1) + 'ة';
    if (str.endsWith('ة')) return str.slice(0, -1) + 'ه';
    return str;
  }

  /**
   * Search cities by name supporting English, Arabic, and multilingual input.
   * @param {string} query
   * @returns {Promise<Array<{name, country, latitude, longitude}>>}
   */
  async function searchCities(query) {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim();
    const lang = (typeof i18n !== 'undefined' && i18n.getLang) ? i18n.getLang() : 'en';

    // Strategy 1: Open-Meteo search with current language
    try {
      const openMeteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=${lang}`;
      const res = await fetch(openMeteoUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results.map(r => ({
            name: r.name,
            country: r.country || '',
            admin: r.admin1 || '',
            latitude: r.latitude,
            longitude: r.longitude
          }));
        }
      }

      // Try normalized Arabic query if first attempt returned no results
      const altQ = _normalizeArabicQuery(q);
      if (altQ && altQ !== q) {
        const altUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(altQ)}&count=6&language=${lang}`;
        const altRes = await fetch(altUrl);
        if (altRes.ok) {
          const altData = await altRes.json();
          if (altData.results && altData.results.length > 0) {
            return altData.results.map(r => ({
              name: r.name,
              country: r.country || '',
              admin: r.admin1 || '',
              latitude: r.latitude,
              longitude: r.longitude
            }));
          }
        }
      }
    } catch {
      // Fall through to Nominatim
    }

    // Strategy 2: OpenStreetMap Nominatim API fallback (excellent Arabic support)
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&accept-language=${lang}`;
      const nomRes = await fetch(nomUrl, {
        headers: { 'Accept-Language': lang }
      });
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (Array.isArray(nomData) && nomData.length > 0) {
          return nomData.map(r => ({
            name: r.address?.city || r.address?.town || r.address?.state || r.display_name?.split(',')[0] || r.name,
            country: r.address?.country || '',
            admin: r.address?.state || '',
            latitude: parseFloat(r.lat),
            longitude: parseFloat(r.lon)
          }));
        }
      }
    } catch {
      // Return empty array
    }

    return [];
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Automatically retrieve temperature using geolocation + weather API.
   */
  async function fetchAutoTemperature() {
    try {
      _status('loading');

      // 1. Get position
      const pos = await _getPosition();
      _coords = pos;

      // 2. Fetch temperature
      const tempC = await _fetchTemperature(pos.latitude, pos.longitude);

      // 3. Try to get city name (non-blocking)
      const cityName = await _reverseGeocode(pos.latitude, pos.longitude);

      _lastFetchTime = Date.now();
      _lastTemperature = tempC;
      _lastLocationName = cityName;
      _isAutomatic = true;

      _status('success');
      _onTemperatureReceived && _onTemperatureReceived(tempC, cityName);
    } catch (err) {
      _isAutomatic = false;
      if (err.message === 'PERMISSION_DENIED') {
        _status('permission_denied');
        _error('Location permission denied. You can search for your city or enter temperature manually.');
      } else {
        _status('error');
        _error('Unable to retrieve current temperature. Please enter it manually.');
      }
    }
  }

  /**
   * Fetch temperature for a specific city (selected from search).
   */
  async function fetchCityTemperature(lat, lon, cityName) {
    try {
      _status('loading');
      const tempC = await _fetchTemperature(lat, lon);
      _coords = { latitude: lat, longitude: lon };
      _lastFetchTime = Date.now();
      _lastTemperature = tempC;
      _lastLocationName = cityName;
      _isAutomatic = true;

      _status('success');
      _onTemperatureReceived && _onTemperatureReceived(tempC, cityName);
    } catch {
      _status('error');
      _error('Unable to retrieve temperature for this location.');
    }
  }

  /**
   * Refresh the temperature using the last known coordinates.
   */
  async function refresh() {
    if (!_coords) {
      await fetchAutoTemperature();
      return;
    }
    try {
      _status('loading');
      const tempC = await _fetchTemperature(_coords.latitude, _coords.longitude);
      _lastFetchTime = Date.now();
      _lastTemperature = tempC;
      _isAutomatic = true;

      _status('success');
      _onTemperatureReceived && _onTemperatureReceived(tempC, _lastLocationName);
    } catch {
      _status('error');
      _error('Unable to refresh temperature.');
    }
  }

  /**
   * Get a human-readable string for how long ago the temperature was fetched.
   */
  function getTimeSinceUpdate() {
    if (!_lastFetchTime) return null;
    const seconds = Math.floor((Date.now() - _lastFetchTime) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return 'Updated 1 minute ago';
    if (minutes < 60) return `Updated ${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Updated 1 hour ago';
    return `Updated ${hours} hours ago`;
  }

  function isAutomatic() { return _isAutomatic; }
  function setManual() { _isAutomatic = false; }
  function getLastTemperature() { return _lastTemperature; }
  function getLocationName() { return _lastLocationName; }

  return {
    fetchAutoTemperature,
    fetchCityTemperature,
    searchCities,
    refresh,
    getTimeSinceUpdate,
    isAutomatic,
    setManual,
    getLastTemperature,
    getLocationName,
    onTemperatureReceived,
    onStatusChange,
    onError
  };
})();
