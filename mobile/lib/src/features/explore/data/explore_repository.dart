import 'package:holistic_books/src/features/explore/domain/book.dart';
import 'package:holistic_books/src/features/explore/domain/genre.dart';
import 'package:holistic_books/src/features/explore/domain/reading_progress.dart';

abstract interface class ExploreRepository {
  Future<Book?> getFeaturedBook();
  Future<List<ReadingProgress>> getReadingProgress();
  Future<List<Book>> getRecommendations();
  Future<List<Genre>> getGenres();
}
