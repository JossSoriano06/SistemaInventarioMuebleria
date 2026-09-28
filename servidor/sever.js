const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middlewares
app.use(bodyParser.json());

const allowedOrigins = [
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

let db;

(async () => {
  try {

    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '061105',
      database: 'bd_muebles',
      port: 3306,
    });

    console.log('Conexión a la base de datos exitosa.');

    const productoRoutes = require('./routes/Productos')(db);
    app.use('/api/productos', productoRoutes);

    const clientesRoutes = require('./routes/Clientes')(db);
    app.use('/api/clientes', clientesRoutes);

    app.get('/', (req, res) => {
      res.send('API de Mueblería funcionando correctamente.');
    });

    // Puerto fijo
    app.listen(3004, '0.0.0.0', () => {
      console.log('Servidor corriendo en http://localhost:3004');
    });

  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
  }
})();