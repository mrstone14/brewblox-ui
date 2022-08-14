import { genericBlockFeature } from '@/plugins/spark/generic';
import { useBlockSpecStore } from '@/plugins/spark/store';
import { BlockFieldSpec, BlockSpec } from '@/plugins/spark/types';
import { blockWidgetSelector } from '@/plugins/spark/utils/components';
import {
  enumHint,
  prettifyConstraints,
} from '@/plugins/spark/utils/formatting';
import { useFeatureStore, WidgetFeature } from '@/store/features';
import { bloxLink } from '@/utils/link';
import {
  BlockIntfType,
  BlockType,
  DigitalConstraintsObj,
  DigitalState,
  MotorValveBlock,
  ValveState,
} from 'brewblox-proto/ts';
import { Plugin } from 'vue';
import widget from './MotorValveWidget.vue';

const type = BlockType.MotorValve;

const plugin: Plugin = {
  install(app) {
    const specStore = useBlockSpecStore();
    const featureStore = useFeatureStore();

    const blockSpec: BlockSpec<MotorValveBlock> = {
      type,
      generate: (): MotorValveBlock['data'] => ({
        hwDevice: bloxLink(null, BlockIntfType.IoArrayInterface),
        channel: 0,
        desiredState: DigitalState.STATE_INACTIVE,
        state: DigitalState.STATE_INACTIVE,
        valveState: ValveState.VALVE_INIT_IDLE,
        constrainedBy: { constraints: [] },
        claimedBy: bloxLink(null),
      }),
    };

    const fieldSpecs: BlockFieldSpec<MotorValveBlock>[] = [
      {
        type,
        key: 'desiredState',
        title: 'State',
        component: 'StateValEdit',
        generate: () => DigitalState.STATE_INACTIVE,
        valueHint: enumHint(DigitalState),
        graphed: true,
        graphName: 'Desired state',
      },
      {
        type,
        key: 'constrainedBy',
        title: 'Constraints',
        component: 'DigitalConstraintsValEdit',
        generate: (): DigitalConstraintsObj => ({ constraints: [] }),
        pretty: prettifyConstraints,
      },
      {
        type,
        key: 'state',
        title: 'Actual state',
        component: 'StateValEdit',
        generate: () => DigitalState.STATE_INACTIVE,
        valueHint: enumHint(DigitalState),
        readonly: true,
        graphed: true,
      },
    ];

    const feature: WidgetFeature = {
      ...genericBlockFeature,
      id: type,
      title: 'Motor Valve',
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
