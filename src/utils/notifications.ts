export function requestNotificationPermission() {
  if (typeof Notification === "undefined") return;

  if (Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      console.log("🛂 Notifikasi diizinkan?", permission);
    });
  }
}
