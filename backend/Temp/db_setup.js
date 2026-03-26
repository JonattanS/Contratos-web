const { Pool } = require('pg');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: 'postgres',
  host: '162.248.53.100',
  database: 'iNova',
  password: '2023.N0v4.C0rp',
  port: 5432
});

let log = "";
function p(msg) { log += msg + "\n"; console.log(msg); }

async function getNextId(table) {
  const res = await pool.query(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM ${table}`);
  return res.rows[0].next_id;
}

async function run() {
  try {
    const defaultPassword = await bcrypt.hash('123456', 10);
    p("Using generated hash for new users: " + defaultPassword);

    await pool.query('BEGIN');
    
    // Get the base user details
    const baseUserRes = await pool.query('SELECT * FROM adm_usr WHERE id = 6');
    const u = baseUserRes.rows[0];

    async function cloneUser(newId, usrcod, usrnom, rolid) {
      const row = { ...u, id: newId, usrcod, usrnom, usrpsw: defaultPassword, adm_rolid: rolid };
      const keys = Object.keys(row);
      const vals = keys.map(k => row[k]);
      const placeholders = keys.map((_, i) => '$' + (i+1)).join(',');
      await pool.query(`INSERT INTO adm_usr (${keys.join(',')}) VALUES (${placeholders})`, vals);
    }

    p("1. Creando user1@nov...");
    const checkUsr1 = await pool.query("SELECT id FROM adm_usr WHERE usrcod = 'user1@nov'");
    if (checkUsr1.rows.length === 0) {
       const u1id = await getNextId('adm_usr');
       await cloneUser(u1id, 'user1@nov', 'Usuario Admin', 4);
       p("Insertado user1@nov con id " + u1id);
    } else {
       await pool.query("UPDATE adm_usr SET usrpsw = $1, adm_rolid = 4 WHERE usrcod = 'user1@nov'", [defaultPassword]);
       p("Actualizado user1@nov");
    }

    p("2. Creando nuevo rol para user3@nov...");
    let newRole3Id;
    const resRole5 = await pool.query('SELECT * FROM adm_rol WHERE id = 5');
    if (resRole5.rows.length > 0) {
      const r5 = resRole5.rows[0];
      newRole3Id = await getNextId('adm_rol');
      const rRow = { ...r5, id: newRole3Id, adm_ciaid: 1 };
      const rKeys = Object.keys(rRow);
      const rVals = rKeys.map(k => rRow[k]);
      const rPlaceholders = rKeys.map((_, i) => '$' + (i+1)).join(',');
      await pool.query(`INSERT INTO adm_rol (${rKeys.join(',')}) VALUES (${rPlaceholders})`, rVals);
      p("-> Rol creado con ID " + newRole3Id);
      await pool.query("UPDATE adm_usr SET adm_rolid = $1 WHERE id = 6", [newRole3Id]);
    }

    p("3. Creando nuevo rol y usuario para user2@nov...");
    const realNewRole2Id = await getNextId('adm_rol');
    // For Role 2, clone base role but change specifics
    const r5Base = resRole5.rows[0];
    const r2Row = { ...r5Base, id: realNewRole2Id, adm_ciaid: 1, rolcod: 'usr', roldes: 'Usuario', rolsis: false, estcod: 6 };
    const r2Keys = Object.keys(r2Row);
    const r2Vals = r2Keys.map(k => r2Row[k]);
    const r2Placeholders = r2Keys.map((_, i) => '$' + (i+1)).join(',');
    await pool.query(`INSERT INTO adm_rol (${r2Keys.join(',')}) VALUES (${r2Placeholders})`, r2Vals);

    p("-> Rol creado con ID " + realNewRole2Id + ". Asignando e insertando user2@nov...");
    const checkUsr2 = await pool.query("SELECT id FROM adm_usr WHERE usrcod = 'user2@nov'");
    if (checkUsr2.rows.length === 0) {
      const u2id = await getNextId('adm_usr');
      await cloneUser(u2id, 'user2@nov', 'Usuario Estandar', realNewRole2Id);
      p("Insertado user2@nov");
    } else {
      await pool.query("UPDATE adm_usr SET usrpsw = $1, adm_rolid = $2 WHERE usrcod = 'user2@nov'", [defaultPassword, realNewRole2Id]);
      p("Actualizado user2@nov");
    }

    p("COMMIT...");
    await pool.query('COMMIT');
    p("🚀 Base de datos aprovisionada con éxito.");

  } catch(e) { 
    await pool.query('ROLLBACK');
    p("Error: " + e.message);
  }
  finally { 
    fs.writeFileSync('Temp/setup_log.txt', log, 'utf8');
    pool.end(); 
  }
}
run();
