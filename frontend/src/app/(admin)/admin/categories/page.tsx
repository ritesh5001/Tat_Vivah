"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
  toggleAdminCategory,
  type AdminCategory,
  type CreateCategoryPayload,
  type UpdateCategoryPayload,
} from "@/services/admin";
import { toast } from "sonner";
import { X } from "lucide-react";

const emptyForm: CreateCategoryPayload = {
  name: "",
  description: "",
  image: "",
  bannerImage: "",
  parentId: undefined,
  sortOrder: 0,
  seoTitle: "",
  seoDescription: "",
};

export default function AdminCategoriesPage() {
  const [loading, setLoading] = React.useState(true);
  const [categories, setCategories] = React.useState<AdminCategory[]>([]);
  const [saving, setSaving] = React.useState(false);

  // Create modal
  const [showCreate, setShowCreate] = React.useState(false);
  const [createForm, setCreateForm] = React.useState<CreateCategoryPayload>({ ...emptyForm });

  // Edit modal
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<UpdateCategoryPayload>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminCategories();
      setCategories(result.categories ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!createForm.name?.trim()) { toast.error("Name is required."); return; }
    setSaving(true);
    try {
      await createAdminCategory({ ...createForm, name: createForm.name.trim() });
      toast.success("Category created.");
      setCreateForm({ ...emptyForm });
      setShowCreate(false);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create category");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (cat: AdminCategory) => {
    setEditingId(cat.id);
    setEditForm({
      name: cat.name,
      description: cat.description ?? "",
      image: cat.image ?? "",
      bannerImage: cat.bannerImage ?? "",
      parentId: cat.parentId ?? undefined,
      sortOrder: cat.sortOrder ?? 0,
      seoTitle: cat.seoTitle ?? "",
      seoDescription: cat.seoDescription ?? "",
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateAdminCategory(editingId, editForm);
      toast.success("Category updated.");
      setEditingId(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update category");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleAdminCategory(id);
      toast.success("Category toggled.");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to toggle category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    try {
      await deleteAdminCategory(id);
      toast.success("Category deleted.");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete category");
    }
  };

  // Shared form fields component
  const CategoryFormFields = ({
    values,
    onChange,
    parentOptions,
    excludeId,
  }: {
    values: Record<string, any>;
    onChange: (field: string, value: any) => void;
    parentOptions: AdminCategory[];
    excludeId?: string;
  }) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name *</Label>
        <Input value={values.name ?? ""} onChange={(e) => onChange("name", e.target.value)} className="mt-1 h-11" placeholder="Category name" />
      </div>
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
        <Textarea value={values.description ?? ""} onChange={(e) => onChange("description", e.target.value)} className="mt-1" rows={3} placeholder="Brief description..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Image URL</Label>
          <Input value={values.image ?? ""} onChange={(e) => onChange("image", e.target.value)} className="mt-1 h-11" placeholder="https://..." />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Banner Image URL</Label>
          <Input value={values.bannerImage ?? ""} onChange={(e) => onChange("bannerImage", e.target.value)} className="mt-1 h-11" placeholder="https://..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Parent Category</Label>
          <select
            value={values.parentId ?? ""}
            onChange={(e) => onChange("parentId", e.target.value || undefined)}
            className="mt-1 flex h-11 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">None (Top Level)</option>
            {parentOptions
              .filter((c) => c.id !== excludeId)
              .map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sort Order</Label>
          <Input type="number" value={values.sortOrder ?? 0} onChange={(e) => onChange("sortOrder", Number(e.target.value))} className="mt-1 h-11" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">SEO Title</Label>
          <Input value={values.seoTitle ?? ""} onChange={(e) => onChange("seoTitle", e.target.value)} className="mt-1 h-11" placeholder="SEO page title" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">SEO Description</Label>
          <Input value={values.seoDescription ?? ""} onChange={(e) => onChange("seoDescription", e.target.value)} className="mt-1 h-11" placeholder="Meta description" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16 lg:py-20"
      >
        <div className="flex items-end justify-between">
          <div className="space-y-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Catalog Settings</p>
            <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">Category Management</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">Create, edit, or deactivate product categories across the platform.</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="h-11 px-6">+ New Category</Button>
        </div>

        {/* Category list */}
        <div className="border border-border-soft bg-card">
          <div className="border-b border-border-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-1">Catalog</p>
                <p className="font-serif text-lg font-light text-foreground">All Categories</p>
              </div>
              <p className="text-sm text-muted-foreground">{categories.length} total</p>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center"><p className="text-sm text-muted-foreground">Loading categories...</p></div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center"><p className="text-sm text-muted-foreground">No categories yet.</p></div>
          ) : (
            <div className="divide-y divide-border-soft">
              {categories.map((category) => (
                <div key={category.id} className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-foreground">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.slug}
                      {category.description ? ` · ${category.description.slice(0, 60)}...` : ""}
                      {category.parentId ? ` · Child of ${categories.find((c) => c.id === category.parentId)?.name ?? "..."}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 text-[10px] uppercase tracking-wider border ${category.isActive ? "border-[#7B9971]/30 text-[#5A7352] bg-[#7B9971]/5" : "border-[#A67575]/30 text-[#7A5656] bg-[#A67575]/5"}`}>
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => openEdit(category)}>Edit</Button>
                    <Button size="sm" variant="outline" className={category.isActive ? "border-[#A67575]/40 text-[#7A5656]" : "border-[#7B9971]/40 text-[#5A7352]"} onClick={() => handleToggle(category.id)}>
                      {category.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-300/40 text-red-600" onClick={() => handleDelete(category.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border-soft bg-card p-6 shadow-xl">
              <button onClick={() => setShowCreate(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              <h2 className="font-serif text-2xl font-light text-foreground mb-6">New Category</h2>
              <CategoryFormFields
                values={createForm}
                onChange={(field, value) => setCreateForm((prev) => ({ ...prev, [field]: value }))}
                parentOptions={categories}
              />
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={saving}>{saving ? "Saving..." : "Create"}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border-soft bg-card p-6 shadow-xl">
              <button onClick={() => setEditingId(null)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              <h2 className="font-serif text-2xl font-light text-foreground mb-6">Edit Category</h2>
              <CategoryFormFields
                values={editForm}
                onChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
                parentOptions={categories}
                excludeId={editingId}
              />
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={saving}>{saving ? "Saving..." : "Update"}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
