import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:holistic_books/src/features/explore/presentation/explore_screen.dart';

void main() {
  testWidgets('Explorer affiche les sections principales', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: ExploreScreen(),
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.text('HolisticBooks'), findsOneWidget);
    expect(find.text('Continuer la lecture'), findsOneWidget);
    expect(find.text('Recommandés pour vous'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('Parcourir par genre'),
      300,
      scrollable: find.byType(Scrollable).first,
    );

    expect(find.text('Parcourir par genre'), findsOneWidget);
  });
}
