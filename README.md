# Mueblería El Márquez

## Sistema de Gestión de Inventario y Ventas

Sistema web desarrollado para la gestión y administración de una mueblería, permitiendo controlar productos, stock, clientes y ventas mayoristas y minoristas mediante una interfaz intuitiva.

El proyecto busca optimizar los procesos comerciales, mejorar el control de inventario y facilitar el seguimiento de las ventas realizadas.

---

## Funcionalidades Principales

### Gestión de Productos
- Registro de nuevos productos.
- Actualización de información de productos.
- Gestión de precios de compra, minoristas y mayoristas.
- Control de stock disponible.
- Identificación de productos con stock bajo.
- Gestión de productos relacionados con ventas.

### Gestión de Clientes
- Registro y administración de clientes mayoristas.
- Consulta de información de clientes.
- Registro de clientes minoristas mediante DNI.
- Asociación de clientes con sus respectivas ventas.

### Ventas por Mayor
- Registro de ventas mayoristas.
- Selección de productos y cantidades.
- Aplicación de precios mayoristas según la cantidad adquirida.
- Registro de pagos iniciales.
- Gestión de abonos.
- Consulta del historial de ventas.
- Visualización de detalles de venta.
- Generación de boletas en PDF.

### Ventas por Menor
- Registro de ventas minoristas.
- Consulta de clientes mediante DNI.
- Selección de productos.
- Gestión de cantidades y colores.
- Registro de métodos de pago.
- Generación de boletas en PDF.
- Consulta del historial de ventas minoristas.
- Visualización del detalle de las ventas.

### Inventario
- Consulta de productos disponibles.
- Seguimiento del stock.
- Identificación de productos con bajo inventario.
- Actualización de existencias asociadas a las ventas.

---

## Tecnologías Utilizadas

### Frontend
- React.js
- JavaScript
- Tailwind CSS
- React Router DOM
- Axios
- React Icons

### Backend
- Node.js
- Express.js
- MySQL
- JSON Web Token (JWT)

### Herramientas de Desarrollo
- Visual Studio Code
- Git
- GitHub
- MySQL Workbench
- Postman

---

##  Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/JossSoriano06/SistemaInventarioMuebleria
```

Ingresar a la carpeta del proyecto:

```bash
cd INVENTARIOMUEBLERIA
```

### 2. Configurar el Backend

Ingresar a la carpeta del servidor:

```bash
cd servidor
```

Instalar las dependencias:

```bash
npm install
```

Crear el archivo `.env` y configurar las variables de conexión a MySQL:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=bd_muebles
PORT=3004
JWT_SECRET=tu_clave_secreta
```

> Las variables deben coincidir con la configuración utilizada en el backend.

### 3. Configurar la Base de Datos

1. Abrir MySQL Workbench.
2. Crear o importar la base de datos `bd_muebles`.
3. Ejecutar el script SQL del proyecto.
4. Verificar que las tablas y relaciones estén correctamente configuradas.

### 4. Ejecutar el Backend

Desde la carpeta `servidor`:

```bash
node sever.js
```

Si el proyecto utiliza otro script configurado en `package.json`, ejecutar el correspondiente.

El servidor utiliza el puerto `3004`.

### 5. Configurar el Frontend

Ingresar a la carpeta del frontend:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

Ejecutar la aplicación:


```bash
npm start -o
```

---

## Seguridad

El sistema contempla mecanismos de autenticación y control de acceso mediante middleware.

Se recomienda:

- No publicar el archivo `.env`.
- No compartir credenciales de la base de datos.
- Utilizar variables de entorno para las configuraciones sensibles.
- Mantener las dependencias actualizadas.
