import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:holistic_books/src/core/network/api_client.dart';
import 'package:holistic_books/src/features/books/domain/book.dart';

final booksRepositoryProvider = Provider<BooksRepository>(
  (ref) => BooksRepository(ref.watch(apiClientProvider)),
);

final booksProvider = FutureProvider<List<Book>>((ref) {
  return ref.watch(booksRepositoryProvider).fetchBooks();
});

class BooksRepository {
  BooksRepository(this._api);
  final ApiClient _api;

  Future<List<Book>> fetchBooks() async {
    final response = await _api.dio.get<Map<String, dynamic>>('/books');
    final rows = (response.data?['data'] as List<dynamic>? ?? const []);
    return rows
        .whereType<Map<String, dynamic>>()
        .map(Book.fromJson)
        .toList(growable: false);
  }
}
