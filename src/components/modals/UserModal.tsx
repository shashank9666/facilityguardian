"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { sanitize, cn } from "@/lib/utils";
import type { User, Role } from "@/types";

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<User> & { password?: string }) => Promise<void>;
  user?: User | null;
}

import { validateUserForm, ValidationErrors } from "@/lib/form";

export function UserModal({ open, onClose, onSave, user }: UserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [department, setDepartment] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    setErrors({});
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setDepartment(user.department);
      setActive(user.active);
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setRole("viewer");
      setDepartment("");
      setActive(true);
      setPassword("");
    }
  }, [user, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: any = { 
      name, email, role, department, active, id: user?.id 
    };
    if (password) data.password = password;

    const validation = validateUserForm(data);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setBusy(true);
    setErrors({});
    try {
      await onSave({
        ...data,
        name: sanitize(name),
        department: sanitize(department),
        email: email.trim().toLowerCase()
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={user ? "Edit User" : "Invite New User"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                "w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2",
                errors.name ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:ring-blue-500/20"
              )}
              placeholder="e.g. Rahul Sharma"
            />
            {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2",
                errors.email ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:ring-blue-500/20"
              )}
              placeholder="rahul@fmnexus.in"
            />
            {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>}
          </div>
          {!user && (
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Initial Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2",
                  errors.password ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:ring-blue-500/20"
                )}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-[10px] text-red-500 mt-1">{errors.password}</p>}
              {!errors.password && <p className="text-[10px] text-slate-400 mt-1">Min 8 chars, 1 number, 1 uppercase</p>}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="technician">Technician</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Department</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g. Electrical"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="user-active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="user-active" className="text-sm text-slate-600 font-medium">Account Active</label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={busy}>
            {user ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
