import 'package:flutter/material.dart';
import 'package:holistic_books/src/core/theme/app_colors.dart';
import 'package:holistic_books/src/core/theme/app_metrics.dart';

class RatingBadge extends StatelessWidget {
  const RatingBadge({required this.rating, super.key});

  final double rating;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.rating,
        borderRadius: BorderRadius.circular(AppMetrics.chipRadius),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppMetrics.smallGap,
          vertical: AppMetrics.smallGap / 2,
        ),
        child: Text(
          '${rating.toStringAsFixed(1)} ★',
          style: const TextStyle(
            color: AppColors.white,
            fontSize: AppMetrics.smallText,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
