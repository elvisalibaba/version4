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
    final path = authenticated ? '/read/$bookId' : '/books/$bookId/read-free';
    final response = await _api.dio.get<List<int>>(
      path,
      options: Options(
        responseType: ResponseType.bytes,
        headers: const {'Accept': 'application/pdf'},
      ),
    );
    return Uint8List.fromList(response.data ?? const <int>[]);
  }
}
