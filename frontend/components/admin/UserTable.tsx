"use client";

import { useState } from "react";
import { Check, Edit2, ShieldOff, ShieldCheck, Trash2, X } from "lucide-react";
import { isAxiosError } from "axios";
import { adminApi } from "@/lib/api/admin.api";
import { Alert } from "@/components/ui/Alert";
import { RoleBadge } from "./RoleBadge";
import { displayName } from "@/lib/utils/roles";
import type { RoleType, User } from "@/types/auth.types";

const ALL_ROLES: RoleType[] = ["ROLE_USER", "ROLE_ADMIN", "ROLE_VENDOR"];

interface UserTableProps {
  users: User[];
  onRefresh: () => void;
}

export function UserTable({ users, onRefresh }: UserTableProps) {
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editRoles, setEditRoles]     = useState<RoleType[]>([]);
  const [loadingId, setLoadingId]     = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const withLoading = async (id: string, fn: () => Promise<void>) => {
    setLoadingId(id);
    setError(null);
    try { await fn(); onRefresh(); }
    catch (err) {
      setError(isAxiosError(err) ? (err.response?.data?.message ?? "Action failed.") : "Action failed.");
    }
    finally { setLoadingId(null); }
  };

  const toggleStatus = (u: User) =>
    withLoading(u.id, () => adminApi.setUserStatus(u.id, !u.enabled));

  const startEdit = (u: User) => { setEditingId(u.id); setEditRoles([...u.roles]); };
  const cancelEdit = () => setEditingId(null);

  const saveRoles = (userId: string) => {
    if (!editRoles.length) { setError("User must have at least one role."); return; }
    withLoading(userId, async () => {
      await adminApi.assignRoles(userId, { roles: editRoles });
      setEditingId(null);
    });
  };

  const deleteUser = (u: User) => {
    if (!confirm(`Delete ${u.email}? This cannot be undone.`)) return;
    withLoading(u.id, () => adminApi.deleteUser(u.id));
  };

  if (!users.length) {
    return <p className="py-10 text-center text-sm text-gray-500">No users found.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <Alert variant="error" message={error} />}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {["User", "Roles", "Status", ""].map((h) => (
                <th key={h} className="pb-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide last:pr-0 last:text-right">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const isEditing = editingId === u.id;
              const isLoading = loadingId === u.id;

              return (
                <tr key={u.id} className="group hover:bg-gray-50 transition-colors">
                  {/* User */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">
                        {(u.firstName?.[0] ?? u.email[0]).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{displayName(u)}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                        {!u.emailVerified && (
                          <span className="inline-block mt-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                            Unverified
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Roles */}
                  <td className="py-3.5 pr-4">
                    {isEditing ? (
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_ROLES.map((role) => (
                          <button
                            key={role}
                            onClick={() => setEditRoles((prev) =>
                              prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
                            )}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                              editRoles.includes(role)
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {role.replace("ROLE_", "")}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles.map((r) => <RoleBadge key={r} role={r as RoleType} />)}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 pr-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                      u.enabled
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-600 border-red-200"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.enabled ? "bg-emerald-500" : "bg-red-500"}`} />
                      {u.enabled ? "Active" : "Disabled"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <IconButton onClick={cancelEdit} disabled={isLoading} label="Cancel" className="text-gray-500 hover:bg-gray-100">
                          <X size={14} />
                        </IconButton>
                        <IconButton onClick={() => saveRoles(u.id)} disabled={isLoading} label="Save" className="text-emerald-600 hover:bg-emerald-50">
                          <Check size={14} />
                        </IconButton>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconButton onClick={() => toggleStatus(u)} disabled={isLoading} label={u.enabled ? "Disable" : "Enable"} className="text-gray-500 hover:bg-amber-50 hover:text-amber-600">
                          {u.enabled ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                        </IconButton>
                        <IconButton onClick={() => startEdit(u)} disabled={isLoading} label="Edit roles" className="text-gray-500 hover:bg-gray-100">
                          <Edit2 size={14} />
                        </IconButton>
                        <IconButton onClick={() => deleteUser(u)} disabled={isLoading} label="Delete" className="text-gray-500 hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IconButton({
  onClick, disabled, label, className, children,
}: {
  onClick: () => void; disabled: boolean; label: string; className: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
