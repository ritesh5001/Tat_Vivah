"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Image as ImageIcon, X, ThumbsUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchProductReviews,
  submitProductReview,
  markReviewHelpful,
  type Review,
  type ReviewSummary,
} from "@/services/reviews";
import { toast } from "sonner";
import Image from "next/image";

interface ProductReviewsProps {
    productId: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
  { value: "helpful", label: "Most Helpful" },
];

export default function ProductReviews({ productId }: ProductReviewsProps) {
    const { user, token } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [summary, setSummary] = useState<ReviewSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pagination & sort
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sort, setSort] = useState("newest");

    // Form state
    const [rating, setRating] = useState(0);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [showForm, setShowForm] = useState(false);

    const loadReviews = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchProductReviews(productId, { page, limit: 10, sort });
            setReviews(data.reviews ?? []);
            setSummary(data.summary ?? null);
            setTotalPages(Math.max(1, data.pagination?.totalPages ?? 1));
        } catch (error) {
            console.error("Failed to load reviews", error);
        } finally {
            setIsLoading(false);
        }
    }, [productId, page, sort]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            toast.error("Please login to submit a review");
            return;
        }

        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        if (!comment.trim()) {
            toast.error("Please write a review");
            return;
        }

        setIsSubmitting(true);
        try {
            await submitProductReview(
                productId,
                { rating, comment: comment.trim(), title: title.trim() || undefined },
                token
            );
            toast.success("Review submitted successfully");
            setShowForm(false);
            setRating(0);
            setTitle("");
            setComment("");
            setImages([]);
            setPage(1);
            loadReviews();
        } catch (error: any) {
            toast.error(error.message || "Failed to submit review");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleHelpful = async (reviewId: string) => {
        if (!token) {
            toast.error("Please login to mark as helpful");
            return;
        }
        try {
            const result = await markReviewHelpful(reviewId, token);
            setReviews((prev) =>
                prev.map((r) =>
                    r.id === reviewId ? { ...r, helpfulCount: result.helpfulCount } : r
                )
            );
        } catch (error: any) {
            toast.error(error.message || "Failed to mark as helpful");
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        if (images.length + files.length > 3) {
            toast.error("Maximum 3 images allowed");
            return;
        }

        for (let i = 0; i < files.length; i++) {
            if (files[i].size > 2 * 1024 * 1024) {
                toast.error(`Image ${files[i].name} exceeds 2MB limit`);
                return;
            }
        }

        toast.info("Image upload simulated (mock URLs used)");
        const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
        setImages([...images, ...newImages]);
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const canReview = user && user.role === "USER";

    // Rating distribution bar
    const RatingBar = ({ star, count, total }: { star: number; count: number; total: number }) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
            <div className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right text-muted-foreground">{star}</span>
                <span className="text-yellow-400">★</span>
                <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right text-muted-foreground">{count}</span>
            </div>
        );
    };

    return (
        <div className="space-y-8 py-10" id="reviews">
            {/* Summary */}
            {summary && summary.totalReviews > 0 && (
                <div className="flex flex-col sm:flex-row gap-8 p-6 border rounded-lg bg-card">
                    <div className="flex flex-col items-center justify-center gap-1 min-w-30">
                        <p className="text-4xl font-light">{summary.averageRating.toFixed(1)}</p>
                        <div className="flex text-yellow-400 text-lg">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i}>{i < Math.round(summary.averageRating) ? "★" : "☆"}</span>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{summary.totalReviews} reviews</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => (
                            <RatingBar
                                key={star}
                                star={star}
                                count={summary.ratingDistribution[star] ?? 0}
                                total={summary.totalReviews}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-serif text-2xl font-light text-foreground">
                    Customer Reviews ({summary?.totalReviews ?? reviews.length})
                </h3>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
                    <select
                        value={sort}
                        onChange={(e) => { setSort(e.target.value); setPage(1); }}
                        className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm sm:w-auto sm:flex-none"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    {canReview && !showForm && (
                        <Button onClick={() => setShowForm(true)} variant="outline" className="w-full sm:w-auto">
                            Write a Review
                        </Button>
                    )}
                </div>
            </div>

            {!user && (
                <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                    Please <a href="/login" className="underline text-primary">login</a> to write a review.
                </div>
            )}

            {user && user.role !== "USER" && (
                <div className="text-sm text-yellow-600 p-4 bg-yellow-50 rounded-lg">
                    Sellers and Admins cannot submit reviews.
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="border p-6 rounded-lg space-y-6 bg-card">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Rating</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`text-2xl ${rating >= star ? "text-yellow-400" : "text-gray-300"}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title (Optional)</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Summarize your review in a few words"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Review</label>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your thoughts about this product..."
                            rows={4}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Photos (Optional, max 3)</label>
                        <div className="flex flex-wrap gap-4">
                            {images.map((img, i) => (
                                <div key={i} className="relative w-20 h-20 border rounded overflow-hidden">
                                    <Image src={img} alt="review" fill className="object-cover" />
                                    <button type="button" onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {images.length < 3 && (
                                <label className="w-20 h-20 flex items-center justify-center border border-dashed rounded cursor-pointer hover:bg-muted/50">
                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        multiple
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit Review"}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            <div className="space-y-6">
                {isLoading ? (
                    <p className="text-muted-foreground text-sm">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                    <p className="text-muted-foreground italic">No reviews yet. Be the first to review!</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="border-b pb-6 last:border-0">
                            <div className="flex items-center gap-3 mb-3">
                                {review.user.avatar ? (
                                    <Image src={review.user.avatar} alt={review.user.fullName} width={40} height={40} className="rounded-full" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                        {review.user.fullName?.[0] || "A"}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium">{review.user.fullName || "Anonymous"}</p>
                                    <div className="flex text-yellow-400 text-xs">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <span key={i}>{i < review.rating ? "★" : "☆"}</span>
                                        ))}
                                    </div>
                                </div>
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            {review.title && (
                                <p className="text-sm font-semibold text-foreground mb-1">{review.title}</p>
                            )}
                            <p className="text-sm leading-relaxed text-muted-foreground mb-3">{review.text}</p>
                            {review.images.length > 0 && (
                                <div className="flex gap-2 mb-3">
                                    {review.images.map((img, i) => (
                                        <div key={i} className="relative w-16 h-16 rounded overflow-hidden border">
                                            <Image src={img} alt="review image" fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => handleHelpful(review.id)}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                Helpful{review.helpfulCount ? ` (${review.helpfulCount})` : ""}
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
}
