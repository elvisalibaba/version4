import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/features/books/data/books_repository.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final books = ref.watch(booksProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('HolisticBooks')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(booksProvider.future),
        child: books.when(
          loading: () => ListView(
            children: const [
              SizedBox(height: 240),
              Center(child: CircularProgressIndicator()),
            ],
          ),
          error: (error, _) => ListView(padding: const EdgeInsets.all(24), children: [Text('Catalogue indisponible\n$error', textAlign: TextAlign.center)]),
          data: (items) => ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final book = items[index];
              return Card(
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  leading: const Icon(Icons.menu_book_rounded, size: 34),
                  title: Text(book.title),
                  subtitle: Text(book.authorName),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => context.push('/books/${book.id}'),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
