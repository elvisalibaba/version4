class OfflineBook {
  const OfflineBook({
    required this.bookId,
    required this.title,
    required this.authorName,
    required this.pageCount,
    required this.licenseId,
    required this.downloadId,
    required this.userId,
    required this.validUntil,
    required this.downloadedAt,
    this.coverUrl,
  });

  factory OfflineBook.fromJson(Map<String, dynamic> json) => OfflineBook(
    bookId: json['bookId'] as String,
    title: json['title'] as String? ?? 'Sans titre',
    authorName: json['authorName'] as String? ?? 'Auteur',
    pageCount: (json['pageCount'] as num).toInt(),
    licenseId: json['licenseId'] as String,
    downloadId: json['downloadId'] as String,
    userId: json['userId'] as String,
    validUntil: DateTime.parse(json['validUntil'] as String).toUtc(),
    downloadedAt: DateTime.parse(json['downloadedAt'] as String).toUtc(),
    coverUrl: json['coverUrl'] as String?,
  );

  final String bookId;
  final String title;
  final String authorName;
  final int pageCount;
  final String licenseId;
  final String downloadId;
  final String userId;
  final DateTime validUntil;
  final DateTime downloadedAt;
  final String? coverUrl;

  bool get isExpired => !validUntil.isAfter(DateTime.now().toUtc());

  Map<String, dynamic> toJson() => {
    'bookId': bookId,
    'title': title,
    'authorName': authorName,
    'pageCount': pageCount,
    'licenseId': licenseId,
    'downloadId': downloadId,
    'userId': userId,
    'validUntil': validUntil.toIso8601String(),
    'downloadedAt': downloadedAt.toIso8601String(),
    'coverUrl': coverUrl,
  };
}
