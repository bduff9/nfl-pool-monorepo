self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "2",
        url: data.url,
      },
      icon: data.icon || "/football.png",
      vibrate: [100, 50, 100],
    };

    if (data.tag) {
      options.tag = data.tag;
    }

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Same-origin only, so a payload can never send the user to another site
const resolveTargetUrl = (url) => {
  try {
    const target = new URL(url || "/", self.location.origin);

    return target.origin === self.location.origin ? target.href : self.location.origin;
  } catch {
    return self.location.origin;
  }
};

// Only controlled windows can be navigated, so fall back to opening the destination directly
const navigateWindow = async (client, targetUrl) => {
  const focused = await client.focus();

  if (!focused || focused.url === targetUrl) {
    return focused;
  }

  try {
    return await focused.navigate(targetUrl);
  } catch {
    return clients.openWindow(targetUrl);
  }
};

const openOrFocus = async (targetUrl) => {
  const windowClients = await clients.matchAll({ includeUncontrolled: true, type: "window" });
  const existing = windowClients.find((client) => new URL(client.url).origin === self.location.origin);

  return existing ? navigateWindow(existing, targetUrl) : clients.openWindow(targetUrl);
};

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(openOrFocus(resolveTargetUrl(event.notification.data?.url)));
});
