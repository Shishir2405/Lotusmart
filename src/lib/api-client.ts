

import axios from "axios";
import { getDeviceId } from "@/utils/device-id";
import "@/lib/axios-globals";

const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
  // Custom header required by API middleware — prevents direct URL access
  config.headers["X-Requested-With"] = "LotusApp";

  if (typeof window !== "undefined") {
    const deviceId = getDeviceId();
    if (deviceId) {
      config.headers["x-device-id"] = deviceId;
    }
  }
  return config;
});

export default apiClient;
