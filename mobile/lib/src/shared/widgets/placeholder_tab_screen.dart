import 'package:flutter/material.dart';
import 'package:holistic_books/src/core/theme/app_colors.dart';
import 'package:holistic_books/src/core/theme/app_metrics.dart';

class PlaceholderTabScreen extends StatelessWidget {
  const PlaceholderTabScreen({
    required this.title,
    required this.icon,
    super.key,
  });

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppMetrics.pageHorizontal),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: AppMetrics.placeholderIconSize, color: AppColors.primary),
                const SizedBox(height: AppMetrics.largeGap),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: AppMetrics.sectionTitle,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: AppMetrics.smallGap),
                const Text(
                  'Cet espace sera disponible prochainement.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
