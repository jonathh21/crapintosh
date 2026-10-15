// Progressive enhancement for Formspree forms: submit via fetch and show the
// result inline. Without JS, forms still work as a normal POST to Formspree.
// Usage: <form data-formspree data-success="Thanks!" action="https://formspree.io/f/..."> with a .status element.
document.querySelectorAll<HTMLFormElement>('form[data-formspree]').forEach((form) => {
  const status = form.querySelector<HTMLElement>('.status')!;
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    status.classList.remove('error');
    status.textContent = 'Sending...';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) {
        // Formspree returns { errors: [{ message, field? }] } on failure.
        const body = await res.json().catch(() => null);
        const messages = body?.errors?.map((e: { message: string }) => e.message).join(' ');
        throw new Error(messages || `HTTP ${res.status}`);
      }
      form.reset();
      status.textContent = form.dataset.success ?? 'Thanks!';
    } catch (err) {
      status.classList.add('error');
      status.textContent = `Error: ${err instanceof Error ? err.message : 'something went wrong'}. Please try again.`;
    } finally {
      button.disabled = false;
    }
  });
});
