import 'package:holistic_books/src/core/config/app_config.dart';

class Book {
  const Book({
    required this.id,
    required this.title,
    required this.authorName,
    required this.price,
    required this.currencyCode,
    required this.isFree,
    required this.fileFormat,
    required this.categories,
    this.coverUrl,
    this.description,
    this.pageCount,
  });

  factory Book.fromJson(Map<String, dynamic> json) {
    final rawCover = (json['cover_thumbnail_url'] as String?)?.trim().isNotEmpty == true
        ? json['cover_thumbnail_url'] as String
        : json['cover_url'] as String?;

    return Book(
      id: json['id'] as String,
      title: json['title'] as String? ?? 'Sans titre',
      authorName: json['author_display_name'] as String? ?? 'Auteur',
      price: double.tryParse((json['price'] ?? 0).toString()) ?? 0,
      currencyCode: json['currency_code'] as String? ?? 'USD',
      isFree: json['is_free'] as bool? ?? false,
      fileFormat: json['file_format'] as String?,
      coverUrl: _resolveMediaUrl(rawCover),
      description: json['description'] as String?,
      pageCount: int.tryParse((json['page_count'] ?? '').toString()),
      categories: (json['categories'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .toList(growable: false),
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
  final String? description;
  final int? pageCount;
  final List<String> categories;

  String get priceLabel => isFree ? 'Gratuit' : '${price.toStringAsFixed(2)} $currencyCode';

  static String? _resolveMediaUrl(String? value) {
    if (value == null) return null;
    final trimmed = value.trim();
    if (trimmed.isEmpty) return null;

    final uri = Uri.tryParse(trimmed);
    if (uri != null && uri.hasScheme) {
      return trimmed;
    }

    final normalized = trimmed.startsWith('/') ? trimmed.substring(1) : trimmed;
    return '${AppConfig.apiBaseUrl}/media/$normalized';
  }
}
