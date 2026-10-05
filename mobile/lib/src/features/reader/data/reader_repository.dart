import 'dart:math' as math;
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:holistic_books/src/core/config/app_config.dart';
import 'package:holistic_books/src/core/network/api_client.dart';

final readerRepositoryProvider = Provider<ReaderRepository>(
  (ref) => ReaderRepository(ref.watch(apiClientProvider)),
);

class ReaderBootstrap {
  const ReaderBootstrap({
    required this.authenticated,
    required this.pageCount,
    required this.previewPageLimit,
    this.readerToken,
  });

  final bool authenticated;
  final int pageCount;
  final int previewPageLimit;
  final String? readerToken;
}

class ReaderRepository {
  ReaderRepository(this._api);
  final ApiClient _api;

  Future<ReaderBootstrap> prepare({
    required String bookId,
    required bool authenticated,
  }) async {
    final bookResponse = await _api.dio.get<Map<String, dynamic>>('/books/$bookId');
    final bookData = bookResponse.data?['data'] as Map<String, dynamic>?;
    if (bookData == null) {
      throw StateError('Livre introuvable');
    }

    final pageCount = _asInt(bookData['page_count']);
    final samplePages = _asInt(bookData['sample_pages']) ?? AppConfig.guestPreviewPageLimit;
    final previewLimit = math.max(1, math.min(AppConfig.guestPreviewPageLimit, samplePages));

    if (!authenticated) {
      if (bookData['has_sample'] != true) {
        throw StateError('Aucun aperçu sécurisé disponible');
      }

      return ReaderBootstrap(
        authenticated: false,
        pageCount: previewLimit,
        previewPageLimit: previewLimit,
      );
    }

    final access = await _api.dio.get<Map<String, dynamic>>(
      '/books/$bookId/access',
      options: Options(
        headers: const {
          'Accept': 'application/json',
          'X-Holistique-Reader': 'mobile',
        },
      ),
    );

    final data = access.data?['data'] as Map<String, dynamic>?;
    if (data?['hasAccess'] != true) {
      throw StateError('Accès de lecture refusé');
    }

    final session = data?['readerSession'] as Map<String, dynamic>?;
    final readerToken = session?['token'] as String?;

    if (readerToken == null || readerToken.isEmpty) {
      throw StateError('Session de lecture indisponible');
    }

    if (pageCount == null || pageCount < 1) {
      throw StateError('Nombre de pages indisponible');
    }

    return ReaderBootstrap(
      authenticated: true,
      pageCount: pageCount,
      previewPageLimit: previewLimit,
      readerToken: readerToken,
    );
  }

  Future<Uint8List> fetchPage({
    required String bookId,
    required int page,
    required ReaderBootstrap bootstrap,
  }) async {
    final path = bootstrap.authenticated
        ? '/read/$bookId/pages/$page'
        : '/books/$bookId/preview/pages/$page';

    final response = await _api.dio.get<List<int>>(
      path,
      options: Options(
        responseType: ResponseType.bytes,
        headers: {
          'Accept': 'image/jpeg',
          'X-Holistique-Reader': 'mobile',
          if (bootstrap.readerToken != null)
            'X-Holistique-Reader-Token': bootstrap.readerToken,
        },
      ),
    );

    final bytes = Uint8List.fromList(response.data ?? const <int>[]);
    if (bytes.isEmpty) {
      throw StateError('Page vide');
    }

    return bytes;
  }

  int? _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '');
  }
}
