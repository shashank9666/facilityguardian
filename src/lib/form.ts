/**
 * Simple form validation helpers for FM-Nexus.
 */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(pass: string): boolean {
  // 8 chars, at least one number and one uppercase
  return pass.length >= 8 && /[0-9]/.test(pass) && /[A-Z]/.test(pass);
}

export type ValidationErrors = Record<string, string>;

export function validateUserForm(data: any): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!data.name?.trim()) errors.name = "Full Name is required";
  if (!data.email?.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(data.email)) {
    errors.email = "Please enter a valid email address";
  }
  if (!data.id && !data.password) {
    errors.password = "Password is required for new users";
  } else if (data.password && !isValidPassword(data.password)) {
    errors.password = "Password must be 8+ characters with a number and an uppercase letter";
  }
  return errors;
}

export function validateServiceRequestForm(data: any): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!data.title?.trim()) errors.title = "Service Request title is required";
  if (!data.description?.trim()) errors.description = "Detailed description is required";
  if (!data.location?.trim()) errors.location = "Location is required";
  if (!data.severity) errors.severity = "Severity must be selected";
  return errors;
}

export function validateMaintenanceForm(data: any): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!data.title?.trim()) errors.title = "Schedule title is required";
  if (!data.assetId) errors.assetId = "Please select an asset";
  if (!data.nextDue) errors.nextDue = "Next due date is required";
  if (!data.checklist || data.checklist.length === 0) {
    errors.checklist = "At least one task must be added to the checklist";
  } else if (data.checklist.some((c: any) => !c.task?.trim())) {
    errors.checklist = "All checklist tasks must have a description";
  }
  return errors;
}
