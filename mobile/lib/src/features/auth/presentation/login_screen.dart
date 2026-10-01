import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/network/api_client.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
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
        data: {'email': _email.text.trim(), 'password': _password.text},
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
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Connexion')),
    body: ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Bienvenue sur HolisticBooks', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 28),
        TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
        const SizedBox(height: 14),
        TextField(controller: _password, obscureText: true, decoration: const InputDecoration(labelText: 'Mot de passe')),
        if (_error != null) ...[const SizedBox(height: 12), Text(_error!)],
        const SizedBox(height: 20),
        FilledButton(onPressed: _loading ? null : _login, child: Text(_loading ? 'Connexion...' : 'Se connecter')),
      ],
    ),
  );
}
