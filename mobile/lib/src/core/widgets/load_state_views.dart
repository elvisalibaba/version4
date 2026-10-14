import 'package:flutter/material.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';

/// Erreur de chargement présentée en français simple, avec une action pour réessayer.
/// Le détail technique (exception, code HTTP) n'est jamais affiché : il reste dans les journaux.
class LoadErrorView extends StatelessWidget {
  const LoadErrorView({
    super.key,
    required this.onRetry,
    this.message =
        'Impossible de charger le catalogue. Vérifiez votre connexion.',
  });

  final VoidCallback onRetry;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 34, horizontal: 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.wifi_off_rounded,
            size: 36,
            color: AppColors.mutedInk,
          ),
          const SizedBox(height: 12),
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodyLarge?.copyWith(color: AppColors.ink),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Réessayer'),
          ),
        ],
      ),
    );
  }
}

/// Bandeau discret quand le catalogue affiché vient du cache (hors connexion).
class OfflineCatalogueBanner extends StatelessWidget {
  const OfflineCatalogueBanner({
    super.key,
    required this.cachedAt,
    required this.onRetry,
  });

  final DateTime cachedAt;
  final VoidCallback onRetry;

  String _formatDate(DateTime date) {
    String two(int value) => value.toString().padLeft(2, '0');
    return '${two(date.day)}/${two(date.month)}/${date.year} à ${two(date.hour)} h ${two(date.minute)}';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.fromLTRB(14, 10, 6, 10),
      decoration: BoxDecoration(
        color: AppColors.softBlue,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.cloud_off_rounded,
            size: 20,
            color: AppColors.mutedInk,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Hors connexion — catalogue du ${_formatDate(cachedAt)}.',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.ink),
            ),
          ),
          TextButton(onPressed: onRetry, child: const Text('Réessayer')),
        ],
      ),
    );
  }
}
