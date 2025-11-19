# 🔒 Actualización de Persistencia de Datos

## Cambios Realizados

### ✅ Problema Resuelto
Las **contraseñas** y **sesiones** ahora persisten entre recreaciones y actualizaciones del contenedor Docker.

### 📋 Qué se implementó

#### 1. **Volumen de Docker Persistente**
- Se agregó un volumen llamado `brainstorm-persistent-data`
- Ubicación en el contenedor: `/app/backend/data`
- Almacena:
  - `auth.json` - Contraseñas hasheadas
  - `sessions.json` - Todas las sesiones creadas

#### 2. **Backend: Almacenamiento en Archivos**
- Las sesiones se guardan automáticamente en disco después de cada operación
- Las contraseñas se almacenan de forma segura con hash SHA-256
- Se cargan automáticamente al iniciar el servidor

#### 3. **Endpoints de Autenticación**
Nuevos endpoints agregados:
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/change-password` - Cambio de contraseña

#### 4. **Frontend Actualizado**
- `loginUser()` ahora usa el backend en lugar de localStorage
- `changeUserPassword()` ahora usa el backend en lugar de localStorage
- Las contraseñas se validan en el servidor, no en el navegador

## 🚀 Cómo Usar

### Primera Vez (Configuración Inicial)

1. **Reconstruir la imagen con las imágenes nuevas:**
   ```bash
   docker-compose build --no-cache
   ```

2. **Iniciar el contenedor:**
   ```bash
   docker-compose up -d
   ```

3. **Verificar que todo funciona:**
   ```bash
   docker-compose logs -f
   ```

4. **Credenciales por defecto:**
   - Usuario: `admin`
   - Contraseña: `admin123`
   - ⚠️ **IMPORTANTE**: Cambiar la contraseña inmediatamente después del primer login

### Actualizaciones Futuras

Para actualizar el código SIN perder datos:

```bash
# Detener contenedor (los datos persisten en el volumen)
docker-compose down

# Reconstruir con nuevos cambios
docker-compose build

# Iniciar de nuevo (con los datos preservados)
docker-compose up -d
```

### Recrear TODO desde cero (PERDERÁS DATOS)

Si necesitas empezar de cero:

```bash
# Esto ELIMINARÁ todas las sesiones y contraseñas
docker-compose down -v

# Reconstruir e iniciar
docker-compose up --build -d
```

## 📊 Verificar Persistencia

### Ver los archivos de datos dentro del contenedor:
```bash
docker exec -it brainstorm-app ls -la /app/backend/data
```

### Ver contenido de las sesiones:
```bash
docker exec -it brainstorm-app cat /app/backend/data/sessions.json
```

### Ver ubicación del volumen en tu sistema:
```bash
docker volume inspect brainstorm-persistent-data
```

## 🔐 Seguridad

- Las contraseñas se almacenan con hash SHA-256
- Los archivos están dentro del contenedor y el volumen Docker
- Solo el usuario admin tiene acceso
- Se recomienda cambiar la contraseña por defecto inmediatamente

## 📝 Archivos Modificados

1. `docker-compose.yml` - Agregado volumen persistente
2. `backend/server.js` - Sistema de archivos + endpoints de auth
3. `services/storageService.ts` - Uso de API backend para auth

## 🎯 Beneficios

✅ Las contraseñas persisten entre recreaciones
✅ Las sesiones persisten entre actualizaciones
✅ Mayor seguridad (auth en servidor, no en navegador)
✅ Backup fácil (solo copiar el volumen)
✅ Multi-dispositivo (todos comparten mismos datos)
