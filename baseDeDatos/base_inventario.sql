create database bd_muebles;

use bd_muebles;
CREATE TABLE clientes (
    id_clientes int primary key auto_increment,
    nombre_cliente varchar(100) not null,
    apellido_cliente varchar(100) not null
);
alter table clientes
add referencia_cliente varchar(100) not null;


CREATE TABLE productos (
    id_producto int primary key auto_increment,
    nombre_producto varchar(100) not null,
    descripcion_producto varchar (100) not null,
    precio_producto decimal(10, 2) not null
);

CREATE TABLE ventas (
    id_venta int primary key auto_increment,
    fecha_vente date not null,
    total_venta decimal(10,2) not null,
    id_cliente int,
    foreign key (id_cliente) references clientes(id_clientes)
);
use bd_muebles;
select *from ventas;
use bd_muebles;
ALTER TABLE ventas 
ADD COLUMN pago_acumulado DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN estado_pago ENUM('pendiente', 'cancelado') DEFAULT 'pendiente';

CREATE TABLE abonos (
    id_abono INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    monto_abono DECIMAL(10,2) NOT NULL,
    fecha_abono TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE
);

CREATE TABLE colores (
    color varchar(100)
);

INSERT INTO colores (color) VALUES 
('Iviza'), ('Chantilly'), ('Humo'), ('Wenge'), ('Cedro'), 
('Lila'), ('Rosado'), ('Arena'), ('Light Sonoma'), ('Caramelo'), ('Blanco');
USE bd_muebles;
INSERT INTO colores (color) VALUES 
('N/A');

CREATE TABLE detalle_ventas (
    id_detalle_venta int primary key auto_increment,
    id_venta int,
    id_producto int,
    color varchar(100) not null,
    cantidad_detalle_ventas_productos int not null,
    precio_detalle_ventas_productos decimal(10,2) not null,
    sub_total_detalle_ventas decimal (10,2) not null,
    foreign key (id_venta) references ventas (id_venta),
    foreign key (id_producto) references productos (id_producto)
);


CREATE TABLE boleta_serie (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serie VARCHAR(4) NOT NULL,
    correlativo INT NOT NULL
);
ALTER TABLE boleta_serie
MODIFY serie VARCHAR(10) NOT NULL;

INSERT INTO boleta_serie (serie, correlativo) VALUES ('B001', 0);
UPDATE boleta_serie 
SET serie = 'NV001'
WHERE id = 1;

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'ADMIN'
);

INSERT INTO usuarios
(nombre_usuario, password, nombre_completo, rol)
VALUES
('admin', '$2b$10$tzlbBRnH0QNWZ62tSoUZyepY0z.96biWVn5cg/7kHUIwOFowEeB6a', 'Administrador El Márquez', 'ADMIN');