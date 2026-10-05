import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';
import 'package:holistic_books/src/core/network/api_client.dart';
import 'package:holistic_books/src/features/reader/data/reader_repository.dart';

class ReaderScreen extends ConsumerStatefulWidget {
  const ReaderScreen({required this.bookId, super.key});

  final String bookId;

  @override
  ConsumerState<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends ConsumerState<ReaderScreen> {
  final PageController _pageController = PageController();
  final Map<int, Uint8List> _pageCache = <int, Uint8List>{};
  final Set<int> _loadingPages = <int>{};

  ReaderBootstrap? _bootstrap;
  bool _loading = true;
  String? _error;
  int _page = 1;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final api = ref.read(apiClientProvider);
      final authenticated = await api.isAuthenticated;
      final bootstrap = await ref.read(readerRepositoryProvider).prepare(
        bookId: widget.bookId,
        authenticated: authenticated,
      );

      if (!mounted) return;

      setState(() {
        _bootstrap = bootstrap;
        _loading = false;
      });

      await _loadPage(1);
      if (bootstrap.pageCount > 1) {
        await _loadPage(2);
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Impossible d’ouvrir ce livre dans le lecteur sécurisé.';
        });
      }
    }
  }

  Future<void> _loadPage(int page) async {
    final bootstrap = _bootstrap;
    if (bootstrap == null || page < 1 || page > bootstrap.pageCount) return;
    if (_pageCache.containsKey(page) || _loadingPages.contains(page)) return;

    setState(() => _loadingPages.add(page));

    try {
      final bytes = await ref.read(readerRepositoryProvider).fetchPage(
        bookId: widget.bookId,
        page: page,
        bootstrap: bootstrap,
      );

      if (!mounted) return;
      setState(() => _pageCache[page] = bytes);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'La page $page ne peut pas être affichée.');
    } finally {
      if (mounted) {
        setState(() => _loadingPages.remove(page));
      }
    }
  }

  void _handlePageChanged(int index) {
    final page = index + 1;
    setState(() => _page = page);
    _loadPage(page);
    _loadPage(page + 1);
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
            Text(
              'Aperçu terminé',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Créez un compte lecteur pour continuer et synchroniser votre progression.',
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () {
                Navigator.pop(sheetContext);
                context.push('/register');
              },
              child: const Text('Créer un compte'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(sheetContext);
                context.push('/login');
              },
              child: const Text('J’ai déjà un compte'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bootstrap = _bootstrap;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.white,
        title: Text(
          bootstrap?.authenticated == false ? 'Aperçu sécurisé' : 'Lecture sécurisée',
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                bootstrap == null ? 'Page $_page' : '$_page / ${bootstrap.pageCount}',
              ),
            ),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(_error!, textAlign: TextAlign.center),
                  ),
                )
              : bootstrap == null
                  ? const Center(child: Text('Lecteur indisponible'))
                  : Stack(
                      children: [
                        PageView.builder(
                          controller: _pageController,
                          itemCount: bootstrap.pageCount,
                          onPageChanged: _handlePageChanged,
                          itemBuilder: (context, index) {
                            final page = index + 1;
                            final bytes = _pageCache[page];

                            if (bytes == null) {
                              _loadPage(page);
                              return const Center(child: CircularProgressIndicator());
                            }

                            return Container(
                              color: const Color(0xFF2B211B),
                              padding: const EdgeInsets.all(12),
                              child: Center(
                                child: Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    InteractiveViewer(
                                      minScale: 0.8,
                                      maxScale: 4,
                                      child: Image.memory(
                                        bytes,
                                        fit: BoxFit.contain,
                                        gaplessPlayback: true,
                                        filterQuality: FilterQuality.medium,
                                      ),
                                    ),
                                    IgnorePointer(
                                      child: Transform.rotate(
                                        angle: -0.45,
                                        child: Text(
                                          bootstrap.authenticated
                                              ? 'HOLISTIQUE BOOKS • LECTURE PROTÉGÉE'
                                              : 'HOLISTIQUE BOOKS • APERÇU',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w900,
                                            fontSize: 18,
                                            letterSpacing: 2,
                                            color: Color(0x22111827),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                        if (!bootstrap.authenticated)
                          Positioned(
                            left: 16,
                            right: 16,
                            bottom: 16,
                            child: SafeArea(
                              child: Card(
                                color: AppColors.white,
                                child: InkWell(
                                  onTap: _showAccountGate,
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 12,
                                    ),
                                    child: Text(
                                      'Aperçu protégé. Le fichier source ne quitte pas Holistique Books. Touchez ici pour créer un compte.',
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
    );
  }
}
