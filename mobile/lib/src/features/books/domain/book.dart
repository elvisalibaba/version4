class Book {
  const Book({
    required this.id,
    required this.title,
    required this.authorName,
    required this.price,
    required this.currencyCode,
    required this.isFree,
    required this.fileFormat,
    this.coverUrl,
  });

  factory Book.fromJson(Map<String, dynamic> json) {
    return Book(
      id: json['id'] as String,
      title: json['title'] as String? ?? 'Sans titre',
      authorName: json['author_display_name'] as String? ?? 'Auteur',
      price: double.tryParse((json['price'] ?? 0).toString()) ?? 0,
      currencyCode: json['currency_code'] as String? ?? 'USD',
      isFree: json['is_free'] as bool? ?? false,
      fileFormat: json['file_format'] as String?,
      coverUrl: json['cover_url'] as String?,
    );
  }

  final String id;
  final String title;
  final String authorName;
  final double price;
  final String currencyCode;
  final bool isFree;
  final String? fileFormat;
  final String? coverUrl;
}
