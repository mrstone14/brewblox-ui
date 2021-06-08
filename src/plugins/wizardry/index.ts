import { Plugin } from 'vue';

import { autoRegister } from '@/utils';

export * from './utils';

const plugin: Plugin = {
  install(app) {
    autoRegister(app, require.context('./components', true));
  },
};

export default plugin;
