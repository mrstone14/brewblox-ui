export const HOSTNAME = __BREWBLOX_API_HOST || window.location.hostname;
export const PROTOCOL =
  __BREWBLOX_API_PROTOCOL || window.location.protocol.replace(':', '');
export const WS_PROTOCOL = PROTOCOL === 'https' ? 'wss' : 'ws';

export const PORT =
  Number(__BREWBLOX_API_PORT) ||
  Number(window.location.port) ||
  (PROTOCOL === 'https' ? 443 : 80);

export const HOST = `${PROTOCOL}://${HOSTNAME}:${PORT}`;
export const WS_HOST = `${WS_PROTOCOL}://${HOSTNAME}:${PORT}`;

export const STATE_TOPIC = 'brewcast/state';
export const STORE_TOPIC = 'brewcast/datastore';
export const DEVICE_TOPIC = 'brewcast/device';

export const UI_NAMESPACE = 'brewblox-ui-store';
export const GLOBAL_NAMESPACE = 'brewblox-global';

export const DASHBOARD_NAMESPACE = `${UI_NAMESPACE}:dashboards`;
export const SERVICE_NAMESPACE = `${UI_NAMESPACE}:services`;
export const SYSTEM_NAMESPACE = `${UI_NAMESPACE}:system-config`;
export const WIDGET_NAMESPACE = `${UI_NAMESPACE}:dashboard-items`;
export const SIDEBAR_NAMESPACE = `${UI_NAMESPACE}:sidebar`;

export const LAYOUT_NAMESPACE = `${UI_NAMESPACE}:layouts`;
export const SESSION_NAMESPACE = `${UI_NAMESPACE}:logged-sessions`;
export const SPARK_SNIPPET_NAMESPACE = `${UI_NAMESPACE}:spark-presets`;

export const IS_IOS =
  import.meta.env.MODE !== 'test'
    ? /iPad|iPhone|iPod/.test(navigator.platform) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    : false;
