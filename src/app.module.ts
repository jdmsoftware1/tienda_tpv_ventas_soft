import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { getDatabaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { EmpleadosModule } from './empleados/empleados.module';
import { ClientesModule } from './clientes/clientes.module';
import { ArticulosModule } from './articulos/articulos.module';
import { ComprasModule } from './compras/compras.module';
import { PagosModule } from './pagos/pagos.module';
import { DevolucionesModule } from './devoluciones/devoluciones.module';
import { CierreMesModule } from './cierre-mes/cierre-mes.module';
import { BackupModule } from './backup/backup.module';
import { FichajesModule } from './fichajes/fichajes.module';
import { HorariosModule } from './horarios/horarios.module';
import { FestivosModule } from './festivos/festivos.module';
import { VacacionesModule } from './vacaciones/vacaciones.module';
import { PlantillasHorariasModule } from './plantillas-horarias/plantillas-horarias.module';
import { BajasMedicasModule } from './bajas-medicas/bajas-medicas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    AuthModule,
    EmpleadosModule,
    ClientesModule,
    ArticulosModule,
    ComprasModule,
    PagosModule,
    DevolucionesModule,
    CierreMesModule,
    BackupModule,
    FichajesModule,
    HorariosModule,
    FestivosModule,
    VacacionesModule,
    PlantillasHorariasModule,
    BajasMedicasModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
