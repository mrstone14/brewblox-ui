<script setup lang="ts">
import { reactive } from 'vue';
import { UseTaskEmits, UseTaskProps } from '../composables';
import { GpioChange } from '../types';
import { HermsConfig } from './types';

const props = defineProps<UseTaskProps<HermsConfig>>();

const emit = defineEmits<UseTaskEmits<HermsConfig>>();

const changedGpio = reactive<GpioChange[]>(props.config.changedGpio);

function taskDone(): void {
  emit('update:config', { ...props.config, changedGpio });
  emit('next');
}
</script>

<template>
  <QuickstartCard>
    <q-card-section>
      <q-item class="text-weight-light">
        <q-item-section>
          <q-item-label class="text-subtitle1"> Output channels </q-item-label>
        </q-item-section>
      </q-item>
      <q-item class="text-weight-light">
        <q-item-section>
          <p>These are your selected output channels.</p>
          <p v-if="changedGpio.length">
            To assign a GPIO channel to pins, click the channel, and then click
            on the left-most pin you want to use. <br />
            If you are not using an SSR for an actuator, click the
            <b>Edit Channel</b> button to change the device type.
          </p>
          <LabeledField label="HLT output">
            <i>{{ config.hltChannel.blockId }}</i>
            {{ config.hltChannel.name }}
          </LabeledField>
          <LabeledField label="BK output">
            <i>{{ config.bkChannel.blockId }}</i>
            {{ config.bkChannel.name }}
          </LabeledField>
        </q-item-section>
      </q-item>
    </q-card-section>
    <q-card-section
      v-for="change in changedGpio"
      :key="`gpio-${change.blockId}`"
    >
      <div class="text-subtitle1">
        Position {{ change.modulePosition }}: GPIO Module {{ change.blockId }}
      </div>
      <GpioArrayEditor v-model:channels="change.channels" />
    </q-card-section>
    <template #actions>
      <q-btn
        unelevated
        label="Back"
        @click="$emit('back')"
      />
      <q-space />
      <q-btn
        unelevated
        label="Next"
        color="primary"
        @click="taskDone"
      />
    </template>
  </QuickstartCard>
</template>
