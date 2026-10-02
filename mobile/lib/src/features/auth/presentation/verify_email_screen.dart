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

class VerifyEmailScreen extends ConsumerStatefulWidget {
  const VerifyEmailScreen({required this.email, super.key});
  final String email;
  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  final _code = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.dio.post<Map<String, dynamic>>(
        '/auth/verify-email',
        data: {
          'email': widget.email,
          'code': _code.text.trim(),
          'device_name': 'HolisticBooks Mobile',
        },
      );
      final token = response.data?['token'] as String?;
      if (token == null || token.isEmpty) throw StateError('Token absent');
      await api.saveToken(token);
      if (mounted) context.go('/');
    } catch (_) {
      if (mounted) setState(() => _error = 'Code invalide ou expiré.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AuthBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(
              AppDimensions.horizontalPadding,
              50,
              AppDimensions.horizontalPadding,
              AppDimensions.bottomPadding,
            ),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: AppDimensions.contentMaxWidth),
                child: Column(
                  children: [
                    const AppLogo(),
                    const SizedBox(height: 24),
                    Text(
                      'Vérifiez votre adresse email',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineLarge,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Nous avons envoyé un code à 6 chiffres à ${widget.email}.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 13, height: 1.4, color: AppColors.mutedInk),
                    ),
                    const SizedBox(height: 30),
                    AppTextField(
                      controller: _code,
                      label: 'Code de vérification',
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      prefixIcon: Icons.verified_user_outlined,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 12)),
                    ],
                    const SizedBox(height: 24),
                    AppButton(label: 'Valider le code', loading: _loading, onPressed: _verify),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
