require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');

const authMiddleware = require('./middleware/authMiddleware');

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
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT)
    });

    console.log('Conexión a la base de datos exitosa.');

    const authRoutes = require('./routes/Auth')(db);
    app.use('/api/auth', authRoutes);

    const productoRoutes = require('./routes/Productos')(db);
    app.use('/api/productos', authMiddleware, productoRoutes);

    const clientesRoutes = require('./routes/Clientes')(db);
    app.use('/api/clientes', authMiddleware, clientesRoutes);

    const productosRoutes = require('./routes/Productos');
    app.use('/api/productos', authMiddleware, productosRoutes(db));

    const configuracionPreciosRoutes = require('./routes/ConfiguracionPrecios');
    app.use('/api/configuracion-precios', authMiddleware, configuracionPreciosRoutes(db));

    const ventasMinoristasRoutes = require('./routes/VentasMinoristas')(db);
    app.use('/api/ventas-minoristas', authMiddleware, ventasMinoristasRoutes);

    const consultaDniRoutes = require('./routes/ConsultaDni');
    app.use('/api/consulta', authMiddleware, consultaDniRoutes());

    const stockRoutes = require('./routes/Stock')(db);
    app.use('/api/stock', authMiddleware, stockRoutes);

    const boletasRoutes = require('./routes/Boletas')(db); 
    app.use('/api/boletas', authMiddleware, boletasRoutes);
   

    app.get('/', (req, res) => {
      res.send('API de Mueblería funcionando correctamente.');
    });

    const PORT = process.env.PORT;
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
  }
})();