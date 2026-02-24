import { type Request, type Response } from 'express';
import { prisma } from '../config/db.js';

export const reviewController = {
    createReview: async (req: Request, res: Response): Promise<void> => {
        try {
            const { productId } = req.params;
            const { rating, text, images } = req.body;

            const user = (req as any).user;
            const userId = user?.id || user?.userId; // Handle both potential cases
            const userRole = user?.role;

            if (!userId || !userRole) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            if (userRole !== 'USER') {
                res.status(403).json({ message: 'Only users can submit reviews' });
                return;
            }

            if (!productId || !rating || !text) {
                res.status(400).json({ message: 'Missing required fields' });
                return;
            }

            const ratingInt = parseInt(rating as string);
            if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
                res.status(400).json({ message: 'Rating must be between 1 and 5' });
                return;
            }

            if (images && Array.isArray(images)) {
                if (images.length > 3) {
                    res.status(400).json({ message: 'Maximum 3 images allowed' });
                    return;
                }
            }

            // Check if product exists to avoid FK error
            // (Optional safety, FK constraint handles it but explicit message is nicer)

            const review = await prisma.review.create({
                data: {
                    productId: productId as string,
                    userId: userId,
                    rating: ratingInt,
                    text,
                    images: images || [],
                },
            });

            res.status(201).json({ message: 'Review submitted successfully', review });
        } catch (error) {
            console.error('Error creating review:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    getProductReviews: async (req: Request, res: Response): Promise<void> => {
        try {
            const productId = req.params.productId ?? req.params.id;

            if (!productId) {
                res.status(400).json({ message: 'Product ID is required' });
                return;
            }

            const reviews = await prisma.review.findMany({
                where: { productId: productId as string },
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            user_profiles: {
                                select: { full_name: true, avatar: true }
                            }
                        }
                    }
                }
            });

            // Transform data
            const formattedReviews = reviews.map((r: any) => ({
                id: r.id,
                rating: r.rating,
                text: r.text,
                images: r.images,
                createdAt: r.createdAt,
                user: {
                    id: r.userId,
                    fullName: r.user.user_profiles?.full_name || 'Anonymous',
                    avatar: r.user.user_profiles?.avatar
                }
            }));

            res.status(200).json({ reviews: formattedReviews });
        } catch (error) {
            console.error('Error fetching reviews:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    markHelpful: async (req: Request, res: Response): Promise<void> => {
        try {
            const rawId = req.params.id;
            const id = Array.isArray(rawId) ? rawId[0] : rawId;

            if (!id) {
                res.status(400).json({ message: 'Review ID is required' });
                return;
            }

            const review = await prisma.review.findUnique({
                where: { id },
                select: { id: true },
            });

            if (!review) {
                res.status(404).json({ message: 'Review not found' });
                return;
            }

            const updated = await prisma.review.update({
                where: { id },
                data: { helpfulCount: { increment: 1 } },
                select: { id: true, helpfulCount: true },
            });

            res.status(200).json({ message: 'Marked as helpful', review: updated });
        } catch (error) {
            console.error('Error marking helpful review:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};

