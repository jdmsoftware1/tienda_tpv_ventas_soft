/**
 * Script completo de migración de datos desde MySQL (tiendaNew) a PostgreSQL (Neon)
 * Migra: Empleados (trabajadores) y Clientes
 * 
 * Ejecutar con: npx ts-node scripts/migrate-all.ts
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config();

// Datos de trabajadores extraídos del SQL
const trabajadores = [
  { cod_user: 1, name: 'David' },
  { cod_user: 2, name: 'fe' },
  { cod_user: 3, name: 'Bego' },
  { cod_user: 4, name: 'Jimenez' },
  { cod_user: 5, name: 'Yaiza' },
  { cod_user: 6, name: 'BegoJi' },
];

// Función para parsear clientes del SQL
function parseClientes(): Map<string, any> {
  const sqlPath = path.join(__dirname, '../tmp/tiendaNew(2).sql');
  
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`No se encontró el archivo SQL en: ${sqlPath}`);
  }
  
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
  const clientesMap = new Map<string, any>();

  // Expresión regular para extraer valores de cada fila de clientes
  const valuesRegex = /\((\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(\d+),\s*'([^']*)',\s*'?(-?[\d.]+)'?,\s*'([^']*)',\s*'([^']*)',\s*(?:'([^']*)'|NULL),\s*(\d+)\)/g;

  let match;
  while ((match = valuesRegex.exec(sqlContent)) !== null) {
    const [
      _,
      cod_cliente,
      nombre_c,
      apellidos_c,
      direccion_c,
      telefono_c,
    ] = match;
    const cod_user = parseInt(match[11]);

    // Clave única: cod_cliente + cod_user
    const key = `${cod_cliente}-${cod_user}`;
    
    // Limpiar y concatenar nombre
    let nombreCompleto = nombre_c.trim();
    if (apellidos_c && apellidos_c.trim()) {
      nombreCompleto += ' ' + apellidos_c.trim();
    }
    
    // Limpiar dirección
    const direccion = direccion_c.trim() || null;
    
    // Limpiar teléfono (convertir 0 o 1 a null)
    let telefono: string | null = telefono_c;
    if (telefono === '0' || telefono === '1' || telefono === '') {
      telefono = null;
    }

    clientesMap.set(key, {
      num_cliente: cod_cliente, // Solo el código del cliente, sin sufijo
      nombre: nombreCompleto,
      direccion,
      telefono,
      cod_user,
    });
  }

  return clientesMap;
}

async function migrate() {
  console.log('🚀 Iniciando migración de datos...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await dataSource.initialize();
  console.log('✅ Conectado a la base de datos PostgreSQL (Neon)\n');

  try {
    // ========================================
    // PASO 0: Limpiar datos existentes si se pasa --clean
    // ========================================
    const cleanMode = process.argv.includes('--clean');
    if (cleanMode) {
      console.log('🧹 Limpiando datos existentes...');
      await dataSource.query('DELETE FROM devoluciones');
      await dataSource.query('DELETE FROM pagos');
      await dataSource.query('DELETE FROM compra_articulos');
      await dataSource.query('DELETE FROM compras');
      await dataSource.query('DELETE FROM clientes');
      await dataSource.query('DELETE FROM empleados');
      console.log('   ✓ Datos limpiados\n');
    }

    // ========================================
    // PASO 0.5: Asegurar que existe la columna direccion
    // ========================================
    console.log('🔧 Verificando esquema de base de datos...');
    try {
      await dataSource.query(`
        ALTER TABLE clientes ADD COLUMN IF NOT EXISTS direccion VARCHAR(255) NULL
      `);
      console.log('   ✓ Columna direccion verificada\n');
    } catch (err: any) {
      console.log('   ⚠️ La columna direccion ya existe o error:', err.message, '\n');
    }

    // ========================================
    // PASO 1: Insertar empleados
    // ========================================
    console.log('📥 PASO 1: Insertando empleados (trabajadores)...');
    
    for (const t of trabajadores) {
      try {
        await dataSource.query(
          `INSERT INTO empleados (id, id_empleado, nombre, created_at, updated_at) 
           VALUES (gen_random_uuid(), $1, $2, NOW(), NOW()) 
           ON CONFLICT (id_empleado) DO NOTHING`,
          [t.cod_user.toString(), t.name]
        );
        console.log(`   ✓ ${t.name} (id_empleado: ${t.cod_user})`);
      } catch (err: any) {
        console.log(`   ⚠️ ${t.name} ya existe o error: ${err.message}`);
      }
    }

    // Obtener mapa de empleados
    const empleados = await dataSource.query('SELECT id, id_empleado FROM empleados');
    const empleadoMap = new Map<number, string>();
    for (const emp of empleados) {
      empleadoMap.set(parseInt(emp.id_empleado), emp.id);
    }
    console.log(`   Total: ${empleados.length} empleados\n`);

    // ========================================
    // PASO 2: Parsear e insertar clientes
    // ========================================
    console.log('📥 PASO 2: Insertando clientes...');
    
    const clientes = parseClientes();
    console.log(`   Encontrados ${clientes.size} clientes únicos en el SQL`);
    
    let insertados = 0;
    let omitidos = 0;
    let errores = 0;

    for (const [key, cliente] of clientes) {
      const empleadoId = empleadoMap.get(cliente.cod_user);
      
      if (!empleadoId) {
        omitidos++;
        continue;
      }

      try {
        const result = await dataSource.query(
          `INSERT INTO clientes (id, num_cliente, nombre, telefono, direccion, empleado_id, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT (num_cliente) DO NOTHING
           RETURNING id`,
          [cliente.num_cliente, cliente.nombre, cliente.telefono, cliente.direccion, empleadoId]
        );
        if (result.length > 0) {
          insertados++;
        } else {
          omitidos++; // Ya existía
        }
      } catch (err: any) {
        errores++;
        if (errores <= 5) {
          console.log(`   ❌ Error: ${cliente.nombre} - ${err.message}`);
        }
      }
    }

    console.log(`   ✓ Insertados: ${insertados} clientes`);
    console.log(`   ⏭️  Omitidos (duplicados o sin empleado): ${omitidos}`);
    if (errores > 0) {
      console.log(`   ⚠️  Errores: ${errores}`);
    }

    // ========================================
    // PASO 3: Verificar datos
    // ========================================
    console.log('\n📊 PASO 3: Verificando datos...');
    
    const totalEmpleados = await dataSource.query('SELECT COUNT(*) as count FROM empleados');
    const totalClientes = await dataSource.query('SELECT COUNT(*) as count FROM clientes');
    
    console.log(`   - Empleados en BD: ${totalEmpleados[0].count}`);
    console.log(`   - Clientes en BD: ${totalClientes[0].count}`);

    // Mostrar distribución de clientes por empleado
    const distribucion = await dataSource.query(`
      SELECT e.nombre as empleado, COUNT(c.id) as clientes
      FROM empleados e
      LEFT JOIN clientes c ON c.empleado_id = e.id
      GROUP BY e.id, e.nombre
      ORDER BY e.id_empleado
    `);
    
    console.log('\n   Distribución de clientes por empleado:');
    for (const row of distribucion) {
      console.log(`   - ${row.empleado}: ${row.clientes} clientes`);
    }
    
    console.log('\n✅ ¡Migración completada exitosamente!');

  } catch (error) {
    console.error('\n❌ Error en migración:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

migrate().catch(console.error);
