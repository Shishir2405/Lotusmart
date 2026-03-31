"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RiSearchLine, RiShieldUserLine, RiUserLine } from "react-icons/ri";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/utils/helpers";
import { useDebounce } from "@/hooks/useDebounce";
import axios from "axios";
import toast from "react-hot-toast";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  isVerified: boolean;
  createdAt: string;
  phone?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(roleFilter !== "all" && { role: roleFilter }),
    });
    axios
      .get<{ data: User[]; pagination: { totalPages: number; total: number } }>(`/api/admin/users?${params}`)
      .then((r) => {
        setUsers(r.data.data);
        setTotalPages(r.data.pagination.totalPages);
        setTotal(r.data.pagination.total);
      })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, roleFilter]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{total} registered users</p>
        </div>
      </div>

      
      <div className="bg-white rounded-2xl border border-neutral-100 mb-5 p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-[#F7F6F0] rounded-xl px-3 py-2 flex-1 min-w-48">
          <RiSearchLine className="text-neutral-400" size={16} />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </div>
        <div className="flex gap-2">
          {["all", "customer", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${roleFilter === r ? "bg-[#E84672] text-white" : "bg-[#F7F6F0] text-neutral-600 hover:bg-neutral-200"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9" rounded="full" />
                        <div><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-44" /></div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-16" rounded="full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20" rounded="full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))
              : users.map((user) => (
                  <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E84672] to-[#C9305A] flex items-center justify-center text-sm font-bold text-white shrink-0">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{user.name}</p>
                          <p className="text-xs text-neutral-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-600">{user.phone ?? "—"}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-[#FFF1F3] text-[#E84672]" : "bg-[#F7F6F0] text-[#7A6E42]"}`}>
                        {user.role === "admin" ? <RiShieldUserLine size={11} /> : <RiUserLine size={11} />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={user.isVerified ? "success" : "warning"} dot>
                        {user.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-500">{formatDate(user.createdAt)}</td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-xl border border-neutral-200 text-sm disabled:opacity-40 hover:border-neutral-300 transition-colors">Previous</button>
          <span className="text-sm text-neutral-500">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-xl border border-neutral-200 text-sm disabled:opacity-40 hover:border-neutral-300 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}
