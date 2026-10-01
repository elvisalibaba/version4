import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';
import 'package:holistic_books/src/core/constants/app_dimensions.dart';
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
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: AppDimensions.contentMaxWidth),
          child: ListView(
            padding: const EdgeInsets.all(AppDimensions.horizontalPadding),
            children: [
              Text(
                'Trouvez votre prochaine lecture',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppColors.ink,
                    ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _search,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  hintText: 'Titre, auteur, catégorie...',
                  prefixIcon: const Icon(Icons.search_rounded),
                  filled: true,
                  fillColor: AppColors.inputFill,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
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
                              book.authorName.toLowerCase().contains(query);
                        }).toList(growable: false);
                  if (filtered.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.only(top: 56),
                      child: Center(child: Text('Aucun livre trouvé.')),
                    );
                  }
                  return Column(
                    children: filtered.map((book) {
                      return Card(
                        elevation: 0,
                        margin: const EdgeInsets.only(bottom: 10),
                        color: AppColors.white,
                        child: ListTile(
                          leading: const CircleAvatar(
                            backgroundColor: AppColors.softBlue,
                            child: Icon(Icons.menu_book_rounded, color: AppColors.primary),
                          ),
                          title: Text(book.title, maxLines: 2, overflow: TextOverflow.ellipsis),
                          subtitle: Text(book.authorName),
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
    );
  }
}
