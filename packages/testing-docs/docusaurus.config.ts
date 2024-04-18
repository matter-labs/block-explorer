import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Block Explorer',
  tagline: '',
  favicon: 'img/logo_black_zk.png',

  // Set the production url of your site here
  url: 'https://be-test-docs.zksync.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'matter-labs', // Usually your GitHub org/user name.
  projectName: 'be-test-docs', // Usually your repo name.
  deploymentBranch: 'main',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // routeBasePath: '/', // Set this value to '/'.
          // homePageId: 'BE Tests', // Set to existing document id.
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Block Explorer',
      logo: {
        alt: 'Block Explorer',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Tests',
        },
      ],
    },
    footer: {
      logo: {
        alt: 'zkSync Logo',
        src: 'img/logo_footer.svg',
        href: 'https://zksync.io/',
        width: 120,
        height: 30,
      },
      style: 'dark',
      links: [
        {
          title: 'zkSync Links',
          items: [
            {
              label: 'ZK Credo',
              href: 'https://github.com/zksync/credo',
            },
            {
              label: 'Ecosystem',
              href: 'https://zksync.dappradar.com/',
            },
            {
              label: 'Terms of Service',
              href: 'https://zksync.io/terms',
            },
          ],
        },
        {
          title: 'ZK Project Links',
          items: [
            {
              label: 'Block Explorer',
              href: 'https://sepolia.explorer.zksync.io/',
            },
            {
              label: 'Bridges & Wallets',
              href: 'https://zksync.io/explore#bridges',
            },
            {
              label: 'Github Discussions',
              href: 'https://github.com/zkSync-Community-Hub/zksync-developers/discussions',
            },
          ],
        },
        {
          title: 'Current project link',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/matter-labs/block-explorer',
            },
          ],
        },
        {
          title: 'Contact Links',
          items: [
            {
              label: 'Twitter',
              href: 'https://twitter.com/zksync',
            },
            {
              label: 'Discord',
              href: 'https://join.zksync.dev/',
            },

          ],
        },
      ],
       //copyright: `Made with ❤️ by Matter Labs`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
