import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (_) => AuthRepository(Supabase.instance.client),
);

class AuthRepository {
  const AuthRepository(this._client);

  final SupabaseClient _client;

  User? get currentUser => _client.auth.currentUser;

  Future<void> signIn({required String email, required String password}) async {
    await _client.auth.signInWithPassword(
      email: email.trim(),
      password: password,
    );
  }

  Future<void> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    final normalizedName = name.trim();
    final parts = normalizedName.split(RegExp(r'\s+'));
    final firstName = parts.isEmpty ? '' : parts.first;
    final lastName = parts.length < 2 ? '' : parts.sublist(1).join(' ');

    await _client.auth.signUp(
      email: email.trim(),
      password: password,
      data: {
        'name': normalizedName,
        'role': 'reader',
        'first_name': firstName,
        'last_name': lastName,
        'preferred_language': 'fr',
      },
    );
  }

  Future<void> verifyEmail({
    required String email,
    required String code,
  }) async {
    await _client.auth.verifyOTP(
      email: email.trim(),
      token: code.trim(),
      type: OtpType.signup,
    );
  }

  Future<void> signOut() => _client.auth.signOut();
}
