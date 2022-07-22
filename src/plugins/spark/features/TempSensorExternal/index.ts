import { Plugin } from 'vue';

import { genericBlockFeature } from '@/plugins/spark/generic';
import { useBlockSpecStore } from '@/plugins/spark/store';
import {
  BlockFieldSpec,
  BlockSpec,
  BlockType,
  TempSensorExternalBlock,
} from '@/plugins/spark/types';
import { blockWidgetSelector } from '@/plugins/spark/utils/components';
import { WidgetFeature, useFeatureStore } from '@/store/features';
import { bloxQty, durationString, tempQty } from '@/utils/quantity';

import widget from './TempSensorExternalWidget.vue';

const type = BlockType.TempSensorExternal;

const plugin: Plugin = {
  install(app) {
    const specStore = useBlockSpecStore();
    const featureStore = useFeatureStore();

    const blockSpec: BlockSpec<TempSensorExternalBlock> = {
      type,
      generate: () => ({
        enabled: true,
        timeout: bloxQty('5m'),
        setting: tempQty(20),
        lastUpdated: null,
        value: tempQty(null),
      }),
    };

    const fieldSpecs: BlockFieldSpec<TempSensorExternalBlock>[] = [
      {
        type,
        key: 'enabled',
        title: 'Enabled',
        component: 'BoolValEdit',
        generate: () => true,
      },
      {
        type,
        key: 'timeout',
        title: 'Timeout',
        component: 'DurationValEdit',
        generate: () => bloxQty('5m'),
        pretty: durationString,
      },
      {
        type,
        key: 'setting',
        title: 'Sensor Setting',
        component: 'QuantityValEdit',
        generate: () => tempQty(20),
      },
    ];

    const feature: WidgetFeature = {
      ...genericBlockFeature,
      id: type,
      title: 'Temp Sensor (External)',
      role: 'Process',
      component: blockWidgetSelector(app, widget, type),
      widgetSize: {
        cols: 4,
        rows: 3,
      },
    };

    specStore.addBlockSpec(blockSpec);
    specStore.addFieldSpecs(fieldSpecs);
    featureStore.addWidgetFeature(feature);
  },
};

export default plugin;
