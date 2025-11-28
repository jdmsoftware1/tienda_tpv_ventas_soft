import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello() {
    return {
      message: 'Sistema de Gestión de Tienda - API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        auth: 'GET /auth/google - Iniciar sesión con Google',
        profile: 'GET /auth/me - Obtener perfil del usuario',
        empleados: 'GET /empleados - Listar empleados',
        clientes: 'GET /clientes - Listar clientes',
        articulos: 'GET /articulos - Listar artículos',
        compras: 'GET /compras - Listar compras',
        pagos: 'GET /pagos - Listar pagos',
        devoluciones: 'GET /devoluciones - Listar devoluciones',
        cierreMes: 'GET /cierre-mes - Listar cierres (Admin)',
        backup: 'POST /backup - Crear backup (Admin)',
      },
      documentation: 'Visita /auth/google para autenticarte',
    };
  }
}
