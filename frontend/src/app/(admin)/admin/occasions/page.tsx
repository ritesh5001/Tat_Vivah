"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ImageKit from "imagekit-javascript";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAdminOccasion,
  deleteAdminOccasion,
  getAdminOccasions,
  updateAdminOccasion,
  toggleAdminOccasion,
  type AdminOccasion,
  type CreateOccasionPayload,
  type UpdateOccasionPayload,
} from "@/services/admin";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { compressImageForUpload } from "@/lib/image-compression";

const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const emptyForm: CreateOccasionPayload = {
  name: "",
  image: "",
};

export default function AdminOccasionsPage() {
  const [loading, setLoading] = React.useState(true);
  const [occasions, setOccasions] = React.useState<AdminOccasion[]>([]);
  const [saving, setSaving] = React.useState(false);

  // Create modal
  const [showCreate, setShowCreate] = React.useState(false);
  const [createForm, setCreateForm] = React.useState<CreateOccasionPayload>({ ...emptyForm });
  const [uploadingCreateImage, setUploadingCreateImage] = React.useState(false);

  // Edit modal
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<UpdateOccasionPayload>({});
  const [uploadingEditImage, setUploadingEditImage] = React.useState(false);

  const imagekit = React.useMemo(() => {
    if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_URL_ENDPOINT || !API_BASE_URL) return null;
    return new ImageKit({
      publicKey: IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    });
  }, []);

  const uploadOccasionImage = React.useCallback(
    async ({ file, mode }: { file: File; mode: "create" | "edit" }) => {
      if (!imagekit) {
        toast.error("ImageKit is not configured.");
        return;
      }

      const setUploading = mode === "create" ? setUploadingCreateImage : setUploadingEditImage;

      try {
        setUploading(true);
        const authResponse = await fetch(`${API_BASE_URL}/v1/imagekit/auth`);
        if (!authResponse.ok) {
          toast.error("ImageKit auth failed.");
          return;
        }

        const authData = (await authResponse.json()) as {
          signature: string;
          token: string;
          expire: number;
        };

        const compressedFile = await compressImageForUpload(file);
        const result = await imagekit.upload({
          file: compressedFile,
          fileName: compressedFile.name,
          folder: "/tatvivah/occasions",
          useUniqueFileName: true,
          signature: authData.signature,
          token: authData.token,
          expire: authData.expire,
        });

        if (mode === "create") {
          setCreateForm((prev) => ({ ...prev, image: result.url }));
        } else {
          setEditForm((prev) => ({ ...prev, image: result.url }));
        }

        toast.success("Occasion image uploaded.");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Image upload failed";
        toast.error(message);
      } finally {
        setUploading(false);
      }
    },
    [imagekit]
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminOccasions();
      setOccasions(result.occasions ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load occasions");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!createForm.name?.trim()) { toast.error("Name is required."); return; }
    setSaving(true);
    try {
      await createAdminOccasion({
        name: createForm.name.trim(),
        image: createForm.image?.trim() || undefined,
      });
      toast.success("Occasion created.");
      setCreateForm({ ...emptyForm });
      setShowCreate(false);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create occasion");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (occ: AdminOccasion) => {
    setEditingId(occ.id);
    setEditForm({
      name: occ.name,
      image: occ.image ?? "",
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateAdminOccasion(editingId, {
        ...editForm,
        image: editForm.image === "" ? null : editForm.image,
      });
      toast.success("Occasion updated.");
      setEditingId(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update occasion");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleAdminOccasion(id);
      toast.success("Occasion toggled.");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to toggle occasion");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this occasion? Products linked to it will be unlinked.")) return;
    try {
      await deleteAdminOccasion(id);
      toast.success("Occasion deleted.");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete occasion");
    }
  };

  const OccasionFormFields = ({
    values,
    onChange,
    onUpload,
    uploading,
  }: {
    values: Record<string, any>;
    onChange: (field: string, value: any) => void;
    onUpload: (file: File) => void;
    uploading: boolean;
  }) => (
    <div className="space-y-4">
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name *</Label>
        <Input value={values.name ?? ""} onChange={(e) => onChange("name", e.target.value)} className="mt-1 h-11" placeholder="e.g. Wedding, Diwali, Haldi..." />
      </div>
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Occasion Image</Label>
        <div className="mt-1 space-y-2">
          <Input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.currentTarget.value = "";
            }}
            className="h-11"
          />
          {uploading && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...
            </p>
          )}
          {values.image ? (
            <div className="space-y-2">
              <img src={values.image} alt="Occasion" className="h-24 w-full border border-border-soft object-cover" />
              <Button type="button" variant="outline" size="sm" onClick={() => onChange("image", "")}>Remove Image</Button>
            </div>
          ) : null}
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
            <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">Occasion Management</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">Create and manage shopping occasions like Wedding, Diwali, Haldi, etc.</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="h-11 px-6">+ New Occasion</Button>
        </div>

        {/* Occasion list */}
        <div className="border border-border-soft bg-card">
          <div className="border-b border-border-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-1">Shop by Occasion</p>
                <p className="font-serif text-lg font-light text-foreground">All Occasions</p>
              </div>
              <p className="text-sm text-muted-foreground">{occasions.length} total</p>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center"><p className="text-sm text-muted-foreground">Loading occasions...</p></div>
          ) : occasions.length === 0 ? (
            <div className="p-8 text-center"><p className="text-sm text-muted-foreground">No occasions yet.</p></div>
          ) : (
            <div className="divide-y divide-border-soft">
              {occasions.map((occasion) => (
                <div key={occasion.id} className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {occasion.image && (
                      <img src={occasion.image} alt={occasion.name} className="h-12 w-12 rounded border border-border-soft object-cover" />
                    )}
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{occasion.name}</p>
                      <p className="text-xs text-muted-foreground">{occasion.slug}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 text-[10px] uppercase tracking-wider border ${occasion.isActive ? "border-[#7B9971]/30 text-[#5A7352] bg-[#7B9971]/5" : "border-[#A67575]/30 text-[#7A5656] bg-[#A67575]/5"}`}>
                      {occasion.isActive ? "Active" : "Inactive"}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => openEdit(occasion)}>Edit</Button>
                    <Button size="sm" variant="outline" className={occasion.isActive ? "border-[#A67575]/40 text-[#7A5656]" : "border-[#7B9971]/40 text-[#5A7352]"} onClick={() => handleToggle(occasion.id)}>
                      {occasion.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-300/40 text-red-600" onClick={() => handleDelete(occasion.id)}>Delete</Button>
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
              <h2 className="font-serif text-2xl font-light text-foreground mb-6">New Occasion</h2>
              <OccasionFormFields
                values={createForm}
                onChange={(field, value) => setCreateForm((prev) => ({ ...prev, [field]: value }))}
                onUpload={(file) => uploadOccasionImage({ file, mode: "create" })}
                uploading={uploadingCreateImage}
              />
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={saving || uploadingCreateImage}>{saving ? "Saving..." : "Create"}</Button>
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
              <h2 className="font-serif text-2xl font-light text-foreground mb-6">Edit Occasion</h2>
              <OccasionFormFields
                values={editForm}
                onChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
                onUpload={(file) => uploadOccasionImage({ file, mode: "edit" })}
                uploading={uploadingEditImage}
              />
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={saving || uploadingEditImage}>{saving ? "Saving..." : "Update"}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
