/* =========================================================
   SITE CONFIG · fill this in later, nothing else needs editing
   ========================================================= */
window.SITE_CONFIG = {
  /* Contacts: leave empty to hide. Shown under the form and nowhere else. */
  contacts: {
    email: '',        // e.g. 'hello@studio.com'
    telegram: '',     // e.g. 'studio_bot' (without @)
    phone: ''         // e.g. '+1 555 000 0000'
  },

  /* Form delivery.
     Leave endpoint empty: the form shows its success state and the request goes nowhere (demo mode).
     Set endpoint to a webhook URL (n8n, Make, Zapier, a Cloudflare Worker, your CRM) and every request
     is POSTed there as JSON: { name, company, contact, topic, task, lang, page, sentAt }.
     Never put a Telegram bot token here: this file is public. Send to a webhook that forwards to Telegram. */
  form: {
    endpoint: '',
    successResetMs: 0
  }
};
