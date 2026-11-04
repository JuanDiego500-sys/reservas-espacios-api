-- Esquema de la base de datos de reservas.
-- Se puede ejecutar varias veces: borra las tablas y las crea de nuevo.

-- btree_gist permite usar "=" sobre texto dentro de un índice GiST,
-- que es el tipo de índice que necesita la restricción EXCLUDE.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Primero reservas, porque depende de espacios (llave foránea).
DROP TABLE IF EXISTS reservas;
DROP TABLE IF EXISTS espacios;

CREATE TABLE espacios (
  codigo     text    PRIMARY KEY,
  nombre     text    NOT NULL CHECK (nombre <> ''),
  tipo       text    NOT NULL CHECK (tipo IN ('LAB', 'SALA', 'AUDITORIO')),
  capacidad  integer NOT NULL CHECK (capacidad > 0),
  activo     boolean NOT NULL DEFAULT true
);

CREATE TABLE reservas (
  id              integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  espacio_codigo  text        NOT NULL REFERENCES espacios (codigo),
  inicio          timestamptz NOT NULL,
  fin             timestamptz NOT NULL,
  -- Día de la reserva en Bogotá. PostgreSQL lo calcula a partir de inicio.
  fecha           date        GENERATED ALWAYS AS ((inicio AT TIME ZONE 'America/Bogota')::date) STORED,
  asistentes      integer     NOT NULL CHECK (asistentes >= 1),
  motivo          text        NOT NULL CHECK (motivo <> ''),
  solicitante     text        NOT NULL,
  rol             text        NOT NULL CHECK (rol IN ('ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO')),
  estado          text        NOT NULL CHECK (estado IN ('PENDIENTE', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA')),

  CONSTRAINT reservas_fin_despues_de_inicio CHECK (fin > inicio),

  -- R1: un mismo espacio no puede tener dos reservas activas que se crucen.
  -- tstzrange(inicio, fin) es el rango [inicio, fin): incluye el inicio y excluye el fin,
  -- así que una reserva que termina a las 10:00 y otra que empieza a las 10:00 no se cruzan.
  -- "&&" significa "los rangos se traslapan". El WHERE hace que solo cuenten las activas.
  CONSTRAINT reservas_sin_traslape EXCLUDE USING gist (
    espacio_codigo         WITH =,
    tstzrange(inicio, fin) WITH &&
  ) WHERE (estado IN ('PENDIENTE', 'CONFIRMADA'))
);
