import 'dart:convert';
import 'dart:developer' as developer;
import 'dart:io';

import 'package:path_provider/path_provider.dart';

/// Dernier catalogue reçu du serveur, conservé pour l'affichage hors ligne.
/// Données publiques uniquement (aucun champ propre à l'utilisateur).
class CachedCatalogue {
  const CachedCatalogue({required this.rows, required this.savedAt});

  final List<Map<String, dynamic>> rows;
  final DateTime savedAt;
}

class CatalogueCache {
  static const _fileName = 'catalogue_cache_v1.json';

  Future<File> _file() async {
    final directory = await getApplicationSupportDirectory();
    return File('${directory.path}/$_fileName');
  }

  Future<void> save(List<Map<String, dynamic>> rows) async {
    try {
      final file = await _file();
      final payload = jsonEncode({
        'saved_at': DateTime.now().toUtc().toIso8601String(),
        'rows': rows,
      });
      // Écriture atomique : fichier temporaire puis renommage.
      final temp = File('${file.path}.tmp');
      await temp.writeAsString(payload, flush: true);
      await temp.rename(file.path);
    } catch (error, stackTrace) {
      developer.log(
        'Écriture du cache catalogue impossible',
        error: error,
        stackTrace: stackTrace,
        name: 'catalogue',
      );
    }
  }

  Future<CachedCatalogue?> load() async {
    try {
      final file = await _file();
      if (!await file.exists()) return null;
      final decoded = jsonDecode(await file.readAsString());
      if (decoded is! Map<String, dynamic>) return null;
      final rows = (decoded['rows'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .toList(growable: false);
      final savedAt = DateTime.tryParse(decoded['saved_at'] as String? ?? '');
      if (rows.isEmpty || savedAt == null) return null;
      return CachedCatalogue(rows: rows, savedAt: savedAt.toLocal());
    } catch (error, stackTrace) {
      developer.log(
        'Lecture du cache catalogue impossible',
        error: error,
        stackTrace: stackTrace,
        name: 'catalogue',
      );
      return null;
    }
  }
}
