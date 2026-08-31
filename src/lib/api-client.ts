

import axios from "axios";
import { getDeviceId } from "@/utils/device-id";
import "@/lib/axios-globals";

const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
  // Custom header required by API middleware — prevents direct URL access.
  // Must be "LotusWeb" (see axios-globals.ts) so /lib/channel.ts doesn't
  // mistake website requests for the mobile app's.
  config.headers["X-Requested-With"] = "LotusWeb";

  if (typeof window !== "undefined") {
    const deviceId = getDeviceId();
    if (deviceId) {
      config.headers["x-device-id"] = deviceId;
    }
  }
  return config;
});

export default apiClient;
