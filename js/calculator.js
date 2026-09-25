/**
 * Nitrogen Cylinder Calculator - Core Calculation Module
 * 
 * Uses the Ideal Gas Law: PV = nRT
 * Then: mass = n × M
 * 
 * This module is purely computational — no DOM or UI dependencies.
 */

// ─── Physical Constants ────────────────────────────────────────────────────────

/** Universal gas constant in J/(mol·K) */
const R = 8.314462618;

/** Molar mass of molecular nitrogen N₂ in kg/mol */
const M_N2 = 0.0280134;

/** Standard atmospheric pressure in bar */
const ATM_BAR = 1.01325;

/** Conversion factor: 1 bar = 100,000 Pa */
const BAR_TO_PA = 100000;

/** Conversion factor: 1 L = 0.001 m³ */
const L_TO_M3 = 0.001;

/** Absolute zero in Celsius */
const ABSOLUTE_ZERO_C = -273.15;


// ─── Conversion Helpers ────────────────────────────────────────────────────────

/**
 * Convert gauge pressure (bar) to absolute pressure (bar).
 * Absolute = Gauge + Atmospheric.
 * @param {number} gaugePressureBar
 * @returns {number} absolute pressure in bar
 */
function gaugeToAbsoluteBar(gaugePressureBar) {
  return gaugePressureBar + ATM_BAR;
}

/**
 * Convert bar to Pascal.
 * @param {number} pressureBar
 * @returns {number} pressure in Pa
 */
function barToPascal(pressureBar) {
  return pressureBar * BAR_TO_PA;
}

/**
 * Convert Celsius to Kelvin.
 * @param {number} temperatureC
 * @returns {number} temperature in Kelvin
 */
function celsiusToKelvin(temperatureC) {
  return temperatureC + 273.15;
}

/**
 * Convert liters to cubic meters.
 * @param {number} volumeLiters
 * @returns {number} volume in m³
 */
function litersToM3(volumeLiters) {
  return volumeLiters * L_TO_M3;
}


// ─── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate all inputs and return an array of error messages.
 * Returns an empty array if all inputs are valid.
 * @param {number|any} temperatureC
 * @param {number|any} volumeLiters
 * @param {number|any} gaugePressureBar
 * @returns {{ valid: boolean, errors: { field: string, message: string }[] }}
 */
function validateInputs(temperatureC, volumeLiters, gaugePressureBar) {
  const errors = [];

  // Temperature checks
  if (temperatureC === '' || temperatureC === null || temperatureC === undefined) {
    errors.push({ field: 'temperature', message: 'Please enter the ambient temperature.' });
  } else if (isNaN(Number(temperatureC)) || !isFinite(Number(temperatureC))) {
    errors.push({ field: 'temperature', message: 'Temperature must be a valid number.' });
  } else if (Number(temperatureC) <= ABSOLUTE_ZERO_C) {
    errors.push({ field: 'temperature', message: 'Temperature must be above absolute zero (−273.15 °C).' });
  }

  // Volume checks
  if (volumeLiters === '' || volumeLiters === null || volumeLiters === undefined) {
    errors.push({ field: 'volume', message: 'Please enter the cylinder volume.' });
  } else if (isNaN(Number(volumeLiters)) || !isFinite(Number(volumeLiters))) {
    errors.push({ field: 'volume', message: 'Cylinder volume must be a valid number.' });
  } else if (Number(volumeLiters) <= 0) {
    errors.push({ field: 'volume', message: 'Cylinder volume must be greater than zero.' });
  }

  // Pressure checks
  if (gaugePressureBar === '' || gaugePressureBar === null || gaugePressureBar === undefined) {
    errors.push({ field: 'pressure', message: 'Please enter the gauge pressure.' });
  } else if (isNaN(Number(gaugePressureBar)) || !isFinite(Number(gaugePressureBar))) {
    errors.push({ field: 'pressure', message: 'Gauge pressure must be a valid number.' });
  } else if (Number(gaugePressureBar) < 0) {
    errors.push({ field: 'pressure', message: 'Pressure cannot be negative.' });
  }

  return { valid: errors.length === 0, errors };
}


// ─── Main Calculation ──────────────────────────────────────────────────────────

/**
 * Calculate the estimated mass of nitrogen gas (N₂) in a pressurized cylinder.
 *
 * Steps:
 *   1. Convert gauge pressure → absolute pressure (add atmospheric)
 *   2. Convert bar → Pascal
 *   3. Convert °C → Kelvin
 *   4. Convert liters → m³
 *   5. Apply ideal gas law  n = PV / RT
 *   6. Compute mass  m = n × M(N₂)
 *
 * @param {number} temperatureC      – Ambient / gas temperature in °C
 * @param {number} volumeLiters      – Cylinder water capacity in liters
 * @param {number} gaugePressureBar  – Gauge pressure reading in bar
 * @returns {{
 *   massKg: number,
 *   absolutePressureBar: number,
 *   absolutePressurePa: number,
 *   temperatureKelvin: number,
 *   volumeM3: number,
 *   moles: number,
 *   gaugePressureBar: number,
 *   temperatureC: number,
 *   volumeLiters: number
 * }}
 */
function calculateNitrogenMass(temperatureC, volumeLiters, gaugePressureBar) {
  // Step 1 – Gauge → Absolute pressure (bar)
  const absolutePressureBar = gaugeToAbsoluteBar(gaugePressureBar);

  // Step 2 – bar → Pascal
  const absolutePressurePa = barToPascal(absolutePressureBar);

  // Step 3 – °C → Kelvin
  const temperatureKelvin = celsiusToKelvin(temperatureC);

  // Step 4 – Liters → m³
  const volumeM3 = litersToM3(volumeLiters);

  // Step 5 – Ideal gas law: n = PV / (RT)
  const moles = (absolutePressurePa * volumeM3) / (R * temperatureKelvin);

  // Step 6 – Mass: m = n × M(N₂)
  const massKg = moles * M_N2;

  // Step 7 – Free Gas Volume at 1 atm (1.01325 bar) in m³: V_free = V_cylinder * (P_abs / P_atm)
  const freeGasVolumeM3 = (volumeM3 * absolutePressureBar) / ATM_BAR;

  // Guard against impossible results
  if (!isFinite(massKg) || isNaN(massKg)) {
    throw new Error('Calculation produced an invalid result. Please check your inputs.');
  }

  return {
    massKg: Math.round(massKg * 100) / 100,          // 2 decimal places
    freeGasVolumeM3: Math.round(freeGasVolumeM3 * 100) / 100, // 2 decimal places in m³
    absolutePressureBar: Math.round(absolutePressureBar * 1000) / 1000,
    absolutePressurePa,
    temperatureKelvin: Math.round(temperatureKelvin * 100) / 100,
    volumeM3: Math.round(volumeM3 * 10000) / 10000,
    moles: Math.round(moles * 10) / 10,
    gaugePressureBar,
    temperatureC,
    volumeLiters
  };
}
