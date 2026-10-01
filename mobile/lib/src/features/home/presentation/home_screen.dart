import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';
import 'package:holistic_books/src/core/constants/app_dimensions.dart';
import 'package:holistic_books/src/core/widgets/app_logo.dart';
import 'package:holistic_books/src/features/books/data/books_repository.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final books = ref.watch(booksProvider);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: AppDimensions.contentMaxWidth),
            child: RefreshIndicator(
              onRefresh: () => ref.refresh(booksProvider.future),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(
                  AppDimensions.horizontalPadding,
                  18,
                  AppDimensions.horizontalPadding,
                  24,
                ),
                children: [
                  Row(
                    children: [
                      const AppLogo(size: 48),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'HolisticBooks',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.ink,
                                  ),
                            ),
                            const Text(
                              'Lire, découvrir, apprendre',
                              style: TextStyle(fontSize: 12, color: AppColors.mutedInk),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        tooltip: 'Rechercher',
                        onPressed: () => context.go('/discover'),
                        icon: const Icon(Icons.search_rounded),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.softBlue,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Votre bibliothèque numérique africaine',
                          style: TextStyle(
                            fontSize: 24,
                            height: 1.05,
                            fontWeight: FontWeight.w800,
                            color: AppColors.ink,
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Des livres, auteurs et éditeurs à portée de main, sur mobile comme sur le web.',
                          style: TextStyle(
                            fontSize: 13,
                            height: 1.45,
                            color: AppColors.mutedInk,
                          ),
                        ),
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          onPressed: () => context.go('/discover'),
                          icon: const Icon(Icons.explore_rounded, size: 18),
                          label: const Text('Découvrir le catalogue'),
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: AppColors.white,
                            shape: const StadiumBorder(),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'À découvrir',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                      ),
                      TextButton(
                        onPressed: () => context.go('/discover'),
                        child: const Text('Voir tout'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  books.when(
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 48),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                    error: (error, _) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 32),
                      child: Text(
                        'Catalogue indisponible\n$error',
                        textAlign: TextAlign.center,
                      ),
                    ),
                    data: (items) {
                      if (items.isEmpty) {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 42),
                          child: Center(child: Text('Aucun livre publié pour le moment.')),
                        );
                      }

                      return Column(
                        children: items.take(8).map((book) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: AppColors.white,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: const Color(0xFFE9E9ED)),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              leading: Container(
                                width: 50,
                                height: 64,
                                decoration: BoxDecoration(
                                  color: AppColors.softBlue,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                alignment: Alignment.center,
                                child: const Icon(Icons.menu_book_rounded, color: AppColors.primary),
                              ),
                              title: Text(
                                book.title,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.ink),
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(book.authorName),
                              ),
                              trailing: const Icon(Icons.chevron_right_rounded),
                              onTap: () => context.push('/books/${book.id}'),
                            ),
                          );
                        }).toList(growable: false),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
