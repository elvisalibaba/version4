import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';
import 'package:holistic_books/src/core/widgets/app_button.dart';
import 'package:holistic_books/src/features/books/domain/book.dart';
import 'package:holistic_books/src/features/offline/data/offline_library_repository.dart';
import 'package:holistic_books/src/features/offline/domain/offline_book.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class OfflineDownloadButton extends ConsumerStatefulWidget {
  const OfflineDownloadButton({required this.book, super.key});

  final Book book;

  @override
  ConsumerState<OfflineDownloadButton> createState() =>
      _OfflineDownloadButtonState();
}

class _OfflineDownloadButtonState extends ConsumerState<OfflineDownloadButton> {
  OfflineBook? _offlineBook;
  bool _checking = true;
  bool _downloading = false;
  double _progress = 0;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    final book = await ref
        .read(offlineLibraryRepositoryProvider)
        .getBook(widget.book.id);
    if (mounted) {
      setState(() {
        _offlineBook = book;
        _checking = false;
      });
    }
  }

  Future<void> _download() async {
    if (Supabase.instance.client.auth.currentUser == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Connectez-vous pour télécharger ce livre.'),
        ),
      );
      return;
    }
    setState(() {
      _downloading = true;
      _progress = 0;
    });
    try {
      final book = await ref
          .read(offlineLibraryRepositoryProvider)
          .downloadBook(
            widget.book,
            onProgress: (value) {
              if (mounted) setState(() => _progress = value);
            },
          );
      if (!mounted) return;
      setState(() => _offlineBook = book);
      ref.invalidate(offlineBooksProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Livre disponible hors connexion.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(_friendlyError(error))));
    } finally {
      if (mounted) setState(() => _downloading = false);
    }
  }

  Future<void> _delete() async {
    final book = _offlineBook;
    if (book == null) return;
    await ref.read(offlineLibraryRepositoryProvider).deleteBook(book);
    if (!mounted) return;
    setState(() => _offlineBook = null);
    ref.invalidate(offlineBooksProvider);
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(12),
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    }

    if (_offlineBook != null) {
      return AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: Column(
          key: const ValueKey('downloaded'),
          children: [
            DecoratedBox(
              decoration: BoxDecoration(
                color: AppColors.softBlue,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.offline_pin_rounded, color: AppColors.primary),
                    SizedBox(width: 9),
                    Flexible(
                      child: Text(
                        'Disponible hors connexion',
                        style: TextStyle(
                          color: AppColors.primaryDark,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            TextButton.icon(
              onPressed: _delete,
              icon: const Icon(Icons.delete_outline_rounded, size: 18),
              label: const Text('Supprimer le téléchargement'),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        AppButton(
          label: _downloading
              ? 'Téléchargement ${(_progress * 100).round()} %'
              : 'Télécharger pour lire hors connexion',
          icon: const Icon(Icons.download_for_offline_outlined, size: 19),
          variant: AppButtonVariant.light,
          loading: _downloading,
          onPressed: _download,
        ),
        if (_downloading) ...[
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(value: _progress),
          ),
        ],
      ],
    );
  }

  String _friendlyError(Object error) {
    final message = error.toString();
    if (message.contains('Accès à ce livre refusé')) {
      return 'Ce livre doit d’abord être ajouté ou acheté dans votre bibliothèque.';
    }
    if (message.contains('SocketException') || message.contains('connection')) {
      return 'Connexion indisponible. Réessayez lorsque vous serez en ligne.';
    }
    return 'Téléchargement impossible pour le moment.';
  }
}
