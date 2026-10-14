import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:holistic_books/src/core/config/app_config.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 45),
        headers: const {'Accept': 'application/json'},
      ),
    ),
    Supabase.instance.client,
  );
});

class ApiClient {
  ApiClient(this._dio, this._supabase) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = _supabase.auth.currentSession?.accessToken;
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  final Dio _dio;
  final SupabaseClient _supabase;

  Dio get dio => _dio;

  Future<bool> get isAuthenticated async => _supabase.auth.currentUser != null;
}
