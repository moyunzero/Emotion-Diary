/**
 * Wave 0 RED — home weather narrative (FLOW-01 / D-25 D-26)
 * WeatherStation has no emotion-index label/score row; home path must not
 * mount forecast section. Source-scan; GREEN in later home chrome plan.
 */

import fs from 'fs';
import path from 'path';

const weatherStationSource = fs.readFileSync(
  path.join(__dirname, '../../../../components/WeatherStation.tsx'),
  'utf8',
);
const dashboardSource = fs.readFileSync(
  path.join(__dirname, '../../../../components/Dashboard.tsx'),
  'utf8',
);

describe('noEmotionIndex — WeatherStation (FLOW-01 / D-25)', () => {
  it('has no emotion-index label or score row', () => {
    expect(weatherStationSource).not.toMatch(/weatherStation\.emotionIndex/);
    expect(weatherStationSource).not.toMatch(/\bweather\.score\b/);
    expect(weatherStationSource).not.toMatch(/emotionIndex/);
  });
});

describe('noEmotionIndex — home forecast removed (FLOW-01 / D-26)', () => {
  it('WeatherStation does not mount emotion forecast section', () => {
    expect(weatherStationSource).not.toMatch(/forecastContainer/);
    expect(weatherStationSource).not.toMatch(/weatherStation\.forecast/);
    expect(weatherStationSource).not.toMatch(/generateForecast/);
  });

  it('Dashboard home path does not mount a forecast section beside WeatherStation', () => {
    expect(dashboardSource).not.toMatch(/forecastContainer|EmotionForecast|generateForecast/);
    // Home still mounts WeatherStation (narrative card only after GREEN)
    expect(dashboardSource).toMatch(/<WeatherStation\s*\/>/);
  });
});
