import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';
import 'package:holistic_books/src/core/constants/app_dimensions.dart';
import 'package:holistic_books/src/core/widgets/app_button.dart';
import 'package:holistic_books/src/core/widgets/book_cover.dart';
import 'package:holistic_books/src/features/books/data/books_repository.dart';

class BookDetailScreen extends ConsumerWidget {
  const BookDetailScreen({required this.bookId, super.key});
  final String bookId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final book = ref.watch(bookProvider(bookId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Détails du livre'),
        leading: IconButton(
          tooltip: 'Retour',
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_rounded),
        ),
      ),
      body: book.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('Impossible de charger ce livre.\n$error', textAlign: TextAlign.center),
          ),
        ),
        data: (item) => Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: AppDimensions.contentMaxWidth),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
              children: [
                Center(
                  child: BookCover(
                    imageUrl: item.coverUrl,
                    width: 210,
                    height: 300,
                    borderRadius: 18,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  item.title,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  item.authorName,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppColors.mutedInk,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                Center(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: AppColors.softBlue,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                      child: Text(
                        item.priceLabel,
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                ),
                if (item.description?.trim().isNotEmpty == true) ...[
                  const SizedBox(height: 24),
                  Text(
                    item.description!,
                    style: const TextStyle(
                      color: AppColors.mutedInk,
                      height: 1.55,
                      fontSize: 13,
                    ),
                  ),
                ],
                if (item.categories.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: item.categories.take(4).map((category) {
                      return Chip(
                        label: Text(category),
                        backgroundColor: AppColors.white,
                        side: const BorderSide(color: Color(0xFFE5E5E9)),
                      );
                    }).toList(growable: false),
                  ),
                ],
                const SizedBox(height: 28),
                AppButton(
                  label: 'Lire maintenant',
                  icon: const Icon(Icons.chrome_reader_mode_rounded, size: 18),
                  onPressed: () => context.push('/reader/$bookId'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
