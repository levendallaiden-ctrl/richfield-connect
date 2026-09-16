// Returns up to two initials from a full name — first + last.
// Falls back to a single initial for a one-word name, and '?' if empty.
export function getInitials(fullName) {
  if (!fullName || !fullName.trim()) return '?';

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}