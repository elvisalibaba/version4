import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';
import 'package:holistic_books/src/core/constants/app_dimensions.dart';
import 'package:holistic_books/src/core/widgets/app_button.dart';
import 'package:holistic_books/src/core/widgets/app_logo.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: AppDimensions.contentMaxWidth),
          child: ListView(
            padding: const EdgeInsets.all(AppDimensions.horizontalPadding),
            children: [
              const SizedBox(height: 32),
              const Center(child: AppLogo(size: 64)),
              const SizedBox(height: 18),
              Text(
                'HolisticBooks',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppColors.ink,
                    ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Votre compte lecteur centralise vos achats, abonnements, favoris et progression.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.mutedInk, height: 1.45),
              ),
              const SizedBox(height: 28),
              AppButton(label: 'Se connecter', onPressed: () => context.push('/login')),
              const SizedBox(height: 10),
              AppButton(
                label: 'Créer un compte lecteur',
                variant: AppButtonVariant.light,
                onPressed: () => context.push('/register'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
