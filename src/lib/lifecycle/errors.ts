export function lifecycleErrorMessage(code?: string): string | null {
  if (!code) {
    return null;
  }

  switch (code) {
    case "unauthorized":
      return "You do not have permission to change this Space.";
    case "missing-fields":
      return "Fill in the required fields.";
    case "select-assets":
      return "Select the assets being replaced.";
    case "space-not-found":
      return "That Space could not be found.";
    default:
      return decodeURIComponent(code);
  }
}
