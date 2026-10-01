import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';
import 'package:holistic_books/src/core/constants/app_dimensions.dart';
import 'package:holistic_books/src/core/widgets/app_button.dart';

class BookDetailScreen extends StatelessWidget {
  const BookDetailScreen({required this.bookId, super.key});
  final String bookId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Détails du livre'),
        leading: IconButton(
          tooltip: 'Retour',
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_rounded),
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: AppDimensions.contentMaxWidth),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(
              AppDimensions.horizontalPadding,
              20,
              AppDimensions.horizontalPadding,
              AppDimensions.bottomPadding,
            ),
            children: [
              Center(
                child: Container(
                  width: 180,
                  height: 250,
                  decoration: BoxDecoration(
                    color: AppColors.softBlue,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFDCEAF7)),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(
                    Icons.auto_stories_rounded,
                    size: 68,
                    color: AppColors.primary,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Votre lecture HolisticBooks',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              const Text(
                'Consultez ce titre dans le lecteur sécurisé. Les visiteurs disposent d’un aperçu de 10 pages avant création de compte.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.45,
                  color: AppColors.mutedInk,
                ),
              ),
              const SizedBox(height: 28),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE9E9ED)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.shield_outlined, color: AppColors.primary),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Lecture sécurisée, progression synchronisée après connexion.',
                        style: TextStyle(
                          fontSize: 12,
                          height: 1.4,
                          color: AppColors.mutedInk,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              AppButton(
                label: 'Lire maintenant',
                icon: const Icon(Icons.chrome_reader_mode_rounded, size: 18),
                onPressed: () => context.push('/reader/$bookId'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
