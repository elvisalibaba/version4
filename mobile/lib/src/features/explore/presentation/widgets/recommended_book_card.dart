import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:holistic_books/src/core/theme/app_colors.dart';
import 'package:holistic_books/src/core/theme/app_metrics.dart';
import 'package:holistic_books/src/features/explore/domain/book.dart';
import 'package:holistic_books/src/features/explore/presentation/widgets/category_chip.dart';
import 'package:holistic_books/src/features/explore/presentation/widgets/rating_badge.dart';

class RecommendedBookCard extends StatelessWidget {
  const RecommendedBookCard({
    required this.book,
    super.key,
  });

  final Book book;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: AppMetrics.recommendedWidth,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              Semantics(
                label: 'Couverture de ${book.title}',
                image: true,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(AppMetrics.searchRadius),
                  child: CachedNetworkImage(
                    imageUrl: book.coverUrl,
                    width: AppMetrics.recommendedWidth,
                    height: AppMetrics.recommendedCoverHeight,
                    fit: BoxFit.cover,
                    errorWidget: (_, _, _) => const ColoredBox(
                      color: AppColors.surface,
                      child: Icon(Icons.menu_book_rounded),
                    ),
                  ),
                ),
              ),
              Positioned(
                right: AppMetrics.smallGap,
                bottom: AppMetrics.smallGap,
                child: RatingBadge(rating: book.rating),
              ),
            ],
          ),
          const SizedBox(height: AppMetrics.smallGap),
          CategoryChip(label: book.category),
        ],
      ),
    );
  }
}
