import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';
import 'package:holistic_books/src/core/constants/app_dimensions.dart';
import 'package:holistic_books/src/core/widgets/app_button.dart';
import 'package:holistic_books/src/core/widgets/app_logo.dart';
import 'package:holistic_books/src/features/auth/data/auth_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = Supabase.instance.client.auth;
    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: StreamBuilder<AuthState>(
        stream: auth.onAuthStateChange,
        builder: (context, _) => _ProfileContent(
          user: auth.currentUser,
          onSignOut: () async {
            await ref.read(authRepositoryProvider).signOut();
            if (context.mounted) context.go('/');
          },
        ),
      ),
    );
  }
}

class _ProfileContent extends StatelessWidget {
  const _ProfileContent({required this.user, required this.onSignOut});

  final User? user;
  final Future<void> Function() onSignOut;

  @override
  Widget build(BuildContext context) {
    final name = user?.userMetadata?['name'] as String?;
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          maxWidth: AppDimensions.contentMaxWidth,
        ),
        child: ListView(
          padding: const EdgeInsets.all(AppDimensions.horizontalPadding),
          children: [
            const SizedBox(height: 32),
            const Center(child: AppLogo(size: 64)),
            const SizedBox(height: 18),
            Text(
              user == null
                  ? 'HolisticBooks'
                  : (name?.trim().isNotEmpty == true ? name! : 'Mon compte'),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              user?.email ??
                  'Votre compte lecteur centralise vos achats, abonnements, favoris et progression.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.mutedInk, height: 1.45),
            ),
            const SizedBox(height: 28),
            if (user == null) ...[
              AppButton(
                label: 'Se connecter',
                onPressed: () => context.push('/login'),
              ),
              const SizedBox(height: 10),
              AppButton(
                label: 'Créer un compte lecteur',
                variant: AppButtonVariant.light,
                onPressed: () => context.push('/register'),
              ),
            ] else
              AppButton(
                label: 'Se déconnecter',
                variant: AppButtonVariant.light,
                onPressed: onSignOut,
              ),
          ],
        ),
      ),
    );
  }
}
