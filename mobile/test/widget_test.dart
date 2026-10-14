import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:holistic_books/src/features/explore/presentation/explore_screen.dart';

void main() {
  testWidgets('the exploration screen renders', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: MaterialApp(home: ExploreScreen())),
    );
    await tester.pump();
    expect(find.text('HolisticBooks'), findsOneWidget);
  });
}
