/* ===================================================================
   Clínica Dental Torres — Landing Page
   Lógica: WhatsApp, formulario, contador de plazas, exit-intent
   =================================================================== */

/* ------------------------------------------------------------------
   CONFIGURACIÓN  ←  EDITA AQUÍ
   ------------------------------------------------------------------ */
const CONFIG = {
  // Número de WhatsApp en formato internacional, SIN "+", espacios ni guiones.
  // Ejemplo España: 34 + número  ->  "34600000000"
  whatsappNumber: "34600000000",

  // Mensaje precargado que se abre en WhatsApp
  whatsappMessage:
    "Hola, vengo desde la web y me gustaría reservar mi valoración gratuita de estética dental. ¿Qué días tenéis disponibles?",

  // Plazas iniciales mostradas en el contador (se ajusta solo a lo largo del día)
  plazasIniciales: 3,
};

/* ------------------------------------------------------------------
   WhatsApp: construye el enlace y lo asigna a todos los CTA .js-whatsapp
   ------------------------------------------------------------------ */
(function initWhatsApp() {
  const url =
    "https://wa.me/" +
    CONFIG.whatsappNumber +
    "?text=" +
    encodeURIComponent(CONFIG.whatsappMessage);

  document.querySelectorAll(".js-whatsapp").forEach((el) => {
    el.setAttribute("href", url);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });
})();

/* ------------------------------------------------------------------
   Año dinámico en el footer
   ------------------------------------------------------------------ */
(function initYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

/* ------------------------------------------------------------------
   Contador de plazas (sutil, baja según la hora del día)
   ------------------------------------------------------------------ */
(function initPlazas() {
  const promo = document.getElementById("promoBar");
  if (!promo) return;

  const hora = new Date().getHours();
  let plazas = CONFIG.plazasIniciales;
  if (hora >= 13) plazas = Math.max(1, plazas - 1);
  if (hora >= 18) plazas = Math.max(1, plazas - 1);

  const counter = document.createElement("span");
  counter.className = "promo-counter";
  counter.innerHTML =
    " · <strong>Quedan " +
    plazas +
    (plazas === 1 ? " plaza" : " plazas") +
    "</strong> esta semana";
  promo.querySelector("span").appendChild(counter);
})();

/* ------------------------------------------------------------------
   Formulario de contacto (lead): valida y abre WhatsApp con los datos
   ------------------------------------------------------------------ */
(function initForm() {
  const form = document.getElementById("leadForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const nombre = form.nombre.value.trim();
    const telefono = form.telefono.value.trim();

    if (!nombre || telefono.replace(/\D/g, "").length < 6) {
      form.reportValidity();
      return;
    }

    // Mensaje personalizado con los datos del formulario
    const msg =
      "Hola, soy " +
      nombre +
      ". Vengo desde la web y me gustaría reservar mi valoración gratuita de estética dental. " +
      "Mi teléfono es " +
      telefono +
      ". ¿Qué días tenéis disponibles?";

    const url =
      "https://wa.me/" +
      CONFIG.whatsappNumber +
      "?text=" +
      encodeURIComponent(msg);

    const success = document.getElementById("formSuccess");
    if (success) {
      success.hidden = false;
      const link = success.querySelector("a");
      if (link) {
        link.setAttribute("href", url);
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
      }
    }

    // Abre WhatsApp en una nueva pestaña con los datos rellenados
    window.open(url, "_blank", "noopener");

    // Aquí podrías integrar tu CRM / píxel / API:
    // fetch("/api/lead", { method: "POST", body: JSON.stringify({ nombre, telefono }) });

    form.reset();
  });
})();

/* ------------------------------------------------------------------
   Pop-up exit-intent (escritorio) + fallback de scroll (móvil)
   Se muestra una sola vez por sesión.
   ------------------------------------------------------------------ */
(function initExitPopup() {
  const popup = document.getElementById("exitPopup");
  const close = document.getElementById("exitClose");
  if (!popup) return;

  const SHOWN_KEY = "torres_exit_shown";
  let shown = sessionStorage.getItem(SHOWN_KEY) === "1";

  function open() {
    if (shown) return;
    shown = true;
    sessionStorage.setItem(SHOWN_KEY, "1");
    popup.hidden = false;
  }

  function hide() {
    popup.hidden = true;
  }

  // Escritorio: el cursor sale por la parte superior de la ventana
  document.addEventListener("mouseout", function (e) {
    if (!e.relatedTarget && e.clientY <= 0) open();
  });

  // Móvil: tras un scroll considerable y pasados unos segundos
  let deepScroll = false;
  window.addEventListener(
    "scroll",
    function () {
      const reached =
        window.scrollY + window.innerHeight >
        document.body.scrollHeight * 0.55;
      if (reached) deepScroll = true;
    },
    { passive: true }
  );
  setTimeout(function () {
    if (deepScroll) open();
  }, 25000);

  close && close.addEventListener("click", hide);
  popup.addEventListener("click", function (e) {
    if (e.target === popup) hide();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !popup.hidden) hide();
  });
})();
