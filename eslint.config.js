// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const boundaries = require('eslint-plugin-boundaries');

const governanceGateLevel =
  process.env.GOV_BOUNDARIES_LEVEL === 'error' ? 'error' : 'warn';

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['app/**/*.{ts,tsx,js,jsx}', 'components/**/*.{ts,tsx,js,jsx}', 'store/**/*.{ts,tsx,js,jsx}', 'utils/**/*.{ts,tsx,js,jsx}', 'hooks/**/*.{ts,tsx,js,jsx}', 'services/**/*.{ts,tsx,js,jsx}', 'lib/**/*.{ts,tsx,js,jsx}'],
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'app/**' },
        { type: 'components', pattern: 'components/**' },
        { type: 'store', pattern: 'store/**' },
        { type: 'utils', pattern: 'utils/**' },
        { type: 'hooks', pattern: 'hooks/**' },
        { type: 'services', pattern: 'services/**' },
        { type: 'lib', pattern: 'lib/**' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        governanceGateLevel,
        {
          default: 'allow',
          rules: [
            {
              from: ['store', 'components'],
              disallow: ['app'],
              message:
                'GOV-02 boundary: store/components 不能依赖路由层 app（先 warn，满足升级条件后可切到 error）。',
            },
          ],
        },
      ],
    },
  },
]);
