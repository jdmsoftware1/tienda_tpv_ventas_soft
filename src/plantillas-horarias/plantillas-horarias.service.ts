import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlantillaHoraria } from '../entities/plantilla-horaria.entity';

@Injectable()
export class PlantillasHorariasService {
  constructor(
    @InjectRepository(PlantillaHoraria)
    private plantillasRepository: Repository<PlantillaHoraria>,
  ) {}

  async create(data: {
    nombre: string;
    descripcion?: string;
    horarios: any[];
  }): Promise<PlantillaHoraria> {
    // Obtener el último hash para encadenamiento
    const plantillas = await this.plantillasRepository.find({
      order: { created_at: 'DESC' },
      take: 1,
    });
    const ultimaPlantilla = plantillas.length > 0 ? plantillas[0] : null;

    const plantilla = this.plantillasRepository.create({
      nombre: data.nombre,
      descripcion: data.descripcion,
      horarios: data.horarios,
      hash_anterior: ultimaPlantilla?.hash || null,
    });

    return await this.plantillasRepository.save(plantilla);
  }

  async findAll(): Promise<PlantillaHoraria[]> {
    return await this.plantillasRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PlantillaHoraria | null> {
    return await this.plantillasRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.plantillasRepository.delete(id);
  }

  async verifyIntegrity(): Promise<{ valid: boolean; errors: string[] }> {
    const plantillas = await this.plantillasRepository.find({
      order: { created_at: 'ASC' },
    });

    const errors: string[] = [];
    let previousHash: string | null = null;

    for (const plantilla of plantillas) {
      // Verificar encadenamiento
      if (plantilla.hash_anterior !== previousHash) {
        errors.push(
          `Plantilla ${plantilla.id}: hash_anterior no coincide. Esperado: ${previousHash}, Actual: ${plantilla.hash_anterior}`,
        );
      }

      previousHash = plantilla.hash;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
