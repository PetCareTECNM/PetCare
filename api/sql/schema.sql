-- PetCare basic schema for SQL Server (aligns with api/server.js expectations)
-- Run this in SQL Server (e.g., in SSMS) connected to your instance.

IF DB_ID('RegistroDeVeterinaria') IS NULL
BEGIN
  CREATE DATABASE RegistroDeVeterinaria;
END
GO

USE RegistroDeVeterinaria;
GO

-- PACIENTES table
IF OBJECT_ID('dbo.PACIENTES', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.PACIENTES (
    ID           VARCHAR(30) NOT NULL PRIMARY KEY,
    NOMBRE       VARCHAR(100) NOT NULL,
    ESPECIE      VARCHAR(50)  NULL,
    RAZA         VARCHAR(80)  NULL,
    NACIMIENTO   DATE         NULL,
    PROPIETARIO  VARCHAR(120) NULL,
    CREATED_AT   DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

-- DatosConsulta table
IF OBJECT_ID('dbo.DatosConsulta', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.DatosConsulta (
    Id_Consulta       VARCHAR(30) NOT NULL PRIMARY KEY,
    ID_Mascota        VARCHAR(30) NOT NULL,
    Nombre_Paciente   VARCHAR(100) NOT NULL,
    Detalles_Paciente VARCHAR(MAX) NULL,
    Motivo            VARCHAR(MAX) NOT NULL,
    Fecha             DATE NOT NULL,
    Diagnostico       VARCHAR(MAX) NULL,
    CREATED_AT        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

-- Stored procedure: INGRESA_PACIENTE
IF OBJECT_ID('dbo.INGRESA_PACIENTE', 'P') IS NOT NULL
  DROP PROCEDURE dbo.INGRESA_PACIENTE;
GO
CREATE PROCEDURE dbo.INGRESA_PACIENTE
  @ID           VARCHAR(30),
  @NOMBRE       VARCHAR(30),
  @ESPECIE      VARCHAR(30),
  @RAZA         VARCHAR(30),
  @NACIMEINTO   DATE,
  @PROPIETARIO  VARCHAR(30)
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM dbo.PACIENTES WHERE ID = @ID)
  BEGIN
    INSERT INTO dbo.PACIENTES(ID, NOMBRE, ESPECIE, RAZA, NACIMIENTO, PROPIETARIO)
    VALUES(@ID, @NOMBRE, @ESPECIE, @RAZA, @NACIMEINTO, @PROPIETARIO);
  END
  ELSE
  BEGIN
    UPDATE dbo.PACIENTES
      SET NOMBRE = @NOMBRE, ESPECIE = @ESPECIE, RAZA = @RAZA,
          NACIMIENTO = @NACIMEINTO, PROPIETARIO = @PROPIETARIO
    WHERE ID = @ID;
  END
END
GO

-- Stored procedure: INGRESA_CONSULTA
IF OBJECT_ID('dbo.INGRESA_CONSULTA', 'P') IS NOT NULL
  DROP PROCEDURE dbo.INGRESA_CONSULTA;
GO
CREATE PROCEDURE dbo.INGRESA_CONSULTA
  @Id_Consulta       VARCHAR(30),
  @ID_Mascota        VARCHAR(30),
  @Nombre_Paciente   VARCHAR(30),
  @Detalles_Paciente VARCHAR(MAX),
  @Motivo            VARCHAR(MAX),
  @Fecha             DATE,
  @Diagnostico       VARCHAR(MAX)
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM dbo.DatosConsulta WHERE Id_Consulta = @Id_Consulta)
  BEGIN
    INSERT INTO dbo.DatosConsulta(Id_Consulta, ID_Mascota, Nombre_Paciente, Detalles_Paciente, Motivo, Fecha, Diagnostico)
    VALUES(@Id_Consulta, @ID_Mascota, @Nombre_Paciente, @Detalles_Paciente, @Motivo, @Fecha, @Diagnostico);
  END
  ELSE
  BEGIN
    UPDATE dbo.DatosConsulta
      SET ID_Mascota = @ID_Mascota,
          Nombre_Paciente = @Nombre_Paciente,
          Detalles_Paciente = @Detalles_Paciente,
          Motivo = @Motivo,
          Fecha = @Fecha,
          Diagnostico = @Diagnostico
    WHERE Id_Consulta = @Id_Consulta;
  END
END
GO
