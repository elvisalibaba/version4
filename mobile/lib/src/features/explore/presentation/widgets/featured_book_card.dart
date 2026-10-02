import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:holistic_books/src/core/theme/app_colors.dart';
import 'package:holistic_books/src/core/theme/app_metrics.dart';
import 'package:holistic_books/src/features/explore/domain/book.dart';

class FeaturedBookCard extends StatelessWidget {
  const FeaturedBookCard({
    required this.book,
    super.key,
    this.onStartReading,
    this.onPreview,
  });

  final Book book;
  final VoidCallback? onStartReading;
  final VoidCallback? onPreview;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: AppMetrics.featuredHeight,
      padding: const EdgeInsets.all(AppMetrics.mediumGap),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(AppMetrics.featuredRadius),
      ),
      child: Row(
        children: [
          Semantics(
            label: 'Couverture de ${book.title}',
            image: true,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(AppMetrics.searchRadius),
              child: Container(
                width: AppMetrics.featuredCoverWidth,
                height: AppMetrics.featuredCoverHeight,
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.white),
                  borderRadius: BorderRadius.circular(AppMetrics.searchRadius),
                ),
                child: CachedNetworkImage(
                  imageUrl: book.coverUrl,
                  fit: BoxFit.cover,
                  errorWidget: (_, _, _) => const ColoredBox(
                    color: AppColors.surface,
                    child: Icon(Icons.menu_book_rounded),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: AppMetrics.mediumGap),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Livre à la une',
                  style: TextStyle(
                    color: AppColors.white,
                    fontSize: AppMetrics.smallText,
                  ),
                ),
                const SizedBox(height: AppMetrics.smallGap / 2),
                Text(
                  book.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.white,
                    fontSize: AppMetrics.largeGap,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppMetrics.smallGap / 2),
                Text(
                  'Par ${book.authorsLabel}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.white,
                    fontSize: AppMetrics.smallText,
                  ),
                ),
                const Spacer(),
                Row(
                  children: [
                    const _ReaderAvatar(label: 'A'),
                    Transform.translate(
                      offset: const Offset(-6, 0),
                      child: _ReaderAvatar(label: 'M'),
                    ),
                    Transform.translate(
                      offset: const Offset(-12, 0),
                      child: _ReaderAvatar(label: 'J'),
                    ),
                    Transform.translate(
                      offset: const Offset(-16, 0),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppMetrics.smallGap,
                          vertical: AppMetrics.smallGap / 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.white,
                          borderRadius: BorderRadius.circular(AppMetrics.chipRadius),
                        ),
                        child: const Text(
                          '2k+',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: AppMetrics.smallText,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppMetrics.smallGap),
                Wrap(
                  spacing: AppMetrics.smallGap,
                  runSpacing: AppMetrics.smallGap,
                  children: [
                    FilledButton(
                      onPressed: onStartReading,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.white,
                        foregroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppMetrics.mediumGap,
                        ),
                      ),
                      child: const Text('Commencer la lecture'),
                    ),
                    OutlinedButton(
                      onPressed: onPreview,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.white,
                        side: const BorderSide(color: AppColors.white),
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppMetrics.mediumGap,
                        ),
                      ),
                      child: const Text('Aperçu'),
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

class _ReaderAvatar extends StatelessWidget {
  const _ReaderAvatar({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: AppMetrics.largeGap / 1.6,
      backgroundColor: AppColors.surface,
      child: Text(
        label,
        style: const TextStyle(
          fontSize: AppMetrics.smallText,
          color: AppColors.primary,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
