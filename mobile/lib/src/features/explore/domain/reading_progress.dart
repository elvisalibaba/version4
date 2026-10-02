import 'package:holistic_books/src/features/explore/domain/book.dart';

class ReadingProgress {
  const ReadingProgress({
    required this.book,
    required this.currentPage,
    required this.totalPages,
    required this.percentage,
  });

  final Book book;
  final int currentPage;
  final int totalPages;
  final double percentage;
}
