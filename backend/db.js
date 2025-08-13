const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',        
  host: '162.248.53.100',       
  database: 'iNova',        
  password: '2023.N0v4.C0rp', 
  port: 5432,              
});

module.exports = pool;
