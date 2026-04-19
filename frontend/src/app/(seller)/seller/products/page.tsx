"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ImageKit from "imagekit-javascript";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getCategories } from "@/services/catalog";
import { getOccasions, type Occasion } from "@/services/occasions";
import {
  addVariantToProduct,
  createSellerProduct,
  deleteSellerProduct,
  listSellerProducts,
  updateSellerProduct,
  updateVariant,
  updateVariantStock,
} from "@/services/seller-products";
import {
  addProductMedia,
  deleteProductMedia,
  type ProductMedia,
} from "@/services/product-media";
import { compressImageForUpload } from "@/lib/image-compression";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const getMissingImageKitConfig = () => {
  const missing: string[] = [];
  if (!IMAGEKIT_PUBLIC_KEY) missing.push("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY");
  if (!IMAGEKIT_URL_ENDPOINT) missing.push("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT");
  if (!API_BASE_URL) missing.push("NEXT_PUBLIC_API_BASE_URL");
  return missing;
};

const getApprovalBadge = (product: any) => {
  if (product.deletedByAdmin) {
    return {
      label: "REMOVED",
      className: "border-[#A67575]/30 text-[#7A5656] bg-[#A67575]/5",
    };
  }

  const status = String(product.status ?? "PENDING").toUpperCase();
  if (status === "APPROVED") {
    return {
      label: "APPROVED",
      className: "border-[#7B9971]/30 text-[#5A7352] bg-[#7B9971]/5",
    };
  }

  if (status === "REJECTED") {
    return {
      label: "REJECTED",
      className: "border-[#A67575]/30 text-[#7A5656] bg-[#A67575]/5",
    };
  }

  return {
    label: "PENDING",
    className: "border-[#B7956C]/30 text-[#8A7054] bg-[#B7956C]/5",
  };
};

export default function SellerProductsPage() {
  const router = useRouter();
  const [categories, setCategories] = React.useState<
    Array<{ id: string; name: string }>
  >([]);
  const [occasions, setOccasions] = React.useState<Occasion[]>([]);
  const [products, setProducts] = React.useState<Array<any>>([]);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState({
    categoryId: "",
    title: "",
    sellerPrice: "",
    description: "",
    isPublished: false,
    occasionIds: [] as string[],
  });
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [images, setImages] = React.useState<
    Array<{ url: string; fileId: string; name: string }>
  >([]);
  const [uploadingImages, setUploadingImages] = React.useState(false);
  const [variantForm, setVariantForm] = React.useState({
    color: "",
    sku: "",
    price: "",
    compareAtPrice: "",
    initialStock: "",
  });
  const [variantImages, setVariantImages] = React.useState<
    Array<{ url: string; fileId: string; name: string }>
  >([]);
  const [uploadingVariantImages, setUploadingVariantImages] = React.useState(false);
  const [savingVariant, setSavingVariant] = React.useState(false);
  const [activeProductId, setActiveProductId] = React.useState<string | null>(
    null
  );
  const [editingProductId, setEditingProductId] = React.useState<string | null>(
    null
  );
  const [editForm, setEditForm] = React.useState({
    categoryId: "",
    title: "",
    description: "",
    isPublished: false,
    occasionIds: [] as string[],
  });
  const [stockEdits, setStockEdits] = React.useState<Record<string, string>>(
    {}
  );
  const [variantEditsOpen, setVariantEditsOpen] = React.useState<
    Record<string, boolean>
  >({});
  const [expandedVariantGroups, setExpandedVariantGroups] = React.useState<
    Record<string, boolean>
  >({});
  const [variantEdits, setVariantEdits] = React.useState<
    Record<string, { price: string; compareAtPrice: string }>
  >({});

  // Product media state
  const [productMedia, setProductMedia] = React.useState<Record<string, ProductMedia[]>>({});
  const [uploadingMedia, setUploadingMedia] = React.useState(false);

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      getCategories(),
      listSellerProducts(),
      getOccasions(),
    ]);

    const categoryResult = results[0];
    const productResult = results[1];
    const occasionResult = results[2];

    if (categoryResult.status === "fulfilled") {
      setCategories(categoryResult.value.categories ?? []);
    } else {
      toast.error(
        categoryResult.reason instanceof Error
          ? categoryResult.reason.message
          : "Unable to load categories"
      );
      setCategories([]);
    }

    if (productResult.status === "fulfilled") {
      setProducts(productResult.value.products ?? []);
    } else {
      toast.error(
        productResult.reason instanceof Error
          ? productResult.reason.message
          : "Unable to load products"
      );
      setProducts([]);
    }

    if (occasionResult.status === "fulfilled") {
      setOccasions(occasionResult.value.occasions ?? []);
    } else {
      setOccasions([]);
    }

    setLoading(false);
  }, []);

  const imagekit = React.useMemo(() => {
    if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_URL_ENDPOINT || !API_BASE_URL) {
      return null;
    }
    return new ImageKit({
      publicKey: IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    });
  }, []);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreateProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.categoryId || !form.title || !form.sellerPrice) {
      toast.error("Select a category, title, and seller price.");
      return;
    }
    const sellerPriceValue = Number(form.sellerPrice);
    if (Number.isNaN(sellerPriceValue) || sellerPriceValue <= 0) {
      toast.error("Enter a valid seller price.");
      return;
    }
    if (images.length < 1) {
      toast.error("Add at least one product image.");
      return;
    }
    try {
      const result = await createSellerProduct({
        categoryId: form.categoryId,
        title: form.title,
        sellerPrice: sellerPriceValue,
        description: form.description || undefined,
        images: images.map((image) => image.url),
        occasionIds: form.occasionIds.length > 0 ? form.occasionIds : undefined,
      });

      toast.success("Product submitted. After admin approval, add color and size variants.");
      setForm({
        categoryId: "",
        title: "",
        sellerPrice: "",
        description: "",
        isPublished: false,
        occasionIds: [],
      });
      setImages([]);
      setShowCreateModal(false);

      setProducts((prev) => [
        {
          ...result.product,
          category: categories.find((c) => c.id === form.categoryId) ?? null,
          variants: [],
          images: images.map((image) => image.url),
        },
        ...prev,
      ]);
      router.push("/seller/products");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteSellerProduct(productId);
      toast.success("Product deleted.");
      setProducts((prev) => prev.filter((product) => product.id !== productId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleAddVariant = async (productId: string) => {
    if (savingVariant) return;

    if (!variantForm.color || !variantForm.sku || !variantForm.price) {
      toast.error("Enter color, SKU and price.");
      return;
    }

    try {
      setSavingVariant(true);

      const result = await addVariantToProduct(productId, {
        color: variantForm.color,
        images: variantImages.length > 0 ? variantImages.map((image) => image.url) : undefined,
        sku: variantForm.sku,
        price: Number(variantForm.price),
        compareAtPrice: variantForm.compareAtPrice
          ? Number(variantForm.compareAtPrice)
          : undefined,
        initialStock: variantForm.initialStock
          ? Number(variantForm.initialStock)
          : undefined,
      });
      toast.success("Variant added.");
      setVariantForm({ color: "", sku: "", price: "", compareAtPrice: "", initialStock: "" });
      setVariantImages([]);
      setActiveProductId(null);
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? {
              ...product,
              variants: [...(product.variants ?? []), result.variant],
            }
            : product
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Variant failed");
    } finally {
      setSavingVariant(false);
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProductId(product.id);
    setEditForm({
      categoryId: product.categoryId ?? product.category?.id ?? "",
      title: product.title ?? "",
      description: product.description ?? "",
      isPublished: Boolean(product.isPublished),
      occasionIds: product.occasionIds ?? [],
    });
  };

  const handleSaveProduct = async () => {
    if (!editingProductId) return;
    try {
      const result = await updateSellerProduct(editingProductId, {
        categoryId: editForm.categoryId || undefined,
        title: editForm.title || undefined,
        description: editForm.description || undefined,
        occasionIds: editForm.occasionIds,
      });
      toast.success("Product updated.");
      setEditingProductId(null);
      setProducts((prev) =>
        prev.map((product) =>
          product.id === editingProductId
            ? {
              ...product,
              ...result.product,
              category:
                categories.find((c) => c.id === result.product.category?.id) ??
                product.category,
            }
            : product
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  const handleStockChange = async (variantId: string) => {
    const nextStock = Number(stockEdits[variantId]);
    if (Number.isNaN(nextStock) || nextStock < 0) {
      toast.error("Enter a valid stock number.");
      return;
    }
    try {
      const result = await updateVariantStock(variantId, nextStock);
      toast.success("Stock updated.");
      setStockEdits((prev) => ({ ...prev, [variantId]: "" }));
      setProducts((prev) =>
        prev.map((product) => ({
          ...product,
          variants: (product.variants ?? []).map((variant: any) =>
            variant.id === variantId
              ? {
                ...variant,
                inventory: {
                  ...(variant.inventory ?? {}),
                  stock: result.inventory.stock,
                },
              }
              : variant
          ),
        }))
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Stock update failed");
    }
  };

  const handleVariantEditToggle = (variant: any) => {
    setVariantEditsOpen((prev) => ({
      ...prev,
      [variant.id]: !prev[variant.id],
    }));
    setVariantEdits((prev) => ({
      ...prev,
      [variant.id]: {
        price: prev[variant.id]?.price ?? String(variant.price ?? ""),
        compareAtPrice:
          prev[variant.id]?.compareAtPrice ??
          String(variant.compareAtPrice ?? ""),
      },
    }));
  };

  const handleVariantUpdate = async (variantId: string) => {
    const edit = variantEdits[variantId];
    if (!edit?.price) {
      toast.error("Enter a price.");
      return;
    }
    const price = Number(edit.price);
    const compareAt = edit.compareAtPrice
      ? Number(edit.compareAtPrice)
      : null;
    if (Number.isNaN(price)) {
      toast.error("Enter a valid price.");
      return;
    }
    if (compareAt !== null && Number.isNaN(compareAt)) {
      toast.error("Enter a valid compare-at price.");
      return;
    }

    try {
      const result = await updateVariant(variantId, {
        price,
        compareAtPrice: compareAt,
      });
      toast.success("Variant updated.");
      setVariantEditsOpen((prev) => ({ ...prev, [variantId]: false }));
      setProducts((prev) =>
        prev.map((product) => ({
          ...product,
          variants: (product.variants ?? []).map((variant: any) =>
            variant.id === variantId
              ? {
                ...variant,
                price: result.variant.price,
                compareAtPrice: result.variant.compareAtPrice ?? null,
              }
              : variant
          ),
        }))
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  const handleUploadImages = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (!imagekit) {
      const missing = getMissingImageKitConfig();
      toast.error(
        missing.length
          ? `Missing env: ${missing.join(", ")}`
          : "ImageKit is not configured."
      );
      return;
    }

    const remaining = 5 - images.length;
    if (remaining <= 0) {
      toast.error("You can upload up to 5 images.");
      return;
    }

    const limitedFiles = files.slice(0, remaining);
    setUploadingImages(true);

    try {
      for (const file of limitedFiles) {
        const authResponse = await fetch(`${API_BASE_URL}/v1/imagekit/auth`);
        if (!authResponse.ok) {
          const authData = await authResponse.json().catch(() => null);
          const authMessage =
            authData?.message ?? "ImageKit auth failed. Check backend env.";
          toast.error(authMessage);
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
          folder: "/tatvivah/products",
          useUniqueFileName: true,
          signature: authData.signature,
          token: authData.token,
          expire: authData.expire,
        });

        setImages((prev) => [
          ...prev,
          { url: result.url, fileId: result.fileId, name: result.name },
        ]);
      }
      toast.success("Images uploaded.");
    } catch (error) {
      console.error("Image upload failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : (error as any)?.response?.data?.message ??
          (error as any)?.response?.message ??
          (error as any)?.message ??
          "Image upload failed";
      toast.error(message);
    } finally {
      setUploadingImages(false);
      event.target.value = "";
    }
  };

  const handleRemoveImage = (fileId: string) => {
    setImages((prev) => prev.filter((image) => image.fileId !== fileId));
  };

  const handleUploadVariantImages = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (!imagekit) {
      const missing = getMissingImageKitConfig();
      toast.error(
        missing.length
          ? `Missing env: ${missing.join(", ")}`
          : "ImageKit is not configured."
      );
      return;
    }

    const remaining = 8 - variantImages.length;
    if (remaining <= 0) {
      toast.error("You can upload up to 8 variant images.");
      return;
    }

    const limitedFiles = files.slice(0, remaining);
    setUploadingVariantImages(true);

    try {
      for (const file of limitedFiles) {
        const authResponse = await fetch(`${API_BASE_URL}/v1/imagekit/auth`);
        if (!authResponse.ok) {
          const authData = await authResponse.json().catch(() => null);
          const authMessage =
            authData?.message ?? "ImageKit auth failed. Check backend env.";
          toast.error(authMessage);
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
          folder: "/tatvivah/products/variants",
          useUniqueFileName: true,
          signature: authData.signature,
          token: authData.token,
          expire: authData.expire,
        });

        setVariantImages((prev) => [
          ...prev,
          { url: result.url, fileId: result.fileId, name: result.name },
        ]);
      }
      toast.success("Variant images uploaded.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : (error as any)?.response?.data?.message ??
          (error as any)?.response?.message ??
          (error as any)?.message ??
          "Variant image upload failed";
      toast.error(message);
    } finally {
      setUploadingVariantImages(false);
      event.target.value = "";
    }
  };

  const handleRemoveVariantImage = (fileId: string) => {
    setVariantImages((prev) => prev.filter((image) => image.fileId !== fileId));
  };

  const handleUploadMediaForProduct = async (
    productId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !imagekit) return;

    setUploadingMedia(true);
    try {
      for (const file of files.slice(0, 5)) {
        const authResponse = await fetch(`${API_BASE_URL}/v1/imagekit/auth`);
        if (!authResponse.ok) { toast.error("ImageKit auth failed."); return; }
        const authData = (await authResponse.json()) as {
          signature: string; token: string; expire: number;
        };

        const compressedFile = await compressImageForUpload(file);
        const result = await imagekit.upload({
          file: compressedFile,
          fileName: compressedFile.name,
          folder: "/tatvivah/products",
          useUniqueFileName: true,
          signature: authData.signature,
          token: authData.token,
          expire: authData.expire,
        });
        const media = await addProductMedia(productId, {
          type: "IMAGE",
          url: result.url,
        });
        setProductMedia((prev) => ({
          ...prev,
          [productId]: [...(prev[productId] ?? []), media.media],
        }));
      }
      toast.success("Media uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Media upload failed");
    } finally {
      setUploadingMedia(false);
      event.target.value = "";
    }
  };

  const handleDeleteMedia = async (productId: string, mediaId: string) => {
    try {
      await deleteProductMedia(mediaId);
      setProductMedia((prev) => ({
        ...prev,
        [productId]: (prev[productId] ?? []).filter((m) => m.id !== mediaId),
      }));
      toast.success("Media deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const filteredProducts = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product: any) => {
      const title = String(product.title ?? "").toLowerCase();
      const category = String(product.category?.name ?? "").toLowerCase();
      const skuMatch = (product.variants ?? []).some((variant: any) =>
        String(variant.sku ?? "").toLowerCase().includes(query)
      );
      return title.includes(query) || category.includes(query) || skuMatch;
    });
  }, [products, searchQuery]);

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:py-20"
      >
        {/* Header */}
        <div className="space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
            Product Catalog
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
            Manage Your Listings
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Create, edit, and organize your fashion products with care and precision.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} listings in your catalog
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            Add New Product
          </Button>
        </div>

        {/* Search */}
        <div className="border border-border-soft bg-card p-4 flex items-center gap-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by product, category, or SKU..."
            className="border-0 bg-transparent focus-visible:ring-0 h-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Products Grid */}
        <section className="space-y-6">
          {loading ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center border border-border-soft bg-card">
              <p className="text-sm text-muted-foreground">
                No products yet. Create your first listing.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredProducts.map((product: any, index: number) => {
                const isApproved = String(product.status ?? "PENDING").toUpperCase() === "APPROVED";

                return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className={`border border-border-soft bg-card ${product.deletedByAdmin ? "opacity-60" : ""
                    }`}
                >
                  {/* Product Header */}
                  <div className="flex items-start justify-between gap-4 p-6 border-b border-border-soft">
                    <div className="space-y-1">
                      <h3 className="font-serif text-lg font-normal text-foreground">
                        {product.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {product.category?.name ?? "Uncategorized"}
                      </p>
                      <span
                        className={`inline-flex px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider border ${getApprovalBadge(product).className}`}
                      >
                        {getApprovalBadge(product).label}
                      </span>
                      {product.deletedByAdmin ? (
                        <p className="text-xs text-red-600/80 mt-2">
                          Removed by admin{product.deletedByAdminReason ? ` · ${product.deletedByAdminReason}` : ""}
                        </p>
                      ) : null}
                      {String(product.status ?? "PENDING").toUpperCase() === "REJECTED" &&
                        product.rejectionReason ? (
                        <p className="text-xs text-[#7A5656] mt-2">
                          Rejection reason: {product.rejectionReason}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground mt-2">
                        Seller Price: {currency.format(Number(product.sellerPrice ?? 0))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          editingProductId === product.id
                            ? setEditingProductId(null)
                            : handleEditProduct(product)
                        }
                        disabled={product.deletedByAdmin}
                      >
                        {editingProductId === product.id ? "Close" : "Edit"}
                      </Button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={product.deletedByAdmin}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Product Images */}
                    {product.images?.length ? (
                      <div className="flex gap-2">
                        {product.images.slice(0, 3).map((image: string) => (
                          <div
                            key={image}
                            className="h-16 w-16 overflow-hidden border border-border-soft"
                          >
                            <img
                              src={image}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* Edit Form */}
                    {editingProductId === product.id && (
                      <div className="space-y-4 p-4 border border-dashed border-border-soft">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <select
                              className="h-12 w-full border border-border-soft bg-card px-3 text-sm text-foreground"
                              value={editForm.categoryId}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  categoryId: event.target.value,
                                }))
                              }
                              disabled={product.deletedByAdmin}
                            >
                              <option value="">Select category</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={editForm.title}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  title: event.target.value,
                                }))
                              }
                              disabled={product.deletedByAdmin}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={editForm.description}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                description: event.target.value,
                              }))
                            }
                            disabled={product.deletedByAdmin}
                          />
                        </div>
                        {occasions.length > 0 && (
                          <div className="space-y-2">
                            <Label>Occasions</Label>
                            <div className="flex flex-wrap gap-2">
                              {occasions.map((occ) => {
                                const selected = editForm.occasionIds.includes(occ.id);
                                return (
                                  <button
                                    key={occ.id}
                                    type="button"
                                    disabled={product.deletedByAdmin}
                                    onClick={() =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        occasionIds: selected
                                          ? prev.occasionIds.filter((id) => id !== occ.id)
                                          : [...prev.occasionIds, occ.id],
                                      }))
                                    }
                                    className={`px-3 py-1.5 text-xs border transition-colors ${
                                      selected
                                        ? "border-gold bg-gold/10 text-gold"
                                        : "border-border-soft text-muted-foreground hover:border-foreground/30"
                                    }`}
                                  >
                                    {occ.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Product visibility is controlled by admin approval.
                        </p>
                        <Button
                          onClick={handleSaveProduct}
                          disabled={product.deletedByAdmin}
                        >
                          Save Changes
                        </Button>

                        {/* Product Media Management */}
                        <div className="mt-6 space-y-3 pt-4 border-t border-border-soft">
                          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            Product Media
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(productMedia[product.id] ?? []).map((media) => (
                              <div key={media.id} className="relative h-16 w-16 overflow-hidden border border-border-soft group">
                                <Image
                                  src={media.url}
                                  alt="Product media"
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMedia(product.id, media.id)}
                                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label="Remove product media"
                                >
                                  <X className="h-4 w-4 text-white" />
                                </button>
                              </div>
                            ))}
                            <label className="h-16 w-16 flex items-center justify-center border border-dashed border-border-soft text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                              {uploadingMedia ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <span className="text-xl">+</span>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                multiple
                                onChange={(e) => handleUploadMediaForProduct(product.id, e)}
                                disabled={uploadingMedia || product.deletedByAdmin}
                              />
                            </label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Upload additional images via ImageKit. Hover to remove.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Variants */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Variants
                      </p>
                      {product.variants?.length ? (
                        Object.entries(
                          (product.variants ?? []).reduce(
                            (acc: Record<string, any[]>, variant: any) => {
                              const colorLabel = variant.color?.trim() || "Default";
                              if (!acc[colorLabel]) {
                                acc[colorLabel] = [];
                              }
                              acc[colorLabel].push(variant);
                              return acc;
                            },
                            {}
                          )
                        ).map(([colorLabel, colorVariants]) => {
                          const groupKey = `${product.id}:${colorLabel.toLowerCase()}`;
                          const isExpanded =
                            expandedVariantGroups[groupKey] ?? colorVariants.length <= 2;
                          const totalStock = colorVariants.reduce(
                            (sum: number, variant: any) => sum + (variant.inventory?.stock ?? 0),
                            0
                          );

                          return (
                            <div key={groupKey} className="border border-border-soft p-4 space-y-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                    {colorLabel}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {colorVariants.length} variants, total stock {totalStock}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setExpandedVariantGroups((prev) => ({
                                      ...prev,
                                      [groupKey]: !isExpanded,
                                    }))
                                  }
                                >
                                  {isExpanded ? "Collapse" : "Expand"}
                                </Button>
                              </div>

                              {!isExpanded ? (
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  {colorVariants.slice(0, 3).map((variant: any) => (
                                    <span
                                      key={variant.id}
                                      className="inline-flex items-center border border-border-soft px-2 py-1"
                                    >
                                      {variant.sku} · {currency.format(variant.price)} · stock {variant.inventory?.stock ?? 0}
                                    </span>
                                  ))}
                                  {colorVariants.length > 3 ? (
                                    <span className="text-[11px] uppercase tracking-wide">
                                      +{colorVariants.length - 3} more
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {colorVariants.map((variant: any) => (
                                    <div
                                      key={variant.id}
                                      className="border border-border-soft p-4 space-y-4"
                                    >
                                      <div className="flex items-center justify-between gap-4">
                                        <div>
                                          <p className="font-medium text-foreground">
                                            {variant.sku}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Stock: {variant.inventory?.stock ?? 0}
                                            {(variant.inventory?.stock ?? 0) === 0 ? (
                                              <span className="ml-2 inline-flex px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider border border-[#A67575]/30 text-[#7A5656] bg-[#A67575]/5">
                                                Out of Stock
                                              </span>
                                            ) : (variant.inventory?.stock ?? 0) < 10 ? (
                                              <span className="ml-2 inline-flex px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider border border-amber-400/30 text-amber-700 bg-amber-50 dark:border-amber-700/30 dark:text-amber-300 dark:bg-amber-950/30">
                                                Low Stock
                                              </span>
                                            ) : null}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <p className="font-serif text-lg font-light text-foreground">
                                            {currency.format(variant.price)}
                                          </p>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              if (product.deletedByAdmin) return;
                                              handleVariantEditToggle(variant);
                                            }}
                                            disabled={product.deletedByAdmin}
                                          >
                                            {variantEditsOpen[variant.id] ? "Close" : "Edit"}
                                          </Button>
                                        </div>
                                      </div>

                                      {variant.images?.length ? (
                                        <div className="flex flex-wrap gap-2">
                                          {variant.images.slice(0, 4).map((image: string) => (
                                            <img
                                              key={image}
                                              src={image}
                                              alt={variant.color ?? variant.sku}
                                              className="h-12 w-12 border border-border-soft object-cover"
                                            />
                                          ))}
                                        </div>
                                      ) : null}

                                      {variantEditsOpen[variant.id] ? (
                                        <div className="grid gap-3 sm:grid-cols-3 pt-4 border-t border-border-soft">
                                          <div className="space-y-1">
                                            <Label className="text-xs">Price</Label>
                                            <Input
                                              value={variantEdits[variant.id]?.price ?? ""}
                                              onChange={(event) =>
                                                setVariantEdits((prev) => ({
                                                  ...prev,
                                                  [variant.id]: {
                                                    price: event.target.value,
                                                    compareAtPrice:
                                                      prev[variant.id]?.compareAtPrice ?? "",
                                                  },
                                                }))
                                              }
                                              placeholder="Price"
                                              disabled={product.deletedByAdmin}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Compare at</Label>
                                            <Input
                                              value={
                                                variantEdits[variant.id]?.compareAtPrice ??
                                                ""
                                              }
                                              onChange={(event) =>
                                                setVariantEdits((prev) => ({
                                                  ...prev,
                                                  [variant.id]: {
                                                    price: prev[variant.id]?.price ?? "",
                                                    compareAtPrice: event.target.value,
                                                  },
                                                }))
                                              }
                                              placeholder="Compare at"
                                              disabled={product.deletedByAdmin}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Stock</Label>
                                            <Input
                                              value={
                                                stockEdits[variant.id] ??
                                                String(variant.inventory?.stock ?? 0)
                                              }
                                              onChange={(event) =>
                                                setStockEdits((prev) => ({
                                                  ...prev,
                                                  [variant.id]: event.target.value,
                                                }))
                                              }
                                              placeholder="Stock"
                                              disabled={product.deletedByAdmin}
                                            />
                                          </div>
                                          <div className="sm:col-span-3 flex flex-wrap gap-2 pt-2">
                                            <Button
                                              size="sm"
                                              onClick={() => handleVariantUpdate(variant.id)}
                                              disabled={product.deletedByAdmin}
                                            >
                                              Save Pricing
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleStockChange(variant.id)}
                                              disabled={product.deletedByAdmin}
                                            >
                                              Update Stock
                                            </Button>
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">No variants yet.</p>
                      )}
                    </div>

                    {/* Add Variant */}
                    <div className="border border-dashed border-border-soft p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          Add Variant
                        </p>
                        {!isApproved ? (
                          <p className="text-xs text-muted-foreground">
                            Available after admin approval
                          </p>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const shouldOpen = activeProductId !== product.id;
                            setActiveProductId(shouldOpen ? product.id : null);
                            if (shouldOpen) {
                              setVariantForm({
                                color: "",
                                sku: "",
                                price: "",
                                compareAtPrice: "",
                                initialStock: "",
                              });
                              setVariantImages([]);
                            }
                          }}
                          disabled={product.deletedByAdmin || !isApproved}
                        >
                          {activeProductId === product.id ? "Close" : "Open"}
                        </Button>
                      </div>
                      {activeProductId === product.id && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            placeholder="Color (e.g. White)"
                            value={variantForm.color}
                            onChange={(event) =>
                              setVariantForm((prev) => ({
                                ...prev,
                                color: event.target.value,
                              }))
                            }
                            disabled={product.deletedByAdmin}
                          />
                          <Input
                            placeholder="Size / SKU (e.g. M)"
                            value={variantForm.sku}
                            onChange={(event) =>
                              setVariantForm((prev) => ({
                                ...prev,
                                sku: event.target.value,
                              }))
                            }
                            disabled={product.deletedByAdmin}
                          />
                          <Input
                            placeholder="Price"
                            value={variantForm.price}
                            onChange={(event) =>
                              setVariantForm((prev) => ({
                                ...prev,
                                price: event.target.value,
                              }))
                            }
                            disabled={product.deletedByAdmin}
                          />
                          <Input
                            placeholder="Compare at"
                            value={variantForm.compareAtPrice}
                            onChange={(event) =>
                              setVariantForm((prev) => ({
                                ...prev,
                                compareAtPrice: event.target.value,
                              }))
                            }
                            disabled={product.deletedByAdmin}
                          />
                          <Input
                            placeholder="Initial stock"
                            value={variantForm.initialStock}
                            onChange={(event) =>
                              setVariantForm((prev) => ({
                                ...prev,
                                initialStock: event.target.value,
                              }))
                            }
                            disabled={product.deletedByAdmin}
                          />
                          <div className="sm:col-span-2 space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Variant Images</Label>
                              <span className="text-xs text-muted-foreground">
                                {variantImages.length}/8 uploaded
                              </span>
                            </div>
                            <div className="border border-dashed border-border-soft p-3">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleUploadVariantImages}
                                className="hidden"
                                id={`variant-image-upload-${product.id}`}
                                disabled={uploadingVariantImages || product.deletedByAdmin || savingVariant}
                              />
                              <label
                                htmlFor={`variant-image-upload-${product.id}`}
                                className="flex cursor-pointer flex-col items-center gap-2 py-4 text-sm text-muted-foreground transition hover:text-foreground"
                              >
                                {uploadingVariantImages ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Uploading variant images...
                                  </div>
                                ) : (
                                  <span>Click to upload color-wise images</span>
                                )}
                              </label>
                              {variantImages.length > 0 ? (
                                <div className="grid gap-2 grid-cols-4">
                                  {variantImages.map((image) => (
                                    <div
                                      key={image.fileId}
                                      className="group relative overflow-hidden border border-border-soft"
                                    >
                                      <img
                                        src={image.url}
                                        alt={image.name}
                                        className="h-16 w-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveVariantImage(image.fileId)}
                                        className="absolute right-1 top-1 rounded-full bg-charcoal/60 p-1 text-ivory opacity-0 transition group-hover:opacity-100"
                                        aria-label="Remove variant image"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <Button
                            className="sm:col-span-2"
                            onClick={() => handleAddVariant(product.id)}
                            disabled={product.deletedByAdmin || savingVariant}
                          >
                            {savingVariant ? (
                              <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                              </span>
                            ) : (
                              "Save Variant"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
              })}
            </div>
          )}
        </section>
      </motion.div>

      {/* Create Product Modal */}
      <AnimatePresence>
        {showCreateModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl border border-border-soft bg-card p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
                    New Product
                  </p>
                  <h2 className="font-serif text-2xl font-light text-foreground">
                    Create a Listing
                  </h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form className="space-y-6" onSubmit={handleCreateProduct}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      className="h-12 w-full border border-border-soft bg-card px-3 text-sm text-foreground"
                      value={form.categoryId}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          categoryId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={form.title}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                      placeholder="Premium linen kurta"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Seller Price</Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      value={form.sellerPrice}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, sellerPrice: event.target.value }))
                      }
                      placeholder="Enter your selling price"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Base product is submitted first. After admin approval you can add color, size, SKU, images and per-size pricing.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Fabric details, fit, and highlights"
                  />
                </div>
                {occasions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Occasions (optional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {occasions.map((occ) => {
                        const selected = form.occasionIds.includes(occ.id);
                        return (
                          <button
                            key={occ.id}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                occasionIds: selected
                                  ? prev.occasionIds.filter((id) => id !== occ.id)
                                  : [...prev.occasionIds, occ.id],
                              }))
                            }
                            className={`px-3 py-1.5 text-xs border transition-colors ${
                              selected
                                ? "border-gold bg-gold/10 text-gold"
                                : "border-border-soft text-muted-foreground hover:border-foreground/30"
                            }`}
                          >
                            {occ.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  New products are submitted for admin approval before going live.
                </p>

                {/* Image Upload */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Product Images</Label>
                    <span className="text-xs text-muted-foreground">
                      {images.length}/5 uploaded
                    </span>
                  </div>
                  <div className="border border-dashed border-border-soft p-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleUploadImages}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <label
                      htmlFor="product-image-upload"
                      className="flex cursor-pointer flex-col items-center gap-2 py-6 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {uploadingImages ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading images...
                        </div>
                      ) : (
                        <span>Click to upload images (1-5)</span>
                      )}
                    </label>
                    {images.length > 0 && (
                      <div className="mt-4 grid gap-3 grid-cols-3">
                        {images.map((image) => (
                          <div
                            key={image.fileId}
                            className="group relative overflow-hidden border border-border-soft"
                          >
                            <img
                              src={image.url}
                              alt={image.name}
                              className="h-20 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(image.fileId)}
                              className="absolute right-2 top-2 rounded-full bg-charcoal/60 p-1 text-ivory opacity-0 transition group-hover:opacity-100"
                              aria-label="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <Button type="submit" disabled={uploadingImages}>
                    Create Product
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
