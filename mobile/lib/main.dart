import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:holistic_books/src/core/config/app_config.dart';
import 'package:holistic_books/src/core/auth/secure_session_storage.dart';
import 'package:holistic_books/src/app.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  AppConfig.validate();
  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    publishableKey: AppConfig.supabasePublishableKey,
    authOptions: const FlutterAuthClientOptions(
      localStorage: SecureSessionStorage(),
    ),
  );
  runApp(const ProviderScope(child: HolisticBooksApp()));
}
