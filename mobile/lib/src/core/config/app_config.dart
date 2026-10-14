class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://www.holistique-books.com/api',
  );

  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');

  static const supabasePublishableKey = String.fromEnvironment(
    'SUPABASE_PUBLISHABLE_KEY',
  );

  static const guestPreviewPageLimit = 10;

  static void validate() {
    if (Uri.tryParse(apiBaseUrl)?.isAbsolute != true ||
        Uri.tryParse(supabaseUrl)?.isAbsolute != true ||
        supabasePublishableKey.isEmpty) {
      throw StateError(
        'Configuration manquante. Lancez Flutter avec '
        '--dart-define-from-file=.env.local.json.',
      );
    }
  }
}
