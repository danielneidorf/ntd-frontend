let stripePromise: Promise<any> | null = null;

export function getStripe(): Promise<any> {
  if (!stripePromise) {
    stripePromise = new Promise((resolve, reject) => {
      const key = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!key) {
        // No key = stub mode — resolve null, caller handles it
        resolve(null);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        resolve((window as any).Stripe(key));
      };
      script.onerror = () => reject(new Error('Failed to load Stripe.js'));
      document.head.appendChild(script);
    });
  }
  return stripePromise;
}
