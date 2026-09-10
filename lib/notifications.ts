export function initNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

export function sendBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const notification = new Notification(title, {
      body,
      icon: "/icon",
      tag: title, // collapse rapid duplicate notifications for the same order
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (e) {
    console.error("Failed to show browser notification:", e);
  }
}
