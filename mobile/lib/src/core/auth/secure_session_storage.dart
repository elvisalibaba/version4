import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SecureSessionStorage extends LocalStorage {
  const SecureSessionStorage({
    this.key = 'holisticbooks_supabase_session',
    this.storage = const FlutterSecureStorage(),
  });

  final String key;
  final FlutterSecureStorage storage;

  @override
  Future<void> initialize() async {}

  @override
  Future<bool> hasAccessToken() async => (await storage.read(key: key)) != null;

  @override
  Future<String?> accessToken() => storage.read(key: key);

  @override
  Future<void> persistSession(String persistSessionString) =>
      storage.write(key: key, value: persistSessionString);

  @override
  Future<void> removePersistedSession() => storage.delete(key: key);
}
