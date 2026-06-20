# Landing Page — Clínica Dental Torres

Landing page de captación (funnel) para estética dental: carillas, diseño de
sonrisa y blanqueamiento profesional en Las Palmas de Gran Canaria.

Página estática (HTML + CSS + JS, sin dependencias ni build). Lista para
publicar en cualquier hosting o en GitHub Pages.

## Archivos

| Archivo       | Contenido |
|---------------|-----------|
| `index.html`  | Estructura y copy de las 12 secciones + SEO y datos estructurados |
| `styles.css`  | Estilos (paleta premium: petróleo, dorado, beige, menta) |
| `script.js`   | WhatsApp, formulario, contador de plazas y pop-up exit-intent |

## ⚙️ Configuración (importante)

Antes de publicar, abre `script.js` y edita el objeto `CONFIG` al principio:

```js
const CONFIG = {
  whatsappNumber: "34600000000", // ← TU número con prefijo país, sin + ni espacios
  whatsappMessage: "Hola, vengo desde la web...", // mensaje precargado
  plazasIniciales: 3,            // contador de plazas mostrado
};
```

- **`whatsappNumber`**: formato internacional sin `+`. España = `34` + número.
  Ejemplo: para `+34 600 00 00 00` pon `"34600000000"`.

Todos los botones de WhatsApp (hero, secciones, flotante, sticky móvil,
pop-up) y el formulario usan ese número automáticamente.

## Funcionalidad incluida

- **CTA WhatsApp** con mensaje precargado en todos los botones `.js-whatsapp`.
- **Formulario de contacto**: valida nombre + teléfono y abre WhatsApp con los
  datos del paciente ya escritos. (Hay un punto marcado en `script.js` para
  conectar tu CRM, píxel o API si lo deseas.)
- **Elementos CRO**: banner sticky superior, barra de confianza sticky,
  contador de plazas, botón flotante de WhatsApp, sticky bar inferior en móvil
  y pop-up exit-intent (escritorio y móvil, una vez por sesión).
- **SEO**: título y meta description optimizados, Open Graph y datos
  estructurados `schema.org/Dentist`.
- **Responsive** y accesible (respeta `prefers-reduced-motion`).

## Ver en local

Solo tienes que abrir `index.html` en el navegador. Para servirlo en local:

```bash
python3 -m http.server 8000
# y abre http://localhost:8000
```

## Pendiente de personalizar

- Sustituir los marcadores de **fotos** (hero, casos antes/después, equipo,
  Dr. Torres) por imágenes reales. Los casos usan un *placeholder* visual.
- Añadir el `og:image` real (`og-image.jpg`) y el dominio definitivo en las
  etiquetas `canonical` / Open Graph.
- Revisar textos legales del footer (aviso legal, privacidad, cookies).

## Recursos de marketing (en la documentación del proyecto)

El brief incluye además: 10 titulares alternativos para A/B testing, 10 CTAs
alternativos y recomendaciones visuales por sección. Úsalos para iterar sobre
la conversión.
