/**
 * Nitrogen Cylinder Calculator – Internationalization (i18n) Module
 *
 * Supports English (LTR) and Arabic (RTL).
 * All translatable strings are stored here. The UI module reads them via
 * i18n.t('key') and re-renders when the language changes.
 *
 * To add a new language, simply add a new object to the `translations` map
 * following the same key structure.
 */

const i18n = (() => {
  // ─── Translation Data ────────────────────────────────────────────────────────

  const translations = {
    en: {
      dir: 'ltr',
      langLabel: '🌐 العربية',
      langName: 'Switch to Arabic',

      // Header
      appTitle: 'Nitrogen Cylinder Calculator',
      appSubtitle: 'Estimate the amount of nitrogen gas inside a pressurized cylinder.',

      // Weather
      weatherCardTitle: 'Ambient Temperature — Weather',
      weatherLoading: 'Retrieving current temperature…',
      weatherRefresh: '↻ Refresh',
      weatherJustNow: 'Just now',
      weatherUpdated1Min: 'Updated 1 minute ago',
      weatherUpdatedMins: 'Updated {n} minutes ago',
      weatherUpdated1Hr: 'Updated 1 hour ago',
      weatherUpdatedHrs: 'Updated {n} hours ago',
      weatherError: 'Unable to retrieve current temperature.',
      weatherPermDenied: 'Location permission denied. Please enter the temperature manually below.',
      weatherSearchCity: '🔍 Search for your city',
      weatherCityPlaceholder: 'Type a city name…',
      weatherNoCities: 'No cities found',

      // Input section
      inputTitle: 'Input Parameters',
      tempLabel: 'Ambient Temperature',
      tempPlaceholder: 'e.g. 25',
      tempHelper: 'Enter the temperature near the cylinder. Auto-filled from weather if available.',
      sourceAuto: 'Auto Weather',
      sourceManual: 'Manual Input',
      volumeLabel: 'Cylinder Volume',
      volumePlaceholder: 'e.g. 50',
      volumeHelper: 'Enter the water capacity written on the cylinder.',
      pressureLabel: 'Gauge Pressure',
      pressurePlaceholder: 'e.g. 200',
      pressureHelper: 'Enter the pressure currently shown on the cylinder gauge.',

      // Calculate
      calculateBtn: 'Calculate Nitrogen Mass',

      // Result
      resultLabel: 'Estimated Nitrogen Output',
      resultMassLabel: 'Gas Mass',
      resultVolumeM3Label: 'Gas Volume (m³)',
      resultVolumeLitersLabel: 'Gas Volume (Liters)',
      resultFreeVolLabel: 'Gas Volume (1 atm)',
      resultGasName: 'Nitrogen (N₂)',
      resultGaugeLabel: 'Gauge Pressure',
      resultAbsoluteLabel: 'Absolute Pressure',
      resultTempCLabel: 'Temperature',
      resultTempKLabel: 'Temperature',
      resultVolumeLabel: 'Cylinder Volume',
      resultMolesLabel: 'Amount of Gas',

      // Explanation
      explanationToggle: 'How is this calculated?',
      explanationSteps: [
        'The <strong>gauge pressure</strong> shown on the cylinder is the pressure above atmospheric. To get the true (absolute) pressure, we add standard atmospheric pressure (1.01325 bar).',
        'The temperature in <strong>Celsius</strong> is converted to <strong>Kelvin</strong> by adding 273.15.',
        'The cylinder volume in <strong>liters</strong> is converted to <strong>cubic meters</strong> by dividing by 1000.',
        'The <strong>ideal gas law</strong> (<em>PV = nRT</em>) is then used to calculate the number of moles of nitrogen gas inside the cylinder.',
        'Finally, the number of <strong>moles</strong> is converted to <strong>kilograms</strong> by multiplying by the molar mass of nitrogen (N₂ = 0.0280134 kg/mol).'
      ],
      explanationFormula: 'PV = nRT &nbsp;→&nbsp; n = PV / RT &nbsp;→&nbsp; mass = n × M',

      // Notice
      noticeTitle: 'Important',
      noticeText: 'This calculator provides an <strong>estimated</strong> nitrogen mass based on the entered pressure, cylinder volume, and temperature. It assumes ideal-gas behavior. Actual cylinder contents may differ due to gas compressibility, temperature variation, pressure-gauge accuracy, and cylinder specifications. This is an estimate — not a direct measurement of the cylinder contents.',

      // Footer
      footerLine1: 'Nitrogen Cylinder Calculator',
      footerLine2: 'Uses the ideal gas law (PV = nRT) · For estimation purposes only',
      madeBy: 'Made by Eng. Samer',

      // Validation errors
      errTempEmpty: 'Please enter the ambient temperature.',
      errTempInvalid: 'Temperature must be a valid number.',
      errTempAbsZero: 'Temperature must be above absolute zero (−273.15 °C).',
      errVolEmpty: 'Please enter the cylinder volume.',
      errVolInvalid: 'Cylinder volume must be a valid number.',
      errVolZero: 'Cylinder volume must be greater than zero.',
      errPresEmpty: 'Please enter the gauge pressure.',
      errPresInvalid: 'Gauge pressure must be a valid number.',
      errPresNeg: 'Pressure cannot be negative.',

      // Location modal
      locationModalTitle: 'Enable Location',
      locationModalBody: 'Turn on your location to automatically detect the ambient temperature near you.',
      locationModalAllow: 'Enable Location',
      locationModalDismiss: 'Not now',

      // Theme
      switchToLight: 'Switch to light mode',
      switchToDark: 'Switch to dark mode',
    },

    ar: {
      dir: 'rtl',
      langLabel: '🌐 English',
      langName: 'التبديل إلى الإنجليزية',

      // Header
      appTitle: 'حاسبة أسطوانة النيتروجين',
      appSubtitle: 'تقدير كمية غاز النيتروجين داخل أسطوانة مضغوطة.',

      // Weather
      weatherCardTitle: 'درجة الحرارة المحيطة — الطقس',
      weatherLoading: 'جاري استرجاع درجة الحرارة الحالية…',
      weatherRefresh: '↻ تحديث',
      weatherJustNow: 'الآن',
      weatherUpdated1Min: 'تم التحديث منذ دقيقة',
      weatherUpdatedMins: 'تم التحديث منذ {n} دقائق',
      weatherUpdated1Hr: 'تم التحديث منذ ساعة',
      weatherUpdatedHrs: 'تم التحديث منذ {n} ساعات',
      weatherError: 'تعذر استرجاع درجة الحرارة الحالية.',
      weatherPermDenied: 'تم رفض إذن الموقع. يرجى إدخال درجة الحرارة يدويًا أدناه.',
      weatherSearchCity: '🔍 ابحث عن مدينتك',
      weatherCityPlaceholder: 'اكتب اسم المدينة…',
      weatherNoCities: 'لم يتم العثور على مدن',

      // Input section
      inputTitle: 'معلمات الإدخال',
      tempLabel: 'درجة الحرارة المحيطة',
      tempPlaceholder: 'مثال: 25',
      tempHelper: 'أدخل درجة الحرارة بالقرب من الأسطوانة. يتم ملؤها تلقائيًا من الطقس إن توفر.',
      sourceAuto: 'طقس تلقائي',
      sourceManual: 'إدخال يدوي',
      volumeLabel: 'حجم الأسطوانة',
      volumePlaceholder: 'مثال: 50',
      volumeHelper: 'أدخل السعة المائية المكتوبة على الأسطوانة.',
      pressureLabel: 'ضغط المقياس',
      pressurePlaceholder: 'مثال: 200',
      pressureHelper: 'أدخل الضغط الظاهر حاليًا على مقياس الأسطوانة.',

      // Calculate
      calculateBtn: 'حساب كتلة النيتروجين',

      // Result
      resultLabel: 'النتائج المُقدَّرة للنيتروجين',
      resultMassLabel: 'كتلة الغاز',
      resultVolumeM3Label: 'حجم الغاز (متر مكعب)',
      resultVolumeLitersLabel: 'حجم الغاز (باللتر)',
      resultFreeVolLabel: 'حجم الغاز (1 ضغط جوي)',
      resultGasName: '(N₂) النيتروجين',
      resultGaugeLabel: 'ضغط المقياس',
      resultAbsoluteLabel: 'الضغط المطلق',
      resultTempCLabel: 'درجة الحرارة',
      resultTempKLabel: 'درجة الحرارة',
      resultVolumeLabel: 'حجم الأسطوانة',
      resultMolesLabel: 'كمية الغاز',

      // Explanation
      explanationToggle: 'كيف يتم الحساب؟',
      explanationSteps: [
        '<strong>ضغط المقياس</strong> الظاهر على الأسطوانة هو الضغط فوق الضغط الجوي. للحصول على الضغط الحقيقي (المطلق)، نضيف الضغط الجوي القياسي (1.01325 بار).',
        'يتم تحويل درجة الحرارة من <strong>مئوية</strong> إلى <strong>كلفن</strong> بإضافة 273.15.',
        'يتم تحويل حجم الأسطوانة من <strong>لترات</strong> إلى <strong>أمتار مكعبة</strong> بالقسمة على 1000.',
        'ثم يُستخدم <strong>قانون الغاز المثالي</strong> (<em>PV = nRT</em>) لحساب عدد مولات غاز النيتروجين داخل الأسطوانة.',
        'أخيرًا، يتم تحويل عدد <strong>المولات</strong> إلى <strong>كيلوغرامات</strong> بالضرب في الكتلة المولية للنيتروجين (N₂ = 0.0280134 كجم/مول).'
      ],
      explanationFormula: 'PV = nRT &nbsp;←&nbsp; n = PV / RT &nbsp;←&nbsp; mass = n × M',

      // Notice
      noticeTitle: 'مهم',
      noticeText: 'توفر هذه الحاسبة كتلة نيتروجين <strong>تقديرية</strong> بناءً على الضغط المدخل وحجم الأسطوانة ودرجة الحرارة. تفترض سلوك الغاز المثالي. قد يختلف المحتوى الفعلي للأسطوانة بسبب انضغاطية الغاز وتغير درجة الحرارة ودقة مقياس الضغط ومواصفات الأسطوانة. هذا تقدير — وليس قياسًا مباشرًا لمحتويات الأسطوانة.',

      // Footer
      footerLine1: 'حاسبة أسطوانة النيتروجين',
      footerLine2: 'تستخدم قانون الغاز المثالي (PV = nRT) · لأغراض التقدير فقط',
      madeBy: 'صنع بواسطة المهندس سامر',

      // Validation errors
      errTempEmpty: 'يرجى إدخال درجة الحرارة المحيطة.',
      errTempInvalid: 'يجب أن تكون درجة الحرارة رقمًا صالحًا.',
      errTempAbsZero: 'يجب أن تكون درجة الحرارة أعلى من الصفر المطلق (−273.15 °C).',
      errVolEmpty: 'يرجى إدخال حجم الأسطوانة.',
      errVolInvalid: 'يجب أن يكون حجم الأسطوانة رقمًا صالحًا.',
      errVolZero: 'يجب أن يكون حجم الأسطوانة أكبر من صفر.',
      errPresEmpty: 'يرجى إدخال ضغط المقياس.',
      errPresInvalid: 'يجب أن يكون ضغط المقياس رقمًا صالحًا.',
      errPresNeg: 'لا يمكن أن يكون الضغط سالبًا.',

      // Location modal
      locationModalTitle: 'تفعيل الموقع',
      locationModalBody: 'قم بتشغيل موقعك لاكتشاف درجة الحرارة المحيطة تلقائيًا.',
      locationModalAllow: 'تفعيل الموقع',
      locationModalDismiss: 'ليس الآن',

      // Theme
      switchToLight: 'التبديل إلى الوضع الفاتح',
      switchToDark: 'التبديل إلى الوضع الداكن',
    }
  };

  // ─── State ───────────────────────────────────────────────────────────────────

  let _currentLang = localStorage.getItem('n2calc-lang') || 'ar';
  let _onChangeCallbacks = [];

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Get a translation string by key.
   * Supports {n} placeholder replacement: i18n.t('weatherUpdatedMins', { n: 5 })
   */
  function t(key, params) {
    const lang = translations[_currentLang] || translations.en;
    let val = lang[key];
    if (val === undefined) {
      // Fallback to English
      val = translations.en[key];
    }
    if (val === undefined) return key;

    if (params && typeof val === 'string') {
      Object.keys(params).forEach(k => {
        val = val.replace(`{${k}}`, params[k]);
      });
    }
    return val;
  }

  /** Get current language code */
  function getLang() {
    return _currentLang;
  }

  /** Get text direction for current language */
  function getDir() {
    return (translations[_currentLang] || translations.en).dir;
  }

  /** Get all available languages as { code, label, name } */
  function getLanguages() {
    return Object.keys(translations).map(code => ({
      code,
      label: translations[code].langLabel,
      name: translations[code].langName,
    }));
  }

  /** Switch to a new language */
  function setLang(langCode) {
    if (!translations[langCode]) return;
    _currentLang = langCode;
    localStorage.setItem('n2calc-lang', langCode);

    // Update HTML attributes
    document.documentElement.setAttribute('lang', langCode);
    document.documentElement.setAttribute('dir', getDir());

    // Notify listeners
    _onChangeCallbacks.forEach(cb => cb(langCode));
  }

  /** Register a callback for language changes */
  function onChange(cb) {
    _onChangeCallbacks.push(cb);
  }

  /** Toggle between available languages (for 2-lang setups) */
  function toggle() {
    const codes = Object.keys(translations);
    const idx = codes.indexOf(_currentLang);
    const next = codes[(idx + 1) % codes.length];
    setLang(next);
  }

  // ─── Initialize ──────────────────────────────────────────────────────────────
  // Set initial dir/lang on the HTML element
  document.documentElement.setAttribute('lang', _currentLang);
  document.documentElement.setAttribute('dir', getDir());

  return { t, getLang, getDir, getLanguages, setLang, onChange, toggle };
})();
