export const services = [
  { id: 1, name: "Haircut", duration_min: 30 },
  { id: 2, name: "Color",   duration_min: 60 }
];

export const staff = [
  { id: 1, name: "Aida", active: true },
  { id: 2, name: "Ben",  active: true }
];

export const bookings = []; // { id, phone, staff_id, service_id, start_dt, end_dt, status }
let _id = 1;
export const nextId = () => _id++;
