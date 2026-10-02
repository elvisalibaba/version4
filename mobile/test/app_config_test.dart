import 'package:flutter_test/flutter_test.dart';
import 'package:holistic_books/src/core/config/app_config.dart';

void main() {
  test('guest preview is limited to ten pages', () {
    expect(AppConfig.guestPreviewPageLimit, 10);
  });
}
