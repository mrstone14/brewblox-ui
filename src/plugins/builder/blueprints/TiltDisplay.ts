import { BuilderBlueprint } from '@/plugins/builder/types';
import {
  universalTransitions,
  variableSizeFunc,
} from '@/plugins/builder/utils';
import { useTiltStore } from '@/plugins/tilt/store';
import { FLOW_TOGGLE_KEY, SIZE_X_KEY, SIZE_Y_KEY } from '../const';

export const DEFAULT_SIZE_X = 2;
export const DEFAULT_SIZE_Y = 1;
export const TILT_ID_KEY = 'tiltId';

const size = variableSizeFunc(DEFAULT_SIZE_X, DEFAULT_SIZE_Y);

const blueprint: BuilderBlueprint = {
  type: 'TiltDisplay',
  title: 'Display: Tilt',
  cards: [
    {
      component: 'SelectCard',
      props: {
        label: 'Tilt',
        settingsKey: TILT_ID_KEY,
        opts: (): SelectOption<string>[] =>
          useTiltStore().values.map((v) => ({ label: v.name, value: v.id })),
        clearable: true,
      },
    },
    {
      component: 'SizeCard',
      props: {
        settingsKey: SIZE_X_KEY,
        defaultSize: DEFAULT_SIZE_X,
        label: 'Width',
        min: 1,
        max: 10,
      },
    },
    {
      component: 'SizeCard',
      props: {
        settingsKey: SIZE_Y_KEY,
        defaultSize: DEFAULT_SIZE_Y,
        label: 'Height',
        min: 1,
        max: 5,
      },
    },
    {
      component: 'ToggleCard',
      props: {
        settingsKey: FLOW_TOGGLE_KEY,
        label: 'Allow liquid to flow through this part',
      },
    },
    {
      component: 'BorderCard',
    },
  ],
  size,
  transitions: (part) =>
    universalTransitions(size(part), part.settings[FLOW_TOGGLE_KEY]),
};

export default blueprint;
