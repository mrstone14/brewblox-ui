<script setup lang="ts">
import { QTreeNode } from 'quasar';
import { createDialog } from '@/utils/dialog';
import { DEFAULT_GRAPH_DECIMALS } from '../const';
import { GraphConfig } from '../types';

interface Props {
  config: GraphConfig;
  noPeriod?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  noPeriod: false,
});

const emit = defineEmits<{
  'update:config': [payload: GraphConfig];
}>();

function saveConfig(config: GraphConfig): void {
  emit('update:config', config);
}

function editLeaf(node: QTreeNode): void {
  createDialog({
    component: 'GraphDisplayDialog',
    componentProps: {
      config: props.config,
      field: node.value,
      title: node.value,
    },
  }).onOk((config) => saveConfig(config));
}
</script>

<template>
  <QueryEditor
    :config="config"
    @update:config="saveConfig"
  >
    <template #settings>
      <GraphPeriodEditor
        v-if="!noPeriod"
        :config="config"
        @update:config="saveConfig"
      />
    </template>
    <template #leaf="{ node }">
      <div @click="editLeaf(node)">
        {{ node.label }}
        <q-tooltip class="q-gutter-y-sm">
          <i>Click to edit</i>
          <LabeledField
            :model-value="config.renames[node.value] || node.title"
            label="Label"
            dense
          />
          <LabeledField
            :model-value="
              config.precision[node.value] || DEFAULT_GRAPH_DECIMALS
            "
            label="Decimals in label"
            dense
          />
          <ColorField
            :model-value="config.colors[node.value] || ''"
            label="Color"
            null-text="automatic"
            readonly
            dense
          />
          <LabeledField
            :model-value="config.axes[node.value] === 'y2' ? 'Y2' : 'Y1'"
            label="Axis"
            dense
          />
          <LabeledField
            :model-value="config.min ? config.min[node.value] || null : null"
            label="Hide below"
            dense
          />
          <LabeledField
            :model-value="config.max ? config.max[node.value] || null : null"
            label="Hide Above"
            dense
          />
        </q-tooltip>
      </div>
    </template>
  </QueryEditor>
</template>
