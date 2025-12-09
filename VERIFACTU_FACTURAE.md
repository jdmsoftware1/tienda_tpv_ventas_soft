# Verifactu y Facturae - Documentación

## Estado Actual: PREPARATORIO

Este documento describe la estructura preparada para la implementación futura de Verifactu y Facturae.

---

## 1. Verifactu (Ley Crea y Crece)

### ¿Qué es Verifactu?

Verifactu es el sistema de verificación de facturas establecido por la Ley Crea y Crece (Ley 18/2022). Su objetivo es prevenir el fraude fiscal mediante:

- **Firma electrónica** de todos los documentos de venta
- **Encadenamiento de documentos** (blockchain-like) para garantizar inmutabilidad
- **Código QR TBAI** en cada ticket/factura
- **Envío automático a AEAT** de información de facturación

### Entidad Preparada: `VerifactuDocument`

```typescript
- id: UUID
- compra: Relación con Compra
- tipo_documento: ticket | factura | factura_simplificada
- numero_documento: Número único
- importe_total: Total del documento
- base_imponible: Base imponible
- tipo_iva: Porcentaje de IVA
- cuota_iva: Cuota de IVA
- firma_electronica: Hash SHA-256 del documento
- hash_anterior: Hash del documento anterior (encadenamiento)
- qr_code: Código QR en base64
- estado: pendiente | firmado | enviado | error
- fecha_envio: Fecha de envío a AEAT
- respuesta_aeat: Respuesta de la AEAT
```

### Implementación Futura

Para completar Verifactu se necesitará:

1. **Certificado Digital**: Obtener certificado de la empresa para firmar documentos
2. **Generación de QR TBAI**: Implementar generación de código QR según especificaciones
3. **API AEAT**: Integrar con el servicio web de la AEAT para envío de documentos
4. **Módulo de Firma**: Crear servicio para firmar documentos con el certificado
5. **Validación**: Implementar validaciones según normativa vigente

### Librerías Recomendadas

```bash
npm install node-forge qrcode xmlbuilder2
```

---

## 2. Facturae

### ¿Qué es Facturae?

Facturae es el formato estándar español para facturación electrónica en formato XML. Es obligatorio para:

- Facturación a la Administración Pública
- Empresas que opten por facturación electrónica

### Entidad Preparada: `Facturae`

```typescript
- id: UUID
- cliente: Relación con Cliente
- compra: Relación con Compra (opcional)
- numero_factura: Número único de factura
- serie: Serie de la factura
- tipo: FC (Completa) | FA (Abreviada) | AF (Autofactura)
- fecha_expedicion: Fecha de expedición
- fecha_operacion: Fecha de operación (opcional)
- base_imponible: Base imponible
- tipo_iva: Porcentaje de IVA
- cuota_iva: Cuota de IVA
- total_factura: Total de la factura
- xml_content: XML Facturae generado
- xml_hash: Hash del XML para verificación
- estado: borrador | generada | enviada | aceptada | rechazada
- observaciones: Observaciones adicionales
```

### Implementación Futura

Para completar Facturae se necesitará:

1. **Generador XML**: Crear servicio para generar XML según esquema Facturae 3.2.x
2. **Validador**: Validar XML contra XSD oficial
3. **Firma Digital**: Firmar XML con certificado digital
4. **Envío FACe**: Integrar con plataforma FACe para envío a AAPP
5. **Gestión de Estados**: Implementar seguimiento de estados de factura

### Librerías Recomendadas

```bash
npm install xmlbuilder2 xml2js fast-xml-parser
```

---

## 3. Integración con Sistema Actual

### Flujo Propuesto

1. **Al crear una Compra**:
   - Generar `VerifactuDocument` automáticamente
   - Firmar documento
   - Generar QR
   - Enviar a AEAT (si procede)

2. **Al generar Factura**:
   - Crear `Facturae` desde Compra
   - Generar XML
   - Firmar XML
   - Enviar a cliente/AAPP

### Consideraciones Legales

- **Verifactu**: Obligatorio desde 2025 para todos los empresarios
- **Facturae**: Obligatorio solo para AAPP y opcional para B2B
- **Conservación**: Documentos deben conservarse mínimo 4 años
- **Inmutabilidad**: Los registros no pueden modificarse una vez firmados

---

## 4. Próximos Pasos

### Prioridad Alta
- [ ] Obtener certificado digital de la empresa
- [ ] Implementar generación de firma electrónica
- [ ] Crear servicio de encadenamiento de documentos

### Prioridad Media
- [ ] Implementar generación de QR TBAI
- [ ] Crear generador de XML Facturae
- [ ] Integrar con API AEAT (sandbox primero)

### Prioridad Baja
- [ ] Interfaz de gestión de Verifactu
- [ ] Interfaz de gestión de Facturae
- [ ] Reportes y estadísticas

---

## 5. Referencias

- **Verifactu**: https://sede.agenciatributaria.gob.es/Sede/verifactu.html
- **Facturae**: https://www.facturae.gob.es/
- **Ley Crea y Crece**: BOE-A-2022-16652
- **FACe**: https://face.gob.es/

---

**Nota**: Esta es una estructura preparatoria. La implementación completa requiere:
1. Certificado digital válido
2. Pruebas en entorno sandbox de AEAT
3. Validación legal con asesor fiscal
4. Homologación del software
