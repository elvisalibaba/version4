import 'package:flutter/material.dart';
import 'package:holistic_books/src/core/theme/app_colors.dart';
import 'package:holistic_books/src/core/theme/app_metrics.dart';

class SearchBarField extends StatelessWidget {
  const SearchBarField({
    super.key,
    this.onChanged,
  });

  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: AppMetrics.searchHeight,
      child: TextField(
        onChanged: onChanged,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: 'Rechercher un livre ou un auteur',
          hintStyle: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: AppMetrics.body,
          ),
          prefixIcon: const Icon(
            Icons.search_rounded,
            color: AppColors.textSecondary,
          ),
          filled: true,
          fillColor: AppColors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppMetrics.searchRadius),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppMetrics.searchRadius),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppMetrics.searchRadius),
            borderSide: const BorderSide(color: AppColors.primary),
          ),
        ),
      ),
    );
  }
}
