class Book {
  const Book({
    required this.id,
    required this.title,
    required this.authors,
    required this.coverUrl,
    required this.rating,
    required this.category,
  });

  final String id;
  final String title;
  final List<String> authors;
  final String coverUrl;
  final double rating;
  final String category;

  String get authorsLabel => authors.join(' & ');
}
