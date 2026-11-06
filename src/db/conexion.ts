import pg from 'pg';

// Dónde está la base. Si no hay DATABASE_URL, usa la de docker-compose.yml
// (usuario y contraseña ficticios de desarrollo), para que funcione sin configurar nada.
// El puerto es 55432 porque docker-compose.yml publica ahí el PostgreSQL del contenedor.
const url = process.env.DATABASE_URL ?? 'postgres://reservas:reservas@localhost:55432/reservas';

// Un solo Pool para toda la aplicación. Se crea una vez, la primera vez que
// algún archivo importa este módulo, y todos comparten las mismas conexiones.
export const pool = new pg.Pool({ connectionString: url });
