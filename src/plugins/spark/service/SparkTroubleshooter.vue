<script setup lang="ts">
import { SparkStatusDescription } from 'brewblox-proto/ts';
import pluralize from 'pluralize';
import { computed, inject, provide, reactive, ref, watch } from 'vue';
import { useSparkStore } from '@/plugins/spark/store';
import {
  fetchKnownMdnsDevices,
  fetchKnownUsbDevices,
} from '@/plugins/spark/store/spark-api';
import { SparkUsbDevices } from '@/plugins/spark/types';
import { WidgetContext } from '@/store/features';
import { ContextKey, NowKey } from '@/symbols';
import { createDialog } from '@/utils/dialog';
import { shortDateString } from '@/utils/quantity';

type ConnectStatus = SparkStatusDescription['connection_status'];

type ConnectionStep = 'UNREACHABLE' | ConnectStatus;

interface Props {
  serviceId: string;
}

const props = defineProps<Props>();

const stepOrder: ConnectionStep[] = [
  'UNREACHABLE',
  'DISCONNECTED',
  'CONNECTED',
  'ACKNOWLEDGED',
  'SYNCHRONIZED',
  'UPDATING',
];

provide(
  ContextKey,
  reactive<WidgetContext>({
    container: 'Dashboard',
    size: 'Content',
    mode: 'Basic',
  }),
);

const sparkStore = useSparkStore();
const now = inject(NowKey)!;

const mDNSDevices = ref<string[] | null>(null);
const usbDevices = ref<SparkUsbDevices | null>(null);

const status = computed<SparkStatusDescription | null>(() =>
  sparkStore.statusByService(props.serviceId),
);

const lastStatusAt = computed<Date | null>(() =>
  sparkStore.lastStatusAtByService(props.serviceId),
);

const connectionStep = computed<ConnectionStep>(() => {
  if (!status.value) {
    return 'UNREACHABLE';
  }
  return status.value.connection_status;
});

const desiredDeviceId = computed<string | null>(
  () => status.value?.service.device.device_id ?? null,
);

const discoveryKindDesc = computed<string>(() => {
  const kind = status.value?.['discovery_kind'];
  switch (kind) {
    case undefined:
      return 'Unknown';
    case 'ADDRESS':
      return 'Fixed IP address';
    case 'SIM':
      return 'Simulator';
    case 'MDNS':
      return 'mDNS';
    case 'ALL':
      return 'USB, mDNS, and MQTT';
    default:
      return kind;
  }
});

// The Spark 4 does not support USB, and has a device ID of 12 (hex MAC address)
// If there is no desired device ID, we assume USB may be supported.
const usbSupported = computed<boolean>(
  () => desiredDeviceId.value?.length != 12,
);

function isStepDone(step: ConnectionStep): boolean {
  return stepOrder.indexOf(step) < stepOrder.indexOf(connectionStep.value);
}

async function refresh(): Promise<void> {
  await sparkStore.fetchAll(props.serviceId);
}

async function setEnabled(enabled: boolean): Promise<void> {
  await sparkStore.saveEnabled(props.serviceId, enabled);
  await refresh();
}

function startFirmwareUpdate(): void {
  createDialog({
    component: 'FirmwareUpdateDialog',
    componentProps: {
      serviceId: props.serviceId,
    },
  });
}

function serviceReboot(): void {
  sparkStore.serviceReboot(props.serviceId);
}

watch(
  () => now.value,
  async () => {
    if (
      connectionStep.value != 'UNREACHABLE' &&
      usbSupported.value &&
      status.value?.enabled !== false
    ) {
      usbDevices.value = await fetchKnownUsbDevices(props.serviceId);
      mDNSDevices.value = await fetchKnownMdnsDevices(props.serviceId);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Card style="max-width: 500px">
    <template #toolbar>
      <Toolbar
        :title="serviceId"
        subtitle="Troubleshooter"
      >
        <template #buttons>
          <q-btn
            flat
            dense
            icon="refresh"
            @click="refresh"
          />
        </template>
      </Toolbar>
    </template>

    <div class="widget-body">
      <div class="row">
        <q-spinner
          size="24px"
          class="col-auto self-center"
        />
        <LabeledField
          label="Last update"
          tag="big"
          class="col-grow"
        >
          {{ shortDateString(lastStatusAt) }}
        </LabeledField>
      </div>
      <q-stepper
        v-model="connectionStep"
        vertical
        flat
        done-color="positive"
        done-icon="mdi-check"
        active-icon="mdi-dots-horizontal"
        style="background-color: transparent"
      >
        <q-step
          :done="isStepDone('UNREACHABLE')"
          name="UNREACHABLE"
          title="Connect to the service"
        >
          Your Spark service is offline.
          <ul>
            <li>Is your backend reachable?</li>
            <li>Is the service present in your docker-compose file?</li>
            <li>Is the service running?</li>
          </ul>
        </q-step>
        <q-step
          :done="isStepDone('DISCONNECTED')"
          name="DISCONNECTED"
          title="Connect to the controller"
        >
          <template v-if="status">
            <template v-if="status.enabled">
              Your Spark service is online, but not connected to your
              controller. The service discovers controllers using
              <b>{{ discoveryKindDesc }} </b>, and the desired device ID is
              <b>{{ desiredDeviceId || 'any' }}</b>
              .

              <ul>
                <li>Is your controller turned on?</li>
                <li>Are there any error messages in your service logs?</li>
                <li>Does your controller display its IP address?</li>
                <template v-if="mDNSDevices == null">
                  <li>Checking mDNS devices...</li>
                </template>
                <template v-else>
                  <li>
                    Detected
                    {{ pluralize('controller', mDNSDevices.length, true) }}
                    using mDNS
                    <ul>
                      <li
                        v-for="dev in mDNSDevices"
                        :key="dev"
                      >
                        {{ dev }}
                      </li>
                    </ul>
                  </li>
                </template>
                <template v-if="usbSupported">
                  <template v-if="usbDevices == null">
                    <li>Checking USB devices...</li>
                  </template>
                  <template v-else-if="usbDevices.enabled">
                    <li>
                      Detected
                      {{
                        pluralize('controller', usbDevices.devices.length, true)
                      }}
                      using USB
                      <ul>
                        <li
                          v-for="dev in usbDevices.devices"
                          :key="dev"
                        >
                          {{ dev }}
                        </li>
                      </ul>
                    </li>
                  </template>
                  <template v-else>
                    <li>USB: The USB proxy is not enabled in brewblox.yml.</li>
                  </template>
                </template>
              </ul>
            </template>
            <template v-else>
              Your Spark service is paused, and not automatically connecting to
              your controller.<br />
              This status can be toggled manually.
            </template>
          </template>
        </q-step>
        <q-step
          :done="isStepDone('CONNECTED')"
          name="CONNECTED"
          title="Wait for controller handshake"
        >
          Your Spark service is waiting for the controller handshake.
          <br />
          <b>This status is usually temporary</b>
          <br />
          <br />
          If your Spark is showing a blank screen, you may need to flash the
          bootloader.
          <br />
          To do so, run
          <span class="monospace">
            brewblox-ctl particle -c flash-bootloader
          </span>
        </q-step>
        <q-step
          v-if="status?.firmware_error === 'INCOMPATIBLE'"
          active-icon="close"
          active-color="negative"
          name="ACKNOWLEDGED"
          title="Incompatible firmware"
        >
          <div>
            A firmware update is required before the service can communicate
            with the controller.
          </div>
          <q-btn
            unelevated
            color="primary"
            label="update"
            class="q-mt-md"
            @click="startFirmwareUpdate"
          />
        </q-step>
        <q-step
          v-else-if="status?.identity_error === 'INCOMPATIBLE'"
          active-icon="close"
          active-color="negative"
          name="ACKNOWLEDGED"
          title="Invalid device ID"
        >
          The controller device ID does not match the desired device ID. Please
          check your connection settings.
        </q-step>
        <q-step
          v-else
          :done="isStepDone('ACKNOWLEDGED')"
          name="ACKNOWLEDGED"
          title="Validate controller handshake"
        >
          Your Spark service is connected to your controller, but not yet
          synchronized.
          <br />
          <b>This status is usually temporary.</b>
        </q-step>
        <q-step
          v-if="connectionStep === 'UPDATING'"
          name="UPDATING"
          title="Controller update"
        >
          Your Spark is being updated. It will reboot automatically when the
          update is done.
        </q-step>
      </q-stepper>

      <div
        v-if="status"
        class="row q-gutter-sm justify-between"
      >
        <ToggleButton
          flat
          :model-value="status.enabled"
          label="Enabled"
          color="secondary"
          @update:model-value="setEnabled"
        />
        <q-btn
          flat
          label="Reboot service"
          color="secondary"
          icon="mdi-reload"
          @click="serviceReboot"
        />
      </div>
    </div>
  </Card>
</template>
