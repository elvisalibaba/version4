import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:holistic_books/src/core/network/api_client.dart';

final readerRepositoryProvider = Provider<ReaderRepository>(
  (ref) => ReaderRepository(ref.watch(apiClientProvider)),
);

class ReaderRepository {
  ReaderRepository(this._api);
  final ApiClient _api;

  Future<Uint8List> fetchPdf({
    required String bookId,
    required bool authenticated,
  }) async {
    String? readerToken;

    if (authenticated) {
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
      final session = data?['readerSession'] as Map<String, dynamic>?;
      readerToken = session?['token'] as String?;

      if (readerToken == null || readerToken.isEmpty) {
        throw StateError('Session de lecture indisponible');
      }
    }

    final path = authenticated ? '/read/$bookId' : '/books/$bookId/read-free';
    final response = await _api.dio.get<List<int>>(
      path,
      options: Options(
        responseType: ResponseType.bytes,
        headers: {
          'Accept': 'application/pdf',
          'X-Holistique-Reader': 'mobile',
          if (readerToken != null) 'X-Holistique-Reader-Token': readerToken,
        },
      ),
    );
    return Uint8List.fromList(response.data ?? const <int>[]);
  }
}
