/**
 * Nitrogen Cylinder Calculator – UI Module
 *
 * Orchestrates the DOM: binds events, drives the weather module,
 * triggers the calculator, renders results, and handles i18n updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ─── DOM References ──────────────────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const tempInput          = $('#temperature-input');
  const volumeInput        = $('#volume-input');
  const pressureInput      = $('#pressure-input');
  const calculateBtn       = $('#calculate-btn');
  const resultSection      = $('#result-section');
  const themeToggleBtn     = $('#theme-toggle');
  const langToggleBtn      = $('#lang-toggle');
  const langToggleLabel    = $('#lang-toggle-label');

  // Location Modal
  const locationModal      = $('#location-modal');
  const locModalAllow      = $('#loc-modal-allow');
  const locModalDismiss    = $('#loc-modal-dismiss');

  // Weather UI
  const weatherLoading     = $('#weather-loading');
  const weatherSuccess     = $('#weather-success');
  const weatherError       = $('#weather-error');
  const weatherPermDenied  = $('#weather-perm-denied');
  const weatherTempDisplay = $('#weather-temp-display');
  const weatherLocation    = $('#weather-location');
  const weatherTime        = $('#weather-time');
  const weatherRefreshBtn  = $('#weather-refresh-btn');
  const weatherErrorMsg    = $('#weather-error-msg');
  const tempSourceBadge    = $('#temp-source-badge');

  // City search (error state)
  const citySearchWrap     = $('#city-search-wrap');
  const citySearchInput    = $('#city-search-input');
  const citySearchResults  = $('#city-search-results');
  const citySearchBtn      = $('#city-search-btn');

  // City search (permission denied state)
  const citySearchWrapPerm     = $('#city-search-wrap-perm');
  const citySearchInputPerm    = $('#city-search-input-perm');
  const citySearchResultsPerm  = $('#city-search-results-perm');
  const citySearchBtnPerm      = $('#city-search-btn-perm');

  // Result elements
  const resultValue        = $('#result-value');
  const resultVolumeM3     = $('#result-volume-m3');
  const resultVolumeL      = $('#result-volume-l');
  const resultGauge        = $('#result-gauge');
  const resultAbsolute     = $('#result-absolute');
  const resultTempC        = $('#result-temp-c');
  const resultTempK        = $('#result-temp-k');
  const resultVolume       = $('#result-volume');
  const resultMoles        = $('#result-moles');

  // Errors
  const tempError          = $('#temp-error');
  const volumeError        = $('#volume-error');
  const pressureError      = $('#pressure-error');

  // Explanation
  const explanationToggle  = $('#explanation-toggle');
  const explanationContent = $('#explanation-content');
  const explanationSteps   = $('#explanation-steps');
  const explanationFormula = $('#explanation-formula');


  // ─── i18n: Apply translations ────────────────────────────────────────────────

  function applyTranslations() {
    // data-i18n → textContent
    $$('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = i18n.t(key);
      if (typeof val === 'string') el.textContent = val;
    });

    // data-i18n-html → innerHTML (for strings with <strong> etc.)
    $$('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const val = i18n.t(key);
      if (typeof val === 'string') el.innerHTML = val;
    });

    // data-i18n-placeholder → placeholder
    $$('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = i18n.t(key);
    });

    // Explanation steps (array)
    const steps = i18n.t('explanationSteps');
    if (Array.isArray(steps)) {
      explanationSteps.innerHTML = steps.map(s => `<li>${s}</li>`).join('');
    }

    // Explanation formula
    explanationFormula.innerHTML = i18n.t('explanationFormula');

    // Language toggle label — show the OTHER language
    const langs = i18n.getLanguages();
    const other = langs.find(l => l.code !== i18n.getLang()) || langs[0];
    langToggleLabel.textContent = other.label;
    langToggleBtn.setAttribute('aria-label', other.name);

    // Update source badge
    setTempSource(Weather.isAutomatic() ? 'auto' : 'manual');

    // Update theme icon aria label
    updateThemeIcon();
  }

  // Listen for language changes
  i18n.onChange(() => applyTranslations());


  // ─── Theme ───────────────────────────────────────────────────────────────────

  function initTheme() {
    const saved = localStorage.getItem('n2calc-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    updateThemeIcon();
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('n2calc-theme', next);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeToggleBtn.setAttribute('aria-label', i18n.t(isDark ? 'switchToLight' : 'switchToDark'));
    themeToggleBtn.innerHTML = isDark
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  themeToggleBtn.addEventListener('click', toggleTheme);
  initTheme();


  // ─── Language Toggle ─────────────────────────────────────────────────────────

  langToggleBtn.addEventListener('click', () => {
    i18n.toggle();
  });


  // ─── Weather Integration ─────────────────────────────────────────────────────

  function showWeatherState(state) {
    // Hide spinner / loading block once temperature is received (success), show when loading
    weatherLoading.hidden    = state !== 'loading';
    weatherSuccess.hidden    = state !== 'success';
    weatherError.hidden      = state !== 'error';
    weatherPermDenied.hidden = state !== 'permission_denied';

    if (weatherRefreshBtn) {
      if (state === 'loading') {
        weatherRefreshBtn.disabled = true;
        weatherRefreshBtn.classList.add('is-refreshing');
      } else {
        weatherRefreshBtn.disabled = false;
        weatherRefreshBtn.classList.remove('is-refreshing');
      }
    }
  }

  Weather.onStatusChange((status) => {
    showWeatherState(status);
  });

  Weather.onTemperatureReceived((tempC, locationName) => {
    tempInput.value = tempC;
    weatherTempDisplay.textContent = `${tempC}°C`;
    weatherLocation.textContent = locationName || '';
    weatherTime.textContent = i18n.t('weatherJustNow');
    setTempSource('auto');
    clearFieldError('temperature');
    // Ensure loading spinner is hidden when temperature result is displayed
    showWeatherState('success');
  });

  Weather.onError((msg) => {
    // Use translated error message
    weatherErrorMsg.textContent = i18n.t('weatherError');
  });

  // Refresh button: trigger refresh and show loading spinner until new temp is found
  weatherRefreshBtn.addEventListener('click', async () => {
    showWeatherState('loading');
    await Weather.refresh();
  });


  // ─── City Search (reusable for both error & perm-denied states) ──────────

  function setupCitySearch(triggerBtn, wrapEl, inputEl, resultsEl) {
    if (!triggerBtn || !wrapEl || !inputEl || !resultsEl) return;

    triggerBtn.addEventListener('click', () => {
      wrapEl.hidden = !wrapEl.hidden;
      if (!wrapEl.hidden) inputEl.focus();
    });

    let _timeout = null;
    inputEl.addEventListener('input', () => {
      clearTimeout(_timeout);
      const query = inputEl.value.trim();
      if (query.length < 2) {
        resultsEl.innerHTML = '';
        resultsEl.hidden = true;
        return;
      }
      _timeout = setTimeout(async () => {
        const cities = await Weather.searchCities(query);
        renderCityResultsInto(cities, resultsEl, inputEl, wrapEl);
      }, 350);
    });

    document.addEventListener('click', (e) => {
      if (!wrapEl.contains(e.target) && e.target !== triggerBtn) {
        resultsEl.hidden = true;
      }
    });
  }

  function renderCityResultsInto(cities, resultsEl, inputEl, wrapEl) {
    if (!cities.length) {
      resultsEl.innerHTML = `<div class="city-item city-empty">${i18n.t('weatherNoCities')}</div>`;
      resultsEl.hidden = false;
      return;
    }
    resultsEl.innerHTML = cities.map(c => {
      const label = [c.name, c.admin, c.country].filter(Boolean).join(', ');
      return `<button class="city-item" data-lat="${c.latitude}" data-lon="${c.longitude}" data-name="${c.name}">${label}</button>`;
    }).join('');
    resultsEl.hidden = false;

    resultsEl.querySelectorAll('.city-item[data-lat]').forEach(btn => {
      btn.addEventListener('click', () => {
        Weather.fetchCityTemperature(
          parseFloat(btn.dataset.lat),
          parseFloat(btn.dataset.lon),
          btn.dataset.name
        );
        resultsEl.innerHTML = '';
        resultsEl.hidden = true;
        inputEl.value = '';
        wrapEl.hidden = true;
      });
    });
  }

  setupCitySearch(citySearchBtn, citySearchWrap, citySearchInput, citySearchResults);
  setupCitySearch(citySearchBtnPerm, citySearchWrapPerm, citySearchInputPerm, citySearchResultsPerm);


  // ─── Temperature source ──────────────────────────────────────────────────────

  tempInput.addEventListener('input', () => {
    if (Weather.isAutomatic()) {
      Weather.setManual();
      setTempSource('manual');
    }
  });

  function setTempSource(source) {
    if (source === 'auto') {
      tempSourceBadge.textContent = i18n.t('sourceAuto');
      tempSourceBadge.className = 'source-badge source-auto';
    } else {
      tempSourceBadge.textContent = i18n.t('sourceManual');
      tempSourceBadge.className = 'source-badge source-manual';
    }
  }

  // Update "Updated X minutes ago" every 30 seconds
  setInterval(() => {
    const t = Weather.getTimeSinceUpdate();
    if (t && !weatherSuccess.hidden) {
      weatherTime.textContent = t;
    }
  }, 30000);

  // Location Modal handlers
  function showLocationModal() {
    if (locationModal) locationModal.hidden = false;
  }

  function hideLocationModal() {
    if (locationModal) locationModal.hidden = true;
  }

  if (locModalAllow) {
    locModalAllow.addEventListener('click', () => {
      hideLocationModal();
      Weather.fetchAutoTemperature();
    });
  }

  if (locModalDismiss) {
    locModalDismiss.addEventListener('click', () => {
      hideLocationModal();
      showWeatherState('permission_denied');
    });
  }

  async function initLocationPrompt() {
    if (!navigator.geolocation) {
      showWeatherState('error');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        if (status.state === 'granted') {
          Weather.fetchAutoTemperature();
        } else if (status.state === 'prompt') {
          showLocationModal();
        } else {
          showWeatherState('permission_denied');
        }
      } catch {
        showLocationModal();
      }
    } else {
      showLocationModal();
    }
  }

  // Check & prompt for location on start
  initLocationPrompt();


  // ─── Validation UI ───────────────────────────────────────────────────────────

  function clearAllErrors() {
    tempError.textContent = '';
    tempError.hidden = true;
    volumeError.textContent = '';
    volumeError.hidden = true;
    pressureError.textContent = '';
    pressureError.hidden = true;
    tempInput.classList.remove('input-error');
    volumeInput.classList.remove('input-error');
    pressureInput.classList.remove('input-error');
  }

  function clearFieldError(field) {
    if (field === 'temperature') { tempError.hidden = true; tempInput.classList.remove('input-error'); }
    if (field === 'volume') { volumeError.hidden = true; volumeInput.classList.remove('input-error'); }
    if (field === 'pressure') { pressureError.hidden = true; pressureInput.classList.remove('input-error'); }
  }

  function showFieldError(field, message) {
    if (field === 'temperature') { tempError.textContent = message; tempError.hidden = false; tempInput.classList.add('input-error'); }
    if (field === 'volume') { volumeError.textContent = message; volumeError.hidden = false; volumeInput.classList.add('input-error'); }
    if (field === 'pressure') { pressureError.textContent = message; pressureError.hidden = false; pressureInput.classList.add('input-error'); }
  }

  // Clear errors on input
  tempInput.addEventListener('input', () => clearFieldError('temperature'));
  volumeInput.addEventListener('input', () => clearFieldError('volume'));
  pressureInput.addEventListener('input', () => clearFieldError('pressure'));


  // ─── Calculation ─────────────────────────────────────────────────────────────

  /**
   * Map calculator validation error keys to i18n keys.
   * This keeps the calculator module pure (no i18n dependency).
   */
  const validationI18nMap = {
    'Please enter the ambient temperature.': 'errTempEmpty',
    'Temperature must be a valid number.': 'errTempInvalid',
    'Temperature must be above absolute zero (−273.15 °C).': 'errTempAbsZero',
    'Please enter the cylinder volume.': 'errVolEmpty',
    'Cylinder volume must be a valid number.': 'errVolInvalid',
    'Cylinder volume must be greater than zero.': 'errVolZero',
    'Please enter the gauge pressure.': 'errPresEmpty',
    'Gauge pressure must be a valid number.': 'errPresInvalid',
    'Pressure cannot be negative.': 'errPresNeg',
  };

  function translateValidationError(msg) {
    const key = validationI18nMap[msg];
    return key ? i18n.t(key) : msg;
  }

  function runCalculation() {
    clearAllErrors();

    const tVal = tempInput.value.trim();
    const vVal = volumeInput.value.trim();
    const pVal = pressureInput.value.trim();

    const validation = validateInputs(tVal, vVal, pVal);
    if (!validation.valid) {
      validation.errors.forEach(e => showFieldError(e.field, translateValidationError(e.message)));
      const firstField = validation.errors[0].field;
      if (firstField === 'temperature') tempInput.focus();
      else if (firstField === 'volume') volumeInput.focus();
      else if (firstField === 'pressure') pressureInput.focus();
      return;
    }

    try {
      const result = calculateNitrogenMass(
        parseFloat(tVal),
        parseFloat(vVal),
        parseFloat(pVal)
      );
      renderResult(result);
    } catch (err) {
      showFieldError('pressure', err.message);
    }
  }

  function renderResult(r) {
    resultValue.textContent    = r.massKg.toFixed(2);
    if (resultVolumeM3) resultVolumeM3.textContent = r.freeGasVolumeM3.toFixed(2);
    if (resultVolumeL)  resultVolumeL.textContent  = r.freeGasVolumeLiters.toLocaleString(undefined, { maximumFractionDigits: 1 });
    resultGauge.textContent    = `${r.gaugePressureBar} bar`;
    resultAbsolute.textContent = `${r.absolutePressureBar.toFixed(3)} bar`;
    resultTempC.textContent    = `${r.temperatureC}°C`;
    resultTempK.textContent    = `${r.temperatureKelvin} K`;
    resultVolume.textContent   = `${r.volumeLiters} L`;
    resultMoles.textContent    = `≈ ${r.moles.toFixed(1)} mol`;

    // Show result with animation
    resultSection.hidden = false;
    resultSection.classList.remove('result-enter');
    void resultSection.offsetWidth;
    resultSection.classList.add('result-enter');

    // Scroll to result on mobile
    if (window.innerWidth < 768) {
      setTimeout(() => {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }

  calculateBtn.addEventListener('click', runCalculation);

  // Allow Enter key to trigger calculation
  [tempInput, volumeInput, pressureInput].forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runCalculation();
      }
    });
  });


  // ─── Explanation Toggle ──────────────────────────────────────────────────────

  explanationToggle.addEventListener('click', () => {
    const expanded = explanationToggle.getAttribute('aria-expanded') === 'true';
    explanationToggle.setAttribute('aria-expanded', !expanded);
    explanationContent.hidden = expanded;
    explanationToggle.querySelector('.toggle-icon').textContent = expanded ? '+' : '−';
  });


  // ─── Initial State ──────────────────────────────────────────────────────────

  setTempSource('manual');
  resultSection.hidden = true;
  showWeatherState('loading');

  // Apply translations on load
  applyTranslations();
});
