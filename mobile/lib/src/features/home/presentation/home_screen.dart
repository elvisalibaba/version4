import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';
import 'package:holistic_books/src/core/widgets/app_logo.dart';
import 'package:holistic_books/src/core/widgets/book_cover.dart';
import 'package:holistic_books/src/features/books/data/books_repository.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final books = ref.watch(booksProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.refresh(booksProvider.future),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 110),
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
                          'Lire. Découvrir. Grandir.',
                          style: TextStyle(fontSize: 12, color: AppColors.mutedInk),
                        ),
                      ],
                    ),
                  ),
                  IconButton.filledTonal(
                    tooltip: 'Rechercher',
                    onPressed: () => context.go('/discover'),
                    icon: const Icon(Icons.search_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(26),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'La bibliothèque numérique pensée pour l’Afrique francophone.',
                      style: TextStyle(
                        fontSize: 26,
                        height: 1.05,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(height: 12),
                    Text(
                      'Livres, auteurs, éditeurs et lecture mobile dans une expérience unique.',
                      style: TextStyle(
                        fontSize: 13,
                        height: 1.45,
                        color: Color(0xDFFFFFFF),
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
                      'Sélection du moment',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                  TextButton(
                    onPressed: () => context.go('/discover'),
                    child: const Text('Voir tout'),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              books.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 50),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (error, _) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 34),
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

                  return LayoutBuilder(
                    builder: (context, constraints) {
                      final cardWidth = (constraints.maxWidth - 14) / 2;
                      return Wrap(
                        spacing: 14,
                        runSpacing: 20,
                        children: items.take(10).map((book) {
                          return SizedBox(
                            width: cardWidth,
                            child: InkWell(
                              borderRadius: BorderRadius.circular(18),
                              onTap: () => context.push('/books/${book.id}'),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  AspectRatio(
                                    aspectRatio: .68,
                                    child: BookCover(
                                      imageUrl: book.coverUrl,
                                      width: double.infinity,
                                      height: double.infinity,
                                      borderRadius: 16,
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    book.title,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      height: 1.2,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.ink,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    book.authorName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.mutedInk,
                                    ),
                                  ),
                                  const SizedBox(height: 5),
                                  Text(
                                    book.priceLabel,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(growable: false),
                      );
                    },
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
