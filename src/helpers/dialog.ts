import { Dialog, DialogChainObject, QDialogOptions } from 'quasar';
import Vue from 'vue';

import { sparkStore } from '@/plugins/spark/store';
import { BlockAddress } from '@/plugins/spark/types';
import router from '@/router';
import { WidgetMode } from '@/store/features';

export function getNumDialogs(): number {
  return document.getElementsByClassName('q-dialog').length;
}

export function createDialog(opts: QDialogOptions): DialogChainObject {
  const query = router.currentRoute.query ?? {};
  if (!query.dialog) {
    router.push({ query: { ...query, dialog: 'true' } }).catch(() => { });
  }

  return Dialog
    .create({ ...opts, parent: Vue.$app })
    .onDismiss(() => {
      if (router.currentRoute.query?.dialog && !getNumDialogs()) {
        router.back();
      }
    });
}

interface BlockDialogOpts {
  props?: any;
  mode?: WidgetMode;
  verify?: boolean;
}

export function createBlockDialog(addr: BlockAddress | null, opts: BlockDialogOpts = {}): void {
  if (!addr || !addr.id) {
    return;
  }
  if (opts.verify && !sparkStore.blockById(addr.serviceId, addr.id)) {
    return;
  }
  const { props, mode } = opts;
  createDialog({
    component: 'BlockWidgetDialog',
    serviceId: addr.serviceId,
    blockId: addr.id,
    mode,
    getProps: () => props || {},
  });
};
