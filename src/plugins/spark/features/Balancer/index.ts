import { genericBlockFeature } from '@/plugins/spark/generic';
import { useBlockSpecStore } from '@/plugins/spark/store';
import { BlockSpec } from '@/plugins/spark/types';
import { blockWidgetSelector } from '@/plugins/spark/utils/components';
import { useFeatureStore, WidgetFeature } from '@/store/features';
import { BalancerBlock, BlockType } from 'brewblox-proto/ts';
import { Plugin } from 'vue';
import widget from './BalancerWidget.vue';

const type = BlockType.Balancer;

const plugin: Plugin = {
  install(app) {
    const featureStore = useFeatureStore();
    const specStore = useBlockSpecStore();

    const blockSpec: BlockSpec<BalancerBlock> = {
      type,
      generate: (): BalancerBlock['data'] => ({
        clients: [],
      }),
      analyze: () => 'Active',
    };

    const feature: WidgetFeature = {
      ...genericBlockFeature,
      id: type,
      title: 'Balancer',
      role: 'Constraint',
      component: blockWidgetSelector(app, widget, type),
      widgetSize: {
        cols: 4,
        rows: 2,
      },
    };

    specStore.addBlockSpec(blockSpec);
    featureStore.addWidgetFeature(feature);
  },
};

export default plugin;
