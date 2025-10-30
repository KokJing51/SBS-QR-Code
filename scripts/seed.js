import { db } from '../db.js';

const services = [
  { name: 'Haircut', synonyms: ['cut', 'trim', 'hair cut', 'hair trim'] },
  { name: 'Color',   synonyms: ['colour', 'dye', 'highlight', 'full color'] }
];
const staff = [
  { name: 'Aida', aliases: ['Aisha','Ayda'], skills: [1,2] },
  { name: 'Ben',  aliases: ['Benny','Benj'], skills: [1] }
];

for (const s of services) {
  db.prepare(`UPDATE services SET synonyms=? WHERE name=?`).run(JSON.stringify(s.synonyms), s.name);
}
for (const st of staff) {
  db.prepare(`UPDATE staff SET aliases=?, skills=? WHERE name=?`).run(JSON.stringify(st.aliases), JSON.stringify(st.skills), st.name);
}
console.log('Seeded synonyms/aliases/skills');

