import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:holistic_books/src/core/theme/app_colors.dart';
import 'package:holistic_books/src/core/theme/app_metrics.dart';
import 'package:holistic_books/src/features/explore/domain/reading_progress.dart';

class ContinueReadingCard extends StatelessWidget {
  const ContinueReadingCard({
    required this.progress,
    super.key,
  });

  final ReadingProgress progress;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: AppMetrics.continueCardWidth,
      height: AppMetrics.continueCardHeight,
      padding: const EdgeInsets.all(AppMetrics.mediumGap),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(AppMetrics.cardRadius),
      ),
      child: Row(
        children: [
          Semantics(
            label: 'Couverture de ${progress.book.title}',
            image: true,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(AppMetrics.searchRadius),
              child: CachedNetworkImage(
                imageUrl: progress.book.coverUrl,
                width: AppMetrics.continueCoverWidth,
                height: double.infinity,
                fit: BoxFit.cover,
                errorWidget: (_, _, _) => const ColoredBox(
                  color: AppColors.surfaceStrong,
                  child: Icon(Icons.menu_book_rounded),
                ),
              ),
            ),
          ),
          const SizedBox(width: AppMetrics.mediumGap),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  progress.book.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: AppMetrics.smallGap / 2),
                Text(
                  'Par ${progress.book.authorsLabel}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: AppMetrics.smallText,
                    color: AppColors.textSecondary,
                  ),
                ),
                const Spacer(),
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppMetrics.chipRadius),
                  child: LinearProgressIndicator(
                    value: progress.percentage,
                    minHeight: AppMetrics.smallGap / 2,
                    color: AppColors.primary,
                    backgroundColor: AppColors.border,
                  ),
                ),
                const SizedBox(height: AppMetrics.smallGap),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${(progress.percentage * 100).round()} % terminé',
                        style: const TextStyle(
                          fontSize: AppMetrics.smallText,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                    Text(
                      'Page ${progress.currentPage} sur ${progress.totalPages}',
                      style: const TextStyle(
                        fontSize: AppMetrics.smallText,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
