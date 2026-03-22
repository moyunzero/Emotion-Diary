// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const boundaries = require('eslint-plugin-boundaries');

const governanceGateLevel = 'error';

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['app/**/*.{ts,tsx,js,jsx}', 'components/**/*.{ts,tsx,js,jsx}', 'store/**/*.{ts,tsx,js,jsx}', 'utils/**/*.{ts,tsx,js,jsx}', 'hooks/**/*.{ts,tsx,js,jsx}', 'services/**/*.{ts,tsx,js,jsx}', 'lib/**/*.{ts,tsx,js,jsx}', 'features/**/*.{ts,tsx,js,jsx}', 'shared/**/*.{ts,tsx,js,jsx}'],
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
        { type: 'features', pattern: 'features/**' },
        { type: 'shared', pattern: 'shared/**' },
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
            {
              from: ['features'],
              disallow: ['app'],
              message: 'GOV boundary: features 不可依赖 app。',
            },
            {
              from: ['features'],
              disallow: ['features'],
              message: 'GOV boundary: features 之间不可互相引用。',
            },
            {
              from: ['shared'],
              disallow: ['app', 'features', 'components', 'store'],
              message: 'GOV boundary: shared 为纯函数层，不可依赖业务层。',
            },
          ],
        },
      ],
    },
  },
]);
