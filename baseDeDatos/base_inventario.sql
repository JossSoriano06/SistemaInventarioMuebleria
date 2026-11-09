


CREATE DATABASE IF NOT EXISTS bd_muebles

USE bd_muebles;




CREATE TABLE IF NOT EXISTS productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto VARCHAR(150) NOT NULL,
    descripcion_producto TEXT,
    precio_producto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    precio_compra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    precio_mayorista DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    precio_minorista DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 0,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;




CREATE TABLE IF NOT EXISTS clientes (
    id_clientes INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cliente VARCHAR(100) NOT NULL,
    apellido_cliente VARCHAR(100) NOT NULL,
    referencia_cliente VARCHAR(200) NOT NULL
) ENGINE=InnoDB;




CREATE TABLE IF NOT EXISTS ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    fecha_vente DATE NOT NULL,
    total_venta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    id_cliente INT NOT NULL,
    pago_acumulado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado_pago ENUM('pendiente', 'cancelado')
        NOT NULL DEFAULT 'pendiente',

    CONSTRAINT fk_ventas_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_clientes)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;




CREATE TABLE IF NOT EXISTS detalle_ventas (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    color VARCHAR(100) NOT NULL,
    cantidad_detalle_ventas_productos INT NOT NULL,
    precio_detalle_ventas_productos DECIMAL(10,2) NOT NULL,
    sub_total_detalle_ventas DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_detalle_venta
        FOREIGN KEY (id_venta)
        REFERENCES ventas(id_venta)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;




CREATE TABLE IF NOT EXISTS abonos (
    id_abono INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    monto_abono DECIMAL(10,2) NOT NULL,
    fecha_abono TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_abonos_venta
        FOREIGN KEY (id_venta)
        REFERENCES ventas(id_venta)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;




CREATE TABLE IF NOT EXISTS clientes_minoristas (
    id_cliente_minorista INT AUTO_INCREMENT PRIMARY KEY,
    dni CHAR(8) NOT NULL UNIQUE,
    nombre_cliente VARCHAR(100) NOT NULL,
    apellido_cliente VARCHAR(150) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;




CREATE TABLE IF NOT EXISTS boleta_serie_minorista (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serie VARCHAR(10) NOT NULL,
    correlativo BIGINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;




INSERT INTO boleta_serie_minorista (serie, correlativo)
SELECT 'B001', 0
WHERE NOT EXISTS (
    SELECT 1
    FROM boleta_serie_minorista
);



CREATE TABLE IF NOT EXISTS ventas_minoristas (
    id_venta_minorista INT AUTO_INCREMENT PRIMARY KEY,
    numero_comprobante VARCHAR(30) NOT NULL UNIQUE,
    id_cliente_minorista INT NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_venta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    monto_pagado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    metodo_pago VARCHAR(30) NOT NULL,
    estado_pago ENUM('PENDIENTE', 'CANCELADO')
        NOT NULL DEFAULT 'CANCELADO',

    CONSTRAINT fk_venta_minorista_cliente
        FOREIGN KEY (id_cliente_minorista)
        REFERENCES clientes_minoristas(id_cliente_minorista)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;



CREATE TABLE IF NOT EXISTS detalle_ventas_minoristas (
    id_detalle_minorista INT AUTO_INCREMENT PRIMARY KEY,
    id_venta_minorista INT NOT NULL,
    id_producto INT NOT NULL,
    color VARCHAR(100) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_detalle_minorista_venta
        FOREIGN KEY (id_venta_minorista)
        REFERENCES ventas_minoristas(id_venta_minorista)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_detalle_minorista_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;




CREATE INDEX idx_productos_nombre
ON productos(nombre_producto);

CREATE INDEX idx_ventas_fecha
ON ventas(fecha_vente);

CREATE INDEX idx_ventas_cliente
ON ventas(id_cliente);

CREATE INDEX idx_detalle_ventas_producto
ON detalle_ventas(id_producto);

CREATE INDEX idx_ventas_minoristas_fecha
ON ventas_minoristas(fecha_venta);

CREATE INDEX idx_ventas_minoristas_cliente
ON ventas_minoristas(id_cliente_minorista);

CREATE INDEX idx_detalle_minorista_producto
ON detalle_ventas_minoristas(id_producto);




SHOW TABLES;
