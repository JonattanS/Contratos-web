const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({user: 'postgres', host: '162.248.53.100', database: 'iNova', password: '2023.N0v4.C0rp', port: 5432});

async function run() {
  try {
    const res1 = await pool.query("SELECT id, adm_ciaid, usrcod, usrnom, usrpsw, adm_rolid, estcod FROM adm_usr WHERE id = 6 OR usrcod LIKE '%@nov'");
    const res2 = await pool.query('SELECT * FROM adm_rol ORDER BY id ASC');

    const output = `
=== USR ===
${JSON.stringify(res1.rows, null, 2)}

=== ROL ===
${JSON.stringify(res2.rows, null, 2)}
`;
    fs.writeFileSync('Temp/out.json', output, 'utf8');
  } catch(e) { console.error(e); }
  finally { pool.end(); }
}
run();
