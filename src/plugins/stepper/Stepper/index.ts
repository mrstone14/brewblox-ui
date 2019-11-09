import { ref } from '@/helpers/component-ref';
import { Feature } from '@/store/features';

import { StepperConfig } from '../types';
import widget from './StepperWidget.vue';


const feature: Feature = {
  id: 'Stepper',
  displayName: 'Stepper',
  widgetComponent: ref(widget),
  widgetSize: {
    cols: 4,
    rows: 2,
  },
  generateConfig: (): StepperConfig => ({}),
};

export default { feature };
