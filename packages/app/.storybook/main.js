const path = require('path');

module.exports = {
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    {
      name: "@storybook/addon-postcss",
      options: {
        postcssLoaderOptions: {
          implementation: require("postcss")
        }
      }
    }
  ],
  "framework": "@storybook/vue3",
  "core": {
    "builder": "webpack5"
  },
  webpackFinal: async (config, { configType }) => {

    config.module.rules.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader', 'postcss-loader',],
      include: path.resolve(__dirname, '../'),
    });
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, "../src"),
    };

    return config;
  },
}
