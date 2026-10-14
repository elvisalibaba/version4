import 'dart:developer' as developer;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:holistic_books/src/core/network/api_client.dart';
import 'package:holistic_books/src/features/books/data/catalogue_cache.dart';
import 'package:holistic_books/src/features/books/domain/book.dart';

final catalogueCacheProvider = Provider<CatalogueCache>(
  (ref) => CatalogueCache(),
);

final booksRepositoryProvider = Provider<BooksRepository>(
  (ref) => BooksRepository(
    ref.watch(apiClientProvider),
    ref.watch(catalogueCacheProvider),
  ),
);

final booksProvider = FutureProvider<CatalogueSnapshot>((ref) {
  return ref.watch(booksRepositoryProvider).fetchBooks();
});

final bookProvider = FutureProvider.family<Book, String>((ref, bookId) {
  return ref.watch(booksRepositoryProvider).fetchBook(bookId);
});

/// Catalogue affiché : frais, ou dernier catalogue en cache quand le réseau échoue.
class CatalogueSnapshot {
  const CatalogueSnapshot({required this.books, this.cachedAt});

  final List<Book> books;

  /// Date du cache lorsque le catalogue vient du stockage local (hors ligne), sinon null.
  final DateTime? cachedAt;

  bool get isFromCache => cachedAt != null;
}

/// Erreur présentable à l'utilisateur ; le détail technique reste dans les journaux.
class CatalogueUnavailableException implements Exception {
  const CatalogueUnavailableException();

  @override
  String toString() =>
      'Impossible de charger le catalogue. Vérifiez votre connexion.';
}

class BooksRepository {
  BooksRepository(this._api, this._cache);
  final ApiClient _api;
  final CatalogueCache _cache;

  Future<CatalogueSnapshot> fetchBooks() async {
    try {
      final response = await _api.dio.get<Map<String, dynamic>>(
        '/mobile/books',
      );
      final rows = (response.data?['data'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .toList(growable: false);
      await _cache.save(rows);
      return CatalogueSnapshot(
        books: rows.map(Book.fromJson).toList(growable: false),
      );
    } catch (error, stackTrace) {
      developer.log(
        'Chargement du catalogue impossible',
        error: error,
        stackTrace: stackTrace,
        name: 'catalogue',
      );
      final cached = await _cache.load();
      if (cached != null) {
        return CatalogueSnapshot(
          books: cached.rows.map(Book.fromJson).toList(growable: false),
          cachedAt: cached.savedAt,
        );
      }
      throw const CatalogueUnavailableException();
    }
  }

  Future<Book> fetchBook(String bookId) async {
    try {
      final response = await _api.dio.get<Map<String, dynamic>>(
        '/mobile/books/$bookId',
      );
      final payload = response.data?['data'] as Map<String, dynamic>?;
      if (payload == null) throw StateError('Livre absent de la réponse');
      return Book.fromJson(payload);
    } catch (error, stackTrace) {
      developer.log(
        'Chargement du livre $bookId impossible',
        error: error,
        stackTrace: stackTrace,
        name: 'catalogue',
      );
      // Hors ligne : la fiche est reprise du dernier catalogue en cache.
      final cached = await _cache.load();
      final row = cached?.rows.where((row) => row['id'] == bookId).firstOrNull;
      if (row != null) return Book.fromJson(row);
      throw const CatalogueUnavailableException();
    }
  }
}
