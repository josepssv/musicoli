# 🎤 Tarareo: Guía Rápida del Usuario

## ¿Qué es el Tarareo?

El **Tarareo** convierte tus palabras en ritmo musical automáticamente. Simplemente escribe texto y Musicoli lo transforma en compases con ritmos naturales y expresivos.

---

## Cómo Usar el Tarareo

### 1. Accede al Panel de Tarareo en el modo Compsición

1. Abre Musicoli en tu navegador
2. Selecciona el **Modo Composición** (🧩)
3. Encuentra el panel morado **🎤 Tarareo (Ritmo)** en la parte superior

### 2. Escribe Tu Texto

En el campo de texto, puedes escribir:

#### ✍️ Texto Natural
```
la música es bella
```

#### 🎵 Frases Poéticas
```
en el silencio de la noche
las estrellas brillan
```

#### 📝 Con Puntuación (para silencios)
```
hola, ¿cómo estás?
buenos días!
```

### 3. Genera el Ritmo

Haz clic en el botón **→** o presiona **Enter** para generar los compases.

---

## Trucos y Consejos

### 💡 Usa la Puntuación para Controlar Silencios

| Símbolo | Silencio Generado |
|---------|-------------------|
| `,` (coma) | Pausa corta (1 tiempo) |
| `.` (punto) | Pausa corta (1 tiempo) |
| `;` (punto y coma) | Pausa corta (1 tiempo) |
| `!` (exclamación) | Pausa larga (2 tiempos) |
| `(silencio)` | Pausa explícita |

**Ejemplo:**
```
Input:  "hola, mundo!"
Output: "hola" + pausa corta + "mundo" + pausa larga
```

### 🎯 El Sistema Detecta Acentos Automáticamente

Las sílabas tónicas (acentuadas) se marcan con mayor volumen:

```
"música" → mú-si-ca
           ↑ (acento aquí)
```

### 🔄 Cada Vez es Diferente

El sistema selecciona patrones rítmicos aleatoriamente, así que:
- Mismo texto → diferentes ritmos cada vez
- Perfecto para experimentar y encontrar el ritmo ideal

### 📚 Agrupa Palabras Naturalmente

El sistema agrupa palabras pequeñas automáticamente:

```
"el sol brilla"
  ↓
["el sol"] + ["brilla"]
```

Esto crea frases musicales más naturales.

---

## Ejemplos Prácticos

### Ejemplo 1: Canción Simple

**Input:**
```
la vida es un sueño
```

**Resultado:**
- 2-3 compases
- Ritmo natural basado en las sílabas
- Acentos en "vi-da" y "sue-ño"

### Ejemplo 2: Poesía con Pausas

**Input:**
```
bajo la luna,
canta el río.
```

**Resultado:**
- Compás 1: "bajo la luna" + pausa
- Compás 2: "canta" + "el río" + pausa

### Ejemplo 3: Ritmo Rápido

**Input:**
```
corre corre sin parar
```

**Resultado:**
- Ritmo continuo con corcheas
- Sensación de movimiento

---

## Preguntas Frecuentes

### ❓ ¿Puedo editar el ritmo generado?

Sí, después de generar los compases:
1. Haz clic en el compás en el editor
2. Usa el **Editor MIDI** para ajustar duraciones
3. Modifica las dinámicas (volumen) si lo deseas

### ❓ ¿Funciona en otros idiomas?

Actualmente está optimizado para **español**. El sistema de silabificación funciona mejor con palabras en español.

### ❓ ¿Qué pasa si escribo muchas palabras?

El sistema genera un compás por cada palabra o grupo de palabras. Si escribes mucho texto, obtendrás muchos compases.

### ❓ ¿Puedo controlar el tipo de ritmo?

Actualmente el sistema selecciona automáticamente. En futuras versiones podrás:
- Elegir entre ritmos lentos/rápidos
- Seleccionar estilos (clásico, jazz, pop)
- Previsualizar antes de aplicar

### ❓ ¿Los ritmos siempre llenan un compás completo?

No necesariamente. El sistema genera ritmos basados en las sílabas, que pueden ser más cortos o más largos que un compás de 4/4.

---

## Atajos de Teclado

| Acción | Atajo |
|--------|-------|
| Generar ritmo | `Enter` (en el campo de texto) |
| Borrar texto | `Ctrl + A` → `Delete` |

---

## Flujo de Trabajo Recomendado

### Para Crear una Canción:

1. **Escribe la primera línea** de tu letra
   ```
   bajo el cielo azul
   ```

2. **Genera el ritmo** (→)

3. **Escucha el resultado** (▶ Play)

4. **Ajusta si es necesario** (edita el compás)

5. **Repite** con las siguientes líneas

6. **Combina** los compases para formar tu canción completa

### Para Experimentar:

1. Escribe una palabra o frase
2. Genera varias veces para obtener variaciones
3. Elige la que más te guste
4. Combina diferentes ritmos para crear patrones interesantes

---

## Limitaciones Actuales

- ⚠️ Máximo 8 sílabas por palabra (palabras más largas usan ritmo por defecto)
- ⚠️ Optimizado para español
- ⚠️ No hay previsualización antes de generar
- ⚠️ No se puede elegir el estilo de ritmo

**Nota:** Estas limitaciones se abordarán en futuras actualizaciones.

---

## Consejos Creativos

### 🎨 Experimenta con Diferentes Textos

- **Poesía clásica**: Versos de Lorca, Neruda, Machado
- **Refranes**: "No por mucho madrugar amanece más temprano"
- **Trabalenguas**: "Tres tristes tigres"
- **Tus propias letras**: Escribe lo que sientas

### 🎼 Combina con Otros Modos

1. Genera el ritmo con **Tarareo**
2. Añade melodía en **Modo Tonalidad**
3. Ajusta dinámicas con **Modo Dinámica**
4. Añade la letra final en **Modo Lyrics**

### 🌊 Usa las Herramientas de Onda

Después de generar con Tarareo:
- Aplica **Onda Ritmo** para variaciones
- Usa **Onda Modulación** para expresividad
- Experimenta con **Dinámicas** para dar vida

---

## Solución de Problemas

### El botón → no funciona
- Verifica que hayas escrito algo en el campo de texto
- Recarga la página si es necesario

### No se generan compases
- Asegúrate de estar en **Modo Composición**
- Verifica que la librería `silaba.js` esté cargada (mira la consola del navegador)

### Los ritmos no suenan bien
- Prueba a generar de nuevo (obtendrás un patrón diferente)
- Edita manualmente el compás generado
- Ajusta las dinámicas para mejorar la expresión

---

## Recursos Adicionales

- 📖 **Guía Técnica Completa**: `docs/TARAREO_GUIDE.md`
- 🎵 **Patrones Rítmicos**: Definidos en `metrica.js`
- 🔧 **Código Fuente**: `tarareo-helper.js` y `musicoli.js`

---

## ¡Empieza a Crear!

El Tarareo es tu puerta de entrada a la composición musical sin barreras. No necesitas saber de teoría musical, solo escribe lo que sientes y deja que Musicoli lo convierta en música.

**¡Diviértete componiendo! 🎵✨**

---

*Última actualización: Febrero 2026*
