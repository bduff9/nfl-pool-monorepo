self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "2",
      },
      icon: data.icon || "/football.png",
      vibrate: [100, 50, 100],
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("https://nfl.asitewithnoname.com/"));
});
