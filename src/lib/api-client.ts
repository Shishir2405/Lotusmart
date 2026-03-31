

import axios from "axios";
import { getDeviceId } from "@/utils/device-id";

const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const deviceId = getDeviceId();
    if (deviceId) {
      config.headers["x-device-id"] = deviceId;
    }
  }
  return config;
});

export default apiClient;
