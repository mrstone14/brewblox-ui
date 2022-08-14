import { genericBlockFeature } from '@/plugins/spark/generic';
import { useBlockSpecStore } from '@/plugins/spark/store';
import { BlockFieldSpec, BlockSpec } from '@/plugins/spark/types';
import { blockWidgetSelector } from '@/plugins/spark/utils/components';
import { prettifyConstraints } from '@/plugins/spark/utils/formatting';
import { useFeatureStore, WidgetFeature } from '@/store/features';
import { bloxLink } from '@/utils/link';
import {
  ActuatorAnalogMockBlock,
  AnalogConstraintsObj,
  BlockType,
} from 'brewblox-proto/ts';
import { Plugin } from 'vue';
import widget from './ActuatorAnalogMockWidget.vue';

const type = BlockType.ActuatorAnalogMock;

const plugin: Plugin = {
  install(app) {
    const specStore = useBlockSpecStore();
    const featureStore = useFeatureStore();

    const blockSpec: BlockSpec<ActuatorAnalogMockBlock> = {
      type,
      generate: (): ActuatorAnalogMockBlock['data'] => ({
        setting: 0,
        desiredSetting: 0,
        minSetting: 0,
        maxSetting: 100,
        value: 0,
        minValue: 0,
        maxValue: 100,
        constrainedBy: { constraints: [] },
        claimedBy: bloxLink(null),
      }),
    };

    const fieldSpecs: BlockFieldSpec<ActuatorAnalogMockBlock>[] = [
      {
        type,
        key: 'desiredSetting',
        title: 'Setting',
        component: 'NumberValEdit',
        valueHint: '0-100',
        generate: () => 0,
        graphed: true,
      },
      {
        type,
        key: 'minSetting',
        title: 'Minimum Setting',
        component: 'NumberValEdit',
        valueHint: '0-100',
        generate: () => 0,
      },
      {
        type,
        key: 'maxSetting',
        title: 'Maximum Setting',
        component: 'NumberValEdit',
        valueHint: '0-100',
        generate: () => 100,
      },
      {
        type,
        key: 'minValue',
        title: 'Minimum Value',
        component: 'NumberValEdit',
        valueHint: '0-100',
        generate: () => 0,
      },
      {
        type,
        key: 'maxValue',
        title: 'Maximum Value',
        component: 'NumberValEdit',
        valueHint: '0-100',
        generate: () => 100,
      },
      {
        type,
        key: 'constrainedBy',
        title: 'Constraints',
        component: 'AnalogConstraintsValEdit',
        generate: (): AnalogConstraintsObj => ({ constraints: [] }),
        pretty: prettifyConstraints,
      },
      {
        type,
        key: 'value',
        title: 'Measured Value',
        component: 'NumberValEdit',
        generate: () => 0,
        valueHint: '0-100',
        readonly: true,
        graphed: true,
      },
    ];

    const feature: WidgetFeature = {
      ...genericBlockFeature,
      id: type,
      title: 'Analog Actuator (Mock)',
      role: 'Output',
      component: blockWidgetSelector(app, widget, type),
      widgetSize: {
        cols: 4,
        rows: 2,
      },
    };

    specStore.addBlockSpec(blockSpec);
    specStore.addFieldSpecs(fieldSpecs);
    featureStore.addWidgetFeature(feature);
  },
};

export default plugin;
