import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/constants/app_colors.dart';
import 'package:holistic_books/src/core/constants/app_dimensions.dart';
import 'package:holistic_books/src/core/network/api_client.dart';
import 'package:holistic_books/src/core/widgets/app_button.dart';
import 'package:holistic_books/src/core/widgets/app_logo.dart';
import 'package:holistic_books/src/core/widgets/app_text_field.dart';
import 'package:holistic_books/src/core/widgets/auth_background.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  bool _showPassword = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {
          'email': _email.text.trim(),
          'password': _password.text,
          'device_name': 'HolisticBooks Mobile',
        },
      );
      final directToken = response.data?['token'] as String?;
      final data = response.data?['data'] as Map<String, dynamic>?;
      final token = directToken ?? data?['token'] as String?;
      if (token == null || token.isEmpty) throw StateError('Token absent');
      await api.saveToken(token);
      if (mounted) context.go('/');
    } catch (_) {
      if (mounted) setState(() => _error = 'Connexion impossible. Vérifiez vos identifiants.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AuthBackground(
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(
                  AppDimensions.horizontalPadding,
                  36,
                  AppDimensions.horizontalPadding,
                  AppDimensions.bottomPadding,
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: AppDimensions.contentMaxWidth),
                    child: Column(
                      children: [
                        Align(
                          alignment: Alignment.centerLeft,
                          child: IconButton(
                            tooltip: 'Retour',
                            onPressed: () => context.pop(),
                            icon: const Icon(Icons.arrow_back_rounded),
                          ),
                        ),
                        const SizedBox(height: 18),
                        const AppLogo(),
                        const SizedBox(height: 22),
                        Text(
                          'Bienvenue sur HolisticBooks',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.headlineLarge,
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Connectez-vous pour reprendre votre lecture, vos favoris et votre bibliothèque.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 13, height: 1.4, color: AppColors.mutedInk),
                        ),
                        const SizedBox(height: 30),
                        AppTextField(
                          controller: _email,
                          label: 'Adresse email',
                          keyboardType: TextInputType.emailAddress,
                          prefixIcon: Icons.mail_outline_rounded,
                        ),
                        const SizedBox(height: AppDimensions.fieldGap),
                        AppTextField(
                          controller: _password,
                          label: 'Mot de passe',
                          obscureText: !_showPassword,
                          prefixIcon: Icons.lock_outline_rounded,
                          suffixIcon: IconButton(
                            tooltip: _showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe',
                            onPressed: () => setState(() => _showPassword = !_showPassword),
                            icon: Icon(_showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                          ),
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            _error!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: AppColors.danger, fontSize: 12),
                          ),
                        ],
                        const SizedBox(height: 24),
                        AppButton(
                          label: 'Se connecter',
                          loading: _loading,
                          onPressed: _login,
                        ),
                        const SizedBox(height: 12),
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
            },
          ),
        ),
      ),
    );
  }
}
