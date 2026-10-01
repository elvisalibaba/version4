import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/network/api_client.dart';

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
  void dispose() { _code.dispose(); super.dispose(); }

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
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Vérifier votre email')),
    body: ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Code de vérification', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text('Un code à 6 chiffres a été envoyé à ' + widget.email + '.'),
        const SizedBox(height: 24),
        TextField(controller: _code, keyboardType: TextInputType.number, maxLength: 6, decoration: const InputDecoration(labelText: 'Code OTP')),
        if (_error != null) Text(_error!),
        const SizedBox(height: 16),
        FilledButton(onPressed: _loading ? null : _verify, child: Text(_loading ? 'Vérification...' : 'Valider le code')),
      ],
    ),
  );
}
