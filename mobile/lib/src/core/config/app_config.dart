class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.aba.cd/api/v1',
  );

  static const guestPreviewPageLimit = 10;
}
