export const salonHours = {
  // 0=Sun ... 6=Sat
  // each day: [startHour, endHour] in 24h
  0: null,          // Sun closed
  1: [10, 19],      // Mon 10:00–19:00
  2: [10, 19],
  3: [10, 19],
  4: [10, 19],
  5: [10, 19],
  6: [10, 17]       // Sat 10:00–17:00
};
export const defaultBufferMin = 0; // change later if you want cleanup time
