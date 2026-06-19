# mean-backend

mean-backend es la API REST del sistema veterinario MEAN. Centraliza la logica de negocio para autenticacion, usuarios, roles, pacientes, mascotas, veterinarios, agenda, citas e historial clinico.

Este repositorio corresponde al backend del sistema y esta pensado para trabajar junto con `mean-frontend`.

## Caracteristicas principales

- Autenticacion con JWT.
- Control de acceso por roles: `ADMIN`, `RECEPCIONISTA` y `VETERINARIO`.
- Gestion de usuarios, roles y contrasenas.
- Bloqueo por intentos fallidos y recuperacion de contrasena por correo.
- Registro de pacientes, duenos y mascotas.
- Gestion de veterinarios y horarios de atencion.
- Agenda de citas con estados y rangos de fecha.
- Historial clinico por mascota.
- Registro de consultas, vacunas, desparasitaciones, procedimientos y examenes.
- Carga de adjuntos con `multer` y almacenamiento en MinIO.
- Persistencia en MongoDB mediante Mongoose.

## Stack tecnologico

- Node.js
- Express 5
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Nodemailer
- MinIO
- Multer
- Luxon
- dotenv
- Nodemon

## Arquitectura

```text
mean-backend
|-- package.json
|-- .env.example
`-- src/
    |-- app.js                 # Punto de entrada de Express
    |-- config/                # MongoDB, correo y MinIO
    |-- controllers/           # Controladores HTTP
    |-- middlewares/           # JWT, roles y upload
    |-- models/                # Modelos Mongoose
    |-- routes/                # Rutas REST
    |-- services/              # Logica de negocio
    `-- utils/                 # Utilidades compartidas
```

## Relacion con el frontend

`mean-frontend` consume esta API usando rutas relativas `/api`. En desarrollo, Angular usa `proxy.conf.json` para redirigir esas peticiones al backend:

```text
Frontend: http://localhost:4200
Backend:  http://localhost:3000
Proxy:    /api -> http://127.0.0.1:3000
```

Para ejecutar el sistema completo, el backend debe estar activo antes de usar las pantallas del frontend que consumen datos.

## Requisitos previos

- Node.js 20 recomendado
- npm
- MongoDB local o remoto
- Servicio SMTP para recuperacion de contrasena
- MinIO si se usaran adjuntos de examenes

## Configuracion

Crear un archivo `.env` en la raiz de `mean-backend`.

Plantilla sugerida:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/mean-veterinaria

JWT_SECRET=change_me
JWT_EXPIRES_IN=1h

MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=correo@example.com
MAIL_PASS=app_password
MAIL_FROM=correo@example.com

MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=historial
MINIO_PUBLIC_URL=http://127.0.0.1:9000

CLINIC_TZ=America/La_Paz
```

Variables importantes:

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto HTTP de Express |
| `MONGODB_URI` | Cadena de conexion a MongoDB |
| `JWT_SECRET` | Firma de tokens JWT |
| `JWT_EXPIRES_IN` | Tiempo de vida del token |
| `MAIL_*` | Configuracion SMTP para recuperacion de contrasena |
| `MINIO_*` | Configuracion de almacenamiento de adjuntos |
| `CLINIC_TZ` | Zona horaria usada para citas |

## Instalacion

```bash
npm install
```

## Ejecucion local

Modo desarrollo con recarga automatica:

```bash
npm run dev
```

Modo produccion/local simple:

```bash
npm start
```

La API queda disponible por defecto en:

```text
http://localhost:3000
```

Endpoint de salud:

```http
GET http://localhost:3000/api/health
```

## Endpoints principales

| Modulo | Ruta base | Responsabilidad |
| --- | --- | --- |
| Auth | `/api/auth` | Login y recuperacion de contrasena |
| Roles | `/api/roles` | Creacion y listado de roles |
| Usuarios | `/api/users` | Gestion de usuarios, clientes y cuentas |
| Contrasenas | `/api/contrasenas` | Validacion, creacion y cambio de contrasena |
| Tipos de mascota | `/api/tipo-mascota` | Catalogo de tipos de mascota |
| Mascotas | `/api/mascotas` | CRUD de mascotas |
| Usuario-mascota | `/api/usuario-mascota` | Relacion entre duenos y mascotas |
| Pacientes | `/api/pacientes` | Registro de clientes con mascotas |
| Veterinarios | `/api/veterinarios` | Gestion de veterinarios y perfil profesional |
| Horarios | `/api/horarios-veterinario` | Horarios de atencion por veterinario |
| Agenda | `/api/agenda` | Eventos para calendario |
| Citas | `/api/citas` | Creacion, edicion, cancelacion y estados de citas |
| Historial clinico | `/api/historial` | Consultas, vacunas, examenes y adjuntos |

## Seguridad

- El middleware `auth.middleware.js` valida tokens JWT desde el header `Authorization: Bearer <token>`.
- El middleware de roles restringe acciones por tipo de usuario.
- Algunas rutas administrativas requieren rol `ADMIN`.
- Las rutas de citas estan orientadas principalmente al rol `RECEPCIONISTA`.
- Las rutas de historial clinico estan orientadas al rol `VETERINARIO`.

## Pruebas

El proyecto no tiene un script de pruebas configurado en `package.json`. Para validar manualmente:

1. Ejecutar MongoDB.
2. Configurar `.env`.
3. Levantar el backend con `npm run dev`.
4. Probar `GET /api/health`.
5. Probar login y rutas protegidas usando token JWT.

## Orden sugerido de arranque

1. Levantar MongoDB.
2. Levantar MinIO si se usaran adjuntos.
3. Ejecutar `mean-backend` en `http://localhost:3000`.
4. Ejecutar `mean-frontend` en `http://localhost:4200`.

