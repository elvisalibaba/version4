import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/config/app_config.dart';
import 'package:holistic_books/src/core/network/api_client.dart';

class ReaderScreen extends ConsumerStatefulWidget {
  const ReaderScreen({required this.bookId, super.key});
  final String bookId;
  @override
  ConsumerState<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends ConsumerState<ReaderScreen> {
  int _page = 1;
  bool _authenticated = false;

  @override
  void initState() { super.initState(); _resolveSession(); }

  Future<void> _resolveSession() async {
    final authenticated = await ref.read(apiClientProvider).isAuthenticated;
    if (mounted) setState(() => _authenticated = authenticated);
  }

  void _nextPage() {
    if (!_authenticated && _page >= AppConfig.guestPreviewPageLimit) {
      _showAccountGate();
      return;
    }
    setState(() => _page++);
  }

  void _showAccountGate() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Les 10 pages gratuites sont terminées.', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            const Text('Créez un compte lecteur gratuit pour continuer le livre complet et synchroniser votre progression.'),
            const SizedBox(height: 20),
            FilledButton(onPressed: () { Navigator.pop(sheetContext); context.push('/login'); }, child: const Text('Créer un compte / Se connecter')),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(_authenticated ? 'Lecture' : 'Aperçu gratuit')),
    body: Center(
      child: Text('Lecteur sécurisé\nLivre ' + widget.bookId + '\nPage ' + _page.toString(), textAlign: TextAlign.center),
    ),
    bottomNavigationBar: SafeArea(
      minimum: const EdgeInsets.all(16),
      child: Row(children: [
        Expanded(child: OutlinedButton(onPressed: _page > 1 ? () => setState(() => _page--) : null, child: const Text('Précédent'))),
        const SizedBox(width: 12),
        Expanded(child: FilledButton(onPressed: _nextPage, child: const Text('Suivant'))),
      ]),
    ),
  );
}
