import Vue from 'vue';
import Vuex from 'vuex';

import { RootState } from './state';
import dashboards from './dashboards';
import services from './services';
import providers from './providers';
import features from './features';
import history from './history';

Vue.use(Vuex);

const store = new Vuex.Store<RootState>({
  modules: {
    dashboards,
    services,
    providers,
    features,
    history,
  },
});

export default store;
