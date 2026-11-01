export class DateUtils {
  static formatRelative(dateString) {
    if (!dateString) return "Reciente";
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return "Hace un momento";
    if (diffSeconds < 3600) return `Hace ${Math.floor(diffSeconds / 60)} min`;
    if (diffSeconds < 86400) return `Hace ${Math.floor(diffSeconds / 3600)} h`;
    return `Hace ${Math.floor(diffSeconds / 86400)} d`;
  }
}
