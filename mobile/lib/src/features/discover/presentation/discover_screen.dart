import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';
import 'package:holistic_books/src/core/widgets/book_cover.dart';
import 'package:holistic_books/src/features/books/data/books_repository.dart';

class DiscoverScreen extends ConsumerStatefulWidget {
  const DiscoverScreen({super.key});

  @override
  ConsumerState<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends ConsumerState<DiscoverScreen> {
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final books = ref.watch(booksProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Découvrir')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 110),
        children: [
          Text(
            'Votre prochaine lecture est ici',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _search,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: 'Titre, auteur, catégorie...',
              prefixIcon: const Icon(Icons.search_rounded),
              filled: true,
              fillColor: AppColors.inputFill,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 24),
          books.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Text('Catalogue indisponible\n$error'),
            data: (items) {
              final query = _search.text.trim().toLowerCase();
              final filtered = query.isEmpty
                  ? items
                  : items.where((book) {
                      return book.title.toLowerCase().contains(query) ||
                          book.authorName.toLowerCase().contains(query) ||
                          book.categories.any((c) => c.toLowerCase().contains(query));
                    }).toList(growable: false);

              if (filtered.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.only(top: 50),
                  child: Center(child: Text('Aucun livre trouvé.')),
                );
              }

              return LayoutBuilder(
                builder: (context, constraints) {
                  final width = (constraints.maxWidth - 14) / 2;
                  return Wrap(
                    spacing: 14,
                    runSpacing: 20,
                    children: filtered.map((book) {
                      return SizedBox(
                        width: width,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
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
                                  borderRadius: 14,
                                ),
                              ),
                              const SizedBox(height: 9),
                              Text(
                                book.title,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  height: 1.2,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                book.authorName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 11, color: AppColors.mutedInk),
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
    );
  }
}
