
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const db = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// MIDDLEWARES
app.use(express.json());

const allowedOrigins = [
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        callback(new Error('Bloqueado por CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// RUTAS
async function iniciarServidor() {
    try {
        // Verificar conexión PostgreSQL
        await db.query('SELECT NOW()');

        console.log('Conexión a Supabase PostgreSQL exitosa.');

        const authRoutes = require('./routes/Auth')(db);
        app.use('/api/auth', authRoutes);

        const productosRoutes = require('./routes/Productos')(db);
        app.use('/api/productos', authMiddleware, productosRoutes);

        const clientesRoutes = require('./routes/Clientes')(db);
        app.use('/api/clientes', authMiddleware, clientesRoutes);

        const configuracionPreciosRoutes =
            require('./routes/ConfiguracionPrecios')(db);

        app.use(
            '/api/configuracion-precios',
            authMiddleware,
            configuracionPreciosRoutes
        );

        const ventasMinoristasRoutes =
            require('./routes/VentasMinoristas')(db);

        app.use(
            '/api/ventas-minoristas',
            authMiddleware,
            ventasMinoristasRoutes
        );

        const consultaDniRoutes = require('./routes/ConsultaDni');

        app.use(
            '/api/consulta',
            authMiddleware,
            consultaDniRoutes()
        );

        const stockRoutes = require('./routes/Stock')(db);
        app.use('/api/stock', authMiddleware, stockRoutes);

        const boletasRoutes = require('./routes/Boletas')(db);
        app.use('/api/boletas', authMiddleware, boletasRoutes);

        const dashboardRoutes = require('./routes/Dashboard')(db);
        app.use('/api/dashboard', authMiddleware, dashboardRoutes);

        app.get('/', (req, res) => {
            res.send('API de Mueblería funcionando correctamente.');
        });

        const PORT = process.env.PORT || 3004;

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Error iniciando el servidor:', error);
        process.exit(1);
    }
}

iniciarServidor();
