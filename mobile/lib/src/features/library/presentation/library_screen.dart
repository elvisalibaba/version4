import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';
import 'package:holistic_books/src/core/constants/app_dimensions.dart';
import 'package:holistic_books/src/core/widgets/app_button.dart';

class LibraryScreen extends StatelessWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ma bibliothèque')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: AppDimensions.contentMaxWidth),
          child: Padding(
            padding: const EdgeInsets.all(AppDimensions.horizontalPadding),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const CircleAvatar(
                  radius: 38,
                  backgroundColor: AppColors.softBlue,
                  child: Icon(Icons.local_library_rounded, size: 38, color: AppColors.primary),
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
                  'Connectez-vous pour retrouver vos livres, votre progression et vos futures lectures hors ligne.',
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
      ),
    );
  }
}
