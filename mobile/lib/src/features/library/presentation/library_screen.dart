import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';
import 'package:holistic_books/src/core/constants/app_dimensions.dart';
import 'package:holistic_books/src/core/widgets/app_button.dart';
import 'package:holistic_books/src/core/widgets/book_cover.dart';
import 'package:holistic_books/src/features/offline/data/offline_library_repository.dart';
import 'package:holistic_books/src/features/offline/domain/offline_book.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class LibraryScreen extends ConsumerWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = Supabase.instance.client.auth.currentUser;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ma bibliothèque'),
        actions: user == null
            ? null
            : [
                IconButton(
                  tooltip: 'Actualiser',
                  onPressed: () => ref.invalidate(offlineBooksProvider),
                  icon: const Icon(Icons.refresh_rounded),
                ),
              ],
      ),
      body: user == null
          ? const _SignedOutLibrary()
          : RefreshIndicator(
              onRefresh: () => ref.refresh(offlineBooksProvider.future),
              child: ref
                  .watch(offlineBooksProvider)
                  .when(
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (_, _) => const _LibraryMessage(
                      icon: Icons.cloud_off_rounded,
                      title: 'Bibliothèque locale indisponible',
                      message: 'Tirez vers le bas pour réessayer.',
                    ),
                    data: (books) => books.isEmpty
                        ? const _LibraryMessage(
                            icon: Icons.download_for_offline_outlined,
                            title: 'Aucun livre téléchargé',
                            message:
                                'Ouvrez un livre puis téléchargez-le pour le lire sans connexion.',
                          )
                        : ListView.separated(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                            itemCount: books.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) =>
                                _OfflineBookCard(book: books[index]),
                          ),
                  ),
            ),
    );
  }
}

class _OfflineBookCard extends ConsumerWidget {
  const _OfflineBookCard({required this.book});

  final OfflineBook book;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expiry =
        '${book.validUntil.day.toString().padLeft(2, '0')}/'
        '${book.validUntil.month.toString().padLeft(2, '0')}/'
        '${book.validUntil.year}';
    return Card(
      elevation: 0,
      color: AppColors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: AppColors.lightButtonBorder),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: book.isExpired
            ? null
            : () => context.push('/reader/${book.bookId}'),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              BookCover(
                imageUrl: book.coverUrl,
                width: 72,
                height: 104,
                borderRadius: 10,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      book.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.ink,
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      book.authorName,
                      style: const TextStyle(color: AppColors.mutedInk),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Icon(
                          book.isExpired
                              ? Icons.schedule_rounded
                              : Icons.offline_pin_rounded,
                          size: 17,
                          color: book.isExpired
                              ? AppColors.warning
                              : AppColors.success,
                        ),
                        const SizedBox(width: 5),
                        Expanded(
                          child: Text(
                            book.isExpired
                                ? 'Licence expirée — reconnectez-vous'
                                : 'Hors ligne jusqu’au $expiry',
                            style: const TextStyle(
                              color: AppColors.mutedInk,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                tooltip: 'Actions',
                onSelected: (value) async {
                  if (value != 'delete') return;
                  await ref
                      .read(offlineLibraryRepositoryProvider)
                      .deleteBook(book);
                  ref.invalidate(offlineBooksProvider);
                },
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'delete', child: Text('Supprimer')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SignedOutLibrary extends StatelessWidget {
  const _SignedOutLibrary();

  @override
  Widget build(BuildContext context) => Center(
    child: ConstrainedBox(
      constraints: const BoxConstraints(
        maxWidth: AppDimensions.contentMaxWidth,
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDimensions.horizontalPadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircleAvatar(
              radius: 38,
              backgroundColor: AppColors.softBlue,
              child: Icon(
                Icons.local_library_rounded,
                size: 38,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Votre bibliothèque vous suit partout',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Connectez-vous pour télécharger vos livres et les lire hors connexion.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.mutedInk, height: 1.45),
            ),
            const SizedBox(height: 24),
            AppButton(
              label: 'Se connecter',
              icon: const Icon(Icons.login_rounded, size: 18),
              onPressed: () => context.push('/login'),
            ),
          ],
        ),
      ),
    ),
  );
}

class _LibraryMessage extends StatelessWidget {
  const _LibraryMessage({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) => ListView(
    physics: const AlwaysScrollableScrollPhysics(),
    padding: const EdgeInsets.all(32),
    children: [
      const SizedBox(height: 120),
      Icon(icon, size: 58, color: AppColors.primary),
      const SizedBox(height: 18),
      Text(
        title,
        textAlign: TextAlign.center,
        style: Theme.of(
          context,
        ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
      ),
      const SizedBox(height: 8),
      Text(
        message,
        textAlign: TextAlign.center,
        style: const TextStyle(color: AppColors.mutedInk, height: 1.45),
      ),
    ],
  );
}
