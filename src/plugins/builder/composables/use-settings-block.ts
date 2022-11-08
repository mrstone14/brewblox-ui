import { useBlockSpecStore } from '@/plugins/spark/store';
import {
  BlockAddress,
  BlockStatus,
  ComparedBlockType,
} from '@/plugins/spark/types';
import { Block } from 'brewblox-proto/ts';
import { computed, ComputedRef } from 'vue';
import { FlowPart } from '../types';
import { settingsAddress, settingsBlock } from '../utils';

export interface useSettingsBlockComponent<BlockT extends Block> {
  hasAddress: ComputedRef<boolean>;
  address: ComputedRef<BlockAddress>;
  block: ComputedRef<BlockT | null>;
  blockStatus: ComputedRef<BlockStatus | null>;
  isBroken: ComputedRef<boolean>;
}

export interface useSettingsBlockComposable {
  setup<BlockT extends Block>(
    part: FlowPart,
    settingsKey: string,
    intf: ComparedBlockType,
  ): useSettingsBlockComponent<BlockT>;
}

export const useSettingsBlock: useSettingsBlockComposable = {
  setup<BlockT extends Block>(
    part: FlowPart,
    settingsKey: string,
    intf: ComparedBlockType,
  ): useSettingsBlockComponent<BlockT> {
    const specStore = useBlockSpecStore();

    const address = computed<BlockAddress>(() =>
      settingsAddress(part, settingsKey),
    );

    const block = computed<BlockT | null>(() =>
      settingsBlock(part, settingsKey, intf),
    );

    const blockStatus = computed<BlockStatus | null>(() => {
      if (block.value == null) {
        return null;
      }
      const spec = specStore.blockSpecByType(block.value.type);
      return spec?.analyze(block.value) ?? null;
    });

    const hasAddress = computed<boolean>(() => address.value.id !== null);

    const isBroken = computed<boolean>(
      () => block.value === null && hasAddress.value,
    );

    return {
      hasAddress,
      address,
      block,
      blockStatus,
      isBroken,
    };
  },
};
