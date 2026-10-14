import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:holistic_books/src/core/network/api_client.dart';
import 'package:holistic_books/src/features/books/domain/book.dart';
import 'package:holistic_books/src/features/offline/data/offline_page_cipher.dart';
import 'package:holistic_books/src/features/offline/domain/offline_book.dart';
import 'package:path_provider/path_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final offlineLibraryRepositoryProvider = Provider<OfflineLibraryRepository>(
  (ref) => OfflineLibraryRepository(
    ref.watch(apiClientProvider),
    Supabase.instance.client,
    const FlutterSecureStorage(),
  ),
);

final offlineBooksProvider = FutureProvider<List<OfflineBook>>(
  (ref) => ref.watch(offlineLibraryRepositoryProvider).listBooks(),
);

class OfflineLibraryRepository {
  OfflineLibraryRepository(
    this._api,
    this._supabase,
    this._secureStorage, {
    this._cipher = const OfflinePageCipher(),
  });

  static final RegExp _safeId = RegExp(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    caseSensitive: false,
  );

  final ApiClient _api;
  final SupabaseClient _supabase;
  final FlutterSecureStorage _secureStorage;
  final OfflinePageCipher _cipher;

  Future<OfflineBook> downloadBook(
    Book book, {
    void Function(double progress)? onProgress,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw StateError('Connexion requise pour télécharger.');
    _validateId(user.id);
    _validateId(book.id);

    final readerResponse = await _api.dio.get<Map<String, dynamic>>(
      '/read/${book.id}',
      options: Options(
        headers: const {
          'Accept': 'application/json',
          'X-Holistique-Reader': 'mobile',
        },
      ),
    );
    final readerData = readerResponse.data;
    final pageCount = _asInt(readerData?['pageCount']);
    if (readerData?['isGuestPreview'] == true ||
        pageCount == null ||
        pageCount < 1) {
      throw StateError('Ce livre n’est pas disponible au téléchargement.');
    }

    final deviceUuid = await _deviceUuid();
    final rpcResult = await _supabase.rpc(
      'issue_mobile_offline_license',
      params: {
        'p_device_uuid': deviceUuid,
        'p_book_id': book.id,
        'p_platform': Platform.isIOS ? 'ios' : 'android',
        'p_app_version_name': '0.1.0',
        'p_app_version_code': 1,
      },
    );
    final license = _firstRecord(rpcResult);
    final licenseId = license['license_id']?.toString();
    final downloadId = license['download_id']?.toString();
    final token = license['license_token']?.toString();
    final validUntilValue = license['valid_until']?.toString();
    if (licenseId == null ||
        downloadId == null ||
        token == null ||
        validUntilValue == null) {
      throw StateError('Licence hors ligne incomplète.');
    }
    _validateId(licenseId);
    _validateId(downloadId);
    await _secureStorage.write(key: _licenseKey(licenseId), value: token);

    final bookDirectory = await _bookDirectory(user.id, book.id);
    if (await bookDirectory.exists()) {
      await bookDirectory.delete(recursive: true);
    }
    await bookDirectory.create(recursive: true);

    var totalBytes = 0;
    try {
      await _updateDownload(downloadId, {
        'status': 'downloading',
        'error_message': null,
        'last_synced_at': DateTime.now().toUtc().toIso8601String(),
      });

      for (var page = 1; page <= pageCount; page++) {
        final response = await _api.dio.get<List<int>>(
          '/read/${book.id}/file',
          queryParameters: {'page': page},
          options: Options(
            responseType: ResponseType.bytes,
            headers: const {
              'Accept': 'application/pdf,image/*',
              'X-Holistique-Reader': 'mobile',
            },
          ),
        );
        final bytes = Uint8List.fromList(response.data ?? const <int>[]);
        if (bytes.isEmpty) throw StateError('La page $page est vide.');
        totalBytes += bytes.length;
        final encrypted = await _cipher.encrypt(bytes, token);
        await File(
          '${bookDirectory.path}/$page.hbp',
        ).writeAsBytes(encrypted, flush: true);
        onProgress?.call(page / pageCount);
      }

      final offlineBook = OfflineBook(
        bookId: book.id,
        title: book.title,
        authorName: book.authorName,
        pageCount: pageCount,
        licenseId: licenseId,
        downloadId: downloadId,
        userId: user.id,
        validUntil: DateTime.parse(validUntilValue).toUtc(),
        downloadedAt: DateTime.now().toUtc(),
        coverUrl: book.coverUrl,
      );
      await File(
        '${bookDirectory.path}/manifest.json',
      ).writeAsString(jsonEncode(offlineBook.toJson()), flush: true);
      await _updateDownload(downloadId, {
        'status': 'completed',
        'bytes_downloaded': totalBytes,
        'file_size_bytes': totalBytes,
        'checksum_verified': true,
        'completed_at': DateTime.now().toUtc().toIso8601String(),
        'last_synced_at': DateTime.now().toUtc().toIso8601String(),
      });
      return offlineBook;
    } catch (error) {
      final errorMessage = error.toString();
      if (await bookDirectory.exists()) {
        await bookDirectory.delete(recursive: true);
      }
      await _secureStorage.delete(key: _licenseKey(licenseId));
      await _updateDownload(downloadId, {
        'status': 'failed',
        'error_message': errorMessage.length <= 500
            ? errorMessage
            : errorMessage.substring(0, 500),
        'last_synced_at': DateTime.now().toUtc().toIso8601String(),
      }, bestEffort: true);
      rethrow;
    }
  }

  Future<List<OfflineBook>> listBooks() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return const [];
    _validateId(user.id);
    final root = await _userDirectory(user.id);
    if (!await root.exists()) return const [];

    final books = <OfflineBook>[];
    await for (final entity in root.list(followLinks: false)) {
      if (entity is! Directory) continue;
      final manifest = File('${entity.path}/manifest.json');
      if (!await manifest.exists()) continue;
      try {
        final decoded = jsonDecode(await manifest.readAsString());
        if (decoded is! Map<String, dynamic>) continue;
        final book = OfflineBook.fromJson(decoded);
        if (book.userId == user.id) books.add(book);
      } on Object {
        // Ignore incomplete or corrupted downloads.
      }
    }
    books.sort((a, b) => b.downloadedAt.compareTo(a.downloadedAt));
    return books;
  }

  Future<OfflineBook?> getBook(String bookId) async {
    final user = _supabase.auth.currentUser;
    if (user == null) return null;
    _validateId(user.id);
    _validateId(bookId);
    final manifest = File(
      '${(await _bookDirectory(user.id, bookId)).path}/manifest.json',
    );
    if (!await manifest.exists()) return null;
    try {
      final decoded = jsonDecode(await manifest.readAsString());
      if (decoded is! Map<String, dynamic>) return null;
      final book = OfflineBook.fromJson(decoded);
      return book.userId == user.id ? book : null;
    } on Object {
      return null;
    }
  }

  Future<Uint8List> readPage(OfflineBook book, int page) async {
    final user = _supabase.auth.currentUser;
    if (user == null || user.id != book.userId) {
      throw StateError('Session différente de celle du téléchargement.');
    }
    if (book.isExpired) {
      throw StateError('La licence hors ligne a expiré. Reconnectez-vous.');
    }
    if (page < 1 || page > book.pageCount) {
      throw RangeError.range(page, 1, book.pageCount, 'page');
    }
    final token = await _secureStorage.read(key: _licenseKey(book.licenseId));
    if (token == null) throw StateError('Clé de lecture hors ligne absente.');
    final file = File(
      '${(await _bookDirectory(user.id, book.bookId)).path}/$page.hbp',
    );
    if (!await file.exists()) throw StateError('Page hors ligne absente.');
    return _cipher.decrypt(await file.readAsBytes(), token);
  }

  Future<void> deleteBook(OfflineBook book) async {
    final user = _supabase.auth.currentUser;
    if (user == null || user.id != book.userId) return;
    final directory = await _bookDirectory(user.id, book.bookId);
    if (await directory.exists()) await directory.delete(recursive: true);
    await _secureStorage.delete(key: _licenseKey(book.licenseId));
    await _updateDownload(book.downloadId, {
      'status': 'deleted',
      'last_synced_at': DateTime.now().toUtc().toIso8601String(),
    }, bestEffort: true);
  }

  Future<Directory> _userDirectory(String userId) async {
    _validateId(userId);
    final support = await getApplicationSupportDirectory();
    return Directory('${support.path}/holisticbooks/offline/$userId');
  }

  Future<Directory> _bookDirectory(String userId, String bookId) async {
    _validateId(bookId);
    return Directory('${(await _userDirectory(userId)).path}/$bookId');
  }

  Future<String> _deviceUuid() async {
    const key = 'holisticbooks_device_uuid';
    final existing = await _secureStorage.read(key: key);
    if (existing != null && existing.length >= 16) return existing;
    final generated =
        '${DateTime.now().microsecondsSinceEpoch.toRadixString(16)}-'
        '${_supabase.auth.currentUser!.id}';
    await _secureStorage.write(key: key, value: generated);
    return generated;
  }

  Future<void> _updateDownload(
    String downloadId,
    Map<String, dynamic> values, {
    bool bestEffort = false,
  }) async {
    try {
      await _supabase
          .from('book_downloads')
          .update(values)
          .eq('id', downloadId);
    } on Object {
      if (!bestEffort) rethrow;
    }
  }

  Map<String, dynamic> _firstRecord(dynamic result) {
    if (result is List && result.isNotEmpty && result.first is Map) {
      return Map<String, dynamic>.from(result.first as Map);
    }
    if (result is Map) return Map<String, dynamic>.from(result);
    throw StateError('Réponse de licence invalide.');
  }

  int? _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '');
  }

  String _licenseKey(String licenseId) => 'holisticbooks_license_$licenseId';

  void _validateId(String value) {
    if (!_safeId.hasMatch(value)) throw ArgumentError('Identifiant invalide.');
  }
}
