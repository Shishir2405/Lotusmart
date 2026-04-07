// Global axios defaults — ensures ALL axios calls (even direct `import axios`)
// include the required custom header for API protection.
// Import this file once in the app entry point (providers.tsx).

import axios from "axios";

axios.defaults.headers.common["X-Requested-With"] = "LotusApp";
