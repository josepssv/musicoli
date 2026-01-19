# Musicoli 🎨🎵

**Musicoli** es una herramienta web para la composición musical asistida, enfocada en la independencia de voces y la visualización mediante colores. Permite componer, editar y reproducir música polifónica directamente desde el navegador.

## ✨ Características Principales

*   **Edición Polifónica**: Soporte completo para 4 voces independientes (Soprano, Contralto, Tenor, Bajo).
*   **Modos de Edición Especializados**:
    *   🔴 **Ritmo**: Define la estructura temporal y los patrones rítmicos.
    *   🎹 **Tonalidad**: Ajusta las escalas, armonías y notas específicas.
    *   📝 **Lyrics (Letra)**: Añade y sincroniza texto con la música.
    *   🔊 **Dinámica**: Control preciso del volumen general y mezcla individual por pista.
*   **Sistema de Colores**: Visualización intuitiva donde los colores representan alturas y funciones tonales.
*   **Reproducción MIDI**: Motor de audio integrado basado en *Soundfont* para una reproducción realista.
*   **Exportación**: Genera y descarga archivos `.mid` (MIDI) y resúmenes en HTML de tus composiciones.
*   **Almacenamiento Local**: Guarda tus frases y progresos en el navegador.

## 🚀 Cómo empezar

Musicoli está construido con tecnologías web estándar (HTML, CSS, JS) y **no requiere instalación ni procesos de compilación**.

1.  Clona o descarga este repositorio.
2.  Abre el archivo `index.html` en cualquier navegador web moderno (Chrome, Firefox, Edge).
3.  ¡Empieza a componer!

## 📂 Estructura del Proyecto

*   `index.html`: Punto de entrada de la aplicación. Contiene la estructura de la interfaz.
*   `musicoli.js`: Núcleo lógico de la aplicación. Maneja el estado (objeto `bdi`), la reproducción y la lógica de edición.
*   `notepad.js`: Componente para la visualización y edición en partitura/piano roll.
*   `metrica.js` & `silaba.js`: Módulos auxiliares para el manejo de métrica y silabeo de textos.
*   `midiWriter.js`: Librería para la generación de archivos MIDI.
*   `soundfont-player.js`: Librería para la reproducción de audio mediante fuentes de sonido.
*   `recuromemtis/`: (Si existe) Recursos adicionales y memorias del proyecto.

## 🛠️ Tecnologías

*   HTML5
*   CSS3 (Variables CSS, Flexbox/Grid)
*   JavaScript (ES6+)
*   Web Audio API

## 📝 Licencia

Este proyecto es de código abierto. Siéntete libre de usarlo, modificarlo y contribuir.

---
*Creado con ❤️ y colores.*
