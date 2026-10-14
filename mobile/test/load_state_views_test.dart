import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:holistic_books/src/core/widgets/load_state_views.dart';

void main() {
  testWidgets(
    'erreur de chargement : message français, aucun détail technique, bouton Réessayer',
    (tester) async {
      var retries = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: LoadErrorView(onRetry: () => retries++)),
        ),
      );

      expect(
        find.text(
          'Impossible de charger le catalogue. Vérifiez votre connexion.',
        ),
        findsOneWidget,
      );
      expect(find.textContaining('DioException'), findsNothing);
      expect(find.textContaining('404'), findsNothing);

      await tester.tap(find.text('Réessayer'));
      expect(retries, 1);
    },
  );

  testWidgets(
    'bandeau hors connexion : date du catalogue en cache et relance',
    (tester) async {
      var retries = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OfflineCatalogueBanner(
              cachedAt: DateTime(2026, 10, 14, 9, 5),
              onRetry: () => retries++,
            ),
          ),
        ),
      );

      expect(
        find.text('Hors connexion — catalogue du 14/10/2026 à 09 h 05.'),
        findsOneWidget,
      );
      await tester.tap(find.text('Réessayer'));
      expect(retries, 1);
    },
  );
}
