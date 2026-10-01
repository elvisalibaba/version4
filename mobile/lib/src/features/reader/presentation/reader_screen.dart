import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/config/app_config.dart';
import 'package:holistic_books/src/core/network/api_client.dart';
import 'package:holistic_books/src/features/reader/data/reader_repository.dart';
import 'package:pdfx/pdfx.dart';

class ReaderScreen extends ConsumerStatefulWidget {
  const ReaderScreen({required this.bookId, super.key});
  final String bookId;
  @override
  ConsumerState<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends ConsumerState<ReaderScreen> {
  PdfControllerPinch? _controller;
  bool _authenticated = false;
  bool _loading = true;
  String? _error;
  int _page = 1;
  int _pageCount = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final api = ref.read(apiClientProvider);
      final authenticated = await api.isAuthenticated;
      final Uint8List bytes = await ref.read(readerRepositoryProvider).fetchPdf(
        bookId: widget.bookId,
        authenticated: authenticated,
      );
      if (bytes.isEmpty) throw StateError('Fichier vide');
      final controller = PdfControllerPinch(document: PdfDocument.openData(bytes));
      if (!mounted) { controller.dispose(); return; }
      setState(() {
        _authenticated = authenticated;
        _controller = controller;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() { _loading = false; _error = 'Impossible d’ouvrir ce livre.'; });
    }
  }

  void _handlePageChanged(int page) {
    if (!_authenticated && page > AppConfig.guestPreviewPageLimit) {
      _controller?.jumpToPage(AppConfig.guestPreviewPageLimit);
      _showAccountGate();
      return;
    }
    setState(() => _page = page);
  }

  void _showAccountGate() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isDismissible: true,
      builder: (sheetContext) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Aperçu terminé', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 10),
            const Text('Vous avez lu les 10 pages gratuites. Créez un compte lecteur gratuit pour continuer et synchroniser votre progression.'),
            const SizedBox(height: 20),
            FilledButton(onPressed: () { Navigator.pop(sheetContext); context.push('/login'); }, child: const Text('Créer un compte / Se connecter')),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    return Scaffold(
      appBar: AppBar(title: Text(_authenticated ? 'Lecture' : 'Aperçu gratuit'), actions: [Padding(padding: const EdgeInsets.only(right: 16), child: Center(child: Text(_pageCount > 0 ? '$_page / $_pageCount' : 'Page $_page')))]),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_error!, textAlign: TextAlign.center)))
              : controller == null
                  ? const Center(child: Text('Lecteur indisponible'))
                  : Stack(
                      children: [
                        PdfViewPinch(
                          controller: controller,
                          scrollDirection: Axis.vertical,
                          onPageChanged: _handlePageChanged,
                          onDocumentLoaded: (document) => setState(() => _pageCount = document.pagesCount),
                          onDocumentError: (_) => setState(() => _error = 'Le PDF ne peut pas être affiché.'),
                        ),
                        if (!_authenticated)
                          Positioned(
                            left: 16, right: 16, bottom: 16,
                            child: SafeArea(
                              child: Card(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  child: Text('Aperçu invité : pages 1 à 10. Créez un compte pour lire la suite.', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
    );
  }
}
