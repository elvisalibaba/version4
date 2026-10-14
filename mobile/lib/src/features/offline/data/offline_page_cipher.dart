import 'dart:convert';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';

class OfflinePageCipher {
  const OfflinePageCipher();

  static const _magic = 'HBK1';

  Future<Uint8List> encrypt(Uint8List bytes, String licenseToken) async {
    final algorithm = AesGcm.with256bits();
    final secretBox = await algorithm.encrypt(
      bytes,
      secretKey: await _keyFromToken(licenseToken),
    );
    final output = BytesBuilder(copy: false)
      ..add(ascii.encode(_magic))
      ..add([secretBox.nonce.length, secretBox.mac.bytes.length])
      ..add(secretBox.nonce)
      ..add(secretBox.mac.bytes)
      ..add(secretBox.cipherText);
    return output.takeBytes();
  }

  Future<Uint8List> decrypt(Uint8List payload, String licenseToken) async {
    if (payload.length < 7 || ascii.decode(payload.sublist(0, 4)) != _magic) {
      throw const FormatException('Page hors ligne invalide');
    }
    final nonceLength = payload[4];
    final macLength = payload[5];
    final headerLength = 6 + nonceLength + macLength;
    if (nonceLength < 1 || macLength < 1 || payload.length <= headerLength) {
      throw const FormatException('Page hors ligne incomplète');
    }

    final nonce = payload.sublist(6, 6 + nonceLength);
    final macStart = 6 + nonceLength;
    final cipherText = payload.sublist(headerLength);
    final clear = await AesGcm.with256bits().decrypt(
      SecretBox(
        cipherText,
        nonce: nonce,
        mac: Mac(payload.sublist(macStart, headerLength)),
      ),
      secretKey: await _keyFromToken(licenseToken),
    );
    return Uint8List.fromList(clear);
  }

  Future<SecretKey> _keyFromToken(String token) async {
    if (token.length < 32) throw StateError('Licence hors ligne invalide');
    final hash = await Sha256().hash(utf8.encode(token));
    return SecretKey(hash.bytes);
  }
}
