import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class BookDetailScreen extends StatelessWidget {
  const BookDetailScreen({required this.bookId, super.key});
  final String bookId;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Livre')),
    body: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Icon(Icons.auto_stories_rounded, size: 84),
          const SizedBox(height: 24),
          Text('Fiche livre', style: Theme.of(context).textTheme.headlineMedium),
          const Spacer(),
          FilledButton.icon(
            onPressed: () => context.push('/reader/$bookId'),
            icon: const Icon(Icons.chrome_reader_mode_rounded),
            label: const Text('Lire maintenant'),
          ),
        ],
      ),
    ),
  );
}
