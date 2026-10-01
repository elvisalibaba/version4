import 'package:flutter/material.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';

class BookCover extends StatelessWidget {
  const BookCover({
    required this.imageUrl,
    super.key,
    this.width,
    this.height,
    this.borderRadius = 14,
  });

  final String? imageUrl;
  final double? width;
  final double? height;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final placeholder = Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.softBlue,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      alignment: Alignment.center,
      child: const Icon(
        Icons.auto_stories_rounded,
        color: AppColors.primary,
        size: 34,
      ),
    );

    if (imageUrl == null || imageUrl!.isEmpty) {
      return placeholder;
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: Image.network(
        imageUrl!,
        width: width,
        height: height,
        fit: BoxFit.cover,
        filterQuality: FilterQuality.medium,
        errorBuilder: (_, _, _) => placeholder,
        loadingBuilder: (context, child, progress) {
          if (progress == null) return child;
          return Stack(
            alignment: Alignment.center,
            children: [
              placeholder,
              const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ],
          );
        },
      ),
    );
  }
}
