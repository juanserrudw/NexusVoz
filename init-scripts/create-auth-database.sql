-- Script de inicialización simple para crear la base de datos auth_user
CREATE DATABASE auth_user;

-- Otorgar permisos al usuario principal
\c auth_user;
GRANT ALL PRIVILEGES ON DATABASE auth_user TO nexusvoz;
GRANT ALL PRIVILEGES ON SCHEMA public TO nexusvoz;