// Global axios defaults — ensures ALL axios calls (even direct `import axios`)
// include the required custom header for API protection.
// Import this file once in the app entry point (providers.tsx).
//
// Value must be "LotusWeb", not "LotusApp" — src/lib/channel.ts on the API
// side tells the website and mobile app apart by this exact header value
// ("LotusApp" = the Lotusmart-app mobile client, anything else = website),
// which is how it decides whether to filter products by showOnApp or
// showOnWebsite. Sending "LotusApp" from here would make every website
// request look like it came from the app.

import axios from "axios";

axios.defaults.headers.common["X-Requested-With"] = "LotusWeb";
