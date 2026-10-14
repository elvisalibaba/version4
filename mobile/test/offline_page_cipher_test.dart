import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:holistic_books/src/features/offline/data/offline_page_cipher.dart';

void main() {
  const cipher = OfflinePageCipher();
  const token =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  test('encrypts and decrypts an offline page', () async {
    final clear = Uint8List.fromList(
      List<int>.generate(2048, (index) => index % 251),
    );
    final encrypted = await cipher.encrypt(clear, token);

    expect(encrypted, isNot(equals(clear)));
    expect(await cipher.decrypt(encrypted, token), equals(clear));
  });

  test('rejects a modified encrypted page', () async {
    final encrypted = await cipher.encrypt(
      Uint8List.fromList([1, 2, 3]),
      token,
    );
    encrypted[encrypted.length - 1] ^= 1;

    expect(() => cipher.decrypt(encrypted, token), throwsA(isA<Object>()));
  });
}
