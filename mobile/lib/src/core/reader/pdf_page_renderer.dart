import 'dart:typed_data';

import 'package:pdfx/pdfx.dart';

Future<Uint8List> renderProtectedPage(Uint8List bytes) async {
  final isPdf =
      bytes.length >= 4 &&
      bytes[0] == 0x25 &&
      bytes[1] == 0x50 &&
      bytes[2] == 0x44 &&
      bytes[3] == 0x46;
  if (!isPdf) return bytes;

  final document = await PdfDocument.openData(bytes);
  PdfPage? page;
  try {
    page = await document.getPage(1);
    const width = 1600.0;
    final image = await page.render(
      width: width,
      height: width * page.height / page.width,
      format: PdfPageImageFormat.png,
      backgroundColor: '#FFFFFF',
    );
    if (image == null || image.bytes.isEmpty) {
      throw StateError('Rendu de la page PDF impossible');
    }
    return image.bytes;
  } finally {
    await page?.close();
    await document.close();
  }
}
