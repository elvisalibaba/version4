import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:holistic_books/src/core/network/api_client.dart';
import 'package:holistic_books/src/core/reader/pdf_page_renderer.dart';
import 'package:holistic_books/src/features/offline/data/offline_library_repository.dart';
import 'package:holistic_books/src/features/offline/domain/offline_book.dart';

final readerRepositoryProvider = Provider<ReaderRepository>(
  (ref) => ReaderRepository(
    ref.watch(apiClientProvider),
    ref.watch(offlineLibraryRepositoryProvider),
  ),
);

class ReaderBootstrap {
  const ReaderBootstrap({
    required this.authenticated,
    required this.pageCount,
    required this.previewPageLimit,
    this.offlineBook,
  });

  final bool authenticated;
  final int pageCount;
  final int previewPageLimit;
  final OfflineBook? offlineBook;

  bool get isOffline => offlineBook != null;
}

class ReaderRepository {
  ReaderRepository(this._api, this._offlineLibrary);
  final ApiClient _api;
  final OfflineLibraryRepository _offlineLibrary;

  Future<ReaderBootstrap> prepare({required String bookId}) async {
    final offlineBook = await _offlineLibrary.getBook(bookId);
    if (offlineBook != null && !offlineBook.isExpired) {
      return ReaderBootstrap(
        authenticated: true,
        pageCount: offlineBook.pageCount,
        previewPageLimit: offlineBook.pageCount,
        offlineBook: offlineBook,
      );
    }

    final response = await _api.dio.get<Map<String, dynamic>>(
      '/read/$bookId',
      options: Options(
        headers: const {
          'Accept': 'application/json',
          'X-Holistique-Reader': 'mobile',
        },
      ),
    );
    final data = response.data;
    final fullPageCount = _asInt(data?['pageCount']);
    final previewLimit = _asInt(data?['previewPageLimit']) ?? fullPageCount;
    if (fullPageCount == null || fullPageCount < 1 || previewLimit == null) {
      throw StateError('Nombre de pages indisponible');
    }
    final isGuestPreview = data?['isGuestPreview'] == true;

    return ReaderBootstrap(
      authenticated: !isGuestPreview,
      pageCount: isGuestPreview ? previewLimit : fullPageCount,
      previewPageLimit: previewLimit,
    );
  }

  Future<Uint8List> fetchPage({
    required String bookId,
    required int page,
    required ReaderBootstrap bootstrap,
  }) async {
    final offlineBook = bootstrap.offlineBook;
    if (offlineBook != null) {
      final bytes = await _offlineLibrary.readPage(offlineBook, page);
      return renderProtectedPage(bytes);
    }

    final response = await _api.dio.get<List<int>>(
      '/read/$bookId/file',
      queryParameters: {'page': page},
      options: Options(
        responseType: ResponseType.bytes,
        headers: {'Accept': 'image/jpeg', 'X-Holistique-Reader': 'mobile'},
      ),
    );

    final bytes = Uint8List.fromList(response.data ?? const <int>[]);
    if (bytes.isEmpty) {
      throw StateError('Page vide');
    }

    return renderProtectedPage(bytes);
  }

  int? _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '');
  }
}
