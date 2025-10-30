import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TZ = process.env.TZ || "Asia/Kuala_Lumpur";
try {
  dayjs.tz.setDefault(DEFAULT_TZ);
} catch {
  // ignore if tz data missing; dayjs will still work in local time
}

export default dayjs;

