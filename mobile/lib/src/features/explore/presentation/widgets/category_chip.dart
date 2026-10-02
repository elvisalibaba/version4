import 'package:flutter/material.dart';
import 'package:holistic_books/src/core/theme/app_colors.dart';
import 'package:holistic_books/src/core/theme/app_metrics.dart';

class CategoryChip extends StatelessWidget {
  const CategoryChip({required this.label, super.key});

  final String label;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.white,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(AppMetrics.chipRadius),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppMetrics.mediumGap,
          vertical: AppMetrics.smallGap / 1.4,
        ),
        child: Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: AppMetrics.smallText,
            color: AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
