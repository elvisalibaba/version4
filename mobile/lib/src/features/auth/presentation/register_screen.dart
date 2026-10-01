import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:holistic_books/src/core/network/api_client.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose(); _email.dispose(); _password.dispose(); super.dispose();
  }

  Future<void> _register() async {
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(apiClientProvider).dio.post<Map<String, dynamic>>(
        '/auth/register',
        data: {
          'name': _name.text.trim(),
          'email': _email.text.trim(),
          'password': _password.text,
          'password_confirmation': _password.text,
          'role': 'reader',
          'preferred_language': 'fr',
        },
      );
      if (!mounted) return;
      context.go('/verify-email?email=' + Uri.encodeComponent(_email.text.trim()));
    } catch (_) {
      if (mounted) setState(() => _error = 'Création du compte impossible. Vérifiez les informations saisies.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Créer un compte')),
    body: ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Compte lecteur gratuit', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 8),
        const Text('Créez votre compte pour poursuivre la lecture après les 10 pages d’aperçu.'),
        const SizedBox(height: 24),
        TextField(controller: _name, decoration: const InputDecoration(labelText: 'Nom complet')),
        const SizedBox(height: 14),
        TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
        const SizedBox(height: 14),
        TextField(controller: _password, obscureText: true, decoration: const InputDecoration(labelText: 'Mot de passe (8 caractères minimum)')),
        if (_error != null) ...[const SizedBox(height: 12), Text(_error!)],
        const SizedBox(height: 20),
        FilledButton(onPressed: _loading ? null : _register, child: Text(_loading ? 'Création...' : 'Créer mon compte')),
      ],
    ),
  );
}
